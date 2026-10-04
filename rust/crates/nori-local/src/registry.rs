//! Per-user worlds and connected sockets (Python `WorldManager` +
//! `WorldSession.clients` / `media_clients`).

use axum::extract::ws::Message;
use nori_core::live_pack::LivePack;
use nori_core::tasks::Pacing;
use nori_core::world::World;
use std::collections::HashMap;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, Mutex, MutexGuard};
use tokio::sync::mpsc::UnboundedSender;

pub type Outgoing = UnboundedSender<Message>;

#[derive(Clone)]
struct Client {
    id: u64,
    tx: Outgoing,
}

#[derive(Clone)]
struct MediaClient {
    id: u64,
    world_id: String,
    tx: Outgoing,
}

/// One user's world plus the sockets attached to it.
pub struct UserSlot {
    world: Mutex<World>,
    main: Mutex<Vec<Client>>,
    media: Mutex<Vec<MediaClient>>,
}

fn lock<T>(mutex: &Mutex<T>) -> MutexGuard<'_, T> {
    mutex.lock().unwrap_or_else(|e| e.into_inner())
}

impl UserSlot {
    /// Exclusive access to the world. Never hold it across an `.await`.
    pub fn world(&self) -> MutexGuard<'_, World> {
        lock(&self.world)
    }

    pub fn add_main(&self, id: u64, tx: Outgoing) {
        lock(&self.main).push(Client { id, tx });
    }

    pub fn add_media(&self, id: u64, world_id: String, tx: Outgoing) {
        lock(&self.media).push(MediaClient { id, world_id, tx });
    }

    pub fn remove(&self, id: u64) {
        lock(&self.main).retain(|c| c.id != id);
        lock(&self.media).retain(|c| c.id != id);
    }

    /// Encode once, send to every main socket; drop sockets that went away.
    pub fn broadcast(&self, messages: &[serde_json::Value]) {
        if messages.is_empty() {
            return;
        }
        let frames: Vec<String> = messages.iter().map(nori_core::protocol::ws_text).collect();
        lock(&self.main).retain(|client| frames.iter().all(|frame| client.tx.send(Message::Text(frame.clone().into())).is_ok()));
    }

    /// Binary media frame to the media sockets opened for the current world.
    pub fn broadcast_media(&self, frame: Vec<u8>) {
        let world_id = self.world().world_id.clone();
        let bytes = axum::body::Bytes::from(frame);
        lock(&self.media).retain(|client| client.world_id != world_id || client.tx.send(Message::Binary(bytes.clone())).is_ok());
    }
}

pub struct Registry {
    users: Mutex<HashMap<String, Arc<UserSlot>>>,
    pack: Arc<LivePack>,
    next_socket: AtomicU64,
}

impl Registry {
    pub fn new(pack: Arc<LivePack>) -> Self {
        Self { users: Mutex::new(HashMap::new()), pack, next_socket: AtomicU64::new(1) }
    }

    pub fn pack(&self) -> &Arc<LivePack> {
        &self.pack
    }

    pub fn socket_id(&self) -> u64 {
        self.next_socket.fetch_add(1, Ordering::Relaxed)
    }

    /// Python `WorldManager.get_world(user_id)`: create on first use.
    pub fn slot(&self, user_id: &str) -> Arc<UserSlot> {
        let mut users = lock(&self.users);
        users
            .entry(user_id.to_string())
            .or_insert_with(|| {
                let world = World::new(user_id, None, true, self.pack.clone()).with_pacing(Pacing::Local);
                Arc::new(UserSlot { world: Mutex::new(world), main: Mutex::new(Vec::new()), media: Mutex::new(Vec::new()) })
            })
            .clone()
    }

    /// Python `WorldManager.world_for_grant`: only the user's current world.
    pub fn slot_for_grant(&self, user_id: &str, grant: &str) -> Option<Arc<UserSlot>> {
        let slot = lock(&self.users).get(user_id).cloned()?;
        let valid = slot.world().has_media_grant(grant);
        valid.then_some(slot)
    }
}

//! Per-user worlds and connected sockets (Python `WorldManager` +
//! `WorldSession.clients` / `media_clients`).

use axum::extract::ws::Message;
use nori_core::live_pack::LivePack;
use nori_core::tasks::Pacing;
use nori_core::world::World;
use std::collections::{HashMap, VecDeque};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, Mutex, MutexGuard};
use tokio::sync::{mpsc, watch};

pub const OUTGOING_CAPACITY: usize = 256;
// Prevent one socket from occupying multiple provider slots.
const MAX_SOCKET_PROVIDER_REQUESTS: usize = 1;

#[derive(Clone)]
pub struct Outgoing {
    tx: mpsc::Sender<Message>,
    overflow: watch::Sender<bool>,
    pub(crate) provider_gate: Arc<tokio::sync::Semaphore>,
}

impl Outgoing {
    pub fn channel() -> (Self, mpsc::Receiver<Message>, watch::Receiver<bool>) {
        let (tx, rx) = mpsc::channel(OUTGOING_CAPACITY);
        let (overflow, signal) = watch::channel(false);
        (
            Self {
                tx,
                overflow,
                provider_gate: Arc::new(tokio::sync::Semaphore::new(MAX_SOCKET_PROVIDER_REQUESTS)),
            },
            rx,
            signal,
        )
    }

    pub fn overflow(&self) -> watch::Receiver<bool> {
        self.overflow.subscribe()
    }

    pub fn send(&self, message: Message) -> Result<(), mpsc::error::TrySendError<Message>> {
        let result = self.tx.try_send(message);
        if matches!(result, Err(mpsc::error::TrySendError::Full(_))) {
            self.overflow.send_replace(true);
        }
        result
    }
}

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
        lock(&self.main).retain(|client| {
            frames
                .iter()
                .all(|frame| client.tx.send(Message::Text(frame.clone().into())).is_ok())
        });
    }

    /// Binary media frame to the media sockets opened for the current world.
    pub fn broadcast_media(&self, frame: Vec<u8>) {
        let world_id = self.world().world_id.clone();
        let bytes = axum::body::Bytes::from(frame);
        lock(&self.media).retain(|client| {
            client.world_id != world_id || client.tx.send(Message::Binary(bytes.clone())).is_ok()
        });
    }
}

const MAX_IDLE_SLOTS: usize = 32;

pub struct Registry {
    users: Mutex<HashMap<String, Arc<UserSlot>>>,
    idle: Mutex<VecDeque<(String, Arc<UserSlot>)>>,
    pack: Arc<LivePack>,
    next_socket: AtomicU64,
}

impl Registry {
    pub fn new(pack: Arc<LivePack>) -> Self {
        Self {
            users: Mutex::new(HashMap::new()),
            idle: Mutex::new(VecDeque::new()),
            pack,
            next_socket: AtomicU64::new(1),
        }
    }

    pub fn pack(&self) -> &Arc<LivePack> {
        &self.pack
    }

    pub fn socket_id(&self) -> u64 {
        self.next_socket.fetch_add(1, Ordering::Relaxed)
    }

    /// Python `WorldManager.get_world(user_id)`: create on first use.
    pub fn add_main(&self, user_id: &str, id: u64, tx: Outgoing) -> Arc<UserSlot> {
        let mut users = lock(&self.users);
        let slot = users
            .entry(user_id.to_string())
            .or_insert_with(|| {
                let mut idle = lock(&self.idle);
                if let Some(index) = idle.iter().position(|(user, _)| user == user_id) {
                    return idle.remove(index).expect("idle index").1;
                }
                let world =
                    World::new(user_id, None, true, self.pack.clone()).with_pacing(Pacing::Local);
                Arc::new(UserSlot {
                    world: Mutex::new(world),
                    main: Mutex::new(Vec::new()),
                    media: Mutex::new(Vec::new()),
                })
            })
            .clone();
        slot.add_main(id, tx);
        slot
    }

    pub fn remove(&self, user_id: &str, id: u64) {
        let mut users = lock(&self.users);
        if let Some(slot) = users.get(user_id) {
            slot.remove(id);
            if lock(&slot.main).is_empty() && lock(&slot.media).is_empty() {
                let slot = users.remove(user_id).expect("registered slot");
                // Reconnects need their world/settings, so retain only a small
                // least-recently-disconnected cache, not every guest forever.
                let mut idle = lock(&self.idle);
                idle.push_back((user_id.to_string(), slot));
                if idle.len() > MAX_IDLE_SLOTS {
                    idle.pop_front();
                }
            }
        }
    }

    /// Python `WorldManager.world_for_grant`: only the user's current world.
    pub fn add_media(
        &self,
        user_id: &str,
        grant: &str,
        id: u64,
        tx: Outgoing,
    ) -> Option<Arc<UserSlot>> {
        let mut users = lock(&self.users);
        let mut idle = lock(&self.idle);
        let idle_index = idle.iter().position(|(user, _)| user == user_id);
        let slot = users
            .get(user_id)
            .cloned()
            .or_else(|| idle_index.map(|index| idle[index].1.clone()))?;
        let valid = slot.world().has_media_grant(grant);
        if !valid {
            return None;
        }
        if let Some(index) = idle_index {
            idle.remove(index);
            users.insert(user_id.to_string(), slot.clone());
        }
        let world_id = slot.world().world_id.clone();
        slot.add_media(id, world_id, tx);
        Some(slot)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn full_outgoing_queue_signals_close_without_growing() {
        let (tx, mut rx, overflow) = Outgoing::channel();
        for _ in 0..OUTGOING_CAPACITY {
            tx.send(Message::Text("frame".into())).unwrap();
        }
        assert!(matches!(
            tx.send(Message::Text("dropped".into())),
            Err(mpsc::error::TrySendError::Full(_))
        ));
        assert!(*overflow.borrow());
        assert_eq!(rx.len(), OUTGOING_CAPACITY);
        for _ in 0..OUTGOING_CAPACITY {
            assert!(rx.try_recv().is_ok());
        }
        assert!(rx.try_recv().is_err());
    }

    #[test]
    fn disconnect_releases_active_slot_but_bounds_reconnect_worlds() {
        let registry = Registry::new(Arc::new(LivePack::empty()));
        let (tx, _rx, _overflow) = Outgoing::channel();
        let slot = registry.add_main("guest", 1, tx.clone());
        slot.add_media(2, slot.world().world_id.clone(), tx.clone());
        registry.remove("guest", 1);
        assert!(lock(&registry.users).contains_key("guest"));
        registry.remove("guest", 2);
        assert!(!lock(&registry.users).contains_key("guest"));
        let reconnected = registry.add_main("guest", 3, tx.clone());
        assert!(Arc::ptr_eq(&slot, &reconnected));
        registry.remove("guest", 3);
        for index in 0..MAX_IDLE_SLOTS {
            let user = format!("guest-{index}");
            registry.add_main(&user, 4, tx.clone());
            registry.remove(&user, 4);
        }
        assert!(lock(&registry.users).is_empty());
        assert_eq!(lock(&registry.idle).len(), MAX_IDLE_SLOTS);
        let replaced = registry.add_main("guest", 5, tx);
        assert!(!Arc::ptr_eq(&slot, &replaced));
    }
}

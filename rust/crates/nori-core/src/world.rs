//! One Arcade world: cartridges, media grants, story progression and the
//! handling of client messages (Python `backend/session/world.py`).
//!
//! The world never touches sockets. Every handler returns an [`Outbound`]:
//! hosts send `broadcast` to all main sockets first, then `direct` to the
//! requesting socket, then start the follow-up `tasks`.

use crate::cartridge::{self, Cartridge, Commit, DispatchError};
use crate::cartridges::chat;
use crate::jsonutil::{now_ms, token_urlsafe, uuid4, Json};
use crate::live_pack::LivePack;
use crate::media::fallback_frames;
use crate::protocol::{self, ProtocolError};
use crate::tasks::{self, Pacing, Task};
use serde_json::{json, Value};
use std::collections::BTreeMap;
use std::sync::{Arc, Weak};

pub const SERVER_ID: &str = "nori-local-arcade";
pub const MAX_MEDIA_GRANTS: usize = 32;

/// Per-frame browser credentials (`noriAiConfig` / `noriTtsConfig`), already
/// sanitized. They only ever live in follow-up tasks of one dispatch: never in
/// cartridge state, transitions, snapshots or socket attachments.
#[derive(Clone, Debug, Default)]
pub struct Secrets {
    pub ai: Option<Json>,
    pub tts: Option<Json>,
}

#[derive(Debug, Default)]
pub struct Outbound {
    /// Sent first, to every main socket of the world.
    pub broadcast: Vec<Json>,
    /// Sent after `broadcast`, only to the requesting socket.
    pub direct: Vec<Json>,
    /// Follow-up work for the host to run.
    pub tasks: Vec<Task>,
    /// Public (key-free) AI settings to persist (edge `nori:ai-public:v1`).
    pub public_ai: Option<Json>,
    /// The world was replaced; persist even if the snapshot looks unchanged.
    pub force_persist: bool,
}

impl Outbound {
    pub fn direct(message: Json) -> Self {
        Self {
            direct: vec![message],
            ..Self::default()
        }
    }
}

pub fn fence_for(cartridge_id: &str) -> &'static str {
    if cartridge_id == "manifold.web" {
        "player"
    } else {
        "ui"
    }
}

/// `{"type":"event", ...}` reply envelope used by event channels.
pub fn event_message(
    world: &World,
    channel: &str,
    payload: Json,
    cartridge_id: Json,
    request_id: Json,
) -> Json {
    let mut message =
        json!({"type": "event", "worldId": world.world_id, "channel": channel, "payload": payload});
    if !cartridge_id.is_null() {
        message["cartridgeId"] = cartridge_id;
    }
    if !request_id.is_null() {
        message["requestId"] = request_id;
    }
    message
}

#[derive(Clone, Debug)]
pub struct World {
    pub owner_id: String,
    pub world_id: String,
    pub locale: String,
    pub full_unlock: bool,
    pub cartridges: Vec<Cartridge>,
    /// Oldest first; at most [`MAX_MEDIA_GRANTS`].
    pub media_grants: Vec<String>,
    pub media_sequence: u32,
    pub pack: Arc<LivePack>,
    pub pacing: Pacing,
    story_advancing: bool,
    // Tasks own the strong leases: panics/cancellation cannot keep an app locked.
    agent_loops: BTreeMap<String, Weak<()>>,
}

impl World {
    pub fn new(
        owner_id: impl Into<String>,
        locale: Option<&str>,
        full_unlock: bool,
        pack: Arc<LivePack>,
    ) -> Self {
        Self {
            owner_id: owner_id.into(),
            world_id: uuid4(),
            locale: locale.filter(|l| !l.is_empty()).unwrap_or("en").to_string(),
            full_unlock,
            cartridges: cartridge::default_cartridges(full_unlock, &pack),
            media_grants: Vec::new(),
            media_sequence: 0,
            pack,
            pacing: Pacing::Local,
            story_advancing: false,
            agent_loops: BTreeMap::new(),
        }
    }

    pub fn blank(owner_id: String, pack: Arc<LivePack>) -> Self {
        Self::new(owner_id, None, true, pack)
    }

    pub fn with_pacing(mut self, pacing: Pacing) -> Self {
        self.pacing = pacing;
        self
    }

    pub fn cartridge(&self, id: &str) -> Option<&Cartridge> {
        self.cartridges.iter().find(|c| c.id == id)
    }

    pub fn cartridge_mut(&mut self, id: &str) -> Option<&mut Cartridge> {
        self.cartridges.iter_mut().find(|c| c.id == id)
    }

    pub fn issue_media_grant(&mut self) -> String {
        let grant = token_urlsafe(32);
        self.media_grants.push(grant.clone());
        if self.media_grants.len() > MAX_MEDIA_GRANTS {
            let overflow = self.media_grants.len() - MAX_MEDIA_GRANTS;
            self.media_grants.drain(0..overflow);
        }
        grant
    }

    pub fn has_media_grant(&self, grant: &str) -> bool {
        !grant.is_empty() && self.media_grants.iter().any(|g| g == grant)
    }

    pub fn world_payload(&self) -> Json {
        let mounted: Vec<Json> = self
            .cartridges
            .iter()
            .map(|c| json!({"cartridgeId": c.id, "runtimes": [c.snapshot(fence_for(&c.id))]}))
            .collect();
        json!({"worldId": self.world_id, "mountedCartridges": mounted})
    }

    fn joined(&mut self) -> Outbound {
        let grant = self.issue_media_grant();
        let mut out = Outbound::direct(
            json!({"type": "world_joined", "world": self.world_payload(), "session": {"isAdmin": true, "mediaGrant": grant}}),
        );
        for cartridge_id in ["cakeduel", "codenames", "chess"] {
            out.tasks.extend(self.schedule_agent_loop(cartridge_id));
        }
        out.tasks.extend(self.schedule_pictionary_guess());
        out
    }

    pub fn commit_messages(&self, cartridge_id: &str, commit: &Commit) -> Vec<Json> {
        let (true, Some(transition)) = (commit.committed, commit.transition.as_ref()) else {
            return Vec::new();
        };
        let cartridge = self.cartridge(cartridge_id);
        let visible = cartridge
            .map(|c| c.visible_version)
            .unwrap_or(commit.version);
        let head = cartridge.map(|c| c.head_version).unwrap_or(commit.version);
        let transition = cartridge
            .map(|c| c.client_view(transition))
            .unwrap_or_else(|| transition.clone());
        vec![
            protocol::runtime_transition(&self.world_id, cartridge_id, commit.version, &transition),
            protocol::visibility_advanced(
                &self.world_id,
                cartridge_id,
                fence_for(cartridge_id),
                visible,
                head,
            ),
        ]
    }

    /// Server-owned follow-up command (Python `_dispatch_internal`). `None`
    /// when the cartridge is missing or the command was rejected.
    pub fn dispatch_internal(
        &mut self,
        cartridge_id: &str,
        actor: &str,
        cmd: &Json,
    ) -> Option<(Commit, Vec<Json>)> {
        let pack = self.pack.clone();
        let cartridge = self.cartridge_mut(cartridge_id)?;
        let commit = match cartridge.dispatch(actor, cmd, &pack) {
            Ok(commit) => commit,
            Err(error) => {
                let text = match error {
                    DispatchError::Rejected(text) | DispatchError::Internal(text) => text,
                };
                let kind = cmd.get("type").and_then(Value::as_str).unwrap_or("");
                eprintln!(
                    "[world:{}] internal {cartridge_id}/{kind} rejected: {text}",
                    self.world_id
                );
                return None;
            }
        };
        let mut messages = self.commit_messages(cartridge_id, &commit);
        messages.extend(self.story_advance());
        Some((commit, messages))
    }

    /// Python `story.advance`: emit due facts; no-op for archive worlds.
    pub fn story_advance(&mut self) -> Vec<Json> {
        if self.full_unlock || self.story_advancing || self.cartridge("manifold.web").is_none() {
            return Vec::new();
        }
        self.story_advancing = true;
        let pending = crate::story::due_facts(self);
        let mut messages = Vec::new();
        if !pending.is_empty() {
            let pack = self.pack.clone();
            let cmd =
                json!({"type": "client.emitFacts", "factIds": pending, "source": "system.tick"});
            if let Some(manifold) = self.cartridge_mut("manifold.web") {
                if let Ok(commit) = manifold.dispatch("system", &cmd, &pack) {
                    messages = self.commit_messages("manifold.web", &commit);
                }
            }
        }
        self.story_advancing = false;
        messages
    }

    /// Handle one validated-or-not client message (everything except
    /// `reset_my_web_world`, which replaces the world: see [`World::reset`]).
    pub fn handle_message(&mut self, message: &Json, secrets: &Secrets) -> Outbound {
        let message = match protocol::validate_client_message(message) {
            Ok(message) => message,
            Err(ProtocolError {
                code,
                message,
                request_id,
                cartridge_id,
            }) => {
                return Outbound::direct(protocol::error_message(
                    &code,
                    &message,
                    None,
                    cartridge_id.as_deref(),
                    request_id.as_deref(),
                ));
            }
        };
        match message.get("type").and_then(Value::as_str).unwrap_or("") {
            "open_my_web_world" => self.open_world(&message),
            "reset_my_web_world" => self.reset(&message),
            "join_world" => self.join_world(&message),
            "leave_world" => {
                Outbound::direct(json!({"type": "world_left", "worldId": self.world_id}))
            }
            "create_world" => Outbound::direct(
                json!({"type": "world_created", "world": self.world_payload(), "session": {"isAdmin": true}}),
            ),
            "mount_cartridge" => self.mount(&message),
            "unmount_cartridge" => self.unmount(&message),
            "dispatch" => self.dispatch(&message, secrets),
            "advance_visibility_fence" => self.advance_fence(&message),
            "ping" => {
                Outbound::direct(json!({"type": "pong", "serverId": SERVER_ID, "now": now_ms()}))
            }
            "event" => crate::events::handle_event(self, &message),
            _ => Outbound::default(),
        }
    }

    /// Python `WorldManager.reset_world` + the arcade endpoint's replies.
    pub fn reset(&mut self, message: &Json) -> Outbound {
        let locale = message
            .get("locale")
            .and_then(Value::as_str)
            .filter(|l| !l.is_empty())
            .unwrap_or(&self.locale)
            .to_string();
        let full_unlock = message.get("fullUnlock") != Some(&Value::Bool(false));
        let pacing = self.pacing;
        *self = World::new(
            self.owner_id.clone(),
            Some(&locale),
            full_unlock,
            self.pack.clone(),
        )
        .with_pacing(pacing);
        Outbound {
            direct: vec![
                json!({"type": "web_world_reset_ack", "worldId": self.world_id}),
                json!({"type": "world_created", "world": self.world_payload(), "session": {"isAdmin": true}}),
            ],
            force_persist: true,
            ..Outbound::default()
        }
    }

    fn open_world(&mut self, message: &Json) -> Outbound {
        if let Some(locale) = message.get("locale").and_then(Value::as_str) {
            self.locale = locale.to_string();
        }
        let requested = message.get("fullUnlock") != Some(&Value::Bool(false));
        if let Some(index) = self.cartridges.iter().position(|c| c.id == "manifold.web") {
            if requested != self.full_unlock {
                self.full_unlock = requested;
                if let Some(manifold) = cartridge::create("manifold.web", requested, &self.pack) {
                    self.cartridges[index] = manifold;
                }
            }
            if !requested {
                if let Some(progress) = message.get("localProgress").filter(|v| v.is_object()) {
                    let manifold = &mut self.cartridges[index];
                    for key in ["facts", "variables"] {
                        if let Some(value) = progress.get(key).filter(|v| v.is_object()) {
                            manifold.state[key] = value.clone();
                        }
                    }
                }
            }
        }
        if !self.full_unlock {
            // The snapshot below carries the advanced state; Python does not
            // broadcast these transitions.
            self.story_advance();
        }
        self.joined()
    }

    fn join_world(&mut self, message: &Json) -> Outbound {
        let requested = message.get("worldId").and_then(Value::as_str).unwrap_or("");
        if requested != self.world_id {
            return Outbound::direct(protocol::error_message(
                "world_not_found",
                "World is not available for this local user",
                Some(requested),
                None,
                None,
            ));
        }
        self.joined()
    }

    fn mount(&mut self, message: &Json) -> Outbound {
        let cartridge_id = message
            .get("cartridgeId")
            .and_then(Value::as_str)
            .unwrap_or("");
        let request_id = message
            .get("requestId")
            .and_then(Value::as_str)
            .unwrap_or("");
        let transition = if self.cartridge(cartridge_id).is_some() {
            "already_mounted"
        } else if let Some(cartridge) = cartridge::create(cartridge_id, true, &self.pack) {
            // Registry defaults, as in Python (`manifold.web` is archive mode).
            self.cartridges.push(cartridge);
            "created"
        } else {
            return Outbound::direct(protocol::error_message(
                "command_rejected",
                &format!("Unknown cartridge: {cartridge_id}"),
                Some(&self.world_id),
                Some(cartridge_id),
                Some(request_id),
            ));
        };
        let runtimes = self
            .cartridge(cartridge_id)
            .map(|c| vec![c.snapshot(fence_for(cartridge_id))])
            .unwrap_or_default();
        Outbound {
            broadcast: vec![
                json!({"type": "cartridge_mounted", "worldId": self.world_id, "cartridgeId": cartridge_id, "transition": transition, "runtimes": runtimes}),
            ],
            direct: vec![
                json!({"type": "cartridge_mounted_ack", "worldId": self.world_id, "cartridgeId": cartridge_id, "requestId": request_id, "transition": transition, "runtimes": runtimes}),
            ],
            tasks: self.schedule_agent_loop(cartridge_id),
            ..Outbound::default()
        }
    }

    fn unmount(&mut self, message: &Json) -> Outbound {
        let cartridge_id = message
            .get("cartridgeId")
            .and_then(Value::as_str)
            .unwrap_or("");
        let request_id = message
            .get("requestId")
            .and_then(Value::as_str)
            .unwrap_or("");
        let mut out = Outbound::default();
        // chat is the world-owned system cartridge and cannot be removed.
        if cartridge_id != "chat" {
            let prefix = format!("{cartridge_id}:");
            self.agent_loops
                .retain(|key, _| key != cartridge_id && !key.starts_with(&prefix));
            self.cartridges.retain(|c| c.id != cartridge_id);
            out.broadcast.push(json!({"type": "cartridge_unmounted", "worldId": self.world_id, "cartridgeId": cartridge_id}));
        }
        out.direct.push(json!({"type": "cartridge_unmounted_ack", "worldId": self.world_id, "cartridgeId": cartridge_id, "requestId": request_id}));
        out
    }

    fn dispatch(&mut self, message: &Json, secrets: &Secrets) -> Outbound {
        let text = |key: &str| {
            message
                .get(key)
                .and_then(Value::as_str)
                .unwrap_or("")
                .to_string()
        };
        let (cartridge_id, request_id, actor) =
            (text("cartridgeId"), text("requestId"), text("actor"));
        let cmd = message.get("cmd").cloned().unwrap_or_else(|| json!({}));
        let expected = message
            .get("expectedHeadVersion")
            .and_then(Value::as_u64)
            .unwrap_or(0);
        let world_id = self.world_id.clone();
        let pack = self.pack.clone();
        let failure = |head: u64, error: &str, code: &str| {
            Outbound::direct(protocol::dispatch_failure(
                &world_id,
                &cartridge_id,
                &request_id,
                head,
                error,
                code,
            ))
        };
        let Some(cartridge) = self.cartridge_mut(&cartridge_id) else {
            return failure(0, "Cartridge is not mounted", "dispatch_error");
        };
        let head = cartridge.head_version;
        if expected != head {
            return failure(
                head,
                &format!("Version mismatch: expected {expected}, head is {head}"),
                "version_mismatch",
            );
        }
        let commit = match cartridge.dispatch(&actor, &cmd, &pack) {
            Ok(commit) => commit,
            Err(DispatchError::Rejected(error)) => {
                return failure(head, &error, "command_rejected")
            }
            Err(DispatchError::Internal(error)) => {
                eprintln!("[world:{world_id}] dispatch error: {error}");
                return failure(head, "Local runtime dispatch error", "dispatch_error");
            }
        };
        let head = self
            .cartridge(&cartridge_id)
            .map(|c| c.head_version)
            .unwrap_or(commit.version);
        let mut broadcast = self.commit_messages(&cartridge_id, &commit);
        let command_type = cmd.get("type").and_then(Value::as_str).unwrap_or("");
        let player_message =
            cartridge_id == "chat" && actor == "player" && command_type == "playerMessage";
        let typed_text = cmd.get("text").map(|v| match v {
            Value::String(s) => s.clone(),
            Value::Null => String::new(),
            other => other.to_string(),
        });
        if player_message {
            broadcast.extend(crate::story::player_text(
                self,
                typed_text.as_deref().unwrap_or(""),
            ));
        }
        broadcast.extend(self.story_advance());
        let result = self
            .cartridge(&cartridge_id)
            .map(|c| c.client_view(&commit.result))
            .unwrap_or_else(|| commit.result.clone());
        let ack = protocol::dispatch_success(
            &self.world_id,
            &cartridge_id,
            &request_id,
            head,
            commit.committed,
            &result,
        );
        let tasks = self.follow_up(&cartridge_id, &actor, &cmd, typed_text, secrets);
        Outbound {
            broadcast,
            direct: vec![ack],
            tasks,
            ..Outbound::default()
        }
    }

    /// Python `_schedule_follow_up`.
    fn follow_up(
        &mut self,
        cartridge_id: &str,
        actor: &str,
        cmd: &Json,
        typed_text: Option<String>,
        secrets: &Secrets,
    ) -> Vec<Task> {
        let command_type = cmd.get("type").and_then(Value::as_str).unwrap_or("");
        let pacing = self.pacing;
        match cartridge_id {
            "chat" => {
                if actor == "player" && command_type == "playerMessage" {
                    vec![Task::chat_reply(
                        self,
                        pacing,
                        typed_text.unwrap_or_default(),
                        secrets.clone(),
                    )]
                } else if command_type == "audioDone" {
                    match cmd.get("operationId").and_then(Value::as_str) {
                        Some(operation_id) => {
                            vec![Task::settle_chat(self, pacing, operation_id.to_string())]
                        }
                        None => Vec::new(),
                    }
                } else {
                    Vec::new()
                }
            }
            "cakeduel" | "codenames" | "chess" => self.schedule_agent_loop(cartridge_id),
            "pictionary" if matches!(command_type, "submitGuess" | "skipRound") => {
                let mut tasks = vec![Task::pictionary_next(self, pacing)];
                tasks.extend(self.schedule_pictionary_guess());
                tasks
            }
            "pictionary" => self.schedule_pictionary_guess(),
            _ => Vec::new(),
        }
    }

    /// One Nori guesser per active round where Nori is the guesser.
    pub(crate) fn schedule_pictionary_guess(&mut self) -> Vec<Task> {
        self.agent_loops.retain(|_, lease| lease.strong_count() > 0);
        let Some(round_id) = self
            .cartridge("pictionary")
            .and_then(|c| crate::cartridges::pictionary::agent_guess_round(&c.state))
        else {
            return Vec::new();
        };
        let key = format!("pictionary:{round_id}");
        if self.agent_loops.contains_key(&key) {
            return Vec::new();
        }
        let task = Task::pictionary_guess(self, self.pacing, round_id);
        self.agent_loops.insert(key, task.agent_loop_lease());
        vec![task]
    }

    fn schedule_agent_loop(&mut self, cartridge_id: &str) -> Vec<Task> {
        if cartridge_id == "pictionary" {
            return self.schedule_pictionary_guess();
        }
        self.agent_loops.retain(|_, lease| lease.strong_count() > 0);
        if self.agent_loops.contains_key(cartridge_id) {
            return Vec::new();
        }
        let pending = self.cartridge(cartridge_id).is_some_and(|cartridge| {
            cartridge::agent_command(cartridge_id, &cartridge.state)
                .or_else(|| tasks::recovery_command(cartridge_id, &cartridge.state))
                .is_some()
        });
        if pending {
            let task = Task::agent_turns(self, self.pacing, cartridge_id.to_string());
            self.agent_loops
                .insert(cartridge_id.to_string(), task.agent_loop_lease());
            vec![task]
        } else {
            Vec::new()
        }
    }

    fn advance_fence(&mut self, message: &Json) -> Outbound {
        let text = |key: &str| {
            message
                .get(key)
                .and_then(Value::as_str)
                .unwrap_or("")
                .to_string()
        };
        let (cartridge_id, request_id, fence) = (
            text("cartridgeId"),
            text("requestId"),
            text("visibilityFenceId"),
        );
        let world_id = self.world_id.clone();
        let Some(cartridge) = self.cartridge_mut(&cartridge_id) else {
            return Outbound::direct(protocol::error_message(
                "cartridge_not_mounted",
                "Cartridge is not mounted",
                Some(&world_id),
                Some(&cartridge_id),
                Some(&request_id),
            ));
        };
        let requested = message
            .get("version")
            .and_then(Value::as_u64)
            .unwrap_or(0)
            .min(cartridge.head_version);
        cartridge.visible_version = cartridge.visible_version.max(requested);
        let (visible, head) = (cartridge.visible_version, cartridge.head_version);
        Outbound {
            broadcast: vec![protocol::visibility_advanced(
                &world_id,
                &cartridge_id,
                &fence,
                visible,
                head,
            )],
            direct: vec![json!({
                "type": "visibility_fence_advanced_ack",
                "worldId": world_id,
                "cartridgeId": cartridge_id,
                "visibilityFenceId": fence,
                "visibleVersion": visible,
                "headVersion": head,
                "requestId": request_id,
            })],
            ..Outbound::default()
        }
    }

    /// Fallback tone frames; reserves their sequence numbers immediately.
    pub fn stream_fallback(
        &mut self,
        operation_id: &str,
        message_id: &str,
        text: &str,
    ) -> Vec<Vec<u8>> {
        let count = text.chars().count().div_ceil(8).clamp(1, 12) as u32;
        let start = self.media_sequence;
        self.media_sequence = self.media_sequence.wrapping_add(count);
        fallback_frames(operation_id, message_id, text, start)
    }

    /// One opponent move (Python `_next_agent_command` +
    /// `_dispatch_agent_command`). `None` ends the agent loop.
    pub fn agent_step(&mut self, cartridge_id: &str) -> Option<Vec<Json>> {
        self.agent_step_with_recovery(cartridge_id, false)
    }

    pub(crate) fn agent_step_with_recovery(
        &mut self,
        cartridge_id: &str,
        prefer_recovery: bool,
    ) -> Option<Vec<Json>> {
        let state = self.cartridge(cartridge_id)?.state.clone();
        let forced = if prefer_recovery {
            tasks::recovery_command(cartridge_id, &state)
        } else {
            None
        };
        let command = forced
            .or_else(|| cartridge::agent_command(cartridge_id, &state))
            .or_else(|| tasks::recovery_command(cartridge_id, &state))?;
        if let Some((_, messages)) = self.dispatch_internal(cartridge_id, "agent", &command) {
            return Some(messages);
        }
        let state = self.cartridge(cartridge_id)?.state.clone();
        let recovery = tasks::recovery_command(cartridge_id, &state).filter(|r| *r != command)?;
        eprintln!(
            "[world:{}] retrying rejected {cartridge_id} agent action with recovery",
            self.world_id
        );
        self.dispatch_internal(cartridge_id, "agent", &recovery)
            .map(|(_, messages)| messages)
    }

    /// Python `_start_next_pictionary_round` after its delay.
    pub fn pictionary_next_round(&mut self) -> Vec<Json> {
        let due = self
            .cartridge("pictionary")
            .is_some_and(|c| tasks::pictionary_due(&c.state));
        if !due {
            return Vec::new();
        }
        self.dispatch_internal("pictionary", "agent", &tasks::pictionary_command())
            .map(|(_, m)| m)
            .unwrap_or_default()
    }

    pub fn chat_history(&self) -> Vec<Json> {
        self.cartridge("chat")
            .map(|c| chat::history(&c.state))
            .unwrap_or_default()
    }
}

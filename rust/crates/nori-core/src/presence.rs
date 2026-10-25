//! Anonymous online count for the Settings window.
//!
//! Every open client sends a heartbeat (`POST /api/presence`) about every 30
//! seconds. A user is online while their last heartbeat is younger than
//! [`TTL_MS`]; several tabs of one user count once. Only a SHA-256 digest of the
//! user id is kept, in memory, and never persisted.

use sha2::{Digest, Sha256};
use std::collections::HashMap;

pub const PATH: &str = "/api/presence";
pub const TTL_MS: i64 = 150_000;
/// Hard bound so a flood of identities cannot grow the table without limit.
pub const MAX_ENTRIES: usize = 100_000;
/// Suggested client heartbeat interval.
pub const INTERVAL_MS: i64 = 30_000;

#[derive(Debug, Default, Clone)]
pub struct Presence {
    seen: HashMap<String, i64>,
}

/// The stored key for a user id (never the id itself).
pub fn identity(user_id: &str) -> String {
    crate::jsonutil::hex_encode(&Sha256::digest(format!("nori-presence:{user_id}").as_bytes()))
}

impl Presence {
    fn prune(&mut self, now_ms: i64) {
        self.seen.retain(|_, at| now_ms - *at < TTL_MS);
    }

    /// Record a heartbeat (or a goodbye) and return the current online count.
    pub fn beat(&mut self, identity: &str, leave: bool, now_ms: i64) -> usize {
        self.prune(now_ms);
        if leave {
            self.seen.remove(identity);
        } else if self.seen.len() < MAX_ENTRIES || self.seen.contains_key(identity) {
            self.seen.insert(identity.to_string(), now_ms);
        }
        self.seen.len()
    }

    pub fn count(&mut self, now_ms: i64) -> usize {
        self.prune(now_ms);
        self.seen.len()
    }
}

/// `POST /api/presence` body: `{"leave": true}` on page hide, otherwise a heartbeat.
pub fn wants_leave(body: &[u8]) -> bool {
    serde_json::from_slice::<serde_json::Value>(body)
        .ok()
        .and_then(|value| value.get("leave").and_then(serde_json::Value::as_bool))
        .unwrap_or(false)
}

pub fn response_body(online: usize) -> serde_json::Value {
    serde_json::json!({"online": online, "ttlMs": TTL_MS, "intervalMs": INTERVAL_MS})
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn counts_users_once_and_expires_them() {
        let mut presence = Presence::default();
        let (a, b) = (identity("a"), identity("b"));
        assert_eq!(presence.beat(&a, false, 0), 1);
        assert_eq!(presence.beat(&a, false, 10), 1, "a second tab counts once");
        assert_eq!(presence.beat(&b, false, 20), 2);
        assert_eq!(presence.beat(&b, true, 30), 1, "a goodbye leaves immediately");
        assert_eq!(presence.count(TTL_MS + 10), 0, "silent users expire");
        assert_ne!(a, "a");
    }

    #[test]
    fn leave_flag_is_optional() {
        assert!(wants_leave(br#"{"leave":true}"#));
        assert!(!wants_leave(b""));
        assert!(!wants_leave(br#"{"leave":"yes"}"#));
    }
}

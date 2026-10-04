//! Frame pipeline shared by both hosts (Python `backend/api/arcade.py`
//! receive loop and the Worker's `_handle_main_message`).
//!
//! Order matters and mirrors Python: decode → object check → story-cookie
//! default → strip per-dispatch credentials → world handling.

use crate::jsonutil::Json;
use crate::protocol;
use crate::world::{Outbound, Secrets, World};
use serde_json::Value;

/// Decode one client text frame. `Err` holds the error frame to send back on
/// the same socket (the connection stays open).
pub fn decode_frame(raw: &str) -> Result<Json, Json> {
    let message: Json = serde_json::from_str(raw).map_err(|_| protocol::error_message("bad_request", "Invalid JSON", None, None, None))?;
    if !message.is_object() {
        return Err(protocol::error_message("bad_request", "message must be an object", None, None, None));
    }
    Ok(message)
}

pub fn is_ping(message: &Json) -> bool {
    message.get("type").and_then(Value::as_str) == Some("ping")
}

fn is_player_chat_dispatch(message: &Json) -> bool {
    message.get("type").and_then(Value::as_str) == Some("dispatch")
        && message.get("cartridgeId").and_then(Value::as_str) == Some("chat")
        && message.get("actor").and_then(Value::as_str) == Some("player")
        && message.get("cmd").and_then(|c| c.get("type")).and_then(Value::as_str) == Some("playerMessage")
}

/// Remove `noriAiConfig` / `noriTtsConfig` from a player chat dispatch before
/// validation, so they never reach reducers, transitions or snapshots.
pub fn take_secrets(message: &mut Json) -> Secrets {
    if !is_player_chat_dispatch(message) {
        return Secrets::default();
    }
    let Some(object) = message.as_object_mut() else {
        return Secrets::default();
    };
    let ai = object.remove("noriAiConfig").filter(Value::is_object).map(|raw| crate::llm::sanitize_ai_config(&raw));
    let tts = object.remove("noriTtsConfig").filter(Value::is_object).map(|raw| crate::tts::sanitize_tts_config(&raw));
    Secrets { ai, tts }
}

/// Decode + normalize a frame. `story_preference` comes from the
/// `nori_full_unlock` cookie captured at upgrade time.
pub fn prepare(raw: &str, story_preference: Option<bool>) -> Result<(Json, Secrets), Json> {
    let mut message = decode_frame(raw)?;
    crate::auth::apply_story_default(&mut message, story_preference);
    let secrets = take_secrets(&mut message);
    Ok((message, secrets))
}

/// Run a prepared message. `reset_my_web_world` replaces `*world` in place.
pub fn handle(world: &mut World, message: &Json, secrets: &Secrets) -> Outbound {
    if message.get("type").and_then(Value::as_str) == Some("reset_my_web_world") {
        // Python handles reset before protocol validation.
        return world.reset(message);
    }
    world.handle_message(message, secrets)
}

/// Sanitized AI settings minus the key (edge `nori:ai-public:v1`).
pub fn public_ai_config(sanitized: &Json) -> Json {
    let mut public = sanitized.clone();
    if let Some(object) = public.as_object_mut() {
        object.remove("apiKey");
    }
    public
}

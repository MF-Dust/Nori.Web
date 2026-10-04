use crate::jsonutil::Json;
use serde_json::{json, Value};

pub const CLIENT_TYPES: &[&str] = &[
    "create_world",
    "join_world",
    "leave_world",
    "open_my_web_world",
    "reset_my_web_world",
    "mount_cartridge",
    "unmount_cartridge",
    "dispatch",
    "advance_visibility_fence",
    "ping",
    "event",
];

#[derive(Debug)]
pub struct ProtocolError {
    pub code: String,
    pub message: String,
    pub request_id: Option<String>,
    pub cartridge_id: Option<String>,
}

fn need_string(value: Option<&Value>, field: &str) -> Result<String, ProtocolError> {
    match value.and_then(Value::as_str) {
        Some(text) if !text.is_empty() => Ok(text.to_string()),
        _ => Err(ProtocolError {
            code: "bad_request".into(),
            message: format!("{field} must be a non-empty string"),
            request_id: None,
            cartridge_id: None,
        }),
    }
}

fn need_version(value: Option<&Value>, field: &str) -> Result<u64, ProtocolError> {
    match value.and_then(crate::jsonutil::as_nonneg) {
        Some(n) => Ok(n),
        None => Err(ProtocolError {
            code: "bad_request".into(),
            message: format!("{field} must be a non-negative integer"),
            request_id: None,
            cartridge_id: None,
        }),
    }
}

pub fn validate_client_message(value: &Json) -> Result<Json, ProtocolError> {
    let Some(obj) = value.as_object() else {
        return Err(ProtocolError {
            code: "bad_request".into(),
            message: "message must be an object".into(),
            request_id: None,
            cartridge_id: None,
        });
    };
    let message_type = need_string(obj.get("type"), "type")?;
    if !CLIENT_TYPES.contains(&message_type.as_str()) {
        return Err(ProtocolError {
            code: "unsupported_message".into(),
            message: format!("Unsupported message type: {message_type}"),
            request_id: None,
            cartridge_id: None,
        });
    }
    if message_type == "join_world" {
        need_string(obj.get("worldId"), "worldId")?;
    } else if message_type == "mount_cartridge" || message_type == "unmount_cartridge" {
        need_string(obj.get("cartridgeId"), "cartridgeId")?;
        need_string(obj.get("requestId"), "requestId")?;
    } else if message_type == "dispatch" {
        need_string(obj.get("actor"), "actor")?;
        need_string(obj.get("cartridgeId"), "cartridgeId")?;
        let request_id = need_string(obj.get("requestId"), "requestId")?;
        let cartridge_id = obj.get("cartridgeId").and_then(Value::as_str).map(str::to_string);
        // Python's `_version` error carries no request/cartridge ids.
        need_version(obj.get("expectedHeadVersion"), "expectedHeadVersion")?;
        let cmd = obj.get("cmd");
        let ok = cmd
            .and_then(Value::as_object)
            .and_then(|c| c.get("type"))
            .and_then(Value::as_str)
            .is_some_and(|t| !t.is_empty());
        if !ok {
            return Err(ProtocolError {
                code: "bad_request".into(),
                message: "cmd must be an object with a non-empty type".into(),
                request_id: Some(request_id),
                cartridge_id,
            });
        }
    } else if message_type == "advance_visibility_fence" {
        need_string(obj.get("cartridgeId"), "cartridgeId")?;
        need_string(obj.get("visibilityFenceId"), "visibilityFenceId")?;
        need_string(obj.get("requestId"), "requestId")?;
        need_version(obj.get("version"), "version")?;
    } else if message_type == "event" {
        need_string(obj.get("channel"), "channel")?;
    }
    Ok(value.clone())
}

pub fn error_message(
    code: &str,
    message: &str,
    world_id: Option<&str>,
    cartridge_id: Option<&str>,
    request_id: Option<&str>,
) -> Json {
    let mut payload = json!({"type": "error", "code": code, "message": message});
    if let Some(id) = world_id {
        payload["worldId"] = json!(id);
    }
    if let Some(id) = cartridge_id {
        payload["cartridgeId"] = json!(id);
    }
    if let Some(id) = request_id {
        payload["requestId"] = json!(id);
    }
    payload
}

pub fn runtime_transition(world_id: &str, cartridge_id: &str, version: u64, transition: &Json) -> Json {
    json!({
        "type": "runtime_transition",
        "worldId": world_id,
        "cartridgeId": cartridge_id,
        "version": version,
        "transition": transition,
    })
}

pub fn visibility_advanced(
    world_id: &str,
    cartridge_id: &str,
    fence_id: &str,
    visible_version: u64,
    head_version: u64,
) -> Json {
    json!({
        "type": "visibility_fence_advanced",
        "worldId": world_id,
        "cartridgeId": cartridge_id,
        "visibilityFenceId": fence_id,
        "visibleVersion": visible_version,
        "headVersion": head_version,
    })
}

pub fn dispatch_success(
    world_id: &str,
    cartridge_id: &str,
    request_id: &str,
    head_version: u64,
    committed: bool,
    result: &Json,
) -> Json {
    let mut payload = json!({
        "type": "dispatch_ack",
        "worldId": world_id,
        "cartridgeId": cartridge_id,
        "requestId": request_id,
        "success": true,
        "committed": committed,
        "headVersion": head_version,
    });
    if committed {
        payload["committedVersion"] = json!(head_version);
    }
    if !result.is_null() {
        payload["result"] = result.clone();
    }
    payload
}

pub fn dispatch_failure(
    world_id: &str,
    cartridge_id: &str,
    request_id: &str,
    head_version: u64,
    error: &str,
    error_code: &str,
) -> Json {
    json!({
        "type": "dispatch_ack",
        "worldId": world_id,
        "cartridgeId": cartridge_id,
        "requestId": request_id,
        "success": false,
        "headVersion": head_version,
        "error": error,
        "errorCode": error_code,
    })
}

pub fn ws_text(value: &Json) -> String {
    // Compact, non-ascii preserved. Key order follows serde_json insertion order.
    serde_json::to_string(value).unwrap_or_else(|_| "null".into())
}

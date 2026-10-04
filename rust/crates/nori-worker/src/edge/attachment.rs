use serde_json::{json, Map, Value};

pub fn read(raw: Option<Value>) -> Map<String, Value> {
    match raw {
        Some(Value::Object(object)) => object,
        Some(Value::String(raw)) => serde_json::from_str::<Value>(&raw)
            .ok()
            .and_then(|v| v.as_object().cloned())
            .unwrap_or_default(),
        _ => Map::new(),
    }
}

pub fn scrub(attachment: &mut Map<String, Value>) -> bool {
    // Do both removals (do not short circuit).
    let ai = attachment.remove("apiKey").is_some();
    let tts = attachment.remove("ttsApiKey").is_some();
    ai || tts
}

pub fn text(attachment: &Map<String, Value>, key: &str) -> Option<String> {
    attachment
        .get(key)
        .and_then(Value::as_str)
        .map(str::to_owned)
}

pub fn new(user_id: &str, socket_id: &str, path: &str, cookie: &str) -> String {
    let role = if path.ends_with("/media") {
        "pending_media"
    } else {
        "main"
    };
    let mut value = json!({"version": 1, "socketId": socket_id, "userId": user_id, "role": role});
    if let Some(preference) = nori_core::auth::story_preference(cookie) {
        value["fullUnlock"] = json!(preference);
    }
    serde_json::to_string(&value).expect("JSON attachment")
}

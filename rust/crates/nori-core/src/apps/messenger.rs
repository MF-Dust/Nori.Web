use crate::{live_pack::LivePack, Json};
use serde_json::{json, Map};
use std::collections::HashMap;

const THREAD_KEYS_EXCLUDED: [&str; 6] = [
    "thread_id",
    "title",
    "participants",
    "avatar_path",
    "status",
    "messages",
];
const MESSAGE_KEYS_EXCLUDED: [&str; 6] = [
    "thread_id",
    "message_id",
    "sender",
    "kind",
    "body_md",
    "timestamp",
];

/// Export thread objects formatted as Manifold artifacts.
pub fn thread_artifacts(pack: &LivePack, now_ms: i64) -> Vec<Json> {
    if pack.is_available() {
        let archived = pack.signal_thread_artifacts();
        let mut artifacts = Vec::new();
        let mut positions = HashMap::new();
        let mut seen_thread_ids = Vec::new();
        for artifact in archived {
            let data = object_field(&artifact, "data");
            seen_thread_ids.push(data.get("thread_id").cloned().unwrap_or(Json::Null));
            insert_by_id(&mut artifacts, &mut positions, artifact);
        }

        for thread in materialize_threads(pack) {
            let thread_id = thread["thread_id"].clone();
            if seen_thread_ids.contains(&thread_id) {
                continue;
            }
            let mut data = Map::new();
            for (key, value) in thread.as_object().into_iter().flatten() {
                if key != "messages" {
                    data.insert(key.clone(), value.clone());
                }
            }
            insert_by_id(
                &mut artifacts,
                &mut positions,
                json!({
                    "id": thread["id"].clone(),
                    "type": "signal_thread",
                    "surfacedAt": now_ms - 3_600_000,
                    "data": data,
                }),
            );
        }
        return artifacts;
    }

    fallback_threads()
        .iter()
        .map(|thread| {
            json!({
                "id": thread["id"].clone(),
                "type": "signal_thread",
                "surfacedAt": now_ms - 3_600_000,
                "data": {
                    "thread_id": thread["thread_id"].clone(),
                    "title": thread["title"].clone(),
                    "participants": thread["participants"].clone(),
                    "avatar_path": thread["avatar_path"].clone(),
                }
            })
        })
        .collect()
}

/// Export message objects formatted as Manifold artifacts.
pub fn message_artifacts(pack: &LivePack, now_ms: i64) -> Vec<Json> {
    if pack.is_available() {
        let archived = pack.signal_message_artifacts();
        let mut artifacts = Vec::new();
        let mut positions = HashMap::new();
        let mut seen_message_ids = Vec::new();
        for artifact in archived {
            let data = object_field(&artifact, "data");
            let message_id = data
                .get("message_id")
                .filter(|value| truthy(value))
                .cloned()
                .unwrap_or_else(|| artifact.get("id").cloned().unwrap_or(Json::Null));
            seen_message_ids.push(message_id);
            insert_by_id(&mut artifacts, &mut positions, artifact);
        }

        for thread in materialize_threads(pack) {
            if let Some(messages) = thread.get("messages").and_then(Json::as_array) {
                for message in messages {
                    if seen_message_ids.contains(&message["message_id"]) {
                        continue;
                    }
                    let mut data = Map::new();
                    for (key, value) in message.as_object().into_iter().flatten() {
                        if key != "id" {
                            data.insert(key.clone(), value.clone());
                        }
                    }
                    insert_by_id(
                        &mut artifacts,
                        &mut positions,
                        json!({
                            "id": message["id"].clone(),
                            "type": "signal_message",
                            "surfacedAt": now_ms - 60_000,
                            "data": data,
                        }),
                    );
                }
            }
        }
        return artifacts;
    }

    fallback_threads()
        .iter()
        .flat_map(|thread| thread["messages"].as_array().into_iter().flatten())
        .map(|message| {
            json!({
                "id": message["id"].clone(),
                "type": "signal_message",
                "surfacedAt": now_ms - 60_000,
                "data": {
                    "thread_id": message["thread_id"].clone(),
                    "message_id": message["message_id"].clone(),
                    "sender": message["sender"].clone(),
                    "kind": message["kind"].clone(),
                    "body_md": message["body_md"].clone(),
                    "timestamp": message["timestamp"].clone(),
                }
            })
        })
        .collect()
}

/// Rebuild the import-time Python THREADS materialization on demand.
fn materialize_threads(pack: &LivePack) -> Vec<Json> {
    let mut threads = Vec::new();
    for artifact in pack.signal_thread_artifacts() {
        let data = object_field(&artifact, "data");
        let thread_id = data
            .get("thread_id")
            .filter(|value| truthy(value))
            .cloned()
            .or_else(|| artifact.get("id").cloned())
            .unwrap_or_else(|| json!(""));
        let mut thread = Map::new();
        thread.insert(
            "id".into(),
            json!(format!("thread_{}", py_string(&thread_id))),
        );
        thread.insert("thread_id".into(), thread_id.clone());
        thread.insert(
            "title".into(),
            data.get("title")
                .filter(|value| truthy(value))
                .cloned()
                .unwrap_or_else(|| thread_id.clone()),
        );
        thread.insert(
            "participants".into(),
            data.get("participants")
                .cloned()
                .unwrap_or_else(|| json!([])),
        );
        thread.insert(
            "avatar_path".into(),
            data.get("avatar_path")
                .cloned()
                .unwrap_or_else(|| json!("/icon.png")),
        );
        thread.insert("messages".into(), json!([]));
        if let Some(status) = data.get("status").filter(|value| truthy(value)) {
            thread.insert("status".into(), status.clone());
        }
        for (key, value) in data {
            if !THREAD_KEYS_EXCLUDED.contains(&key.as_str()) {
                thread.insert(key.clone(), value.clone());
            }
        }
        upsert_thread(&mut threads, thread_id, Json::Object(thread));
    }

    for artifact in pack.signal_message_artifacts() {
        let data = object_field(&artifact, "data");
        let thread_id = data.get("thread_id").cloned().unwrap_or(Json::Null);
        let index = match thread_index(&threads, &thread_id) {
            Some(index) => index,
            None => {
                let thread = json!({
                    "id": format!("thread_{}", py_string(&thread_id)),
                    "thread_id": thread_id,
                    "title": thread_id,
                    "participants": [],
                    "avatar_path": "/icon.png",
                    "messages": [],
                });
                threads.push(thread);
                threads.len() - 1
            }
        };

        let mut message = Map::new();
        let artifact_id = artifact.get("id").cloned().unwrap_or(Json::Null);
        message.insert("id".into(), artifact_id.clone());
        message.insert(
            "message_id".into(),
            data.get("message_id")
                .filter(|value| truthy(value))
                .cloned()
                .unwrap_or(artifact_id),
        );
        message.insert("thread_id".into(), thread_id);
        message.insert(
            "sender".into(),
            data.get("sender").cloned().unwrap_or_else(|| json!("?")),
        );
        message.insert(
            "kind".into(),
            data.get("kind").cloned().unwrap_or_else(|| json!("text")),
        );
        message.insert(
            "body_md".into(),
            data.get("body_md").cloned().unwrap_or_else(|| json!("")),
        );
        message.insert(
            "timestamp".into(),
            data.get("timestamp").cloned().unwrap_or_else(|| json!("")),
        );
        for (key, value) in data {
            if !MESSAGE_KEYS_EXCLUDED.contains(&key.as_str()) {
                message.insert(key.clone(), value.clone());
            }
        }
        threads[index]["messages"]
            .as_array_mut()
            .expect("materialized messages are an array")
            .push(Json::Object(message));
    }

    for thread in &mut threads {
        if let Some(messages) = thread["messages"].as_array_mut() {
            messages.sort_by(|left, right| timestamp_key(left).cmp(timestamp_key(right)));
        }
    }
    threads
}

fn timestamp_key(value: &Json) -> &str {
    value
        .get("timestamp")
        .filter(|timestamp| truthy(timestamp))
        .and_then(Json::as_str)
        .unwrap_or("")
}

fn object_field(value: &Json, key: &str) -> Map<String, Json> {
    value
        .get(key)
        .and_then(Json::as_object)
        .cloned()
        .unwrap_or_default()
}

fn thread_index(threads: &[Json], thread_id: &Json) -> Option<usize> {
    threads
        .iter()
        .position(|thread| thread.get("thread_id") == Some(thread_id))
}

fn upsert_thread(threads: &mut Vec<Json>, thread_id: Json, thread: Json) {
    if let Some(index) = thread_index(threads, &thread_id) {
        threads[index] = thread;
    } else {
        threads.push(thread);
    }
}

fn insert_by_id(artifacts: &mut Vec<Json>, positions: &mut HashMap<Json, usize>, artifact: Json) {
    let id = artifact.get("id").cloned().unwrap_or(Json::Null);
    if let Some(index) = positions.get(&id).copied() {
        artifacts[index] = artifact;
    } else {
        positions.insert(id, artifacts.len());
        artifacts.push(artifact);
    }
}

fn truthy(value: &Json) -> bool {
    match value {
        Json::Null => false,
        Json::Bool(value) => *value,
        Json::Number(value) => value.as_f64().is_some_and(|number| number != 0.0),
        Json::String(value) => !value.is_empty(),
        Json::Array(value) => !value.is_empty(),
        Json::Object(value) => !value.is_empty(),
    }
}

fn py_string(value: &Json) -> String {
    match value {
        Json::Null => "None".into(),
        Json::Bool(true) => "True".into(),
        Json::Bool(false) => "False".into(),
        Json::String(value) => value.clone(),
        _ => value.to_string(),
    }
}

fn fallback_threads() -> Vec<Json> {
    json!([
        {
            "id": "thread_nori",
            "thread_id": "nori",
            "title": "Nori",
            "participants": ["nori", "operator"],
            "avatar_path": "/icon.png",
            "status": "online",
            "messages": [{
                "id": "msg_01",
                "message_id": "msg_01",
                "thread_id": "nori",
                "sender": "nori",
                "kind": "text",
                "body_md": "操作员，听到我这边的信号了吗？全部功能都已解锁就绪啦！",
                "timestamp": "2026-08-26T10:00:00Z"
            }]
        },
        {
            "id": "thread_alert",
            "thread_id": "system_alert",
            "title": "System Dispatcher",
            "participants": ["system", "operator"],
            "avatar_path": "/inori-logo.png",
            "status": "offline",
            "messages": [{
                "id": "msg_02",
                "message_id": "msg_02",
                "thread_id": "system_alert",
                "sender": "system",
                "kind": "text",
                "body_md": "[Security Link] Terminal heartbeat active.",
                "timestamp": "2026-08-26T09:50:00Z"
            }]
        }
    ])
    .as_array()
    .expect("fallback threads are an array")
    .clone()
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn real_pack() -> LivePack {
        LivePack::from_value(
            serde_json::from_str(
                &std::fs::read_to_string(concat!(
                    env!("CARGO_MANIFEST_DIR"),
                    "/../../../backend/data/live_world_pack.json"
                ))
                .unwrap(),
            )
            .unwrap(),
        )
    }

    #[test]
    fn apps_messenger_demo_leads_with_nori_and_preserves_artifact_shapes() {
        let pack = LivePack::empty();
        let threads = thread_artifacts(&pack, 1_700_000_000_000);
        assert_eq!(threads.len(), 2);
        assert_eq!(threads[0]["data"]["thread_id"], "nori");
        assert_eq!(threads[0]["id"], "thread_nori");
        assert_eq!(threads[0]["surfacedAt"], 1_699_996_400_000_i64);

        let messages = message_artifacts(&pack, 1_700_000_000_000);
        assert_eq!(messages.len(), 2);
        assert_eq!(messages[0]["type"], "signal_message");
        assert_eq!(messages[0]["data"]["thread_id"], "nori");
        assert_eq!(messages[0]["surfacedAt"], 1_699_999_940_000_i64);
        assert_eq!(messages[1]["id"], "msg_02");
    }

    #[test]
    fn apps_messenger_archive_artifacts_keep_pack_order_and_materialized_messages_sort() {
        let pack = real_pack();
        assert_eq!(thread_artifacts(&pack, 0), pack.signal_thread_artifacts());
        assert_eq!(message_artifacts(&pack, 0), pack.signal_message_artifacts());

        let threads = materialize_threads(&pack);
        assert_eq!(threads[0]["thread_id"], "daniel");
        let timestamps: Vec<&str> = threads[0]["messages"]
            .as_array()
            .unwrap()
            .iter()
            .map(timestamp_key)
            .collect();
        let mut sorted = timestamps.clone();
        sorted.sort_unstable();
        assert_eq!(timestamps, sorted);
    }

    #[test]
    fn apps_messenger_adds_message_only_threads_to_archive_artifacts() {
        let pack = LivePack::from_value(json!({
            "signal_thread_artifacts": [],
            "signal_message_artifacts": [{
                "id": "message-x",
                "type": "signal_message",
                "data": {"thread_id": "x", "message_id": "mx", "timestamp": "2026-01-01"}
            }]
        }));
        let threads = thread_artifacts(&pack, 1_700_000_000_000);
        assert_eq!(threads.len(), 1);
        assert_eq!(threads[0]["id"], "thread_x");
        assert_eq!(threads[0]["data"]["thread_id"], "x");
        assert_eq!(message_artifacts(&pack, 0).len(), 1);
    }
}

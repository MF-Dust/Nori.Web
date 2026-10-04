use crate::cartridge::{CommandRejected, ReducerResult};
use crate::jsonutil::{now_ms, Json};
use serde_json::{json, Map, Value};

const EMOTIONS: &[&str] = &[
    "happy", "excited", "sad", "angry", "fearful", "disgusted", "surprised", "doubtful", "dizzy", "serious", "neutral",
];

pub fn initial_state(pack_available: bool) -> Json {
    json!({
        "operations": {},
        "nextMessageId": 1,
        "turn": {"operationId": Value::Null, "phase": "idle", "outcome": Value::Null},
        "presentationMode": if pack_available { "text" } else { "audio" },
    })
}

fn idle_turn() -> Json {
    json!({"operationId": Value::Null, "phase": "idle", "outcome": Value::Null})
}

fn new_operation(actor: &str) -> Json {
    json!({
        "revealedThrough": -1,
        "startedThrough": -1,
        "presentedThrough": -1,
        "lastRevealedBlockIsSpeech": false,
        "pendingBlocks": {},
        "pendingStarted": {},
        "pendingPresented": {},
        "ingestingActor": actor,
    })
}

fn append_lines(state: &mut Json, events: &[Json]) {
    if events.is_empty() {
        return;
    }
    let mut lines = state.get("lines").and_then(Value::as_array).cloned().unwrap_or_default();
    for event in events {
        let kind = event.get("type").and_then(Value::as_str).unwrap_or("");
        if kind != "player_message" && kind != "agent_message" {
            continue;
        }
        let mut line = event.as_object().cloned().unwrap_or_default();
        line.remove("type");
        line.insert(
            "sender".into(),
            json!(if kind == "player_message" { "player" } else { "agent" }),
        );
        lines.push(Value::Object(line));
    }
    if lines.len() >= 200 {
        lines = lines.split_off(50);
    }
    state["lines"] = Value::Array(lines);
}

fn advance_contiguous(mut current: i64, target: i64, pending: &mut Map<String, Value>) -> i64 {
    if target <= current {
        return current;
    }
    pending.insert(target.to_string(), json!(true));
    while pending.get(&(current + 1).to_string()).is_some() {
        pending.remove(&(current + 1).to_string());
        current += 1;
    }
    current
}

fn flush_presented(operation: &mut Map<String, Value>) {
    loop {
        let presented = operation.get("presentedThrough").and_then(|v| v.as_i64()).unwrap_or(-1);
        let started = operation.get("startedThrough").and_then(|v| v.as_i64()).unwrap_or(-1);
        let next = presented + 1;
        let pending = operation
            .get("pendingPresented")
            .and_then(Value::as_object)
            .is_some_and(|p| p.contains_key(&next.to_string()));
        if !(pending && next <= started) {
            break;
        }
        if let Some(Value::Object(map)) = operation.get_mut("pendingPresented") {
            map.remove(&next.to_string());
        }
        operation.insert("presentedThrough".into(), json!(next));
    }
}

fn reveal_available(state: &mut Json, operation: &mut Map<String, Value>) -> Vec<Json> {
    let mut events = Vec::new();
    let mode = state.get("presentationMode").and_then(Value::as_str).unwrap_or("audio").to_string();
    loop {
        let cut = operation.get("cutBlockId").and_then(|v| v.as_i64());
        let revealed = operation.get("revealedThrough").and_then(|v| v.as_i64()).unwrap_or(-1);
        if cut.is_some_and(|c| revealed >= c) {
            break;
        }
        let block_id = revealed + 1;
        let block = operation
            .get("pendingBlocks")
            .and_then(Value::as_object)
            .and_then(|p| p.get(&block_id.to_string()))
            .cloned();
        let Some(block) = block else { break };
        let is_speech = block.get("isSpeech").and_then(Value::as_bool).unwrap_or(false);
        let started = operation.get("startedThrough").and_then(|v| v.as_i64()).unwrap_or(-1);
        if is_speech && mode == "audio" && started < block_id {
            break;
        }
        if is_speech && mode == "text" && started < block_id {
            operation.insert("startedThrough".into(), json!(block_id));
        }
        if let Some(Value::Object(pending)) = operation.get_mut("pendingBlocks") {
            pending.remove(&block_id.to_string());
        }
        operation.insert("revealedThrough".into(), json!(block_id));
        operation.insert("lastRevealedBlockIsSpeech".into(), json!(is_speech));
        let mut event = json!({
            "type": if operation.get("ingestingActor").and_then(Value::as_str) == Some("player") { "player_message" } else { "agent_message" },
            "messageId": block.get("messageId").cloned().unwrap_or(Value::Null),
            "blockId": block_id,
            "content": block.get("content").cloned().unwrap_or(Value::Null),
            "createdAt": now_ms(),
            "isSpeech": is_speech,
            "blockType": block.get("blockType").cloned().unwrap_or(Value::Null),
        });
        if let Some(emotion) = block.get("emotion") {
            if !emotion.is_null() {
                event["emotion"] = emotion.clone();
            }
        }
        events.push(event);
        if !is_speech || mode == "text" {
            let presented = operation.get("presentedThrough").and_then(|v| v.as_i64()).unwrap_or(-1);
            operation.insert("presentedThrough".into(), json!(presented.max(block_id)));
        }
        if !is_speech {
            let started = operation.get("startedThrough").and_then(|v| v.as_i64()).unwrap_or(-1);
            let pending = operation
                .entry("pendingStarted")
                .or_insert_with(|| json!({}))
                .as_object_mut()
                .cloned()
                .unwrap_or_default();
            let mut pending = pending;
            let next = advance_contiguous(started, block_id, &mut pending);
            operation.insert("pendingStarted".into(), Value::Object(pending));
            operation.insert("startedThrough".into(), json!(next));
        }
    }
    events
}

pub fn sanitize_player_text(text: &Value) -> Result<String, CommandRejected> {
    let Some(text) = text.as_str() else {
        return Err(CommandRejected::new("text must be a string"));
    };
    let mut normalized = String::new();
    let mut space = false;
    for ch in text.chars() {
        if ch == '\r' || ch == '\n' || ch == '\u{2028}' || ch == '\u{2029}' || (ch.is_control() && ch != '\t' && ch <= '\u{1f}') || ch == '\u{7f}' {
            if !space && !normalized.is_empty() {
                normalized.push(' ');
                space = true;
            }
            continue;
        }
        if ch.is_whitespace() {
            if !space && !normalized.is_empty() {
                normalized.push(' ');
                space = true;
            }
            continue;
        }
        space = false;
        normalized.push(ch);
    }
    let normalized = normalized.trim().to_string();
    if normalized.is_empty() || normalized.chars().count() > 100 {
        return Err(CommandRejected::new("player text must be sanitized and at most 100 characters"));
    }
    Ok(normalized)
}

pub fn reduce(state: &Json, actor: &str, cmd: &Json) -> Result<ReducerResult, CommandRejected> {
    let command_type = cmd.get("type").and_then(Value::as_str).unwrap_or("");
    let mut state = state.clone();
    match command_type {
        "playerMessage" => {
            if actor != "player" {
                return Err(CommandRejected::new("Only player may send playerMessage"));
            }
            let text = sanitize_player_text(cmd.get("text").unwrap_or(&Value::Null))?;
            let next_id = state.get("nextMessageId").and_then(|v| v.as_i64()).unwrap_or(1);
            let message_id = format!("msg_{next_id}");
            let event = json!({"type": "player_message", "messageId": message_id, "content": text, "createdAt": now_ms()});
            state["nextMessageId"] = json!(next_id + 1);
            append_lines(&mut state, std::slice::from_ref(&event));
            Ok(ReducerResult::new(state, json!({"messageId": message_id}), vec![event]))
        }
        "agentMessage" => {
            if actor != "agent" {
                return Err(CommandRejected::new("Only agent may send agentMessage"));
            }
            let Some(text) = cmd.get("text").and_then(Value::as_str) else {
                return Err(CommandRejected::new("text must be a string"));
            };
            let next_id = state.get("nextMessageId").and_then(|v| v.as_i64()).unwrap_or(1);
            let message_id = format!("msg_{next_id}");
            let event = json!({"type": "agent_message", "messageId": message_id, "content": text, "createdAt": now_ms()});
            state["nextMessageId"] = json!(next_id + 1);
            append_lines(&mut state, std::slice::from_ref(&event));
            Ok(ReducerResult::new(state, json!({"messageId": message_id}), vec![event]))
        }
        "setPresentationMode" => {
            let mode = cmd.get("presentationMode").and_then(Value::as_str).unwrap_or("");
            if mode != "audio" && mode != "text" {
                return Err(CommandRejected::new("presentationMode must be audio or text"));
            }
            if state.get("presentationMode").and_then(Value::as_str) == Some(mode) {
                return Ok(ReducerResult::ok(state, json!({"presentationMode": mode})));
            }
            state["presentationMode"] = json!(mode);
            let mut revealed = Vec::new();
            if mode == "text" {
                let ids: Vec<String> = state
                    .get("operations")
                    .and_then(Value::as_object)
                    .map(|m| m.keys().cloned().collect())
                    .unwrap_or_default();
                for id in ids {
                    let Some(op) = state.pointer_mut(&format!("/operations/{id}")) else {
                        continue;
                    };
                    if let Some(map) = op.as_object_mut() {
                        map.insert("pendingStarted".into(), json!({}));
                        map.insert("pendingPresented".into(), json!({}));
                        let started = map.get("startedThrough").and_then(|v| v.as_i64()).unwrap_or(-1);
                        let presented = map.get("presentedThrough").and_then(|v| v.as_i64()).unwrap_or(-1);
                        let started = started.max(presented);
                        map.insert("startedThrough".into(), json!(started));
                        map.insert("presentedThrough".into(), json!(presented.max(started)));
                    }
                    let op = state.pointer_mut(&format!("/operations/{id}")).cloned().unwrap_or(json!({}));
                    let mut op_map = op.as_object().cloned().unwrap_or_default();
                    revealed.extend(reveal_available(&mut state, &mut op_map));
                    state["operations"][id] = Value::Object(op_map);
                }
            }
            append_lines(&mut state, &revealed);
            Ok(ReducerResult::new(state, json!({"presentationMode": mode}), revealed))
        }
        "ingestBlock" => ingest_block(&mut state, actor, cmd),
        "audioStarted" | "audioDone" => audio_progress(&mut state, cmd, command_type),
        "operationStarted" => {
            let Some(operation_id) = cmd.get("operationId").and_then(Value::as_str) else {
                return Err(CommandRejected::new("operationId is required"));
            };
            let turn = json!({"operationId": operation_id, "phase": "executing", "outcome": Value::Null});
            state["turn"] = turn.clone();
            Ok(ReducerResult::ok(state, json!({"turn": turn})))
        }
        "operationCompleted" | "operationSettled" => settle_turn(&mut state, cmd, command_type),
        "applyCut" => apply_cut(&mut state, actor, cmd),
        _ => Err(CommandRejected::new(format!("Unknown chat command: {command_type}"))),
    }
}

fn ingest_block(state: &mut Json, actor: &str, cmd: &Json) -> Result<ReducerResult, CommandRejected> {
    let operation_id = cmd.get("operationId").and_then(Value::as_str);
    let message_id = cmd.get("messageId").and_then(Value::as_str);
    let block_id = cmd.get("blockId").and_then(|v| if v.is_boolean() { None } else { v.as_i64() });
    let content = cmd.get("content").and_then(Value::as_str);
    let block_type = cmd.get("blockType").and_then(Value::as_str);
    let is_speech = cmd.get("isSpeech").and_then(Value::as_bool);
    let (Some(operation_id), Some(message_id), Some(block_id), Some(content), Some(block_type), Some(is_speech)) =
        (operation_id, message_id, block_id, content, block_type, is_speech)
    else {
        return Err(CommandRejected::new("Invalid ingestBlock payload"));
    };
    if block_id < 0 {
        return Err(CommandRejected::new("Invalid ingestBlock payload"));
    }
    let emotion = cmd.get("emotion");
    if let Some(emotion) = emotion {
        if !emotion.is_null() && !EMOTIONS.contains(&emotion.as_str().unwrap_or("")) {
            return Err(CommandRejected::new("Invalid emotion"));
        }
    }
    if state.pointer(&format!("/operations/{operation_id}")).is_none() {
        state["operations"][operation_id] = new_operation(actor);
    }
    let cut = state
        .pointer(&format!("/operations/{operation_id}/cutBlockId"))
        .and_then(|v| v.as_i64());
    if cut.is_some_and(|c| block_id > c) {
        return Ok(ReducerResult::ok(state.clone(), json!({"revealedBlockIds": []})));
    }
    let revealed = state
        .pointer(&format!("/operations/{operation_id}/revealedThrough"))
        .and_then(|v| v.as_i64())
        .unwrap_or(-1);
    let pending_has = state
        .pointer(&format!("/operations/{operation_id}/pendingBlocks/{}", block_id))
        .is_some();
    if block_id > revealed && !pending_has {
        let mut block = json!({
            "messageId": message_id,
            "blockId": block_id,
            "blockType": block_type,
            "content": content,
            "isSpeech": is_speech,
        });
        if let Some(emotion) = emotion {
            if emotion.is_string() {
                block["emotion"] = emotion.clone();
            }
        }
        state["operations"][operation_id]["pendingBlocks"][block_id.to_string()] = block;
    }
    let op = state["operations"][operation_id].clone();
    let mut op_map = op.as_object().cloned().unwrap_or_default();
    let events = reveal_available(state, &mut op_map);
    state["operations"][operation_id] = Value::Object(op_map);
    append_lines(state, &events);
    let ids: Vec<Json> = events.iter().filter_map(|e| e.get("blockId").cloned()).collect();
    Ok(ReducerResult::new(state.clone(), json!({"revealedBlockIds": ids}), events))
}

fn audio_progress(state: &mut Json, cmd: &Json, command_type: &str) -> Result<ReducerResult, CommandRejected> {
    let operation_id = cmd.get("operationId").and_then(Value::as_str);
    let block_id = cmd.get("blockId").and_then(|v| if v.is_boolean() { None } else { v.as_i64() });
    let (Some(operation_id), Some(block_id)) = (operation_id, block_id) else {
        return Err(CommandRejected::new(format!("Invalid {command_type} payload")));
    };
    let key = if command_type == "audioStarted" { "startedThrough" } else { "presentedThrough" };
    if state.pointer(&format!("/operations/{operation_id}")).is_none() {
        return Ok(ReducerResult::ok(state.clone(), json!({key: -1})));
    }
    let cut = state.pointer(&format!("/operations/{operation_id}/cutBlockId")).and_then(|v| v.as_i64());
    if cut.is_some_and(|c| block_id > c) {
        let current = state.pointer(&format!("/operations/{operation_id}/{key}")).cloned().unwrap_or(json!(-1));
        return Ok(ReducerResult::ok(state.clone(), json!({key: current})));
    }
    let mut op = state["operations"][operation_id].as_object().cloned().unwrap_or_default();
    let started = op.get("startedThrough").and_then(|v| v.as_i64()).unwrap_or(-1);
    let mut pending = op.get("pendingStarted").and_then(Value::as_object).cloned().unwrap_or_default();
    let next = advance_contiguous(started, block_id, &mut pending);
    op.insert("pendingStarted".into(), Value::Object(pending));
    op.insert("startedThrough".into(), json!(next));
    flush_presented(&mut op);
    if command_type == "audioDone" {
        let presented = op.get("presentedThrough").and_then(|v| v.as_i64()).unwrap_or(-1);
        if block_id > presented {
            op.entry("pendingPresented")
                .or_insert_with(|| json!({}))
                .as_object_mut()
                .map(|m| m.insert(block_id.to_string(), json!(true)));
            flush_presented(&mut op);
        }
    }
    let events = reveal_available(state, &mut op);
    let result_value = op.get(key).cloned().unwrap_or(json!(-1));
    state["operations"][operation_id] = Value::Object(op);
    append_lines(state, &events);
    Ok(ReducerResult::new(state.clone(), json!({key: result_value}), events))
}

fn settle_turn(state: &mut Json, cmd: &Json, command_type: &str) -> Result<ReducerResult, CommandRejected> {
    let operation_id = cmd.get("operationId").and_then(Value::as_str);
    let outcome = cmd.get("outcome").and_then(Value::as_str).unwrap_or("");
    let Some(operation_id) = operation_id else {
        return Err(CommandRejected::new(format!("Invalid {command_type} payload")));
    };
    if !matches!(outcome, "completed" | "partial" | "aborted" | "error") {
        return Err(CommandRejected::new(format!("Invalid {command_type} payload")));
    }
    let current = state.pointer("/turn/operationId");
    let matches_turn = current.is_none()
        || current.is_some_and(|v| v.is_null())
        || current.and_then(Value::as_str) == Some(operation_id);
    if matches_turn {
        state["turn"] = if command_type == "operationCompleted" {
            json!({"operationId": operation_id, "phase": "presenting", "outcome": outcome})
        } else {
            idle_turn()
        };
    }
    Ok(ReducerResult::ok(state.clone(), json!({"turn": state["turn"].clone()})))
}

fn apply_cut(state: &mut Json, actor: &str, cmd: &Json) -> Result<ReducerResult, CommandRejected> {
    let operation_id = cmd.get("operationId").and_then(Value::as_str);
    let proposed = cmd.get("proposedCut").and_then(|v| if v.is_boolean() { None } else { v.as_i64() });
    let (Some(operation_id), Some(proposed)) = (operation_id, proposed) else {
        return Err(CommandRejected::new("Invalid applyCut payload"));
    };
    let missing = state.pointer(&format!("/operations/{operation_id}")).is_none();
    let turn_id = state.pointer("/turn/operationId").and_then(Value::as_str);
    if missing && turn_id != Some(operation_id) {
        return Ok(ReducerResult::ok(state.clone(), json!({"cutBlockId": proposed})));
    }
    if missing {
        state["operations"][operation_id] = new_operation(actor);
    }
    let existing = state.pointer(&format!("/operations/{operation_id}/cutBlockId")).and_then(|v| v.as_i64());
    let cut = existing.map(|e| e.min(proposed)).unwrap_or(proposed);
    state["operations"][operation_id]["cutBlockId"] = json!(cut);
    if let Some(Value::Object(pending)) = state["operations"][operation_id].get_mut("pendingBlocks") {
        pending.retain(|key, _| key.parse::<i64>().unwrap_or(0) <= cut);
    }
    Ok(ReducerResult::ok(state.clone(), json!({"cutBlockId": cut})))
}

pub fn history(state: &Json) -> Vec<Json> {
    let mut out = Vec::new();
    let Some(lines) = state.get("lines").and_then(Value::as_array) else {
        return out;
    };
    for line in lines.iter().rev().take(12).collect::<Vec<_>>().into_iter().rev() {
        let Some(content) = line.get("content").and_then(Value::as_str) else {
            continue;
        };
        let role = if line.get("sender").and_then(Value::as_str) == Some("agent") {
            "assistant"
        } else {
            "user"
        };
        out.push(json!({"role": role, "content": content}));
    }
    out
}

pub fn build_agent_turn(reply: &str, emotion: &str) -> (String, String, Vec<Json>) {
    let operation_id = crate::jsonutil::uuid4();
    let message_id = crate::jsonutil::uuid4();
    let emotion = if EMOTIONS.contains(&emotion) { emotion } else { "neutral" };
    let commands = vec![
        json!({"type": "operationStarted", "operationId": operation_id}),
        json!({
            "type": "ingestBlock",
            "operationId": operation_id,
            "messageId": message_id,
            "blockId": 0,
            "blockType": "text",
            "content": reply,
            "isSpeech": true,
            "emotion": emotion,
        }),
        json!({"type": "operationCompleted", "operationId": operation_id, "outcome": "completed"}),
    ];
    (operation_id, message_id, commands)
}

pub fn presentation_mode(state: &Json) -> &str {
    state.get("presentationMode").and_then(Value::as_str).unwrap_or("audio")
}

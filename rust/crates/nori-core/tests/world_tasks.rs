//! World + follow-up task behavior (Python `WorldSession` scheduling and the
//! Cloudflare pacing overrides in `cloudflare/entry.py`).

use nori_core::config::ServerAi;
use nori_core::live_pack::LivePack;
use nori_core::session;
use nori_core::tasks::{Pacing, Step, Task};
use nori_core::world::{Secrets, World};
use serde_json::{json, Value};
use std::sync::Arc;

#[derive(Debug, PartialEq)]
enum Seen {
    Sleep(u64),
    Broadcast(Vec<String>),
    Media(usize),
    Direct(String),
    Spawn(&'static str),
}

/// Run a task to completion without real I/O; spawned tasks are returned.
fn drive(task: &mut Task, world: &mut World) -> (Vec<Seen>, Vec<Task>) {
    let server = ServerAi::default();
    let mut seen = Vec::new();
    let mut spawned = Vec::new();
    for _ in 0..200 {
        match task.poll(world, &server, None) {
            Step::Sleep(ms) => seen.push(Seen::Sleep(ms)),
            Step::Broadcast(messages) => {
                seen.push(Seen::Broadcast(messages.iter().map(kind).collect()))
            }
            Step::Media(frame) => seen.push(Seen::Media(frame.len())),
            Step::Direct(message) => seen.push(Seen::Direct(kind(&message))),
            Step::Spawn(child) => {
                seen.push(Seen::Spawn(child.label()));
                spawned.push(child);
            }
            Step::Http(request) => panic!("unexpected HTTP request: {}", request.url),
            Step::Done => return (seen, spawned),
        }
    }
    panic!("task did not finish: {seen:?}");
}

fn kind(message: &Value) -> String {
    let base = message["type"].as_str().unwrap_or("?").to_string();
    match message
        .pointer("/transition/cmd/type")
        .and_then(Value::as_str)
    {
        Some(cmd) => format!("{base}:{cmd}"),
        None => base,
    }
}

fn world(pacing: Pacing, pack: LivePack) -> World {
    World::new(
        "guest_0123456789abcdef0123456789abcdef",
        Some("en"),
        true,
        Arc::new(pack),
    )
    .with_pacing(pacing)
}

fn chat_dispatch(world: &World, text: &str) -> Value {
    json!({
        "type": "dispatch",
        "actor": "player",
        "cartridgeId": "chat",
        "requestId": "r1",
        "expectedHeadVersion": world.cartridge("chat").unwrap().head_version,
        "cmd": {"type": "playerMessage", "text": text},
    })
}

#[test]
fn local_chat_reply_keeps_presentation_delays_and_tone_fallback() {
    let mut world = world(Pacing::Local, LivePack::empty());
    let message = chat_dispatch(&world, "hello");
    let out = session::handle(&mut world, &message, &Secrets::default());
    assert_eq!(out.direct.len(), 1);
    assert_eq!(out.direct[0]["type"], "dispatch_ack");
    assert_eq!(out.tasks.len(), 1);
    let mut reply = out.tasks.into_iter().next().unwrap();
    let (seen, spawned) = drive(&mut reply, &mut world);
    assert_eq!(seen[0], Seen::Sleep(150));
    let Seen::Broadcast(kinds) = &seen[1] else {
        panic!("{seen:?}")
    };
    assert!(
        kinds.contains(&"runtime_transition:operationStarted".to_string()),
        "{kinds:?}"
    );
    assert!(
        kinds.contains(&"runtime_transition:ingestBlock".to_string()),
        "{kinds:?}"
    );
    assert_eq!(
        &seen[2..],
        &[Seen::Spawn("speak"), Seen::Spawn("ensure_chat_progress")]
    );

    let mut tasks = spawned.into_iter();
    let mut speak = tasks.next().unwrap();
    let (speech, _) = drive(&mut speak, &mut world);
    let frames = speech
        .iter()
        .filter(|s| matches!(s, Seen::Media(_)))
        .count();
    assert!((1..=12).contains(&frames));
    assert_eq!(
        speech.iter().filter(|s| **s == Seen::Sleep(140)).count(),
        frames,
        "sleep after every frame"
    );

    let mut progress = tasks.next().unwrap();
    let (steps, _) = drive(&mut progress, &mut world);
    assert_eq!(steps.first(), Some(&Seen::Sleep(1100)));
    let flat: Vec<String> = steps
        .iter()
        .filter_map(|s| match s {
            Seen::Broadcast(k) => Some(k.clone()),
            _ => None,
        })
        .flatten()
        .collect();
    assert!(
        flat.contains(&"runtime_transition:audioStarted".to_string()),
        "{flat:?}"
    );
    assert!(
        flat.contains(&"runtime_transition:audioDone".to_string()),
        "{flat:?}"
    );
    assert!(
        flat.contains(&"runtime_transition:operationSettled".to_string()),
        "{flat:?}"
    );
    assert!(steps.contains(&Seen::Sleep(450)) && steps.contains(&Seen::Sleep(100)));
}

#[test]
fn edge_text_mode_settles_inline_without_tones() {
    // Text presentation is the default when the archive is available.
    let pack = LivePack::from_value(json!({"world_id": "w", "facts": {}, "variables": {}}));
    let mut world = world(Pacing::Edge, pack);
    assert_eq!(
        world.cartridge("chat").unwrap().state["presentationMode"],
        "text"
    );
    let message = chat_dispatch(&world, "hello");
    let out = session::handle(&mut world, &message, &Secrets::default());
    let mut reply = out.tasks.into_iter().next().unwrap();
    let (seen, spawned) = drive(&mut reply, &mut world);
    assert!(spawned.is_empty(), "no speech without TTS: {seen:?}");
    assert!(
        !seen.iter().any(|s| matches!(s, Seen::Sleep(_))),
        "{seen:?}"
    );
    let Some(Seen::Broadcast(last)) = seen.last() else {
        panic!("{seen:?}")
    };
    assert_eq!(
        last,
        &vec![
            "runtime_transition".to_string() + ":operationSettled",
            "visibility_fence_advanced".to_string()
        ]
    );
}

#[test]
fn agent_turn_loops_are_deduplicated_per_cartridge() {
    let mut world = world(Pacing::Edge, LivePack::empty());
    let mount = json!({"type": "mount_cartridge", "cartridgeId": "chess", "requestId": "m1"});
    let out = session::handle(&mut world, &mount, &Secrets::default());
    assert_eq!(out.direct[0]["transition"], "created");
    let start = json!({
        "type": "dispatch", "actor": "player", "cartridgeId": "chess", "requestId": "s1",
        "expectedHeadVersion": 0, "cmd": {"type": "startGame", "mode": "normal", "side": "black", "difficulty": "casual"},
    });
    let out = session::handle(&mut world, &start, &Secrets::default());
    assert_eq!(out.direct[0]["success"], true, "{:?}", out.direct[0]);
    assert_eq!(out.tasks.len(), 1);
    let mut loop_task = out.tasks.into_iter().next().unwrap();
    // A second dispatch while the loop runs must not start another loop.
    let head = world.cartridge("chess").unwrap().head_version;
    let resign = json!({
        "type": "dispatch", "actor": "player", "cartridgeId": "chess", "requestId": "s2",
        "expectedHeadVersion": head, "cmd": {"type": "offerDraw"},
    });
    let again = session::handle(&mut world, &resign, &Secrets::default());
    assert!(again.tasks.is_empty());
    let (seen, _) = drive(&mut loop_task, &mut world);
    assert_eq!(
        seen.first(),
        Some(&Seen::Sleep(0)),
        "edge yields instead of sleeping 350 ms"
    );
    // White (agent) moved once, then it is the player's turn again.
    let game = &world.cartridge("chess").unwrap().state["gameState"];
    assert_eq!(
        game["moveHistory"].as_array().map(Vec::len),
        Some(1),
        "{game}"
    );
    // Loop finished, so a new player move schedules a new loop.
    let head = world.cartridge("chess").unwrap().head_version;
    let knight = json!({
        "type": "dispatch", "actor": "player", "cartridgeId": "chess", "requestId": "s3",
        "expectedHeadVersion": head, "cmd": {"type": "move", "from": "g8", "to": "f6"},
    });
    let out = session::handle(&mut world, &knight, &Secrets::default());
    assert_eq!(out.direct[0]["success"], true, "{:?}", out.direct[0]);
    assert_eq!(out.tasks.len(), 1);
}

#[test]
fn reset_replaces_world_and_replies_directly() {
    let mut world = world(Pacing::Local, LivePack::empty());
    let old = world.world_id.clone();
    world.locale = "zh-CN".into();
    let out = session::handle(
        &mut world,
        &json!({"type": "reset_my_web_world", "fullUnlock": false}),
        &Secrets::default(),
    );
    assert_ne!(world.world_id, old);
    assert_eq!(world.locale, "zh-CN", "keeps the previous locale");
    assert!(!world.full_unlock);
    assert!(out.broadcast.is_empty());
    assert!(out.force_persist);
    let kinds: Vec<&str> = out
        .direct
        .iter()
        .map(|m| m["type"].as_str().unwrap())
        .collect();
    assert_eq!(kinds, ["web_world_reset_ack", "world_created"]);
    assert_eq!(out.direct[1]["session"], json!({"isAdmin": true}));
}

#[test]
fn story_open_does_not_broadcast_due_fact_transitions() {
    let mut world = World::new("guest_x", None, false, Arc::new(LivePack::empty()));
    let out = session::handle(
        &mut world,
        &json!({"type": "open_my_web_world", "fullUnlock": false}),
        &Secrets::default(),
    );
    assert!(out.broadcast.is_empty());
    assert_eq!(out.direct[0]["type"], "world_joined");
    let facts = world.cartridge("manifold.web").unwrap().state["facts"]
        .as_object()
        .unwrap()
        .clone();
    assert!(facts.contains_key("session.ready"), "{facts:?}");
}

#[test]
fn frame_pipeline_strips_credentials_and_applies_story_cookie() {
    let raw = json!({
        "type": "dispatch", "actor": "player", "cartridgeId": "chat", "requestId": "r",
        "expectedHeadVersion": 0, "cmd": {"type": "playerMessage", "text": "hi"},
        "noriAiConfig": {"enabled": true, "apiKey": "sk-secret", "baseUrl": "https://api.example.test/v1"},
    })
    .to_string();
    let (message, secrets) = session::prepare(&raw, Some(false)).unwrap();
    assert!(message.get("noriAiConfig").is_none());
    assert_eq!(secrets.ai.as_ref().unwrap()["apiKey"], "sk-secret");
    let (open, _) = session::prepare(r#"{"type":"open_my_web_world"}"#, Some(false)).unwrap();
    assert_eq!(open["fullUnlock"], false);
    let (explicit, _) = session::prepare(
        r#"{"type":"open_my_web_world","fullUnlock":true}"#,
        Some(false),
    )
    .unwrap();
    assert_eq!(explicit["fullUnlock"], true);
    assert_eq!(
        session::prepare("nope", None).unwrap_err()["message"],
        "Invalid JSON"
    );
    assert_eq!(
        session::prepare("[]", None).unwrap_err()["message"],
        "message must be an object"
    );
}

//! World + follow-up task behavior (Python `WorldSession` scheduling and the
//! Cloudflare pacing overrides in `cloudflare/entry.py`).

use nori_core::cartridges::codenames;
use nori_core::config::ServerAi;
use nori_core::live_pack::LivePack;
use nori_core::tasks::{Pacing, Step, Task};
use nori_core::world::{Outbound, Secrets, World};
use nori_core::{session, snapshot};
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
fn duplicate_chat_dispatch_replays_ack_without_reply_or_speech() {
    let mut world = world(Pacing::Local, LivePack::empty());
    let mut message = chat_dispatch(&world, "hello");
    let out = session::handle(&mut world, &message, &Secrets::default());
    assert_eq!(out.tasks.len(), 1);
    let ack = out.direct.clone();
    let state = snapshot::world_snapshot(&world);
    // Outbox replay may retain the old head or rebuild it after reconnecting.
    for head in [0, world.cartridge("chat").unwrap().head_version] {
        message["expectedHeadVersion"] = json!(head);
        let replay = session::handle(&mut world, &message, &Secrets::default());
        assert_eq!(replay.direct, ack);
        assert!(replay.broadcast.is_empty() && replay.tasks.is_empty());
        assert_eq!(snapshot::world_snapshot(&world), state);
    }
    // Durable Object hibernation must not lose the deduplication record.
    let mut restored = snapshot::world_from_snapshot(&state, world.pack.clone()).unwrap();
    let replay = session::handle(&mut restored, &message, &Secrets::default());
    assert_eq!(replay.direct, ack);
    assert!(replay.broadcast.is_empty() && replay.tasks.is_empty());
    let mut reply = out.tasks.into_iter().next().unwrap();
    let (_, spawned) = drive(&mut reply, &mut world);
    assert_eq!(spawned.iter().filter(|task| task.label() == "speak").count(), 1);
    let replay = session::handle(&mut world, &message, &Secrets::default());
    assert_eq!(replay.direct, ack);
    assert!(replay.tasks.is_empty());
}

#[test]
fn dispatch_deduplication_is_bounded_and_rejections_can_retry() {
    use nori_core::jsonutil::with_now_ms;
    use nori_core::world::{DISPATCH_ACK_TTL_MS, MAX_DISPATCH_ACKS};
    with_now_ms(1_000, || {
        let mut world = world(Pacing::Edge, LivePack::empty());
        let mut message = chat_dispatch(&world, "hello");
        message["expectedHeadVersion"] = json!(999);
        assert_eq!(session::handle(&mut world, &message, &Secrets::default()).direct[0]["success"], false);
        message["expectedHeadVersion"] = json!(0);
        let out = session::handle(&mut world, &message, &Secrets::default());
        assert_eq!(out.direct[0]["success"], true);
        for index in 0..MAX_DISPATCH_ACKS {
            let head = world.cartridge("chat").unwrap().head_version;
            let command = json!({"type":"dispatch", "actor":"player", "cartridgeId":"chat",
                "requestId":format!("mode-{index}"), "expectedHeadVersion":head,
                "cmd":{"type":"setPresentationMode", "presentationMode":"text"}});
            assert_eq!(session::handle(&mut world, &command, &Secrets::default()).direct[0]["success"], true);
        }
        let state = snapshot::world_snapshot(&world);
        assert_eq!(state["dispatchAcks"].as_array().unwrap().len(), MAX_DISPATCH_ACKS);
        assert!(!state["dispatchAcks"].as_array().unwrap().iter().any(|entry| entry["request_id"] == "r1"));
        with_now_ms(1_000 + DISPATCH_ACK_TTL_MS, || {
            assert!(snapshot::world_snapshot(&world).get("dispatchAcks").is_none());
            let restored = snapshot::world_from_snapshot(&state, world.pack.clone()).unwrap();
            assert!(snapshot::world_snapshot(&restored).get("dispatchAcks").is_none());
        });
        let mut fresh = World::new(world.owner_id.clone(), None, true, world.pack.clone());
        assert_eq!(session::handle(&mut fresh, &message, &Secrets::default()).tasks.len(), 1);
    });
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

fn codenames_dispatch(world: &mut World, cmd: Value) -> Outbound {
    codenames_dispatch_as(world, "player", cmd)
}

fn codenames_dispatch_as(world: &mut World, actor: &str, cmd: Value) -> Outbound {
    let message = json!({
        "type": "dispatch", "actor": actor, "cartridgeId": "codenames", "requestId": nori_core::jsonutil::uuid4(),
        "expectedHeadVersion": world.cartridge("codenames").unwrap().head_version,
        "cmd": cmd,
    });
    session::handle(world, &message, &Secrets::default())
}

fn codenames_world() -> World {
    let mut world = world(Pacing::Edge, LivePack::empty());
    session::handle(
        &mut world,
        &json!({"type": "mount_cartridge", "cartridgeId": "codenames", "requestId": "m"}),
        &Secrets::default(),
    );
    let out = codenames_dispatch(
        &mut world,
        json!({"type": "startGame", "settings": {"seed": 42, "tokens": 9, "wordLocale": "en"}}),
    );
    assert_eq!(out.direct[0]["success"], true, "{:?}", out.direct);
    assert!(out.tasks.is_empty(), "the player gives the first clue");
    world
}

/// Inspect every embedded game: patches, results, restore echoes and snapshots.
fn assert_client_codenames(value: &Value, full: &Value, known: &[(usize, &str)]) {
    match value {
        Value::Object(object) => {
            assert!(!object.contains_key("seed"), "replay seed leaked: {value}");
            if let Some(keys) = object.get("key") {
                let human = full["counterpartSide"].as_str().unwrap();
                let opponent = full["agentSide"].as_str().unwrap();
                assert_eq!(keys[human], full["gameState"]["key"][human]);
                if value["phase"] == "GAME_OVER" {
                    assert_eq!(keys, &full["gameState"]["key"]);
                } else {
                    let roles = keys[opponent].as_array().unwrap();
                    assert_eq!(roles.len(), 25);
                    for (index, role) in roles.iter().enumerate() {
                        if let Some((_, revealed)) = known.iter().find(|(cell, _)| *cell == index) {
                            assert!(
                                role.is_null() || role == *revealed,
                                "wrong reveal: {index}: {role}"
                            );
                        } else {
                            assert!(
                                role.is_null(),
                                "unrevealed opponent role leaked: {index}: {role}"
                            );
                        }
                    }
                }
                for side in ["A", "B"] {
                    let count = (0..25)
                        .filter(|&index| {
                            full["gameState"]["key"][side][index] == "AGENT"
                                && value["cells"][index]["solvedBy"].is_null()
                        })
                        .count();
                    assert_eq!(value["remainingTargets"][side], count);
                }
            }
            for child in object.values() {
                assert_client_codenames(child, full, known);
            }
        }
        Value::Array(items) => {
            for item in items {
                assert_client_codenames(item, full, known);
            }
        }
        _ => {}
    }
}

fn assert_codenames_outbound(out: &Outbound, full: &Value, known: &[(usize, &str)]) {
    for message in out.direct.iter().chain(&out.broadcast) {
        assert_client_codenames(message, full, known);
    }
}

#[test]
fn codenames_outbound_redaction_keeps_private_save_round_trips() {
    let mut world = codenames_world();
    // Changing settings exercises the /settings patch as well as the command echo.
    let start = codenames_dispatch(
        &mut world,
        json!({"type": "startGame", "settings": {"seed": 7}}),
    );
    let full = world.cartridge("codenames").unwrap().state.clone();
    assert_codenames_outbound(&start, &full, &[]);
    assert_client_codenames(&world.world_payload(), &full, &[]);
    for entry in [
        "mount_cartridge",
        "create_world",
        "join_world",
        "open_my_web_world",
    ] {
        let message = json!({"type": entry, "cartridgeId": "codenames", "requestId": "snap", "worldId": world.world_id});
        let out = session::handle(&mut world, &message, &Secrets::default());
        assert_codenames_outbound(&out, &full, &[]);
    }
    let clue = codenames_dispatch(
        &mut world,
        json!({"type": "submitClue", "clue": {"word": "NORI", "count": 1}}),
    );
    assert_codenames_outbound(&clue, &full, &[]);
    assert_eq!(
        clue.direct[0]["result"]["newState"]["key"]["B"],
        json!(vec![Value::Null; 25])
    );

    let saved = snapshot::world_snapshot(&world);
    let private = world.cartridge("codenames").unwrap().state.clone();
    assert_eq!(saved["cartridges"]["codenames"]["state"], private);
    assert_eq!(private["settings"]["seed"], 7);
    let restored = snapshot::world_from_snapshot(&saved, world.pack.clone()).unwrap();
    assert_eq!(restored.cartridge("codenames").unwrap().state, private);
    assert_eq!(
        codenames::agent_next_command(&private),
        codenames::agent_next_command(&restored.cartridge("codenames").unwrap().state)
    );
    assert_client_codenames(&restored.world_payload(), &private, &[]);
    assert_eq!(
        snapshot::restore_cartridge("codenames", &saved["cartridges"]["codenames"], &world.pack)
            .unwrap()
            .state,
        private
    );

    // A browser snapshot is not a usable private save.
    let mut redacted_save = saved;
    redacted_save["cartridges"]["codenames"]["state"] =
        world.cartridge("codenames").unwrap().snapshot("ui")["state"].clone();
    assert!(
        snapshot::world_from_snapshot(&redacted_save, world.pack.clone())
            .unwrap()
            .cartridge("codenames")
            .is_none()
    );
    assert!(snapshot::restore_cartridge(
        "codenames",
        &redacted_save["cartridges"]["codenames"],
        &world.pack
    )
    .is_none());
}

#[test]
fn codenames_only_reveals_the_guessed_key_until_game_over() {
    let mut world = codenames_world();
    let full = world.cartridge("codenames").unwrap().state.clone();
    codenames_dispatch(
        &mut world,
        json!({"type": "submitClue", "clue": {"word": "NORI", "count": 1}}),
    );
    let shared = (0..25)
        .find(|&i| {
            full["gameState"]["key"]["A"][i] == "AGENT"
                && full["gameState"]["key"]["B"][i] == "AGENT"
        })
        .unwrap();
    let agent_guess = codenames_dispatch_as(
        &mut world,
        "agent",
        json!({"type": "submitGuess", "cell": shared}),
    );
    // Nori flipped the player's key, not Nori's own key, even on a shared treasure.
    assert_codenames_outbound(&agent_guess, &full, &[]);
    assert!(agent_guess.direct[0]["result"]["gameStateAfter"]["key"]["B"][shared].is_null());
    codenames_dispatch_as(&mut world, "agent", json!({"type": "endTurn"}));
    let clue = codenames_dispatch_as(
        &mut world,
        "agent",
        json!({"type": "submitClue", "clue": {"word": "VALID", "count": 2}}),
    );
    assert_codenames_outbound(&clue, &full, &[]);
    let treasure = (0..25)
        .find(|&i| i != shared && full["gameState"]["key"]["B"][i] == "AGENT")
        .unwrap();
    let berry = (0..25)
        .find(|&i| full["gameState"]["key"]["B"][i] == "BYSTANDER")
        .unwrap();
    let guess = codenames_dispatch(&mut world, json!({"type": "submitGuess", "cell": treasure}));
    assert_eq!(guess.direct[0]["success"], true);
    assert_codenames_outbound(&guess, &full, &[(treasure, "AGENT")]);
    assert!(guess.direct[0]["result"]["gameStateBefore"]["key"]["B"][treasure].is_null());
    assert_eq!(
        guess.direct[0]["result"]["gameStateAfter"]["key"]["B"][treasure],
        "AGENT"
    );
    let guess = codenames_dispatch(&mut world, json!({"type": "submitGuess", "cell": berry}));
    let known = [(treasure, "AGENT"), (berry, "BYSTANDER")];
    assert_codenames_outbound(&guess, &full, &known);
    assert_eq!(
        guess.direct[0]["result"]["gameStateAfter"]["key"]["B"][berry],
        "BYSTANDER"
    );
    assert_client_codenames(&world.world_payload(), &full, &known);

    codenames_dispatch(
        &mut world,
        json!({"type": "submitClue", "clue": {"word": "NORI", "count": 1}}),
    );
    let next = (0..25)
        .find(|&i| i != shared && i != treasure && full["gameState"]["key"]["A"][i] == "AGENT")
        .unwrap();
    codenames_dispatch_as(
        &mut world,
        "agent",
        json!({"type": "submitGuess", "cell": next}),
    );
    codenames_dispatch_as(&mut world, "agent", json!({"type": "endTurn"}));
    codenames_dispatch_as(
        &mut world,
        "agent",
        json!({"type": "submitClue", "clue": {"word": "VALID", "count": 1}}),
    );
    let monster = (0..25)
        .find(|&i| full["gameState"]["key"]["B"][i] == "ASSASSIN")
        .unwrap();
    let ended = codenames_dispatch(&mut world, json!({"type": "submitGuess", "cell": monster}));
    assert_eq!(ended.direct[0]["success"], true);
    assert_codenames_outbound(&ended, &full, &known);
    assert_eq!(
        ended.direct[0]["result"]["gameStateAfter"]["phase"],
        "GAME_OVER"
    );
    assert_eq!(
        ended.direct[0]["result"]["gameStateAfter"]["key"],
        full["gameState"]["key"]
    );
    assert_client_codenames(&world.world_payload(), &full, &known);
}

#[test]
fn codenames_restore_requires_player_and_valid_full_state() {
    let mut world = codenames_world();
    let full = world.cartridge("codenames").unwrap().state.clone();
    let head = world.cartridge("codenames").unwrap().head_version;
    for actor in ["agent", "system", "unknown"] {
        let out =
            codenames_dispatch_as(&mut world, actor, json!({"type": "restore", "state": full}));
        assert_eq!(out.direct[0]["success"], false);
        assert_eq!(out.direct[0]["error"], "Only player may restore");
        assert!(out.broadcast.is_empty() && out.tasks.is_empty());
        assert_eq!(world.cartridge("codenames").unwrap().head_version, head);
        assert_eq!(world.cartridge("codenames").unwrap().state, full);
    }
    let mut bad = vec![
        json!({}),
        world.cartridge("codenames").unwrap().snapshot("ui")["state"].clone(),
    ];
    for (pointer, value) in [
        ("/agentSide", json!("A")),
        ("/settings/tokens", json!(8)),
        ("/gameState/board", json!([])),
        ("/gameState/key/B/0", json!("UNKNOWN")),
        ("/gameState/cells/0/bystanderMarks", json!([null])),
        ("/gameState/cells/0/solvedBy", json!("X")),
        ("/gameState/phase", json!("OTHER")),
        ("/gameState/tokensRemaining", json!(-1)),
        (
            "/gameState/history",
            json!([{ "clueGiver": "B", "clue": {"word": "NORI", "count": 1}, "guesses": [{"cell": 25, "result": "AGENT", "at": 0}], "endedBy": null }]),
        ),
        ("/tutorial", json!({"step": "unknown"})),
    ] {
        let mut invalid = full.clone();
        *invalid.pointer_mut(pointer).unwrap() = value;
        bad.push(invalid);
    }
    for invalid in bad {
        let out = codenames_dispatch(&mut world, json!({"type": "restore", "state": invalid}));
        assert_eq!(
            out.direct[0]["success"], false,
            "accepted invalid save: {invalid}"
        );
        assert!(out.broadcast.is_empty() && out.tasks.is_empty());
        assert_eq!(world.cartridge("codenames").unwrap().head_version, head);
        assert_eq!(world.cartridge("codenames").unwrap().state, full);
    }
    codenames_dispatch(
        &mut world,
        json!({"type": "startGame", "settings": {"seed": 7}}),
    );
    let out = codenames_dispatch(&mut world, json!({"type": "restore", "state": full}));
    assert_eq!(out.direct[0]["success"], true);
    assert_eq!(world.cartridge("codenames").unwrap().state, full);
    assert_codenames_outbound(&out, &full, &[]); // Including transition.cmd.state.

    let mut swapped = full;
    swapped["counterpartSide"] = json!("B");
    swapped["agentSide"] = json!("A");
    let out = codenames_dispatch(&mut world, json!({"type": "restore", "state": swapped}));
    assert_eq!(out.direct[0]["success"], true);
    assert_codenames_outbound(&out, &swapped, &[]);
    assert!(out.broadcast[0]["transition"]["patches"]
        .as_array()
        .unwrap()
        .iter()
        .any(|patch| patch["path"] == "/gameState"));
    assert_client_codenames(&world.world_payload(), &swapped, &[]);
}

#[test]
fn dropped_or_panicking_agent_tasks_release_their_loop_lease() {
    for panic in [false, true] {
        let mut world = codenames_world();
        let mut out = codenames_dispatch(
            &mut world,
            json!({"type": "submitClue", "clue": {"word": "NORI", "count": 1}}),
        );
        let task = out.tasks.pop().unwrap();
        let message =
            json!({"type": "mount_cartridge", "cartridgeId": "codenames", "requestId": "resume"});
        assert!(session::handle(&mut world, &message, &Secrets::default())
            .tasks
            .is_empty());
        let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(move || {
            let _running_task = task;
            if panic {
                panic!("simulated executor panic");
            }
        }));
        assert_eq!(result.is_err(), panic);
        let mut resumed = session::handle(&mut world, &message, &Secrets::default());
        assert_eq!(
            resumed.tasks.len(),
            1,
            "a dropped task must not deadlock its app"
        );
        drive(&mut resumed.tasks.pop().unwrap(), &mut world);
    }
}

#[test]
fn old_agent_task_completion_does_not_clear_a_remounted_apps_loop() {
    let mut world = codenames_world();
    let mut old = codenames_dispatch(
        &mut world,
        json!({"type": "submitClue", "clue": {"word": "NORI", "count": 1}}),
    )
    .tasks
    .pop()
    .unwrap();
    session::handle(
        &mut world,
        &json!({"type": "unmount_cartridge", "cartridgeId": "codenames", "requestId": "u"}),
        &Secrets::default(),
    );
    session::handle(
        &mut world,
        &json!({"type": "mount_cartridge", "cartridgeId": "codenames", "requestId": "m"}),
        &Secrets::default(),
    );
    let saved = codenames::reduce(
        &codenames::initial_state(),
        "player",
        &json!({"type": "startGame", "settings": {"seed": 7}}),
    )
    .unwrap()
    .state;
    let saved = codenames::reduce(
        &saved,
        "player",
        &json!({"type": "submitClue", "clue": {"word": "NORI", "count": 1}}),
    )
    .unwrap()
    .state;
    let mut new = codenames_dispatch(&mut world, json!({"type": "restore", "state": saved}))
        .tasks
        .pop()
        .unwrap();
    drive(&mut old, &mut world);
    world
        .dispatch_internal(
            "codenames",
            "player",
            &json!({"type": "restore", "state": saved}),
        )
        .unwrap();
    // The older task may finish its work, but must not remove the newer lease.
    let duplicate = session::handle(
        &mut world,
        &json!({"type": "mount_cartridge", "cartridgeId": "codenames", "requestId": "again"}),
        &Secrets::default(),
    );
    assert!(duplicate.tasks.is_empty());
    drive(&mut new, &mut world);
}

#[test]
fn codenames_clue_counts_end_agent_turns_and_games_do_not_stall() {
    for count in [json!(1), json!(3), json!(9), json!(0), json!("infinity")] {
        for all_correct in [false, true] {
            let mut world = codenames_world();
            if all_correct {
                // A restored board with only treasures guarantees long guessing
                // runs, including >8 actions and the voluntary endTurn path.
                world.cartridge_mut("codenames").unwrap().state["gameState"]["key"] =
                    json!({"A": vec!["AGENT"; 25], "B": vec!["AGENT"; 25]});
            }
            for _ in 0..80 {
                let state = &world.cartridge("codenames").unwrap().state;
                let game = &state["gameState"];
                if game["phase"] == "GAME_OVER" {
                    break;
                }
                let turn = game["history"].as_array().unwrap().last();
                let open = turn.is_some_and(|turn| turn["endedBy"].is_null());
                let command = if game["phase"] == "NORMAL" && !open {
                    assert_eq!(
                        game["whoseTurnToGive"], "A",
                        "agent failed to give a clue: {game}"
                    );
                    json!({"type": "submitClue", "clue": {"word": "NORI", "count": count}})
                } else if game["phase"] == "NORMAL"
                    && !turn.unwrap()["guesses"].as_array().unwrap().is_empty()
                {
                    assert_eq!(
                        turn.unwrap()["clueGiver"],
                        "B",
                        "agent turn is still open: {game}"
                    );
                    json!({"type": "endTurn"})
                } else {
                    if game["phase"] == "NORMAL" {
                        assert_eq!(
                            turn.unwrap()["clueGiver"],
                            "B",
                            "agent turn is still open: {game}"
                        );
                    }
                    // The test player chooses a treasure to exercise more turns.
                    let index = game["cells"]
                        .as_array()
                        .unwrap()
                        .iter()
                        .enumerate()
                        .find(|(index, cell)| {
                            cell["solvedBy"].is_null() && game["key"]["B"][*index] == "AGENT"
                        })
                        .map(|(index, _)| index)
                        .expect("player must have a legal guess");
                    json!({"type": "submitGuess", "cell": index})
                };
                let out = codenames_dispatch(&mut world, command);
                assert_eq!(out.direct[0]["success"], true, "{:?}", out.direct);
                for mut task in out.tasks {
                    let (_, spawned) = drive(&mut task, &mut world);
                    assert!(spawned.is_empty());
                }
                let state = &world.cartridge("codenames").unwrap().state;
                let game = &state["gameState"];
                for turn in game["history"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .filter(|turn| turn["clueGiver"] == "A")
                {
                    let guesses = turn["guesses"].as_array().unwrap().len();
                    if let Some(limit) = count.as_u64().filter(|count| *count > 0) {
                        assert!(guesses as u64 <= limit, "{turn}");
                    }
                    assert!(guesses > 0);
                    assert!(
                        !turn["endedBy"].is_null() || game["phase"] == "GAME_OVER",
                        "stuck guessing: {game}"
                    );
                }
                if let Some(command) = codenames::agent_next_command(state) {
                    assert!(
                        codenames::reduce(state, "agent", &command).is_err(),
                        "task dropped a legal action: {command}"
                    );
                }
            }
            let game = &world.cartridge("codenames").unwrap().state["gameState"];
            assert_eq!(game["phase"], "GAME_OVER", "stalled: {game}");
            if all_correct {
                assert_eq!(game["winner"], "TEAM");
                let first = &game["history"][0];
                assert_eq!(
                    first["guesses"].as_array().unwrap().len() as u64,
                    count.as_u64().filter(|count| *count > 0).unwrap_or(25)
                );
                if count.as_u64().is_some_and(|count| count > 0) {
                    assert_eq!(first["endedBy"], "VOLUNTARY_END");
                    assert_eq!(game["history"][1]["clueGiver"], "B");
                }
            }
        }
    }
}

#[test]
fn codenames_cannot_submit_another_clue_while_guessing_is_open() {
    let mut world = codenames_world();
    let out = codenames_dispatch(
        &mut world,
        json!({"type": "submitClue", "clue": {"word": "NORI", "count": 2}}),
    );
    assert_eq!(out.tasks.len(), 1);
    let before = world.cartridge("codenames").unwrap().state.clone();
    let head = world.cartridge("codenames").unwrap().head_version;
    let again = codenames_dispatch(
        &mut world,
        json!({"type": "submitClue", "clue": {"word": "VALID", "count": 1}}),
    );
    assert_eq!(again.direct[0]["success"], false);
    assert_eq!(again.direct[0]["error"], "Current turn has not ended");
    assert!(again.tasks.is_empty());
    assert_eq!(world.cartridge("codenames").unwrap().state, before);
    assert_eq!(world.cartridge("codenames").unwrap().head_version, head);
    for mut task in out.tasks {
        drive(&mut task, &mut world);
    }
}

#[test]
fn codenames_remount_and_join_resume_pending_agent_turns_once() {
    for entry in ["mount_cartridge", "join_world", "open_my_web_world"] {
        let mut world = codenames_world();
        // Internal dispatches model a persisted pending turn with no live task.
        world
            .dispatch_internal(
                "codenames",
                "player",
                &json!({"type": "submitClue", "clue": {"word": "NORI", "count": 1}}),
            )
            .unwrap();
        let index = world.cartridge("codenames").unwrap().state["gameState"]["key"]["A"]
            .as_array()
            .unwrap()
            .iter()
            .position(|role| role == "AGENT")
            .unwrap();
        world
            .dispatch_internal(
                "codenames",
                "agent",
                &json!({"type": "submitGuess", "cell": index}),
            )
            .unwrap();
        let message = json!({"type": entry, "cartridgeId": "codenames", "requestId": "reload", "worldId": world.world_id});
        let out = session::handle(&mut world, &message, &Secrets::default());
        assert_eq!(out.tasks.len(), 1, "{entry}");
        if entry == "mount_cartridge" {
            assert_eq!(out.direct[0]["transition"], "already_mounted");
        }
        let duplicate = session::handle(&mut world, &message, &Secrets::default());
        assert!(duplicate.tasks.is_empty(), "deduplicate {entry}");
        let mut task = out.tasks.into_iter().next().unwrap();
        drive(&mut task, &mut world);
        let state = &world.cartridge("codenames").unwrap().state;
        assert_eq!(state["gameState"]["history"][0]["endedBy"], "VOLUNTARY_END");
        assert_eq!(state["gameState"]["history"][1]["clueGiver"], "B");
        assert!(codenames::agent_next_command(state).is_none());
    }
}

#[test]
fn codenames_rejected_guess_recovers_with_end_turn() {
    let mut world = codenames_world();
    world
        .dispatch_internal(
            "codenames",
            "player",
            &json!({"type": "submitClue", "clue": {"word": "NORI", "count": 9}}),
        )
        .unwrap();
    let index = world.cartridge("codenames").unwrap().state["gameState"]["key"]["A"]
        .as_array()
        .unwrap()
        .iter()
        .position(|role| role == "AGENT")
        .unwrap();
    world
        .dispatch_internal(
            "codenames",
            "agent",
            &json!({"type": "submitGuess", "cell": index}),
        )
        .unwrap();
    // A malformed restored board makes the next guess fail after selection.
    let board = world.cartridge("codenames").unwrap().state["gameState"]["board"].clone();
    world.cartridge_mut("codenames").unwrap().state["gameState"]["board"] = json!([]);
    assert!(world.agent_step("codenames").is_some());
    assert_eq!(
        world.cartridge("codenames").unwrap().state["gameState"]["history"][0]["endedBy"],
        "VOLUNTARY_END"
    );
    world.cartridge_mut("codenames").unwrap().state["gameState"]["board"] = board;
    let mut task = Task::agent_turns(&world, Pacing::Edge, "codenames".into());
    drive(&mut task, &mut world);
    let state = &world.cartridge("codenames").unwrap().state;
    assert_eq!(state["gameState"]["history"][1]["clueGiver"], "B");
    assert!(codenames::agent_next_command(state).is_none());
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

fn pictionary_dispatch(world: &mut World, cmd: Value) -> Outbound {
    let message = json!({
        "type": "dispatch", "actor": "player", "cartridgeId": "pictionary", "requestId": nori_core::jsonutil::uuid4(),
        "expectedHeadVersion": world.cartridge("pictionary").unwrap().head_version,
        "cmd": cmd,
    });
    session::handle(world, &message, &Secrets::default())
}

#[test]
fn pictionary_nori_guesses_without_reading_the_secret_word() {
    use nori_core::cartridges::pictionary;
    let mut world = world(Pacing::Edge, LivePack::empty());
    session::handle(
        &mut world,
        &json!({"type": "mount_cartridge", "cartridgeId": "pictionary", "requestId": "m"}),
        &Secrets::default(),
    );
    let out = pictionary_dispatch(
        &mut world,
        json!({"type": "startSession", "atMs": 0, "settings": {"locale": "en", "sessionDurationMs": 600_000}}),
    );
    assert_eq!(out.direct[0]["success"], true, "{:?}", out.direct);
    // The player draws first, so Nori starts guessing; a second dispatch does not double it.
    assert_eq!(out.tasks.len(), 1);
    assert_eq!(out.tasks[0].label(), "pictionary_guess");
    let again = pictionary_dispatch(
        &mut world,
        json!({"type": "submitStrokeBatch", "atMs": 1, "batch": [{}]}),
    );
    assert!(again.tasks.is_empty());

    // Changing the secret word must not change Nori's guesses: it never reads it.
    let state = world.cartridge("pictionary").unwrap().state.clone();
    let round_id = state["gameState"]["round"]["roundId"]
        .as_str()
        .unwrap()
        .to_string();
    let mut decoy = state.clone();
    decoy["gameState"]["round"]["word"] = json!("zzz");
    decoy["gameState"]["round"]["drawingId"] = json!("zzz");
    decoy["gameState"]["round"]["synonyms"] = json!(["zzz"]);
    let mut tried = Vec::new();
    for _ in 0..pictionary::AGENT_GUESS_LIMIT {
        let real = pictionary::agent_guess(&state, &round_id, &tried, 5).unwrap();
        assert_eq!(
            Some(&real),
            pictionary::agent_guess(&decoy, &round_id, &tried, 5).as_ref()
        );
        tried.push(real["text"].as_str().unwrap().to_string());
    }
    assert_eq!(
        pictionary::agent_guess(&state, &round_id, &tried, 5),
        None,
        "bounded per round"
    );

    let mut task = out.tasks.into_iter().next().unwrap();
    let server = ServerAi::default();
    assert!(matches!(task.poll(&mut world, &server, None), Step::Sleep(9_000)));
    let Step::Broadcast(messages) = task.poll(&mut world, &server, None) else { panic!("expected canvas request") };
    assert_eq!(messages[0]["channel"], "pictionary.snapshot.request");
    assert_eq!(messages[0]["payload"], json!({"roundId":round_id}));
    assert!(world.cartridge("pictionary").unwrap().state["gameState"]["round"]["lastGuess"].is_null(), "no random guess without an image");
    assert!(matches!(task.poll(&mut world, &server, None), Step::Sleep(7_000)));
    pictionary_dispatch(&mut world, json!({"type":"skipRound","atMs":2}));
    assert!(matches!(task.poll(&mut world, &server, None), Step::Done));
}

#[test]
fn pictionary_next_round_starts_a_guesser_only_when_nori_guesses() {
    let mut world = world(Pacing::Edge, LivePack::empty());
    session::handle(
        &mut world,
        &json!({"type": "mount_cartridge", "cartridgeId": "pictionary", "requestId": "m"}),
        &Secrets::default(),
    );
    pictionary_dispatch(
        &mut world,
        json!({"type": "startSession", "atMs": 0, "settings": {"sessionDurationMs": 600_000}}),
    );
    // Round 1: player draws. Skip it; round 2 has Nori drawing, so no guesser.
    let out = pictionary_dispatch(&mut world, json!({"type": "skipRound", "atMs": 1}));
    let mut next = out
        .tasks
        .into_iter()
        .find(|t| t.label() == "pictionary_next_round")
        .unwrap();
    let (_, spawned) = drive(&mut next, &mut world);
    let round = &world.cartridge("pictionary").unwrap().state["gameState"]["round"];
    assert_eq!(round["roles"]["drawer"], "agent");
    // Nori draws, so no guesser: only the player's hint giver starts.
    let labels: Vec<_> = spawned.iter().map(Task::label).collect();
    assert_eq!(labels, ["pictionary_hint"]);
    // Round 3: the player draws again and Nori's guesser is spawned with the new round.
    let out = pictionary_dispatch(&mut world, json!({"type": "skipRound", "atMs": 2}));
    let mut next = out
        .tasks
        .into_iter()
        .find(|t| t.label() == "pictionary_next_round")
        .unwrap();
    let (seen, spawned) = drive(&mut next, &mut world);
    assert_eq!(
        world.cartridge("pictionary").unwrap().state["gameState"]["round"]["roles"]["drawer"],
        "player"
    );
    assert_eq!(
        seen.last(),
        Some(&Seen::Spawn("pictionary_guess")),
        "{seen:?}"
    );
    assert_eq!(spawned.len(), 1);
}

#[test]
fn pictionary_player_never_receives_the_answer_while_guessing() {
    let mut world = world(Pacing::Edge, LivePack::empty());
    session::handle(
        &mut world,
        &json!({"type": "mount_cartridge", "cartridgeId": "pictionary", "requestId": "m"}),
        &Secrets::default(),
    );
    pictionary_dispatch(
        &mut world,
        json!({"type": "startSession", "atMs": 0, "settings": {"sessionDurationMs": 600_000, "locale": "en"}}),
    );
    // Round 2 is Nori's drawing for the player to guess.
    let out = pictionary_dispatch(&mut world, json!({"type": "skipRound", "atMs": 1}));
    let mut next = out
        .tasks
        .into_iter()
        .find(|t| t.label() == "pictionary_next_round")
        .unwrap();
    let mut sent: Vec<Value> = Vec::new();
    let server = ServerAi::default();
    let mut hint = loop {
        match next.poll(&mut world, &server, None) {
            Step::Broadcast(messages) => sent.extend(messages),
            Step::Spawn(task) => break task,
            Step::Sleep(_) => {}
            other => panic!("unexpected step {other:?}"),
        }
    };
    assert_eq!(hint.label(), "pictionary_hint");
    let round = world.cartridge("pictionary").unwrap().state["gameState"]["round"].clone();
    let word = round["word"].as_str().unwrap().to_string();
    let drawing_id = round["drawingId"].as_str().unwrap().to_string();

    let snapshot = world.cartridge("pictionary").unwrap().snapshot("ui");
    let visible = &snapshot["state"]["gameState"]["round"];
    assert!(visible.get("word").is_none() && visible.get("drawingId").is_none());
    assert!(visible.get("synonyms").is_none() && visible.get("pinyin").is_none());
    assert_eq!(visible["hint"]["revealed"], 0);
    assert!(!visible["hint"]["text"].as_str().unwrap().is_empty());
    assert!(!visible["noriDrawings"].as_array().unwrap().is_empty());
    sent.push(snapshot);

    // Hints are server-only: the browser cannot ask for one, even posing as Nori.
    for actor in ["player", "agent"] {
        let message = json!({
            "type": "dispatch", "actor": actor, "cartridgeId": "pictionary", "requestId": "h",
            "expectedHeadVersion": world.cartridge("pictionary").unwrap().head_version,
            "cmd": {"type": "revealHint", "roundId": round["roundId"]},
        });
        let out = session::handle(&mut world, &message, &Secrets::default());
        assert_eq!(out.direct[0]["success"], false, "{actor}");
    }

    let mut reveals = 0;
    for _ in 0..200 {
        match hint.poll(&mut world, &server, None) {
            Step::Sleep(ms) => assert!((1_200..=10_000).contains(&ms), "{ms}"),
            Step::Broadcast(messages) => {
                reveals += 1;
                sent.extend(messages);
            }
            Step::Done => break,
            other => panic!("unexpected step {other:?}"),
        }
    }
    assert!(reveals > 0);
    let visible = world.cartridge("pictionary").unwrap().snapshot("ui")["state"]["gameState"]
        ["round"]
        .clone();
    // Fully revealed, the hint spells the answer, yet the answer field itself never left.
    let spelled: String = word
        .to_uppercase()
        .chars()
        .filter(|c| !c.is_whitespace())
        .collect();
    let shown: String = visible["hint"]["text"]
        .as_str()
        .unwrap()
        .chars()
        .filter(|c| !c.is_whitespace())
        .collect();
    assert_eq!(shown, spelled);
    for message in &sent {
        let text = message.to_string();
        assert!(!text.contains(&format!("\"{word}\"")), "{text}");
        assert!(!text.contains(&format!("\"{drawing_id}\"")), "{text}");
    }

    // Once the round is over the answer is shown.
    pictionary_dispatch(&mut world, json!({"type": "skipRound", "atMs": 2}));
    let visible = world.cartridge("pictionary").unwrap().snapshot("ui")["state"]["gameState"]
        ["round"]
        .clone();
    assert_eq!(visible["word"], word);
    assert!(visible.get("hint").is_none());
}

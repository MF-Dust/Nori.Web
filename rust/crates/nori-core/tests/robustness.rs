//! Reducers run inside a Cloudflare Durable Object (wasm32, panic = abort):
//! no client input may make them panic. Python raised exceptions instead.

use nori_core::cartridge;
use nori_core::live_pack::LivePack;
use serde_json::{json, Value};
use std::panic::{catch_unwind, AssertUnwindSafe};

const COMMANDS: &[(&str, &[&str])] = &[
    (
        "chat",
        &[
            "playerMessage",
            "agentMessage",
            "setPresentationMode",
            "ingestBlock",
            "audioStarted",
            "audioDone",
            "operationStarted",
            "operationCompleted",
            "operationSettled",
            "applyCut",
            "nope",
        ],
    ),
    (
        "cakeduel",
        &[
            "startGame",
            "reset",
            "debugLoadScenario",
            "debugSetDealtCardGuarantee",
            "play",
            "nope",
        ],
    ),
    (
        "codenames",
        &[
            "startGame",
            "reset",
            "restore",
            "submitClue",
            "submitGuess",
            "endTurn",
            "tutorialLoadStage",
            "debugLoadScenario",
            "nope",
        ],
    ),
    (
        "chess",
        &[
            "startGame",
            "debugLoadScenario",
            "move",
            "resign",
            "offerDraw",
            "cancelDrawOffer",
            "respondDraw",
            "requestTakeback",
            "cancelTakebackRequest",
            "respondTakeback",
            "nope",
        ],
    ),
    (
        "pictionary",
        &[
            "startSession",
            "startNextRound",
            "submitStrokeBatch",
            "submitGuess",
            "skipRound",
            "noriRedraw",
            "forceEndSession",
            "nope",
        ],
    ),
];

const FIELDS: &[&str] = &[
    "text",
    "mode",
    "operationId",
    "messageId",
    "blockId",
    "content",
    "isSpeech",
    "emotion",
    "outcome",
    "actor",
    "difficulty",
    "side",
    "scenarioId",
    "scenario",
    "action",
    "settings",
    "locale",
    "seed",
    "clue",
    "cellIndex",
    "cell",
    "from",
    "to",
    "promotion",
    "accept",
    "plies",
    "atMs",
    "guess",
    "strokes",
    "batch",
    "state",
    "stage",
    "stageId",
    "word",
    "count",
    "index",
    "cards",
    "card",
    "target",
    "presentationMode",
];

fn weird_values() -> Vec<Value> {
    vec![
        Value::Null,
        json!(true),
        json!(-1),
        json!(0),
        json!(1e308),
        json!(-9223372036854775808i64),
        json!(18446744073709551615u64),
        json!(1.5),
        json!(""),
        json!("x"),
        json!("e2e4"),
        json!("\u{0663}"),
        json!("a".repeat(10_000)),
        json!([]),
        json!([1, "a", null, {}]),
        json!({}),
        json!({"type": "pass", "cards": [-1, 99], "index": -5}),
    ]
}

fn no_panic(id: &str, state: &Value, actor: &str, cmd: &Value, pack: &LivePack) {
    let outcome = catch_unwind(AssertUnwindSafe(|| {
        cartridge::reduce(id, state, actor, cmd, pack)
    }));
    assert!(outcome.is_ok(), "{id} panicked on actor={actor} cmd={cmd}");
}

/// States reached by plausible openings, so commands also hit "in game" code.
fn states(id: &str, pack: &LivePack) -> Vec<Value> {
    let mut out = Vec::new();
    let initial = cartridge::create(id, true, pack).unwrap().state;
    out.push(initial.clone());
    let openings = [
        json!({"type": "startGame", "mode": "normal", "side": "white", "difficulty": "casual"}),
        json!({"type": "startGame", "mode": "tutorial"}),
        json!({"type": "startGame", "settings": {"locale": "en"}}),
        json!({"type": "startSession", "atMs": 1000, "locale": "en"}),
        json!({"type": "debugLoadScenario", "scenarioId": "attack-phase"}),
    ];
    for opening in openings {
        if let Ok(result) = cartridge::reduce(id, &initial, "player", &opening, pack) {
            out.push(result.state);
        }
    }
    // Corrupted variants of every reachable state.
    let corrupted: Vec<Value> = out
        .iter()
        .flat_map(|state| {
            let keys: Vec<String> = state
                .as_object()
                .map(|m| m.keys().cloned().collect())
                .unwrap_or_default();
            keys.into_iter().flat_map(move |key| {
                [json!(null), json!(7), json!("s"), json!([]), json!({})]
                    .into_iter()
                    .map({
                        let state = state.clone();
                        move |junk| {
                            let mut copy = state.clone();
                            copy[&key] = junk;
                            copy
                        }
                    })
            })
        })
        .collect();
    out.extend(corrupted);
    out
}

fn sweep(full: bool) {
    let pack = LivePack::empty();
    let values = weird_values();
    let values: Vec<Value> = if full {
        values
    } else {
        values.into_iter().step_by(3).collect()
    };
    let actors: &[&str] = if full {
        &["player", "agent", "system"]
    } else {
        &["player", "agent"]
    };
    for (id, commands) in COMMANDS {
        let all_states = states(id, &pack);
        // Light mode: reachable states plus corruptions of the initial state only.
        let corrupted_initial = all_states
            .len()
            .min(6 + 5 * all_states[0].as_object().map(|m| m.len()).unwrap_or(0));
        let chosen: Vec<&Value> = if full {
            all_states.iter().collect()
        } else {
            all_states.iter().take(corrupted_initial).collect()
        };
        for state in chosen {
            for command in *commands {
                for actor in actors {
                    no_panic(id, state, actor, &json!({"type": command}), &pack);
                    for field in FIELDS {
                        for value in &values {
                            let cmd = json!({"type": command, (*field): value});
                            no_panic(id, state, actor, &cmd, &pack);
                        }
                    }
                }
            }
        }
    }
}

#[test]
fn reducers_never_panic_on_malformed_commands_or_state() {
    sweep(false);
}

/// Full matrix (~3 min in release): `cargo test --release -- --ignored`.
#[test]
#[ignore = "slow exhaustive sweep"]
fn reducers_never_panic_exhaustive() {
    sweep(true);
}

#[test]
fn agents_never_panic_on_corrupted_state() {
    let pack = LivePack::empty();
    for id in ["cakeduel", "codenames", "chess"] {
        for state in states(id, &pack) {
            let outcome = catch_unwind(AssertUnwindSafe(|| cartridge::agent_command(id, &state)));
            assert!(outcome.is_ok(), "{id} agent panicked on state {state}");
        }
    }
}

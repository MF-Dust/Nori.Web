//! Fresh-world progression and artifact visibility (Python `services/story.py`).

use crate::jsonutil::Json;
use crate::live_pack::LivePack;
use crate::llm::{py_string, truthy};
use crate::world::World;
use serde_json::{json, Value};
use std::collections::{BTreeMap, BTreeSet};

// Immediate cascades, like Python; the original system.tick delays were not archived.
const CASCADES: &[(&[&str], &[&str])] = &[
    (&["boot.completed"], &["mail.advisory.unlocked"]),
    (&["game.any.completed"], &["mail.help.unlocked"]),
    (&["corrupt.climax_pending"], &["corrupt.armed"]),
    (&["virus.cleared"], &["mail.act2_hinge.unlocked"]),
    (
        &["mail.act2_hinge.read"],
        &[
            "mail.cap_hint.unlocked",
            "driftnet.phase_mid",
            "pulse.phase_2",
        ],
    ),
    (&["arg.seal_released"], &["mail.log_sense.unlocked"]),
    (&["arg.cult_truth"], &["mail.log_field.unlocked"]),
    (&["daniel.retraction.downloaded"], &["dirt.daniel"]),
    (&["download.hanyue_consent"], &["dirt.hanyue_ssh"]),
    (&["futurum.doc2.downloaded"], &["dirt.futurum_aleph_obs"]),
    (&["arg.honeypot_access"], &["mail.log_encounter.unlocked"]),
    (
        &["mail.log_encounter.read"],
        &["mail.driftnet_leak.unlocked"],
    ),
    (&["qfr.installed"], &["daniel.deadman.delivered"]),
    (
        &[
            "gesture.chess",
            "gesture.codenames",
            "gesture.pictionary",
            "gesture.cakeduel",
        ],
        &["arg.gestures_complete"],
    ),
    (&["arg.gestures_complete"], &["mail.log_thoughts.unlocked"]),
    (
        &["arg.memory.shown"],
        &[
            "mail.futurum_threat.unlocked",
            "act3.void_open",
            "act3.paradigm_reveal.due",
        ],
    ),
    (
        &[
            "arg.memory.shown",
            "arg.manifold_unlocked",
            "idle.manifold_complete",
        ],
        &["recover.datasea_exe"],
    ),
    (&["arg.finale.shown"], &["arg.farewell.started"]),
    (
        &["arg.farewell.shown"],
        &[
            "arg.ending.started",
            "mail.nori_final.unlocked",
            "driftnet.phase_end",
            "meridian.phase_end",
            "pulse.phase_3",
        ],
    ),
];

pub const MAIL_GATE: &[(&str, &str)] = &[
    ("mail.advisory", "boot.completed"),
    ("mail.help", "mail.help.unlocked"),
    ("mail.unknown_2", "bookcipher.solved"),
    ("mail.act2_hinge", "mail.act2_hinge.unlocked"),
    ("mail.cap_hint", "mail.cap_hint.unlocked"),
    ("mail.log_sense", "mail.log_sense.unlocked"),
    ("mail.log_field", "mail.log_field.unlocked"),
    ("mail.log_encounter", "mail.log_encounter.unlocked"),
    ("mail.driftnet_leak", "mail.driftnet_leak.unlocked"),
    ("mail.log_thoughts", "mail.log_thoughts.unlocked"),
    ("mail.futurum_threat", "mail.futurum_threat.unlocked"),
    ("mail.nori_final", "mail.nori_final.unlocked"),
];

pub const FILE_GATE: &[(&str, &str)] = &[
    ("file.recovery_keys", "bookcipher.solved"),
    ("file.paper_pdf", "paper.downloaded"),
    ("file.qfr_exe", "qfr.downloaded"),
    ("file.daniel_retraction", "daniel.retraction.downloaded"),
    ("file.hanyue_consent", "download.hanyue_consent"),
    ("file.futurum_aleph_obs", "futurum.doc2.downloaded"),
    ("file.ft_clr_311", "futurum.doc1.downloaded"),
];

pub const BOUNTY_FACTS: &[&str] = &[
    "dirt.jack",
    "dirt.daniel",
    "dirt.frank",
    "dirt.maggie",
    "dirt.hanyue_ssh",
    "dirt.futurum_aleph_obs",
];

/// Python's has_fact is membership, including false/null records.
pub fn has_fact(facts: &Json, fact_id: &str) -> bool {
    facts
        .as_object()
        .is_some_and(|facts| facts.contains_key(fact_id))
}

fn compute(variables: &Json) -> f64 {
    let Some(idle) = variables.get("idle").filter(|idle| idle.is_object()) else {
        return 0.0;
    };
    let mut maximum = 0.0_f64;
    for source in [Some(idle), idle.get("prestige").filter(|v| v.is_object())]
        .into_iter()
        .flatten()
    {
        for key in ["maxCompute", "maxComputeThisRun"] {
            if let Some(value) = source.get(key).and_then(Value::as_f64) {
                maximum = maximum.max(value);
            }
        }
    }
    maximum
}

pub fn due_facts(world: &World) -> Vec<String> {
    let manifold = world.cartridge("manifold.web");
    let mut have = BTreeSet::new();
    if let Some(facts) = manifold
        .and_then(|c| c.state.get("facts"))
        .and_then(Value::as_object)
    {
        have.extend(facts.keys().cloned());
    }
    let maximum = manifold
        .and_then(|c| c.state.get("variables"))
        .map(compute)
        .unwrap_or(0.0);
    let games = game_done(world);
    let mut out = Vec::new();
    loop {
        let before = out.len();
        push_fact(&mut have, &mut out, "session.ready");
        if games.values().any(|v| *v) {
            push_fact(&mut have, &mut out, "game.any.completed");
        }
        for (game, fact) in [
            ("chess", "gesture.chess"),
            ("codenames", "gesture.codenames"),
            ("pictionary", "gesture.pictionary"),
            ("cakeduel", "gesture.cakeduel"),
        ] {
            if games.get(game) == Some(&true) {
                push_fact(&mut have, &mut out, fact);
            }
        }
        for (requires, emits) in CASCADES {
            if requires.iter().all(|id| have.contains(*id)) {
                for fact in *emits {
                    push_fact(&mut have, &mut out, fact);
                }
            }
        }
        if have.contains("bounty.ext_installed")
            && BOUNTY_FACTS.iter().filter(|id| have.contains(**id)).count() >= 5
        {
            push_fact(&mut have, &mut out, "arg.honeypot_access");
        }
        world.pack.with_section("file_artifacts", |artifacts| {
            for artifact in artifacts {
                let data = artifact.get("data");
                let fact = data
                    .and_then(|d| d.get("recover_when"))
                    .and_then(Value::as_str);
                let threshold = data
                    .and_then(|d| d.get("threshold"))
                    .and_then(Value::as_f64);
                if let (Some(fact), Some(threshold)) = (fact, threshold) {
                    if maximum >= threshold {
                        push_fact(&mut have, &mut out, fact);
                    }
                }
            }
        });
        if out.len() == before {
            break;
        }
    }
    out
}

fn push_fact(have: &mut BTreeSet<String>, out: &mut Vec<String>, id: &str) {
    if !id.is_empty() && have.insert(id.to_string()) {
        out.push(id.to_string());
    }
}

fn game_done(world: &World) -> BTreeMap<&'static str, bool> {
    let mut done = BTreeMap::from([
        ("chess", false),
        ("codenames", false),
        ("pictionary", false),
        ("cakeduel", false),
    ]);
    if let Some(status) = world
        .cartridge("chess")
        .and_then(|c| c.state.pointer("/gameState/status"))
        .and_then(Value::as_str)
    {
        done.insert("chess", !status.is_empty() && status != "playing");
    }
    if world
        .cartridge("codenames")
        .and_then(|c| c.state.pointer("/gameState/phase"))
        .and_then(Value::as_str)
        == Some("GAME_OVER")
    {
        done.insert("codenames", true);
    }
    if world
        .cartridge("cakeduel")
        .and_then(|c| c.state.pointer("/game/gameEnded"))
        .is_some_and(truthy)
    {
        done.insert("cakeduel", true);
    }
    if let Some(pic) = world.cartridge("pictionary") {
        let phase = pic
            .state
            .pointer("/gameState/phase")
            .and_then(Value::as_str);
        let solved = pic.state.pointer("/gameState/score/solved");
        // bool is an int in Python, but floating-point scores do not count.
        done.insert(
            "pictionary",
            phase == Some("RESULTS")
                || solved.is_some_and(|v| {
                    v.as_i64().is_some_and(|n| n > 0)
                        || v.as_u64().is_some_and(|n| n > 0)
                        || v == &json!(true)
                }),
        );
    }
    done
}

fn countersign(text: &str) -> bool {
    // Python re.I [a-z] also matches İ, ı, ſ and K. Literal s matches ſ.
    let letter = |c: char| c.is_ascii_alphabetic() || matches!(c, 'İ' | 'ı' | 'ſ' | 'K');
    let chars: Vec<char> = text.chars().collect();
    chars.windows(6).enumerate().any(|(i, window)| {
        window.iter().zip("pharos".chars()).all(|(c, expected)| {
            c.to_ascii_lowercase() == expected || (*c == 'ſ' && expected == 's')
        }) && !i
            .checked_sub(1)
            .and_then(|i| chars.get(i))
            .is_some_and(|c| letter(*c))
            && !chars.get(i + 6).is_some_and(|c| letter(*c))
    })
}

pub fn player_text(world: &mut World, text: &str) -> Vec<Json> {
    if world.full_unlock || !countersign(text) {
        return Vec::new();
    }
    let facts = world
        .cartridge("manifold.web")
        .and_then(|c| c.state.get("facts"));
    if !facts
        .and_then(|f| f.get("file.seal_config.read"))
        .is_some_and(truthy)
        || facts
            .and_then(|f| f.get("arg.seal_released"))
            .is_some_and(truthy)
    {
        return Vec::new();
    }
    // Unlike dispatch_internal, player_text only commits the seal; its caller
    // advances the story afterwards (and publishes that second transition).
    let pack = world.pack.clone();
    let commit = world.cartridge_mut("manifold.web").and_then(|c| c.dispatch("system", &json!({"type": "client.emitFact", "factId": "arg.seal_released", "source": "system.emitFact"}), &pack).ok());
    commit
        .map(|c| world.commit_messages("manifold.web", &c))
        .unwrap_or_default()
}

pub fn present_artifacts(artifacts: impl IntoIterator<Item = Json>, facts: &Json) -> Vec<Json> {
    artifacts
        .into_iter()
        .filter_map(
            |artifact| match artifact.get("type").and_then(Value::as_str) {
                Some("mail") if !mail_visible(&artifact, facts) => None,
                Some("app")
                    if artifact
                        .pointer("/data/available_when")
                        .is_some_and(|required| {
                            truthy(required)
                                && !required.as_str().is_some_and(|id| has_fact(facts, id))
                        }) =>
                {
                    None
                }
                Some("file") => present_file(artifact, facts),
                Some("signal_message") if !signal_visible(&artifact, facts) => None,
                _ => Some(artifact),
            },
        )
        .collect()
}

fn mail_visible(artifact: &Json, facts: &Json) -> bool {
    let id = artifact.get("id").and_then(Value::as_str).unwrap_or("");
    MAIL_GATE
        .iter()
        .find(|(key, _)| *key == id)
        .is_none_or(|(_, required)| has_fact(facts, required))
}

fn present_file(mut artifact: Json, facts: &Json) -> Option<Json> {
    let id = artifact.get("id").and_then(Value::as_str).unwrap_or("");
    if FILE_GATE
        .iter()
        .find(|(key, _)| *key == id)
        .is_some_and(|(_, gate)| !has_fact(facts, gate))
    {
        return None;
    }
    let path = artifact
        .pointer("/data/display_path")
        .and_then(Value::as_str)
        .unwrap_or("");
    if path.contains("训练日志/") && !has_fact(facts, "recover.trainlog") {
        return None;
    }
    if artifact
        .pointer("/data/recover_when")
        .and_then(Value::as_str)
        .is_some_and(|required| !required.is_empty() && !has_fact(facts, required))
    {
        if let Some(data) = artifact.get_mut("data").and_then(Value::as_object_mut) {
            for key in ["body_md", "asset_path", "binary_asset_path", "trainlog"] {
                data.remove(key);
            }
        }
    }
    Some(artifact)
}

fn signal_visible(artifact: &Json, facts: &Json) -> bool {
    if artifact.pointer("/data/thread_id").and_then(Value::as_str) != Some("daniel") {
        return true;
    }
    if artifact.pointer("/data/kind").and_then(Value::as_str) == Some("file") {
        return has_fact(facts, "daniel.evidence_unlocked");
    }
    if artifact
        .pointer("/data/timestamp")
        .and_then(Value::as_str)
        .is_some_and(|timestamp| !timestamp.is_empty())
    {
        return true;
    }
    has_fact(facts, "daniel.deadman.delivered")
}

pub fn recovery_password(pack: &LivePack, code: &str) -> Option<String> {
    let normalized: String = code
        .chars()
        .filter(char::is_ascii_alphanumeric)
        .map(|c| c.to_ascii_uppercase())
        .collect();
    if normalized.len() != 16 {
        return None;
    }
    let password = pack
        .variables()
        .get("signalTempPassword")
        .filter(|v| truthy(v))
        .map(py_string)
        .unwrap_or_default();
    if password.is_empty() {
        return None;
    }
    let found = pack.with_section("file_artifacts", |artifacts| {
        artifacts.iter().any(|artifact| {
            let body = artifact
                .pointer("/data/body_md")
                .filter(|v| truthy(v))
                .map(py_string)
                .unwrap_or_default()
                .to_uppercase();
            let mut next = 0;
            body.as_bytes()
                .windows(19)
                .enumerate()
                .any(|(start, candidate)| {
                    if start < next
                        || !candidate.iter().enumerate().all(|(i, c)| {
                            if matches!(i, 4 | 9 | 14) {
                                *c == b'-'
                            } else {
                                c.is_ascii_uppercase() || c.is_ascii_digit()
                            }
                        })
                    {
                        return false;
                    }
                    // re.findall consumes non-overlapping matches, even when the
                    // first matched code is not the code the client supplied.
                    next = start + 19;
                    candidate
                        .iter()
                        .copied()
                        .filter(|c| *c != b'-')
                        .eq(normalized.bytes())
                })
        })
    });
    found.then_some(password)
}

mod support;

use nori_core::cartridge::{self, DispatchError};
use nori_core::live_pack::LivePack;
use serde_json::json;
use support::{archive_pack, first_difference, fixture, normalize, Masks};

fn replay(name: &str, pack_variant: Option<&str>) {
    nori_core::jsonutil::with_now_ms(1_700_000_000_000, || {
        replay_at_fixed_time(name, pack_variant)
    });
}

fn replay_at_fixed_time(name: &str, pack_variant: Option<&str>) {
    let fixture = fixture(&format!("reducer_transcripts/{name}.json"));
    // The exporter has the live archive installed for every non-manifold reducer too.
    let pack = if pack_variant == Some("disabled") {
        LivePack::empty()
    } else {
        archive_pack()
    };
    let id = fixture["cartridge"].as_str().unwrap();
    let mut cart = cartridge::create(id, true, &pack).expect("registered cartridge");
    let mut expected_version = 0;
    let mut random_codenames = true;
    let mut failures = Vec::new();
    for (index, step) in fixture["steps"].as_array().unwrap().iter().enumerate() {
        if let Some(variant) = pack_variant {
            if step["pack"].as_str() != Some(variant) {
                continue;
            }
        }
        let actor = step["actor"].as_str().unwrap();
        let cmd = &step["cmd"];
        if name == "codenames" && cmd["type"] == "startGame" {
            random_codenames = cmd["mode"] != "tutorial";
        }
        let outcome = cart.dispatch(actor, cmd, &pack);
        let mut actual = match outcome {
            Ok(commit) => {
                let events = commit
                    .transition
                    .as_ref()
                    .and_then(|t| t.get("events"))
                    .cloned()
                    .unwrap_or(json!([]));
                assert_eq!(commit.version, cart.head_version);
                assert_eq!(commit.transition.is_some(), commit.committed);
                json!({"ok": true, "error": null, "committed": commit.committed,
                    "result": commit.result, "events": events})
            }
            Err(DispatchError::Rejected(error)) => {
                json!({"ok": false, "error": error, "committed": false,
                    "result": null, "events": []})
            }
            Err(DispatchError::Internal(error)) => {
                panic!(
                    "{name} step {} {cmd}: unexpected runtime error: {error}",
                    index + 1
                );
            }
        };
        actual["state"] = cart.state.clone();
        let masks = Masks {
            codenames: name == "codenames" && random_codenames,
            cakeduel: name == "cakeduel",
            pictionary: name == "pictionary",
        };
        // record_step creates a separate Normalizer for result, events, and state.
        for field in ["ok", "error", "committed", "result", "events", "state"] {
            let actual = normalize(actual[field].clone(), masks);
            if let Some(diff) = first_difference(&step[field], &actual, field) {
                failures.push(format!("step {} {cmd}: {diff}", index + 1));
            }
        }
        expected_version += u64::from(step["committed"].as_bool().unwrap());
        if cart.head_version != expected_version || cart.visible_version != expected_version {
            failures.push(format!(
                "step {}: expected head/visible version {expected_version}, actual {}/{}",
                index + 1,
                cart.head_version,
                cart.visible_version
            ));
        }
    }
    assert!(
        failures.is_empty(),
        "{name} {}:\n{}",
        pack_variant.unwrap_or(""),
        failures.join("\n")
    );
}

#[test]
fn chess() {
    replay("chess", None);
}

#[test]
fn codenames() {
    replay("codenames", None);
}

#[test]
fn cakeduel() {
    replay("cakeduel", None);
}

#[test]
fn pictionary() {
    replay("pictionary", None);
}

#[test]
fn chat() {
    replay("chat", None);
}

#[test]
fn manifold_installed() {
    replay("manifold", Some("installed"));
}

#[test]
fn manifold_disabled() {
    replay("manifold", Some("disabled"));
}

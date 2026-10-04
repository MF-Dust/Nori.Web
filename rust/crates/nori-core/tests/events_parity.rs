//! Dispatcher portions of test_live_backend_logic.py / test_virtual_apps.py,
//! and the AI/TTS event bridge round trips driven without provider traffic.

use nori_core::config::ServerAi;
use nori_core::events::handle_event;
use nori_core::live_pack::LivePack;
use nori_core::provider::{HttpRequest, HttpResult};
use nori_core::tasks::{Step, Task};
use nori_core::world::{Outbound, Secrets, World};
use serde_json::{json, Value};
use std::sync::{Arc, OnceLock};

fn archive() -> Arc<LivePack> {
    static PACK: OnceLock<Arc<LivePack>> = OnceLock::new();
    PACK.get_or_init(|| {
        Arc::new(LivePack::from_value(
            serde_json::from_str(
                &std::fs::read_to_string(concat!(
                    env!("CARGO_MANIFEST_DIR"),
                    "/../../../backend/data/live_world_pack.json"
                ))
                .unwrap(),
            )
            .unwrap(),
        ))
    })
    .clone()
}

fn packs() -> [Arc<LivePack>; 2] {
    [Arc::new(LivePack::empty()), archive()]
}
fn world(pack: Arc<LivePack>, full_unlock: bool) -> World {
    let mut world = World::new("events-test", Some("en"), full_unlock, pack);
    world.story_advance();
    world
}
fn send(world: &mut World, channel: &str, payload: Value) -> Outbound {
    world.handle_message(&json!({"type": "event", "channel": channel, "cartridgeId": "manifold.web", "requestId": "events-test", "payload": payload}), &Secrets::default())
}
fn command(world: &mut World, command: &str, payload: Value) -> Outbound {
    send(
        world,
        "manifold.command.request",
        json!({"command": command, "payload": payload}),
    )
}
fn result(out: &Outbound) -> &Value {
    &out.direct[0]["payload"]["result"]
}
fn vars(world: &World) -> &Value {
    &world.cartridge("manifold.web").unwrap().state["variables"]
}
fn facts(world: &World) -> &Value {
    &world.cartridge("manifold.web").unwrap().state["facts"]
}
fn head(world: &World) -> u64 {
    world.cartridge("manifold.web").unwrap().head_version
}
fn remove_fact(world: &mut World, id: &str) {
    world.cartridge_mut("manifold.web").unwrap().state["facts"]
        .as_object_mut()
        .unwrap()
        .remove(id);
}

fn assert_broadcast_pairs(out: &Outbound) {
    assert_eq!(out.broadcast.len() % 2, 0);
    for pair in out.broadcast.as_chunks::<2>().0 {
        assert_eq!(pair[0]["type"], "runtime_transition");
        assert_eq!(pair[1]["type"], "visibility_fence_advanced");
        assert_eq!(pair[0]["cartridgeId"], pair[1]["cartridgeId"]);
        assert_eq!(pair[0]["version"], pair[1]["headVersion"]);
    }
}

#[test]
fn events_envelopes_correlate_only_present_ids_and_default_ack() {
    for pack in packs() {
        let mut world = world(pack, true);
        let out = handle_event(
            &mut world,
            &json!({"channel": "anything", "requestId": 0, "cartridgeId": ""}),
        );
        assert_eq!(
            out.direct,
            vec![
                json!({"type": "event", "worldId": world.world_id, "channel": "anything.result", "payload": {"ok": true}, "cartridgeId": "", "requestId": 0})
            ]
        );
        let out = handle_event(
            &mut world,
            &json!({"channel": "anything", "requestId": null, "cartridgeId": null}),
        );
        assert!(out.direct[0].get("requestId").is_none());
        assert!(out.direct[0].get("cartridgeId").is_none());
        assert!(out.broadcast.is_empty());
        let out = send(&mut world, "settings.network.test", json!({}));
        assert_eq!(out.direct[0]["channel"], "settings.network.test.result");
        assert_eq!(out.direct[0]["payload"], json!({"ok": true, "rttMs": 0}));
    }
}

#[test]
fn events_chip_channels_port_triple_legacy_debug_and_status_both_modes() {
    for pack in packs() {
        let mut world = world(pack.clone(), true);
        let before = head(&world);
        let state = vars(&world).clone();
        let status = send(&mut world, "manifold.chip.status", json!({}));
        assert_eq!(status.direct[0]["channel"], "manifold.chip.status.result");
        assert_eq!(
            status.direct[0]["payload"]["capacity"],
            if pack.is_available() { 5 } else { 3 }
        );
        assert_eq!(head(&world), before);
        assert_eq!(vars(&world), &state);
        assert!(status.broadcast.is_empty());
        let scan = send(
            &mut world,
            "manifold.chip.scan",
            json!({"appId": "files", "windowType": "pdf", "contentKey": "file.hanyue_consent"}),
        );
        assert!(["readout", "unsupported", "fried"]
            .contains(&scan.direct[0]["payload"]["kind"].as_str().unwrap()));
        assert_broadcast_pairs(&scan);
        assert_eq!(
            scan.broadcast[0]["transition"]["cmd"],
            json!({"type": "chip.scan", "appId": "files", "windowType": "pdf", "contentKey": "file.hanyue_consent"})
        );
        let cached = send(
            &mut world,
            "manifold.chip.scan",
            json!({"appId": "browser", "windowType": "page", "contentKey": "browser.doodle.root.index"}),
        );
        assert_eq!(cached.direct[0]["payload"]["kind"], "readout");
        if pack.is_available() {
            let text = cached.direct[0]["payload"]["text"].as_str().unwrap();
            assert!(text.contains("Archived scan replay"));
            assert!(text.contains("4f2bc3be7ae77376"));
        }
        let legacy = send(
            &mut world,
            "manifold.chip.scan",
            json!({"key": "page:browser.doodle.root.index"}),
        );
        assert_eq!(legacy.direct[0]["payload"]["kind"], "readout");
        let debug = send(
            &mut world,
            "manifold.chip.debug_scan",
            json!({"title": "FT probe", "readout": "row=abcdef stable", "contentKey": "page:probe.test"}),
        );
        assert_eq!(debug.direct[0]["payload"], json!({"ok": true}));
        assert!(vars(&world)["chipScans"]
            .as_array()
            .unwrap()
            .iter()
            .any(|e| e["key"] == "page:probe.test"));
        assert_broadcast_pairs(&debug);
        let reset = send(&mut world, "manifold.chip.debug_reset", json!({}));
        assert_eq!(reset.direct[0]["payload"], json!({"ok": true}));
        assert_eq!(vars(&world)["chipScans"], json!([]));
        let config = send(
            &mut world,
            "manifold.chip.debug_config",
            json!({"capacity": 9, "coolEveryMs": 10_000, "heat": 7, "neverOverheat": true, "ignored": 1}),
        );
        assert_eq!(config.direct[0]["payload"], json!({"ok": true}));
        assert_eq!(config.broadcast[0]["transition"]["events"], json!([]));
        assert_eq!(
            vars(&world)["chipConfig"],
            json!({"capacity": 9, "coolEveryMs": 10_000, "heat": 7, "neverOverheat": true})
        );
        let status = send(&mut world, "manifold.chip.status", json!({}));
        assert_eq!(status.direct[0]["payload"]["capacity"], 9);
        assert_eq!(status.direct[0]["payload"]["coolEveryMs"], 10_000);
    }
}

#[test]
fn events_chip_empty_fallback_and_missing_cartridge_shapes() {
    let mut world = world(Arc::new(LivePack::empty()), true);
    let status = send(&mut world, "manifold.chip.status", json!({}));
    assert_eq!(status.direct[0]["payload"].as_object().unwrap().len(), 4);
    assert_eq!(status.direct[0]["payload"]["coolEveryMs"], 60_000);
    send(&mut world, "ambient.trigger", json!({}));
    let status = send(&mut world, "manifold.chip.status", json!({}));
    assert_eq!(
        status.direct[0]["payload"]["capacity"], 5,
        "any nonempty variables select reducer status"
    );
    world.cartridges.retain(|c| c.id != "manifold.web");
    assert_eq!(
        send(&mut world, "manifold.chip.scan", json!({})).direct[0]["payload"],
        json!({"kind": "unsupported", "text": "[chip] manifold link unavailable"})
    );
    for channel in [
        "manifold.chip.debug_scan",
        "manifold.chip.debug_reset",
        "manifold.chip.debug_config",
    ] {
        assert_eq!(
            send(&mut world, channel, json!({})).direct[0]["payload"],
            json!({"ok": false, "error": "manifold unavailable"})
        );
    }
    assert_eq!(
        send(&mut world, "idle.sync", json!({})).direct[0]["payload"],
        json!({"ok": false, "error": "manifold unavailable"})
    );
    assert_eq!(
        result(&command(
            &mut world,
            "client.emitFact",
            json!({"factId": "missing.world.fact"})
        )),
        &json!({"fact": "missing.world.fact", "already": true})
    );
}

#[test]
fn events_ambient_bookmarks_and_games_are_direct_writes_without_versions() {
    for pack in packs() {
        let mut world = world(pack, true);
        let before = head(&world);
        let trigger = send(
            &mut world,
            "ambient.trigger",
            json!({"kind": "presence_silence"}),
        );
        assert_eq!(
            trigger.direct[0]["payload"],
            json!({"quietGapMs": 60_000, "cooldownMs": 120_000, "sessionBudget": 3})
        );
        let config = send(
            &mut world,
            "ambient.debug_config",
            json!({"quietGapMs": 1000, "cooldownMs": -1, "sessionBudget": true}),
        );
        assert!(config.broadcast.is_empty());
        assert_eq!(config.direct[0]["payload"], json!({"ok": true}));
        assert_eq!(
            vars(&world)["ambient"],
            json!({"quietGapMs": 1000, "sessionBudget": true})
        );
        send(
            &mut world,
            "ambient.debug_config",
            json!({"quietGapMs": 0, "cooldownMs": 1.5, "sessionBudget": false}),
        );
        assert_eq!(
            send(&mut world, "ambient.trigger", json!({})).direct[0]["payload"],
            json!({"quietGapMs": 60_000, "cooldownMs": 120_000, "sessionBudget": 3})
        );
        let marks = vars(&world)
            .get("browserBookmarks")
            .and_then(Value::as_array)
            .map_or(0, Vec::len);
        let add = command(
            &mut world,
            "browser.bookmarks.add",
            json!({"url": " https://example.test/ ", "title": "T"}),
        );
        assert_eq!(result(&add), &json!({"count": marks + 1}));
        assert!(add.broadcast.is_empty());
        assert_eq!(
            result(&command(
                &mut world,
                "browser.bookmarks.add",
                json!({"url": "https://example.test/", "title": "replacement"})
            ))["count"],
            marks + 1
        );
        assert_eq!(
            result(&command(&mut world, "browser.bookmarks.list", json!({})))["bookmarks"]
                .as_array()
                .unwrap()
                .last()
                .unwrap(),
            &json!({"url": "https://example.test/", "title": "T"})
        );
        assert_eq!(
            result(&command(
                &mut world,
                "browser.bookmarks.remove",
                json!({"url": "https://example.test/"})
            ))["count"],
            marks
        );
        assert_eq!(
            command(&mut world, "browser.bookmarks.add", json!({"url": "  "})).direct[0]["payload"],
            json!({"ok": false, "error": "missing url"})
        );
        send(&mut world, "nori_open_game", json!({"gameId": "chess"}));
        assert_eq!(
            vars(&world)["launchedGames"]
                .as_array()
                .unwrap()
                .last()
                .unwrap()["gameId"],
            "chess"
        );
        let launched = vars(&world)["launchedGames"].clone();
        send(&mut world, "nori_close_game", json!({"gameId": "chess"}));
        assert_eq!(
            vars(&world)["launchedGames"],
            launched,
            "Python only records opens"
        );
        assert_eq!(head(&world), before);
    }
}

#[test]
fn events_generic_command_aliases_preserve_records_invalidation_and_idempotence() {
    for pack in packs() {
        let mut world = world(pack, true);
        assert_eq!(
            result(&command(&mut world, " totally.unknown ", json!({}))),
            &json!({"echo": "totally.unknown"})
        );
        assert_eq!(
            command(&mut world, "  ", json!({})).direct[0]["payload"],
            json!({"ok": false, "error": "missing command"})
        );
        assert_eq!(
            command(&mut world, "unknown", json!([1])).direct[0]["payload"],
            json!({"ok": false, "error": "command payload must be an object"})
        );
        assert_eq!(
            result(&command(&mut world, "unknown", json!([]))),
            &json!({"echo": "unknown"})
        );
        for (command_name, fact, source, hints) in [
            (
                "mail.markRead",
                "mail.pr_probe.read",
                "mail.read",
                json!(["mail"]),
            ),
            (
                "mark_mail_read",
                "file.pr_probe.read",
                "client.emitFact",
                json!(["file"]),
            ),
            (
                "signal.markRead",
                "signal.pr_probe.read",
                "signal.read",
                json!(["signal_thread", "signal_message"]),
            ),
            (
                "signal_login",
                "signal_pr_probe.unlocked",
                "client.emitFact",
                json!(["signal_thread", "signal_message"]),
            ),
            (
                "vault.unlock",
                "recover.pr_probe",
                "vault.unlock",
                json!(["file"]),
            ),
            (
                "unseal_volume",
                "arg.pr_probe",
                "client.emitFact",
                json!(null),
            ),
        ] {
            let before = head(&world);
            let out = command(&mut world, command_name, json!({"factId": fact}));
            assert_eq!(result(&out), &json!({"fact": fact, "already": false}));
            assert_eq!(head(&world), before + 1);
            assert_broadcast_pairs(&out);
            assert_eq!(out.broadcast.len(), 2);
            let record = &facts(&world)[fact];
            assert_eq!(record["id"], fact);
            assert_eq!(record["actor"], "player");
            assert_eq!(record["source"], source);
            assert!(record["emittedAt"].is_i64());
            let changed = &out.broadcast[0]["transition"]["events"][1];
            assert_eq!(changed["type"], "manifold.facts.changed");
            assert_eq!(changed["snapshot"], json!({fact: true}));
            if hints.is_null() {
                assert!(changed.get("changedArtifactTypes").is_none());
            } else {
                assert_eq!(changed["changedArtifactTypes"], hints);
            }
            let saved = record.clone();
            let again = command(&mut world, command_name, json!({"factId": fact}));
            assert_eq!(result(&again)["already"], true);
            assert!(again.broadcast.is_empty());
            assert_eq!(&facts(&world)[fact], &saved);
            assert_eq!(head(&world), before + 1);
        }
        for (command_name, payload, fact) in [
            (
                "mail.markRead",
                json!({"artifactId": "mail.hint.read"}),
                "mail.hint.read",
            ),
            (
                "signal_login",
                json!({"fileId": "signal.hint.login"}),
                "signal.hint.login",
            ),
            (
                "signal.markRead",
                json!({"volumeId": "signal.hint.read"}),
                "signal.hint.read",
            ),
        ] {
            assert_eq!(
                result(&command(&mut world, command_name, payload))["fact"],
                fact
            );
        }
        // As in Python, even unknown commands with factId take the emit path.
        assert_eq!(
            result(&command(
                &mut world,
                "anything",
                json!({"factId": "generic.fact"})
            ))["fact"],
            "generic.fact"
        );
    }
}

#[test]
fn events_desktop_notification_broadcast_precedes_correlated_reply() {
    let mut world = world(archive(), false);
    let out = send(&mut world, "nori_talk.request", json!({"talkId": "t1"}));
    assert_eq!(out.direct[0]["payload"], json!({"type": "noop"}));
    let out = send(
        &mut world,
        "notification.debug.push",
        json!({"id": "test-note", "title": "Hello", "subtitle": null, "body": "World", "durationMs": -1, "onClick": {"command": "x"}, "ignored": true}),
    );
    assert_eq!(
        out.broadcast,
        vec![
            json!({"type": "event", "worldId": world.world_id, "channel": "notification.pushed", "payload": {"id": "test-note", "title": "Hello", "subtitle": null, "body": "World", "durationMs": -1, "onClick": {"command": "x"}}})
        ]
    );
    assert_eq!(
        out.direct,
        vec![
            json!({"type": "event", "worldId": world.world_id, "channel": "notification.debug.push.result", "payload": {"ok": true, "pushed": "test-note"}, "cartridgeId": "manifold.web", "requestId": "events-test"})
        ]
    );
    let out = send(&mut world, "notification.debug.push", json!({"title": ""}));
    assert!(out.broadcast[0]["payload"]["id"]
        .as_str()
        .unwrap()
        .starts_with("note-"));
    assert_eq!(out.broadcast[0]["payload"]["title"], "NoriOS");
    assert_eq!(
        out.direct[0]["payload"]["pushed"],
        out.broadcast[0]["payload"]["id"]
    );
}

#[test]
fn events_signal_login_recover_mail_and_thread_reads_both_modes() {
    for pack in packs() {
        let mut world = world(pack.clone(), true);
        assert_eq!(
            command(
                &mut world,
                "signal.login",
                json!({"username": "operator@nori.local", "password": "wrong"})
            )
            .direct[0]["payload"],
            json!({"ok": false, "error": "invalid Signal credentials"})
        );
        assert_eq!(
            result(&command(
                &mut world,
                "signal.recover",
                json!({"recoveryCode": "wrong"})
            )),
            &json!({"ok": false, "error": "invalid recovery code"})
        );
        if pack.is_available() {
            let password = pack.variables()["signalTempPassword"].clone();
            remove_fact(&mut world, "signal_daniel.unlocked");
            let accepted = command(
                &mut world,
                "signal.login",
                json!({"username": " operator@nori.local ", "password": password}),
            );
            assert_eq!(
                result(&accepted),
                &json!({"ok": true, "username": "operator@nori.local"})
            );
            assert_eq!(accepted.broadcast.len(), 2);
            assert_eq!(
                facts(&world)["signal_daniel.unlocked"]["source"],
                "client.emitFact"
            );
            assert!(command(
                &mut world,
                "signal.login",
                json!({"username": "operator@nori.local", "password": password})
            )
            .broadcast
            .is_empty());
            assert_eq!(
                result(&command(
                    &mut world,
                    "signal.recover",
                    json!({"recoveryCode": "7K4P-2WQ9-6ZTM-1XAH"})
                ))["tempPassword"],
                password
            );
            for fact in ["signal.daniel.read", "signal.daniel.dm1.read"] {
                remove_fact(&mut world, fact);
            }
        }
        let read = command(&mut world, "signal.read", json!({"threadId": " daniel "}));
        assert_eq!(read.direct[0]["payload"]["ok"], true);
        assert_eq!(
            result(&read)["readFacts"],
            if pack.is_available() {
                json!(["signal.daniel.read", "signal.daniel.dm1.read"])
            } else {
                json!([])
            }
        );
        if pack.is_available() {
            for id in ["signal.daniel.read", "signal.daniel.dm1.read"] {
                assert_eq!(facts(&world)[id]["source"], "signal.read");
            }
            assert_eq!(read.broadcast.len(), 4);
        }
        assert_eq!(
            result(&command(
                &mut world,
                "signal.read",
                json!({"threadId": "unknown-thread"})
            ))["readFacts"],
            json!([])
        );
        assert_eq!(
            command(&mut world, "signal.read", json!({})).direct[0]["payload"],
            json!({"ok": false, "error": "missing threadId"})
        );
        let mail_id = if pack.is_available() {
            "mail.help"
        } else {
            "mail_welcome"
        };
        remove_fact(&mut world, "mail.help.read");
        let read = command(&mut world, "mail.read", json!({"id": mail_id}));
        assert_eq!(
            result(&read),
            &json!({"ok": true, "fact": "mail.help.read"})
        );
        assert_eq!(facts(&world)["mail.help.read"]["source"], "mail.read");
        assert_eq!(read.broadcast.len(), 2);
        assert_eq!(
            result(&command(&mut world, "mail.read", json!({"id": "missing"}))),
            &json!({"ok": true, "fact": null})
        );
    }
}

#[test]
fn events_bounty_validates_archive_evidence_and_story_gates() {
    for pack in packs() {
        let mut unlocked = world(pack.clone(), true);
        assert_eq!(
            send(&mut unlocked, "manifold.bounty.submit", json!({})).direct[0]["payload"],
            json!({"ok": false})
        );
        assert_eq!(
            send(
                &mut unlocked,
                "manifold.bounty.submit",
                json!({"url": "https://futurum-prize.verify-now.com/claim"})
            )
            .direct[0]["payload"],
            json!({"ok": true, "fact": "arg.honeypot_access"})
        );
        let mut world = world(pack.clone(), false);
        assert_eq!(
            send(
                &mut world,
                "manifold.bounty.submit",
                json!({"url": "https://pulse.social/user/frank_mercer48"})
            )
            .direct[0]["payload"]["ok"],
            false
        );
        command(&mut world, "bounty.installExtension", json!({}));
        for url in [
            "https://doodle.search/",
            "https://unknown.test/user/frank_mercer48",
            "https://futurum-prize.verify-now.com/claim",
        ] {
            assert_eq!(
                send(&mut world, "manifold.bounty.submit", json!({"url": url})).direct[0]
                    ["payload"]["ok"],
                false,
                "{url}"
            );
        }
        if pack.is_available() {
            for (profile, fact) in [
                ("frank_mercer48", "dirt.frank"),
                ("mags_cole", "dirt.maggie"),
                ("jackwhite", "dirt.jack"),
            ] {
                let url = format!("HTTPS://PULSE.SOCIAL/user/{profile}/");
                let out = send(&mut world, "manifold.bounty.submit", json!({"url": url}));
                assert_eq!(out.direct[0]["payload"], json!({"ok": true, "fact": fact}));
                assert_broadcast_pairs(&out);
            }
            assert_eq!(
                send(
                    &mut world,
                    "manifold.bounty.submit",
                    json!({"fileId": "file.hanyue_consent"})
                )
                .direct[0]["payload"]["ok"],
                false
            );
            command(
                &mut world,
                "nas.connect",
                json!({"host": "nas.hanyue.tech"}),
            );
            command(
                &mut world,
                "nas.download",
                json!({"path": "/deep-dive-consent-review.pdf"}),
            );
            let artifact = pack
                .file_artifacts()
                .into_iter()
                .find(|a| a["id"] == "file.hanyue_consent")
                .unwrap();
            let path = artifact["data"]["display_path"].as_str().unwrap();
            for file_id in [
                "file.hanyue_consent",
                path,
                path.rsplit('/').next().unwrap(),
            ] {
                assert_eq!(
                    send(
                        &mut world,
                        "manifold.bounty.submit",
                        json!({"fileId": file_id})
                    )
                    .direct[0]["payload"],
                    json!({"ok": true, "fact": "dirt.hanyue_ssh"})
                );
            }
            assert_eq!(
                send(
                    &mut world,
                    "manifold.bounty.submit",
                    json!({"fileId": "file.paper_pdf"})
                )
                .direct[0]["payload"]["ok"],
                false
            );
        }
    }
}

#[test]
fn events_idle_channel_flattens_prestige_but_echoes_original_event_prestige() {
    for pack in packs() {
        let mut world = world(pack, false);
        let out = send(
            &mut world,
            "idle.sync",
            json!({"prestige": {"maxCompute": 42, "cap": 100, "extra": "kept"}, "maxCompute": 100, "maxComputeThisRun": 100, "shardsLocal": 7, "ignored": [1]}),
        );
        assert_eq!(
            out.direct[0]["payload"],
            json!({"ok": true, "prestige": {"maxCompute": 42, "cap": 100, "extra": "kept"}})
        );
        assert_eq!(vars(&world)["idle"]["maxCompute"], 100);
        assert_eq!(vars(&world)["idle"]["extra"], "kept");
        assert_eq!(vars(&world)["idle"]["shardsLocal"], 7);
        assert!(vars(&world)["idle"].get("ignored").is_none());
        assert!(vars(&world)["idle"]["lastSyncMs"].is_i64());
        assert!(facts(&world).get("compute.cap_hit").is_some());
        assert_broadcast_pairs(&out);
        let previous = vars(&world)["idle"].clone();
        assert_eq!(
            send(&mut world, "idle.sync", json!({"cap": false})).direct[0]["payload"],
            json!({"ok": false, "error": "invalid cap"})
        );
        assert_eq!(vars(&world)["idle"], previous);
        let result_out = command(&mut world, "idle.sync", json!({"maxCompute": 1}));
        assert_eq!(result(&result_out)["prestige"]["maxCompute"], 100.0);
        assert_eq!(result(&result_out)["prestige"], vars(&world)["idle"]);
    }
}

#[test]
fn events_artifact_type_filters_order_and_full_unlock_presentation() {
    for pack in packs() {
        let mut world = world(pack.clone(), true);
        let all = send(&mut world, "manifold.artifacts.request", json!({}));
        let all = all.direct[0]["payload"]["artifacts"].as_array().unwrap();
        assert!(!all.is_empty());
        let mut collected = Vec::new();
        for kind in ["mail", "file", "app", "signal_thread", "signal_message"] {
            let out = send(
                &mut world,
                "manifold.artifacts.request",
                json!({"artifactType": kind}),
            );
            assert_eq!(out.direct[0]["channel"], "manifold.artifacts.response");
            let artifacts = out.direct[0]["payload"]["artifacts"].as_array().unwrap();
            assert!(!artifacts.is_empty());
            for artifact in artifacts {
                assert_eq!(artifact["type"], kind);
                collected.push(artifact["id"].clone());
            }
        }
        assert_eq!(
            collected,
            all.iter().map(|a| a["id"].clone()).collect::<Vec<_>>()
        );
        assert_eq!(
            send(
                &mut world,
                "manifold.artifacts.request",
                json!({"artifactType": "unknown"})
            )
            .direct[0]["payload"],
            json!({"ok": true, "artifacts": []})
        );
        assert_eq!(
            send(
                &mut world,
                "manifold.artifacts.request",
                json!({"artifactType": ["mail"]})
            )
            .direct[0]["payload"]["artifacts"],
            json!([])
        );
        let mut story_world = crate::world(pack, false);
        assert_eq!(
            send(
                &mut story_world,
                "manifold.artifacts.request",
                json!({"artifactType": "app"})
            )
            .direct[0]["payload"]["artifacts"],
            json!([])
        );
        command(
            &mut story_world,
            "client.emitFact",
            json!({"factId": "paper.downloaded"}),
        );
        assert_eq!(
            send(
                &mut story_world,
                "manifold.artifacts.request",
                json!({"artifactType": "app"})
            )
            .direct[0]["payload"]["artifacts"]
                .as_array()
                .unwrap()
                .len(),
            1
        );
    }
}

#[test]
fn events_browser_fetch_wraps_shipped_assets_and_preserves_404_shape() {
    for pack in packs() {
        let mut world = world(pack.clone(), true);
        for url in ["https://doodle.search/", "https://unknown.local/"] {
            let out = send(
                &mut world,
                "manifold.artifacts.fetch",
                json!({"artifactType": "browser_page", "lookup_key": url}),
            );
            let artifact = &out.direct[0]["payload"]["artifact"];
            assert_eq!(
                out.direct[0]["channel"],
                "manifold.artifacts.fetch.response"
            );
            assert_eq!(artifact["id"], url);
            assert_eq!(artifact["type"], "browser_page");
            let data = &artifact["data"];
            assert_eq!(data["url"], url);
            assert!(!data["supported_locales"].as_array().unwrap().is_empty());
            assert!(
                data["title"].is_string()
                    && data["body_html"].is_string()
                    && data["allowed_commands"].is_array()
            );
        }
        for lookup in [
            "/webAssets/docs/researcher-paper.pdf",
            "https://any-host.test/webAssets/docs/researcher-paper.pdf",
            "/webAssets/docs/../docs/researcher-paper.pdf",
        ] {
            let out = send(
                &mut world,
                "manifold.artifacts.fetch",
                json!({"artifactType": "browser_page", "lookup_key": lookup}),
            );
            let artifact = &out.direct[0]["payload"]["artifact"];
            assert_eq!(artifact["id"], "webasset.researcher-paper.pdf");
            let path = lookup.split(".test").last().unwrap();
            let expected = format!("<!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>researcher-paper.pdf</title><style>html,body{{margin:0;padding:0;height:100%;background:#111}}>embed,iframe{{width:100%;height:100%;border:0;display:block}}</style></head><body><embed src=\"{path}\" type=\"application/pdf\"><iframe src=\"{path}\" title=\"researcher-paper.pdf\" style=\"position:absolute;inset:0\"></iframe></body></html>");
            assert_eq!(artifact["data"]["body_html"], expected);
            assert_eq!(artifact["data"]["url"], lookup);
            assert_eq!(artifact["data"]["favicon"], json!(null));
        }
        let image = send(
            &mut world,
            "manifold.artifacts.fetch",
            json!({"artifactType": "browser_page", "lookup_key": "/webAssets/files/tower.jpg"}),
        );
        assert_eq!(
            image.direct[0]["payload"]["artifact"]["id"],
            "webasset.tower.jpg"
        );
        // Python uses the same application/pdf wrapper even for images.
        assert!(image.direct[0]["payload"]["artifact"]["data"]["body_html"]
            .as_str()
            .unwrap()
            .contains("application/pdf"));
        for lookup in [
            "/webAssets/no-such-file.pdf",
            "/webAssets/docs/researcher-paper.pdf?x=1",
            "/webAssets/files/tower.JPG",
        ] {
            let out = send(
                &mut world,
                "manifold.artifacts.fetch",
                json!({"artifactType": "browser_page", "lookup_key": lookup}),
            );
            assert_eq!(out.direct[0]["payload"]["artifact"]["id"], lookup);
        }
        for payload in [
            json!({}),
            json!({"artifactType": "file", "lookup_key": "file.x"}),
            json!({"artifactType": "browser_page", "lookup_key": ""}),
        ] {
            assert_eq!(
                send(&mut world, "manifold.artifacts.fetch", payload).direct[0]["payload"],
                json!({"ok": false, "status": 404})
            );
        }
        if pack.is_available() {
            let out = send(
                &mut world,
                "manifold.artifacts.fetch",
                json!({"artifactType": "browser_page", "lookup_key": "https://doodle.search/?q=pharos"}),
            );
            let html = out.direct[0]["payload"]["artifact"]["data"]["body_html"]
                .as_str()
                .unwrap();
            assert!(html.contains("亚历山大灯塔") && html.contains("pharos"));
        }
    }
}

#[test]
fn events_dev_jump_validates_atomic_batches_and_broadcast_order() {
    for pack in packs() {
        let mut world = world(pack, false);
        let out = send(
            &mut world,
            "manifold.dev.jump.request",
            json!({"facts": ["boot.completed", "boot.completed", "mail.custom.read"]}),
        );
        assert_eq!(out.direct[0]["channel"], "manifold.dev.jump.response");
        assert_eq!(
            out.direct[0]["payload"],
            json!({"ok": true, "count": 2, "committed": true})
        );
        assert_eq!(out.broadcast.len(), 4);
        assert_eq!(
            out.broadcast[0]["transition"]["cmd"]["type"],
            "client.emitFacts"
        );
        assert_eq!(
            out.broadcast[2]["transition"]["cmd"]["source"],
            "system.tick"
        );
        assert_broadcast_pairs(&out);
        let out = send(
            &mut world,
            "manifold.dev.jump.request",
            json!({"facts": ["boot.completed"]}),
        );
        assert_eq!(
            out.direct[0]["payload"],
            json!({"ok": true, "count": 0, "committed": false})
        );
        assert!(out.broadcast.is_empty());
        for invalid in [
            json!(null),
            json!("fact"),
            json!(["valid", 1]),
            json!([""]),
            json!(["x".repeat(257)]),
            json!(vec!["x"; 1025]),
        ] {
            let before = facts(&world).clone();
            let out = send(
                &mut world,
                "manifold.dev.jump.request",
                json!({"facts": invalid}),
            );
            assert_eq!(
                out.direct[0]["payload"],
                json!({"ok": false, "error": "facts must contain at most 1024 non-empty strings of at most 256 characters"})
            );
            assert_eq!(facts(&world), &before);
            assert!(out.broadcast.is_empty());
        }
    }
}

fn response(status: u16, body: Vec<u8>, mime: &str) -> HttpResult {
    HttpResult::Response {
        status,
        headers: vec![("content-type".into(), mime.into())],
        body,
        truncated: false,
    }
}

fn drive_probe(mut task: Task, world: &mut World, reply: HttpResult) -> (Vec<HttpRequest>, Value) {
    let mut input = None;
    let mut requests = Vec::new();
    let mut replies = Vec::new();
    for _ in 0..10 {
        match task.poll(world, &ServerAi::default(), input.take()) {
            Step::Http(request) => {
                requests.push(request);
                input = Some(reply.clone());
            }
            Step::Direct(message) => replies.push(message),
            Step::Done => {
                assert_eq!(replies.len(), 1);
                return (requests, replies.remove(0));
            }
            step => panic!("probe must not broadcast/spawn/sleep: {step:?}"),
        }
    }
    panic!("probe did not finish")
}

#[test]
fn events_ai_config_and_test_round_trips_keep_secrets_out_of_public_state() {
    let raw = json!({"enabled": true, "provider": "openai-compatible", "baseUrl": "https://example.test/v1/chat/completions/", "model": "custom-model", "apiKey": "super-secret-browser-key", "systemPrompt": "Custom system prompt", "characterPrompt": "Keep Nori curious and concise.", "temperature": 9, "maxTokens": 999999});
    for pack in packs() {
        let mut world = world(pack, true);
        let state = world.cartridge("manifold.web").unwrap().state.clone();
        let config = send(&mut world, "nori.ai.config", raw.clone());
        assert_eq!(config.direct[0]["channel"], "nori.ai.config.result");
        assert_eq!(
            config.direct[0]["payload"],
            nori_core::llm::config_result_payload(&raw)
        );
        assert_eq!(config.direct[0]["payload"]["temperature"], 2.0);
        assert_eq!(config.direct[0]["payload"]["maxTokens"], 4096);
        assert_eq!(
            config.direct[0]["payload"]["baseUrl"],
            "https://example.test/v1"
        );
        assert_eq!(
            config.public_ai.as_ref().unwrap(),
            &nori_core::session::public_ai_config(&nori_core::llm::sanitize_ai_config(&raw))
        );
        assert!(config.broadcast.is_empty() && config.tasks.is_empty());
        assert!(!format!("{:?}", config.direct).contains("super-secret-browser-key"));
        assert!(!config
            .public_ai
            .unwrap()
            .to_string()
            .contains("super-secret-browser-key"));
        for payload in [json!({"config": raw}), raw.clone()] {
            let out = send(&mut world, "nori.ai.test", payload);
            assert!(out.direct.is_empty() && out.broadcast.is_empty());
            assert_eq!(out.tasks.len(), 1);
            let fake = response(
                200,
                br#"{"choices":[{"message":{"content":"[emotion:happy] configured reply"}}]}"#
                    .to_vec(),
                "application/json",
            );
            let (requests, reply) =
                drive_probe(out.tasks.into_iter().next().unwrap(), &mut world, fake);
            assert_eq!(requests.len(), 1);
            assert_eq!(requests[0].url, "https://example.test/v1/chat/completions");
            assert!(requests[0]
                .headers
                .iter()
                .any(|(k, v)| k.eq_ignore_ascii_case("authorization")
                    && v == "Bearer super-secret-browser-key"));
            let body: Value = serde_json::from_slice(requests[0].body.as_ref().unwrap()).unwrap();
            assert_eq!(body["model"], "custom-model");
            assert_eq!(body["temperature"], 2.0);
            assert!(body["max_tokens"].as_u64().unwrap() <= 4096);
            let prompt = body["messages"][0]["content"].as_str().unwrap();
            assert!(
                prompt.contains("Custom system prompt")
                    && prompt.contains("Keep Nori curious and concise.")
                    && prompt.contains("NoriOS rendering contract")
            );
            assert_eq!(
                reply,
                json!({"type": "event", "worldId": world.world_id, "channel": "nori.ai.test.result", "payload": {"ok": true, "provider": "openai-compatible", "model": "custom-model", "responsePreview": "configured reply"}, "cartridgeId": "manifold.web", "requestId": "events-test"})
            );
        }
        assert_eq!(world.cartridge("manifold.web").unwrap().state, state);
        let out = send(&mut world, "nori.ai.test", json!({"config": raw}));
        let (_, error) = drive_probe(
            out.tasks.into_iter().next().unwrap(),
            &mut world,
            HttpResult::Network("secret URL with super-secret-browser-key".into()),
        );
        assert_eq!(error["channel"], "nori.ai.test.result");
        assert_eq!(error["payload"]["ok"], false);
        assert!(!error.to_string().contains("super-secret-browser-key"));
    }
}

#[test]
fn events_tts_config_and_test_round_trips_reply_with_audio_or_test_error() {
    let raw = json!({"enabled": true, "provider": "minimax", "baseUrl": "https://api.minimaxi.com/v1/", "apiKey": "tts-super-secret", "model": "speech-2.8-turbo", "voice": "male-qn-qingse", "speed": 9});
    for pack in packs() {
        let mut world = world(pack, true);
        let state = world.cartridge("manifold.web").unwrap().state.clone();
        let config = send(&mut world, "nori.tts.config", raw.clone());
        assert_eq!(config.direct[0]["channel"], "nori.tts.config.result");
        assert_eq!(
            config.direct[0]["payload"],
            nori_core::tts::config_result_payload(&raw)
        );
        assert_eq!(config.direct[0]["payload"]["hasApiKey"], true);
        assert_eq!(config.direct[0]["payload"]["speed"], 4.0);
        assert!(
            config.broadcast.is_empty() && config.tasks.is_empty() && config.public_ai.is_none()
        );
        assert!(!config.direct[0].to_string().contains("tts-super-secret"));
        for payload in [
            json!({"config": raw, "text": "你好，我是 Nori。"}),
            raw.clone(),
        ] {
            let out = send(&mut world, "nori.tts.test", payload);
            assert!(out.direct.is_empty() && out.broadcast.is_empty());
            assert_eq!(out.tasks.len(), 1);
            let fake = response(
                200,
                br#"{"data":{"audio":"746573742d617564696f"},"base_resp":{"status_code":0}}"#
                    .to_vec(),
                "application/json",
            );
            let (requests, reply) =
                drive_probe(out.tasks.into_iter().next().unwrap(), &mut world, fake);
            assert_eq!(requests.len(), 1);
            assert_eq!(requests[0].url, "https://api.minimaxi.com/v1/t2a_v2");
            assert!(requests[0]
                .headers
                .iter()
                .any(|(k, v)| k.eq_ignore_ascii_case("authorization")
                    && v == "Bearer tts-super-secret"));
            let body: Value = serde_json::from_slice(requests[0].body.as_ref().unwrap()).unwrap();
            assert!(body["text"].as_str().unwrap().contains("Nori"));
            assert_eq!(
                reply,
                json!({"type": "event", "worldId": world.world_id, "channel": "nori.tts.audio", "payload": {"audio": "dGVzdC1hdWRpbw==", "mime": "audio/mpeg", "provider": "minimax", "ok": true, "purpose": "test"}, "cartridgeId": "manifold.web", "requestId": "events-test"})
            );
        }
        let out = send(
            &mut world,
            "nori.tts.test",
            json!({"config": raw, "text": "Nori"}),
        );
        let (_, error) = drive_probe(
            out.tasks.into_iter().next().unwrap(),
            &mut world,
            HttpResult::Network("tts-super-secret".into()),
        );
        assert_eq!(error["channel"], "nori.tts.error");
        assert_eq!(error["payload"]["ok"], false);
        assert_eq!(error["payload"]["purpose"], "test");
        assert_eq!(error["payload"]["provider"], "minimax");
        assert!(!error.to_string().contains("tts-super-secret"));
        assert_eq!(world.cartridge("manifold.web").unwrap().state, state);
    }
}

#[test]
fn events_dispatch_errors_follow_the_python_route_specific_catches() {
    let mut world = world(Arc::new(LivePack::empty()), true);
    world.cartridge_mut("manifold.web").unwrap().state["facts"] = json!([]);
    let alias = command(&mut world, "vault.unlock", json!({"factId": "new.fact"}));
    assert_eq!(alias.direct[0]["payload"]["ok"], false);
    assert!(alias.direct[0]["payload"]["error"]
        .as_str()
        .unwrap()
        .starts_with("fact emission rejected: "));
    assert!(alias.broadcast.is_empty());
    let jump = send(
        &mut world,
        "manifold.dev.jump.request",
        json!({"facts": ["new.fact"]}),
    );
    assert!(
        jump.direct.is_empty(),
        "dev jump only catches CommandRejected, not Internal"
    );
    let bounty = send(
        &mut world,
        "manifold.bounty.submit",
        json!({"url": "https://futurum-prize.verify-now.com/claim"}),
    );
    assert_eq!(
        bounty.direct[0]["payload"],
        json!({"ok": false}),
        "bounty catches all dispatch exceptions"
    );
    world.cartridge_mut("manifold.web").unwrap().state =
        json!({"facts": {}, "variables": {"chipConfig": null}});
    let scan = send(&mut world, "manifold.chip.scan", json!({"key": "new"}));
    assert!(
        scan.direct.is_empty() && scan.broadcast.is_empty(),
        "uncaught cartridge faults must not masquerade as a missing manifold"
    );
    let nas = command(
        &mut world,
        "nas.connect",
        json!({"host": "nas.hanyue.tech"}),
    );
    assert_eq!(
        result(&nas)["ok"],
        true,
        "valid patchVariables does not inspect unrelated chip state"
    );
    world.cartridge_mut("manifold.web").unwrap().state["variables"] = json!([]);
    let nas = command(
        &mut world,
        "nas.connect",
        json!({"host": "nas.hanyue.tech"}),
    );
    assert!(
        nas.direct.is_empty(),
        "a failed patch stops the later fact emit and reply"
    );
}

#[test]
fn events_malformed_client_payloads_and_restored_state_never_panic() {
    let channels = [
        "manifold.chip.status",
        "manifold.chip.scan",
        "manifold.chip.debug_scan",
        "manifold.chip.debug_reset",
        "manifold.chip.debug_config",
        "ambient.trigger",
        "ambient.debug_config",
        "manifold.command.request",
        "nori_open_game",
        "nori_close_game",
        "nori_talk.request",
        "notification.debug.push",
        "manifold.bounty.submit",
        "idle.sync",
        "manifold.artifacts.request",
        "manifold.artifacts.fetch",
        "manifold.dev.jump.request",
        "settings.network.test",
        "nori.ai.config",
        "nori.ai.test",
        "nori.tts.config",
        "nori.tts.test",
    ];
    for channel in channels {
        for payload in [
            json!(null),
            json!(false),
            json!(1),
            json!("x"),
            json!([1]),
            json!({"key": [], "contentKey": {"k": true}, "title": null, "artifactType": {}, "lookup_key": [1], "facts": [1], "command": {"x": true}}),
        ] {
            let mut world = world(Arc::new(LivePack::empty()), false);
            let out = handle_event(&mut world, &json!({"channel": channel, "payload": payload}));
            assert!(out.direct.len() <= 1);
        }
    }
    for state in [
        json!(null),
        json!([]),
        json!({"facts": null, "variables": []}),
        json!({"facts": {}, "variables": {"chipConfig": null, "chip": false, "chipScans": 1, "ambient": [], "browserBookmarks": false, "launchedGames": null, "idle": [], "danielVerifyStep": "not-an-int"}}),
    ] {
        for channel in channels {
            let mut world = world(Arc::new(LivePack::empty()), false);
            world.cartridge_mut("manifold.web").unwrap().state = state.clone();
            handle_event(
                &mut world,
                &json!({"channel": channel, "payload": {"command": "browser.bookmarks.add", "payload": {"url": "https://x.test"}}}),
            );
        }
    }
    let mut world = world(Arc::new(LivePack::empty()), true);
    send(
        &mut world,
        "manifold.chip.debug_config",
        json!({"capacity": "bad", "coolEveryMs": 0.5}),
    );
    send(&mut world, "manifold.chip.status", json!({}));
    send(&mut world, "manifold.chip.scan", json!({}));
}

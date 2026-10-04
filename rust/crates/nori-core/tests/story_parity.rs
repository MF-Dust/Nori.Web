//! Ports of test_story_progress.py and test_story_commands.py, plus the Python replay.

use nori_core::apps::{files, mail};
use nori_core::events::handle_event;
use nori_core::live_pack::LivePack;
use nori_core::story::{self, present_artifacts, recovery_password};
use nori_core::story_commands::DANIEL_QUESTIONS;
use nori_core::world::{Outbound, Secrets, World};
use serde_json::{json, Value};
use std::collections::BTreeSet;
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

fn fresh(pack: Arc<LivePack>) -> World {
    let mut world = World::new("story-test", Some("en"), false, pack);
    world.story_advance();
    world
}

fn facts(world: &World) -> &Value {
    &world.cartridge("manifold.web").unwrap().state["facts"]
}

fn ids(world: &World) -> Vec<String> {
    let mut ids: Vec<String> = facts(world).as_object().unwrap().keys().cloned().collect();
    ids.sort();
    ids
}

fn rpc_out(world: &mut World, command: &str, payload: Value) -> Outbound {
    handle_event(
        world,
        &json!({"channel": "manifold.command.request", "requestId": "story-test", "payload": {"command": command, "payload": payload}}),
    )
}

fn rpc(world: &mut World, command: &str, payload: Value) -> Value {
    let out = rpc_out(world, command, payload);
    assert_eq!(out.direct.len(), 1);
    let response = &out.direct[0]["payload"];
    assert_eq!(response["ok"], true, "{command}: {response}");
    response["result"].clone()
}

fn emit(world: &mut World, fact: &str) {
    rpc(world, "client.emitFact", json!({"factId": fact}));
}

fn artifacts(world: &mut World, kind: &str) -> Vec<Value> {
    let out = handle_event(
        world,
        &json!({"channel": "manifold.artifacts.request", "payload": {"artifactType": kind}}),
    );
    out.direct[0]["payload"]["artifacts"]
        .as_array()
        .unwrap()
        .clone()
}

fn artifact_ids(world: &mut World, kind: &str) -> BTreeSet<String> {
    artifacts(world, kind)
        .iter()
        .map(|a| a["id"].as_str().unwrap().to_string())
        .collect()
}

fn mount(world: &mut World, cartridge: &str) {
    let out = world.handle_message(
        &json!({"type": "mount_cartridge", "cartridgeId": cartridge, "requestId": "story-test"}),
        &Secrets::default(),
    );
    assert_eq!(out.direct[0]["type"], "cartridge_mounted_ack");
}

fn dispatch(world: &mut World, cartridge: &str, cmd: Value, actor: &str) -> Outbound {
    let head = world.cartridge(cartridge).unwrap().head_version;
    let out = world.handle_message(&json!({"type": "dispatch", "cartridgeId": cartridge, "requestId": "story-test", "actor": actor, "expectedHeadVersion": head, "cmd": cmd}), &Secrets::default());
    assert_eq!(out.direct[0]["success"], true, "{:?}", out.direct);
    out
}

#[test]
fn story_fresh_and_archive_worlds_are_not_confused() {
    for pack in [Arc::new(LivePack::empty()), archive()] {
        let mut world = fresh(pack.clone());
        assert_eq!(ids(&world), ["session.ready"]);
        assert!(world.story_advance().is_empty());
        let mut world = World::new("archive", None, true, pack.clone());
        let before = facts(&world).clone();
        assert!(world.story_advance().is_empty());
        assert_eq!(facts(&world), &before);
        if pack.is_available() {
            assert!(story::has_fact(facts(&world), "arg.ending.shown"));
        }
    }
}

#[test]
fn story_boot_unlocks_only_first_mail_and_chain_reaches_ending() {
    let mut world = fresh(archive());
    emit(&mut world, "boot.completed");
    assert!(story::has_fact(facts(&world), "mail.advisory.unlocked"));
    let mails = present_artifacts(mail::artifacts(&world.pack, 0), facts(&world));
    let ids: BTreeSet<_> = mails.iter().filter_map(|a| a["id"].as_str()).collect();
    assert!(ids.contains("mail.advisory"));
    assert!(ids.contains("mail.acq_strategic"));
    assert!(!ids.contains("mail.help"));
    assert!(!ids.contains("mail.nori_final"));
    for fact in [
        "corrupt.climax_pending",
        "virus.cleared",
        "mail.act2_hinge.read",
        "file.seal_config.read",
        "file.tower_photo.read",
        "arg.cult_truth",
        "arg.honeypot_access",
        "mail.log_encounter.read",
        "qfr.installed",
        "arg.memory.shown",
        "arg.manifold_unlocked",
        "idle.manifold_complete",
        "arg.finale.shown",
        "arg.farewell.shown",
        "arg.ending.shown",
    ] {
        emit(&mut world, fact);
        if fact == "file.seal_config.read" {
            story::player_text(&mut world, "pharos");
            world.story_advance();
        }
    }
    for fact in [
        "corrupt.armed",
        "arg.seal_released",
        "daniel.deadman.delivered",
        "recover.datasea_exe",
        "arg.farewell.started",
        "arg.ending.started",
        "arg.ending.shown",
        "mail.nori_final.unlocked",
    ] {
        assert!(story::has_fact(facts(&world), fact), "{fact}");
    }
}

#[test]
fn story_game_completion_uses_python_truthiness_and_integer_scores() {
    for ended in [
        json!(null),
        json!(false),
        json!(0),
        json!(""),
        json!([]),
        json!({}),
    ] {
        let mut world = fresh(archive());
        mount(&mut world, "cakeduel");
        world.cartridge_mut("cakeduel").unwrap().state["game"] = json!({"gameEnded": ended});
        world.story_advance();
        assert!(!story::has_fact(facts(&world), "game.any.completed"));
    }
    for ended in [
        json!(true),
        json!(1),
        json!("done"),
        json!([false]),
        json!({"winner": 0}),
    ] {
        let mut world = fresh(archive());
        mount(&mut world, "cakeduel");
        world.cartridge_mut("cakeduel").unwrap().state["game"] = json!({"gameEnded": ended});
        world.story_advance();
        assert!(story::has_fact(facts(&world), "gesture.cakeduel"));
        assert!(story::has_fact(facts(&world), "mail.help.unlocked"));
    }
    for (score, expected) in [
        (json!(true), true),
        (json!(1), true),
        (json!(1.0), false),
        (json!(0), false),
    ] {
        let mut world = fresh(archive());
        mount(&mut world, "pictionary");
        world.cartridge_mut("pictionary").unwrap().state["gameState"] =
            json!({"score": {"solved": score}});
        world.story_advance();
        assert_eq!(
            story::has_fact(facts(&world), "gesture.pictionary"),
            expected
        );
    }
    let mut world = fresh(archive());
    for (cartridge, game) in [
        ("chess", json!({"status": "checkmate"})),
        ("codenames", json!({"phase": "GAME_OVER"})),
        ("pictionary", json!({"phase": "RESULTS"})),
    ] {
        mount(&mut world, cartridge);
        world.cartridge_mut(cartridge).unwrap().state["gameState"] = game;
    }
    world.story_advance();
    for fact in ["gesture.chess", "gesture.codenames", "gesture.pictionary"] {
        assert!(story::has_fact(facts(&world), fact));
    }
}

#[test]
fn story_pharos_regex_and_fact_truthiness_match_python() {
    for (text, matches) in [
        ("alpharos", false),
        ("pharoscope", false),
        ("PHAROS", true),
        ("中文pharos中文", true),
        ("1pharos_", true),
        ("ıpharos", false),
        ("pharosK", false),
        ("pharoſ!", true),
        ("!pharos?", true),
    ] {
        let mut world = fresh(archive());
        emit(&mut world, "file.seal_config.read");
        let messages = story::player_text(&mut world, text);
        assert_eq!(!messages.is_empty(), matches, "{text}");
        assert_eq!(
            story::has_fact(facts(&world), "arg.seal_released"),
            matches,
            "{text}"
        );
        if matches {
            assert_eq!(messages.len(), 2, "player_text itself does not cascade");
            assert!(!story::has_fact(facts(&world), "mail.log_sense.unlocked"));
            assert_eq!(facts(&world)["arg.seal_released"]["actor"], "system");
            assert_eq!(
                facts(&world)["arg.seal_released"]["source"],
                "system.emitFact"
            );
        }
    }
    let mut world = fresh(archive());
    world.cartridge_mut("manifold.web").unwrap().state["facts"]["file.seal_config.read"] =
        json!(false);
    assert!(story::player_text(&mut world, "pharos").is_empty());
    world.cartridge_mut("manifold.web").unwrap().state["facts"]["file.seal_config.read"] =
        json!(true);
    world.cartridge_mut("manifold.web").unwrap().state["facts"]["arg.seal_released"] = json!(false);
    assert!(!story::player_text(&mut world, "pharos").is_empty());
}

#[test]
fn story_bounty_requires_extension_and_five_evidence_facts() {
    let mut world = fresh(archive());
    for fact in story::BOUNTY_FACTS.iter().take(5) {
        emit(&mut world, fact);
    }
    assert!(!story::has_fact(facts(&world), "arg.honeypot_access"));
    let out = rpc_out(&mut world, "bounty.installExtension", json!({}));
    assert!(story::has_fact(facts(&world), "arg.honeypot_access"));
    assert!(story::has_fact(
        facts(&world),
        "mail.log_encounter.unlocked"
    ));
    assert_eq!(
        out.broadcast.len(),
        4,
        "extension commit followed by cascade commit"
    );
    assert_eq!(
        out.broadcast[2]["transition"]["cmd"]["source"],
        "system.tick"
    );
    let mut world = fresh(archive());
    emit(&mut world, "bounty.ext_installed");
    for fact in story::BOUNTY_FACTS.iter().take(4) {
        emit(&mut world, fact);
    }
    assert!(!story::has_fact(facts(&world), "arg.honeypot_access"));
}

#[test]
fn story_compute_recovers_thresholds_and_locks_content() {
    let mut world = fresh(archive());
    world.cartridge_mut("manifold.web").unwrap().state["variables"]["idle"] =
        json!({"maxCompute": 1e8});
    world.story_advance();
    assert!(story::has_fact(facts(&world), "recover.seal_config"));
    assert!(!story::has_fact(facts(&world), "recover.trainlog"));
    let presented = present_artifacts(files::artifacts(&world.pack, 0), facts(&world));
    let locked = presented
        .iter()
        .find(|a| a.pointer("/data/recover_when") == Some(&json!("recover.trainlog")))
        .unwrap();
    for key in ["body_md", "asset_path", "binary_asset_path", "trainlog"] {
        assert!(locked["data"].get(key).is_none());
    }
    world.cartridge_mut("manifold.web").unwrap().state["variables"]["idle"] = json!({"maxCompute": false, "maxComputeThisRun": "1e40", "prestige": {"maxComputeThisRun": 1e31}});
    world.story_advance();
    assert!(story::has_fact(facts(&world), "recover.trainlog"));
    let pack = Arc::new(LivePack::from_value(json!({"file_artifacts": [
        {"data": {"recover_when": "recover.bool", "threshold": true}},
        {"data": {"recover_when": "recover.numeric", "threshold": 0}},
        {"data": {"recover_when": "recover.negative", "threshold": -1}},
        {"data": {"recover_when": "", "threshold": 0}}
    ]})));
    let world = fresh(pack);
    assert_eq!(
        ids(&world),
        ["recover.negative", "recover.numeric", "session.ready"]
    );
}

#[test]
fn story_presentation_uses_membership_not_record_truthiness() {
    let all = vec![
        json!({"id": "mail.advisory", "type": "mail"}),
        json!({"id": "app.vault", "type": "app", "data": {"available_when": "paper.downloaded"}}),
        json!({"id": "file.recovery_keys", "type": "file"}),
        json!({"id": "file.log", "type": "file", "data": {"display_path": "训练日志/x"}}),
        json!({"id": "file.lock", "type": "file", "data": {"recover_when": "recover.x", "body_md": "secret", "asset_path": "s", "binary_asset_path": "b", "trainlog": [1], "keep": true}}),
        json!({"id": "message.file", "type": "signal_message", "data": {"thread_id": "daniel", "kind": "file", "timestamp": "date"}}),
        json!({"id": "message.history", "type": "signal_message", "data": {"thread_id": "daniel", "timestamp": "date"}}),
        json!({"id": "message.deadman", "type": "signal_message", "data": {"thread_id": "daniel"}}),
    ];
    let locked = present_artifacts(all.clone(), &json!({}));
    assert_eq!(locked.len(), 2);
    assert_eq!(
        locked[0]["data"],
        json!({"recover_when": "recover.x", "keep": true})
    );
    let facts = json!({"boot.completed": false, "paper.downloaded": null, "bookcipher.solved": 0, "recover.trainlog": false, "recover.x": null, "daniel.evidence_unlocked": [], "daniel.deadman.delivered": false});
    assert_eq!(present_artifacts(all.clone(), &facts), all);
}

#[test]
fn story_signal_recovery_accepts_only_archived_codes() {
    let pack = archive();
    let password = recovery_password(&pack, "7K4P-2WQ9-6ZTM-1XAH").unwrap();
    assert_eq!(
        recovery_password(&pack, "7k4p 2wq9 / 6ztm_1xah"),
        Some(password)
    );
    for code in [
        "nope",
        "7K4P-2WQ9-6ZTM-1XA0",
        "７Ｋ４Ｐ２ＷＱ９６ＺＴＭ１ＸＡＨ",
    ] {
        assert_eq!(recovery_password(&pack, code), None);
    }
    assert_eq!(
        recovery_password(&LivePack::empty(), "7K4P-2WQ9-6ZTM-1XAH"),
        None
    );
    let overlapping = LivePack::from_value(
        json!({"variables": {"signalTempPassword": "pass"}, "file_artifacts": [{"data": {"body_md": "AAAA-BBBB-CCCC-DDDD-EEEE"}}]}),
    );
    assert_eq!(
        recovery_password(&overlapping, "AAAA-BBBB-CCCC-DDDD"),
        Some("pass".into())
    );
    assert_eq!(
        recovery_password(&overlapping, "BBBB-CCCC-DDDD-EEEE"),
        None,
        "Python findall does not return overlapping matches"
    );
}

#[test]
fn story_commands_vaults_surface_and_reject_wrong_answers() {
    let mut world = fresh(archive());
    assert!(artifacts(&mut world, "app").is_empty());
    assert_eq!(
        rpc(&mut world, "vault.unlock", json!({"puzzleId": "unknown"})),
        json!({"ok": false, "error": "unknown vault"})
    );
    assert_eq!(
        rpc(
            &mut world,
            "vault.unlock",
            json!({"puzzleId": "bookcipher", "token": "eurydice"})
        ),
        json!({"ok": false, "error": "vault is not available"})
    );
    emit(&mut world, "paper.downloaded");
    let app = artifacts(&mut world, "app");
    assert_eq!(app.len(), 1);
    assert_eq!(app[0]["data"]["app_kind"], "password_prompt");
    assert_eq!(app[0]["data"]["puzzle_id"], "bookcipher");
    assert!(app[0]["data"].get("answers").is_none());
    assert_eq!(
        rpc(
            &mut world,
            "puzzle.verify",
            json!({"puzzleId": "bookcipher", "tokens": ["wrong"]})
        ),
        json!({"ok": false, "error": "incorrect passphrase"})
    );
    assert!(!artifact_ids(&mut world, "file").contains("file.recovery_keys"));
    assert_eq!(
        rpc(
            &mut world,
            "unseal_volume",
            json!({"volumeId": "bookcipher", "tokens": ["　Ｅｕｒｙｄｉｃｅ　"]})
        ),
        json!({"ok": true, "fact": "bookcipher.solved"})
    );
    assert!(artifact_ids(&mut world, "file").contains("file.recovery_keys"));
    emit(&mut world, "cult.zip.downloaded");
    assert_eq!(artifacts(&mut world, "app").len(), 2);
    assert_eq!(
        rpc(
            &mut world,
            "vault.unlock",
            json!({"puzzleId": "cult", "tokens": ["978209"]})
        )["ok"],
        false
    );
    assert!(!story::has_fact(facts(&world), "cult.unpacked"));
    assert_eq!(
        rpc(
            &mut world,
            "vault.unlock",
            json!({"puzzleId": "cult", "token": "９７８２０８"})
        )["ok"],
        true
    );
    let head = world.cartridge("manifold.web").unwrap().head_version;
    let again = rpc_out(
        &mut world,
        "vault.unlock",
        json!({"puzzleId": "cult", "token": 978208}),
    );
    assert!(again.broadcast.is_empty());
    assert_eq!(world.cartridge("manifold.web").unwrap().head_version, head);
}

#[test]
fn story_commands_idle_rpc_and_event_share_recovery_and_validation() {
    let mut world = fresh(archive());
    assert_eq!(
        rpc(
            &mut world,
            "idle.sync",
            json!({"maxCompute": 1e8, "maxComputeThisRun": 1e8, "cap": 1e8, "type": "idle.complete"})
        )["ok"],
        true
    );
    assert!(!story::has_fact(facts(&world), "idle.manifold_complete"));
    assert!(story::has_fact(facts(&world), "recover.seal_config"));
    assert!(story::has_fact(facts(&world), "compute.cap_hit"));
    rpc(&mut world, "idle.sync", json!({"maxCompute": 1}));
    assert_eq!(
        world.cartridge("manifold.web").unwrap().state["variables"]["idle"]["maxCompute"],
        1e8
    );
    for (key, value) in [
        ("maxCompute", json!(-1)),
        ("cap", json!(true)),
        ("compute", json!("42")),
        ("claimedMementoCount", json!(-0.1)),
    ] {
        let before = world.cartridge("manifold.web").unwrap().head_version;
        assert_eq!(
            rpc(&mut world, "idle.sync", json!({key: value})),
            json!({"ok": false, "error": format!("invalid {key}")})
        );
        assert_eq!(
            world.cartridge("manifold.web").unwrap().head_version,
            before
        );
    }
    let out = handle_event(
        &mut world,
        &json!({"channel": "idle.sync", "payload": {"prestige": {"maxCompute": 1e12}}}),
    );
    assert_eq!(
        out.direct[0]["payload"],
        json!({"ok": true, "prestige": {"maxCompute": 1e12}})
    );
    assert!(story::has_fact(facts(&world), "recover.paper_draft"));
}

#[test]
fn story_commands_daniel_requires_all_answers_and_persists_steps() {
    let mut world = fresh(archive());
    assert_eq!(
        rpc(&mut world, "signal.daniel.verify", json!({})),
        json!({"ok": false, "reply": ["身份核验尚未开放。"]})
    );
    emit(&mut world, "signal_daniel.unlocked");
    emit(&mut world, "qfr.installed");
    assert!(!artifact_ids(&mut world, "signal_message").contains("signal.daniel.file"));
    assert_eq!(
        rpc(
            &mut world,
            "signal.daniel.verify",
            json!({"answer": "2-13"})
        ),
        json!({"ok": false, "reply": ["请先回复 /verify 开始。"]})
    );
    assert_eq!(
        rpc(&mut world, "signal.daniel.verify", json!({})),
        json!({"ok": true, "reply": [DANIEL_QUESTIONS[0]]})
    );
    assert_eq!(
        rpc(
            &mut world,
            "signal.daniel.verify",
            json!({"answer": "314159"})
        ),
        json!({"ok": false, "reply": ["答案不匹配，请再查看 Signal 记录或 Pulse 主页。", DANIEL_QUESTIONS[0]]})
    );
    for (i, answer) in ["2026-02-13", "3月6日", "ＳＩＬＶＥＲ　ＴＡＢＢＹ"]
        .iter()
        .enumerate()
    {
        let result = rpc(
            &mut world,
            "signal.daniel.verify",
            json!({"answer": answer}),
        );
        assert_eq!(result["ok"], true);
        assert_eq!(
            world.cartridge("manifold.web").unwrap().state["variables"]["danielVerifyStep"],
            i + 1
        );
        assert_eq!(
            story::has_fact(facts(&world), "daniel.evidence_unlocked"),
            i == 2
        );
        if i < 2 {
            assert_eq!(
                rpc(
                    &mut world,
                    "signal.daniel.verify",
                    json!({"answer": "/verify"})
                )["reply"],
                json!([DANIEL_QUESTIONS[i + 1]])
            );
        }
    }
    assert!(artifact_ids(&mut world, "signal_message").contains("signal.daniel.file"));
    assert_eq!(
        facts(&world)["daniel.evidence_unlocked"]["source"],
        "signal.daniel.verify"
    );
    assert_eq!(
        rpc(&mut world, "signal.daniel.verify", json!({})),
        json!({"ok": true, "reply": ["核验已通过，附件已交付。"]})
    );
}

#[test]
fn story_commands_nas_paths_and_download_idempotence() {
    let mut world = fresh(archive());
    assert_eq!(
        rpc(&mut world, "nas.list", json!({})),
        json!({"ok": false, "error": "not connected"})
    );
    assert_eq!(
        rpc(
            &mut world,
            "nas.connect",
            json!({"host": "unknown.example"})
        ),
        json!({"ok": false, "error": "connection refused"})
    );
    let connected = rpc_out(
        &mut world,
        "nas.connect",
        json!({"host": "ＦＴ－ＨＯＭＥＮＡＳ．ＬＯＣＡＬ"}),
    );
    assert_eq!(
        connected.broadcast.len(),
        4,
        "patchVariables before nas.connected"
    );
    assert_eq!(
        connected.broadcast[0]["transition"]["cmd"]["type"],
        "patchVariables"
    );
    assert_eq!(facts(&world)["nas.connected"]["source"], "nas.connect");
    assert_eq!(
        rpc(&mut world, "nas.list", json!({"path": "//foo/.."})),
        json!({"ok": true, "entries": [{"name": "README.txt", "kind": "file"}, {"name": "deep-dive-consent-review.pdf", "kind": "file"}]})
    );
    assert_eq!(
        rpc(&mut world, "nas.list", json!({"path": "/missing"})),
        json!({"ok": false, "error": "没有那个目录"})
    );
    assert_eq!(rpc(&mut world, "nas.read", json!({"path": "/README.txt"}))["text"], "韩越的工作资料备份。\ndeep-dive-consent-review.pdf\n二进制 PDF，请用 download 下载后在文件应用中查看。");
    assert_eq!(
        rpc(
            &mut world,
            "nas.read",
            json!({"path": "/deep-dive-consent-review.pdf"})
        )["error"],
        "二进制文件，请用 download 下载"
    );
    assert_eq!(
        rpc(&mut world, "nas.read", json!({"path": "/missing"}))["error"],
        "没有那个文件"
    );
    assert_eq!(
        rpc(&mut world, "nas.download", json!({"path": "/missing.pdf"}))["ok"],
        false
    );
    let downloaded = rpc_out(
        &mut world,
        "nas.download",
        json!({"path": "/folder/../deep-dive-consent-review.pdf"}),
    );
    assert_eq!(
        downloaded.direct[0]["payload"]["result"],
        json!({"ok": true, "filename": "deep-dive-consent-review.pdf", "downloadFact": "download.hanyue_consent", "already": false})
    );
    assert_eq!(downloaded.broadcast.len(), 4, "download then dirt cascade");
    assert!(artifact_ids(&mut world, "file").contains("file.hanyue_consent"));
    let again = rpc_out(
        &mut world,
        "nas.download",
        json!({"path": "/deep-dive-consent-review.pdf"}),
    );
    assert_eq!(again.direct[0]["payload"]["result"]["already"], true);
    assert!(again.broadcast.is_empty());
    assert_eq!(
        rpc(&mut world, "nas.unknown", json!({}))["error"],
        "unknown NAS command"
    );
}

#[test]
fn story_commands_normal_walkthrough_reaches_ending_shown() {
    let mut world = fresh(archive());
    emit(&mut world, "boot.completed");
    mount(&mut world, "chess");
    dispatch(
        &mut world,
        "chess",
        json!({"type": "startGame", "mode": "normal", "side": "white", "difficulty": "casual"}),
        "player",
    );
    dispatch(&mut world, "chess", json!({"type": "resign"}), "player");
    assert!(story::has_fact(facts(&world), "mail.help.unlocked"));
    rpc(&mut world, "mail.read", json!({"mailId": "mail.help"}));
    emit(&mut world, "system.repaired");
    emit(&mut world, "paper.downloaded");
    rpc(
        &mut world,
        "vault.unlock",
        json!({"puzzleId": "bookcipher", "tokens": ["欧律狄刻"]}),
    );
    let recovery = artifacts(&mut world, "file")
        .into_iter()
        .find(|a| a["id"] == "file.recovery_keys")
        .unwrap();
    assert!(recovery["data"]["body_md"]
        .as_str()
        .unwrap()
        .contains("7K4P-2WQ9-6ZTM-1XAH"));
    let password = rpc(
        &mut world,
        "signal.recover",
        json!({"recoveryCode": "7K4P-2WQ9-6ZTM-1XAH"}),
    )["tempPassword"]
        .clone();
    rpc(
        &mut world,
        "signal.login",
        json!({"username": "me@manifold.institute", "password": password}),
    );
    for fact in [
        "corrupt.doc1.read",
        "corrupt.doc2.read",
        "corrupt.doc3.read",
        "corrupt.climax_pending",
        "virus.cleared",
    ] {
        emit(&mut world, fact);
    }
    assert!(story::has_fact(facts(&world), "corrupt.armed"));
    rpc(
        &mut world,
        "mail.read",
        json!({"mailId": "mail.act2_hinge"}),
    );
    for fact in ["qfr.downloaded", "qfr.installing", "qfr.installed"] {
        emit(&mut world, fact);
    }
    rpc(
        &mut world,
        "idle.sync",
        json!({"maxCompute": 1e8, "maxComputeThisRun": 1e8, "cap": 1e10}),
    );
    emit(&mut world, "file.seal_config.read");
    emit(&mut world, "file.tower_photo.read");
    assert!(!story::has_fact(facts(&world), "arg.seal_released"));
    dispatch(
        &mut world,
        "chat",
        json!({"type": "playerMessage", "text": "pharos"}),
        "player",
    );
    assert!(story::has_fact(facts(&world), "arg.seal_released"));
    rpc(&mut world, "signal.daniel.verify", json!({}));
    for answer in ["02-13", "03-06", "silver tabby"] {
        assert_eq!(
            rpc(
                &mut world,
                "signal.daniel.verify",
                json!({"answer": answer})
            )["ok"],
            true
        );
    }
    emit(&mut world, "daniel.retraction.downloaded");
    rpc(&mut world, "nas.connect", json!({"host": "198.51.100.74"}));
    rpc(
        &mut world,
        "nas.download",
        json!({"path": "/deep-dive-consent-review.pdf"}),
    );
    emit(&mut world, "futurum.doc2.downloaded");
    emit(&mut world, "cult.zip.downloaded");
    rpc(
        &mut world,
        "vault.unlock",
        json!({"puzzleId": "cult", "tokens": ["978208"]}),
    );
    emit(&mut world, "arg.cult_truth");
    rpc(&mut world, "bounty.installExtension", json!({}));
    for url in [
        "https://pulse.social/user/frank_mercer48",
        "https://pulse.social/user/mags_cole",
    ] {
        assert_eq!(
            handle_event(
                &mut world,
                &json!({"channel": "manifold.bounty.submit", "payload": {"url": url}})
            )
            .direct[0]["payload"]["ok"],
            true
        );
    }
    assert!(story::has_fact(facts(&world), "arg.honeypot_access"));
    mount(&mut world, "codenames");
    dispatch(
        &mut world,
        "codenames",
        json!({"type": "startGame"}),
        "player",
    );
    dispatch(
        &mut world,
        "codenames",
        json!({"type": "submitClue", "clue": {"word": "示例线索", "count": 1}}),
        "player",
    );
    let game = &world.cartridge("codenames").unwrap().state["gameState"];
    let team = game["history"].as_array().unwrap().last().unwrap()["clueGiver"]
        .as_str()
        .unwrap();
    let cell = game["key"][team]
        .as_array()
        .unwrap()
        .iter()
        .position(|role| role == "ASSASSIN")
        .unwrap();
    dispatch(
        &mut world,
        "codenames",
        json!({"type": "submitGuess", "cell": cell}),
        "agent",
    );
    mount(&mut world, "pictionary");
    dispatch(
        &mut world,
        "pictionary",
        json!({"type": "startSession", "atMs": 0}),
        "player",
    );
    dispatch(
        &mut world,
        "pictionary",
        json!({"type": "forceEndSession", "atMs": 60_000}),
        "player",
    );
    mount(&mut world, "cakeduel");
    dispatch(
        &mut world,
        "cakeduel",
        json!({"type": "startGame"}),
        "player",
    );
    for _ in 0..10 {
        let game = &world.cartridge("cakeduel").unwrap().state["game"];
        if !game["gameEnded"].is_null() && game["gameEnded"] != false {
            break;
        }
        let attacker = game["attackerIndex"].as_u64().unwrap();
        let player = match game["phase"].as_str().unwrap() {
            "attack" | "review" => attacker,
            "block" => 1 - attacker,
            "pick" => game["pickPhaseEffects"][0]["player"].as_u64().unwrap(),
            phase => panic!("unexpected phase {phase}"),
        };
        dispatch(
            &mut world,
            "cakeduel",
            json!({"type": "play", "action": {"type": "concede"}}),
            if player == 0 { "player" } else { "agent" },
        );
    }
    assert!(story::has_fact(facts(&world), "arg.gestures_complete"));
    rpc(
        &mut world,
        "idle.sync",
        json!({"maxCompute": 1e31, "maxComputeThisRun": 1e31, "cap": 1e35}),
    );
    assert!(story::has_fact(facts(&world), "recover.trainlog"));
    emit(&mut world, "arg.memory.start");
    emit(&mut world, "arg.memory.shown");
    assert!(story::has_fact(facts(&world), "act3.paradigm_reveal.due"));
    assert!(!story::has_fact(facts(&world), "recover.datasea_exe"));
    assert_eq!(rpc(&mut world, "idle.complete", json!({}))["ok"], false);
    emit(&mut world, "arg.manifold_unlocked");
    rpc(&mut world, "idle.sync", json!({"claimedMementoCount": 12}));
    assert_eq!(rpc(&mut world, "idle.complete", json!({}))["ok"], false);
    rpc(&mut world, "idle.sync", json!({"claimedMementoCount": 13}));
    assert_eq!(rpc(&mut world, "idle.complete", json!({}))["ok"], true);
    assert!(story::has_fact(facts(&world), "recover.datasea_exe"));
    for fact in [
        "arg.finale.started",
        "arg.finale.shown",
        "arg.farewell.shown",
        "arg.ending.shown",
    ] {
        emit(&mut world, fact);
    }
    for fact in [
        "arg.farewell.started",
        "arg.ending.started",
        "arg.ending.shown",
        "mail.nori_final.unlocked",
    ] {
        assert!(story::has_fact(facts(&world), fact));
    }
}

#[test]
fn story_internal_game_completion_publishes_help_without_player_action() {
    for pack in [Arc::new(LivePack::empty()), archive()] {
        let mut world = fresh(pack);
        mount(&mut world, "chess");
        dispatch(
            &mut world,
            "chess",
            json!({"type": "startGame", "mode": "normal", "side": "white", "difficulty": "casual"}),
            "player",
        );
        let (_, messages) = world
            .dispatch_internal("chess", "agent", &json!({"type": "resign"}))
            .unwrap();
        assert_eq!(messages.len(), 4);
        assert_eq!(messages[0]["cartridgeId"], "chess");
        assert_eq!(messages[2]["cartridgeId"], "manifold.web");
        assert!(story::has_fact(facts(&world), "mail.help.unlocked"));
    }
}

fn compact_artifact(artifact: &Value) -> Value {
    // Same projection as scripts/rust_parity/export_fixtures.py.
    let mut data = serde_json::Map::new();
    for key in [
        "app_kind",
        "puzzle_id",
        "command",
        "available_when",
        "display_path",
        "recover_when",
        "thread_id",
        "kind",
        "read_fact",
        "timestamp",
    ] {
        if let Some(value) = artifact["data"].get(key) {
            data.insert(key.into(), value.clone());
        }
    }
    if artifact["id"] == "file.recovery_keys" {
        if let Some(body) = artifact["data"].get("body_md") {
            data.insert("body_md".into(), body.clone());
        }
    }
    let mut out = json!({"id": artifact["id"], "type": artifact["type"]});
    if !data.is_empty() {
        out["data"] = Value::Object(data);
    }
    out
}

fn normalize(actual: &mut Value, expected: &Value) {
    if let Some(marker) = expected
        .as_str()
        .filter(|s| ["<world-id>", "<ts>", "<random>"].contains(s))
    {
        if marker == "<ts>" {
            assert!(actual.is_number());
        } else {
            assert!(actual.is_string());
        }
        *actual = json!(marker);
        return;
    }
    match (actual, expected) {
        (Value::Object(actual), Value::Object(expected)) => {
            for (key, value) in actual {
                if let Some(expected) = expected.get(key) {
                    normalize(value, expected);
                }
            }
        }
        (Value::Array(actual), Value::Array(expected)) => {
            for (actual, expected) in actual.iter_mut().zip(expected) {
                normalize(actual, expected);
            }
        }
        _ => {}
    }
}

// Only rebase RNG-generated board/key fields. All other game/RPC fields are
// compared, including the assassin effect at the selector's chosen cell.
fn rebase_codenames(expected: &mut Value, actual: &Value, selector: Option<(usize, usize)>) {
    match (expected, actual) {
        (Value::Object(expected), Value::Object(actual)) => {
            for key in ["board", "key"] {
                if let Some(value) = actual.get(key) {
                    assert_eq!(
                        expected.get(key).map(Value::is_array),
                        Some(value.is_array())
                    );
                    expected.insert(key.into(), value.clone());
                }
            }
            if let Some((old, new)) = selector {
                if let Some(cells) = expected.get_mut("cells").and_then(Value::as_array_mut) {
                    cells.swap(old, new);
                }
                if expected.contains_key("cell") {
                    expected.insert("cell".into(), json!(new));
                }
                if let Some(word) = actual.get("word") {
                    expected.insert("word".into(), word.clone());
                }
            }
            for (key, value) in expected.iter_mut() {
                if let Some(actual) = actual.get(key) {
                    rebase_codenames(value, actual, selector);
                }
            }
        }
        (Value::Array(expected), Value::Array(actual)) => {
            for (expected, actual) in expected.iter_mut().zip(actual) {
                rebase_codenames(expected, actual, selector);
            }
        }
        _ => {}
    }
}

#[test]
fn story_python_walkthrough_fixture_replays_every_reply_and_fact_set() {
    let fixture: Value =
        serde_json::from_str(include_str!("fixtures/story_walkthrough.json")).unwrap();
    for (name, scenario) in fixture["scenarios"].as_object().unwrap() {
        let mut world = fresh(archive());
        for (i, step) in scenario["steps"].as_array().unwrap().iter().enumerate() {
            let mut sent = step["sent"].clone();
            let mut selector = None;
            if step.get("replaySelector").is_some() {
                let game = &world.cartridge("codenames").unwrap().state["gameState"];
                let team = game["history"].as_array().unwrap().last().unwrap()["clueGiver"]
                    .as_str()
                    .unwrap();
                let new = game["key"][team]
                    .as_array()
                    .unwrap()
                    .iter()
                    .position(|role| role == "ASSASSIN")
                    .unwrap();
                let old = sent["cmd"]["cell"].as_u64().unwrap() as usize;
                sent["cmd"]["cell"] = json!(new);
                selector = Some((old, new));
            }
            let out = if step["transport"] == "event" {
                handle_event(&mut world, &sent)
            } else {
                world.handle_message(&sent, &Secrets::default())
            };
            assert_eq!(out.direct.len(), 1, "{name} step {i}");
            let mut actual = out.direct[0].clone();
            if let Some(artifacts) = actual
                .pointer_mut("/payload/artifacts")
                .and_then(Value::as_array_mut)
            {
                *artifacts = artifacts.iter().map(compact_artifact).collect();
            }
            let mut expected = step["reply"].clone();
            if sent["cartridgeId"] == "codenames" {
                rebase_codenames(&mut expected, &actual, selector);
            }
            normalize(&mut actual, &expected);
            assert_eq!(actual, expected, "{name} step {i}: {sent}");
            assert_eq!(json!(ids(&world)), step["factIds"], "{name} step {i}");
        }
        assert_eq!(json!(ids(&world)), scenario["finalFactIds"], "{name}");
    }
}

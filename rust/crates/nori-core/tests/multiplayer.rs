//! Remote human opponents: seat leases, Nori suppression and agent-perspective views.

use nori_core::live_pack::LivePack;
use nori_core::world::{Outbound, Secrets, World};
use nori_core::snapshot;
use serde_json::{json, Value};
use std::sync::Arc;

fn new_world() -> World {
    World::new("guest_0123456789abcdef0123456789abcdef", Some("en"), true, Arc::new(LivePack::empty()))
}

fn send(world: &mut World, message: Value) -> Outbound {
    world.handle_message(&message, &Secrets::default())
}

fn mount(world: &mut World, game: &str) -> Outbound {
    send(world, json!({"type": "mount_cartridge", "cartridgeId": game, "requestId": format!("m-{game}")}))
}

fn lease(world: &mut World, game: &str, enabled: bool) -> Outbound {
    send(world, json!({"type": "event", "channel": "multiplayer.remote_opponent", "requestId": "lease", "payload": {"cartridgeId": game, "enabled": enabled}}))
}

fn dispatch(world: &mut World, game: &str, actor: &str, request: &str, cmd: Value) -> Outbound {
    let head = world.cartridge(game).unwrap().head_version;
    send(world, json!({"type": "dispatch", "actor": actor, "cartridgeId": game, "requestId": request, "expectedHeadVersion": head, "cmd": cmd}))
}

fn remote_views(out: &Outbound) -> Vec<&Value> {
    out.broadcast.iter().filter(|m| m["channel"] == "multiplayer.remote_view").collect()
}

#[test]
fn lease_suppresses_nori_and_emits_agent_views() {
    let mut world = new_world();
    mount(&mut world, "chess");
    let result = lease(&mut world, "chess", true);
    let reply = &result.direct[0];
    assert_eq!(reply["channel"], "multiplayer.remote_opponent.result");
    assert_eq!(reply["payload"]["ok"], true);
    assert_eq!(reply["payload"]["runtime"]["state"]["settings"]["playerSide"], "black");
    assert!(world.remote_opponent("chess"));

    let out = dispatch(&mut world, "chess", "player", "start", json!({"type": "startGame", "mode": "normal", "side": "white", "difficulty": "casual"}));
    assert!(out.tasks.is_empty(), "Nori must not take the remote seat");
    let views = remote_views(&out);
    assert_eq!(views.len(), 1);
    let view = &views[0]["payload"];
    assert_eq!(view["runtime"]["state"]["settings"]["playerSide"], "black");
    let events = view["transition"]["events"].as_array().unwrap();
    assert!(events.iter().any(|e| e["type"] == "game_start" && e["playerSide"] == "black"));
    assert!(view["transition"].get("cmd").is_none());

    let out = dispatch(&mut world, "chess", "player", "e4", json!({"type": "move", "from": "e2", "to": "e4"}));
    assert!(out.tasks.is_empty());
    let out = dispatch(&mut world, "chess", "agent", "e5", json!({"type": "move", "from": "e7", "to": "e5"}));
    assert_eq!(out.direct[0]["success"], true, "{:?}", out.direct);
    assert_eq!(remote_views(&out)[0]["payload"]["transition"]["actor"], "player");
}

#[test]
fn releasing_the_seat_hands_the_turn_back_to_nori() {
    let mut world = new_world();
    mount(&mut world, "chess");
    lease(&mut world, "chess", true);
    dispatch(&mut world, "chess", "player", "start", json!({"type": "startGame", "mode": "normal", "side": "white", "difficulty": "casual"}));
    dispatch(&mut world, "chess", "player", "e4", json!({"type": "move", "from": "e2", "to": "e4"}));
    let out = lease(&mut world, "chess", false);
    assert!(!world.remote_opponent("chess"));
    assert_eq!(out.tasks.len(), 1, "Nori resumes the pending black move");
}

#[test]
fn views_are_only_emitted_while_leased() {
    let mut world = new_world();
    mount(&mut world, "codenames");
    let out = dispatch(&mut world, "codenames", "player", "s", json!({"type": "startGame", "mode": "normal"}));
    assert!(remote_views(&out).is_empty());
}

#[test]
fn cakeduel_remote_view_names_the_remote_hand_only() {
    let mut world = new_world();
    mount(&mut world, "cakeduel");
    lease(&mut world, "cakeduel", true);
    let out = dispatch(&mut world, "cakeduel", "player", "s", json!({"type": "startGame", "mode": "normal", "difficulty": "soldier"}));
    assert!(out.tasks.is_empty());
    let raw = world.cartridge("cakeduel").unwrap().state.clone();
    let view = &remote_views(&out)[0]["payload"]["runtime"]["state"]["game"];
    let names: Vec<&Value> = view["cardList"].as_array().unwrap().iter().filter(|n| !n.is_null()).collect();
    assert_eq!(names.len(), raw["game"]["players"][1]["hand"].as_array().unwrap().len());
    assert_eq!(view["players"][0]["cakes"], raw["game"]["players"][1]["cakes"]);
}

#[test]
fn leases_survive_snapshots() {
    let mut world = new_world();
    mount(&mut world, "pictionary");
    lease(&mut world, "pictionary", true);
    let restored = snapshot::world_from_snapshot(&snapshot::world_snapshot(&world), Arc::new(LivePack::empty())).unwrap();
    assert!(restored.remote_opponent("pictionary"));
    let bare = new_world();
    assert!(snapshot::world_snapshot(&bare).get("remoteOpponents").is_none());
}

#[test]
fn unknown_games_are_rejected() {
    let mut world = new_world();
    let out = lease(&mut world, "chat", true);
    assert_eq!(out.direct[0]["payload"]["ok"], false);
    assert!(world.remote_opponents.is_empty());
}

#[test]
fn views_report_the_remote_turn_and_nori_can_cover_one_move() {
    let mut world = new_world();
    mount(&mut world, "chess");
    lease(&mut world, "chess", true);
    let out = dispatch(&mut world, "chess", "player", "start", json!({"type": "startGame", "mode": "normal", "side": "white", "difficulty": "casual"}));
    assert_eq!(remote_views(&out)[0]["payload"]["agentTurn"], false);
    let out = dispatch(&mut world, "chess", "player", "e4", json!({"type": "move", "from": "e2", "to": "e4"}));
    assert_eq!(remote_views(&out)[0]["payload"]["agentTurn"], true);
    let head = world.cartridge("chess").unwrap().head_version;
    let out = send(&mut world, json!({"type": "event", "channel": "multiplayer.agent_step", "requestId": "step", "payload": {"cartridgeId": "chess"}}));
    assert_eq!(out.direct[0]["payload"]["ok"], true);
    assert_eq!(world.cartridge("chess").unwrap().head_version, head + 1, "exactly one covered move");
    assert_eq!(remote_views(&out)[0]["payload"]["agentTurn"], false);
    assert!(world.remote_opponent("chess"), "the seat stays leased");
    let out = send(&mut world, json!({"type": "event", "channel": "multiplayer.agent_step", "requestId": "again", "payload": {"cartridgeId": "chess"}}));
    assert_eq!(out.direct[0]["payload"]["ok"], false, "nothing to cover on the host's turn");
}

#[test]
fn a_remote_guesser_gets_pictionary_hints_but_no_nori_guesses() {
    let mut world = new_world();
    mount(&mut world, "pictionary");
    lease(&mut world, "pictionary", true);
    let out = dispatch(&mut world, "pictionary", "player", "s", json!({"type": "startSession", "atMs": nori_core::jsonutil::now_ms(), "settings": {"sessionDurationMs": 180000, "locale": "en"}}));
    assert_eq!(out.direct[0]["success"], true, "{:?}", out.direct);
    let labels: Vec<&str> = out.tasks.iter().map(|task| task.label()).collect();
    assert!(labels.iter().any(|label| label.contains("hint")), "{labels:?}");
    assert!(!labels.iter().any(|label| label.contains("guess")), "{labels:?}");
}

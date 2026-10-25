//! Two-human multiplayer for the built-in games.
//!
//! The host browser owns the authoritative world. A remote human takes the seat
//! that Nori (actor `"agent"`) normally plays: the host relays the remote
//! player's commands as `"agent"` and forwards the agent-perspective projection
//! built here. Nothing in this module feeds a reducer, the agent policy or
//! persistence: every swapped value is a browser view only.

use crate::cartridge::Cartridge;
use crate::jsonutil::Json;
use serde_json::{json, Value};

/// Cartridges that support a remote human opponent.
pub const GAMES: [&str; 4] = ["cakeduel", "codenames", "chess", "pictionary"];

pub const VIEW_CHANNEL: &str = "multiplayer.remote_view";

fn swap_role(value: &mut Value) {
    match value.as_str() {
        Some("player") => *value = json!("agent"),
        Some("agent") => *value = json!("player"),
        _ => {}
    }
}

fn swap_seat(value: &mut Value) {
    match value.as_u64() {
        Some(0) => *value = json!(1),
        Some(1) => *value = json!(0),
        _ => {}
    }
}

fn swap_color(value: &mut Value) {
    match value.as_str() {
        Some("white") => *value = json!("black"),
        Some("black") => *value = json!("white"),
        _ => {}
    }
}

/// Pictionary marks seats with `drawer`, `guesser` and `by`; guesses are free text, so
/// only those keys are touched (never a global string replace).
fn swap_pictionary_roles(value: &mut Value) {
    match value {
        Value::Object(map) => {
            for (key, child) in map.iter_mut() {
                if matches!(key.as_str(), "drawer" | "guesser" | "by") {
                    swap_role(child);
                } else {
                    swap_pictionary_roles(child);
                }
            }
        }
        Value::Array(items) => items.iter_mut().for_each(swap_pictionary_roles),
        _ => {}
    }
}

fn swap_cakeduel_game(game: &mut Value) {
    if !game.is_object() {
        return;
    }
    if let Some(players) = game.get_mut("players").and_then(Value::as_array_mut) {
        if players.len() == 2 {
            players.swap(0, 1);
        }
    }
    if let Some(value) = game.get_mut("attackerIndex") {
        swap_seat(value);
    }
    for key in ["boutWinners", "nextAttackerIndexOverride"] {
        if let Some(items) = game.get_mut(key).and_then(Value::as_array_mut) {
            items.iter_mut().for_each(swap_seat);
        }
    }
    if let Some(winner) = game.pointer_mut("/gameEnded/winner") {
        swap_seat(winner);
    }
    if let Some(effects) = game.get_mut("pickPhaseEffects").and_then(Value::as_array_mut) {
        for effect in effects {
            if let Some(player) = effect.get_mut("player") {
                swap_seat(player);
            }
        }
    }
}

/// The raw state as seen from the agent seat. View-only and involutive.
pub fn swap_state(cartridge_id: &str, state: &Json) -> Json {
    let mut next = state.clone();
    match cartridge_id {
        "chess" => {
            if let Some(side) = next.pointer_mut("/settings/playerSide") {
                swap_color(side);
            }
        }
        "codenames" => {
            let counterpart = next.get("counterpartSide").cloned();
            let agent = next.get("agentSide").cloned();
            if let (Some(counterpart), Some(agent), Some(object)) =
                (counterpart, agent, next.as_object_mut())
            {
                object.insert("counterpartSide".into(), agent);
                object.insert("agentSide".into(), counterpart);
            }
        }
        "cakeduel" => {
            if let Some(game) = next.get_mut("game") {
                swap_cakeduel_game(game);
            }
            // Debug fixtures name both hands in plaintext and are host-only.
            if let Some(object) = next.as_object_mut() {
                object.insert("debugScenario".into(), Value::Null);
            }
        }
        "pictionary" => swap_pictionary_roles(&mut next),
        _ => {}
    }
    next
}

fn swap_cakeduel_event(event: &mut Value) {
    let Some(object) = event.as_object_mut() else {
        return;
    };
    for key in ["player", "challenger", "from", "to", "winner", "attackerIndex"] {
        if let Some(value) = object.get_mut(key) {
            swap_seat(value);
        }
    }
    if let Some(cakes) = object.get_mut("cakesAfter").and_then(Value::as_array_mut) {
        if cakes.len() == 2 {
            cakes.swap(0, 1);
        }
    }
    // Tells are rolled from Nori's private bluff status; a human seat has none.
    object.remove("tell");
}

fn flip_outcome(event: &mut Value) {
    if let Some(outcome) = event.get_mut("outcome") {
        match outcome.as_str() {
            Some("win") => *outcome = json!("loss"),
            Some("loss") => *outcome = json!("win"),
            _ => {}
        }
    }
}

fn swap_event(cartridge_id: &str, event: &mut Value, swapped_state: &Json) {
    let kind = event.get("type").and_then(Value::as_str).unwrap_or("").to_string();
    match cartridge_id {
        "chess" => {
            if let Some(side) = event.get_mut("playerSide") {
                swap_color(side);
            }
            if kind == "game_outcome" {
                flip_outcome(event);
            }
        }
        "codenames" => {
            if let Some(by) = event.get_mut("by") {
                match by.as_str() {
                    Some("counterpart") => *by = json!("agent"),
                    Some("agent") => *by = json!("counterpart"),
                    _ => {}
                }
            }
            if kind == "game_start" {
                if let Some(side) = swapped_state.get("counterpartSide") {
                    event["counterpartSide"] = side.clone();
                }
            }
            // Codenames is cooperative: the shared outcome needs no flip.
        }
        "cakeduel" => {
            if kind == "engine" {
                if let Some(inner) = event.get_mut("event") {
                    swap_cakeduel_event(inner);
                }
            } else if kind == "game_outcome" {
                flip_outcome(event);
            }
        }
        "pictionary" => swap_pictionary_roles(event),
        _ => {}
    }
}

fn view_cartridge(cartridge: &Cartridge) -> Cartridge {
    let mut view = cartridge.clone();
    view.state = swap_state(&cartridge.id, &cartridge.state);
    view
}

/// Agent-perspective snapshot in the shape of a `runtimes[]` entry.
pub fn snapshot(cartridge: &Cartridge) -> Json {
    let view = view_cartridge(cartridge);
    json!({
        "visibilityFenceId": crate::world::fence_for(&cartridge.id),
        "headVersion": cartridge.head_version,
        "visibleVersion": cartridge.head_version,
        "state": view.client_view(&view.state),
    })
}

/// Agent-perspective projection of one committed raw transition. `cartridge` is the
/// state the transition produced. The browser rebuilds patches from `state`.
pub fn transition(cartridge: &Cartridge, raw: &Json) -> Json {
    let view = view_cartridge(cartridge);
    let mut swapped = raw.clone();
    if let Some(actor) = swapped.get_mut("actor") {
        swap_role(actor);
    }
    if let Some(events) = swapped.get_mut("events").and_then(Value::as_array_mut) {
        for event in events.iter_mut() {
            swap_event(&cartridge.id, event, &view.state);
        }
    }
    // Commands of the other seat are not part of the remote view.
    if let Some(object) = swapped.as_object_mut() {
        object.insert("patches".into(), json!([]));
        object.remove("cmd");
    }
    let mut visible = view.client_transition(&swapped);
    visible["patches"] = json!([]);
    visible
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn swaps_are_involutions() {
        for id in GAMES {
            let cartridge = crate::cartridge::create(id, true, &crate::live_pack::LivePack::empty()).unwrap();
            let once = swap_state(id, &cartridge.state);
            assert_eq!(swap_state(id, &once), cartridge.state, "{id}");
        }
    }

    #[test]
    fn chess_and_codenames_seats_flip() {
        let chess = json!({"settings": {"playerSide": "white"}});
        assert_eq!(swap_state("chess", &chess)["settings"]["playerSide"], "black");
        let codenames = json!({"counterpartSide": "A", "agentSide": "B"});
        let swapped = swap_state("codenames", &codenames);
        assert_eq!((swapped["counterpartSide"].as_str(), swapped["agentSide"].as_str()), (Some("B"), Some("A")));
    }

    #[test]
    fn cakeduel_seats_and_events_flip() {
        let state = json!({"game": {"players": [{"cakes": 3}, {"cakes": 4}], "attackerIndex": 0, "boutWinners": [1], "gameEnded": {"winner": 1}}});
        let swapped = swap_state("cakeduel", &state);
        assert_eq!(swapped["game"]["players"][0]["cakes"], 4);
        assert_eq!(swapped["game"]["attackerIndex"], 1);
        assert_eq!(swapped["game"]["boutWinners"][0], 0);
        assert_eq!(swapped["game"]["gameEnded"]["winner"], 0);
        let mut event = json!({"type": "engine", "event": {"type": "claim_made", "player": 1, "tell": "x", "cakesAfter": [1, 2]}});
        swap_event("cakeduel", &mut event, &swapped);
        assert_eq!(event["event"]["player"], 0);
        assert_eq!(event["event"]["cakesAfter"], json!([2, 1]));
        assert!(event["event"].get("tell").is_none());
    }

    #[test]
    fn pictionary_roles_flip_but_guess_text_does_not() {
        let state = json!({"gameState": {"round": {"roles": {"drawer": "player", "guesser": "agent"}, "lastGuess": {"by": "player", "text": "agent"}}}});
        let swapped = swap_state("pictionary", &state);
        assert_eq!(swapped["gameState"]["round"]["roles"]["drawer"], "agent");
        assert_eq!(swapped["gameState"]["round"]["lastGuess"]["by"], "agent");
        assert_eq!(swapped["gameState"]["round"]["lastGuess"]["text"], "agent");
    }
}

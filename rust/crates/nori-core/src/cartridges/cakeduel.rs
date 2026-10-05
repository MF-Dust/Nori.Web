use crate::cartridge::{CommandRejected, ReducerResult};
use crate::jsonutil::{now_ms, Json};
use rand::rngs::StdRng;
use rand::seq::SliceRandom;
use rand::SeedableRng;
use serde_json::{json, Value};

const BASE_CARDS: &[&str] = &[
    "soldier",
    "soldier",
    "soldier",
    "soldier",
    "soldier",
    "archer",
    "archer",
    "archer",
    "archer",
    "defender",
    "defender",
    "defender",
    "defender",
    "wizard",
    "wizard",
    "wizard",
    "scientist",
    "scientist",
    "scientist",
    "wolfy",
];
const SPECIAL_CARDS: &[&str] = &[
    "assassin",
    "scout",
    "summoner",
    "quartermaster",
    "oracle",
    "priest",
    "angel",
    "baacrates",
    "agent_u",
    "pierrot",
];

fn card_type(name: &str) -> &'static str {
    match name {
        "soldier" | "archer" => "physical",
        "wizard" => "magical",
        "defender" => "blocker",
        "scientist" => "blocker",
        "wolfy" => "unclaimable",
        _ => "",
    }
}

fn attack_damage(name: &str) -> Option<i64> {
    match name {
        "soldier" | "archer" => Some(1),
        "wizard" => Some(2),
        _ => None,
    }
}

fn blocks(name: &str) -> Option<&'static str> {
    match name {
        "defender" => Some("physical"),
        "scientist" => Some("magical"),
        _ => None,
    }
}

pub fn initial_state() -> Json {
    json!({
        "config": Value::Null,
        "game": Value::Null,
        "settings": {"difficulty": "soldier", "roundsToWin": 3, "seed": 20260127},
        "tutorial": Value::Null,
        "lastError": Value::Null,
        "debugScenarioId": Value::Null,
        "debugScenario": Value::Null,
    })
}

fn engine_event(event_type: &str, payload: Json) -> Json {
    let mut event = json!({"type": event_type});
    if let (Some(dst), Some(src)) = (event.as_object_mut(), payload.as_object()) {
        for (k, v) in src {
            dst.insert(k.clone(), v.clone());
        }
    }
    json!({"type": "engine", "event": event})
}

fn player_index(actor: &str) -> Result<usize, CommandRejected> {
    match actor {
        "player" => Ok(0),
        "agent" => Ok(1),
        _ => Err(CommandRejected::new("Unknown actor")),
    }
}

fn phasing_player(game: &Json) -> Result<usize, CommandRejected> {
    let phase = game.get("phase").and_then(Value::as_str).unwrap_or("");
    let attacker = game
        .get("attackerIndex")
        .and_then(|v| v.as_u64())
        .unwrap_or(0) as usize;
    match phase {
        "attack" | "review" => Ok(attacker),
        "block" => Ok(1 - attacker),
        "pick" => game
            .pointer("/pickPhaseEffects/0/player")
            .and_then(|v| v.as_u64())
            .map(|n| n as usize)
            .ok_or_else(|| CommandRejected::new("Invalid game phase")),
        _ => Err(CommandRejected::new("Invalid game phase")),
    }
}

fn card_name(game: &Json, card_id: i64) -> Result<String, CommandRejected> {
    game.pointer(&format!("/cardList/{card_id}"))
        .and_then(Value::as_str)
        .map(str::to_string)
        .ok_or_else(|| CommandRejected::new("Invalid card reference"))
}

fn i64_list(value: &Value) -> Vec<i64> {
    value
        .as_array()
        .map(|a| a.iter().filter_map(|v| v.as_i64()).collect())
        .unwrap_or_default()
}

fn claim_options(game: &Json, phase: &str) -> Vec<String> {
    let card_list = game
        .get("cardList")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default();
    let mut names = Vec::new();
    for item in &card_list {
        if let Some(name) = item.as_str() {
            if !names.iter().any(|n: &String| n == name) {
                names.push(name.to_string());
            }
        }
    }
    if phase == "attack" {
        let attacker = game
            .get("attackerIndex")
            .and_then(|v| v.as_u64())
            .unwrap_or(0);
        let blacklist = game
            .pointer(&format!("/players/{attacker}/claimBlacklist"))
            .and_then(Value::as_array)
            .cloned()
            .unwrap_or_default();
        return names
            .into_iter()
            .filter(|name| matches!(card_type(name), "physical" | "magical"))
            .filter(|name| !blacklist.iter().any(|b| b.as_str() == Some(name)))
            .collect();
    }
    if phase == "block" {
        let Some(attack) = game
            .pointer("/attackingClaim/claim")
            .and_then(Value::as_str)
        else {
            return Vec::new();
        };
        let attack_type = card_type(attack);
        let defender = 1 - game
            .get("attackerIndex")
            .and_then(|v| v.as_u64())
            .unwrap_or(0);
        let blacklist = game
            .pointer(&format!("/players/{defender}/claimBlacklist"))
            .and_then(Value::as_array)
            .cloned()
            .unwrap_or_default();
        return ["defender", "scientist"]
            .into_iter()
            .filter(|name| blocks(name) == Some(attack_type))
            .filter(|name| !blacklist.iter().any(|b| b.as_str() == Some(name)))
            .map(str::to_string)
            .collect();
    }
    Vec::new()
}

fn legal_actions(game: &Json) -> Result<Vec<Json>, CommandRejected> {
    if game.get("gameEnded").is_some_and(|v| !v.is_null()) {
        return Ok(Vec::new());
    }
    let player = phasing_player(game)?;
    let hand = i64_list(
        game.pointer(&format!("/players/{player}/hand"))
            .unwrap_or(&Value::Null),
    );
    let phase = game.get("phase").and_then(Value::as_str).unwrap_or("");
    let mut result = Vec::new();
    let options = claim_options(game, phase);
    if matches!(phase, "attack" | "block") && !hand.is_empty() && !options.is_empty() {
        result.push(json!({
            "type": "claim",
            "availableHandIndices": (0..hand.len()).collect::<Vec<_>>(),
            "claimFrom": options,
        }));
    }
    if phase == "attack" {
        result.push(json!({"type": "pass"}));
        result.push(json!({"type": "concede"}));
    } else if matches!(phase, "block" | "review") {
        result.push(json!({"type": "pass"}));
        result.push(json!({"type": "challenge"}));
        result.push(json!({"type": "concede"}));
    }
    Ok(result)
}

fn draw_to_limits(game: &mut Json, events: &mut Vec<Json>) {
    for player_index in 0..2 {
        let limit = game
            .pointer(&format!("/players/{player_index}/handLimit"))
            .and_then(|v| v.as_i64())
            .unwrap_or(4);
        let hand_len = game
            .pointer(&format!("/players/{player_index}/hand"))
            .and_then(Value::as_array)
            .map(|a| a.len() as i64)
            .unwrap_or(0);
        let needed = (limit - hand_len).max(0) as usize;
        if needed == 0 {
            continue;
        }
        let mut deck = i64_list(game.get("deck").unwrap_or(&Value::Null));
        let take = needed.min(deck.len());
        let cards: Vec<i64> = deck.drain(..take).collect();
        game["deck"] = json!(deck);
        if let Some(hand) = game
            .pointer_mut(&format!("/players/{player_index}/hand"))
            .and_then(Value::as_array_mut)
        {
            hand.extend(cards.iter().copied().map(|id| json!(id)));
        }
        if !cards.is_empty() {
            events.push(engine_event(
                "card_drawn",
                json!({"zone": "deck", "cardIds": cards, "player": player_index}),
            ));
        }
    }
}

fn start_bout(game: &mut Json, events: &mut Vec<Json>, seed: u64) {
    let len = game
        .get("cardList")
        .and_then(Value::as_array)
        .map(|a| a.len())
        .unwrap_or(0);
    let mut deck: Vec<i64> = (0..len as i64).collect();
    let mut rng = StdRng::seed_from_u64(seed);
    deck.shuffle(&mut rng);
    game["deck"] = json!(deck);
    events.push(engine_event(
        "deck_shuffled",
        json!({"cardIds": game["deck"].clone()}),
    ));
    game["lastAttackPassed"] = json!(false);
    game["discard"] = json!([]);
    game["attackingClaim"] = Value::Null;
    game["blockingClaim"] = Value::Null;
    game["nextAttackerIndexOverride"] = json!([]);
    game["pickPhaseEffects"] = json!([]);
    for player in 0..2 {
        if let Some(obj) = game
            .pointer_mut(&format!("/players/{player}"))
            .and_then(Value::as_object_mut)
        {
            obj.insert("hand".into(), json!([]));
            obj.insert("handLimit".into(), json!(4));
            obj.insert("claimBlacklist".into(), json!([]));
            obj.insert("lastAttackingClaim".into(), Value::Null);
        }
    }
    let winner = game
        .get("boutWinners")
        .and_then(Value::as_array)
        .and_then(|a| a.last())
        .and_then(|v| v.as_i64());
    let attacker = if let Some(winner) = winner {
        1 - winner
    } else {
        0
    };
    game["attackerIndex"] = json!(attacker);
    game["players"][attacker as usize]["cakes"] = json!(3);
    game["players"][(1 - attacker) as usize]["cakes"] = json!(4);
    game["phase"] = json!("attack");
    events.push(engine_event(
        "bout_started",
        json!({"attackerIndex": attacker, "cakesAfter": [game["players"][0]["cakes"], game["players"][1]["cakes"]]}),
    ));
    events.push(engine_event(
        "phase_changed",
        json!({"player": attacker, "phase": "attack"}),
    ));
    draw_to_limits(game, events);
}

fn finish_game(game: &mut Json, winner: i64, events: &mut Vec<Json>) {
    game["gameEnded"] = json!({"winner": winner});
    events.push(engine_event("game_ended", json!({"winner": winner})));
}

fn end_bout(game: &mut Json, winner: i64, events: &mut Vec<Json>, seed: u64) {
    if let Some(a) = game["boutWinners"].as_array_mut() {
        a.push(json!(winner))
    }
    events.push(engine_event("bout_ended", json!({"winner": winner})));
    let rounds = game
        .pointer("/config/roundsToWin")
        .and_then(|v| v.as_i64())
        .unwrap_or(3);
    let wins = game
        .get("boutWinners")
        .and_then(Value::as_array)
        .map(|a| a.iter().filter(|v| v.as_i64() == Some(winner)).count() as i64)
        .unwrap_or(0);
    if wins >= rounds {
        finish_game(game, winner, events);
    } else {
        start_bout(game, events, seed.wrapping_add(wins as u64));
    }
}

fn advance_attacker(game: &mut Json, events: &mut Vec<Json>) {
    let override_next = game
        .get("nextAttackerIndexOverride")
        .and_then(Value::as_array)
        .and_then(|a| {
            if a.is_empty() {
                None
            } else {
                Some(a[0].clone())
            }
        });
    if let Some(next) = override_next {
        if let Some(a) = game["nextAttackerIndexOverride"].as_array_mut() {
            a.remove(0);
        }
        game["attackerIndex"] = next;
    } else {
        let current = game
            .get("attackerIndex")
            .and_then(|v| v.as_i64())
            .unwrap_or(0);
        game["attackerIndex"] = json!(1 - current);
    }
    game["phase"] = json!("attack");
    events.push(engine_event(
        "phase_changed",
        json!({"player": game["attackerIndex"], "phase": "attack"}),
    ));
    draw_to_limits(game, events);
}

fn transfer_cakes(game: &mut Json, from: usize, to: usize, amount: i64, events: &mut Vec<Json>) {
    let have = game
        .pointer(&format!("/players/{from}/cakes"))
        .and_then(|v| v.as_i64())
        .unwrap_or(0);
    let amount = amount.clamp(0, have);
    if amount <= 0 {
        return;
    }
    game["players"][from]["cakes"] = json!(have - amount);
    let dest = game
        .pointer(&format!("/players/{to}/cakes"))
        .and_then(|v| v.as_i64())
        .unwrap_or(0);
    game["players"][to]["cakes"] = json!(dest + amount);
    events.push(engine_event(
        "cakes_transferred",
        json!({"from": from, "to": to, "amount": amount, "cakesAfter": [game["players"][0]["cakes"], game["players"][1]["cakes"]]}),
    ));
}

fn discard_claims(game: &mut Json, events: &mut Vec<Json>) {
    for (field, pile) in [
        ("attackingClaim", "attack_pile"),
        ("blockingClaim", "block_pile"),
    ] {
        let Some(ids) = game
            .pointer(&format!("/{field}/cardIds"))
            .and_then(Value::as_array)
            .cloned()
        else {
            continue;
        };
        if let Some(discard) = game.get_mut("discard").and_then(Value::as_array_mut) {
            discard.extend(ids.iter().cloned());
        }
        events.push(engine_event(
            "card_discarded",
            json!({"cardIds": ids, "zone": pile}),
        ));
        game[field] = Value::Null;
    }
}

fn resolve_pass(game: &mut Json, events: &mut Vec<Json>, seed: u64) -> Result<(), CommandRejected> {
    let current = phasing_player(game)?;
    events.push(engine_event("pass_made", json!({"player": current})));
    if game.get("attackingClaim").is_none_or(Value::is_null) {
        if game
            .get("lastAttackPassed")
            .and_then(Value::as_bool)
            .unwrap_or(false)
        {
            let a = game
                .pointer("/players/0/cakes")
                .and_then(|v| v.as_i64())
                .unwrap_or(0);
            let b = game
                .pointer("/players/1/cakes")
                .and_then(|v| v.as_i64())
                .unwrap_or(0);
            end_bout(game, if a > b { 0 } else { 1 }, events, seed);
            return Ok(());
        }
        game["lastAttackPassed"] = json!(true);
        advance_attacker(game, events);
        return Ok(());
    }
    game["lastAttackPassed"] = json!(false);
    let attack_name = game
        .pointer("/attackingClaim/claim")
        .and_then(Value::as_str)
        .unwrap_or("")
        .to_string();
    let damage = attack_damage(&attack_name)
        .ok_or_else(|| CommandRejected::new("Attacking claim is not an attacker"))?;
    let attack_len = game
        .pointer("/attackingClaim/cardIds")
        .and_then(Value::as_array)
        .map(|a| a.len())
        .unwrap_or(0) as i64;
    let mut effective = attack_len;
    if let Some(block_name) = game.pointer("/blockingClaim/claim").and_then(Value::as_str) {
        if blocks(block_name) != Some(card_type(&attack_name)) {
            return Err(CommandRejected::new("Blocking claim is incompatible"));
        }
        let block_len = game
            .pointer("/blockingClaim/cardIds")
            .and_then(Value::as_array)
            .map(|a| a.len())
            .unwrap_or(0) as i64;
        effective = (effective - block_len).max(0);
    }
    let attacker = game
        .get("attackerIndex")
        .and_then(|v| v.as_u64())
        .unwrap_or(0) as usize;
    for _ in 0..effective {
        transfer_cakes(game, 1 - attacker, attacker, damage, events);
    }
    discard_claims(game, events);
    for player_index in 0..2 {
        if game
            .pointer(&format!("/players/{player_index}/cakes"))
            .and_then(|v| v.as_i64())
            == Some(0)
        {
            end_bout(game, (1 - player_index) as i64, events, seed);
            return Ok(());
        }
    }
    advance_attacker(game, events);
    Ok(())
}

fn resolve_challenge(
    game: &mut Json,
    events: &mut Vec<Json>,
    seed: u64,
) -> Result<(), CommandRejected> {
    let claim = if game.get("blockingClaim").is_some_and(|v| !v.is_null()) {
        game.get("blockingClaim").cloned()
    } else {
        game.get("attackingClaim").cloned()
    };
    let Some(claim) = claim.filter(|v| !v.is_null()) else {
        return Err(CommandRejected::new("No claim to challenge"));
    };
    let challenger = phasing_player(game)? as i64;
    let claimed = claim.get("claim").and_then(Value::as_str).unwrap_or("");
    let mut revealed = Vec::new();
    for card_id in i64_list(claim.get("cardIds").unwrap_or(&Value::Null)) {
        revealed.push(json!({"cardId": card_id, "cardName": card_name(game, card_id)?}));
    }
    let success = revealed
        .iter()
        .all(|entry| entry.get("cardName").and_then(Value::as_str) != Some(claimed));
    events.push(engine_event(
        "challenge_made",
        json!({"challenger": challenger, "claimedCard": claimed, "success": success, "revealedCards": revealed}),
    ));
    end_bout(
        game,
        if success { challenger } else { 1 - challenger },
        events,
        seed,
    );
    Ok(())
}

fn make_claim(
    game: &mut Json,
    player: usize,
    action: &Json,
    events: &mut Vec<Json>,
) -> Result<(), CommandRejected> {
    let indices = action
        .get("handIndices")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default();
    let claim = action.get("claim").and_then(Value::as_str).unwrap_or("");
    if indices.is_empty()
        || indices
            .iter()
            .any(|v| v.is_boolean() || v.as_i64().is_none())
    {
        return Err(CommandRejected::new("claim requires non-empty handIndices"));
    }
    let nums: Vec<i64> = indices.iter().filter_map(|v| v.as_i64()).collect();
    if nums.iter().collect::<std::collections::HashSet<_>>().len() != nums.len() {
        return Err(CommandRejected::new("Cannot claim the same card twice"));
    }
    let phase = game.get("phase").and_then(Value::as_str).unwrap_or("");
    if !claim_options(game, phase).iter().any(|n| n == claim) {
        return Err(CommandRejected::new("Claiming card type is not allowed"));
    }
    let hand = i64_list(
        game.pointer(&format!("/players/{player}/hand"))
            .unwrap_or(&Value::Null),
    );
    if nums
        .iter()
        .any(|index| *index < 0 || *index as usize >= hand.len())
    {
        return Err(CommandRejected::new("Played card is not in hand"));
    }
    let card_ids: Vec<i64> = nums.iter().map(|index| hand[*index as usize]).collect();
    let mut next_hand = hand;
    let mut drop_idx = nums.clone();
    drop_idx.sort_unstable_by(|a, b| b.cmp(a));
    for index in drop_idx {
        next_hand.remove(index as usize);
    }
    game["players"][player]["hand"] = json!(next_hand);
    let claimed = json!({"claim": claim, "cardIds": card_ids});
    let pile;
    if game.get("attackingClaim").is_none_or(Value::is_null) {
        game["attackingClaim"] = claimed;
        game["players"][player]["lastAttackingClaim"] = json!(claim);
        pile = "attack_pile";
        game["phase"] = json!("block");
    } else if game.get("blockingClaim").is_none_or(Value::is_null) {
        game["blockingClaim"] = claimed;
        pile = "block_pile";
        game["phase"] = json!("review");
    } else {
        return Err(CommandRejected::new("Both claims are already set"));
    }
    events.push(engine_event(
        "claim_made",
        json!({"pile": pile, "player": player, "claim": claim, "cardIds": card_ids}),
    ));
    let next_player = phasing_player(game)?;
    events.push(engine_event(
        "phase_changed",
        json!({"player": next_player, "phase": game["phase"]}),
    ));
    Ok(())
}

fn apply_action(
    game: &mut Json,
    actor: &str,
    action: &Json,
    events: &mut Vec<Json>,
    seed: u64,
) -> Result<(), CommandRejected> {
    let kind = action.get("type").and_then(Value::as_str).unwrap_or("");
    if kind.is_empty() {
        return Err(CommandRejected::new("action.type is required"));
    }
    let player = player_index(actor)?;
    if player != phasing_player(game)? {
        return Err(CommandRejected::new("Not the phasing player's turn"));
    }
    let legal = legal_actions(game)?;
    if !legal
        .iter()
        .any(|item| item.get("type").and_then(Value::as_str) == Some(kind))
    {
        return Err(CommandRejected::new(format!("Illegal action: {kind}")));
    }
    match kind {
        "claim" => make_claim(game, player, action, events)?,
        "pass" => resolve_pass(game, events, seed)?,
        "challenge" => resolve_challenge(game, events, seed)?,
        "concede" => {
            let current = phasing_player(game)?;
            events.push(engine_event("concede_made", json!({"player": current})));
            finish_game(game, (1 - current) as i64, events);
        }
        _ => return Err(CommandRejected::new(format!("Unsupported action: {kind}"))),
    }
    let frame = game.get("frame").and_then(|v| v.as_i64()).unwrap_or(0);
    game["frame"] = json!(frame + 1);
    Ok(())
}

fn debug_scenario(scenario_id: &str) -> Result<Json, CommandRejected> {
    let fixture = match scenario_id {
        "attack-phase" => {
            json!({"playerHand": ["archer", "scientist", "soldier", "archer", "wizard"], "opponentHand": ["archer", "soldier", "wizard"], "attackPile": ["archer", "archer"], "blockPile": [], "deckTop": ["soldier", "wizard", "archer", "scientist"], "deckCount": 12, "discardCount": 3})
        }
        "block-phase" => {
            json!({"playerHand": ["soldier", "wizard", "archer"], "opponentHand": ["archer", "scientist", "soldier", "wizard"], "attackPile": ["archer", "archer"], "blockPile": ["soldier", "soldier"], "deckTop": ["wizard", "archer", "scientist", "soldier"], "deckCount": 8, "discardCount": 5})
        }
        "stacked" => {
            json!({"playerHand": ["archer", "archer", "archer", "soldier", "soldier", "wizard", "scientist"], "opponentHand": ["archer", "soldier", "wizard", "scientist", "archer"], "attackPile": ["archer", "archer", "archer"], "blockPile": ["soldier", "soldier", "soldier"], "deckTop": ["wizard", "scientist", "archer", "soldier"], "deckCount": 4, "discardCount": 10})
        }
        "empty" => {
            json!({"playerHand": [], "opponentHand": [], "attackPile": [], "blockPile": [], "deckTop": [], "deckCount": 0, "discardCount": 0})
        }
        _ => return Err(CommandRejected::new("Unknown Cake Duel debug scenario")),
    };
    let mut next_id = 1000i64;
    let mut result = serde_json::Map::new();
    for (key, value) in fixture.as_object().cloned().unwrap_or_default() {
        if let Some(list) = value.as_array() {
            let mut entities = Vec::new();
            for name in list {
                entities.push(json!({"entityId": next_id, "name": name}));
                next_id += 1;
            }
            result.insert(key, Value::Array(entities));
        } else {
            result.insert(key, value);
        }
    }
    Ok(Value::Object(result))
}

pub fn reduce(state: &Json, actor: &str, cmd: &Json) -> Result<ReducerResult, CommandRejected> {
    let command_type = cmd.get("type").and_then(Value::as_str).unwrap_or("");
    let mut state = state.clone();
    match command_type {
        "startGame" => {
            if actor != "player" && actor != "agent" {
                return Err(CommandRejected::new("Unknown actor"));
            }
            if actor == "agent"
                && state
                    .get("game")
                    .is_some_and(|g| g.is_object() && g.get("gameEnded").is_none_or(Value::is_null))
            {
                return Err(CommandRejected::new(
                    "A duel is already in progress — only the player may start a new one",
                ));
            }
            let difficulty = match cmd.get("difficulty") {
                Some(value) => value.as_str(),
                None => match state.pointer("/settings/difficulty") {
                    Some(value) => value.as_str(),
                    None => Some("soldier"),
                },
            };
            let Some(difficulty) = difficulty else {
                return Err(CommandRejected::new(
                    "difficulty must be soldier, wizard, or assassin",
                ));
            };
            if !matches!(difficulty, "soldier" | "wizard" | "assassin") {
                return Err(CommandRejected::new(
                    "difficulty must be soldier, wizard, or assassin",
                ));
            }
            let seed = now_ms();
            let settings = json!({"difficulty": difficulty, "roundsToWin": 3, "seed": seed});
            let config = json!({
                "gameId": format!("cakeduel_{seed}"),
                "seed": seed,
                "roundsToWin": 3,
                "baseCardList": BASE_CARDS,
                "specialCardList": SPECIAL_CARDS,
                "specialCardsToAdd": 0,
            });
            let mut game = json!({
                "frame": 0,
                "lastEventId": 0,
                "phase": "attack",
                "lastAttackPassed": false,
                "gameEnded": Value::Null,
                "deck": [],
                "discard": [],
                "attackingClaim": Value::Null,
                "blockingClaim": Value::Null,
                "players": [
                    {"hand": [], "handLimit": 4, "claimBlacklist": [], "cakes": 3, "lastAttackingClaim": Value::Null},
                    {"hand": [], "handLimit": 4, "claimBlacklist": [], "cakes": 4, "lastAttackingClaim": Value::Null},
                ],
                "boutWinners": [],
                "attackerIndex": 0,
                "nextAttackerIndexOverride": [],
                "pickPhaseEffects": [],
                "cardList": BASE_CARDS,
                "config": config,
            });
            let mut events = vec![engine_event(
                "game_started",
                json!({"cardList": game["cardList"], "config": config}),
            )];
            start_bout(&mut game, &mut events, seed as u64);
            state["settings"] = settings;
            state["config"] = config;
            state["game"] = game;
            state["tutorial"] = if cmd.get("mode").and_then(Value::as_str) == Some("tutorial") {
                json!({"step": "free_play"})
            } else {
                Value::Null
            };
            state["lastError"] = Value::Null;
            state["debugScenarioId"] = Value::Null;
            state["debugScenario"] = Value::Null;
            Ok(ReducerResult::new(state, json!({"success": true}), events))
        }
        "reset" => {
            if actor != "player" {
                return Err(CommandRejected::new("Only player may reset"));
            }
            for key in [
                "config",
                "game",
                "tutorial",
                "lastError",
                "debugScenarioId",
                "debugScenario",
            ] {
                state[key] = Value::Null;
            }
            Ok(ReducerResult::ok(state, json!({"success": true})))
        }
        "debugLoadScenario" => {
            if actor != "player" {
                return Err(CommandRejected::new("Only player may load debug scenarios"));
            }
            let Some(scenario_id) = cmd.get("scenarioId").and_then(Value::as_str) else {
                return Err(CommandRejected::new("scenarioId is required"));
            };
            state["debugScenarioId"] = json!(scenario_id);
            state["debugScenario"] = debug_scenario(scenario_id)?;
            Ok(ReducerResult::new(
                state,
                json!({"success": true}),
                vec![json!({"type": "debug_scenario_loaded", "scenarioId": scenario_id})],
            ))
        }
        "debugSetDealtCardGuarantee" => {
            if actor != "player" {
                return Err(CommandRejected::new("Only player may use debug controls"));
            }
            Ok(ReducerResult::ok(state, json!({"success": true})))
        }
        "play" => {
            let Some(mut game) = state.get("game").cloned().filter(|g| g.is_object()) else {
                return Err(CommandRejected::new("Game not started"));
            };
            if game.get("gameEnded").is_some_and(|v| !v.is_null()) {
                return Err(CommandRejected::new("Game already ended"));
            }
            let seed = state
                .pointer("/settings/seed")
                .and_then(|v| v.as_u64())
                .unwrap_or(1);
            let mut events = Vec::new();
            apply_action(
                &mut game,
                actor,
                cmd.get("action").unwrap_or(&Value::Null),
                &mut events,
                seed,
            )?;
            if let Some(winner) = game.pointer("/gameEnded/winner").and_then(|v| v.as_i64()) {
                events.push(json!({"type": "game_outcome", "outcome": if winner == 0 { "win" } else { "loss" }}));
            }
            state["game"] = game;
            state["lastError"] = Value::Null;
            Ok(ReducerResult::new(state, json!({"success": true}), events))
        }
        _ => Err(CommandRejected::new(format!(
            "Unknown Cake Duel command: {command_type}"
        ))),
    }
}

pub fn agent_next_command(state: &Json) -> Option<Json> {
    let game = state.get("game")?;
    if !game.is_object() || game.get("gameEnded").is_some_and(|v| !v.is_null()) {
        return None;
    }
    if phasing_player(game).ok()? != 1 {
        return None;
    }
    let legal = legal_actions(game).ok()?;
    if let Some(claim) = legal
        .iter()
        .find(|item| item.get("type").and_then(Value::as_str) == Some("claim"))
    {
        let hand = i64_list(game.pointer("/players/1/hand").unwrap_or(&Value::Null));
        let options = claim
            .get("claimFrom")
            .and_then(Value::as_array)
            .cloned()
            .unwrap_or_default();
        for (index, card_id) in hand.iter().enumerate() {
            if let Ok(name) = card_name(game, *card_id) {
                if options
                    .iter()
                    .any(|opt| opt.as_str() == Some(name.as_str()))
                {
                    return Some(
                        json!({"type": "play", "action": {"type": "claim", "handIndices": [index], "claim": name}}),
                    );
                }
            }
        }
        if !hand.is_empty() {
            if let Some(name) = options.first().and_then(Value::as_str) {
                return Some(
                    json!({"type": "play", "action": {"type": "claim", "handIndices": [0], "claim": name}}),
                );
            }
        }
    }
    if legal
        .iter()
        .any(|item| item.get("type").and_then(Value::as_str) == Some("pass"))
    {
        return Some(json!({"type": "play", "action": {"type": "pass"}}));
    }
    if legal
        .iter()
        .any(|item| item.get("type").and_then(Value::as_str) == Some("challenge"))
    {
        return Some(json!({"type": "play", "action": {"type": "challenge"}}));
    }
    None
}

fn python_truthy(value: &Value) -> bool {
    match value {
        Value::Null => false,
        Value::Bool(value) => *value,
        Value::Number(value) => value.as_f64().is_some_and(|number| number != 0.0),
        Value::String(value) => !value.is_empty(),
        Value::Array(value) => !value.is_empty(),
        Value::Object(value) => !value.is_empty(),
    }
}

fn python_equals_int(value: Option<&Value>, expected: i64) -> bool {
    value.is_some_and(|value| {
        value.as_i64() == Some(expected)
            || value.as_f64() == Some(expected as f64)
            || value
                .as_bool()
                .is_some_and(|boolean| i64::from(boolean) == expected)
    })
}

pub fn recovery_command(state: &Json) -> Option<Json> {
    let game = state.get("game")?;
    if !game.is_object() || game.get("gameEnded").is_some_and(python_truthy) {
        return None;
    }
    let phase = game.get("phase").and_then(Value::as_str)?;
    let attacker = game.get("attackerIndex");
    let agent_turn = match phase {
        "attack" | "review" => python_equals_int(attacker, 1),
        "block" => python_equals_int(attacker, 0),
        _ => false,
    };
    agent_turn.then(|| json!({"type": "play", "action": {"type": "pass"}}))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn cakeduel_start_hand_claim_and_agent_response() {
        let state = reduce(
            &initial_state(),
            "player",
            &json!({"type": "startGame", "mode": "normal", "difficulty": "soldier"}),
        )
        .unwrap()
        .state;
        let game = &state["game"];
        assert_eq!(game["phase"], "attack");
        assert_eq!(game["players"][0]["hand"].as_array().unwrap().len(), 4);
        let names: Vec<_> = game["players"][0]["hand"]
            .as_array()
            .unwrap()
            .iter()
            .map(|id| {
                game["cardList"][id.as_u64().unwrap() as usize]
                    .as_str()
                    .unwrap()
            })
            .collect();
        let claim = names
            .iter()
            .copied()
            .find(|name| matches!(*name, "soldier" | "archer" | "wizard"))
            .unwrap_or("soldier");
        let hand_index = names.iter().position(|name| *name == claim).unwrap_or(0);
        let state = reduce(
            &state,
            "player",
            &json!({"type": "play", "action": {"type": "claim", "handIndices": [hand_index], "claim": claim}}),
        )
        .unwrap()
        .state;
        assert_eq!(
            state.pointer("/game/phase").and_then(Value::as_str),
            Some("block")
        );
        let command = agent_next_command(&state).expect("agent should respond");
        let state = reduce(&state, "agent", &command).unwrap().state;
        assert!(matches!(
            state.pointer("/game/phase").and_then(Value::as_str),
            Some("review" | "attack")
        ));
    }

    #[test]
    fn cakeduel_rejects_non_string_difficulty() {
        for difficulty in [json!(null), json!(7), json!({"value": "soldier"})] {
            let error = reduce(
                &initial_state(),
                "player",
                &json!({"type": "startGame", "difficulty": difficulty}),
            )
            .unwrap_err();
            assert_eq!(error.0, "difficulty must be soldier, wizard, or assassin");
        }
        let mut state = initial_state();
        state["settings"]["difficulty"] = json!(7);
        let error = reduce(&state, "player", &json!({"type": "startGame"})).unwrap_err();
        assert_eq!(error.0, "difficulty must be soldier, wizard, or assassin");
    }

    #[test]
    fn cakeduel_debug_fixtures_have_expected_entities_and_counts() {
        let expected = [
            ("attack-phase", [5, 3, 2, 0, 12, 3]),
            ("block-phase", [3, 4, 2, 2, 8, 5]),
            ("stacked", [7, 5, 3, 3, 4, 10]),
            ("empty", [0, 0, 0, 0, 0, 0]),
        ];
        for (scenario_id, counts) in expected {
            let result = reduce(
                &initial_state(),
                "player",
                &json!({"type": "debugLoadScenario", "scenarioId": scenario_id}),
            )
            .unwrap();
            assert_eq!(result.result, json!({"success": true}));
            assert_eq!(
                result.events,
                vec![json!({"type": "debug_scenario_loaded", "scenarioId": scenario_id})]
            );
            let state = result.state;
            let scenario = &state["debugScenario"];
            assert_eq!(state["debugScenarioId"], scenario_id);
            assert_eq!(scenario["playerHand"].as_array().unwrap().len(), counts[0]);
            assert_eq!(
                scenario["opponentHand"].as_array().unwrap().len(),
                counts[1]
            );
            assert_eq!(scenario["attackPile"].as_array().unwrap().len(), counts[2]);
            assert_eq!(scenario["blockPile"].as_array().unwrap().len(), counts[3]);
            assert_eq!(scenario["deckCount"], counts[4]);
            assert_eq!(scenario["discardCount"], counts[5]);
            let ids: Vec<_> = [
                "playerHand",
                "opponentHand",
                "attackPile",
                "blockPile",
                "deckTop",
            ]
            .into_iter()
            .flat_map(|key| scenario[key].as_array().unwrap())
            .map(|entity| entity["entityId"].as_i64().unwrap())
            .collect();
            assert_eq!(ids, (1000..1000 + ids.len() as i64).collect::<Vec<_>>());
        }
    }

    #[test]
    fn cakeduel_stranded_agent_turn_recovers_with_pass() {
        let mut state = reduce(
            &initial_state(),
            "player",
            &json!({"type": "startGame", "mode": "normal", "difficulty": "soldier"}),
        )
        .unwrap()
        .state;
        let game = &state["game"];
        let claim = legal_actions(game)
            .unwrap()
            .into_iter()
            .find(|action| action["type"] == "claim")
            .unwrap();
        state = reduce(
            &state,
            "player",
            &json!({"type": "play", "action": {"type": "claim", "handIndices": [0], "claim": claim["claimFrom"][0]}}),
        )
        .unwrap()
        .state;
        let command = agent_next_command(&state).expect("agent should make blocking claim");
        state = reduce(&state, "agent", &command).unwrap().state;
        assert_eq!(
            state.pointer("/game/phase").and_then(Value::as_str),
            Some("review")
        );
        state = reduce(
            &state,
            "player",
            &json!({"type": "play", "action": {"type": "pass"}}),
        )
        .unwrap()
        .state;
        assert_eq!(
            state.pointer("/game/phase").and_then(Value::as_str),
            Some("attack")
        );
        assert_eq!(
            state.pointer("/game/attackerIndex").and_then(Value::as_u64),
            Some(1)
        );

        let recovery = recovery_command(&state).unwrap();
        assert_eq!(
            recovery,
            json!({"type": "play", "action": {"type": "pass"}})
        );
        state = reduce(&state, "agent", &recovery).unwrap().state;
        assert_eq!(
            state.pointer("/game/phase").and_then(Value::as_str),
            Some("attack")
        );
        assert_eq!(
            state.pointer("/game/attackerIndex").and_then(Value::as_u64),
            Some(0)
        );
    }

    #[test]
    fn cakeduel_recovery_matches_python_truthiness_and_integer_comparison() {
        let empty_ended_game =
            json!({"game": {"gameEnded": {}, "phase": "attack", "attackerIndex": 1}});
        assert!(recovery_command(&empty_ended_game).is_some());
        let ended_game =
            json!({"game": {"gameEnded": true, "phase": "attack", "attackerIndex": 1}});
        assert_eq!(recovery_command(&ended_game), None);
        let missing_attacker = json!({"game": {"phase": "block"}});
        assert_eq!(recovery_command(&missing_attacker), None);
        let boolean_attacker = json!({"game": {"phase": "attack", "attackerIndex": true}});
        assert!(recovery_command(&boolean_attacker).is_some());
    }
}

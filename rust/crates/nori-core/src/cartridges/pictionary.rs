use crate::cartridge::{CommandRejected, ReducerResult};
use crate::jsonutil::Json;
use rand::Rng;
use serde_json::{json, Value};

const WORDS: &str = include_str!("../../../../../backend/data/pictionary_words.json");

fn vocab() -> Json {
    serde_json::from_str(WORDS).unwrap_or_else(|_| {
        json!({
            "en": [{"word": "apple", "synonyms": [], "drawingId": "apple", "removed": false}],
            "zh-CN": [{"word": "苹果", "synonyms": [], "drawingId": "apple", "pinyin": [["p", "ing"], ["g", "uo"]], "removed": false}]
        })
    })
}

pub fn initial_state() -> Json {
    json!({
        "gameState": Value::Null,
        "settings": {"sessionDurationMs": 180000, "inferenceMode": "fast", "locale": "zh-CN"},
    })
}

fn normalize_guess(value: &Value) -> Result<String, CommandRejected> {
    let Some(value) = value.as_str() else {
        return Err(CommandRejected::new("text must be a string"));
    };
    let mut out = String::new();
    for ch in value.trim().to_lowercase().chars() {
        if ch.is_whitespace() || ".,!?'\"-_/\\，。！？、“”‘’（）()【】[]".contains(ch) {
            continue;
        }
        out.push(ch);
    }
    Ok(out.chars().take(50).collect())
}

fn resolve_vocab(locale: &str) -> Vec<Json> {
    let data = vocab();
    let loc = locale.to_lowercase().replace('_', "-");
    let key = if loc.starts_with("zh") || loc == "cn" { "zh-CN" } else { "en" };
    data.get(key)
        .or_else(|| data.get("en"))
        .or_else(|| data.get("zh-CN"))
        .and_then(Value::as_array)
        .map(|items| items.iter().filter(|item| item.get("removed").and_then(Value::as_bool) != Some(true)).cloned().collect())
        .unwrap_or_default()
}

fn choose_item(locale: &str, excluded: &[String]) -> Json {
    let pool = resolve_vocab(locale);
    let excluded: Vec<String> = excluded.iter().map(|s| s.to_lowercase()).collect();
    let candidates: Vec<&Json> = pool
        .iter()
        .filter(|item| {
            item.get("drawingId")
                .and_then(Value::as_str)
                .is_none_or(|id| !excluded.iter().any(|e| e == &id.to_lowercase()))
        })
        .collect();
    let source = if candidates.is_empty() { pool.iter().collect::<Vec<_>>() } else { candidates };
    if source.is_empty() {
        return json!({"word": "apple", "drawingId": "apple", "synonyms": [], "pinyin": []});
    }
    source[rand::rng().random_range(0..source.len())].clone()
}

fn new_round(at_ms: i64, item: &Json, roles: Json) -> Json {
    let suffix: u32 = rand::rng().random_range(0..36u32.pow(6));
    json!({
        "roundId": format!("round_{at_ms}_{suffix:06x}"),
        "startedAtMs": at_ms,
        "word": item.get("word").cloned().unwrap_or(json!("")),
        "drawingId": item.get("drawingId").cloned().unwrap_or(json!("")),
        "pinyin": item.get("pinyin").cloned().unwrap_or(json!([])),
        "synonyms": item.get("synonyms").cloned().unwrap_or(json!([])),
        "roles": roles,
        "status": "active",
        "noriRedrawEpoch": 0,
    })
}

fn need_ms(cmd: &Json) -> Result<i64, CommandRejected> {
    match cmd.get("atMs") {
        Some(v) if !v.is_boolean() => v.as_i64().ok_or_else(|| CommandRejected::new("atMs must be an integer")),
        _ => Err(CommandRejected::new("atMs must be an integer")),
    }
}

fn check_guess(raw: &str, round: &Json) -> bool {
    let Ok(guess) = normalize_guess(&json!(raw)) else {
        return false;
    };
    if guess.is_empty() {
        return false;
    }
    let mut targets = vec![
        normalize_guess(&json!(round.get("word").and_then(Value::as_str).unwrap_or(""))).unwrap_or_default(),
        normalize_guess(&json!(round.get("drawingId").and_then(Value::as_str).unwrap_or(""))).unwrap_or_default(),
    ];
    if let Some(syns) = round.get("synonyms").and_then(Value::as_array) {
        for syn in syns {
            targets.push(normalize_guess(syn).unwrap_or_default());
        }
    }
    let targets: Vec<String> = targets.into_iter().filter(|t| !t.is_empty()).collect();
    if targets.iter().any(|t| t == &guess) {
        return true;
    }
    for target in targets {
        if guess.chars().count() >= 2 && (target.contains(&guess) || guess.contains(&target)) {
            return true;
        }
        if target.chars().count() == 1 && guess == target {
            return true;
        }
    }
    false
}

fn session_finished(settings: &Json, history: &[Json]) -> bool {
    let elapsed: i64 = history.iter().map(|e| e.get("elapsedMs").and_then(|v| v.as_i64()).unwrap_or(0)).sum();
    elapsed >= settings.get("sessionDurationMs").and_then(|v| v.as_i64()).unwrap_or(180_000)
}

pub fn needs_next_round(state: &Json) -> bool {
    state.pointer("/gameState/phase").and_then(Value::as_str) == Some("PLAYING")
        && state.pointer("/gameState/round/status").and_then(Value::as_str) != Some("active")
}

pub fn reduce(state: &Json, actor: &str, cmd: &Json) -> Result<ReducerResult, CommandRejected> {
    let command_type = cmd.get("type").and_then(Value::as_str).unwrap_or("");
    let mut state = state.clone();
    if command_type == "startSession" {
        if actor != "player" {
            return Err(CommandRejected::new("Only player can start a session"));
        }
        if state.pointer("/gameState/phase").and_then(Value::as_str) == Some("PLAYING") {
            return Err(CommandRejected::new("Session already in progress"));
        }
        let at_ms = need_ms(cmd)?;
        let mut settings = state.get("settings").cloned().unwrap_or(json!({}));
        if let Some(incoming) = cmd.get("settings") {
            if !incoming.is_null() {
                if !incoming.is_object() {
                    return Err(CommandRejected::new("settings must be an object"));
                }
                if let Some(duration) = incoming.get("sessionDurationMs") {
                    let n = duration.as_i64().filter(|_| !duration.is_boolean()).filter(|n| *n > 0);
                    let Some(n) = n else {
                        return Err(CommandRejected::new("sessionDurationMs must be a positive integer"));
                    };
                    settings["sessionDurationMs"] = json!(n);
                }
                if let Some(limit) = incoming.get("roundTimeLimitMs") {
                    let n = limit.as_i64().filter(|_| !limit.is_boolean()).filter(|n| *n > 0);
                    let Some(n) = n else {
                        return Err(CommandRejected::new("roundTimeLimitMs must be a positive integer"));
                    };
                    settings["roundTimeLimitMs"] = json!(n);
                }
                if let Some(mode) = incoming.get("inferenceMode") {
                    let mode = mode.as_str().unwrap_or("");
                    if mode != "fast" && mode != "harder" {
                        return Err(CommandRejected::new("inferenceMode must be fast or harder"));
                    }
                    settings["inferenceMode"] = json!(mode);
                }
                if let Some(locale) = incoming.get("locale") {
                    let Some(locale) = locale.as_str() else {
                        return Err(CommandRejected::new("locale must be a string"));
                    };
                    settings["locale"] = json!(locale);
                }
            }
        }
        let locale = settings.get("locale").and_then(Value::as_str).unwrap_or("zh-CN").to_string();
        let item = choose_item(&locale, &[]);
        let round = new_round(at_ms, &item, json!({"drawer": "player", "guesser": "agent"}));
        state["settings"] = settings;
        state["gameState"] = json!({"phase": "PLAYING", "score": {"solved": 0, "skipped": 0}, "round": round, "history": []});
        return Ok(ReducerResult::new(
            state.clone(),
            json!({"success": true, "roundId": round["roundId"]}),
            vec![
                json!({"type": "session_started"}),
                json!({"type": "round_started", "roundId": round["roundId"], "roles": round["roles"], "drawingId": item["drawingId"]}),
            ],
        ));
    }
    let playing = state.pointer("/gameState/phase").and_then(Value::as_str) == Some("PLAYING");
    if !playing {
        if command_type == "forceEndSession" {
            return Ok(ReducerResult::ok(state, json!({"success": false})));
        }
        return Err(CommandRejected::new("Session is not active"));
    }
    match command_type {
        "startNextRound" => {
            if state.pointer("/gameState/round/status").and_then(Value::as_str) == Some("active") {
                return Err(CommandRejected::new("Round is still active"));
            }
            let at_ms = need_ms(cmd)?;
            let current = state.pointer("/gameState/round/drawingId").and_then(Value::as_str).unwrap_or("").to_string();
            let mut used = vec![current];
            if let Some(history) = state.pointer("/gameState/history").and_then(Value::as_array) {
                for entry in history {
                    let id = entry.get("drawingId").and_then(Value::as_str).unwrap_or_else(|| entry.get("word").and_then(Value::as_str).unwrap_or(""));
                    used.push(id.replace(' ', "-"));
                }
            }
            let locale = state.pointer("/settings/locale").and_then(Value::as_str).unwrap_or("zh-CN").to_string();
            let item = choose_item(&locale, &used);
            let drawer = state.pointer("/gameState/round/roles/drawer").and_then(Value::as_str).unwrap_or("player");
            let roles = if drawer == "player" {
                json!({"drawer": "agent", "guesser": "player"})
            } else {
                json!({"drawer": "player", "guesser": "agent"})
            };
            let next = new_round(at_ms, &item, roles.clone());
            state["gameState"]["round"] = next.clone();
            Ok(ReducerResult::new(
                state,
                json!({"success": true, "roundId": next["roundId"]}),
                vec![json!({"type": "round_started", "roundId": next["roundId"], "roles": roles, "drawingId": item["drawingId"]})],
            ))
        }
        "submitStrokeBatch" => {
            if actor != "player" || state.pointer("/gameState/round/roles/drawer").and_then(Value::as_str) != Some("player") {
                return Err(CommandRejected::new("Only the player drawer can submit strokes"));
            }
            let len = cmd.get("batch").and_then(Value::as_array).map(|a| a.len()).unwrap_or(0);
            if !(1..=32).contains(&len) {
                return Err(CommandRejected::new("batch must contain 1 to 32 strokes"));
            }
            Ok(ReducerResult::ok(state, json!({"success": true})))
        }
        "submitGuess" => {
            if state.pointer("/gameState/round/status").and_then(Value::as_str) != Some("active") {
                return Err(CommandRejected::new("Round is not active"));
            }
            if state.pointer("/gameState/round/roles/guesser").and_then(Value::as_str) != Some(actor) {
                return Err(CommandRejected::new("Not the current guesser"));
            }
            let at_ms = need_ms(cmd)?;
            let Some(raw) = cmd.get("text").and_then(Value::as_str).filter(|t| !t.trim().is_empty()) else {
                return Err(CommandRejected::new("Empty guess"));
            };
            let round = state.pointer("/gameState/round").cloned().unwrap_or(json!({}));
            let correct = check_guess(raw, &round);
            state["gameState"]["round"]["lastGuess"] = json!({"by": actor, "text": raw.trim(), "atMs": at_ms, "correct": correct});
            let mut events = vec![json!({"type": "guess_submitted", "roundId": round["roundId"], "by": actor, "text": raw.trim(), "correct": correct})];
            if correct {
                let started = round.get("startedAtMs").and_then(|v| v.as_i64()).unwrap_or(0);
                let elapsed = (at_ms - started).max(0);
                let entry = json!({"word": round["word"], "drawingId": round["drawingId"], "roles": round["roles"], "elapsedMs": elapsed, "outcome": "solved"});
                if let Some(h) = state["gameState"]["history"].as_array_mut() { h.push(entry.clone()) }
                let solved = state.pointer("/gameState/score/solved").and_then(|v| v.as_i64()).unwrap_or(0);
                state["gameState"]["score"]["solved"] = json!(solved + 1);
                state["gameState"]["round"]["status"] = json!("solved");
                state["gameState"]["round"]["solvedAtMs"] = json!(at_ms);
                events.push(json!({"type": "round_solved", "roundId": round["roundId"], "by": actor, "word": round["word"], "elapsedMs": elapsed}));
                let history = state.pointer("/gameState/history").and_then(Value::as_array).cloned().unwrap_or_default();
                if session_finished(state.get("settings").unwrap_or(&Value::Null), &history) {
                    state["gameState"]["phase"] = json!("RESULTS");
                    events.push(json!({"type": "session_finished"}));
                }
            }
            Ok(ReducerResult::new(state, json!({"success": true, "correct": correct}), events))
        }
        "skipRound" => {
            if state.pointer("/gameState/round/status").and_then(Value::as_str) != Some("active") {
                return Err(CommandRejected::new("Round is not active"));
            }
            let drawer = state.pointer("/gameState/round/roles/drawer").and_then(Value::as_str).unwrap_or("");
            let guesser = state.pointer("/gameState/round/roles/guesser").and_then(Value::as_str).unwrap_or("");
            if actor != drawer && actor != guesser {
                return Err(CommandRejected::new("Not allowed to skip this round"));
            }
            let at_ms = need_ms(cmd)?;
            let started = state.pointer("/gameState/round/startedAtMs").and_then(|v| v.as_i64()).unwrap_or(0);
            let elapsed = (at_ms - started).max(0);
            let round = state.pointer("/gameState/round").cloned().unwrap_or(json!({}));
            if let Some(h) = state["gameState"]["history"].as_array_mut() { h.push(json!({"word": round["word"], "drawingId": round["drawingId"], "roles": round["roles"], "elapsedMs": elapsed, "outcome": "skipped"})) }
            let skipped = state.pointer("/gameState/score/skipped").and_then(|v| v.as_i64()).unwrap_or(0);
            state["gameState"]["score"]["skipped"] = json!(skipped + 1);
            state["gameState"]["round"]["status"] = json!("skipped");
            let mut events = vec![json!({"type": "round_skipped", "roundId": round["roundId"], "by": actor})];
            let history = state.pointer("/gameState/history").and_then(Value::as_array).cloned().unwrap_or_default();
            if session_finished(state.get("settings").unwrap_or(&Value::Null), &history) {
                state["gameState"]["phase"] = json!("RESULTS");
                events.push(json!({"type": "session_finished"}));
            }
            Ok(ReducerResult::new(state, json!({"success": true}), events))
        }
        "noriRedraw" => {
            if actor != "agent" || state.pointer("/gameState/round/roles/drawer").and_then(Value::as_str) != Some("agent") {
                return Err(CommandRejected::new("Only Nori can redraw"));
            }
            let epoch = state.pointer("/gameState/round/noriRedrawEpoch").and_then(|v| v.as_i64()).unwrap_or(0) + 1;
            state["gameState"]["round"]["noriRedrawEpoch"] = json!(epoch);
            let round_id = state.pointer("/gameState/round/roundId").cloned().unwrap_or(Value::Null);
            Ok(ReducerResult::new(state, json!({"epoch": epoch}), vec![json!({"type": "nori_redraw", "roundId": round_id, "epoch": epoch})]))
        }
        "forceEndSession" => {
            let at_ms = need_ms(cmd)?;
            let started = state.pointer("/gameState/round/startedAtMs").and_then(|v| v.as_i64()).unwrap_or(0);
            let elapsed = (at_ms - started).max(0);
            let round = state.pointer("/gameState/round").cloned().unwrap_or(json!({}));
            state["gameState"]["round"]["status"] = json!("unfinished");
            if let Some(h) = state["gameState"]["history"].as_array_mut() { h.push(json!({"word": round["word"], "drawingId": round["drawingId"], "roles": round["roles"], "elapsedMs": elapsed, "outcome": "unfinished"})) }
            state["gameState"]["phase"] = json!("RESULTS");
            Ok(ReducerResult::new(state, json!({"success": true}), vec![json!({"type": "session_finished"})]))
        }
        _ => Err(CommandRejected::new(format!("Unknown pictionary command: {command_type}"))),
    }
}

use crate::cartridge::{CommandRejected, ReducerResult};
use crate::jsonutil::Json;
use rand::rngs::StdRng;
use rand::{Rng, SeedableRng};
use serde_json::{json, Value};
use std::collections::BTreeSet;
use std::sync::OnceLock;

const WORDS: &str = include_str!("../../../../../backend/data/pictionary_words.json");
/// Quick Draw samples Nori draws from. Served only through rounds: a public copy would let the
/// browser look the answer up from the strokes.
const DRAWINGS: &str = include_str!("../../../../../backend/data/pictionary_drawings.json");

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
        if ch.is_whitespace() || ".,!?'\"-_/\\，。！？、“”‘’（）()【】[]".contains(ch)
        {
            continue;
        }
        out.push(ch);
    }
    Ok(out.chars().take(50).collect())
}

fn resolve_vocab(locale: &str) -> Vec<Json> {
    let data = vocab();
    let loc = locale.to_lowercase().replace('_', "-");
    let key = if loc.starts_with("zh") || loc == "cn" {
        "zh-CN"
    } else {
        "en"
    };
    data.get(key)
        .or_else(|| data.get("en"))
        .or_else(|| data.get("zh-CN"))
        .and_then(Value::as_array)
        .map(|items| {
            items
                .iter()
                .filter(|item| item.get("removed").and_then(Value::as_bool) != Some(true))
                .cloned()
                .collect()
        })
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
    let source = if candidates.is_empty() {
        pool.iter().collect::<Vec<_>>()
    } else {
        candidates
    };
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
        Some(v) if !v.is_boolean() => v
            .as_i64()
            .ok_or_else(|| CommandRejected::new("atMs must be an integer")),
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
        normalize_guess(&json!(round
            .get("word")
            .and_then(Value::as_str)
            .unwrap_or("")))
        .unwrap_or_default(),
        normalize_guess(&json!(round
            .get("drawingId")
            .and_then(Value::as_str)
            .unwrap_or("")))
        .unwrap_or_default(),
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
    let elapsed: i64 = history
        .iter()
        .map(|e| e.get("elapsedMs").and_then(|v| v.as_i64()).unwrap_or(0))
        .sum();
    elapsed
        >= settings
            .get("sessionDurationMs")
            .and_then(|v| v.as_i64())
            .unwrap_or(180_000)
}

/// How many guesses Nori makes per round before leaving it to the player.
pub const AGENT_GUESS_LIMIT: usize = 5;

/// The active round Nori is guessing, if any.
pub fn agent_guess_round(state: &Json) -> Option<String> {
    let game = state.get("gameState")?;
    let round = game.get("round")?;
    (game.get("phase")?.as_str()? == "PLAYING"
        && round.get("status")?.as_str()? == "active"
        && round.pointer("/roles/guesser")?.as_str()? == "agent")
        .then(|| round.get("roundId")?.as_str().map(str::to_string))
        .flatten()
}

/// Nori's offline guess for the player's drawing: a seeded pick from the public vocabulary.
///
/// Without a vision model Nori cannot see the canvas, and it must never read the round's
/// secret `word`/`drawingId`/`synonyms`. It only uses public information: the locale,
/// the round id, words already used in earlier rounds, and its own previous guesses.
pub fn agent_guess(state: &Json, round_id: &str, tried: &[String], at_ms: i64) -> Option<Json> {
    if agent_guess_round(state).as_deref() != Some(round_id) || tried.len() >= AGENT_GUESS_LIMIT {
        return None;
    }
    let locale = state
        .pointer("/settings/locale")
        .and_then(Value::as_str)
        .unwrap_or("zh-CN");
    let used: Vec<String> = state
        .pointer("/gameState/history")
        .and_then(Value::as_array)
        .map(|history| {
            history
                .iter()
                .filter_map(|entry| entry.get("word").and_then(Value::as_str))
                .map(str::to_lowercase)
                .collect()
        })
        .unwrap_or_default();
    let candidates: Vec<String> = resolve_vocab(locale)
        .iter()
        .filter_map(|item| item.get("word").and_then(Value::as_str))
        .filter(|word| {
            let lower = word.to_lowercase();
            !used.contains(&lower) && !tried.iter().any(|t| t.to_lowercase() == lower)
        })
        .map(str::to_string)
        .collect();
    if candidates.is_empty() {
        return None;
    }
    // FNV-1a over the round id and attempt: stable per round, different across rounds.
    let mut hash: u64 = 0xcbf2_9ce4_8422_2325;
    for byte in round_id.bytes().chain([tried.len() as u8]) {
        hash = (hash ^ u64::from(byte)).wrapping_mul(0x0100_0000_01b3);
    }
    let word = &candidates[(hash % candidates.len() as u64) as usize];
    Some(json!({"type": "submitGuess", "text": word, "atMs": at_ms}))
}

pub fn needs_next_round(state: &Json) -> bool {
    state.pointer("/gameState/phase").and_then(Value::as_str) == Some("PLAYING")
        && state
            .pointer("/gameState/round/status")
            .and_then(Value::as_str)
            != Some("active")
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
                    let n = duration
                        .as_i64()
                        .filter(|_| !duration.is_boolean())
                        .filter(|n| *n > 0);
                    let Some(n) = n else {
                        return Err(CommandRejected::new(
                            "sessionDurationMs must be a positive integer",
                        ));
                    };
                    settings["sessionDurationMs"] = json!(n);
                }
                if let Some(limit) = incoming.get("roundTimeLimitMs") {
                    let n = limit
                        .as_i64()
                        .filter(|_| !limit.is_boolean())
                        .filter(|n| *n > 0);
                    let Some(n) = n else {
                        return Err(CommandRejected::new(
                            "roundTimeLimitMs must be a positive integer",
                        ));
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
        let locale = settings
            .get("locale")
            .and_then(Value::as_str)
            .unwrap_or("zh-CN")
            .to_string();
        let item = choose_item(&locale, &[]);
        let round = new_round(
            at_ms,
            &item,
            json!({"drawer": "player", "guesser": "agent"}),
        );
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
            if state
                .pointer("/gameState/round/status")
                .and_then(Value::as_str)
                == Some("active")
            {
                return Err(CommandRejected::new("Round is still active"));
            }
            let at_ms = need_ms(cmd)?;
            let current = state
                .pointer("/gameState/round/drawingId")
                .and_then(Value::as_str)
                .unwrap_or("")
                .to_string();
            let mut used = vec![current];
            if let Some(history) = state
                .pointer("/gameState/history")
                .and_then(Value::as_array)
            {
                for entry in history {
                    let id = entry
                        .get("drawingId")
                        .and_then(Value::as_str)
                        .unwrap_or_else(|| entry.get("word").and_then(Value::as_str).unwrap_or(""));
                    used.push(id.replace(' ', "-"));
                }
            }
            let locale = state
                .pointer("/settings/locale")
                .and_then(Value::as_str)
                .unwrap_or("zh-CN")
                .to_string();
            let item = choose_item(&locale, &used);
            let drawer = state
                .pointer("/gameState/round/roles/drawer")
                .and_then(Value::as_str)
                .unwrap_or("player");
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
                vec![
                    json!({"type": "round_started", "roundId": next["roundId"], "roles": roles, "drawingId": item["drawingId"]}),
                ],
            ))
        }
        "submitStrokeBatch" => {
            if actor != "player"
                || state
                    .pointer("/gameState/round/roles/drawer")
                    .and_then(Value::as_str)
                    != Some("player")
            {
                return Err(CommandRejected::new(
                    "Only the player drawer can submit strokes",
                ));
            }
            let len = cmd
                .get("batch")
                .and_then(Value::as_array)
                .map(|a| a.len())
                .unwrap_or(0);
            if !(1..=32).contains(&len) {
                return Err(CommandRejected::new("batch must contain 1 to 32 strokes"));
            }
            Ok(ReducerResult::ok(state, json!({"success": true})))
        }
        "submitGuess" => {
            if state
                .pointer("/gameState/round/status")
                .and_then(Value::as_str)
                != Some("active")
            {
                return Err(CommandRejected::new("Round is not active"));
            }
            if state
                .pointer("/gameState/round/roles/guesser")
                .and_then(Value::as_str)
                != Some(actor)
            {
                return Err(CommandRejected::new("Not the current guesser"));
            }
            let at_ms = need_ms(cmd)?;
            let Some(raw) = cmd
                .get("text")
                .and_then(Value::as_str)
                .filter(|t| !t.trim().is_empty())
            else {
                return Err(CommandRejected::new("Empty guess"));
            };
            let round = state
                .pointer("/gameState/round")
                .cloned()
                .unwrap_or(json!({}));
            let correct = check_guess(raw, &round);
            state["gameState"]["round"]["lastGuess"] =
                json!({"by": actor, "text": raw.trim(), "atMs": at_ms, "correct": correct});
            let mut events = vec![
                json!({"type": "guess_submitted", "roundId": round["roundId"], "by": actor, "text": raw.trim(), "correct": correct}),
            ];
            if correct {
                let started = round
                    .get("startedAtMs")
                    .and_then(|v| v.as_i64())
                    .unwrap_or(0);
                let elapsed = (at_ms - started).max(0);
                let entry = json!({"word": round["word"], "drawingId": round["drawingId"], "roles": round["roles"], "elapsedMs": elapsed, "outcome": "solved"});
                if let Some(h) = state["gameState"]["history"].as_array_mut() {
                    h.push(entry.clone())
                }
                let solved = state
                    .pointer("/gameState/score/solved")
                    .and_then(|v| v.as_i64())
                    .unwrap_or(0);
                state["gameState"]["score"]["solved"] = json!(solved + 1);
                state["gameState"]["round"]["status"] = json!("solved");
                state["gameState"]["round"]["solvedAtMs"] = json!(at_ms);
                events.push(json!({"type": "round_solved", "roundId": round["roundId"], "by": actor, "word": round["word"], "elapsedMs": elapsed}));
                let history = state
                    .pointer("/gameState/history")
                    .and_then(Value::as_array)
                    .cloned()
                    .unwrap_or_default();
                if session_finished(state.get("settings").unwrap_or(&Value::Null), &history) {
                    state["gameState"]["phase"] = json!("RESULTS");
                    events.push(json!({"type": "session_finished"}));
                }
            }
            Ok(ReducerResult::new(
                state,
                json!({"success": true, "correct": correct}),
                events,
            ))
        }
        "skipRound" => {
            if state
                .pointer("/gameState/round/status")
                .and_then(Value::as_str)
                != Some("active")
            {
                return Err(CommandRejected::new("Round is not active"));
            }
            let drawer = state
                .pointer("/gameState/round/roles/drawer")
                .and_then(Value::as_str)
                .unwrap_or("");
            let guesser = state
                .pointer("/gameState/round/roles/guesser")
                .and_then(Value::as_str)
                .unwrap_or("");
            if actor != drawer && actor != guesser {
                return Err(CommandRejected::new("Not allowed to skip this round"));
            }
            let at_ms = need_ms(cmd)?;
            let started = state
                .pointer("/gameState/round/startedAtMs")
                .and_then(|v| v.as_i64())
                .unwrap_or(0);
            let elapsed = (at_ms - started).max(0);
            let round = state
                .pointer("/gameState/round")
                .cloned()
                .unwrap_or(json!({}));
            if let Some(h) = state["gameState"]["history"].as_array_mut() {
                h.push(json!({"word": round["word"], "drawingId": round["drawingId"], "roles": round["roles"], "elapsedMs": elapsed, "outcome": "skipped"}))
            }
            let skipped = state
                .pointer("/gameState/score/skipped")
                .and_then(|v| v.as_i64())
                .unwrap_or(0);
            state["gameState"]["score"]["skipped"] = json!(skipped + 1);
            state["gameState"]["round"]["status"] = json!("skipped");
            let mut events =
                vec![json!({"type": "round_skipped", "roundId": round["roundId"], "by": actor})];
            let history = state
                .pointer("/gameState/history")
                .and_then(Value::as_array)
                .cloned()
                .unwrap_or_default();
            if session_finished(state.get("settings").unwrap_or(&Value::Null), &history) {
                state["gameState"]["phase"] = json!("RESULTS");
                events.push(json!({"type": "session_finished"}));
            }
            Ok(ReducerResult::new(state, json!({"success": true}), events))
        }
        "noriRedraw" => {
            if actor != "agent"
                || state
                    .pointer("/gameState/round/roles/drawer")
                    .and_then(Value::as_str)
                    != Some("agent")
            {
                return Err(CommandRejected::new("Only Nori can redraw"));
            }
            let epoch = state
                .pointer("/gameState/round/noriRedrawEpoch")
                .and_then(|v| v.as_i64())
                .unwrap_or(0)
                + 1;
            state["gameState"]["round"]["noriRedrawEpoch"] = json!(epoch);
            let round_id = state
                .pointer("/gameState/round/roundId")
                .cloned()
                .unwrap_or(Value::Null);
            Ok(ReducerResult::new(
                state,
                json!({"epoch": epoch}),
                vec![json!({"type": "nori_redraw", "roundId": round_id, "epoch": epoch})],
            ))
        }
        "forceEndSession" => {
            let at_ms = need_ms(cmd)?;
            let started = state
                .pointer("/gameState/round/startedAtMs")
                .and_then(|v| v.as_i64())
                .unwrap_or(0);
            let elapsed = (at_ms - started).max(0);
            let round = state
                .pointer("/gameState/round")
                .cloned()
                .unwrap_or(json!({}));
            state["gameState"]["round"]["status"] = json!("unfinished");
            if let Some(h) = state["gameState"]["history"].as_array_mut() {
                h.push(json!({"word": round["word"], "drawingId": round["drawingId"], "roles": round["roles"], "elapsedMs": elapsed, "outcome": "unfinished"}))
            }
            state["gameState"]["phase"] = json!("RESULTS");
            Ok(ReducerResult::new(
                state,
                json!({"success": true}),
                vec![json!({"type": "session_finished"})],
            ))
        }
        _ => Err(CommandRejected::new(format!(
            "Unknown pictionary command: {command_type}"
        ))),
    }
}

fn drawings() -> &'static serde_json::Map<String, Value> {
    static DRAWINGS_INDEX: OnceLock<serde_json::Map<String, Value>> = OnceLock::new();
    DRAWINGS_INDEX.get_or_init(|| {
        serde_json::from_str::<serde_json::Map<String, Value>>(DRAWINGS)
            .unwrap_or_default()
            .into_iter()
            .map(|(key, samples)| (key.to_lowercase(), samples))
            .collect()
    })
}

/// How many of a word's samples a round hands out; Nori cycles through them while it redraws.
const NORI_DRAWING_SAMPLES: usize = 3;

/// FNV-1a: stable per round, so every projection of a round agrees.
fn fnv(parts: &[&[u8]]) -> u64 {
    let mut hash: u64 = 0xcbf2_9ce4_8422_2325;
    for byte in parts.iter().flat_map(|part| part.iter()) {
        hash = (hash ^ u64::from(*byte)).wrapping_mul(0x0100_0000_01b3);
    }
    hash
}

/// The strokes Nori draws for a round, picked by the server so the browser never needs the
/// drawing id (which is the English answer).
pub fn nori_drawings(round: &Json) -> Vec<Json> {
    let key = round
        .get("drawingId")
        .and_then(Value::as_str)
        .unwrap_or("")
        .trim()
        .to_lowercase();
    let index = drawings();
    let samples = index.get(&key).or_else(|| {
        index
            .iter()
            .find(|(candidate, _)| {
                !key.is_empty() && (candidate.contains(&key) || key.contains(candidate.as_str()))
            })
            .map(|(_, samples)| samples)
    });
    let Some(samples) = samples.and_then(Value::as_array).filter(|s| !s.is_empty()) else {
        return Vec::new();
    };
    let round_id = round.get("roundId").and_then(Value::as_str).unwrap_or("");
    let start = (fnv(&[round_id.as_bytes()]) % samples.len() as u64) as usize;
    (0..NORI_DRAWING_SAMPLES.min(samples.len()))
        .map(|offset| samples[(start + offset) % samples.len()].clone())
        .collect()
}

/// The answer as the hint sees it: letters (English) or syllables (Chinese).
struct Hint {
    chinese: bool,
    characters: Vec<char>,
    pinyin: Vec<(Option<String>, String)>,
    indices: Vec<usize>,
    revealed: BTreeSet<usize>,
}

fn chinese_locale(locale: &str) -> bool {
    let locale = locale.to_lowercase().replace('_', "-");
    locale.starts_with("zh") || locale == "cn"
}

fn hint_for(round: &Json, locale: &str) -> Hint {
    let word = round.get("word").and_then(Value::as_str).unwrap_or("");
    let characters: Vec<char> = word.chars().collect();
    let chinese = chinese_locale(locale);
    let mut pinyin: Vec<(Option<String>, String)> = round
        .get("pinyin")
        .and_then(Value::as_array)
        .map(|syllables| {
            syllables
                .iter()
                .map(|syllable| {
                    (
                        syllable.get(0).and_then(Value::as_str).map(str::to_string),
                        syllable
                            .get(1)
                            .and_then(Value::as_str)
                            .unwrap_or("")
                            .to_string(),
                    )
                })
                .collect()
        })
        .unwrap_or_default();
    // Older rounds without pinyin keep their Chinese answer fully masked.
    if chinese && round.get("pinyin").is_none_or(|p| !p.is_array()) {
        pinyin = characters.iter().map(|_| (None, String::new())).collect();
    }
    let indices: Vec<usize> = if chinese {
        (0..pinyin.len()).collect()
    } else {
        characters
            .iter()
            .enumerate()
            .filter(|(_, c)| c.is_ascii_alphabetic())
            .map(|(index, _)| index)
            .collect()
    };
    let revealed = round
        .pointer("/hint/revealed")
        .and_then(Value::as_array)
        .map(|items| {
            items
                .iter()
                .filter_map(Value::as_u64)
                .map(|index| index as usize)
                .filter(|index| indices.contains(index))
                .collect()
        })
        .unwrap_or_default();
    Hint {
        chinese,
        characters,
        pinyin,
        indices,
        revealed,
    }
}

impl Hint {
    fn text(&self) -> String {
        if self.chinese {
            return self
                .pinyin
                .iter()
                .enumerate()
                .map(|(index, (initial, last))| {
                    if !self.revealed.contains(&index) {
                        "__".to_string()
                    } else {
                        match initial {
                            None => last
                                .chars()
                                .next()
                                .map_or_else(|| "__".to_string(), String::from),
                            Some(initial) => format!("{initial}_"),
                        }
                    }
                })
                .collect::<Vec<_>>()
                .join(" ");
        }
        let spaced = self
            .characters
            .iter()
            .enumerate()
            .map(|(index, c)| {
                if c.is_ascii_alphabetic() && !self.revealed.contains(&index) {
                    "_".to_string()
                } else {
                    c.to_uppercase().collect()
                }
            })
            .collect::<Vec<_>>()
            .join(" ");
        // Collapse the run of spaces a space character leaves behind to two.
        let mut out = String::new();
        let mut run = 0;
        for c in spaced.chars() {
            if c.is_whitespace() {
                run += 1;
                continue;
            }
            if run > 0 {
                out.push_str(&" ".repeat(if run >= 3 { 2 } else { run }));
                run = 0;
            }
            out.push(c);
        }
        if run > 0 {
            out.push_str(&" ".repeat(if run >= 3 { 2 } else { run }));
        }
        out
    }

    fn key(&self, index: usize) -> String {
        if self.chinese {
            index.to_string()
        } else {
            self.characters[index].to_ascii_lowercase().to_string()
        }
    }

    /// Initial pause and the slowest/fastest gap between reveals, by how hard the word looks.
    fn timing(&self) -> (f64, f64, f64) {
        let length = self.indices.len();
        let mut score = 0.0;
        let difficulty = if self.chinese {
            score += if length >= 4 {
                1.5
            } else if length >= 3 {
                1.0
            } else if length <= 1 {
                -0.5
            } else {
                0.0
            };
            if self
                .pinyin
                .iter()
                .filter(|(initial, _)| initial.is_none())
                .count()
                >= 2
            {
                score -= 0.5;
            }
            clamp((score + 0.5) / 3.0, 0.0, 1.0)
        } else if length > 0 {
            let letters: Vec<char> = self
                .indices
                .iter()
                .map(|index| self.characters[*index].to_ascii_lowercase())
                .collect();
            score += if length >= 10 {
                1.5
            } else if length >= 8 {
                1.0
            } else if length <= 4 {
                -0.5
            } else {
                0.0
            };
            let ratio =
                letters.iter().filter(|c| "aeiou".contains(**c)).count() as f64 / length as f64;
            score += if ratio < 0.35 {
                1.0
            } else if ratio > 0.55 {
                -0.5
            } else {
                0.0
            };
            let rare = letters.iter().filter(|c| "jqxzkvy".contains(**c)).count();
            score += if rare >= 2 {
                1.0
            } else if rare == 1 {
                0.5
            } else {
                0.0
            };
            if letters.iter().collect::<BTreeSet<_>>().len() as f64 / length as f64 > 0.8 {
                score += 0.5;
            }
            clamp((score + 0.5) / 5.0, 0.0, 1.0)
        } else {
            0.0
        };
        (
            clamp(6000.0 - 2200.0 * difficulty, 2500.0, 6000.0),
            clamp(10000.0 - 3500.0 * difficulty, 3500.0, 10000.0),
            clamp(2400.0 - 800.0 * difficulty, 1200.0, 2400.0),
        )
    }

    fn complete(&self) -> bool {
        self.indices
            .iter()
            .all(|index| self.revealed.contains(index))
    }

    /// Milliseconds until the next reveal, `None` once nothing is left to reveal.
    fn delay(&self, progress: f64) -> Option<u64> {
        if self.complete() {
            return None;
        }
        let (initial, slowest, fastest) = self.timing();
        let delay = if self.revealed.is_empty() {
            initial
        } else {
            lerp(slowest, fastest, clamp(progress, 0.0, 1.0).powi(3))
        };
        Some(delay.round() as u64)
    }

    /// Reveal common letters first, keeping repeated letters together and the initial until late.
    fn advance(&mut self, progress: f64, mut random: impl FnMut() -> f64) {
        let remaining: Vec<usize> = self
            .indices
            .iter()
            .copied()
            .filter(|index| !self.revealed.contains(index))
            .collect();
        if remaining.is_empty() {
            return;
        }
        let p = clamp(progress, 0.0, 1.0);
        let first = self.indices[0];
        let desired = ((0.1 + 0.75 * p.powi(3)) * self.indices.len() as f64).ceil();
        let floor: f64 = if p < 0.75 {
            1.0
        } else if p < 0.92 {
            2.0
        } else {
            3.0
        };
        let budget = (remaining.len() as f64).min(clamp(
            floor.max(desired - self.revealed.len() as f64),
            1.0,
            3.0,
        )) as usize;
        let mut groups: Vec<(String, Vec<usize>)> = Vec::new();
        for index in &remaining {
            let key = self.key(*index);
            match groups.iter_mut().find(|(group, _)| *group == key) {
                Some((_, members)) => members.push(*index),
                None => groups.push((key, vec![*index])),
            }
        }
        let mut selected = BTreeSet::new();
        if p >= 0.92 && !self.revealed.contains(&first) {
            let key = self.key(first);
            if let Some(position) = groups.iter().position(|(group, _)| *group == key) {
                selected.extend(groups.remove(position).1);
            }
        }
        let mut candidates: Vec<(f64, Vec<usize>)> = groups
            .into_iter()
            .map(|(key, members)| {
                let mut score = if members.contains(&first) {
                    lerp(-100.0, 40.0, p * p)
                } else {
                    0.0
                };
                if self.chinese {
                    match &self.pinyin[members[0]].0 {
                        None => score += lerp(6.0, 2.0, p),
                        Some(initial) => {
                            if COMMON_INITIALS.contains(&initial.as_str()) {
                                score += lerp(5.0, 2.0, p);
                            }
                            if RARE_INITIALS.contains(&initial.as_str()) {
                                score += lerp(-1.0, 6.0, p);
                            }
                        }
                    }
                } else {
                    let c = key.chars().next().unwrap_or(' ');
                    if "aeiou".contains(c) {
                        score += lerp(8.0, 1.5, p);
                    }
                    if "tnshrdlcm".contains(c) {
                        score += lerp(4.0, 3.0, p);
                    }
                    if "jqxzkvy".contains(c) {
                        score += lerp(-2.0, 8.0, p);
                    }
                    score += (members.len() - 1) as f64 * 1.8;
                }
                (score + random() * 0.5, members)
            })
            .collect();
        candidates.sort_by(|a, b| b.0.total_cmp(&a.0));
        for (_, members) in candidates {
            if selected.len() >= budget {
                break;
            }
            selected.extend(members);
        }
        if p >= 0.97 {
            let rest: Vec<usize> = remaining
                .iter()
                .copied()
                .filter(|index| !selected.contains(index))
                .take(3)
                .collect();
            selected.extend(rest);
        }
        self.revealed.extend(selected);
    }
}

const COMMON_INITIALS: &[&str] = &[
    "sh", "zh", "j", "x", "d", "b", "g", "l", "m", "h", "ch", "t", "f", "n", "s", "w", "y",
];
const RARE_INITIALS: &[&str] = &["z", "c", "r", "p", "k"];

fn clamp(value: f64, min: f64, max: f64) -> f64 {
    value.max(min).min(max)
}

fn lerp(from: f64, to: f64, progress: f64) -> f64 {
    from + (to - from) * progress
}

fn locale(state: &Json) -> &str {
    state
        .pointer("/settings/locale")
        .and_then(Value::as_str)
        .unwrap_or("zh-CN")
}

/// The active round whose answer the player is guessing, if any.
pub fn hint_round(state: &Json) -> Option<String> {
    let game = state.get("gameState")?;
    let round = game.get("round")?;
    (game.get("phase")?.as_str()? == "PLAYING"
        && round.get("status")?.as_str()? == "active"
        && round.pointer("/roles/guesser")?.as_str()? == "player")
        .then(|| round.get("roundId")?.as_str().map(str::to_string))
        .flatten()
}

/// How long the hint task waits before its next reveal, given the round's progress through
/// the session clock (0..1). `None` when there is nothing left to reveal.
pub fn hint_delay(state: &Json, round_id: &str, progress: f64) -> Option<u64> {
    if hint_round(state).as_deref() != Some(round_id) {
        return None;
    }
    hint_for(state.pointer("/gameState/round")?, locale(state)).delay(progress)
}

/// Reveal the next part of the answer. Only the server's hint task calls this; it is not a
/// command, so no browser can ask for hints early.
pub fn reveal_hint(state: &Json, round_id: &str, progress: f64) -> Option<ReducerResult> {
    if hint_round(state).as_deref() != Some(round_id) {
        return None;
    }
    let round = state.pointer("/gameState/round")?;
    let mut hint = hint_for(round, locale(state));
    if hint.complete() {
        return None;
    }
    let step = hint.revealed.len() as u64;
    let mut rng = StdRng::seed_from_u64(fnv(&[round_id.as_bytes(), &step.to_le_bytes()]));
    hint.advance(progress, || rng.random());
    let mut state = state.clone();
    state["gameState"]["round"]["hint"] = json!({"revealed": hint.revealed});
    Some(ReducerResult::new(
        state,
        json!({"success": true}),
        vec![json!({"type": "hint_revealed", "roundId": round_id, "text": hint.text()})],
    ))
}

/// What the player may see of a round. While they are guessing, the answer and everything
/// that spells it (drawing id, synonyms, pinyin) stay on the server: the browser gets the
/// hint text and, when Nori draws, the strokes to draw.
fn client_round(round: &Json, locale: &str) -> Json {
    let guessing = round.pointer("/roles/guesser").and_then(Value::as_str) == Some("player")
        && round.get("status").and_then(Value::as_str) == Some("active");
    if !guessing || !round.is_object() {
        let mut visible = round.clone();
        if let Some(object) = visible.as_object_mut() {
            object.remove("hint");
        }
        return visible;
    }
    let hint = hint_for(round, locale);
    let mut visible = round.clone();
    if let Some(object) = visible.as_object_mut() {
        for key in ["word", "drawingId", "synonyms", "pinyin"] {
            object.remove(key);
        }
        object.insert(
            "hint".into(),
            json!({"text": hint.text(), "revealed": hint.revealed.len(), "total": hint.indices.len()}),
        );
        if round.pointer("/roles/drawer").and_then(Value::as_str) == Some("agent") {
            object.insert("noriDrawings".into(), Value::Array(nori_drawings(round)));
        }
    }
    visible
}

fn client_game(game: &Json, locale: &str) -> Json {
    let mut visible = game.clone();
    if let Some(round) = game.get("round") {
        visible["round"] = client_round(round, locale);
    }
    visible
}

/// Browser view of a whole Pictionary state (snapshots and root patches).
pub fn client_state(state: &Json) -> Json {
    let mut visible = state.clone();
    if let Some(game) = state.get("gameState").filter(|game| game.is_object()) {
        visible["gameState"] = client_game(game, locale(state));
    }
    visible
}

/// Browser view of a committed transition. `state` is the state after the commit.
pub fn client_transition(transition: &Json, state: &Json) -> Json {
    let mut visible = transition.clone();
    if let Some(patches) = visible.get_mut("patches").and_then(Value::as_array_mut) {
        for patch in patches {
            let path = patch
                .get("path")
                .and_then(Value::as_str)
                .unwrap_or("")
                .to_string();
            if let Some(value) = patch.get_mut("value").filter(|value| value.is_object()) {
                match path.as_str() {
                    "" => *value = client_state(value),
                    "/gameState" => *value = client_game(value, locale(state)),
                    _ => {}
                }
            }
        }
    }
    if let Some(events) = visible.get_mut("events").and_then(Value::as_array_mut) {
        for event in events {
            if event.get("type").and_then(Value::as_str) == Some("round_started") {
                if let Some(object) = event.as_object_mut() {
                    object.remove("drawingId");
                }
            }
        }
    }
    visible
}

#[cfg(test)]
mod tests {
    use super::*;

    fn hint(word: &str, locale: &str, pinyin: Option<Json>) -> Hint {
        let mut round = json!({"word": word});
        if let Some(pinyin) = pinyin {
            round["pinyin"] = pinyin;
        }
        hint_for(&round, locale)
    }

    fn advanced(mut hint: Hint, progress: f64) -> Hint {
        hint.advance(progress, || 0.0);
        hint
    }

    #[test]
    fn english_hints_keep_punctuation_group_repeats_and_defer_the_initial() {
        let original = hint("Balloon, moon!", "en", None);
        assert_eq!(original.text(), "_ _ _ _ _ _ _ ,  _ _ _ _ !");
        let next = advanced(hint("Balloon, moon!", "en", None), 0.1);
        assert!(!next.revealed.contains(&0));
        assert_eq!(next.revealed, BTreeSet::from([4, 5, 10, 11]));
        assert_eq!(next.text(), "_ _ _ _ O O _ ,  _ O O _ !");
        assert!(advanced(hint("Balloon, moon!", "en", None), 0.92)
            .revealed
            .contains(&0));
        let mut complete = original;
        for _ in 0..10 {
            complete.advance(1.0, || 0.0);
        }
        assert_eq!(complete.text(), "B A L L O O N ,  M O O N !");
        assert!(complete.complete());
        assert_eq!(complete.delay(1.0), None);
        let punctuation = hint("123-!", "en", None);
        assert!(punctuation.complete());
    }

    #[test]
    fn chinese_hints_show_initials_without_the_characters() {
        let pinyin = json!([["p", "ing"], ["g", "uo"], [null, "an"]]);
        let initial = hint("苹果安", "zh-CN", Some(pinyin.clone()));
        assert_eq!(initial.text(), "__ __ __");
        assert_eq!(
            advanced(hint("苹果安", "zh-CN", Some(pinyin.clone())), 0.1).text(),
            "__ __ a"
        );
        assert_eq!(
            advanced(hint("苹果安", "zh-CN", Some(pinyin)), 1.0).text(),
            "p_ g_ a"
        );
        // Without pinyin the answer stays masked to the end.
        let mut missing = hint("苹果", "zh-CN", None);
        for _ in 0..5 {
            missing.advance(1.0, || 0.0);
        }
        assert_eq!(missing.text(), "__ __");
    }

    #[test]
    fn hint_cadence_adapts_to_difficulty_within_shipped_bounds() {
        let easy = hint("idea", "en", None);
        let hard = hint("quizzically", "en", None);
        assert!(hard.timing().0 < easy.timing().0);
        for hint in [easy, hard, hint("", "zh-CN", Some(json!([])))] {
            let (initial, slowest, fastest) = hint.timing();
            assert!((2500.0..=6000.0).contains(&initial));
            if hint.complete() {
                assert_eq!(hint.delay(0.0), None);
                continue;
            }
            assert_eq!(hint.delay(0.0), Some(initial as u64));
            let mut started = hint;
            started.revealed.insert(usize::MAX);
            assert_eq!(started.delay(-1.0), Some(slowest as u64));
            assert_eq!(started.delay(2.0), Some(fastest as u64));
        }
    }

    #[test]
    fn nori_drawings_cover_every_vocabulary_word() {
        for locale in ["en", "zh-CN"] {
            for item in resolve_vocab(locale) {
                let round = json!({"roundId": "r", "drawingId": item["drawingId"]});
                let samples = nori_drawings(&round);
                assert!(!samples.is_empty(), "{locale} {}", item["drawingId"]);
                assert!(samples.len() <= NORI_DRAWING_SAMPLES);
                assert_eq!(samples, nori_drawings(&round), "stable per round");
            }
        }
    }
}

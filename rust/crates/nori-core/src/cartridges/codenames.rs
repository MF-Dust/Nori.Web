use crate::cartridge::{CommandRejected, ReducerResult};
use crate::jsonutil::{is_int, now_ms, Json};
use serde_json::{json, Value};
use std::sync::OnceLock;

const WORDS: &str = include_str!("../../../../../backend/data/codenames_words.json");
const TEAM_A: &str = "A";
const TEAM_B: &str = "B";
const AGENT: &str = "AGENT";
const BYSTANDER: &str = "BYSTANDER";
const ASSASSIN: &str = "ASSASSIN";
const NORMAL: &str = "NORMAL";
const SUDDEN_DEATH: &str = "SUDDEN_DEATH";
const GAME_OVER: &str = "GAME_OVER";

const TUTORIAL_STEPS: [&str; 14] = [
    "nori_opening_clue",
    "player_first_treasure",
    "player_second_treasure",
    "player_berry_lesson",
    "player_real_clue",
    "nori_real_guessing",
    "nori_canine_clue",
    "player_free_guessing",
    "load_monster_lesson",
    "nori_chime_clue",
    "player_monster_touch",
    "load_sudden_death",
    "player_finale_guess",
    "free_play",
];
const TUTORIAL_KEY_A: [&str; 25] = [
    BYSTANDER, BYSTANDER, BYSTANDER, ASSASSIN, AGENT, AGENT, AGENT, BYSTANDER, AGENT, BYSTANDER,
    BYSTANDER, BYSTANDER, AGENT, BYSTANDER, AGENT, AGENT, BYSTANDER, BYSTANDER, BYSTANDER, AGENT,
    BYSTANDER, AGENT, ASSASSIN, ASSASSIN, BYSTANDER,
];
const TUTORIAL_KEY_B: [&str; 25] = [
    AGENT, BYSTANDER, BYSTANDER, BYSTANDER, BYSTANDER, BYSTANDER, AGENT, AGENT, BYSTANDER, AGENT,
    AGENT, ASSASSIN, AGENT, AGENT, BYSTANDER, ASSASSIN, BYSTANDER, BYSTANDER, BYSTANDER, BYSTANDER,
    BYSTANDER, AGENT, AGENT, ASSASSIN, BYSTANDER,
];
const TUTORIAL_BOARD_EN: [&str; 25] = [
    "MOON", "RIVER", "ACORN", "SPARROW", "BRIDGE", "CASTLE", "HONEY", "WOLF", "LANTERN", "MAPLE",
    "STAR", "MUSHROOM", "BELL", "FOX", "CLOUD", "IVY", "COMPASS", "OWL", "PEBBLE", "SNOW", "FERN",
    "MEADOW", "CROW", "EMBER", "SHELL",
];
const TUTORIAL_BOARD_ZH: [&str; 25] = [
    "月亮",
    "溪流",
    "坚果",
    "麻雀",
    "吊桥",
    "城堡",
    "蜂蜜",
    "野狼",
    "灯笼",
    "枫叶",
    "星星",
    "蘑菇",
    "铃铛",
    "狐狸",
    "云朵",
    "藤蔓",
    "罗盘",
    "猫头鹰",
    "鹅卵石",
    "雪花",
    "蕨草",
    "草地",
    "乌鸦",
    "余烬",
    "贝壳",
];
const TUTORIAL_BOARD_JA: [&str; 25] = [
    "満月",
    "小川",
    "どんぐり",
    "スズメ",
    "つり橋",
    "古城",
    "ハチミツ",
    "オオカミ",
    "ランタン",
    "モミジ",
    "星空",
    "キノコ",
    "ベル",
    "キツネ",
    "入道雲",
    "ツタ",
    "コンパス",
    "フクロウ",
    "小石",
    "吹雪",
    "シダ",
    "草原",
    "カラス",
    "残り火",
    "貝殻",
];

pub fn initial_state() -> Json {
    json!({
        "gameState": null,
        "counterpartSide": TEAM_A,
        "agentSide": TEAM_B,
        "settings": {"tokens": 9, "wordLocale": "zh-CN"},
        "tutorial": null,
    })
}

fn malformed(detail: impl std::fmt::Display) -> CommandRejected {
    CommandRejected::new(format!("Malformed codenames state: {detail}"))
}

fn field<'a>(value: &'a Json, name: &str) -> Result<&'a Json, CommandRejected> {
    value
        .get(name)
        .ok_or_else(|| malformed(format!("missing {name}")))
}

fn array_field<'a>(value: &'a Json, name: &str) -> Result<&'a Vec<Json>, CommandRejected> {
    field(value, name)?
        .as_array()
        .ok_or_else(|| malformed(format!("{name} must be an array")))
}

fn string_field<'a>(value: &'a Json, name: &str) -> Result<&'a str, CommandRejected> {
    field(value, name)?
        .as_str()
        .ok_or_else(|| malformed(format!("{name} must be a string")))
}

fn truthy(value: &Json) -> bool {
    match value {
        Value::Null => false,
        Value::Bool(value) => *value,
        Value::Number(value) => value.as_f64() != Some(0.0),
        Value::String(value) => !value.is_empty(),
        Value::Array(value) => !value.is_empty(),
        Value::Object(value) => !value.is_empty(),
    }
}

fn settings_for_words(state: &Json) -> Result<Option<&Json>, CommandRejected> {
    let settings = state.get("settings").filter(|value| truthy(value));
    if settings.is_some_and(|value| !value.is_object()) {
        return Err(malformed("settings must be an object"));
    }
    Ok(settings)
}

fn optional_locale(value: Option<&Json>) -> Result<Option<&str>, CommandRejected> {
    value
        .filter(|value| truthy(value))
        .map(|value| {
            value
                .as_str()
                .ok_or_else(|| malformed("wordLocale must be a string"))
        })
        .transpose()
}

fn words() -> &'static Json {
    static DATA: OnceLock<Json> = OnceLock::new();
    DATA.get_or_init(|| {
        serde_json::from_str(WORDS).expect("embedded Codenames vocabulary is valid JSON")
    })
}

fn resolve_words_from(data: &Json, locale: Option<&str>) -> Result<Vec<String>, CommandRejected> {
    let selected = if data.is_array() {
        // Python wraps the legacy raw-list format in {"en": ...}.
        Some(data)
    } else {
        let locales = data
            .as_object()
            .ok_or_else(|| malformed("word lists must be an object or array"))?;
        let loc = locale.unwrap_or("").to_lowercase().replace('_', "-");
        let nonempty = |key: &str| locales.get(key).filter(|value| truthy(value));
        if loc.is_empty() || loc.starts_with("zh") || loc == "cn" {
            nonempty("zh-CN").or_else(|| locales.get("en"))
        } else if loc.starts_with("ja") || loc == "jp" {
            nonempty("ja").or_else(|| locales.get("en"))
        } else {
            nonempty("en").or_else(|| locales.values().next())
        }
    };
    let Some(selected) = selected else {
        return Ok(Vec::new());
    };
    selected
        .as_array()
        .ok_or_else(|| malformed("word list must be an array"))?
        .iter()
        .map(|word| {
            word.as_str()
                .map(str::to_owned)
                .ok_or_else(|| malformed("board words must be strings"))
        })
        .collect()
}

fn resolve_words(locale: Option<&str>) -> Result<Vec<String>, CommandRejected> {
    resolve_words_from(words(), locale)
}

fn other(side: &str) -> &'static str {
    if side == TEAM_A {
        TEAM_B
    } else {
        TEAM_A
    }
}

fn actor_side<'a>(state: &'a Json, actor: &str) -> Result<&'a str, CommandRejected> {
    match actor {
        "player" => string_field(state, "counterpartSide"),
        "agent" => string_field(state, "agentSide"),
        _ => Err(CommandRejected::new("Unknown actor")),
    }
}

fn key<'a>(game: &'a Json, side: &str) -> Result<&'a Vec<Json>, CommandRejected> {
    field(game, "key")?
        .get(side)
        .and_then(Value::as_array)
        .ok_or_else(|| malformed(format!("key.{side} must be an array")))
}

fn role<'a>(game: &'a Json, side: &str, index: usize) -> Result<&'a Json, CommandRejected> {
    key(game, side)?
        .get(index)
        .ok_or_else(|| malformed(format!("key.{side} is missing cell {index}")))
}

fn cell(game: &Json, index: usize) -> Result<&Json, CommandRejected> {
    array_field(game, "cells")?
        .get(index)
        .filter(|value| value.is_object())
        .ok_or_else(|| malformed(format!("cells[{index}] must be an object")))
}

fn remaining(game: &Json, side: &str) -> Result<usize, CommandRejected> {
    let mut remaining = 0;
    for (index, role) in key(game, side)?.iter().enumerate() {
        if role == AGENT && field(cell(game, index)?, "solvedBy")?.is_null() {
            remaining += 1;
        }
    }
    Ok(remaining)
}

fn all_agents_solved(game: &Json) -> Result<bool, CommandRejected> {
    for index in 0..25 {
        if (role(game, TEAM_A, index)? == AGENT || role(game, TEAM_B, index)? == AGENT)
            && field(cell(game, index)?, "solvedBy")?.is_null()
        {
            return Ok(false);
        }
    }
    Ok(true)
}

// Debug history contains unmasked clue words and cell indexes derived from the
// seeded board/key. Match Python Random's integer seeding, getrandbits and shuffle
// rather than changing the fixture masks or hard-coding a particular scenario.
struct PythonRandom {
    state: [u32; 624],
    index: usize,
}

impl PythonRandom {
    fn new(seed: u64) -> Self {
        let mut state = [0u32; 624];
        state[0] = 19_650_218;
        for i in 1..624 {
            state[i] = (state[i - 1] ^ (state[i - 1] >> 30))
                .wrapping_mul(1_812_433_253)
                .wrapping_add(i as u32);
        }
        let key = [seed as u32, (seed >> 32) as u32];
        let key_len = if key[1] == 0 { 1 } else { 2 };
        let (mut i, mut j) = (1, 0);
        for _ in 0..624 {
            state[i] = (state[i] ^ (state[i - 1] ^ (state[i - 1] >> 30)).wrapping_mul(1_664_525))
                .wrapping_add(key[j])
                .wrapping_add(j as u32);
            i += 1;
            j = (j + 1) % key_len;
            if i == 624 {
                state[0] = state[623];
                i = 1;
            }
        }
        for _ in 0..623 {
            state[i] = (state[i]
                ^ (state[i - 1] ^ (state[i - 1] >> 30)).wrapping_mul(1_566_083_941))
            .wrapping_sub(i as u32);
            i += 1;
            if i == 624 {
                state[0] = state[623];
                i = 1;
            }
        }
        state[0] = 0x8000_0000;
        Self { state, index: 624 }
    }

    fn next_u32(&mut self) -> u32 {
        if self.index == 624 {
            for i in 0..624 {
                let value =
                    (self.state[i] & 0x8000_0000) | (self.state[(i + 1) % 624] & 0x7fff_ffff);
                self.state[i] = self.state[(i + 397) % 624]
                    ^ (value >> 1)
                    ^ if value & 1 == 0 { 0 } else { 0x9908_b0df };
            }
            self.index = 0;
        }
        let mut value = self.state[self.index];
        self.index += 1;
        value ^= value >> 11;
        value ^= (value << 7) & 0x9d2c_5680;
        value ^= (value << 15) & 0xefc6_0000;
        value ^ (value >> 18)
    }

    fn below(&mut self, bound: usize) -> usize {
        let bits = usize::BITS - bound.leading_zeros();
        loop {
            let low = self.next_u32() as u64;
            let value = if bits <= 32 {
                low >> (32 - bits)
            } else {
                low | ((self.next_u32() as u64 >> (64 - bits)) << 32)
            };
            if value < bound as u64 {
                return value as usize;
            }
        }
    }

    fn shuffle<T>(&mut self, items: &mut [T]) {
        for i in (1..items.len()).rev() {
            items.swap(i, self.below(i + 1));
        }
    }
}

fn generate_keys(rng: &mut PythonRandom) -> Json {
    let mut indexes: Vec<usize> = (0..25).collect();
    rng.shuffle(&mut indexes);
    let mut a = [BYSTANDER; 25];
    let mut b = [BYSTANDER; 25];
    for &index in &indexes[..3] {
        a[index] = AGENT;
        b[index] = AGENT;
    }
    a[indexes[3]] = ASSASSIN;
    b[indexes[3]] = ASSASSIN;
    a[indexes[4]] = AGENT;
    b[indexes[4]] = ASSASSIN;
    a[indexes[5]] = ASSASSIN;
    b[indexes[5]] = AGENT;
    for &index in &indexes[6..11] {
        a[index] = AGENT;
    }
    for &index in &indexes[11..16] {
        b[index] = AGENT;
    }
    a[indexes[16]] = ASSASSIN;
    b[indexes[17]] = ASSASSIN;
    json!({"A": a, "B": b})
}

fn empty_cells() -> Vec<Json> {
    (0..25)
        .map(|_| json!({"solvedBy": null, "bystanderMarks": [null, null], "assassinatedBy": null}))
        .collect()
}

fn board_from(words: impl IntoIterator<Item = impl AsRef<str>>) -> Vec<Json> {
    words
        .into_iter()
        .map(|word| json!({"id": word.as_ref(), "text": word.as_ref()}))
        .collect()
}

fn sample_board(pool: &[String], rng: &mut PythonRandom) -> Result<Vec<Json>, CommandRejected> {
    if pool.len() < 25 {
        return Err(CommandRejected::new(
            "Not enough Codenames words to build a board",
        ));
    }
    let mut selected = Vec::with_capacity(25);
    // Python random.sample's pool/set crossover for k=25 is 21 + 4**4.
    if pool.len() <= 277 {
        let mut slots: Vec<usize> = (0..pool.len()).collect();
        for i in 0..25 {
            let j = rng.below(pool.len() - i);
            selected.push(slots[j]);
            slots[j] = slots[pool.len() - i - 1];
        }
    } else {
        let mut used = std::collections::HashSet::new();
        while selected.len() < 25 {
            let j = rng.below(pool.len());
            if used.insert(j) {
                selected.push(j);
            }
        }
    }
    Ok(board_from(selected.into_iter().map(|i| &pool[i])))
}

fn new_game(settings: &Json) -> Result<Json, CommandRejected> {
    let seed = settings
        .get("seed")
        .and_then(|value| {
            value
                .as_i64()
                .map(i64::unsigned_abs)
                .or_else(|| value.as_u64())
        })
        .unwrap_or_else(|| now_ms() as u64);
    let mut rng = PythonRandom::new(seed);
    let pool = resolve_words(optional_locale(settings.get("wordLocale"))?)?;
    Ok(json!({
        "board": sample_board(&pool, &mut rng)?,
        "key": generate_keys(&mut rng),
        "cells": empty_cells(),
        "tokensRemaining": field(settings, "tokens")?,
        "whoseTurnToGive": TEAM_A,
        "phase": NORMAL,
        "winner": null,
        "history": [],
    }))
}

fn tutorial_locale(locale: Option<&str>) -> &'static str {
    let locale = locale.unwrap_or("en").to_lowercase().replace('_', "-");
    if locale.starts_with("zh") || locale == "cn" {
        "zh-CN"
    } else if locale.starts_with("ja") {
        "ja"
    } else {
        "en"
    }
}

fn new_tutorial_game(locale: Option<&str>) -> Json {
    let board = match tutorial_locale(locale) {
        "zh-CN" => &TUTORIAL_BOARD_ZH,
        "ja" => &TUTORIAL_BOARD_JA,
        _ => &TUTORIAL_BOARD_EN,
    };
    json!({
        "board": board_from(board),
        "key": {"A": TUTORIAL_KEY_A, "B": TUTORIAL_KEY_B},
        "cells": empty_cells(),
        "tokensRemaining": 9,
        "whoseTurnToGive": TEAM_B,
        "phase": NORMAL,
        "winner": null,
        "history": [],
    })
}

fn tutorial_mover(step: &str) -> Option<&'static str> {
    match step {
        "nori_opening_clue"
        | "nori_real_guessing"
        | "nori_canine_clue"
        | "load_monster_lesson"
        | "nori_chime_clue"
        | "load_sudden_death" => Some("agent"),
        "player_first_treasure"
        | "player_second_treasure"
        | "player_berry_lesson"
        | "player_real_clue"
        | "player_free_guessing"
        | "player_monster_touch"
        | "player_finale_guess" => Some("player"),
        _ => None,
    }
}

fn tutorial_guess(step: &str) -> Option<i128> {
    match step {
        "player_first_treasure" => Some(0),
        "player_second_treasure" => Some(10),
        "player_berry_lesson" => Some(17),
        "player_monster_touch" => Some(23),
        "player_finale_guess" => Some(12),
        _ => None,
    }
}

fn tutorial_clue(locale: Option<&str>, step: &str) -> Option<Json> {
    let words = match tutorial_locale(locale) {
        "zh-CN" => ["黑夜", "犬类", "钟声"],
        "ja" => ["真夜中", "イヌ科", "チャイム"],
        _ => ["NIGHT", "CANINE", "CHIME"],
    };
    let (word, count) = match step {
        "nori_opening_clue" => (words[0], 2),
        "nori_canine_clue" => (words[1], 2),
        "nori_chime_clue" => (words[2], 1),
        _ => return None,
    };
    Some(json!({"word": word, "count": count}))
}

fn tutorial_gate(
    state: &Json,
    actor: &str,
    command: &str,
    cell: Option<i128>,
) -> Result<(), CommandRejected> {
    let Some(tutorial) = state.get("tutorial").filter(|value| value.is_object()) else {
        return Ok(());
    };
    if actor != "player" {
        return Ok(());
    }
    let step = tutorial.get("step").and_then(Value::as_str).unwrap_or("");
    if step == "free_play" {
        return Ok(());
    }
    if tutorial_mover(step) != Some(actor) {
        return Err(CommandRejected::new(
            "Tutorial: wait — it is not your move yet",
        ));
    }
    if let Some(expected) = tutorial_guess(step) {
        if command != "submitGuess" {
            return Err(CommandRejected::new(
                "Tutorial: this step asks you to guess a card",
            ));
        }
        if cell != Some(expected) {
            return Err(CommandRejected::new(
                "Tutorial: this step asks you to guess the highlighted card",
            ));
        }
        return Ok(());
    }
    if step == "player_real_clue" && command != "submitClue" {
        return Err(CommandRejected::new(
            "Tutorial: this step asks you to give a clue of your own",
        ));
    }
    if step == "player_free_guessing" && command != "submitGuess" && command != "endTurn" {
        return Err(CommandRejected::new(
            "Tutorial: this step asks you to guess or end your turn",
        ));
    }
    Ok(())
}

fn advance_tutorial(state: &mut Json, actor: &str, turn_ended: bool, game_over: bool) -> Vec<Json> {
    let Some(step) = state
        .get("tutorial")
        .filter(|value| value.is_object())
        .and_then(|value| value.get("step"))
        .and_then(Value::as_str)
    else {
        return Vec::new();
    };
    let Some(index) = TUTORIAL_STEPS
        .iter()
        .position(|candidate| *candidate == step)
    else {
        return Vec::new();
    };
    if step == "free_play" {
        return Vec::new();
    }
    let events = vec![json!({"type": "tutorial_step", "step": step})];
    if tutorial_mover(step) != Some(actor)
        || ((step == "nori_real_guessing" || step == "player_free_guessing") && !turn_ended)
    {
        return events;
    }
    let mut next = index + 1;
    if game_over {
        while next < TUTORIAL_STEPS.len()
            && !matches!(
                TUTORIAL_STEPS[next],
                "load_monster_lesson" | "load_sudden_death" | "free_play"
            )
        {
            next += 1;
        }
    }
    state["tutorial"]["step"] = json!(TUTORIAL_STEPS[next.min(TUTORIAL_STEPS.len() - 1)]);
    events
}

fn load_tutorial_stage(
    game: &mut Json,
    stage: &Json,
    agent_side: &str,
) -> Result<(), CommandRejected> {
    let history = array_field(game, "history")?;
    if let Some(turn) = history.last() {
        if field(turn, "endedBy")?.is_null() {
            let last = history.len() - 1;
            game["history"][last]["endedBy"] = json!("VOLUNTARY_END");
        }
    }
    if stage != "monster" && stage != "sudden_death" {
        return Err(CommandRejected::new("Unknown tutorial stage"));
    }
    let mut cells = array_field(game, "cells")?.clone();
    for (index, cell) in cells.iter_mut().enumerate() {
        if !cell.is_object() {
            return Err(malformed(format!("cells[{index}] must be an object")));
        }
        if index == 12 {
            cell["solvedBy"] = Value::Null;
            cell["bystanderMarks"] = json!([null, null]);
            cell["assassinatedBy"] = Value::Null;
        }
        if stage == "monster" {
            cell["assassinatedBy"] = Value::Null;
        } else if index != 12 {
            let belongs_a = role(game, TEAM_A, index)? == AGENT;
            let belongs_b = role(game, TEAM_B, index)? == AGENT;
            cell["assassinatedBy"] = Value::Null;
            if (belongs_a || belongs_b) && !truthy(field(cell, "solvedBy")?) {
                cell["solvedBy"] = json!(if belongs_b { TEAM_A } else { TEAM_B });
            }
        }
    }
    game["cells"] = json!(cells);
    game["phase"] = json!(if stage == "monster" {
        NORMAL
    } else {
        SUDDEN_DEATH
    });
    game["winner"] = Value::Null;
    if stage == "monster" {
        game["whoseTurnToGive"] = json!(agent_side);
    } else {
        game["tokensRemaining"] = json!(0);
    }
    Ok(())
}

fn validate_settings(raw: &Json, previous: &Json) -> Result<Json, CommandRejected> {
    if !raw.is_null() && !raw.is_object() {
        return Err(CommandRejected::new("settings must be an object"));
    }
    if !previous.is_object() {
        return Err(malformed("settings must be an object"));
    }
    let mut settings = previous.clone();
    if let Some(tokens) = raw.get("tokens") {
        // Python set membership admits 9.0/10.0/11.0, but explicitly rejects bool.
        if !tokens
            .as_f64()
            .is_some_and(|value| [9.0, 10.0, 11.0].contains(&value))
        {
            return Err(CommandRejected::new("tokens must be 9, 10, or 11"));
        }
        settings["tokens"] = tokens.clone();
    }
    if let Some(seed) = raw.get("seed") {
        if !is_int(seed) {
            return Err(CommandRejected::new("seed must be an integer"));
        }
        settings["seed"] = seed.clone();
    }
    if let Some(locale) = raw.get("wordLocale") {
        if !locale.is_string() {
            return Err(CommandRejected::new("wordLocale must be a string"));
        }
        settings["wordLocale"] = locale.clone();
    }
    Ok(settings)
}

fn python_space(ch: char) -> bool {
    ch.is_whitespace() || matches!(ch, '\u{1c}'..='\u{1f}')
}

fn python_decimal(ch: char) -> bool {
    // Python re's \d is Unicode Nd (15.1), not the broader str.isdigit/is_numeric.
    const STARTS: [u32; 63] = [
        0x30, 0x660, 0x6F0, 0x7C0, 0x966, 0x9E6, 0xA66, 0xAE6, 0xB66, 0xBE6, 0xC66, 0xCE6, 0xD66,
        0xDE6, 0xE50, 0xED0, 0xF20, 0x1040, 0x1090, 0x17E0, 0x1810, 0x1946, 0x19D0, 0x1A80, 0x1A90,
        0x1B50, 0x1BB0, 0x1C40, 0x1C50, 0xA620, 0xA8D0, 0xA900, 0xA9D0, 0xA9F0, 0xAA50, 0xABF0,
        0xFF10, 0x104A0, 0x10D30, 0x11066, 0x110F0, 0x11136, 0x111D0, 0x112F0, 0x11450, 0x114D0,
        0x11650, 0x116C0, 0x11730, 0x118E0, 0x11950, 0x11C50, 0x11D50, 0x11DA0, 0x11F50, 0x16A60,
        0x16AC0, 0x16B50, 0x1E140, 0x1E2F0, 0x1E4F0, 0x1E950, 0x1FBF0,
    ];
    let code = ch as u32;
    (0x1D7CE..=0x1D7FF).contains(&code)
        || STARTS
            .iter()
            .any(|start| (*start..*start + 10).contains(&code))
}

fn validate_clue(game: &Json, clue: &Json) -> Result<Json, CommandRejected> {
    if !clue.is_object() {
        return Err(CommandRejected::new("clue must be an object"));
    }
    let Some(word) = clue.get("word").and_then(Value::as_str) else {
        return Err(CommandRejected::new("clue.word must be a string"));
    };
    let word = word.trim_matches(python_space).to_uppercase();
    if word.is_empty()
        || word.chars().count() > 24
        || word
            .chars()
            .any(|ch| python_space(ch) || python_decimal(ch))
    {
        return Err(CommandRejected::new("Invalid clue word"));
    }
    for entry in array_field(game, "board")? {
        if string_field(entry, "text")?.to_uppercase() == word {
            return Err(CommandRejected::new("Clue word cannot be on the board"));
        }
    }
    let count = clue.get("count").unwrap_or(&Value::Null);
    if count != "infinity" && count.as_u64().is_none() {
        return Err(CommandRejected::new(
            "Clue count must be a non-negative integer or infinity",
        ));
    }
    Ok(json!({"word": word, "count": count}))
}

fn spend_token(game: &mut Json) -> Result<(), CommandRejected> {
    let tokens = field(game, "tokensRemaining")?;
    let remaining = if let Some(tokens) = tokens.as_i64() {
        json!(tokens.saturating_sub(1).max(0))
    } else if let Some(tokens) = tokens.as_u64() {
        json!(tokens.saturating_sub(1))
    } else if let Some(tokens) = tokens.as_f64() {
        if tokens <= 1.0 {
            json!(0)
        } else {
            json!(tokens - 1.0)
        }
    } else {
        return Err(malformed("tokensRemaining must be a number"));
    };
    game["tokensRemaining"] = remaining;
    Ok(())
}

fn finish_turn(game: &mut Json) -> Result<(), CommandRejected> {
    if field(game, "tokensRemaining")?.as_f64() == Some(0.0) && !all_agents_solved(game)? {
        game["phase"] = json!(SUDDEN_DEATH);
        return Ok(());
    }
    let giver = string_field(game, "whoseTurnToGive")?.to_owned();
    if remaining(game, other(&giver))? > 0 {
        game["whoseTurnToGive"] = json!(other(&giver));
    } else if remaining(game, &giver)? > 0 {
        game["whoseTurnToGive"] = json!(giver);
    } else {
        game["phase"] = json!(SUDDEN_DEATH);
    }
    Ok(())
}

fn submit_clue(game: &mut Json, side: &str, clue: &Json) -> Result<(), CommandRejected> {
    if field(game, "phase")? != NORMAL {
        return Err(CommandRejected::new(
            "Can only submit clues during NORMAL phase",
        ));
    }
    if field(game, "whoseTurnToGive")? != side {
        return Err(CommandRejected::new("Not your turn"));
    }
    if remaining(game, side)? == 0 {
        return Err(CommandRejected::new("This side cannot give clues"));
    }
    if let Some(turn) = array_field(game, "history")?.last() {
        if field(turn, "endedBy")?.is_null() {
            return Err(CommandRejected::new("Current turn has not ended"));
        }
    }
    game["history"]
        .as_array_mut()
        .ok_or_else(|| malformed("history must be an array"))?
        .push(json!({"clueGiver": side, "clue": clue, "guesses": [], "endedBy": null}));
    Ok(())
}

fn mark_bystander(game: &mut Json, index: usize, side: &str) -> Result<(), CommandRejected> {
    let marks = array_field(cell(game, index)?, "bystanderMarks")?;
    if marks.len() < 2 {
        return Err(malformed("bystanderMarks must have two entries"));
    }
    let slot = if marks[0].is_null() { 0 } else { 1 };
    game["cells"][index]["bystanderMarks"][slot] = json!(side);
    Ok(())
}

fn submit_guess(
    game: &mut Json,
    side: &str,
    index: i128,
) -> Result<(&'static str, bool), CommandRejected> {
    let phase = field(game, "phase")?;
    if phase != NORMAL && phase != SUDDEN_DEATH {
        return Err(CommandRejected::new("Game is over"));
    }
    if !(0..25).contains(&index) {
        return Err(CommandRejected::new("Cell index must be between 0 and 24"));
    }
    let index = index as usize;
    let selected = cell(game, index)?;
    if !field(selected, "solvedBy")?.is_null() || !field(selected, "assassinatedBy")?.is_null() {
        return Err(CommandRejected::new("Cannot guess an already solved card"));
    }
    if phase == SUDDEN_DEATH {
        if remaining(game, side)? == 0 {
            return Err(CommandRejected::new(
                "This side cannot guess in sudden death",
            ));
        }
        let role = role(game, other(side), index)?.clone();
        if role == ASSASSIN {
            game["cells"][index]["assassinatedBy"] = json!(side);
            game["phase"] = json!(GAME_OVER);
            game["winner"] = Value::Null;
            return Ok(("assassin", true));
        }
        if role == BYSTANDER {
            mark_bystander(game, index, side)?;
            game["phase"] = json!(GAME_OVER);
            game["winner"] = Value::Null;
            return Ok(("bystander", true));
        }
        game["cells"][index]["solvedBy"] = json!(side);
        if all_agents_solved(game)? {
            game["phase"] = json!(GAME_OVER);
            game["winner"] = json!("TEAM");
            return Ok(("agent", true));
        }
        return Ok(("agent", false));
    }
    let history = array_field(game, "history")?;
    let Some(turn) = history.last() else {
        return Err(CommandRejected::new("No clue has been given"));
    };
    if !field(turn, "endedBy")?.is_null() {
        return Err(CommandRejected::new("Current turn has ended"));
    }
    let giver = string_field(turn, "clueGiver")?.to_owned();
    if side == giver {
        return Err(CommandRejected::new("Clue giver cannot make guesses"));
    }
    let role = role(game, &giver, index)?.clone();
    array_field(turn, "guesses")?;
    let last = history.len() - 1;
    game["history"][last]["guesses"]
        .as_array_mut()
        .ok_or_else(|| malformed("guesses must be an array"))?
        .push(json!({"cell": index, "result": role, "at": now_ms()}));
    if role == ASSASSIN {
        game["cells"][index]["assassinatedBy"] = json!(side);
        game["phase"] = json!(GAME_OVER);
        game["winner"] = Value::Null;
        return Ok(("assassin", true));
    }
    if role == AGENT {
        game["cells"][index]["solvedBy"] = json!(side);
        if all_agents_solved(game)? {
            game["phase"] = json!(GAME_OVER);
            game["winner"] = json!("TEAM");
            return Ok(("agent", true));
        }
        if remaining(game, &giver)? == 0 {
            game["history"][last]["endedBy"] = json!("ALL_FOUND");
            spend_token(game)?;
            finish_turn(game)?;
            return Ok(("agent", true));
        }
        return Ok(("agent", false));
    }
    mark_bystander(game, index, side)?;
    game["history"][last]["endedBy"] = json!("BYSTANDER");
    spend_token(game)?;
    finish_turn(game)?;
    Ok(("bystander", true))
}

fn end_turn(game: &mut Json, side: &str) -> Result<bool, CommandRejected> {
    if field(game, "phase")? != NORMAL {
        return Err(CommandRejected::new(
            "Can only end turns during NORMAL phase",
        ));
    }
    let history = array_field(game, "history")?;
    let Some(turn) = history.last() else {
        return Err(CommandRejected::new("No turn to end"));
    };
    if !field(turn, "endedBy")?.is_null() {
        return Err(CommandRejected::new("Current turn has already ended"));
    }
    if field(turn, "clueGiver")? == side {
        return Err(CommandRejected::new("Clue giver cannot end turn"));
    }
    if array_field(turn, "guesses")?.is_empty() {
        return Err(CommandRejected::new(
            "Must make at least one guess before ending turn",
        ));
    }
    let last = history.len() - 1;
    game["history"][last]["endedBy"] = json!("VOLUNTARY_END");
    spend_token(game)?;
    let before = field(game, "phase")?.clone();
    finish_turn(game)?;
    Ok(before != game["phase"] && game["phase"] == SUDDEN_DEATH)
}

fn correct_guesses(game: &Json) -> Result<usize, CommandRejected> {
    let turn = array_field(game, "history")?
        .last()
        .ok_or_else(|| malformed("history has no current turn"))?;
    let mut correct = 0;
    for guess in array_field(turn, "guesses")? {
        if field(guess, "result")? == AGENT {
            correct += 1;
        }
    }
    Ok(correct)
}

fn outcome_events(game: &Json, result: &str, tutorial: bool) -> Result<Vec<Json>, CommandRejected> {
    if field(game, "phase")? != GAME_OVER {
        return Ok(Vec::new());
    }
    let outcome = if field(game, "winner")? == "TEAM" {
        "team"
    } else {
        result
    };
    let mut events = vec![json!({"type": "game_over", "winner": outcome})];
    if !tutorial {
        events.push(json!({"type": "game_outcome", "outcome": if outcome == "team" { "win" } else { "loss" }, "reason": outcome}));
    }
    Ok(events)
}

fn debug_sudden_death(state: &Json, scenario: &str) -> Result<Json, CommandRejected> {
    let seed = match scenario {
        "sudden_death_both" => 2026012101,
        "sudden_death_counterpart_only" => 2026012102,
        "sudden_death_agent_only" => 2026012103,
        _ => return Err(CommandRejected::new("Unknown Codenames debug scenario")),
    };
    let current = state
        .get("gameState")
        .filter(|value| value.is_object())
        .ok_or_else(|| CommandRejected::new("Game not started"))?;
    let counterpart = string_field(state, "counterpartSide")?;
    let agent = string_field(state, "agentSide")?;
    let exclusive = |owner, other| -> Result<Option<usize>, CommandRejected> {
        for index in 0..25 {
            if role(current, owner, index)? == AGENT && role(current, other, index)? != AGENT {
                return Ok(Some(index));
            }
        }
        Ok(None)
    };
    let mut protected = Vec::new();
    if matches!(
        scenario,
        "sudden_death_both" | "sudden_death_counterpart_only"
    ) {
        protected.push(
            exclusive(agent, counterpart)?
                .ok_or_else(|| CommandRejected::new("Current key has no agent-only treasure"))?,
        );
    }
    if matches!(scenario, "sudden_death_both" | "sudden_death_agent_only") {
        protected.push(
            exclusive(counterpart, agent)?.ok_or_else(|| {
                CommandRejected::new("Current key has no counterpart-only treasure")
            })?,
        );
    }
    let settings = settings_for_words(state)?;
    let words = resolve_words(optional_locale(
        settings.and_then(|value| value.get("wordLocale")),
    )?)?;
    let mut rng = PythonRandom::new(seed);
    let board = sample_board(&words, &mut rng)?;
    let mut cells = empty_cells();
    let tokens = settings
        .and_then(|value| value.get("tokens"))
        .cloned()
        .unwrap_or(json!(9));
    let turns = tokens
        .as_i64()
        .or_else(|| tokens.as_f64().map(|value| value.trunc() as i64))
        .ok_or_else(|| malformed("tokens must be a number"))?;
    let started = turns
        .checked_mul(60_000)
        .and_then(|duration| now_ms().checked_sub(duration))
        .ok_or_else(|| malformed("debug scenario timestamps overflow"))?;
    let mut clue_pool: Vec<&String> = words
        .iter()
        .filter(|word| !board.iter().any(|entry| entry["text"] == **word))
        .collect();
    rng.shuffle(&mut clue_pool);
    let mut history: Vec<Json> = (0..turns).map(|index| json!({
        "clueGiver": if index % 2 == 0 { counterpart } else { agent },
        "clue": {"word": clue_pool.get(index as usize).map(|word| (*word).clone()).unwrap_or_else(|| format!("CLUE{}", index + 1)), "count": 2},
        "guesses": [],
        "endedBy": "VOLUNTARY_END",
    })).collect();
    for (index, cell) in cells.iter_mut().enumerate() {
        if protected.contains(&index) {
            continue;
        }
        let mut chosen = None;
        let mut fewest = usize::MAX;
        for (turn_index, turn) in history.iter().enumerate() {
            if role(current, string_field(turn, "clueGiver")?, index)? == AGENT {
                let guesses = array_field(turn, "guesses")?.len();
                if guesses < fewest {
                    chosen = Some(turn_index);
                    fewest = guesses;
                }
            }
        }
        let Some(turn_index) = chosen else { continue };
        let guesser = other(string_field(&history[turn_index], "clueGiver")?);
        let at = started + turn_index as i64 * 60_000 + (fewest as i64 + 1) * 6_000;
        history[turn_index]["guesses"]
            .as_array_mut()
            .ok_or_else(|| malformed("guesses must be an array"))?
            .push(json!({"cell": index, "result": AGENT, "at": at}));
        cell["solvedBy"] = json!(guesser);
    }
    let mut used = [false; 25];
    for turn in &history {
        for guess in array_field(turn, "guesses")? {
            let index = guess["cell"]
                .as_u64()
                .ok_or_else(|| malformed("guess cell must be an integer"))?
                as usize;
            used[index] = true;
        }
    }
    for (turn_index, turn) in history.iter_mut().enumerate() {
        if turn_index % 3 != 2 {
            continue;
        }
        let giver = string_field(turn, "clueGiver")?.to_owned();
        let guesser = other(&giver);
        let mut bystander = None;
        for (index, used) in used.iter().enumerate() {
            if !used
                && role(current, &giver, index)? == BYSTANDER
                && role(current, other(&giver), index)? != AGENT
            {
                bystander = Some(index);
                break;
            }
        }
        let Some(index) = bystander else { continue };
        used[index] = true;
        cells[index]["bystanderMarks"][0] = json!(guesser);
        turn["guesses"].as_array_mut().ok_or_else(|| malformed("guesses must be an array"))?
            .push(json!({"cell": index, "result": BYSTANDER, "at": started + turn_index as i64 * 60_000 + 54_000}));
        turn["endedBy"] = json!("BYSTANDER");
    }
    let game = json!({
        "board": board,
        "key": field(current, "key")?,
        "cells": cells,
        "tokensRemaining": 0,
        "whoseTurnToGive": history.last().map(|turn| &turn["clueGiver"]).cloned().unwrap_or(json!(counterpart)),
        "phase": SUDDEN_DEATH,
        "winner": null,
        "history": history,
    });
    let remaining_counterpart = remaining(&game, counterpart)?;
    let remaining_agent = remaining(&game, agent)?;
    let valid = match scenario {
        "sudden_death_both" => remaining_counterpart > 0 && remaining_agent > 0,
        "sudden_death_counterpart_only" => remaining_counterpart == 0 && remaining_agent > 0,
        "sudden_death_agent_only" => remaining_counterpart > 0 && remaining_agent == 0,
        _ => false,
    };
    if !valid {
        return Err(CommandRejected::new(
            "Unable to construct requested sudden-death scenario",
        ));
    }
    Ok(game)
}

// Only tutorial-stage boundary errors interpolate arbitrary JSON using Python str/repr.
fn python_repr(value: &Json) -> String {
    match value {
        Value::Null => "None".into(),
        Value::Bool(true) => "True".into(),
        Value::Bool(false) => "False".into(),
        Value::String(text) => {
            let quote = if text.contains('\'') && !text.contains('"') {
                '"'
            } else {
                '\''
            };
            let mut out = String::from(quote);
            for ch in text.chars() {
                match ch {
                    '\\' => out.push_str("\\\\"),
                    '\n' => out.push_str("\\n"),
                    '\r' => out.push_str("\\r"),
                    '\t' => out.push_str("\\t"),
                    ch if ch == quote => {
                        out.push('\\');
                        out.push(ch);
                    }
                    ch if ch.is_control() => {
                        let code = ch as u32;
                        if code <= 0xff {
                            out.push_str(&format!("\\x{code:02x}"));
                        } else {
                            out.push_str(&format!("\\u{code:04x}"));
                        }
                    }
                    ch => out.push(ch),
                }
            }
            out.push(quote);
            out
        }
        Value::Array(items) => format!(
            "[{}]",
            items.iter().map(python_repr).collect::<Vec<_>>().join(", ")
        ),
        Value::Object(items) => format!(
            "{{{}}}",
            items
                .iter()
                .map(|(key, value)| {
                    format!("{}: {}", python_repr(&json!(key)), python_repr(value))
                })
                .collect::<Vec<_>>()
                .join(", ")
        ),
        Value::Number(number) => number.to_string(),
    }
}

pub fn reduce(state: &Json, actor: &str, cmd: &Json) -> Result<ReducerResult, CommandRejected> {
    let command_type = cmd
        .get("type")
        .and_then(Value::as_str)
        .ok_or_else(|| CommandRejected::new("cmd.type is required"))?;
    if command_type == "restore" {
        let restored = cmd
            .get("state")
            .filter(|value| value.is_object())
            .ok_or_else(|| CommandRejected::new("state must be an object"))?;
        return Ok(ReducerResult::ok(
            restored.clone(),
            json!({"success": true}),
        ));
    }
    if !state.is_object() {
        return Err(malformed("state must be an object"));
    }
    let mut state = state.clone();
    if command_type == "startGame" {
        if actor != "player" && actor != "agent" {
            return Err(CommandRejected::new("Unknown actor"));
        }
        if actor == "agent" {
            if let Some(game) = state.get("gameState").filter(|value| truthy(value)) {
                if !game.is_object() {
                    return Err(malformed("gameState must be an object"));
                }
                if game.get("phase") != Some(&json!(GAME_OVER)) {
                    return Err(CommandRejected::new(
                        "A game is already in progress — only the player may start a new one",
                    ));
                }
            }
        }
        let raw = cmd.get("settings").unwrap_or(&Value::Null);
        let mut settings = validate_settings(raw, field(&state, "settings")?)?;
        let tutorial = cmd.get("mode").is_some_and(|mode| mode == "tutorial");
        if tutorial {
            settings = json!({"tokens": 9});
            if let Some(locale) = raw.get("wordLocale").filter(|value| value.is_string()) {
                settings["wordLocale"] = locale.clone();
            }
        }
        state["gameState"] = if tutorial {
            new_tutorial_game(optional_locale(settings.get("wordLocale"))?)
        } else {
            new_game(&settings)?
        };
        state["settings"] = settings;
        state["counterpartSide"] = json!(TEAM_A);
        state["agentSide"] = json!(TEAM_B);
        state["tutorial"] = if tutorial {
            json!({"step": "nori_opening_clue"})
        } else {
            Value::Null
        };
        return Ok(ReducerResult::new(
            state,
            json!({"success": true}),
            vec![json!({"type": "game_start", "counterpartSide": TEAM_A})],
        ));
    }
    if command_type == "reset" {
        if actor != "player" {
            return Err(CommandRejected::new("Only player may reset"));
        }
        if let Some(game) = state.get("gameState").filter(|value| truthy(value)) {
            if !game.is_object() {
                return Err(malformed("gameState must be an object"));
            }
            if game.get("phase") != Some(&json!(GAME_OVER))
                && state.get("tutorial").is_none_or(Value::is_null)
            {
                return Err(CommandRejected::new("Cannot reset a live game"));
            }
        }
        state["gameState"] = Value::Null;
        state["tutorial"] = Value::Null;
        return Ok(ReducerResult::ok(state, json!({"success": true})));
    }
    let mut game = state
        .get("gameState")
        .filter(|value| value.is_object())
        .cloned()
        .ok_or_else(|| CommandRejected::new("Game not started"))?;
    let side = actor_side(&state, actor)?.to_owned();
    let by = if actor == "player" {
        "counterpart"
    } else {
        "agent"
    };
    match command_type {
        "submitClue" => {
            tutorial_gate(&state, actor, command_type, None)?;
            let clue = validate_clue(&game, cmd.get("clue").unwrap_or(&Value::Null))?;
            submit_clue(&mut game, &side, &clue)?;
            let result = json!({"success": true, "newState": game});
            state["gameState"] = game;
            let mut events = vec![
                json!({"type": "clue", "by": by, "word": clue["word"], "count": clue["count"]}),
            ];
            events.extend(advance_tutorial(&mut state, actor, false, false));
            Ok(ReducerResult::new(state, result, events))
        }
        "submitGuess" => {
            let cell = cmd
                .get("cell")
                .and_then(|value| {
                    value
                        .as_i64()
                        .map(i128::from)
                        .or_else(|| value.as_u64().map(i128::from))
                })
                .ok_or_else(|| CommandRejected::new("cell must be an integer"))?;
            tutorial_gate(&state, actor, command_type, Some(cell))?;
            let before = game.clone();
            let (result, turn_ended) = submit_guess(&mut game, &side, cell)?;
            let word = string_field(
                array_field(&before, "board")?
                    .get(cell as usize)
                    .ok_or_else(|| malformed(format!("board is missing cell {cell}")))?,
                "text",
            )?;
            let mut events = vec![
                json!({"type": "card_reveal", "cell": cell as usize, "by": by}),
                json!({"type": "guess", "by": by, "word": word, "result": result}),
            ];
            if before["phase"] != SUDDEN_DEATH && game["phase"] == SUDDEN_DEATH {
                events.push(json!({"type": "sudden_death"}));
            }
            events.extend(outcome_events(
                &game,
                result,
                state.get("tutorial").is_some_and(|value| !value.is_null()),
            )?);
            if before["phase"] != SUDDEN_DEATH && result == "bystander" {
                events.push(json!({"type": "turn_end", "by": by, "reason": "bystander", "correctGuesses": correct_guesses(&game)?}));
            } else if before["phase"] != SUDDEN_DEATH
                && game.get("history").is_some_and(truthy)
                && array_field(&game, "history")?.last().is_some_and(|turn| {
                    turn.get("endedBy")
                        .is_some_and(|value| value == "ALL_FOUND")
                })
            {
                events.push(json!({"type": "turn_end", "by": by, "reason": "all_found", "correctGuesses": correct_guesses(&game)?}));
            } else if game["phase"] == GAME_OVER
                && (result == "assassin"
                    || (before["phase"] == SUDDEN_DEATH && result == "bystander"))
            {
                events.push(
                    json!({"type": "turn_end", "by": by, "reason": result, "correctGuesses": 0}),
                );
            }
            let payload = json!({
                "success": true, "result": result, "word": word,
                "gameStateBefore": before, "gameStateAfter": game, "turnEnded": turn_ended,
            });
            let game_over = game["phase"] == GAME_OVER;
            state["gameState"] = game;
            events.extend(advance_tutorial(&mut state, actor, turn_ended, game_over));
            Ok(ReducerResult::new(state, payload, events))
        }
        "endTurn" => {
            tutorial_gate(&state, actor, command_type, None)?;
            let entered = end_turn(&mut game, &side)?;
            let mut events = vec![
                json!({"type": "turn_end", "by": by, "reason": "voluntary", "correctGuesses": correct_guesses(&game)?}),
            ];
            if entered {
                events.push(json!({"type": "sudden_death"}));
            }
            if game["phase"] == NORMAL
                && field(&game, "whoseTurnToGive")? == field(&state, "agentSide")?
            {
                events.insert(0, json!({"type": "agent_turn", "action": "clue"}));
            }
            state["gameState"] = game;
            events.extend(advance_tutorial(&mut state, actor, true, false));
            Ok(ReducerResult::new(
                state,
                json!({"success": true, "enteredSuddenDeath": entered}),
                events,
            ))
        }
        "tutorialLoadStage" => {
            if actor != "agent" {
                return Err(CommandRejected::new("Only agent may load tutorial stages"));
            }
            let tutorial = state
                .get("tutorial")
                .filter(|value| value.is_object())
                .ok_or_else(|| CommandRejected::new("No tutorial running"))?;
            let stage = cmd.get("stage").unwrap_or(&Value::Null);
            let expected = match tutorial.get("step").and_then(Value::as_str) {
                Some("load_monster_lesson") => json!("monster"),
                Some("load_sudden_death") => json!("sudden_death"),
                _ => Value::Null,
            };
            if stage != &expected {
                let name = stage
                    .as_str()
                    .map(str::to_owned)
                    .unwrap_or_else(|| python_repr(stage));
                return Err(CommandRejected::new(format!(
                    "Tutorial: not at the \"{name}\" stage boundary"
                )));
            }
            load_tutorial_stage(&mut game, stage, string_field(&state, "agentSide")?)?;
            state["gameState"] = game;
            let mut events = advance_tutorial(&mut state, actor, false, false);
            if stage == "sudden_death" {
                events.push(json!({"type": "sudden_death"}));
            }
            Ok(ReducerResult::new(state, json!({"success": true}), events))
        }
        "debugLoadScenario" => {
            let scenario = cmd
                .get("scenarioId")
                .and_then(Value::as_str)
                .ok_or_else(|| CommandRejected::new("scenarioId must be a string"))?;
            state["gameState"] = debug_sudden_death(&state, scenario)?;
            state["tutorial"] = Value::Null;
            Ok(ReducerResult::new(
                state,
                json!({"success": true}),
                vec![json!({"type": "sudden_death"})],
            ))
        }
        _ => Err(CommandRejected::new(format!(
            "Unknown codenames command: {command_type}"
        ))),
    }
}

// ponytail: character overlap is a cheap fallback, not semantic clue matching.
fn lexical_overlap(word: &str, clue: &str) -> usize {
    word.to_uppercase()
        .chars()
        .filter(|ch| clue.contains(*ch))
        .count()
}

fn public_guess(state: &Json, game: &Json, clue: &str) -> Option<Json> {
    let agent_side = string_field(state, "agentSide").ok()?;
    let history = array_field(game, "history").ok()?;
    let guesses = history
        .last()
        .and_then(|turn| turn.get("guesses"))
        .and_then(Value::as_array)
        .map_or(0, Vec::len);
    let mut candidates = Vec::new();
    for (index, cell) in array_field(game, "cells").ok()?.iter().enumerate().take(25) {
        if field(cell, "solvedBy").ok()?.is_null()
            && field(cell, "assassinatedBy").ok()?.is_null()
            && !array_field(cell, "bystanderMarks")
                .ok()?
                .iter()
                .any(|side| side == agent_side)
        {
            candidates.push(index);
        }
    }
    let seed = state
        .pointer("/settings/seed")
        .and_then(|value| {
            value
                .as_i64()
                .map(i64::unsigned_abs)
                .or_else(|| value.as_u64())
        })
        .unwrap_or(0);
    PythonRandom::new(
        seed.wrapping_add(history.len() as u64)
            .wrapping_mul(31)
            .wrapping_add(guesses as u64),
    )
    .shuffle(&mut candidates);
    let board = array_field(game, "board").ok()?;
    let clue = clue.to_uppercase();
    let index = candidates.into_iter().max_by_key(|&index| {
        lexical_overlap(
            board
                .get(index)
                .and_then(|word| word.get("text"))
                .and_then(Value::as_str)
                .unwrap_or(""),
            &clue,
        )
    })?;
    Some(json!({"type": "submitGuess", "cell": index}))
}

fn agent_clue(state: &Json, game: &Json, agent_side: &str) -> Option<Json> {
    let settings = settings_for_words(state).ok()?;
    let locale = optional_locale(settings.and_then(|value| value.get("wordLocale"))).ok()?;
    let board = array_field(game, "board").ok()?;
    let target = array_field(game, "cells")
        .ok()?
        .iter()
        .enumerate()
        .find_map(|(index, cell)| {
            (cell.get("solvedBy")?.is_null() && role(game, agent_side, index).ok()? == AGENT)
                .then(|| board.get(index)?.get("text")?.as_str())
                .flatten()
        })?;
    let word = resolve_words(locale)
        .ok()?
        .into_iter()
        .filter(|word| validate_clue(game, &json!({"word": word, "count": 1})).is_ok())
        .max_by_key(|word| lexical_overlap(word, &target.to_uppercase()))?;
    Some(json!({"type": "submitClue", "clue": {"word": word, "count": 1}}))
}

pub fn agent_next_command(state: &Json) -> Option<Json> {
    let game = state.get("gameState").filter(|value| value.is_object())?;
    let agent_side = state.get("agentSide")?.as_str()?;
    if let Some(tutorial) = state
        .get("tutorial")
        .filter(|value| value.is_object() && value.get("step") != Some(&json!("free_play")))
    {
        let step = tutorial.get("step").and_then(Value::as_str).unwrap_or("");
        if matches!(step, "load_monster_lesson" | "load_sudden_death") {
            return Some(
                json!({"type": "tutorialLoadStage", "stage": if step == "load_monster_lesson" { "monster" } else { "sudden_death" }}),
            );
        }
        let settings = settings_for_words(state).ok()?;
        let locale = optional_locale(settings.and_then(|value| value.get("wordLocale"))).ok()?;
        if let Some(clue) = tutorial_clue(locale, step) {
            return Some(json!({"type": "submitClue", "clue": clue}));
        }
        if step == "nori_real_guessing" {
            if let Some(turn) = array_field(game, "history").ok()?.last() {
                if field(turn, "clueGiver").ok()? != agent_side
                    && field(turn, "endedBy").ok()?.is_null()
                {
                    if !array_field(turn, "guesses").ok()?.is_empty() {
                        return Some(json!({"type": "endTurn"}));
                    }
                    let giver = string_field(turn, "clueGiver").ok()?;
                    for (index, cell) in array_field(game, "cells").ok()?.iter().enumerate() {
                        if field(cell, "solvedBy").ok()?.is_null()
                            && field(cell, "assassinatedBy").ok()?.is_null()
                            && role(game, giver, index).ok()? == AGENT
                        {
                            return Some(json!({"type": "submitGuess", "cell": index}));
                        }
                    }
                }
            }
        }
        return None;
    }
    if game.get("phase")? == GAME_OVER {
        return None;
    }
    if game["phase"] == NORMAL {
        let history = array_field(game, "history").ok()?;
        let closed = match history.last() {
            Some(turn) => !field(turn, "endedBy").ok()?.is_null(),
            None => true,
        };
        if closed {
            if game.get("whoseTurnToGive")? == agent_side && remaining(game, agent_side).ok()? > 0 {
                return agent_clue(state, game, agent_side);
            }
        } else {
            let turn = history.last()?;
            if field(turn, "clueGiver").ok()? != agent_side {
                let guesses = array_field(turn, "guesses").ok()?.len();
                let clue = field(turn, "clue").ok()?;
                let count = field(clue, "count").ok()?;
                // Zero and infinity permit unlimited guesses. Finite clues stop
                // at count (rather than using the optional extra guess).
                let limit = if count == "infinity" || count.as_u64() == Some(0) {
                    u64::MAX
                } else {
                    count.as_u64()?
                };
                if guesses > 0 && guesses as u64 >= limit {
                    return Some(json!({"type": "endTurn"}));
                }
                if let Some(command) = public_guess(state, game, string_field(clue, "word").ok()?) {
                    return Some(command);
                }
                if guesses > 0 {
                    return Some(json!({"type": "endTurn"}));
                }
            }
        }
    } else if game["phase"] == SUDDEN_DEATH && remaining(game, agent_side).ok()? > 0 {
        // Same eligibility check as the reducer; card choice never reads the key.
        return public_guess(state, game, "");
    }
    None
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashSet;

    fn dispatch(state: &mut Json, actor: &str, command: Json) -> ReducerResult {
        let reduced = reduce(state, actor, &command).unwrap();
        *state = reduced.state.clone();
        reduced
    }

    fn reject(state: &Json, actor: &str, command: Json, message: &str) {
        let before = state.clone();
        assert_eq!(reduce(state, actor, &command).unwrap_err().0, message);
        assert_eq!(*state, before);
    }

    fn agent(state: &mut Json, expected_type: &str) -> ReducerResult {
        let command = agent_next_command(state).expect("agent should have a command");
        assert_eq!(command["type"], expected_type);
        dispatch(state, "agent", command)
    }

    fn event_types(reduced: &ReducerResult) -> Vec<&str> {
        reduced
            .events
            .iter()
            .map(|event| event["type"].as_str().unwrap())
            .collect()
    }

    fn fixture() -> Json {
        let mut state = initial_state();
        state["gameState"] = new_tutorial_game(Some("en"));
        state
    }

    fn give_clue(state: &mut Json, actor: &str) -> ReducerResult {
        dispatch(
            state,
            actor,
            json!({"type": "submitClue", "clue": {"word": "NORI", "count": 2}}),
        )
    }

    #[test]
    fn codenames_localization_and_guess() {
        let mut zh = initial_state();
        dispatch(
            &mut zh,
            "player",
            json!({"type": "startGame", "settings": {"tokens": 9, "seed": 10, "wordLocale": "zh-CN"}}),
        );
        let game = &zh["gameState"];
        assert_eq!(game["board"].as_array().unwrap().len(), 25);
        assert_eq!(game["cells"].as_array().unwrap().len(), 25);
        assert!(game["board"][0]["text"]
            .as_str()
            .unwrap()
            .chars()
            .any(|ch| ('\u{4e00}'..='\u{9fff}').contains(&ch)));
        dispatch(
            &mut zh,
            "player",
            json!({"type": "submitClue", "clue": {"word": "诺莉", "count": 2}}),
        );
        assert_eq!(zh["gameState"]["history"][0]["clue"]["word"], "诺莉");
        let action = agent_next_command(&zh).unwrap();
        assert_eq!(action["type"], "submitGuess");
        dispatch(&mut zh, "agent", action);

        let mut en = initial_state();
        dispatch(
            &mut en,
            "player",
            json!({"type": "startGame", "settings": {"tokens": 9, "seed": 10, "wordLocale": "en"}}),
        );
        assert_eq!(en["gameState"]["board"].as_array().unwrap().len(), 25);
        assert!(en["gameState"]["board"]
            .as_array()
            .unwrap()
            .iter()
            .all(|entry| {
                let text = entry["text"].as_str().unwrap();
                text == text.to_uppercase() && text.chars().any(char::is_uppercase)
            }));
        dispatch(
            &mut en,
            "player",
            json!({"type": "submitClue", "clue": {"word": "NORI", "count": 1}}),
        );
        assert_eq!(en["gameState"]["history"][0]["clue"]["word"], "NORI");
    }

    #[test]
    fn codenames_debug_scenarios() {
        for (scenario, expected) in [
            ("sudden_death_both", (true, true)),
            ("sudden_death_counterpart_only", (false, true)),
            ("sudden_death_agent_only", (true, false)),
        ] {
            let mut state = initial_state();
            dispatch(
                &mut state,
                "player",
                json!({"type": "startGame", "settings": {"tokens": 9, "seed": 41, "wordLocale": "en"}}),
            );
            let original_key = state["gameState"]["key"].clone();
            let reduced = dispatch(
                &mut state,
                "player",
                json!({"type": "debugLoadScenario", "scenarioId": scenario}),
            );
            let game = &state["gameState"];
            assert_eq!(
                (
                    remaining(game, TEAM_A).unwrap() > 0,
                    remaining(game, TEAM_B).unwrap() > 0
                ),
                expected
            );
            assert_eq!(game["phase"], SUDDEN_DEATH);
            assert_eq!(game["tokensRemaining"], 0);
            assert_eq!(
                game["history"].as_array().unwrap().len() as u64,
                state["settings"]["tokens"].as_u64().unwrap()
            );
            assert_eq!(reduced.result, json!({"success": true}));
            assert_eq!(reduced.events, vec![json!({"type": "sudden_death"})]);
            assert_eq!(game["key"], original_key);
            assert!(state["tutorial"].is_null());
            let mut used = HashSet::new();
            for (turn_index, turn) in game["history"].as_array().unwrap().iter().enumerate() {
                let giver = turn["clueGiver"].as_str().unwrap();
                assert_eq!(giver, if turn_index % 2 == 0 { TEAM_A } else { TEAM_B });
                assert!(!game["board"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .any(|entry| entry["text"] == turn["clue"]["word"]));
                assert_eq!(turn["clue"]["count"], 2);
                for guess in turn["guesses"].as_array().unwrap() {
                    let index = guess["cell"].as_u64().unwrap() as usize;
                    assert!(used.insert(index));
                    assert_eq!(guess["result"], game["key"][giver][index]);
                    assert!(guess["at"].as_i64().unwrap() <= now_ms());
                    if guess["result"] == AGENT {
                        assert_eq!(game["cells"][index]["solvedBy"], other(giver));
                    } else {
                        assert_eq!(turn_index % 3, 2);
                        assert_eq!(guess["result"], BYSTANDER);
                        assert_eq!(turn["endedBy"], "BYSTANDER");
                        assert_eq!(game["cells"][index]["bystanderMarks"][0], other(giver));
                        assert_ne!(game["key"][other(giver)][index], AGENT);
                    }
                }
            }
            let again = reduce(
                &state,
                "agent",
                &json!({"type": "debugLoadScenario", "scenarioId": scenario}),
            )
            .unwrap();
            assert_eq!(again.state["gameState"]["board"], game["board"]);
            assert_eq!(again.state["gameState"]["cells"], game["cells"]);
            match agent_next_command(&state) {
                Some(command) => {
                    assert!(expected.1, "{scenario}");
                    assert_eq!(command["type"], "submitGuess");
                    let index = command["cell"].as_u64().unwrap() as usize;
                    assert!(game["cells"][index]["solvedBy"].is_null());
                }
                None => assert!(!expected.1, "{scenario}"),
            }
        }
        let state = fixture();
        reject(
            &state,
            "player",
            json!({"type": "debugLoadScenario"}),
            "scenarioId must be a string",
        );
        reject(
            &state,
            "player",
            json!({"type": "debugLoadScenario", "scenarioId": "other"}),
            "Unknown Codenames debug scenario",
        );
        let mut no_exclusive = state;
        no_exclusive["gameState"]["key"][TEAM_B] = no_exclusive["gameState"]["key"][TEAM_A].clone();
        reject(
            &no_exclusive,
            "player",
            json!({"type": "debugLoadScenario", "scenarioId": "sudden_death_both"}),
            "Current key has no agent-only treasure",
        );
        reject(
            &no_exclusive,
            "player",
            json!({"type": "debugLoadScenario", "scenarioId": "sudden_death_agent_only"}),
            "Current key has no counterpart-only treasure",
        );
    }

    #[test]
    fn codenames_tutorial_script_and_gates() {
        let mut state = initial_state();
        let start = dispatch(
            &mut state,
            "player",
            json!({"type": "startGame", "mode": "tutorial", "settings": {"wordLocale": "en"}}),
        );
        assert_eq!(
            start.events,
            vec![json!({"type": "game_start", "counterpartSide": TEAM_A})]
        );
        assert_eq!(state["tutorial"], json!({"step": "nori_opening_clue"}));
        assert_eq!(state["gameState"]["whoseTurnToGive"], TEAM_B);
        assert_eq!(state["gameState"]["board"][0]["text"], "MOON");
        assert_eq!(remaining(&state["gameState"], TEAM_A).unwrap(), 9);
        assert_eq!(remaining(&state["gameState"], TEAM_B).unwrap(), 9);
        reject(
            &state,
            "player",
            json!({"type": "submitGuess", "cell": 0}),
            "Tutorial: wait — it is not your move yet",
        );
        reject(
            &state,
            "player",
            json!({"type": "submitClue"}),
            "Tutorial: wait — it is not your move yet",
        );
        reject(
            &state,
            "player",
            json!({"type": "submitGuess", "cell": true}),
            "cell must be an integer",
        );
        reject(
            &state,
            "agent",
            json!({"type": "tutorialLoadStage", "stage": "monster"}),
            "Tutorial: not at the \"monster\" stage boundary",
        );
        reject(
            &state,
            "agent",
            json!({"type": "tutorialLoadStage"}),
            "Unknown tutorial stage",
        );
        let opening = agent(&mut state, "submitClue");
        assert_eq!(
            state["gameState"]["history"][0]["clue"],
            json!({"word": "NIGHT", "count": 2})
        );
        assert_eq!(
            opening.events,
            vec![
                json!({"type": "clue", "by": "agent", "word": "NIGHT", "count": 2}),
                json!({"type": "tutorial_step", "step": "nori_opening_clue"}),
            ]
        );
        assert_eq!(opening.result["newState"], state["gameState"]);
        assert!(agent_next_command(&state).is_none());
        reject(
            &state,
            "player",
            json!({"type": "endTurn"}),
            "Tutorial: this step asks you to guess a card",
        );
        reject(
            &state,
            "player",
            json!({"type": "submitGuess", "cell": 1}),
            "Tutorial: this step asks you to guess the highlighted card",
        );
        reject(
            &state,
            "player",
            json!({"type": "submitGuess", "cell": -1}),
            "Tutorial: this step asks you to guess the highlighted card",
        );
        for (index, old_step, next_step) in [
            (0, "player_first_treasure", "player_second_treasure"),
            (10, "player_second_treasure", "player_berry_lesson"),
            (17, "player_berry_lesson", "player_real_clue"),
        ] {
            let guess = dispatch(
                &mut state,
                "player",
                json!({"type": "submitGuess", "cell": index}),
            );
            assert_eq!(state["tutorial"]["step"], next_step);
            assert_eq!(
                guess.events.last().unwrap(),
                &json!({"type": "tutorial_step", "step": old_step})
            );
            if index == 17 {
                assert_eq!(guess.result["result"], "bystander");
                assert_eq!(
                    guess.events[2],
                    json!({"type": "turn_end", "by": "counterpart", "reason": "bystander", "correctGuesses": 2})
                );
            }
        }
        reject(
            &state,
            "player",
            json!({"type": "endTurn"}),
            "Tutorial: this step asks you to give a clue of your own",
        );
        dispatch(
            &mut state,
            "player",
            json!({"type": "submitClue", "clue": {"word": "BUILDING", "count": 2}}),
        );
        assert_eq!(state["tutorial"]["step"], "nori_real_guessing");
        let real_guess = agent(&mut state, "submitGuess");
        assert_eq!(real_guess.result["result"], "agent");
        assert_eq!(state["tutorial"]["step"], "nori_real_guessing");
        assert_eq!(
            real_guess.events.last().unwrap(),
            &json!({"type": "tutorial_step", "step": "nori_real_guessing"})
        );
        reject(
            &state,
            "player",
            json!({"type": "endTurn"}),
            "Tutorial: wait — it is not your move yet",
        );
        let end = agent(&mut state, "endTurn");
        assert_eq!(
            end.events,
            vec![
                json!({"type": "agent_turn", "action": "clue"}),
                json!({"type": "turn_end", "by": "agent", "reason": "voluntary", "correctGuesses": 1}),
                json!({"type": "tutorial_step", "step": "nori_real_guessing"}),
            ]
        );
        agent(&mut state, "submitClue");
        assert_eq!(state["tutorial"]["step"], "player_free_guessing");
        assert_eq!(
            state["gameState"]["history"][2]["clue"],
            json!({"word": "CANINE", "count": 2})
        );
        reject(
            &state,
            "player",
            json!({"type": "submitClue"}),
            "Tutorial: this step asks you to guess or end your turn",
        );
        reject(
            &state,
            "player",
            json!({"type": "endTurn"}),
            "Must make at least one guess before ending turn",
        );
        dispatch(
            &mut state,
            "player",
            json!({"type": "submitGuess", "cell": 6}),
        );
        assert_eq!(state["tutorial"]["step"], "player_free_guessing");
        dispatch(&mut state, "player", json!({"type": "endTurn"}));
        assert_eq!(state["tutorial"]["step"], "load_monster_lesson");
        reject(
            &state,
            "player",
            json!({"type": "tutorialLoadStage", "stage": "monster"}),
            "Only agent may load tutorial stages",
        );
        reject(
            &state,
            "agent",
            json!({"type": "tutorialLoadStage", "stage": "sudden_death"}),
            "Tutorial: not at the \"sudden_death\" stage boundary",
        );
        reject(
            &state,
            "agent",
            json!({"type": "tutorialLoadStage"}),
            "Tutorial: not at the \"None\" stage boundary",
        );
        let monster_stage = agent(&mut state, "tutorialLoadStage");
        assert_eq!(
            monster_stage.events,
            vec![json!({"type": "tutorial_step", "step": "load_monster_lesson"})]
        );
        agent(&mut state, "submitClue");
        assert_eq!(state["tutorial"]["step"], "player_monster_touch");
        assert_eq!(
            state["gameState"]["history"][3]["clue"],
            json!({"word": "CHIME", "count": 1})
        );
        let monster = dispatch(
            &mut state,
            "player",
            json!({"type": "submitGuess", "cell": 23}),
        );
        assert_eq!(state["gameState"]["phase"], GAME_OVER);
        assert_eq!(state["gameState"]["cells"][23]["assassinatedBy"], TEAM_A);
        assert_eq!(
            event_types(&monster),
            [
                "card_reveal",
                "guess",
                "game_over",
                "turn_end",
                "tutorial_step"
            ]
        );
        assert_eq!(state["tutorial"]["step"], "load_sudden_death");
        let sudden_stage = agent(&mut state, "tutorialLoadStage");
        assert_eq!(
            sudden_stage.events,
            vec![
                json!({"type": "tutorial_step", "step": "load_sudden_death"}),
                json!({"type": "sudden_death"}),
            ]
        );
        assert_eq!(state["gameState"]["phase"], SUDDEN_DEATH);
        assert_eq!(state["gameState"]["tokensRemaining"], 0);
        assert!(state["gameState"]["cells"][23]["assassinatedBy"].is_null());
        assert_eq!(state["gameState"]["history"][3]["endedBy"], "VOLUNTARY_END");
        assert_eq!(remaining(&state["gameState"], TEAM_A).unwrap(), 1);
        assert_eq!(remaining(&state["gameState"], TEAM_B).unwrap(), 1);
        assert_eq!(state["tutorial"]["step"], "player_finale_guess");
        let final_guess = dispatch(
            &mut state,
            "player",
            json!({"type": "submitGuess", "cell": 12}),
        );
        assert_eq!(state["tutorial"], json!({"step": "free_play"}));
        assert_eq!(state["gameState"]["winner"], "TEAM");
        assert_eq!(
            event_types(&final_guess),
            ["card_reveal", "guess", "game_over", "tutorial_step"]
        );
        assert_eq!(
            final_guess.events[2],
            json!({"type": "game_over", "winner": "team"})
        );
        assert_eq!(
            final_guess.events[3],
            json!({"type": "tutorial_step", "step": "player_finale_guess"})
        );
        assert_eq!(final_guess.result["gameStateBefore"]["phase"], SUDDEN_DEATH);
        assert_eq!(final_guess.result["gameStateAfter"], state["gameState"]);
        assert!(agent_next_command(&state).is_none());
    }

    #[test]
    fn codenames_seeded_boards_are_deterministic() {
        for seed in [
            json!(0),
            json!(7),
            json!(-7),
            json!(i64::MIN),
            json!(u64::MAX),
        ] {
            let command = json!({"type": "startGame", "settings": {"tokens": 11, "seed": seed, "wordLocale": "en"}});
            let first = reduce(&initial_state(), "player", &command).unwrap().state;
            let second = reduce(&initial_state(), "player", &command).unwrap().state;
            assert_eq!(first, second);
            assert_eq!(first["settings"]["seed"], seed);
            let game = &first["gameState"];
            let unique: HashSet<&str> = game["board"]
                .as_array()
                .unwrap()
                .iter()
                .map(|entry| {
                    assert_eq!(entry["id"], entry["text"]);
                    entry["text"].as_str().unwrap()
                })
                .collect();
            assert_eq!(unique.len(), 25);
            for side in [TEAM_A, TEAM_B] {
                assert_eq!(remaining(game, side).unwrap(), 9);
                assert_eq!(
                    key(game, side)
                        .unwrap()
                        .iter()
                        .filter(|role| *role == ASSASSIN)
                        .count(),
                    3
                );
            }
            assert_eq!(
                (0..25)
                    .filter(|index| game["key"][TEAM_A][*index] == AGENT
                        && game["key"][TEAM_B][*index] == AGENT)
                    .count(),
                3
            );
        }
        let positive = reduce(
            &initial_state(),
            "player",
            &json!({"type": "startGame", "settings": {"seed": 7}}),
        )
        .unwrap()
        .state;
        let negative = reduce(
            &initial_state(),
            "player",
            &json!({"type": "startGame", "settings": {"seed": -7}}),
        )
        .unwrap()
        .state;
        assert_eq!(positive["gameState"], negative["gameState"]);
    }

    #[test]
    fn codenames_settings_and_clue_validation_order() {
        for settings in [json!(false), json!([]), json!(9), json!("en")] {
            reject(
                &initial_state(),
                "player",
                json!({"type": "startGame", "settings": settings}),
                "settings must be an object",
            );
        }
        for seed in [json!(true), json!(10.0), json!("10")] {
            reject(
                &initial_state(),
                "player",
                json!({"type": "startGame", "settings": {"seed": seed}}),
                "seed must be an integer",
            );
        }
        for tokens in [json!(true), json!(8), json!([]), json!("9")] {
            reject(
                &initial_state(),
                "player",
                json!({"type": "startGame", "settings": {"tokens": tokens}}),
                "tokens must be 9, 10, or 11",
            );
        }
        reject(
            &initial_state(),
            "player",
            json!({"type": "startGame", "settings": {"tokens": 8, "seed": true, "wordLocale": 1}}),
            "tokens must be 9, 10, or 11",
        );
        reject(
            &initial_state(),
            "player",
            json!({"type": "startGame", "settings": {"wordLocale": 1}}),
            "wordLocale must be a string",
        );
        let mut state = fixture();
        for clue in [json!(null), json!([]), json!("NORI")] {
            reject(
                &state,
                "player",
                json!({"type": "submitClue", "clue": clue}),
                "clue must be an object",
            );
        }
        reject(
            &state,
            "player",
            json!({"type": "submitClue"}),
            "clue must be an object",
        );
        reject(
            &state,
            "player",
            json!({"type": "submitClue", "clue": {"count": 1}}),
            "clue.word must be a string",
        );
        for word in [
            "",
            "TWO WORDS",
            "CLUE1",
            "CLUE２",
            "CLUE١",
            "CLUE𝟙",
            "CLUE\u{1c}WORD",
        ] {
            reject(
                &state,
                "player",
                json!({"type": "submitClue", "clue": {"word": word, "count": false}}),
                "Invalid clue word",
            );
        }
        reject(
            &state,
            "player",
            json!({"type": "submitClue", "clue": {"word": " moon ", "count": false}}),
            "Clue word cannot be on the board",
        );
        state["gameState"]["board"][0]["text"] = json!("straße");
        reject(
            &state,
            "player",
            json!({"type": "submitClue", "clue": {"word": "STRASSE", "count": 1}}),
            "Clue word cannot be on the board",
        );
        for count in [
            json!(-1),
            json!(true),
            json!(1.0),
            json!("Infinity"),
            json!(null),
        ] {
            reject(
                &state,
                "player",
                json!({"type": "submitClue", "clue": {"word": "VALID", "count": count}}),
                "Clue count must be a non-negative integer or infinity",
            );
        }
        reject(
            &state,
            "player",
            json!({"type": "submitClue", "clue": {"word": "VALID", "count": 1}}),
            "Not your turn",
        );
        for count in [json!(0), json!("infinity"), json!(u64::MAX)] {
            let reduced = reduce(
                &state,
                "agent",
                &json!({"type": "submitClue", "clue": {"word": "\u{1c} valid² \u{1f}", "count": count}}),
            ).unwrap();
            assert_eq!(reduced.events[0]["word"], "VALID²");
            assert_eq!(reduced.events[0]["count"], count);
        }
        let long = "森".repeat(24);
        assert!(validate_clue(&state["gameState"], &json!({"word": long, "count": 1})).is_ok());
        assert_eq!(
            validate_clue(
                &state["gameState"],
                &json!({"word": "森".repeat(25), "count": 1})
            )
            .unwrap_err()
            .0,
            "Invalid clue word"
        );
        for value in [json!(true), json!(1.0), json!("1")] {
            reject(
                &state,
                "player",
                json!({"type": "submitGuess", "cell": value}),
                "cell must be an integer",
            );
        }
        reject(
            &state,
            "player",
            json!({"type": "submitGuess", "cell": u64::MAX}),
            "Cell index must be between 0 and 24",
        );
        let mut floats = initial_state();
        dispatch(
            &mut floats,
            "player",
            json!({"type": "startGame", "settings": {"tokens": 9.0, "seed": 0}}),
        );
        assert_eq!(floats["settings"]["tokens"], json!(9.0));
        assert_eq!(floats["gameState"]["tokensRemaining"], json!(9.0));
        spend_token(&mut floats["gameState"]).unwrap();
        assert_eq!(floats["gameState"]["tokensRemaining"], json!(8.0));
    }

    #[test]
    fn codenames_word_locale_resolution_and_tutorial_localization() {
        let raw = json!(["ONE", "TWO"]);
        assert_eq!(
            resolve_words_from(&raw, Some("jp")).unwrap(),
            ["ONE", "TWO"]
        );
        let data = json!({"fr": ["PREMIER"], "ja": ["ベル"]});
        assert_eq!(resolve_words_from(&data, Some("de")).unwrap(), ["PREMIER"]);
        assert_eq!(resolve_words_from(&data, Some("jp")).unwrap(), ["ベル"]);
        assert!(resolve_words_from(&data, Some("zh-TW")).unwrap().is_empty());
        let data = json!({"en": ["ENGLISH"], "zh-CN": [], "ja": []});
        for locale in [
            None,
            Some(""),
            Some("zh_TW"),
            Some("cn"),
            Some("ja_JP"),
            Some("jp"),
        ] {
            assert_eq!(resolve_words_from(&data, locale).unwrap(), ["ENGLISH"]);
        }
        assert_eq!(
            resolve_words(Some("jp")).unwrap(),
            resolve_words(Some("ja-JP")).unwrap()
        );
        assert_eq!(
            resolve_words(Some("zh_HK")).unwrap(),
            resolve_words(None).unwrap()
        );
        for (locale, first, clue) in [
            ("en", "MOON", "NIGHT"),
            ("zh-CN", "月亮", "黑夜"),
            ("ja_JP", "満月", "真夜中"),
            ("jp", "MOON", "NIGHT"),
        ] {
            let mut state = initial_state();
            state["settings"]["seed"] = json!(42);
            dispatch(
                &mut state,
                "player",
                json!({"type": "startGame", "mode": "tutorial", "settings": {"tokens": 11, "seed": 7, "wordLocale": locale}}),
            );
            assert_eq!(
                state["settings"],
                json!({"tokens": 9, "wordLocale": locale})
            );
            assert_eq!(state["gameState"]["board"][0]["text"], first);
            assert_eq!(agent_next_command(&state).unwrap()["clue"]["word"], clue);
        }
        let mut state = initial_state();
        dispatch(
            &mut state,
            "player",
            json!({"type": "startGame", "mode": "tutorial"}),
        );
        assert_eq!(state["settings"], json!({"tokens": 9}));
        assert_eq!(state["gameState"]["board"][0]["text"], "MOON");
    }

    #[test]
    fn codenames_restore_reset_and_start_permissions() {
        let restored = json!({"custom": [1, 2], "settings": {"wordLocale": "en"}});
        let reduced = reduce(
            &initial_state(),
            "unknown",
            &json!({"type": "restore", "state": restored}),
        )
        .unwrap();
        assert_eq!(reduced.state, restored);
        assert_eq!(reduced.result, json!({"success": true}));
        assert!(reduced.events.is_empty());
        for restored in [json!(null), json!([]), json!(false)] {
            reject(
                &initial_state(),
                "agent",
                json!({"type": "restore", "state": restored}),
                "state must be an object",
            );
        }
        let mut state = fixture();
        reject(
            &state,
            "agent",
            json!({"type": "startGame", "settings": false}),
            "A game is already in progress — only the player may start a new one",
        );
        reject(
            &state,
            "unknown",
            json!({"type": "startGame"}),
            "Unknown actor",
        );
        reject(
            &state,
            "agent",
            json!({"type": "reset"}),
            "Only player may reset",
        );
        reject(
            &state,
            "player",
            json!({"type": "reset"}),
            "Cannot reset a live game",
        );
        reject(
            &state,
            "agent",
            json!({"type": "tutorialLoadStage", "stage": "monster"}),
            "No tutorial running",
        );
        state["tutorial"] = json!({"step": "nori_opening_clue"});
        let settings = state["settings"].clone();
        dispatch(&mut state, "player", json!({"type": "reset"}));
        assert!(state["gameState"].is_null());
        assert!(state["tutorial"].is_null());
        assert_eq!(state["settings"], settings);
        dispatch(
            &mut state,
            "agent",
            json!({"type": "startGame", "settings": {"seed": 12}}),
        );
        dispatch(
            &mut state,
            "player",
            json!({"type": "startGame", "settings": {"seed": 13}}),
        );
        state["gameState"]["phase"] = json!(GAME_OVER);
        dispatch(&mut state, "agent", json!({"type": "startGame"}));
        assert!(state["tutorial"].is_null());
        reject(
            &initial_state(),
            "unknown",
            json!({"type": "unknown"}),
            "Game not started",
        );
        reject(
            &state,
            "unknown",
            json!({"type": "unknown"}),
            "Unknown actor",
        );
        reject(
            &state,
            "player",
            json!({"type": "unknown"}),
            "Unknown codenames command: unknown",
        );
    }

    #[test]
    fn codenames_turn_end_events_and_result_payloads() {
        let mut state = fixture();
        let clue = give_clue(&mut state, "agent");
        assert_eq!(
            clue.result,
            json!({"success": true, "newState": state["gameState"]})
        );
        let before = state["gameState"].clone();
        let first = dispatch(
            &mut state,
            "player",
            json!({"type": "submitGuess", "cell": 0}),
        );
        assert_eq!(
            first.result,
            json!({
                "success": true, "result": "agent", "word": "MOON", "gameStateBefore": before,
                "gameStateAfter": state["gameState"], "turnEnded": false,
            })
        );
        assert_eq!(event_types(&first), ["card_reveal", "guess"]);
        dispatch(
            &mut state,
            "player",
            json!({"type": "submitGuess", "cell": 10}),
        );
        let bystander = dispatch(
            &mut state,
            "player",
            json!({"type": "submitGuess", "cell": 17}),
        );
        assert_eq!(
            bystander.events[2],
            json!({"type": "turn_end", "by": "counterpart", "reason": "bystander", "correctGuesses": 2})
        );
        assert_eq!(state["gameState"]["tokensRemaining"], 8);
        assert_eq!(state["gameState"]["history"][0]["endedBy"], "BYSTANDER");
        reject(
            &state,
            "player",
            json!({"type": "endTurn"}),
            "Current turn has already ended",
        );
        reject(
            &state,
            "player",
            json!({"type": "submitGuess", "cell": 1}),
            "Current turn has ended",
        );
        give_clue(&mut state, "player");
        reject(
            &state,
            "player",
            json!({"type": "submitGuess", "cell": 4}),
            "Clue giver cannot make guesses",
        );
        reject(
            &state,
            "player",
            json!({"type": "endTurn"}),
            "Clue giver cannot end turn",
        );
        reject(
            &state,
            "agent",
            json!({"type": "endTurn"}),
            "Must make at least one guess before ending turn",
        );
        dispatch(
            &mut state,
            "agent",
            json!({"type": "submitGuess", "cell": 4}),
        );
        let end = dispatch(&mut state, "agent", json!({"type": "endTurn"}));
        assert_eq!(
            end.events,
            vec![
                json!({"type": "agent_turn", "action": "clue"}),
                json!({"type": "turn_end", "by": "agent", "reason": "voluntary", "correctGuesses": 1})
            ]
        );
        assert_eq!(
            end.result,
            json!({"success": true, "enteredSuddenDeath": false})
        );

        let mut all_found = fixture();
        all_found["gameState"]["key"][TEAM_B] = json!(vec![BYSTANDER; 25]);
        all_found["gameState"]["key"][TEAM_B][0] = json!(AGENT);
        all_found["gameState"]["tokensRemaining"] = json!(1);
        give_clue(&mut all_found, "agent");
        let last_agent = dispatch(
            &mut all_found,
            "player",
            json!({"type": "submitGuess", "cell": 0}),
        );
        assert_eq!(last_agent.result["turnEnded"], true);
        assert_eq!(all_found["gameState"]["history"][0]["endedBy"], "ALL_FOUND");
        assert_eq!(last_agent.events[2], json!({"type": "sudden_death"}));
        assert_eq!(
            last_agent.events[3],
            json!({"type": "turn_end", "by": "counterpart", "reason": "all_found", "correctGuesses": 1})
        );
        assert_eq!(all_found["gameState"]["tokensRemaining"], 0);

        let mut voluntary = fixture();
        voluntary["gameState"]["tokensRemaining"] = json!(1);
        give_clue(&mut voluntary, "agent");
        dispatch(
            &mut voluntary,
            "player",
            json!({"type": "submitGuess", "cell": 0}),
        );
        let end = dispatch(&mut voluntary, "player", json!({"type": "endTurn"}));
        assert_eq!(
            end.result,
            json!({"success": true, "enteredSuddenDeath": true})
        );
        assert_eq!(
            end.events,
            vec![
                json!({"type": "turn_end", "by": "counterpart", "reason": "voluntary", "correctGuesses": 1}),
                json!({"type": "sudden_death"})
            ]
        );

        let mut repeated = fixture();
        give_clue(&mut repeated, "agent");
        reject(
            &repeated,
            "agent",
            json!({"type": "submitClue", "clue": {"word": "VALID", "count": 1}}),
            "Current turn has not ended",
        );
        assert_eq!(
            repeated["gameState"]["history"].as_array().unwrap().len(),
            1
        );
        assert_eq!(repeated["gameState"]["tokensRemaining"], 9);
        dispatch(
            &mut repeated,
            "player",
            json!({"type": "submitGuess", "cell": 17}),
        );
        repeated["gameState"]["whoseTurnToGive"] = json!(TEAM_B);
        give_clue(&mut repeated, "agent");
        dispatch(
            &mut repeated,
            "player",
            json!({"type": "submitGuess", "cell": 17}),
        );
        assert_eq!(
            repeated["gameState"]["cells"][17]["bystanderMarks"],
            json!([TEAM_A, TEAM_A])
        );
    }

    #[test]
    fn codenames_sudden_death_rules_and_outcome_events() {
        for (index, result, field_name) in [
            (11, "assassin", "assassinatedBy"),
            (17, "bystander", "bystanderMarks"),
        ] {
            let mut state = fixture();
            state["gameState"]["phase"] = json!(SUDDEN_DEATH);
            state["gameState"]["tokensRemaining"] = json!(0);
            let history = state["gameState"]["history"].clone();
            let reveal = dispatch(
                &mut state,
                "player",
                json!({"type": "submitGuess", "cell": index}),
            );
            assert_eq!(state["gameState"]["phase"], GAME_OVER);
            assert!(state["gameState"]["winner"].is_null());
            assert_eq!(state["gameState"]["history"], history);
            assert_eq!(
                event_types(&reveal),
                [
                    "card_reveal",
                    "guess",
                    "game_over",
                    "game_outcome",
                    "turn_end"
                ]
            );
            assert_eq!(
                reveal.events[2],
                json!({"type": "game_over", "winner": result})
            );
            assert_eq!(
                reveal.events[3],
                json!({"type": "game_outcome", "outcome": "loss", "reason": result})
            );
            assert_eq!(
                reveal.events[4],
                json!({"type": "turn_end", "by": "counterpart", "reason": result, "correctGuesses": 0})
            );
            assert!(truthy(&state["gameState"]["cells"][index][field_name]));
            reject(
                &state,
                "player",
                json!({"type": "submitGuess", "cell": -1}),
                "Game is over",
            );
        }
        let mut state = fixture();
        state["gameState"]["phase"] = json!(SUDDEN_DEATH);
        let correct = dispatch(
            &mut state,
            "player",
            json!({"type": "submitGuess", "cell": 0}),
        );
        assert_eq!(correct.result["result"], "agent");
        assert_eq!(correct.result["turnEnded"], false);
        assert_eq!(event_types(&correct), ["card_reveal", "guess"]);
        reject(
            &state,
            "player",
            json!({"type": "submitGuess", "cell": 0}),
            "Cannot guess an already solved card",
        );
        reject(
            &state,
            "player",
            json!({"type": "endTurn"}),
            "Can only end turns during NORMAL phase",
        );
        state["gameState"]["key"][TEAM_A] = json!(vec![BYSTANDER; 25]);
        reject(
            &state,
            "player",
            json!({"type": "submitGuess", "cell": 10}),
            "This side cannot guess in sudden death",
        );

        for phase in [NORMAL, SUDDEN_DEATH] {
            let mut state = fixture();
            for index in 0..25 {
                if index != 12
                    && (state["gameState"]["key"][TEAM_A][index] == AGENT
                        || state["gameState"]["key"][TEAM_B][index] == AGENT)
                {
                    state["gameState"]["cells"][index]["solvedBy"] = json!(TEAM_A);
                }
            }
            if phase == NORMAL {
                give_clue(&mut state, "agent");
            } else {
                state["gameState"]["phase"] = json!(SUDDEN_DEATH);
            }
            let win = dispatch(
                &mut state,
                "player",
                json!({"type": "submitGuess", "cell": 12}),
            );
            assert_eq!(state["gameState"]["winner"], "TEAM");
            assert_eq!(
                event_types(&win),
                ["card_reveal", "guess", "game_over", "game_outcome"]
            );
            assert_eq!(
                win.events[3],
                json!({"type": "game_outcome", "outcome": "win", "reason": "team"})
            );
            assert_eq!(state["gameState"]["tokensRemaining"], 9);
            if phase == NORMAL {
                assert!(state["gameState"]["history"][0]["endedBy"].is_null());
            }
        }
        let mut normal = fixture();
        give_clue(&mut normal, "agent");
        let assassin = dispatch(
            &mut normal,
            "player",
            json!({"type": "submitGuess", "cell": 11}),
        );
        assert_eq!(
            assassin.events[4],
            json!({"type": "turn_end", "by": "counterpart", "reason": "assassin", "correctGuesses": 0})
        );
        assert!(normal["gameState"]["history"][0]["endedBy"].is_null());
        assert_eq!(normal["gameState"]["tokensRemaining"], 9);
    }

    #[test]
    fn codenames_agent_commands_and_tutorial_stage_resets() {
        assert!(agent_next_command(&initial_state()).is_none());
        let mut state = fixture();
        for locale in ["zh-CN", "ja", "en", "jp", ""] {
            state["settings"]["wordLocale"] = json!(locale);
            let command = agent_next_command(&state).unwrap();
            assert_eq!(command["type"], "submitClue");
            assert_eq!(command["clue"]["count"], 1);
            assert_eq!(agent_next_command(&state), Some(command.clone()));
            assert!(reduce(&state, "agent", &command).is_ok(), "{command}");
            assert!(!state["gameState"]["board"]
                .as_array()
                .unwrap()
                .iter()
                .any(|word| word["text"] == command["clue"]["word"]));
        }
        state["settings"]["wordLocale"] = Value::Null;
        assert!(agent_next_command(&state).is_some());
        state["gameState"]["whoseTurnToGive"] = json!(TEAM_A);
        assert!(agent_next_command(&state).is_none());
        give_clue(&mut state, "player");
        let first = agent_next_command(&state).unwrap()["cell"]
            .as_u64()
            .unwrap() as usize;
        state["gameState"]["cells"][first]["assassinatedBy"] = json!(TEAM_A);
        let next = agent_next_command(&state).unwrap();
        assert_ne!(next["cell"], first);
        let next_index = next["cell"].as_u64().unwrap() as usize;
        state["gameState"]["cells"][next_index]["bystanderMarks"] = json!([TEAM_B, null]);
        assert_ne!(agent_next_command(&state).unwrap()["cell"], next_index);
        state["gameState"]["history"][0]["guesses"] = json!([{"cell": first, "result": AGENT, "at": 0}, {"cell": next_index, "result": AGENT, "at": 0}]);
        assert_eq!(agent_next_command(&state), Some(json!({"type": "endTurn"})));

        let mut stage = fixture();
        give_clue(&mut stage, "agent");
        stage["tutorial"] = json!({"step": "load_monster_lesson"});
        stage["gameState"]["phase"] = json!(GAME_OVER);
        stage["gameState"]["winner"] = json!("TEAM");
        stage["gameState"]["cells"][12] = json!({"solvedBy": TEAM_A, "bystanderMarks": [TEAM_A, TEAM_B], "assassinatedBy": TEAM_B});
        stage["gameState"]["cells"][23]["assassinatedBy"] = json!(TEAM_A);
        agent(&mut stage, "tutorialLoadStage");
        assert_eq!(stage["gameState"]["phase"], NORMAL);
        assert!(stage["gameState"]["winner"].is_null());
        assert_eq!(stage["gameState"]["cells"][12], empty_cells()[12]);
        assert!(stage["gameState"]["cells"][23]["assassinatedBy"].is_null());
        assert_eq!(stage["gameState"]["history"][0]["endedBy"], "VOLUNTARY_END");
        assert_eq!(stage["gameState"]["whoseTurnToGive"], TEAM_B);
        stage["tutorial"] = json!({"step": "player_free_guessing"});
        give_clue(&mut stage, "agent");
        let early_over = dispatch(
            &mut stage,
            "player",
            json!({"type": "submitGuess", "cell": 23}),
        );
        assert_eq!(stage["tutorial"]["step"], "load_monster_lesson");
        assert_eq!(
            early_over.events.last().unwrap(),
            &json!({"type": "tutorial_step", "step": "player_free_guessing"})
        );
    }

    #[test]
    fn codenames_guesses_use_only_public_state_and_respect_count() {
        for count in [json!(1), json!(3), json!(0), json!("infinity")] {
            let mut state = fixture();
            state["settings"]["seed"] = json!(42);
            state["gameState"]["whoseTurnToGive"] = json!(TEAM_A);
            dispatch(
                &mut state,
                "player",
                json!({"type": "submitClue", "clue": {"word": "NORI", "count": count}}),
            );
            let mut changed_key = state.clone();
            changed_key["gameState"]["key"] =
                json!({"A": vec![ASSASSIN; 25], "B": vec![BYSTANDER; 25]});
            let mut no_key = state.clone();
            no_key["gameState"].as_object_mut().unwrap().remove("key");
            let limit = count.as_u64().filter(|count| *count > 0).unwrap_or(25) as usize;
            let mut guessed = HashSet::new();
            for _ in 0..limit {
                let command = agent_next_command(&state).unwrap();
                assert_eq!(command["type"], "submitGuess");
                assert_eq!(agent_next_command(&changed_key), Some(command.clone()));
                assert_eq!(agent_next_command(&no_key), Some(command.clone()));
                let index = command["cell"].as_u64().unwrap() as usize;
                assert!(guessed.insert(index));
                // Supply identical public results without consulting either key.
                for state in [&mut state, &mut changed_key, &mut no_key] {
                    state["gameState"]["cells"][index]["solvedBy"] = json!(TEAM_B);
                    state["gameState"]["history"][0]["guesses"]
                        .as_array_mut()
                        .unwrap()
                        .push(json!({"cell": index, "result": AGENT, "at": 0}));
                }
            }
            for state in [&state, &changed_key, &no_key] {
                assert_eq!(agent_next_command(state), Some(json!({"type": "endTurn"})));
            }
        }
        let mut state = fixture();
        state["gameState"]["phase"] = json!(SUDDEN_DEATH);
        let mut changed_key = state.clone();
        // Same per-side counts (eligibility), different card positions.
        for side in [TEAM_A, TEAM_B] {
            changed_key["gameState"]["key"][side]
                .as_array_mut()
                .unwrap()
                .reverse();
        }
        let command = agent_next_command(&state).unwrap();
        assert_eq!(command["type"], "submitGuess");
        assert_eq!(agent_next_command(&changed_key), Some(command));
        // Ineligible once the agent's own side has nothing left.
        for cell in state["gameState"]["cells"].as_array_mut().unwrap() {
            cell["solvedBy"] = json!(TEAM_B);
        }
        assert!(agent_next_command(&state).is_none());
    }

    #[test]
    fn codenames_malformed_restored_state_is_rejected() {
        let arbitrary = reduce(
            &initial_state(),
            "player",
            &json!({"type": "restore", "state": {}}),
        )
        .unwrap()
        .state;
        reject(
            &arbitrary,
            "player",
            json!({"type": "submitGuess", "cell": 0}),
            "Game not started",
        );
        let mut state = fixture();
        state["gameState"]["cells"] = json!([]);
        let error =
            reduce(&state, "player", &json!({"type": "submitGuess", "cell": 0})).unwrap_err();
        assert!(error.0.starts_with("Malformed codenames state:"));
        assert!(agent_next_command(&state).is_none());
        let mut state = fixture();
        give_clue(&mut state, "agent");
        state["gameState"]["history"][0]["guesses"] = json!({});
        assert!(
            reduce(&state, "player", &json!({"type": "submitGuess", "cell": 0}))
                .unwrap_err()
                .0
                .starts_with("Malformed codenames state:")
        );
        let mut state = fixture();
        state["gameState"]["key"][TEAM_A] = json!([]);
        state["gameState"]["key"][TEAM_B] = json!([]);
        give_clue_rejected_for_missing_targets(&state);
        reject(
            &state,
            "player",
            json!({"type": "submitClue"}),
            "clue must be an object",
        );
        reject(
            &initial_state(),
            "player",
            json!({}),
            "cmd.type is required",
        );
        assert!(
            reduce(&Value::Null, "player", &json!({"type": "startGame"}))
                .unwrap_err()
                .0
                .starts_with("Malformed codenames state:")
        );
        let restored = reduce(
            &Value::Null,
            "agent",
            &json!({"type": "restore", "state": initial_state()}),
        )
        .unwrap();
        assert_eq!(restored.state, initial_state());
    }

    fn give_clue_rejected_for_missing_targets(state: &Json) {
        reject(
            state,
            "agent",
            json!({"type": "submitClue", "clue": {"word": "NORI", "count": 1}}),
            "This side cannot give clues",
        );
    }
}

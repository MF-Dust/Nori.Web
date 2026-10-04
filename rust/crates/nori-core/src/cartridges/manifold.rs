//! Faithful reducer for the reachable, live-pack-aware branches of manifold.py.

use crate::cartridge::{CommandRejected, DispatchError, ReducerResult};
use crate::jsonutil::{hex_encode, now_ms, Json};
use crate::live_pack::LivePack;
use serde_json::{json, Map, Value};
use sha1::{Digest, Sha1};

const DEFAULT_FACTS: &[&str] = &[
    "system.repaired",
    "virus.cleared",
    "qfr.installed",
    "compute.initialized",
    "bounty.ext_installed",
    "mail.help.read",
    "boot.completed",
    "session.ready",
    "arg.cult_truth",
    "arg.gestures_complete",
    "gesture.chess",
    "gesture.codenames",
    "gesture.pictionary",
    "gesture.cakeduel",
    "arg.farewell.shown",
    "signal_daniel.unlocked",
    "daniel.deadman.delivered",
    "daniel.evidence_unlocked",
    "daniel.retraction.downloaded",
    "download.hanyue_consent",
    "futurum.doc1.downloaded",
    "futurum.doc2.downloaded",
    "futurum.doc3.downloaded",
    "corrupt.doc1.read",
    "corrupt.doc2.read",
    "corrupt.doc3.read",
    "dirt.daniel",
    "dirt.frank",
    "dirt.futurum_aleph_obs",
    "dirt.hanyue_ssh",
    "dirt.jack",
    "dirt.maggie",
    "file.seal_config.read",
    "file.tower_photo.read",
    "qfr.seal.released",
    "qfr.cult.released",
    "qfr.bounty.released",
    "qfr.gestures.released",
    "recover.seal_config",
    "recover.tower_photo",
    "recover.overclock_log",
];

/// Reducer fallback, distinct from the dispatcher's empty-world fallback (3).
pub const DEFAULT_CHIP_CAPACITY: i64 = 5;
/// Cooldown fallback used by the reducer, even when the archive advertises another interval.
pub const DEFAULT_CHIP_COOL_EVERY_MS: i64 = 300_000;

pub fn initial_state(full_unlock: bool, pack: &LivePack) -> Json {
    let mut facts = Map::new();
    let mut variables = Map::new();
    if full_unlock {
        for id in DEFAULT_FACTS {
            facts.insert((*id).into(), json!(true));
        }
        // Replacements retain the default's position, just like Python's dict unpacking.
        facts.extend(pack.facts());
        variables = pack.variables();
    }
    json!({"facts": facts, "variables": variables})
}

/// Production emitter identity derived from an already-coerced fact id; total for all strings.
pub fn derive_source(fact_id: &str) -> &'static str {
    if fact_id.starts_with("mail.") && fact_id.contains(".read") {
        "mail.read"
    } else if fact_id.starts_with("signal.") {
        if fact_id.contains("verify") {
            "signal.daniel.verify"
        } else if fact_id.ends_with(".login")
            || fact_id.contains("temp_password")
            || fact_id.contains("login")
        {
            "signal.login"
        } else if fact_id.ends_with(".read") {
            "signal.read"
        } else {
            "client.emitFact"
        }
    } else if fact_id.starts_with("recover.")
        || fact_id.contains("unseal")
        || fact_id.contains("seal_release")
    {
        "vault.unlock"
    } else if fact_id.starts_with("nas.") {
        if fact_id.contains("download") {
            "nas.download"
        } else {
            "nas.connect"
        }
    } else if fact_id.starts_with("idle.") {
        "idle.sync"
    } else {
        "client.emitFact"
    }
}

/// Build the archived record shape. Typed inputs make this total; truthy JSON sources are preserved verbatim.
pub fn fact_record(fact_id: &str, actor: &str, source: &Json, emitted_at: i64) -> Json {
    json!({"id": fact_id, "emittedAt": emitted_at, "actor": actor, "source": source})
}

/// Artifact hints for an already-coerced fact id; total for all strings. Empty means omit the hint.
pub fn affected_artifact_types(fact_id: &str) -> Vec<&'static str> {
    if fact_id.starts_with("mail.") {
        vec!["mail"]
    } else if fact_id.starts_with("file.") || fact_id.starts_with("recover.") {
        vec!["file"]
    } else if fact_id.starts_with("signal.") || fact_id.starts_with("signal_") {
        vec!["signal_thread", "signal_message"]
    } else {
        Vec::new()
    }
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

fn python_strip(text: &str) -> &str {
    text.trim_matches(|c: char| c.is_whitespace() || ('\u{1c}'..='\u{1f}').contains(&c))
}

// Unicode decimal blocks accepted by Python int(string), including mathematical digits.
fn decimal_digit(c: char) -> Option<u32> {
    const STARTS: &[u32] = &[
        0x30, 0x660, 0x6f0, 0x7c0, 0x966, 0x9e6, 0xa66, 0xae6, 0xb66, 0xbe6, 0xc66, 0xce6, 0xd66,
        0xde6, 0xe50, 0xed0, 0xf20, 0x1040, 0x1090, 0x17e0, 0x1810, 0x1946, 0x19d0, 0x1a80, 0x1a90,
        0x1b50, 0x1bb0, 0x1c40, 0x1c50, 0xa620, 0xa8d0, 0xa900, 0xa9d0, 0xa9f0, 0xaa50, 0xabf0,
        0xff10, 0x104a0, 0x10d30, 0x11066, 0x110f0, 0x11136, 0x111d0, 0x112f0, 0x11450, 0x114d0,
        0x11650, 0x116c0, 0x11730, 0x118e0, 0x11950, 0x11c50, 0x11d50, 0x11da0, 0x11f50, 0x16a60,
        0x16ac0, 0x16b50, 0x1d7ce, 0x1d7d8, 0x1d7e2, 0x1d7ec, 0x1d7f6, 0x1e140, 0x1e2f0, 0x1e4f0,
        0x1e950, 0x1fbf0,
    ];
    STARTS
        .iter()
        .find_map(|start| u32::from(c).checked_sub(*start).filter(|digit| *digit < 10))
}

// Like Python int(): booleans and numeric strings work, floats truncate toward zero.
// Conversion failures are runtime errors, not CommandRejected validation failures.
fn python_int(value: &Json) -> Result<i64, DispatchError> {
    match value {
        Value::Bool(value) => Ok(i64::from(*value)),
        Value::Number(value) => {
            if let Some(value) = value.as_i64() {
                return Ok(value);
            }
            if let Some(value) = value.as_u64() {
                return i64::try_from(value).map_err(|_| internal("Python integer exceeds i64"));
            }
            let Some(value) = value.as_f64() else {
                return Err(internal("invalid Python integer"));
            };
            let value = value.trunc();
            if value < i64::MIN as f64 || value >= -(i64::MIN as f64) {
                return Err(internal("Python integer exceeds i64"));
            }
            Ok(value as i64)
        }
        Value::String(value) => {
            let text: String = python_strip(value)
                .chars()
                .map(|c| {
                    decimal_digit(c)
                        .and_then(|digit| char::from_digit(digit, 10))
                        .unwrap_or(c)
                })
                .collect();
            // Python accepts underscores between decimal digits, but not consecutive/trailing ones.
            let bytes = text.as_bytes();
            if !bytes.iter().enumerate().all(|(i, c)| {
                *c != b'_'
                    || (i > 0
                        && i + 1 < bytes.len()
                        && bytes[i - 1].is_ascii_digit()
                        && bytes[i + 1].is_ascii_digit())
            }) {
                return Err(internal("invalid Python integer"));
            }
            text.replace('_', "")
                .parse()
                .map_err(|_| internal("invalid Python integer"))
        }
        _ => Err(internal("invalid Python integer")),
    }
}

fn python_repr(value: &Json) -> String {
    if let Value::String(text) = value {
        let quote = if text.contains('\'') && !text.contains('"') {
            '"'
        } else {
            '\''
        };
        let mut out = String::from(quote);
        for c in text.chars() {
            match c {
                '\\' => out.push_str("\\\\"),
                '\n' => out.push_str("\\n"),
                '\r' => out.push_str("\\r"),
                '\t' => out.push_str("\\t"),
                c if c == quote => {
                    out.push('\\');
                    out.push(c);
                }
                c if c.is_control() || c.escape_debug().to_string().starts_with("\\u{") => {
                    let code = u32::from(c);
                    out.push_str(&if code <= 0xff {
                        format!("\\x{code:02x}")
                    } else if code <= 0xffff {
                        format!("\\u{code:04x}")
                    } else {
                        format!("\\U{code:08x}")
                    });
                }
                c => out.push(c),
            }
        }
        out.push(quote);
        out
    } else {
        python_str(value)
    }
}

fn python_str(value: &Json) -> String {
    match value {
        Value::Null => "None".into(),
        Value::Bool(value) => if *value { "True" } else { "False" }.into(),
        Value::Number(value) if value.is_f64() => {
            let Some(number) = value.as_f64() else {
                return value.to_string();
            };
            let text = format!("{number:?}");
            if let Some((mantissa, exponent)) = text.split_once('e') {
                match exponent.parse::<i32>() {
                    Ok(exponent) => format!("{mantissa}e{exponent:+03}"),
                    Err(_) => text,
                }
            } else {
                text
            }
        }
        Value::Number(value) => value.to_string(),
        Value::String(value) => value.clone(),
        Value::Array(values) => format!(
            "[{}]",
            values
                .iter()
                .map(python_repr)
                .collect::<Vec<_>>()
                .join(", ")
        ),
        Value::Object(values) => format!(
            "{{{}}}",
            values
                .iter()
                .map(|(k, v)| { format!("{}: {}", python_repr(&json!(k)), python_repr(v)) })
                .collect::<Vec<_>>()
                .join(", ")
        ),
    }
}

fn text_or_empty(value: Option<&Json>) -> String {
    value
        .filter(|value| truthy(value))
        .map(python_str)
        .unwrap_or_default()
}

fn internal(message: &str) -> DispatchError {
    DispatchError::Internal(message.into())
}

fn int_or(value: Option<&Json>, fallback: i64) -> Result<i64, DispatchError> {
    match value.filter(|value| truthy(value)) {
        Some(value) => python_int(value),
        None => Ok(fallback),
    }
}

fn variables_of(state: &mut Json) -> Result<&mut Map<String, Json>, DispatchError> {
    let object = state
        .as_object_mut()
        .ok_or_else(|| internal("manifold state is not a dict"))?;
    object
        .entry("variables")
        .or_insert_with(|| json!({}))
        .as_object_mut()
        .ok_or_else(|| internal("manifold variables is not a dict"))
}

/// Ensure a chipConfig object. Malformed stored values return an internal dispatch error.
pub fn chip_config_of(
    variables: &mut Map<String, Json>,
) -> Result<&mut Map<String, Json>, DispatchError> {
    variables
        .entry("chipConfig")
        .or_insert_with(|| json!({}))
        .as_object_mut()
        .ok_or_else(|| internal("chipConfig is not a dict"))
}

/// Apply elapsed cooldown windows. `write=false` leaves stored heat/anchor unchanged.
/// Invalid chip data is reported as an internal dispatch error.
pub fn chip_cool(
    variables: &mut Map<String, Json>,
    write: bool,
) -> Result<Map<String, Json>, DispatchError> {
    try_chip_cool_at(variables, write, now_ms())
}

#[cfg(test)]
fn chip_cool_at(variables: &mut Map<String, Json>, write: bool, now: i64) -> Map<String, Json> {
    match try_chip_cool_at(variables, write, now) {
        Ok(chip) => chip,
        Err(_) => variables
            .get("chip")
            .and_then(Value::as_object)
            .cloned()
            .unwrap_or_default(),
    }
}

fn try_chip_cool_at(
    variables: &mut Map<String, Json>,
    write: bool,
    now: i64,
) -> Result<Map<String, Json>, DispatchError> {
    let cool_every = int_or(
        chip_config_of(variables)?.get("coolEveryMs"),
        DEFAULT_CHIP_COOL_EVERY_MS,
    )?;
    let chip = variables
        .entry("chip")
        .or_insert_with(|| json!({"heat": 0, "coolAnchorMs": now}))
        .as_object_mut()
        .ok_or_else(|| internal("chip is not a dict"))?;
    let anchor = int_or(chip.get("coolAnchorMs"), now)?;
    let heat = int_or(chip.get("heat"), 0)?;
    if cool_every == 0 {
        return Err(internal("coolEveryMs is zero"));
    }

    // i128 keeps the intermediate Python-integer arithmetic defined for all i64 inputs.
    let elapsed = i128::from(now) - i128::from(anchor);
    let interval = i128::from(cool_every);
    let mut windows = elapsed / interval;
    if elapsed % interval != 0 && (elapsed < 0) != (interval < 0) {
        windows -= 1;
    }
    windows = windows.max(0);
    if windows > 0 {
        let cooled = (i128::from(heat) - windows).max(0);
        if write && cooled != i128::from(heat) {
            let cooled =
                i64::try_from(cooled).map_err(|_| internal("Python integer exceeds i64"))?;
            let next_anchor = i128::from(anchor)
                .checked_add(
                    windows
                        .checked_mul(interval)
                        .ok_or_else(|| internal("Python integer exceeds i64"))?,
                )
                .ok_or_else(|| internal("Python integer exceeds i64"))?;
            let next_anchor =
                i64::try_from(next_anchor).map_err(|_| internal("Python integer exceeds i64"))?;
            chip.insert("heat".into(), json!(cooled));
            chip.insert("coolAnchorMs".into(), json!(next_anchor));
        } else if !write {
            let cooled =
                i64::try_from(cooled).map_err(|_| internal("Python integer exceeds i64"))?;
            let mut result = chip.clone();
            result.insert("heat".into(), json!(cooled));
            return Ok(result);
        }
    }
    Ok(chip.clone())
}

fn capacity_of(cfg: &Map<String, Json>, archived: Option<&Json>) -> Result<i64, DispatchError> {
    int_or(
        cfg.get("capacity")
            .filter(|value| truthy(value))
            .or_else(|| archived.and_then(|status| status.get("capacity"))),
        DEFAULT_CHIP_CAPACITY,
    )
}

fn try_chip_capacity(
    variables: &mut Map<String, Json>,
    pack: &LivePack,
) -> Result<i64, DispatchError> {
    let cfg = chip_config_of(variables)?;
    if cfg.get("neverOverheat").is_some_and(truthy) {
        return Ok(1_000_000_000);
    }
    capacity_of(cfg, pack.chip_status().as_ref())
}

/// Effective thermal limit; malformed values use the reducer fallback instead of panicking.
/// `neverOverheat` raises only the effective limit, not status snapshot capacity.
pub fn chip_capacity(variables: &mut Map<String, Json>, pack: &LivePack) -> i64 {
    match try_chip_capacity(variables, pack) {
        Ok(capacity) => capacity,
        Err(_) => DEFAULT_CHIP_CAPACITY,
    }
}

fn try_chip_status_snapshot(
    variables: &Map<String, Json>,
    pack: &LivePack,
) -> Result<Map<String, Json>, DispatchError> {
    let mut live_vars = variables.clone();
    let cfg = chip_config_of(&mut live_vars)?.clone();
    let chip = try_chip_cool_at(&mut live_vars, false, now_ms())?;
    let archived = pack.chip_status();
    let cool_every = int_or(
        cfg.get("coolEveryMs")
            .filter(|value| truthy(value))
            .or_else(|| {
                archived
                    .as_ref()
                    .and_then(|status| status.get("coolEveryMs"))
            }),
        DEFAULT_CHIP_COOL_EVERY_MS,
    )?;
    Ok(serde_json::Map::from_iter([
        (
            "capacity".into(),
            json!(capacity_of(&cfg, archived.as_ref())?),
        ),
        ("heat".into(), json!(int_or(chip.get("heat"), 0)?)),
        ("coolEveryMs".into(), json!(cool_every)),
        (
            "scanCount".into(),
            json!(variables
                .get("chipScans")
                .and_then(Value::as_array)
                .map(Vec::len)
                .unwrap_or(0)),
        ),
        ("serverNowMs".into(), json!(now_ms())),
    ]))
}

fn default_status_snapshot(variables: &Map<String, Json>) -> Map<String, Json> {
    serde_json::Map::from_iter([
        ("capacity".into(), json!(DEFAULT_CHIP_CAPACITY)),
        ("heat".into(), json!(0)),
        ("coolEveryMs".into(), json!(DEFAULT_CHIP_COOL_EVERY_MS)),
        (
            "scanCount".into(),
            json!(variables
                .get("chipScans")
                .and_then(Value::as_array)
                .map(Vec::len)
                .unwrap_or(0)),
        ),
        ("serverNowMs".into(), json!(now_ms())),
    ])
}

/// Read-only status; malformed chip data falls back to safe default status values.
pub fn chip_status_snapshot(variables: &Map<String, Json>, pack: &LivePack) -> Json {
    match try_chip_status_snapshot(variables, pack) {
        Ok(status) => Value::Object(status),
        Err(_) => Value::Object(default_status_snapshot(variables)),
    }
}

fn status_event(variables: &Map<String, Json>, pack: &LivePack) -> Result<Json, DispatchError> {
    let mut event = try_chip_status_snapshot(variables, pack)?;
    event.insert("type".into(), json!("chip.status.changed"));
    Ok(Value::Object(event))
}

fn sha_row(seed: &str) -> String {
    hex_encode(&Sha1::digest(seed.as_bytes()))
        .chars()
        .take(16)
        .collect()
}

fn app_prefix(app_id: &str) -> Option<&'static str> {
    match app_id {
        "browser" => Some("page"),
        "files" => Some("file"),
        "mail" => Some("mail"),
        "messenger" | "signal" => Some("signal"),
        "terminal" | "idle" | "settings" | "system" | "debug" => Some("app"),
        _ => None,
    }
}

fn resolve_scan_key(cmd: &Json) -> String {
    if let Some(key) = cmd
        .get("key")
        .and_then(Value::as_str)
        .map(python_strip)
        .filter(|key| !key.is_empty())
    {
        return key.into();
    }
    let app_id = text_or_empty(cmd.get("appId"));
    let app_id = python_strip(&app_id).to_lowercase();
    let content = text_or_empty(cmd.get("contentKey"));
    let content = python_strip(&content);
    // windowType is intentionally not consulted by the Python reducer.
    if !content.is_empty() {
        if content.contains(':') {
            return content.into();
        }
        return format!(
            "{}:{content}",
            app_prefix(&app_id).unwrap_or(if app_id.is_empty() { "app" } else { &app_id })
        );
    }
    if cmd.get("appId").is_some_and(truthy) {
        let legacy_app = cmd
            .get("appId")
            .map(python_str)
            .unwrap_or_default()
            .to_lowercase();
        return format!("{}:self", app_prefix(&legacy_app).unwrap_or("app"));
    }
    "unknown".into()
}

pub fn reduce(
    state: &Json,
    actor: &str,
    cmd: &Json,
    pack: &LivePack,
) -> Result<ReducerResult, DispatchError> {
    let mut cmd = cmd.clone();
    let mut command_type = cmd
        .get("type")
        .and_then(Value::as_str)
        .unwrap_or("")
        .to_string();
    if command_type == "idle.complete" {
        if let Some(object) = cmd.as_object_mut() {
            object.insert("type".into(), json!("client.emitFact"));
            object.insert("factId".into(), json!("idle.manifold_complete"));
            object.insert("source".into(), json!("idle.complete"));
        }
        command_type = "client.emitFact".into();
    }
    // Validate the entire batch before cloning or emitting any fact.
    let fact_ids: Vec<&str> = if command_type == "client.emitFacts" {
        let ids = cmd
            .get("factIds")
            .and_then(Value::as_array)
            .filter(|ids| {
                ids.len() <= 1024
                    && ids.iter().all(|id| {
                        id.as_str()
                            .is_some_and(|id| !id.is_empty() && id.chars().count() <= 256)
                    })
            })
            .ok_or_else(|| {
                CommandRejected::new(
                    "facts must contain at most 1024 non-empty strings of at most 256 characters",
                )
            })?;
        ids.iter().filter_map(Value::as_str).collect()
    } else {
        cmd.get("factId")
            .and_then(Value::as_str)
            .into_iter()
            .collect()
    };
    let mut state = state.clone();
    let mut events = Vec::new();

    match command_type.as_str() {
        "client.emitFact" | "client.emitFacts" => {
            let mut emitted = 0;
            for fact_id in fact_ids {
                if fact_id.is_empty() {
                    continue;
                }
                let facts = state
                    .as_object_mut()
                    .and_then(|object| object.get_mut("facts"))
                    .and_then(Value::as_object_mut)
                    .ok_or_else(|| internal("manifold facts is not a dict"))?;
                if facts.get(fact_id).is_some_and(truthy) {
                    continue;
                }
                let source = cmd
                    .get("source")
                    .filter(|value| truthy(value))
                    .cloned()
                    .unwrap_or_else(|| json!(derive_source(fact_id)));
                let at = match cmd.get("emittedAt").filter(|value| truthy(value)) {
                    Some(value) => python_int(value)?,
                    None => now_ms(),
                };
                facts.insert(fact_id.into(), fact_record(fact_id, actor, &source, at));
                emitted += 1;
                events.push(json!({"type": "factEmitted", "factId": fact_id, "source": source}));
                let mut changed_event = json!({"type": "manifold.facts.changed", "emitted": [fact_id], "retracted": [], "snapshot": {fact_id: true}});
                let changed = affected_artifact_types(fact_id);
                if !changed.is_empty() {
                    if let Some(object) = changed_event.as_object_mut() {
                        object.insert("changedArtifactTypes".into(), json!(changed));
                    }
                }
                events.push(changed_event);
            }
            let result = if command_type == "client.emitFacts" {
                json!({"ok": true, "count": emitted})
            } else {
                json!({"ok": true})
            };
            return Ok(ReducerResult::new(state, result, events));
        }
        "chip.scan" => {
            let variables = variables_of(&mut state)?;
            let capacity = try_chip_capacity(variables, pack)?;
            try_chip_cool_at(variables, true, now_ms())?;
            let heat = variables
                .get("chip")
                .and_then(Value::as_object)
                .ok_or_else(|| internal("chip is not a dict"))?
                .get("heat");
            let heat = int_or(heat, 0)?;
            let scans = variables
                .entry("chipScans")
                .or_insert_with(|| json!([]))
                .as_array()
                .ok_or_else(|| internal("chipScans is not a list"))?;
            let scan_count = scans.len();
            let mut known_full = Map::new();
            for entry in scans.iter().filter(|entry| entry.is_object()) {
                if let Some(key) = entry.get("key").and_then(Value::as_str) {
                    known_full.insert(key.into(), entry.clone());
                }
            }
            let raw_key = resolve_scan_key(&cmd);
            let tail = raw_key
                .split_once(':')
                .map(|(_, tail)| tail)
                .unwrap_or(&raw_key);
            // Iterate the exact-key dict, not scans: overwriting an exact key keeps its insertion position.
            let entry = known_full.get(&raw_key).or_else(|| {
                known_full
                    .iter()
                    .rfind(|(key, _)| {
                        key.split_once(':').map(|(_, tail)| tail).unwrap_or(key) == tail
                    })
                    .map(|(_, entry)| entry)
            });
            let result = if let Some(entry) = entry {
                let key = entry
                    .get("key")
                    .map(python_str)
                    .unwrap_or_else(|| "None".into());
                let row = entry
                    .get("row")
                    .map(python_str)
                    .unwrap_or_else(|| "None".into());
                json!({"kind": "readout", "text": format!("Archived scan replay — key={key}, row={row}")})
            } else if heat >= capacity {
                json!({"kind": "fried", "text": format!("[{raw_key}] chip thermal lock — heat {heat}/{capacity}; wait for cooldown")})
            } else {
                let row = sha_row(&format!("{raw_key}@{scan_count}"));
                let next_heat = heat
                    .checked_add(1)
                    .ok_or_else(|| internal("Python integer exceeds i64"))?;
                let scans = variables
                    .get_mut("chipScans")
                    .and_then(Value::as_array_mut)
                    .ok_or_else(|| internal("chipScans is not a list"))?;
                scans.push(json!({"key": raw_key, "row": row}));
                let chip = variables
                    .get_mut("chip")
                    .and_then(Value::as_object_mut)
                    .ok_or_else(|| internal("chip is not a dict"))?;
                chip.insert("heat".into(), json!(next_heat));
                json!({"kind": "readout", "text": format!("Fresh readout logged — key={raw_key}, row={row}")})
            };
            events.push(status_event(variables, pack)?);
            return Ok(ReducerResult::new(state, result, events));
        }
        "chip.debugScan" => {
            let key = text_or_empty(
                cmd.get("contentKey")
                    .filter(|value| truthy(value))
                    .or_else(|| cmd.get("key")),
            );
            let key = python_strip(&key);
            let readout = text_or_empty(cmd.get("readout"));
            let readout = python_strip(&readout);
            let variables = variables_of(&mut state)?;
            let scans = variables.entry("chipScans").or_insert_with(|| json!([]));
            if !key.is_empty() {
                let scans = scans
                    .as_array_mut()
                    .ok_or_else(|| internal("chipScans is not a list"))?;
                if !scans.iter().any(|entry| {
                    entry.is_object() && entry.get("key").and_then(Value::as_str) == Some(key)
                }) {
                    let title: String = text_or_empty(cmd.get("title")).chars().take(80).collect();
                    scans.push(json!({"key": key, "row": sha_row(&format!("{key}|{readout}")), "title": title}));
                    events.push(status_event(variables, pack)?);
                }
            }
        }
        "chip.debugReset" => {
            let variables = variables_of(&mut state)?;
            variables.insert("chip".into(), json!({"heat": 0, "coolAnchorMs": now_ms()}));
            variables.insert("chipScans".into(), json!([]));
            events.push(status_event(variables, pack)?);
        }
        "chip.debugConfig" => {
            let variables = variables_of(&mut state)?;
            let cfg = chip_config_of(variables)?;
            for key in ["capacity", "coolEveryMs", "heat", "neverOverheat"] {
                if let Some(value) = cmd.get(key) {
                    cfg.insert(key.into(), value.clone());
                }
            }
            // The reachable Python branch returns only {ok: True}, with no event.
        }
        "patchVariables" | "system.patchVariables" => {
            let patch = cmd
                .get("variablesPatch")
                .filter(|value| truthy(value))
                .or_else(|| cmd.get("patch").filter(|value| truthy(value)))
                .and_then(Value::as_object);
            if let Some(patch) = patch.filter(|patch| !patch.is_empty()) {
                variables_of(&mut state)?.extend(patch.clone());
                let mut keys: Vec<&String> = patch.keys().collect();
                keys.sort();
                events.push(json!({"type": "variablesPatched", "keys": keys}));
            }
        }
        "idle.sync" => {
            let Some(command) = cmd.as_object() else {
                return Err(internal("command is not a dict"));
            };
            let payload: Map<String, Json> = command
                .iter()
                .filter(|(key, _)| key.as_str() != "type" && key.as_str() != "requestId")
                .map(|(key, value)| (key.clone(), value.clone()))
                .collect();
            if !payload.is_empty() {
                let variables = variables_of(&mut state)?;
                let mut merged = variables
                    .get("idle")
                    .and_then(Value::as_object)
                    .cloned()
                    .unwrap_or_default();
                merged.extend(
                    payload
                        .into_iter()
                        .filter(|(key, _)| key != "prestige" && key != "readIdlePrestige"),
                );
                merged.insert("lastSyncMs".into(), json!(now_ms()));
                variables.insert("idle".into(), Value::Object(merged));
                events.push(json!({"type": "idleSynced"}));
            }
            let prestige = cmd
                .get("prestige")
                .filter(|value| truthy(value))
                .cloned()
                .unwrap_or_else(|| json!({}));
            return Ok(ReducerResult::new(
                state,
                json!({"ok": true, "prestige": prestige}),
                events,
            ));
        }
        "system.setState" => {
            if let Some(next) = cmd.get("state").filter(|state| state.is_object()) {
                state = next.clone();
            }
        }
        _ => {}
    }
    Ok(ReducerResult::new(state, json!({"ok": true}), events))
}

pub fn has_fact(state: &Json, fact_id: &str) -> bool {
    state
        .get("facts")
        .and_then(|facts| facts.get(fact_id))
        .is_some_and(truthy)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::cartridge::{Cartridge, DispatchError};
    use std::sync::OnceLock;

    fn packs() -> [&'static LivePack; 2] {
        static EMPTY: OnceLock<LivePack> = OnceLock::new();
        static REAL: OnceLock<LivePack> = OnceLock::new();
        [
            EMPTY.get_or_init(LivePack::empty),
            REAL.get_or_init(|| {
                LivePack::from_value(
                    serde_json::from_str(
                        &std::fs::read_to_string(concat!(
                            env!("CARGO_MANIFEST_DIR"),
                            "/../../../backend/data/live_world_pack.json"
                        ))
                        .unwrap(),
                    )
                    .unwrap(),
                )
            }),
        ]
    }

    fn run(state: &Json, cmd: Json, pack: &LivePack) -> ReducerResult {
        reduce(state, "player", &cmd, pack).unwrap()
    }

    fn assert_status_event(event: &Json, heat: i64, capacity: i64, scan_count: usize) {
        assert_eq!(event["type"], "chip.status.changed");
        assert_eq!(event["heat"], heat);
        assert_eq!(event["capacity"], capacity);
        assert_eq!(event["scanCount"], scan_count);
        assert!(event["coolEveryMs"].is_i64());
        assert!(event["serverNowMs"].is_i64());
        assert_eq!(event.as_object().unwrap().len(), 6);
    }

    #[test]
    fn initial_state_preserves_defaults_and_archive() {
        for pack in packs() {
            let state = initial_state(true, pack);
            for id in DEFAULT_FACTS {
                assert!(has_fact(&state, id), "{id}");
                assert_eq!(
                    state["facts"][*id],
                    pack.facts().get(*id).cloned().unwrap_or(json!(true))
                );
            }
            for (id, record) in pack.facts() {
                assert_eq!(state["facts"][&id], record);
            }
            assert_eq!(state["variables"], Value::Object(pack.variables()));
            assert_eq!(
                initial_state(false, pack),
                json!({"facts": {}, "variables": {}})
            );
        }
        let pack = LivePack::from_value(
            json!({"facts": {"system.repaired": false, "custom": {"id": "custom", "emittedAt": 12, "actor": "a", "source": "s"}}, "variables": {"nested": {"v": 1}}}),
        );
        let mut state = initial_state(true, &pack);
        assert_eq!(state["facts"]["system.repaired"], false);
        assert_eq!(
            state["facts"].as_object().unwrap().keys().next().unwrap(),
            "system.repaired"
        );
        assert_eq!(
            state["facts"]
                .as_object()
                .unwrap()
                .keys()
                .next_back()
                .unwrap(),
            "custom"
        );
        state["variables"]["nested"]["v"] = json!(2);
        assert_eq!(pack.variables()["nested"]["v"], 1);
    }

    #[test]
    fn fact_records_and_idempotence() {
        for pack in packs() {
            let mut cart = Cartridge::new("manifold.web", initial_state(true, pack));
            let before = now_ms();
            let cmd = json!({"type": "client.emitFact", "factId": "mail.test.read"});
            let commit = cart.dispatch("player", &cmd, pack).unwrap();
            assert!(commit.committed);
            assert_eq!(commit.result, json!({"ok": true}));
            let record = cart.state["facts"]["mail.test.read"].clone();
            assert_eq!(record["id"], "mail.test.read");
            assert_eq!(record["actor"], "player");
            assert_eq!(record["source"], "mail.read");
            assert!(record["emittedAt"]
                .as_i64()
                .is_some_and(|at| before <= at && at <= now_ms()));
            assert_eq!(
                record
                    .as_object()
                    .unwrap()
                    .keys()
                    .map(String::as_str)
                    .collect::<Vec<_>>(),
                ["id", "emittedAt", "actor", "source"]
            );
            assert_eq!(
                commit.transition.unwrap()["events"][0]["type"],
                "factEmitted"
            );
            let head = cart.head_version;
            assert!(!cart.dispatch("agent", &cmd, pack).unwrap().committed);
            assert_eq!(cart.head_version, head);
            assert_eq!(cart.state["facts"]["mail.test.read"], record);
            cart.dispatch(
                "player",
                &json!({"type": "client.emitFact", "factId": "arg.misc.flag"}),
                pack,
            )
            .unwrap();
            assert_eq!(
                cart.state["facts"]["arg.misc.flag"]["source"],
                "client.emitFact"
            );
        }
    }

    #[test]
    fn derive_source_table() {
        for (id, source) in [
            ("mail.foo.read", "mail.read"),
            ("mail.foo.read.later", "mail.read"),
            ("mail.foo", "client.emitFact"),
            ("signal.daniel.verify", "signal.daniel.verify"),
            ("signal.verify.login", "signal.daniel.verify"),
            ("signal.login.ok", "signal.login"),
            ("signal.x.temp_password", "signal.login"),
            ("signal.spam_prize.read", "signal.read"),
            ("signal.foo", "client.emitFact"),
            ("recover.seal_config", "vault.unlock"),
            ("qfr.unseal", "vault.unlock"),
            ("arg.seal_release", "vault.unlock"),
            ("nas.download.datasea", "nas.download"),
            ("nas.host", "nas.connect"),
            ("idle.complete", "idle.sync"),
            ("signal_daniel.unlocked", "client.emitFact"),
            ("random.flag", "client.emitFact"),
            ("", "client.emitFact"),
        ] {
            assert_eq!(derive_source(id), source, "{id}");
        }
    }

    #[test]
    fn changed_artifact_types_table() {
        for pack in packs() {
            for (id, hints) in [
                ("mail.pr_probe.unlocked", vec!["mail"]),
                ("file.pr_probe.read", vec!["file"]),
                ("recover.pr_probe", vec!["file"]),
                (
                    "signal.pr_probe.read",
                    vec!["signal_thread", "signal_message"],
                ),
                (
                    "signal_pr_probe.unlocked",
                    vec!["signal_thread", "signal_message"],
                ),
                ("arg.pr_probe", vec![]),
            ] {
                let result = run(
                    &initial_state(true, pack),
                    json!({"type": "client.emitFact", "factId": id}),
                    pack,
                );
                assert_eq!(result.events.len(), 2);
                assert_eq!(
                    result.events[0],
                    json!({"type": "factEmitted", "factId": id, "source": derive_source(id)})
                );
                let mut expected = json!({"type": "manifold.facts.changed", "emitted": [id], "retracted": [], "snapshot": {id: true}});
                if !hints.is_empty() {
                    expected["changedArtifactTypes"] = json!(hints);
                }
                assert_eq!(result.events[1], expected);
                assert_eq!(affected_artifact_types(id), hints);
            }
        }
    }

    #[test]
    fn fact_emission_falsey_existing_values_and_literal_ids() {
        let pack = LivePack::empty();
        for existing in [
            Value::Null,
            json!(false),
            json!(0),
            json!(0.0),
            json!(""),
            json!([]),
            json!({}),
        ] {
            let state = json!({"facts": {"custom/path~fact": existing}, "variables": {}});
            assert!(!has_fact(&state, "custom/path~fact"));
            let result = run(
                &state,
                json!({"type": "client.emitFact", "factId": "custom/path~fact"}),
                &pack,
            );
            assert_eq!(result.events.len(), 2);
            assert!(has_fact(&result.state, "custom/path~fact"));
            assert_eq!(
                result.state["facts"]["custom/path~fact"]["id"],
                "custom/path~fact"
            );
            assert_eq!(result.events[1]["snapshot"]["custom/path~fact"], true);
        }
        for existing in [
            json!(true),
            json!(1),
            json!("yes"),
            json!([false]),
            json!({"source": "s"}),
        ] {
            let state = json!({"facts": {"f": existing}, "variables": {}});
            let result = run(
                &state,
                json!({"type": "client.emitFact", "factId": "f"}),
                &pack,
            );
            assert_eq!(result.state, state);
            assert!(result.events.is_empty());
        }
    }

    #[test]
    fn fact_source_and_timestamp_coercion() {
        let pack = LivePack::empty();
        let state = initial_state(false, &pack);
        for source in [
            json!("custom"),
            json!(true),
            json!(8),
            json!(["emitter"]),
            json!({"emitter": "x"}),
        ] {
            let result = run(
                &state,
                json!({"type": "client.emitFact", "factId": "mail.probe.read", "source": source, "emittedAt": " 1_234 "}),
                &pack,
            );
            assert_eq!(
                result.state["facts"]["mail.probe.read"],
                fact_record("mail.probe.read", "player", &source, 1234)
            );
            assert_eq!(result.events[0]["source"], source);
        }
        for (input, expected) in [
            (json!(true), 1),
            (json!(42.9), 42),
            (json!(-42.9), -42),
            (json!("+123"), 123),
            (json!(" ١_٢٣٤ "), 1234),
            (json!("１２３"), 123),
        ] {
            let result = run(
                &state,
                json!({"type": "client.emitFact", "factId": "f", "emittedAt": input}),
                &pack,
            );
            assert_eq!(result.state["facts"]["f"]["emittedAt"], expected);
        }
        for falsey in [
            Value::Null,
            json!(false),
            json!(0),
            json!(""),
            json!([]),
            json!({}),
        ] {
            let before = now_ms();
            let result = run(
                &state,
                json!({"type": "client.emitFact", "factId": "mail.probe.read", "source": falsey, "emittedAt": falsey}),
                &pack,
            );
            let record = &result.state["facts"]["mail.probe.read"];
            assert_eq!(record["source"], "mail.read");
            assert!(record["emittedAt"]
                .as_i64()
                .is_some_and(|at| before <= at && at <= now_ms()));
        }
    }

    #[test]
    fn chip_payload_string_coercion_matches_python() {
        for (value, expected) in [
            (json!(1e20), "1e+20"),
            (json!(1e-5), "1e-05"),
            (json!(1e-4), "0.0001"),
            (json!(1e16), "1e+16"),
            (json!(1.0), "1.0"),
            (json!(-0.0), "-0.0"),
            (
                json!({"x": true, "y": ["\u{200b}", "\u{00a0}", "a\nb", "don't"]}),
                "{'x': True, 'y': ['\\u200b', '\\xa0', 'a\\nb', \"don't\"]}",
            ),
        ] {
            assert_eq!(python_str(&value), expected);
        }
    }

    #[test]
    fn single_fact_is_permissive_and_idle_complete_is_an_alias() {
        let pack = LivePack::empty();
        let state = initial_state(false, &pack);
        for cmd in [
            json!({"type": "client.emitFact"}),
            json!({"type": "client.emitFact", "factId": 123}),
            json!({"type": "client.emitFact", "factId": ""}),
        ] {
            let result = run(&state, cmd, &pack);
            assert_eq!(result.state, state);
            assert!(result.events.is_empty());
        }
        let id = "长".repeat(257);
        assert_eq!(
            run(
                &state,
                json!({"type": "client.emitFact", "factId": id}),
                &pack
            )
            .events
            .len(),
            2
        );
        let result = run(
            &state,
            json!({"type": "idle.complete", "source": "ignored", "factId": "ignored", "emittedAt": 42}),
            &pack,
        );
        assert_eq!(
            result.state["facts"]["idle.manifold_complete"],
            fact_record(
                "idle.manifold_complete",
                "player",
                &json!("idle.complete"),
                42
            )
        );
        assert_eq!(result.result, json!({"ok": true}));
    }

    #[test]
    fn fact_batch_is_one_commit_and_rejects_atomically() {
        for pack in packs() {
            let mut cart = Cartridge::new("manifold.web", initial_state(true, pack));
            let facts: Vec<String> = (0..100)
                .map(|index| format!("batch.probe.{index}"))
                .collect();
            let mut ids = facts.clone();
            ids.push(facts[0].clone());
            let cmd = json!({"type": "client.emitFacts", "factIds": ids});
            let commit = cart.dispatch("player", &cmd, pack).unwrap();
            assert!(commit.committed);
            assert_eq!(commit.result, json!({"ok": true, "count": 100}));
            assert_eq!(cart.head_version, 1);
            let transition = commit.transition.unwrap();
            let events = transition["events"].as_array().unwrap();
            assert_eq!(events.len(), 200);
            assert_eq!(
                events
                    .iter()
                    .filter(|e| e["type"] == "factEmitted")
                    .map(|e| e["factId"].as_str().unwrap())
                    .collect::<Vec<_>>(),
                facts.iter().map(String::as_str).collect::<Vec<_>>()
            );
            assert_eq!(
                transition["patches"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .filter(|p| p["path"] == "/facts")
                    .count(),
                1
            );
            for fact in &facts {
                assert_eq!(cart.state["facts"][fact]["id"], *fact);
            }
            let repeated = cart.dispatch("player", &cmd, pack).unwrap();
            assert!(!repeated.committed);
            assert_eq!(repeated.result, json!({"ok": true, "count": 0}));
            let before = cart.state.clone();
            for invalid in [
                json!(["would.mutate", 1]),
                json!(vec!["x"; 1025]),
                json!(["x".repeat(257)]),
                json!([""]),
                json!(["长".repeat(257)]),
                json!("not-a-list"),
                Value::Null,
                json!({}),
                json!(false),
            ] {
                let error = cart
                    .dispatch(
                        "player",
                        &json!({"type": "client.emitFacts", "factIds": invalid}),
                        pack,
                    )
                    .unwrap_err();
                assert_eq!(error, DispatchError::Rejected("facts must contain at most 1024 non-empty strings of at most 256 characters".into()));
                assert_eq!(cart.state, before);
                assert_eq!(cart.head_version, 1);
            }
            assert!(cart
                .dispatch("player", &json!({"type": "client.emitFacts"}), pack)
                .is_err());
            assert_eq!(cart.state, before);
        }
    }

    #[test]
    fn fact_batch_limits_count_characters_and_accept_boundary() {
        let pack = LivePack::empty();
        let id = "😀".repeat(256);
        let result = run(
            &initial_state(false, &pack),
            json!({"type": "client.emitFacts", "factIds": [id]}),
            &pack,
        );
        assert_eq!(result.result, json!({"ok": true, "count": 1}));
        let ids: Vec<String> = (0..1024).map(|i| format!("f.{i}")).collect();
        let result = run(
            &initial_state(false, &pack),
            json!({"type": "client.emitFacts", "factIds": ids}),
            &pack,
        );
        assert_eq!(result.result, json!({"ok": true, "count": 1024}));
        let result = run(
            &result.state,
            json!({"type": "client.emitFacts", "factIds": []}),
            &pack,
        );
        assert_eq!(result.result, json!({"ok": true, "count": 0}));
        assert!(result.events.is_empty());
    }

    #[test]
    fn patch_variables_merges_and_emits_sorted_keys() {
        for pack in packs() {
            for name in ["patchVariables", "system.patchVariables"] {
                let state = initial_state(true, pack);
                let result = run(
                    &state,
                    json!({"type": name, "variablesPatch": {"z": [1], "k": "v"}}),
                    pack,
                );
                assert_eq!(result.state["variables"]["k"], "v");
                assert_eq!(result.state["variables"]["z"], json!([1]));
                assert_eq!(
                    result.events,
                    vec![json!({"type": "variablesPatched", "keys": ["k", "z"]})]
                );
                assert_eq!(result.result, json!({"ok": true}));
            }
        }
        let pack = LivePack::empty();
        let state = json!({"facts": {}, "variables": {"nested": {"old": 1}}});
        let result = run(
            &state,
            json!({"type": "patchVariables", "variablesPatch": {}, "patch": {"nested": {"new": 2}}}),
            &pack,
        );
        assert_eq!(result.state["variables"]["nested"], json!({"new": 2}));
        let result = run(
            &state,
            json!({"type": "patchVariables", "variablesPatch": [1], "patch": {"k": "ignored"}}),
            &pack,
        );
        assert_eq!(result.state, state);
        assert!(result.events.is_empty());
    }

    #[test]
    fn idle_sync_only_mutates_with_payload() {
        for pack in packs() {
            let state = initial_state(true, pack);
            let result = run(&state, json!({"type": "idle.sync", "requestId": "r"}), pack);
            assert_eq!(result.state, state);
            assert_eq!(result.result, json!({"ok": true, "prestige": {}}));
            assert!(result.events.is_empty());
            let before = now_ms();
            let result = run(
                &state,
                json!({"type": "idle.sync", "requestId": "r", "prestige": {"maxCompute": 42}, "shardsLocal": 7, "readIdlePrestige": true}),
                pack,
            );
            assert_eq!(
                result.result,
                json!({"ok": true, "prestige": {"maxCompute": 42}})
            );
            assert_eq!(result.events, vec![json!({"type": "idleSynced"})]);
            let idle = &result.state["variables"]["idle"];
            assert_eq!(idle["shardsLocal"], 7);
            assert!(idle["lastSyncMs"]
                .as_i64()
                .is_some_and(|at| before <= at && at <= now_ms()));
            for excluded in ["type", "requestId", "prestige", "readIdlePrestige"] {
                assert!(idle.get(excluded).is_none());
            }
        }
        let pack = LivePack::empty();
        let state = json!({"facts": {}, "variables": {"idle": 7}});
        let result = run(&state, json!({"type": "idle.sync", "compute": 12}), &pack);
        assert_eq!(
            result.state["variables"]["idle"].as_object().unwrap().len(),
            2
        );
        for prestige in [
            Value::Null,
            json!(false),
            json!(0),
            json!(""),
            json!([]),
            json!({}),
        ] {
            let result = run(
                &state,
                json!({"type": "idle.sync", "prestige": prestige}),
                &pack,
            );
            assert_eq!(result.result["prestige"], json!({}));
            assert_eq!(result.events, vec![json!({"type": "idleSynced"})]);
        }
        assert_eq!(
            run(&state, json!({"type": "idle.sync", "prestige": 1}), &pack).result["prestige"],
            1
        );
    }

    #[test]
    fn chip_capacity_and_status_archive_fallbacks() {
        for pack in packs() {
            let mut variables = initial_state(true, pack)["variables"]
                .as_object()
                .unwrap()
                .clone();
            let before = variables.clone();
            let status = chip_status_snapshot(&variables, pack);
            assert_eq!(variables, before);
            assert!(status["capacity"].as_i64().unwrap() >= 3);
            assert_eq!(chip_capacity(&mut variables, pack), status["capacity"]);
        }
        let pack =
            LivePack::from_value(json!({"chip_status": {"capacity": 7, "coolEveryMs": 1234}}));
        let mut variables = json!({"chipConfig": {"capacity": 0, "coolEveryMs": 0}})
            .as_object()
            .unwrap()
            .clone();
        assert_eq!(chip_capacity(&mut variables, &pack), 7);
        assert_eq!(chip_status_snapshot(&variables, &pack)["coolEveryMs"], 1234);
        variables["chipConfig"]["capacity"] = json!("9");
        assert_eq!(chip_capacity(&mut variables, &pack), 9);
        variables["chipConfig"]["neverOverheat"] = json!(true);
        assert_eq!(chip_capacity(&mut variables, &pack), 1_000_000_000);
        assert_eq!(chip_status_snapshot(&variables, &pack)["capacity"], 9);
    }

    #[test]
    fn chip_cool_write_and_read_semantics() {
        let state = json!({"chipConfig": {"coolEveryMs": 1000}, "chip": {"heat": 3, "coolAnchorMs": 1_000_000, "extra": true}});
        let mut variables = state.as_object().unwrap().clone();
        let chip = chip_cool_at(&mut variables, false, 1_002_500);
        assert_eq!(chip["heat"], 1);
        assert_eq!(chip["coolAnchorMs"], 1_000_000);
        assert_eq!(variables, *state.as_object().unwrap());
        let chip = chip_cool_at(&mut variables, true, 1_002_500);
        assert_eq!(chip["heat"], 1);
        assert_eq!(chip["coolAnchorMs"], 1_002_000);
        assert_eq!(chip["extra"], true);
        assert_eq!(variables["chip"], Value::Object(chip));
        variables["chip"]["heat"] = json!(0);
        chip_cool_at(&mut variables, true, 1_009_500);
        assert_eq!(variables["chip"]["coolAnchorMs"], 1_002_000);
        variables["chip"]["heat"] = json!(-2);
        assert_eq!(chip_cool_at(&mut variables, true, 1_001_000)["heat"], -2);
        let mut empty = Map::new();
        chip_cool_at(&mut empty, false, 1000);
        assert_eq!(
            Value::Object(empty),
            json!({"chipConfig": {}, "chip": {"heat": 0, "coolAnchorMs": 1000}})
        );
    }

    #[test]
    fn chip_status_is_read_only_and_cooling_uses_reducer_default() {
        let pack =
            LivePack::from_value(json!({"chip_status": {"capacity": 7, "coolEveryMs": 1000}}));
        let variables =
            json!({"chip": {"heat": 2, "coolAnchorMs": now_ms() - 5000}, "chipScans": [1, 2]})
                .as_object()
                .unwrap()
                .clone();
        let before = variables.clone();
        let status = chip_status_snapshot(&variables, &pack);
        assert_eq!(variables, before);
        assert_eq!(status["coolEveryMs"], 1000);
        assert_eq!(status["heat"], 2); // chip_cool does not consult archived coolEveryMs.
        assert_eq!(status["scanCount"], 2);
        let empty = Map::new();
        assert_eq!(chip_status_snapshot(&empty, &LivePack::empty())["heat"], 0);
        assert!(empty.is_empty());
    }

    #[test]
    fn chip_triple_payload_archived_row_and_legacy_key() {
        for pack in packs() {
            let first = run(
                &initial_state(true, pack),
                json!({"type": "chip.scan", "appId": "files", "windowType": "pdf", "contentKey": "file.hanyue_consent"}),
                pack,
            );
            assert_eq!(first.result["kind"], "readout");
            assert!(!first.result["text"].as_str().unwrap().is_empty());
            let cached = run(
                &first.state,
                json!({"type": "chip.scan", "appId": "browser", "windowType": "page", "contentKey": "browser.doodle.root.index"}),
                pack,
            );
            assert_eq!(cached.result["kind"], "readout");
            if pack.is_available() {
                assert_eq!(cached.result["text"], "Archived scan replay — key=page:browser.doodle.root.index, row=4f2bc3be7ae77376");
            }
            let legacy = run(
                &cached.state,
                json!({"type": "chip.scan", "key": "page:browser.doodle.root.index"}),
                pack,
            );
            assert_eq!(legacy.result["kind"], "readout");
            assert_eq!(legacy.state, cached.state);
            assert_eq!(legacy.events.len(), 1);
            assert_eq!(legacy.events[0]["scanCount"], cached.events[0]["scanCount"]);
        }
    }

    #[test]
    fn chip_key_derivation_table() {
        let pack = LivePack::empty();
        for (payload, key) in [
            (
                json!({"appId": " Browser ", "contentKey": " probe "}),
                "page:probe",
            ),
            (
                json!({"appId": "files", "contentKey": "probe"}),
                "file:probe",
            ),
            (
                json!({"appId": "mail", "contentKey": "probe"}),
                "mail:probe",
            ),
            (
                json!({"appId": "messenger", "contentKey": "probe"}),
                "signal:probe",
            ),
            (
                json!({"appId": "signal", "contentKey": "probe"}),
                "signal:probe",
            ),
            (
                json!({"appId": "terminal", "contentKey": "probe"}),
                "app:probe",
            ),
            (json!({"appId": "idle", "contentKey": "probe"}), "app:probe"),
            (
                json!({"appId": "settings", "contentKey": "probe"}),
                "app:probe",
            ),
            (
                json!({"appId": "system", "contentKey": "probe"}),
                "app:probe",
            ),
            (
                json!({"appId": "debug", "contentKey": "probe"}),
                "app:probe",
            ),
            (
                json!({"appId": "custom", "contentKey": "probe"}),
                "custom:probe",
            ),
            (json!({"contentKey": "probe"}), "app:probe"),
            (
                json!({"appId": "files", "contentKey": "page:probe"}),
                "page:probe",
            ),
            (
                json!({"key": " explicit ", "appId": "files", "contentKey": "ignored"}),
                "explicit",
            ),
            (json!({"appId": "Browser"}), "page:self"),
            (json!({"appId": " Browser "}), "app:self"),
            (json!({"appId": "custom"}), "app:self"),
            (json!({"appId": true, "contentKey": 123}), "true:123"),
            (json!({"windowType": "pdf"}), "unknown"),
        ] {
            let mut cmd = payload;
            cmd["type"] = json!("chip.scan");
            let result = run(&initial_state(false, &pack), cmd, &pack);
            assert_eq!(result.state["variables"]["chipScans"][0]["key"], key);
            assert_eq!(
                result.state["variables"]["chipScans"][0]["row"],
                sha_row(&format!("{key}@0"))
            );
            assert_status_event(&result.events[0], 1, 5, 1);
        }
    }

    #[test]
    fn chip_cache_exact_tail_and_duplicate_key_order() {
        let pack = LivePack::empty();
        let state = json!({"facts": {}, "variables": {"chip": {"heat": 5, "coolAnchorMs": now_ms()}, "chipScans": [
            {"key": "page:same", "row": "old"}, {"key": "file:same", "row": "file"}, {"key": "page:same", "row": "new"}
        ]}});
        let exact = run(
            &state,
            json!({"type": "chip.scan", "key": "page:same"}),
            &pack,
        );
        assert_eq!(
            exact.result["text"],
            "Archived scan replay — key=page:same, row=new"
        );
        let tail = run(
            &exact.state,
            json!({"type": "chip.scan", "key": "signal:same"}),
            &pack,
        );
        assert_eq!(
            tail.result["text"],
            "Archived scan replay — key=file:same, row=file"
        );
        assert_status_event(&tail.events[0], 5, 5, 3);
        assert_eq!(tail.state, exact.state);
    }

    #[test]
    fn chip_overheat_cooldown_writes_and_never_overheat() {
        let pack = LivePack::empty();
        let anchor = now_ms();
        let state = json!({"facts": {}, "variables": {"chipConfig": {"capacity": 2, "coolEveryMs": 100_000}, "chip": {"heat": 2, "coolAnchorMs": anchor}, "chipScans": []}});
        let fried = run(
            &state,
            json!({"type": "chip.scan", "key": "page:new"}),
            &pack,
        );
        assert_eq!(
            fried.result,
            json!({"kind": "fried", "text": "[page:new] chip thermal lock — heat 2/2; wait for cooldown"})
        );
        assert_eq!(fried.state, state);
        assert_status_event(&fried.events[0], 2, 2, 0);
        let mut cooled_state = state.clone();
        cooled_state["variables"]["chip"]["coolAnchorMs"] = json!(anchor - 250_000);
        let fresh = run(
            &cooled_state,
            json!({"type": "chip.scan", "key": "page:new"}),
            &pack,
        );
        assert_eq!(
            fresh.result,
            json!({"kind": "readout", "text": "Fresh readout logged — key=page:new, row=28e79f55aca63c3d"})
        );
        assert_eq!(fresh.state["variables"]["chip"]["heat"], 1);
        assert_eq!(
            fresh.state["variables"]["chip"]["coolAnchorMs"],
            anchor - 50_000
        );
        assert_status_event(&fresh.events[0], 1, 2, 1);
        let mut unlimited = state.clone();
        unlimited["variables"]["chipConfig"]["neverOverheat"] = json!(true);
        unlimited["variables"]["chip"]["heat"] = json!(99);
        let fresh = run(
            &unlimited,
            json!({"type": "chip.scan", "key": "page:new"}),
            &pack,
        );
        assert_eq!(fresh.result["kind"], "readout");
        assert_eq!(fresh.state["variables"]["chip"]["coolAnchorMs"], anchor);
        assert_status_event(&fresh.events[0], 100, 2, 1);
    }

    #[test]
    fn chip_debug_scan_reset_and_config_live_branches() {
        for pack in packs() {
            let initial = initial_state(true, pack);
            let title = "探".repeat(90);
            let scan = run(
                &initial,
                json!({"type": "chip.debugScan", "title": title, "readout": " row=abcdef stable ", "contentKey": " page:probe.test ", "key": "ignored"}),
                pack,
            );
            assert_eq!(scan.result, json!({"ok": true}));
            let scans = scan.state["variables"]["chipScans"].as_array().unwrap();
            let entry = scans.last().unwrap();
            assert_eq!(
                entry,
                &json!({"key": "page:probe.test", "row": "3a29aa45b3587beb", "title": "探".repeat(80)})
            );
            assert_eq!(scan.events.len(), 1);
            assert_eq!(scan.events[0]["scanCount"], scans.len());
            let repeat = run(
                &scan.state,
                json!({"type": "chip.debugScan", "contentKey": "page:probe.test", "readout": "new"}),
                pack,
            );
            assert_eq!(repeat.state, scan.state);
            assert!(repeat.events.is_empty());
            let reset = run(&scan.state, json!({"type": "chip.debugReset"}), pack);
            assert_eq!(reset.result, json!({"ok": true}));
            assert_eq!(reset.state["variables"]["chipScans"], json!([]));
            assert_eq!(reset.state["variables"]["chip"]["heat"], 0);
            assert_status_event(&reset.events[0], 0, 5, 0);
            let configured = run(
                &reset.state,
                json!({"type": "chip.debugConfig", "capacity": 9, "coolEveryMs": 1234, "heat": 8, "neverOverheat": true, "ignored": 1}),
                pack,
            );
            assert_eq!(configured.result, json!({"ok": true}));
            assert_eq!(
                configured.state["variables"]["chipConfig"],
                json!({"capacity": 9, "coolEveryMs": 1234, "heat": 8, "neverOverheat": true})
            );
            assert_eq!(configured.state["variables"]["chip"]["heat"], 0);
            assert!(configured.events.is_empty());
        }
        let pack = LivePack::empty();
        let scan = run(
            &initial_state(false, &pack),
            json!({"type": "chip.debugScan", "key": "probe"}),
            &pack,
        );
        assert!(scan.state["variables"].get("chip").is_none());
        assert!(scan.state["variables"].get("chipConfig").is_none());
        let blank = run(
            &initial_state(false, &pack),
            json!({"type": "chip.debugScan", "contentKey": " ", "key": "not-used"}),
            &pack,
        );
        assert_eq!(blank.state["variables"], json!({"chipScans": []}));
        assert!(blank.events.is_empty());
    }

    #[test]
    fn system_set_state_and_permissive_dispatches() {
        let pack = LivePack::empty();
        let state = initial_state(false, &pack);
        let result = run(
            &state,
            json!({"type": "system.setState", "state": {"custom": [1]}}),
            &pack,
        );
        assert_eq!(result.state, json!({"custom": [1]}));
        assert!(result.events.is_empty());
        for cmd in [
            json!({"type": "system.setState", "state": []}),
            json!({"type": "arbitrary.client.command"}),
        ] {
            let result = run(&state, cmd, &pack);
            assert_eq!(result.state, state);
            assert_eq!(result.result, json!({"ok": true}));
            assert!(result.events.is_empty());
        }
    }

    #[test]
    fn malformed_json_never_panics_across_manifold_commands() {
        let pack = LivePack::empty();
        let commands = [
            json!({"type": "idle.complete", "emittedAt": "bad"}),
            json!({"type": "client.emitFact", "factId": "f", "emittedAt": "bad"}),
            json!({"type": "client.emitFacts", "factIds": ["f", 1]}),
            json!({"type": "chip.scan", "key": {}, "appId": [], "contentKey": true}),
            json!({"type": "chip.debugScan", "contentKey": 1, "readout": {}, "title": []}),
            json!({"type": "chip.debugReset", "extra": true}),
            json!({"type": "chip.debugConfig", "capacity": u64::MAX, "coolEveryMs": 0.5}),
            json!({"type": "patchVariables", "variablesPatch": 7, "patch": []}),
            json!({"type": "system.patchVariables", "patch": {"chipScans": false}}),
            json!({"type": "idle.sync", "prestige": u64::MAX, "idle": []}),
            json!({"type": "system.setState", "state": {"facts": [], "variables": {"chip": false}}}),
            json!({"type": "unknown", "payload": i64::MIN}),
            Value::Null,
            json!([]),
            json!({"type": "client.emitFacts", "factIds": "not a list"}),
        ];
        let mut states = vec![
            Value::Null,
            json!([]),
            json!({}),
            json!({"facts": {}, "variables": {}}),
            json!({"variables": 1}),
            json!({"facts": false}),
            json!({"facts": {}, "variables": {"chip": {"heat": u64::MAX, "coolAnchorMs": i64::MIN}, "chipConfig": {"capacity": 1e30, "coolEveryMs": -1}, "chipScans": []}}),
            json!({"facts": {}, "variables": {"chip": {"heat": 1.5, "coolAnchorMs": true}, "chipConfig": {"capacity": -9, "coolEveryMs": "0"}, "chipScans": []}}),
            json!({"facts": {}, "variables": {"chip": {"heat": "invalid", "coolAnchorMs": "_"}, "chipConfig": {"capacity": false, "coolEveryMs": 2.5}, "chipScans": []}}),
            json!({"facts": {}, "variables": {"chip": {}, "chipConfig": {}, "chipScans": [], "idle": 1}}),
        ];
        for malformed in [
            Value::Null,
            json!(false),
            json!(0),
            json!("wrong"),
            json!([]),
        ] {
            states.extend([
                json!({"facts": {}, "variables": malformed.clone()}),
                json!({"facts": malformed.clone(), "variables": {}}),
                json!({"facts": {}, "variables": {"chip": malformed.clone()}}),
                json!({"facts": {}, "variables": {"chipConfig": malformed.clone()}}),
                json!({"facts": {}, "variables": {"chipScans": malformed.clone()}}),
                json!({"facts": {}, "variables": {"idle": malformed}}),
            ]);
        }

        for state in &states {
            for command in &commands {
                let outcome = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
                    reduce(state, "player", command, &pack)
                }));
                assert!(
                    outcome.is_ok(),
                    "reducer panicked for state={state} command={command}"
                );
            }
        }

        for malformed in [
            Value::Null,
            json!(false),
            json!(0),
            json!("wrong"),
            json!([]),
        ] {
            let mut variables = Map::new();
            variables.insert("chipConfig".into(), malformed.clone());
            variables.insert("chip".into(), malformed.clone());
            variables.insert("chipScans".into(), malformed);
            let outcome = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
                let _ = chip_config_of(&mut variables);
                let _ = chip_cool(&mut variables, false);
                let _ = chip_cool_at(&mut variables, false, now_ms());
                let _ = chip_capacity(&mut variables, &pack);
                let _ = chip_status_snapshot(&variables, &pack);
                let _ = fact_record("f", "actor", &json!([true]), 0);
                let _ = derive_source("");
                let _ = affected_artifact_types("");
            }));
            assert!(outcome.is_ok(), "public helpers panicked for {variables:?}");
        }
    }

    #[test]
    fn internal_dispatch_error_maps_to_python_ack_failure() {
        use crate::session;
        use crate::tasks::Pacing;
        use crate::world::{Secrets, World};
        use std::sync::Arc;

        let pack = LivePack::empty();
        let mut world =
            World::new("guest_test", Some("en"), true, Arc::new(pack)).with_pacing(Pacing::Edge);
        let patch = json!({
            "type": "dispatch", "actor": "player", "cartridgeId": "manifold.web",
            "requestId": "r1", "expectedHeadVersion": 0,
            "cmd": {"type": "patchVariables", "variablesPatch": {"chip": 7}},
        });
        let patched = session::handle(&mut world, &patch, &Secrets::default());
        assert_eq!(patched.direct[0]["success"], true);

        let scan = json!({
            "type": "dispatch", "actor": "player", "cartridgeId": "manifold.web",
            "requestId": "r2", "expectedHeadVersion": 1,
            "cmd": {"type": "chip.scan", "key": "page:probe"},
        });
        let out = session::handle(&mut world, &scan, &Secrets::default());
        assert_eq!(out.direct[0]["type"], "dispatch_ack");
        assert_eq!(out.direct[0]["success"], false);
        assert_eq!(out.direct[0]["error"], "Local runtime dispatch error");
        assert_eq!(out.direct[0]["errorCode"], "dispatch_error");
        assert!(out.broadcast.is_empty());
        assert!(out.tasks.is_empty());
    }
}

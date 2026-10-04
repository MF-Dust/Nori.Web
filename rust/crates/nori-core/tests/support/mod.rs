//! Expectation-only normalization from scripts/rust_parity/export_fixtures.py.
#![allow(dead_code)] // Each integration-test binary uses a different subset.

use nori_core::live_pack::LivePack;
use serde_json::{json, Value};
use std::collections::HashMap;
use std::path::Path;

pub fn fixture(name: &str) -> Value {
    let path = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("tests/fixtures")
        .join(name);
    serde_json::from_slice(&std::fs::read(&path).expect("read golden fixture"))
        .unwrap_or_else(|error| panic!("{}: {error}", path.display()))
}

pub fn archive_pack() -> LivePack {
    let path =
        Path::new(env!("CARGO_MANIFEST_DIR")).join("../../../backend/data/live_world_pack.json");
    LivePack::from_value(
        serde_json::from_slice(&std::fs::read(path).expect("read archive")).unwrap(),
    )
}

#[derive(Clone, Copy, Default)]
pub struct Masks {
    pub codenames: bool,
    pub cakeduel: bool,
    pub pictionary: bool,
}

const TIMESTAMP_KEYS: &[&str] = &[
    "at",
    "atMs",
    "coolAnchorMs",
    "cooledAt",
    "createdAt",
    "emittedAt",
    "endedAt",
    "endedAtMs",
    "expiresAt",
    "importedAt",
    "lastScanAt",
    "lastSeenAt",
    "lastSyncMs",
    "madeAtMs",
    "now",
    "readAt",
    "seenAt",
    "serverNowMs",
    "solvedAtMs",
    "startedAt",
    "startedAtMs",
    "surfacedAt",
    "syncedAt",
    "timestamp",
    "updatedAt",
];

pub fn normalize(mut value: Value, masks: Masks) -> Value {
    fn apply(value: &mut Value, masks: Masks, ids: &mut HashMap<String, String>) {
        match value {
            Value::Array(items) => {
                for item in items {
                    apply(item, masks, ids);
                }
            }
            Value::Object(map) => {
                for (key, raw) in map {
                    if TIMESTAMP_KEYS.contains(&key.as_str())
                        && (raw.as_i64().is_some() || raw.as_u64().is_some())
                    {
                        *raw = json!("<ts>");
                    } else if key == "worldId" && raw.is_string() {
                        *raw = json!("<world-id>");
                    } else if key == "mediaGrants" && raw.is_array() {
                        *raw = Value::Array(
                            (1..=raw.as_array().unwrap().len())
                                .map(|i| json!(format!("<media-grant-{i}>")))
                                .collect(),
                        );
                    } else if key == "mediaGrant" && raw.is_string() {
                        *raw = json!("<media-grant-1>");
                    } else if let Some(id) = raw.as_str().filter(|s| {
                        s.len() == 36
                            && uuid::Uuid::parse_str(s).is_ok_and(|id| {
                                id.get_version_num() == 4
                                    && id.get_variant() == uuid::Variant::RFC4122
                            })
                    }) {
                        let next = format!("<uuid-{}>", ids.len() + 1);
                        let label = ids.entry(id.to_owned()).or_insert(next);
                        *raw = json!(label);
                    } else if (masks.pictionary
                        && ["roundId", "word", "drawingId", "pinyin", "synonyms"]
                            .contains(&key.as_str()))
                        || (masks.codenames && ["board", "key"].contains(&key.as_str()))
                        || (masks.cakeduel
                            && ["deck", "discard", "hand", "cardIds"].contains(&key.as_str()))
                    {
                        *raw = json!("<random>");
                    } else {
                        apply(raw, masks, ids);
                    }
                }
            }
            _ => {}
        }
    }
    apply(&mut value, masks, &mut HashMap::new());
    value
}

/// A compact diagnostic without dumping entire archive/game states on failure.
/// Equality still covers every key, array element, value, and JSON number type.
pub fn first_difference(expected: &Value, actual: &Value, path: &str) -> Option<String> {
    if expected == actual {
        return None;
    }
    match (expected, actual) {
        (Value::Object(left), Value::Object(right)) => {
            for (key, expected) in left {
                let path = format!("{path}/{key}");
                let Some(actual) = right.get(key) else {
                    return Some(format!("{path}: expected {expected}, actual <missing>"));
                };
                if let Some(diff) = first_difference(expected, actual, &path) {
                    return Some(diff);
                }
            }
            right
                .iter()
                .find(|(key, _)| !left.contains_key(*key))
                .map(|(key, value)| format!("{path}/{key}: expected <missing>, actual {value}"))
        }
        (Value::Array(left), Value::Array(right)) => {
            if left.len() != right.len() {
                return Some(format!(
                    "{path}/length: expected {}, actual {}",
                    left.len(),
                    right.len()
                ));
            }
            left.iter()
                .zip(right)
                .enumerate()
                .find_map(|(i, (expected, actual))| {
                    first_difference(expected, actual, &format!("{path}/{i}"))
                })
        }
        _ => Some(format!("{path}: expected {expected}, actual {actual}")),
    }
}

pub fn assert_json_eq(expected: &Value, actual: &Value, label: &str) {
    if let Some(diff) = first_difference(expected, actual, "") {
        panic!("{label}: {diff}");
    }
}

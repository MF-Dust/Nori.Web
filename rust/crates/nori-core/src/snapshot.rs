use crate::cartridge::{self, Cartridge};
use crate::jsonutil::{canonical_json, Json};
use crate::live_pack::LivePack;
use crate::world::{World, MAX_MEDIA_GRANTS};
use serde_json::{json, Value};
use std::sync::Arc;

pub const SNAPSHOT_VERSION: u64 = 1;

pub fn world_snapshot(world: &World) -> Json {
    let mut cartridges = serde_json::Map::new();
    for cartridge in &world.cartridges {
        cartridges.insert(
            cartridge.id.clone(),
            json!({
                "state": cartridge.state,
                "headVersion": cartridge.head_version,
                "visibleVersion": cartridge.visible_version,
            }),
        );
    }
    json!({
        "version": SNAPSHOT_VERSION,
        "ownerId": world.owner_id,
        "worldId": world.world_id,
        "locale": world.locale,
        "fullUnlock": world.full_unlock,
        // Python stores a set and serializes it sorted.
        "mediaGrants": sorted_grants(world),
        "mediaSequence": world.media_sequence,
        "cartridges": cartridges,
    })
}

pub fn world_snapshot_json(world: &World) -> String {
    canonical_json(&world_snapshot(world))
}

fn sorted_grants(world: &World) -> Vec<String> {
    let mut grants = world.media_grants.clone();
    grants.sort();
    grants
}

/// Python `_non_negative_int`: bool → 0, `int()` of numbers and numeric
/// strings (truncating floats), negatives clamped to 0, otherwise 0.
fn non_negative_int(value: Option<&Value>) -> u64 {
    let parsed: Option<i128> = match value {
        Some(Value::Number(n)) => n
            .as_i64()
            .map(i128::from)
            .or_else(|| n.as_u64().map(i128::from))
            .or_else(|| n.as_f64().filter(|f| f.is_finite()).map(|f| f.trunc() as i128)),
        Some(Value::String(text)) => {
            let text = text.trim();
            let digits = text.strip_prefix(['+', '-']).unwrap_or(text);
            let valid = !digits.is_empty()
                && !digits.starts_with('_')
                && !digits.ends_with('_')
                && !digits.contains("__")
                && digits.chars().all(|c| c.is_ascii_digit() || c == '_');
            if valid {
                let number: i128 = digits.replace('_', "").parse().unwrap_or(i128::MAX);
                Some(if text.starts_with('-') { -number } else { number })
            } else {
                None
            }
        }
        _ => None,
    };
    parsed.map(|n| n.clamp(0, i128::from(u64::MAX)) as u64).unwrap_or(0)
}

/// Python `world_from_snapshot`: `None` when the payload is unusable.
/// Unknown or malformed cartridge entries are skipped individually; a
/// snapshot without `chat` is rejected (a fresh world is safer).
pub fn world_from_snapshot(payload: &Json, pack: Arc<LivePack>) -> Option<World> {
    if payload.get("version").and_then(Value::as_f64) != Some(SNAPSHOT_VERSION as f64) {
        return None;
    }
    let owner_id = payload.get("ownerId").and_then(Value::as_str).filter(|s| !s.is_empty())?.to_string();
    let world_id = payload.get("worldId").and_then(Value::as_str).filter(|s| !s.is_empty())?.to_string();
    let saved = payload.get("cartridges").and_then(Value::as_object)?;
    let mut cartridges = Vec::new();
    for (id, saved) in saved {
        let Some(state) = saved.get("state").filter(|s| s.is_object()) else {
            continue;
        };
        let Some(mut cartridge) = cartridge::create(id, true, &pack) else {
            continue;
        };
        cartridge.state = state.clone();
        cartridge.head_version = non_negative_int(saved.get("headVersion"));
        cartridge.visible_version = non_negative_int(saved.get("visibleVersion")).min(cartridge.head_version);
        cartridges.push(cartridge);
    }
    if !cartridges.iter().any(|c| c.id == "chat") {
        return None;
    }
    let full_unlock = payload.get("fullUnlock") != Some(&Value::Bool(false));
    let locale = payload.get("locale").and_then(Value::as_str).filter(|l| !l.is_empty());
    let mut world = World::new(owner_id, locale, full_unlock, pack);
    world.world_id = world_id;
    world.cartridges = cartridges;
    if let Some(grants) = payload.get("mediaGrants").and_then(Value::as_array) {
        let tail = &grants[grants.len().saturating_sub(MAX_MEDIA_GRANTS)..];
        world.media_grants = tail.iter().filter_map(|v| v.as_str().filter(|s| !s.is_empty()).map(str::to_string)).collect();
        world.media_grants.sort();
        world.media_grants.dedup();
    }
    world.media_sequence = (non_negative_int(payload.get("mediaSequence")) & 0xFFFF_FFFF) as u32;
    Some(world)
}

pub fn world_from_snapshot_json(raw: &str, pack: Arc<LivePack>) -> Option<World> {
    let payload: Json = serde_json::from_str(raw).ok()?;
    world_from_snapshot(&payload, pack)
}

pub fn restore_cartridge(id: &str, saved: &Json, pack: &LivePack) -> Option<Cartridge> {
    let mut cartridge = cartridge::create(id, true, pack)?;
    cartridge.state = saved.get("state")?.clone();
    Some(cartridge)
}

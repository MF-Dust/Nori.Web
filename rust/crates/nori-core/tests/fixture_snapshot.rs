mod support;

use nori_core::jsonutil::canonical_json;
use nori_core::live_pack::LivePack;
use nori_core::snapshot::{world_from_snapshot_json, world_snapshot_json};
use serde_json::Value;
use std::sync::Arc;
use support::{archive_pack, assert_json_eq, fixture, normalize, Masks};

fn round_trip(name: &str, archive: bool) {
    let fixture = fixture(name);
    let raw = fixture["snapshot"]
        .as_str()
        .expect("fixture contains the Python snapshot body");
    let expected: Value = serde_json::from_str(raw).unwrap();
    let pack = Arc::new(if archive {
        archive_pack()
    } else {
        LivePack::empty()
    });
    let world = world_from_snapshot_json(raw, pack).expect("Python snapshot must restore");
    assert_eq!(world.owner_id, fixture["ownerId"].as_str().unwrap());
    assert_eq!(world.locale, fixture["locale"].as_str().unwrap());
    assert_eq!(world.full_unlock, fixture["fullUnlock"].as_bool().unwrap());
    assert_eq!(
        world.media_grants.len() as u64,
        fixture["mediaGrantCount"].as_u64().unwrap()
    );
    assert_eq!(
        world.media_sequence as u64,
        expected["mediaSequence"].as_u64().unwrap()
    );
    let cartridges = expected["cartridges"].as_object().unwrap();
    assert_eq!(world.cartridges.len(), cartridges.len());
    for (id, saved) in cartridges {
        let cart = world.cartridge(id).unwrap();
        assert_json_eq(&saved["state"], &cart.state, id);
        assert_eq!(
            cart.head_version,
            saved["headVersion"].as_u64().unwrap(),
            "{id}"
        );
        assert_eq!(
            cart.visible_version,
            saved["visibleVersion"].as_u64().unwrap(),
            "{id}"
        );
    }
    let manifold = world.cartridge("manifold.web").unwrap();
    for (key, count) in [
        ("facts", "factsKeyCount"),
        ("variables", "variablesKeyCount"),
    ] {
        assert_eq!(
            manifold.state[key].as_object().unwrap().len() as u64,
            fixture[count].as_u64().unwrap()
        );
    }
    assert_eq!(raw.len() as u64, fixture["snapshotBytes"].as_u64().unwrap());
    let serialized = world_snapshot_json(&world);
    let actual: Value = serde_json::from_str(&serialized).unwrap();
    let masks = Masks {
        pictionary: true,
        ..Masks::default()
    };
    assert_json_eq(&expected, &normalize(actual.clone(), masks), name);
    assert_eq!(
        canonical_json(&normalize(actual, masks)).as_bytes(),
        raw.as_bytes(),
        "normalized Python snapshot bytes: {name}"
    );
    // Restored placeholders remain unchanged; also test the production serializer directly.
    assert_eq!(
        serialized.as_bytes(),
        raw.as_bytes(),
        "production snapshot bytes: {name}"
    );
}

#[test]
fn story_mode() {
    round_trip("snapshot_story_mode.json", false);
}

#[test]
fn archive_mode() {
    round_trip("snapshot_archive_mode.json", true);
}

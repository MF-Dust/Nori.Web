use crate::{live_pack::LivePack, Json};
use serde_json::{json, Map};

/// Export file objects formatted as Manifold artifacts.
pub fn artifacts(pack: &LivePack, now_ms: i64) -> Vec<Json> {
    if pack.is_available() {
        return pack.file_artifacts();
    }

    let mut artifacts = Vec::new();
    for file in fallback_files() {
        let mut data = Map::new();
        for key in ["display_path", "mime", "folder", "content"] {
            if let Some(value) = file.get(key) {
                data.insert(key.to_owned(), value.clone());
            }
        }
        artifacts.push(json!({
            "id": file["id"].clone(),
            "type": "file",
            "surfacedAt": now_ms - 3_600_000,
            "data": data,
        }));
    }
    artifacts
}

fn fallback_files() -> Vec<Json> {
    json!([
        {
            "id": "file_matrix",
            "display_path": "personality_matrix.bin",
            "mime": "application/octet-stream",
            "folder": "Nori Core"
        },
        {
            "id": "file_readme",
            "display_path": "readme.txt",
            "mime": "text/plain",
            "folder": "Documents",
            "content": "NoriOS Local Compatibility Environment\nAll components unlocked by default."
        }
    ])
    .as_array()
    .expect("fallback files are an array")
    .clone()
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn real_pack() -> LivePack {
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
    }

    #[test]
    fn apps_files_demo_artifacts_match_fallback_shape_and_timestamps() {
        let actual = artifacts(&LivePack::empty(), 1_700_000_000_000);
        assert_eq!(
            Json::Array(actual),
            json!([
                {
                    "id": "file_matrix",
                    "type": "file",
                    "surfacedAt": 1_699_996_400_000_i64,
                    "data": {
                        "display_path": "personality_matrix.bin",
                        "mime": "application/octet-stream",
                        "folder": "Nori Core"
                    }
                },
                {
                    "id": "file_readme",
                    "type": "file",
                    "surfacedAt": 1_699_996_400_000_i64,
                    "data": {
                        "display_path": "readme.txt",
                        "mime": "text/plain",
                        "folder": "Documents",
                        "content": "NoriOS Local Compatibility Environment\nAll components unlocked by default."
                    }
                }
            ])
        );
    }

    #[test]
    fn apps_files_archive_artifacts_are_returned_verbatim() {
        let pack = real_pack();
        assert_eq!(artifacts(&pack, 0), pack.file_artifacts());
        assert!(artifacts(&pack, 0).len() >= 2);
    }
}

use crate::{live_pack::LivePack, Json};
use serde_json::{json, Map};

/// Export mail objects formatted as Manifold artifacts.
pub fn artifacts(pack: &LivePack, now_ms: i64) -> Vec<Json> {
    if pack.is_available() {
        // Runtime-sent mail is produced only by the unreachable send_email helper.
        return pack.mail_artifacts();
    }

    let mut artifacts = Vec::new();
    for (index, mail) in fallback_emails().iter().enumerate() {
        let mut data = Map::new();
        for key in [
            "from",
            "to",
            "subject",
            "body_md",
            "folder",
            "date",
            "read_fact",
        ] {
            if let Some(value) = mail.get(key) {
                data.insert(key.to_owned(), value.clone());
            }
        }
        artifacts.push(json!({
            "id": mail["id"].clone(),
            "type": "mail",
            "surfacedAt": now_ms - (3_600_000 - index as i64 * 1_800_000),
            "data": data,
        }));
    }
    artifacts
}

fn fallback_emails() -> Vec<Json> {
    json!([
        {
            "id": "mail_welcome",
            "from": "Inori Systems <system@inori.ai>",
            "to": "Operator <operator@nori.ai>",
            "subject": "欢迎接入 NoriOS 终端节点",
            "body_md": "尊敬的操作员：\n\n您的终端已成功同步至 NoriOS 本地运行时核心。Nori Live2D 情绪模型、全部小游戏与系统应用已解锁就绪。\n\n-- Inori OS 运维组",
            "folder": "inbox",
            "date": "2026-08-26 10:00",
            "read_fact": "mail.help.read",
            "read": false,
            "archived": false
        },
        {
            "id": "mail_memo",
            "from": "Nori <nori@inori.ai>",
            "to": "Operator <operator@nori.ai>",
            "subject": "【日常备忘】今天也请多多指教呀！",
            "body_md": "操作员！\n\n所有应用和游戏（国际象棋、蛋糕决斗、森林寻宝、你画我猜）都已准备好啦！随时可以开始哦！\n\n(Nori 留)",
            "folder": "inbox",
            "date": "2026-08-26 10:05",
            "read": true,
            "archived": false
        }
    ])
    .as_array()
    .expect("fallback mail is an array")
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
    fn apps_mail_demo_artifacts_match_fallback_shape_and_timestamps() {
        let actual = artifacts(&LivePack::empty(), 1_700_000_000_000);
        assert_eq!(actual.len(), 2);
        assert_eq!(
            actual[0],
            json!({
                "id": "mail_welcome",
                "type": "mail",
                "surfacedAt": 1_699_996_400_000_i64,
                "data": {
                    "from": "Inori Systems <system@inori.ai>",
                    "to": "Operator <operator@nori.ai>",
                    "subject": "欢迎接入 NoriOS 终端节点",
                    "body_md": "尊敬的操作员：\n\n您的终端已成功同步至 NoriOS 本地运行时核心。Nori Live2D 情绪模型、全部小游戏与系统应用已解锁就绪。\n\n-- Inori OS 运维组",
                    "folder": "inbox",
                    "date": "2026-08-26 10:00",
                    "read_fact": "mail.help.read"
                }
            })
        );
        assert_eq!(actual[1]["surfacedAt"], json!(1_699_998_200_000_i64));
        assert_eq!(actual[1]["data"]["body_md"], "操作员！\n\n所有应用和游戏（国际象棋、蛋糕决斗、森林寻宝、你画我猜）都已准备好啦！随时可以开始哦！\n\n(Nori 留)");
    }

    #[test]
    fn apps_mail_archive_artifacts_are_returned_verbatim() {
        let pack = real_pack();
        assert_eq!(artifacts(&pack, 0), pack.mail_artifacts());
        assert!(artifacts(&pack, 0).len() >= 2);
    }
}

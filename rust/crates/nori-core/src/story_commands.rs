//! Local restoration of the story RPCs omitted from the archived server.

use crate::events::{dispatch_manifold, int_value, text, variables, EventRun};
use crate::jsonutil::Json;
use crate::llm::{decimal_digit, py_trim, truthy};
use crate::world::World;
use serde_json::json;

pub const DANIEL_QUESTIONS: [&str; 3] = [
    "身份核验 1/3：丹尼尔在 Signal 里说要去店里接猫，是几月几日？（月-日）",
    "身份核验 2/3：丹尼尔在 Pulse 上发「生日快乐~」是几月几日？（月-日）",
    "身份核验 3/3：Signal 照片里的猫是什么花色？",
];
pub const NAS_HOSTS: [&str; 3] = ["198.51.100.74", "ft-homenas.local", "nas.hanyue.tech"];
pub const NAS_FILENAME: &str = "deep-dive-consent-review.pdf";
pub const NAS_FACT: &str = "download.hanyue_consent";

/// VAULTS without the private answers. Field order follows Python's dictionaries.
pub fn app_artifacts() -> Vec<Json> {
    vec![
        json!({"id": "app.vault.bookcipher", "type": "app", "data": {
            "app_kind": "password_prompt", "command": "vault.unlock", "puzzle_id": "bookcipher", "placeholder": "输入口令",
            "title": "账户恢复码", "vault_path": "文稿/账户恢复码", "unpack_to": "文稿", "vault_kind": "folder",
            "unlocked_when": "bookcipher.solved", "available_when": "paper.downloaded", "hint": "我论文里面的诗。他没能拯救的她的名字。"
        }}),
        json!({"id": "app.vault.cult", "type": "app", "data": {
            "app_kind": "password_prompt", "command": "vault.unlock", "puzzle_id": "cult", "placeholder": "输入口令",
            "title": "宇宙真相.zip", "vault_path": "下载/宇宙真相.zip", "vault_kind": "zip",
            "unlocked_when": "cult.unpacked", "available_when": "cult.zip.downloaded", "hint": "播客中的六位数字。"
        }}),
    ]
}

fn normal(value: Option<&Json>) -> String {
    // NFKC subset: archived Chinese answers, ASCII and fullwidth ASCII/space.
    // No normalization dependency is available; other compatibility alphabets
    // (e.g. mathematical/circled letters) are intentionally not transliterated.
    let compatible: String = text(value)
        .chars()
        .map(|c| match c {
            '\u{3000}' => ' ',
            '\u{ff01}'..='\u{ff5e}' => char::from_u32(u32::from(c) - 0xfee0).unwrap_or(c),
            c => c,
        })
        .collect();
    py_trim(&compatible)
        .to_lowercase()
        .replace('ß', "ss")
        .replace('ſ', "s")
}

fn emit(world: &mut World, out: &mut EventRun, fact: &str, source: &str) {
    dispatch_manifold(
        world,
        &json!({"type": "client.emitFact", "factId": fact, "source": source}),
        out,
    );
}

fn patch(world: &mut World, out: &mut EventRun, patch: Json) {
    dispatch_manifold(
        world,
        &json!({"type": "patchVariables", "variablesPatch": patch}),
        out,
    );
}

fn date_answer(answer: &str, month: u32, day: u32) -> bool {
    let mut parts = Vec::<String>::new();
    let mut part = String::new();
    for c in answer.chars() {
        if let Some(digit) = decimal_digit(c).and_then(|n| char::from_digit(n, 10)) {
            part.push(digit);
        } else if !part.is_empty() {
            parts.push(std::mem::take(&mut part));
        }
    }
    if !part.is_empty() {
        parts.push(part);
    }
    if parts.len() == 3 && parts.first().is_some_and(|s| s.len() == 4) {
        parts.remove(0);
    }
    if parts.len() == 1 && parts.first().is_some_and(|s| matches!(s.len(), 3 | 4)) {
        return parts.first().and_then(|s| s.parse::<u32>().ok()) == Some(month * 100 + day);
    }
    parts.len() == 2
        && parts.first().and_then(|s| s.parse::<u32>().ok()) == Some(month)
        && parts.get(1).and_then(|s| s.parse::<u32>().ok()) == Some(day)
}

fn verify_daniel(world: &mut World, payload: &Json, facts: &Json, out: &mut EventRun) -> Json {
    if !facts.get("daniel.deadman.delivered").is_some_and(truthy)
        || !facts.get("signal_daniel.unlocked").is_some_and(truthy)
    {
        return json!({"ok": false, "reply": ["身份核验尚未开放。"]});
    }
    if facts.get("daniel.evidence_unlocked").is_some_and(truthy) {
        return json!({"ok": true, "reply": ["核验已通过，附件已交付。"]});
    }
    let step = variables(world)
        .and_then(|v| v.get("danielVerifyStep"))
        .and_then(int_value)
        .unwrap_or(0)
        .clamp(0, 3) as usize;
    let answer = normal(payload.get("answer"));
    let question = DANIEL_QUESTIONS[step.min(2)];
    if answer.is_empty() || answer == "/verify" {
        emit(world, out, "daniel.verify.started", "signal.daniel.verify");
        return json!({"ok": true, "reply": [question]});
    }
    if !facts.get("daniel.verify.started").is_some_and(truthy) {
        return json!({"ok": false, "reply": ["请先回复 /verify 开始。"]});
    }
    let correct = match step {
        0 => date_answer(&answer, 2, 13),
        1 => date_answer(&answer, 3, 6),
        _ => ["银虎斑", "银色虎斑", "silver tabby"].contains(&answer.as_str()),
    };
    if !correct {
        return json!({"ok": false, "reply": ["答案不匹配，请再查看 Signal 记录或 Pulse 主页。", question]});
    }
    let step = step + 1;
    patch(world, out, json!({"danielVerifyStep": step}));
    if step >= 3 {
        emit(
            world,
            out,
            "daniel.evidence_unlocked",
            "signal.daniel.verify",
        );
        json!({"ok": true, "reply": ["身份核验通过。依据主人的预设指令，向你交付「子午线邮报-撤稿往来.pdf」。"]})
    } else {
        json!({"ok": true, "reply": ["答案匹配。", DANIEL_QUESTIONS[step]]})
    }
}

fn nas(world: &mut World, command: &str, payload: &Json, facts: &Json, out: &mut EventRun) -> Json {
    if command == "nas.connect" {
        let host = normal(payload.get("host"));
        if !NAS_HOSTS.contains(&host.as_str()) {
            return json!({"ok": false, "error": "connection refused"});
        }
        patch(world, out, json!({"nasHost": host}));
        emit(world, out, "nas.connected", "nas.connect");
        return json!({"ok": true, "motd": "FT-HOMENAS 4.2.1 — Han Yue home archive"});
    }
    if !variables(world)
        .and_then(|v| v.get("nasHost"))
        .is_some_and(truthy)
    {
        return json!({"ok": false, "error": "not connected"});
    }
    let raw = payload
        .get("path")
        .filter(|v| truthy(v))
        .map(crate::llm::py_string)
        .unwrap_or_else(|| "/".into());
    // posixpath.normpath('/' + raw.lstrip('/')), including parent components.
    let mut parts = Vec::new();
    for part in raw.split('/') {
        match part {
            "" | "." => {}
            ".." => {
                parts.pop();
            }
            part => parts.push(part),
        }
    }
    let path = format!("/{}", parts.join("/"));
    match command {
        "nas.list" if path == "/" => {
            json!({"ok": true, "entries": [{"name": "README.txt", "kind": "file"}, {"name": NAS_FILENAME, "kind": "file"}]})
        }
        "nas.list" => json!({"ok": false, "error": "没有那个目录"}),
        "nas.read" if path == "/README.txt" => {
            json!({"ok": true, "text": format!("韩越的工作资料备份。\n{NAS_FILENAME}\n二进制 PDF，请用 download 下载后在文件应用中查看。")})
        }
        "nas.read" => {
            json!({"ok": false, "error": if path == format!("/{NAS_FILENAME}") { "二进制文件，请用 download 下载" } else { "没有那个文件" }})
        }
        "nas.download" if path == format!("/{NAS_FILENAME}") => {
            let already = facts.get(NAS_FACT).is_some_and(truthy);
            emit(world, out, NAS_FACT, "nas.download");
            json!({"ok": true, "filename": NAS_FILENAME, "downloadFact": NAS_FACT, "already": already})
        }
        "nas.download" => json!({"ok": false, "error": "没有那个文件"}),
        _ => json!({"ok": false, "error": "unknown NAS command"}),
    }
}

pub fn run_story_command(
    world: &mut World,
    command: &str,
    payload: &Json,
    out: &mut EventRun,
) -> Option<Json> {
    let facts = world
        .cartridge("manifold.web")
        .and_then(|c| c.state.get("facts"))
        .cloned()
        .unwrap_or_else(|| json!({}));
    if ["puzzle.verify", "vault.unlock", "unseal_volume"].contains(&command)
        && !payload.get("factId").is_some_and(truthy)
    {
        let key = text(
            payload
                .get("puzzleId")
                .filter(|v| truthy(v))
                .or_else(|| payload.get("volumeId")),
        );
        let (available, unlocked, answers): (&str, &str, &[&str]) = match key.as_str() {
            "bookcipher" => (
                "paper.downloaded",
                "bookcipher.solved",
                &["欧律狄刻", "eurydice"],
            ),
            "cult" => ("cult.zip.downloaded", "cult.unpacked", &["978208"]),
            _ => return Some(json!({"ok": false, "error": "unknown vault"})),
        };
        if !world.full_unlock && !facts.get(available).is_some_and(truthy) {
            return Some(json!({"ok": false, "error": "vault is not available"}));
        }
        let token = payload
            .get("tokens")
            .and_then(Json::as_array)
            .filter(|tokens| tokens.len() == 1)
            .and_then(|tokens| tokens.first())
            .or_else(|| payload.get("token"));
        if !answers.contains(&normal(token).as_str()) {
            return Some(json!({"ok": false, "error": "incorrect passphrase"}));
        }
        emit(world, out, unlocked, "vault.unlock");
        return Some(json!({"ok": true, "fact": unlocked}));
    }
    match command {
        "bounty.installExtension" => {
            emit(
                world,
                out,
                "bounty.ext_installed",
                "bounty.installExtension",
            );
            Some(json!({"ok": true}))
        }
        "signal.daniel.verify" => Some(verify_daniel(world, payload, &facts, out)),
        command if command.starts_with("nas.") => Some(nas(world, command, payload, &facts, out)),
        _ => None,
    }
}

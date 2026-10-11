//! Arcade event dispatcher and the browser AI/TTS bridge, sans sockets/I/O.

use crate::apps::{browser, files, mail, messenger};
use crate::cartridge::{Commit, DispatchError};
use crate::cartridges::manifold;
use crate::jsonutil::{now_ms, Json};
use crate::llm::{decimal_digit, py_string, py_trim, truthy};
use crate::story;
use crate::story_commands;
use crate::tasks::Task;
use crate::world::{event_message, Outbound, World};
use serde_json::{json, Map, Value};

/// One event's publications, including Python's uncaught-dispatch-fault path.
/// A fault suppresses the reply and later dispatches, not earlier broadcasts.
#[derive(Default)]
pub struct EventRun {
    pub(crate) outbound: Outbound,
    failed: bool,
}

pub(crate) fn text(value: Option<&Json>) -> String {
    value
        .filter(|v| truthy(v))
        .map(py_string)
        .unwrap_or_default()
}

/// Safe Python int conversion; invalid client/state values have no integer.
pub(crate) fn int_value(value: &Json) -> Option<i64> {
    match value {
        Value::Bool(value) => Some(i64::from(*value)),
        Value::Number(value) => value.as_i64().or_else(|| value.as_f64().map(|n| n as i64)),
        Value::String(value) => {
            let value: String = py_trim(value)
                .chars()
                .map(|c| {
                    decimal_digit(c)
                        .and_then(|n| char::from_digit(n, 10))
                        .unwrap_or(c)
                })
                .collect();
            let bytes = value.as_bytes();
            if bytes.is_empty()
                || !bytes.iter().enumerate().all(|(i, c)| {
                    c.is_ascii_digit()
                        || (i == 0 && matches!(c, b'+' | b'-'))
                        || (*c == b'_'
                            && i > 0
                            && bytes.get(i - 1).is_some_and(u8::is_ascii_digit)
                            && bytes.get(i + 1).is_some_and(u8::is_ascii_digit))
                })
            {
                return None;
            }
            let value = value.replace('_', "");
            value
                .parse()
                .ok()
                .or_else(|| value.parse::<f64>().ok().map(|n| n as i64))
        }
        _ => None,
    }
}

/// Python setdefault('variables', {}), without assuming restored state is an object.
pub(crate) fn variables(world: &mut World) -> Option<&mut Map<String, Json>> {
    world
        .cartridge_mut("manifold.web")?
        .state
        .as_object_mut()?
        .entry("variables")
        .or_insert_with(|| json!({}))
        .as_object_mut()
}

pub(crate) fn dispatch_manifold(
    world: &mut World,
    cmd: &Json,
    out: &mut EventRun,
) -> Option<Commit> {
    if out.failed {
        return None;
    }
    let mounted = world.cartridge("manifold.web").is_some();
    let Some((commit, messages)) = world.dispatch_internal("manifold.web", "player", cmd) else {
        out.failed = mounted;
        return None;
    };
    out.outbound.broadcast.extend(messages);
    Some(commit)
}

// Routes which catch or expose exceptions need the typed cartridge error,
// rather than dispatch_internal's None. Publication order is otherwise identical.
fn dispatch_checked(
    world: &mut World,
    cmd: &Json,
    out: &mut EventRun,
) -> Result<Option<Commit>, DispatchError> {
    let pack = world.pack.clone();
    let Some(cartridge) = world.cartridge_mut("manifold.web") else {
        return Ok(None);
    };
    let commit = cartridge.dispatch("player", cmd, &pack)?;
    out.outbound
        .broadcast
        .extend(world.commit_messages("manifold.web", &commit));
    out.outbound.broadcast.extend(world.story_advance());
    Ok(Some(commit))
}

fn chip_status(world: &mut World) -> Json {
    let vars = variables(world).cloned().unwrap_or_default();
    if !vars.is_empty() {
        return manifold::chip_status_snapshot(&vars, &world.pack);
    }
    let archived = world.pack.chip_status().unwrap_or_else(|| json!({}));
    json!({
        "capacity": archived.get("capacity").filter(|v| truthy(v)).and_then(int_value).unwrap_or(3),
        "heat": 0,
        "coolEveryMs": archived.get("coolEveryMs").filter(|v| truthy(v)).and_then(int_value).unwrap_or(60_000),
        "serverNowMs": now_ms(),
    })
}

fn float_or_zero(value: Option<&Json>) -> f64 {
    match value.filter(|v| truthy(v)) {
        Some(Value::Number(n)) => n.as_f64().unwrap_or(0.0),
        Some(Value::Bool(v)) => f64::from(u8::from(*v)),
        Some(Value::String(s)) => py_trim(s).parse().unwrap_or(0.0),
        _ => 0.0,
    }
}

fn sync_idle(world: &mut World, payload: &Json, out: &mut EventRun) -> Json {
    let mut source = payload
        .get("prestige")
        .and_then(Value::as_object)
        .cloned()
        .unwrap_or_default();
    if let Some(payload) = payload.as_object() {
        source.extend(payload.clone());
    }
    let mut scalar: Map<String, Json> = source
        .into_iter()
        .filter(|(_, v)| v.is_string() || v.is_number() || v.is_boolean())
        .collect();
    for key in [
        "compute",
        "maxCompute",
        "maxComputeThisRun",
        "cap",
        "claimedMementoCount",
    ] {
        if let Some(value) = scalar.get(key) {
            if !value.as_f64().is_some_and(|n| n.is_finite() && n >= 0.0) {
                return json!({"ok": false, "error": format!("invalid {key}")});
            }
        }
    }
    if let Some(previous) = variables(world)
        .and_then(|v| v.get("idle"))
        .and_then(Value::as_object)
    {
        let maximum = float_or_zero(previous.get("maxCompute"))
            .max(float_or_zero(scalar.get("maxCompute")))
            .max(float_or_zero(scalar.get("maxComputeThisRun")));
        scalar.insert("maxCompute".into(), json!(maximum));
    }
    let mut cmd = scalar.clone();
    cmd.insert("type".into(), json!("idle.sync"));
    if dispatch_manifold(world, &Value::Object(cmd), out).is_none() {
        return json!({"ok": false, "error": "manifold unavailable"});
    }
    let cap = scalar.get("cap").and_then(Value::as_f64);
    let run = scalar
        .get("maxComputeThisRun")
        .filter(|v| truthy(v))
        .or_else(|| scalar.get("compute"));
    if cap.is_some_and(|cap| cap > 0.0 && float_or_zero(run) >= cap) {
        dispatch_manifold(
            world,
            &json!({"type": "client.emitFact", "factId": "compute.cap_hit", "source": "idle.sync"}),
            out,
        );
    }
    let prestige = variables(world)
        .and_then(|v| v.get("idle"))
        .and_then(Value::as_object)
        .cloned()
        .unwrap_or_default();
    json!({"ok": true, "prestige": prestige})
}

fn run_manifold_command(
    world: &mut World,
    command: &str,
    payload: &Json,
    out: &mut EventRun,
) -> Result<Json, String> {
    let command = py_trim(command);
    if command.is_empty() {
        return Err("missing command".into());
    }
    if !payload.is_object() {
        return Err("command payload must be an object".into());
    }
    if command == "idle.sync" {
        return Ok(sync_idle(world, payload, out));
    }
    if command == "idle.complete" {
        if !world
            .cartridge("manifold.web")
            .and_then(|c| c.state.pointer("/facts/arg.manifold_unlocked"))
            .is_some_and(truthy)
        {
            return Ok(json!({"ok": false, "error": "manifold is not unlocked"}));
        }
        let count = variables(world)
            .and_then(|v| v.get("idle"))
            .and_then(|idle| idle.get("claimedMementoCount"));
        if count.filter(|n| !n.is_null()).is_some_and(|n| {
            !(n.is_i64() || n.is_u64() || n.is_boolean()) || int_value(n).is_none_or(|n| n < 13)
        }) {
            return Ok(json!({"ok": false, "error": "all 13 mementos are required"}));
        }
        return Ok(
            dispatch_manifold(world, &json!({"type": "idle.complete"}), out)
                .map(|c| c.result)
                .unwrap_or_else(|| json!({"ok": false})),
        );
    }
    if let Some(result) = story_commands::run_story_command(world, command, payload, out) {
        return Ok(result);
    }
    match command {
        "signal.login" => {
            let username = text(payload.get("username"));
            let username = py_trim(&username);
            let expected = text(world.pack.variables().get("signalTempPassword"));
            let password = payload.get("password").and_then(Value::as_str);
            if username.is_empty() || expected.is_empty() || password != Some(expected.as_str()) {
                return Err("invalid Signal credentials".into());
            }
            if world.cartridge("manifold.web").is_some_and(|c| {
                !c.state
                    .pointer("/facts/signal_daniel.unlocked")
                    .is_some_and(truthy)
            }) {
                dispatch_manifold(
                    world,
                    &json!({"type": "client.emitFact", "factId": "signal_daniel.unlocked"}),
                    out,
                );
            }
            return Ok(json!({"ok": true, "username": username}));
        }
        "signal.recover" => {
            let code = text(payload.get("recoveryCode"));
            return Ok(match story::recovery_password(&world.pack, &code) {
                Some(password) => json!({"ok": true, "tempPassword": password}),
                None => json!({"ok": false, "error": "invalid recovery code"}),
            });
        }
        "mail.read" => {
            let id = text(
                payload
                    .get("mailId")
                    .filter(|v| truthy(v))
                    .or_else(|| payload.get("id")),
            );
            let fact = mail::artifacts(&world.pack, now_ms())
                .iter()
                .find(|a| text(a.get("id")) == id)
                .map(|a| text(a.pointer("/data/read_fact")))
                .unwrap_or_default();
            if !fact.is_empty() {
                dispatch_manifold(
                    world,
                    &json!({"type": "client.emitFact", "factId": fact, "source": "mail.read"}),
                    out,
                );
            }
            return Ok(
                json!({"ok": true, "fact": if fact.is_empty() { Value::Null } else { json!(fact) }}),
            );
        }
        "signal.read" => {
            let id = text(payload.get("threadId"));
            let id = py_trim(&id);
            if id.is_empty() {
                return Err("missing threadId".into());
            }
            let threads = messenger::thread_artifacts(&world.pack, now_ms());
            let data = threads
                .iter()
                .find(|a| text(a.pointer("/data/thread_id")) == id)
                .and_then(|a| a.get("data"));
            let mut read_facts = Vec::new();
            if let Some(fact) = data
                .and_then(|d| d.get("read_fact"))
                .and_then(Value::as_str)
                .filter(|id| !id.is_empty())
            {
                read_facts.push(fact.to_string());
            }
            let reread = data.and_then(|d| d.get("reread"));
            let when = reread
                .and_then(|r| r.get("when"))
                .and_then(Value::as_str)
                .filter(|id| !id.is_empty());
            let fact = reread
                .and_then(|r| r.get("read_fact"))
                .and_then(Value::as_str)
                .filter(|id| !id.is_empty());
            if let (Some(when), Some(fact)) = (when, fact) {
                if world
                    .cartridge("manifold.web")
                    .and_then(|c| c.state.get("facts"))
                    .and_then(|f| f.get(when))
                    .is_some_and(truthy)
                    && !read_facts.iter().any(|f| f == fact)
                {
                    read_facts.push(fact.to_string());
                }
            }
            let emitted: Vec<String> = read_facts.into_iter().filter(|fact| dispatch_manifold(world, &json!({"type": "client.emitFact", "factId": fact, "source": "signal.read"}), out).is_some()).collect();
            return Ok(json!({"ok": true, "readFacts": emitted}));
        }
        "browser.bookmarks.list" => {
            let bookmarks = variables(world)
                .and_then(|v| v.get("browserBookmarks"))
                .cloned()
                .unwrap_or_else(|| json!([]));
            return Ok(json!({"bookmarks": bookmarks}));
        }
        "browser.bookmarks.add" | "browser.bookmarks.remove" => {
            let url = text(payload.get("url"));
            let url = py_trim(&url);
            if url.is_empty() {
                return Err("missing url".into());
            }
            let marks = variables(world).and_then(|v| {
                v.entry("browserBookmarks")
                    .or_insert_with(|| json!([]))
                    .as_array_mut()
            });
            let mut count = 0;
            if let Some(marks) = marks {
                let exists = marks
                    .iter()
                    .any(|m| m.get("url").and_then(Value::as_str) == Some(url));
                if command.ends_with("add") && !exists {
                    let title = payload
                        .get("title")
                        .filter(|v| truthy(v))
                        .map(py_string)
                        .unwrap_or_else(|| url.into());
                    marks.push(json!({"url": url, "title": title}));
                } else if command.ends_with("remove") {
                    marks.retain(|m| m.get("url").and_then(Value::as_str) != Some(url));
                }
                count = marks.len();
            }
            // These are direct state writes in Python: no transition/version bump.
            return Ok(json!({"count": count}));
        }
        _ => {}
    }
    let mut fact = text(payload.get("factId"));
    if fact.is_empty()
        && [
            "mail.markRead",
            "mark_mail_read",
            "signal.markRead",
            "signal_login",
            "vault.unlock",
            "unseal_volume",
        ]
        .contains(&command)
    {
        fact = text(
            payload
                .get("artifactId")
                .filter(|v| truthy(v))
                .or_else(|| payload.get("fileId").filter(|v| truthy(v)))
                .or_else(|| payload.get("volumeId")),
        );
    }
    if !fact.is_empty() {
        let commit = dispatch_checked(
            world,
            &json!({"type": "client.emitFact", "factId": fact}),
            out,
        )
        .map_err(|error| {
            let text = match error {
                DispatchError::Rejected(text) | DispatchError::Internal(text) => text,
            };
            format!("fact emission rejected: {text}")
        })?;
        return Ok(json!({"fact": fact, "already": commit.is_none_or(|c| !c.committed)}));
    }
    Ok(json!({"echo": command}))
}

fn bounty_submit(world: &mut World, payload: &Json, out: &mut EventRun) -> Option<String> {
    let file_id = text(payload.get("fileId"));
    let file_id = py_trim(&file_id);
    let url = py_trim(&text(payload.get("url"))).to_lowercase();
    let facts = world
        .cartridge("manifold.web")
        .and_then(|c| c.state.get("facts"))
        .cloned()
        .unwrap_or_else(|| json!({}));
    if !world.full_unlock && !facts.get("bounty.ext_installed").is_some_and(truthy) {
        return None;
    }
    let mut matched = None;
    if !file_id.is_empty() {
        for artifact in files::artifacts(&world.pack, now_ms()) {
            let path = text(artifact.pointer("/data/display_path"));
            let id = text(artifact.get("id"));
            if [
                path.rsplit('/').next().unwrap_or(""),
                path.as_str(),
                id.as_str(),
            ]
            .contains(&file_id)
            {
                let gate = story::FILE_GATE
                    .iter()
                    .find(|(key, _)| *key == id)
                    .map(|(_, gate)| *gate);
                if world.full_unlock || gate.is_none_or(|gate| facts.get(gate).is_some_and(truthy))
                {
                    matched = match id.as_str() {
                        "file.daniel_retraction" => Some("dirt.daniel"),
                        "file.hanyue_consent" => Some("dirt.hanyue_ssh"),
                        "file.futurum_aleph_obs" => Some("dirt.futurum_aleph_obs"),
                        _ => None,
                    };
                }
                break;
            }
        }
    }
    if matched.is_none() && !url.is_empty() {
        matched = world.pack.with_section("browser_pages", |pages| {
            pages.iter().find(|p| {
                url.trim_end_matches('/')
                    == text(p.pointer("/data/url"))
                        .to_lowercase()
                        .trim_end_matches('/')
            })?;
            [
                ("frank_mercer48", "dirt.frank"),
                ("mags_cole", "dirt.maggie"),
                ("jackwhite", "dirt.jack"),
            ]
            .into_iter()
            .find(|(profile, _)| {
                url.contains(&format!("/user/{profile}"))
                    || url.contains(&format!("/snap/{profile}/"))
            })
            .map(|(_, fact)| fact)
        });
        if world.full_unlock
            && ["verify-now.com", "futurum-prize"]
                .iter()
                .any(|hint| url.contains(hint))
        {
            matched = Some("arg.honeypot_access");
        }
    }
    let fact = matched?;
    if world.cartridge("manifold.web").is_some()
        && dispatch_checked(
            world,
            &json!({"type": "client.emitFact", "factId": fact}),
            out,
        )
        .is_err()
    {
        return None;
    }
    Some(fact.into())
}

fn resolve_web_asset(lookup: &str) -> Option<(&str, &str)> {
    let raw = py_trim(lookup);
    let valid = |path: &str| {
        path.starts_with("/webAssets/")
            && path
                .bytes()
                .all(|c| c.is_ascii_alphanumeric() || matches!(c, b'_' | b'.' | b'/' | b'-'))
    };
    let path_part = raw.split_once("://").map(|(_, rest)| rest).unwrap_or(raw);
    let embedded = path_part.find('/').map(|i| &path_part[i..]);
    for candidate in [Some(raw), embedded]
        .into_iter()
        .flatten()
        .filter(|c| valid(c))
    {
        let filename = candidate.rsplit('/').next().unwrap_or("");
        let extension = filename
            .rsplit('.')
            .next()
            .unwrap_or("")
            .to_ascii_lowercase();
        if ![
            "pdf", "png", "jpg", "jpeg", "gif", "svg", "webp", "mp3", "mp4", "woff", "woff2",
        ]
        .contains(&extension.as_str())
        {
            continue;
        }
        let mut components = Vec::new();
        for part in candidate.split('/') {
            match part {
                "" | "." => {}
                ".." => {
                    components.pop();
                }
                part => components.push(part),
            }
        }
        let canonical = format!("/{}", components.join("/"));
        if WEB_ASSETS.binary_search(&canonical.as_str()).is_ok() {
            return Some((candidate, filename));
        }
    }
    None
}

/// All broadcasts precede the one correlated direct reply. Probe channels
/// instead schedule a task, which replies to the requesting socket later.
pub fn handle_event(world: &mut World, message: &Json) -> Outbound {
    handle_event_with_secrets(world, message, &crate::world::Secrets::default())
}

pub(crate) fn handle_event_with_secrets(world: &mut World, message: &Json, secrets: &crate::world::Secrets) -> Outbound {
    let channel = message.get("channel").and_then(Value::as_str).unwrap_or("");
    let cartridge_id = message.get("cartridgeId").cloned().unwrap_or(Value::Null);
    let request_id = message.get("requestId").cloned().unwrap_or(Value::Null);
    let payload = message
        .get("payload")
        .filter(|p| p.is_object())
        .cloned()
        .unwrap_or_else(|| json!({}));
    let mut out = EventRun::default();
    let now = now_ms();
    let (response_channel, result) = match channel {
        "nori.ai.config" => {
            let sanitized = crate::llm::sanitize_ai_config(&payload);
            out.outbound.public_ai = Some(crate::session::public_ai_config(&sanitized));
            let mut result = crate::llm::public_ai_summary(&sanitized);
            result["ok"] = json!(false);
            result["error"] = json!("Browser configuration must be sent with each chat dispatch. Reload Nori.Web to update the settings script.");
            ("nori.ai.config.result".into(), result)
        }
        "nori.ai.test" => {
            out.outbound.tasks.push(Task::ai_test(
                world,
                world.pacing,
                payload,
                cartridge_id,
                request_id,
            ));
            return out.outbound;
        }
        "nori.tts.config" => {
            let mut result = crate::tts::config_result_payload(&payload);
            result["ok"] = json!(false);
            result["error"] = json!("Browser configuration must be sent with each chat dispatch. Reload Nori.Web to update the settings script.");
            ("nori.tts.config.result".into(), result)
        },
        "nori.tts.test" => {
            out.outbound.tasks.push(Task::tts_test(
                world,
                world.pacing,
                &payload,
                cartridge_id,
                request_id,
            ));
            return out.outbound;
        }
        "pictionary.snapshot" => {
            if let Some(task) = world.recognize_drawing(&payload, secrets) {
                out.outbound.broadcast.push(event_message(world, "pictionary.vision.status", json!({"roundId":payload["roundId"],"revision":payload["revision"],"status":"analyzing"}), json!("pictionary"), Value::Null));
                out.outbound.tasks.push(task);
            }
            return out.outbound;
        }
        "manifold.chip.status" => ("manifold.chip.status.result".into(), chip_status(world)),
        "manifold.chip.scan"
        | "manifold.chip.debug_scan"
        | "manifold.chip.debug_reset"
        | "manifold.chip.debug_config" => {
            let mut cmd = match channel {
                "manifold.chip.scan" => json!({"type": "chip.scan"}),
                "manifold.chip.debug_scan" => {
                    json!({"type": "chip.debugScan", "key": text(payload.get("key").filter(|v| truthy(v)).or_else(|| payload.get("contentKey")))})
                }
                "manifold.chip.debug_reset" => json!({"type": "chip.debugReset"}),
                _ => json!({"type": "chip.debugConfig"}),
            };
            let keys: &[&str] = match channel {
                "manifold.chip.scan" => &["key", "appId", "windowType", "contentKey", "title"],
                "manifold.chip.debug_scan" => &["contentKey", "title", "readout"],
                "manifold.chip.debug_config" => {
                    &["capacity", "coolEveryMs", "heat", "neverOverheat"]
                }
                _ => &[],
            };
            if let Some(cmd) = cmd.as_object_mut() {
                for key in keys {
                    if let Some(value) = payload.get(*key) {
                        cmd.insert((*key).into(), value.clone());
                    }
                }
            }
            let result = dispatch_manifold(world, &cmd, &mut out)
                .map(|c| c.result)
                .filter(|v| channel != "manifold.chip.debug_config" || truthy(v))
                .unwrap_or_else(|| {
                    if channel == "manifold.chip.scan" {
                        json!({"kind": "unsupported", "text": "[chip] manifold link unavailable"})
                    } else {
                        json!({"ok": false, "error": "manifold unavailable"})
                    }
                });
            if channel == "manifold.chip.scan" && result.get("kind").and_then(Value::as_str) == Some("readout") {
                let key = text(payload.get("contentKey").filter(|v| truthy(v)).or_else(|| payload.get("key")));
                let tail = key.split_once(':').map(|(_, tail)| tail).unwrap_or(&key);
                let content = crate::llm::text_limit(payload.get("content"), 12_000);
                let title = crate::llm::text_limit(payload.get("title"), 200);
                let context = crate::ai_features::chip_context(&world.locale, &title, &content);
                let cached = world.cartridge("manifold.web").and_then(|c| c.state.pointer("/variables/chipScans")).and_then(Value::as_array)
                    .and_then(|scans| scans.iter().rev().find(|entry| entry.get("key").and_then(Value::as_str).is_some_and(|candidate| candidate == key || candidate.split_once(':').map(|(_, tail)| tail).unwrap_or(candidate) == tail)))
                    .filter(|entry| entry.get("readoutContext").and_then(Value::as_str) == Some(context.as_str()))
                    .and_then(|entry| entry.get("readout")).and_then(Value::as_str).filter(|text| !text.trim().is_empty());
                if let Some(cached) = cached {
                    let cached = cached.to_string();
                    out.outbound.direct.push(event_message(world, "manifold.chip.scan.result", json!({"kind":"readout","text":cached}), cartridge_id, request_id));
                    return out.outbound;
                }
                if !content.is_empty() {
                    out.outbound.tasks.push(Task::ai_feature(world, crate::ai_features::Feature::Chip {
                        key, content, title, context, cartridge: cartridge_id, request: request_id,
                    }, secrets.clone()));
                    return out.outbound;
                }
            }
            (format!("{channel}.result"), result)
        }
        "ambient.trigger" => {
            let cfg = variables(world).and_then(|v| {
                v.entry("ambient")
                    .or_insert_with(|| json!({}))
                    .as_object_mut()
            });
            let read = |key, default| {
                cfg.as_ref()
                    .and_then(|c| c.get(key))
                    .filter(|v| truthy(v))
                    .and_then(int_value)
                    .unwrap_or(default)
            };
            (
                "ambient.trigger.result".into(),
                json!({"quietGapMs": read("quietGapMs", 60_000), "cooldownMs": read("cooldownMs", 120_000), "sessionBudget": read("sessionBudget", 3)}),
            )
        }
        "ambient.debug_config" => {
            if let Some(cfg) = variables(world).and_then(|v| {
                v.entry("ambient")
                    .or_insert_with(|| json!({}))
                    .as_object_mut()
            }) {
                for key in ["quietGapMs", "cooldownMs", "sessionBudget"] {
                    if let Some(value) = payload.get(key).filter(|v| {
                        (v.is_i64() || v.is_u64() || v.is_boolean())
                            && int_value(v).is_some_and(|n| n >= 0)
                    }) {
                        cfg.insert(key.into(), value.clone());
                    }
                }
            }
            ("ambient.debug_config.result".into(), json!({"ok": true}))
        }
        "manifold.command.request" => {
            let command = payload.get("command").map(py_string).unwrap_or_default();
            let sub = payload
                .get("payload")
                .filter(|v| truthy(v))
                .cloned()
                .unwrap_or_else(|| json!({}));
            let result = match run_manifold_command(world, &command, &sub, &mut out) {
                Ok(result) => json!({"ok": true, "result": result}),
                Err(error) => json!({"ok": false, "error": error}),
            };
            ("manifold.command.response".into(), result)
        }
        "nori_open_game" | "nori_close_game" | "nori_talk.request" | "notification.debug.push" => {
            // Python obtains variables even for the shell-only acknowledgements.
            let vars = variables(world);
            if channel == "nori_open_game" {
                if let Some(launched) = vars.and_then(|v| {
                    v.entry("launchedGames")
                        .or_insert_with(|| json!([]))
                        .as_array_mut()
                }) {
                    launched.push(json!({"gameId": payload.get("gameId").unwrap_or(&Value::Null), "atMs": now}));
                }
            }
            let result = if channel == "notification.debug.push" {
                let id = payload
                    .get("id")
                    .filter(|v| truthy(v))
                    .map(py_string)
                    .unwrap_or_else(|| format!("note-{now}"));
                let title = payload
                    .get("title")
                    .filter(|v| truthy(v))
                    .map(py_string)
                    .unwrap_or_else(|| "NoriOS".into());
                let mut note = json!({"id": id, "title": title});
                if let Some(note) = note.as_object_mut() {
                    for key in ["subtitle", "body", "durationMs", "onClick"] {
                        if let Some(value) = payload.get(key) {
                            note.insert(key.into(), value.clone());
                        }
                    }
                }
                out.outbound.broadcast.push(event_message(
                    world,
                    "notification.pushed",
                    note,
                    Value::Null,
                    Value::Null,
                ));
                json!({"ok": true, "pushed": id})
            } else if channel == "nori_talk.request" {
                json!({"type": "noop"})
            } else {
                json!({"ok": true})
            };
            (format!("{channel}.result"), result)
        }
        "manifold.bounty.submit" => {
            let result = match bounty_submit(world, &payload, &mut out) {
                Some(fact) => json!({"ok": true, "fact": fact}),
                None => json!({"ok": false}),
            };
            ("manifold.bounty.submit.result".into(), result)
        }
        "idle.sync" => {
            let mut result = sync_idle(world, &payload, &mut out);
            if result.get("ok").is_some_and(truthy) {
                if let Some(prestige) = payload.get("prestige").filter(|v| v.is_object()) {
                    if let Some(result) = result.as_object_mut() {
                        result.insert("prestige".into(), prestige.clone());
                    }
                }
            }
            ("idle.sync.result".into(), result)
        }
        "manifold.artifacts.request" => {
            let kind = payload.get("artifactType").unwrap_or(&Value::Null);
            let wants = |name: &str| kind.is_null() || kind.as_str() == Some(name);
            let mut artifacts = Vec::new();
            if wants("mail") {
                artifacts.extend(mail::artifacts(&world.pack, now));
            }
            if wants("file") {
                artifacts.extend(files::artifacts(&world.pack, now));
            }
            if wants("app") {
                artifacts.extend(story_commands::app_artifacts());
            }
            if wants("signal_thread") {
                artifacts.extend(messenger::thread_artifacts(&world.pack, now));
            }
            if wants("signal_message") {
                artifacts.extend(messenger::message_artifacts(&world.pack, now));
            }
            if !world.full_unlock {
                let facts = world
                    .cartridge("manifold.web")
                    .and_then(|c| c.state.get("facts"))
                    .cloned()
                    .unwrap_or_else(|| json!({}));
                artifacts = story::present_artifacts(artifacts, &facts);
            }
            (
                "manifold.artifacts.response".into(),
                json!({"ok": true, "artifacts": artifacts}),
            )
        }
        "manifold.artifacts.fetch" => {
            let lookup = payload
                .get("lookup_key")
                .and_then(Value::as_str)
                .unwrap_or("");
            let result = if payload.get("artifactType").and_then(Value::as_str)
                == Some("browser_page")
                && !lookup.is_empty()
            {
                if let Some((path, filename)) = resolve_web_asset(lookup) {
                    let html = format!("<!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>{filename}</title><style>html,body{{margin:0;padding:0;height:100%;background:#111}}>embed,iframe{{width:100%;height:100%;border:0;display:block}}</style></head><body><embed src=\"{path}\" type=\"application/pdf\"><iframe src=\"{path}\" title=\"{filename}\" style=\"position:absolute;inset:0\"></iframe></body></html>");
                    json!({"ok": true, "artifact": {"id": format!("webasset.{filename}"), "type": "browser_page", "data": {"url": lookup, "supported_locales": ["zh-CN"], "title": filename, "body_html": html, "allowed_commands": [], "favicon": null}}})
                } else {
                    json!({"ok": true, "artifact": {"id": lookup, "type": "browser_page", "data": browser::page(&world.pack, lookup)}})
                }
            } else {
                json!({"ok": false, "status": 404})
            };
            ("manifold.artifacts.fetch.response".into(), result)
        }
        "manifold.dev.jump.request" => {
            let cmd = json!({"type": "client.emitFacts", "factIds": payload.get("facts").cloned().unwrap_or_else(|| json!([]))});
            let result = match dispatch_checked(world, &cmd, &mut out) {
                Ok(commit) => {
                    json!({"ok": true, "count": commit.as_ref().and_then(|c| c.result.get("count")).cloned().unwrap_or(json!(0)), "committed": commit.is_some_and(|c| c.committed)})
                }
                Err(DispatchError::Rejected(error)) => json!({"ok": false, "error": error}),
                // Python catches CommandRejected here, not generic exceptions.
                Err(DispatchError::Internal(_)) => return out.outbound,
            };
            ("manifold.dev.jump.response".into(), result)
        }
        "settings.network.test" => (
            "settings.network.test.result".into(),
            json!({"ok": true, "rttMs": 0}),
        ),
        _ => (format!("{channel}.result"), json!({"ok": true})),
    };
    if !out.failed {
        out.outbound.direct.push(event_message(
            world,
            &response_channel,
            result,
            cartridge_id,
            request_id,
        ));
    }
    out.outbound
}

// Frozen existence inventory of the shipped public/webAssets files. Python
// checks the filesystem; wasm cannot. Keep sorted when shipped assets change.
const WEB_ASSETS: &[&str] = &[
    "/webAssets/buckonair/ep1.mp3",
    "/webAssets/buckonair/ep2.mp3",
    "/webAssets/buckonair/ep3.mp3",
    "/webAssets/buckonair/favicon.svg",
    "/webAssets/buckonair/fist.svg",
    "/webAssets/buckonair/fonts/_generated/lato-400.woff2",
    "/webAssets/buckonair/fonts/_generated/lato-700.woff2",
    "/webAssets/buckonair/fonts/_generated/lato-900.woff2",
    "/webAssets/buckonair/fonts/_generated/montserrat-600.woff2",
    "/webAssets/buckonair/fonts/_generated/montserrat-700.woff2",
    "/webAssets/buckonair/fonts/_generated/montserrat-800.woff2",
    "/webAssets/buckonair/fonts/_generated/noto-sans-sc-400.woff2",
    "/webAssets/buckonair/fonts/_generated/noto-sans-sc-700.woff2",
    "/webAssets/buckonair/fonts/_generated/noto-sans-sc-900.woff2",
    "/webAssets/buckonair/fonts/_generated/pt-sans-400.woff2",
    "/webAssets/buckonair/fonts/_generated/pt-sans-700.woff2",
    "/webAssets/buckonair/fonts/_generated/rubik-400.woff2",
    "/webAssets/buckonair/fonts/_generated/rubik-500.woff2",
    "/webAssets/buckonair/fonts/_generated/rubik-600.woff2",
    "/webAssets/buckonair/fonts/_generated/rubik-700.woff2",
    "/webAssets/buckonair/fonts/_generated/zcool-qingke-huangyou-400.woff2",
    "/webAssets/buckonair/gpt-emp-case.jpg",
    "/webAssets/buckonair/gpt-foil-headband.jpg",
    "/webAssets/buckonair/hero@2x.png",
    "/webAssets/buckonair/leader@2x.png",
    "/webAssets/buckonair/pexels-13709660-cctv.jpg",
    "/webAssets/buckonair/pexels-13779116-powder.jpg",
    "/webAssets/buckonair/pexels-14540985-studio.jpg",
    "/webAssets/buckonair/pexels-17489151-servers.jpg",
    "/webAssets/buckonair/pexels-352505-mic.jpg",
    "/webAssets/buckonair/pexels-38155426-buck.jpg",
    "/webAssets/buckonair/pexels-8532616-tee.jpg",
    "/webAssets/buckonair/unsplash-GsQ0iSb88HY-storm-wide.jpg",
    "/webAssets/buckonair/unsplash-jnnSoT7jhBU-bottle-cut.png",
    "/webAssets/concord/cosmos-stamp.png",
    "/webAssets/concord/favicon.svg",
    "/webAssets/concord/jack_bgm.mp3",
    "/webAssets/concord/peony-keyed-loop.webp",
    "/webAssets/concord/portrait-cutout.png",
    "/webAssets/concord/poster.jpg",
    "/webAssets/concord/simli-concord.woff2",
    "/webAssets/concord/valley-480.mp4",
    "/webAssets/cult_beneath/banner.gif",
    "/webAssets/cult_beneath/hr.gif",
    "/webAssets/cult_beneath/seal.gif",
    "/webAssets/cult_beneath/startile.gif",
    "/webAssets/cult_beneath/witness1.gif",
    "/webAssets/cult_beneath/witness2.gif",
    "/webAssets/cult_beneath/witness3.gif",
    "/webAssets/docs/ft-clr-q3-311.pdf",
    "/webAssets/docs/futurum-aleph-obs.pdf",
    "/webAssets/docs/meridian-aleph-buyoff.pdf",
    "/webAssets/docs/researcher-paper.pdf",
    "/webAssets/doodle/favicon.svg",
    "/webAssets/driftnet/favicon.svg",
    "/webAssets/driftnet/fonts/_generated/ibm-plex-mono-400.woff2",
    "/webAssets/driftnet/fonts/_generated/ibm-plex-mono-500.woff2",
    "/webAssets/driftnet/fonts/_generated/ibm-plex-mono-600.woff2",
    "/webAssets/driftnet/fonts/_generated/noto-sans-sc-400.woff2",
    "/webAssets/driftnet/fonts/_generated/noto-sans-sc-500.woff2",
    "/webAssets/files/tower.jpg",
    "/webAssets/futurum/favicon.svg",
    "/webAssets/futurum/fonts/_generated/jetbrains-mono-400.woff2",
    "/webAssets/futurum/fonts/_generated/jetbrains-mono-500.woff2",
    "/webAssets/futurum/fonts/_generated/jetbrains-mono-600.woff2",
    "/webAssets/futurum/fonts/_generated/noto-sans-sc-300.woff2",
    "/webAssets/futurum/fonts/_generated/noto-sans-sc-400.woff2",
    "/webAssets/futurum/fonts/_generated/noto-sans-sc-500.woff2",
    "/webAssets/futurum/fonts/_generated/noto-sans-sc-700.woff2",
    "/webAssets/futurum/fonts/_generated/sora-400.woff2",
    "/webAssets/futurum/fonts/_generated/sora-500.woff2",
    "/webAssets/futurum/fonts/_generated/sora-600.woff2",
    "/webAssets/futurum/fonts/_generated/sora-700.woff2",
    "/webAssets/futurum_archive/aleph-obs-1.png",
    "/webAssets/futurum_archive/aleph-obs-2.png",
    "/webAssets/futurum_archive/aleph-unk-1.png",
    "/webAssets/futurum_archive/aleph-unk-2.png",
    "/webAssets/futurum_archive/aleph-unk-3.png",
    "/webAssets/futurum_archive/aleph-unk-4.png",
    "/webAssets/futurum_archive/favicon.svg",
    "/webAssets/futurum_archive/fonts/_generated/inter-400.woff2",
    "/webAssets/futurum_archive/fonts/_generated/inter-500.woff2",
    "/webAssets/futurum_archive/fonts/_generated/inter-600.woff2",
    "/webAssets/futurum_archive/fonts/_generated/noto-sans-sc-400.woff2",
    "/webAssets/futurum_archive/fonts/_generated/noto-sans-sc-500.woff2",
    "/webAssets/futurum_archive/fonts/_generated/noto-sans-sc-600.woff2",
    "/webAssets/futurum_archive/si-eval-1.png",
    "/webAssets/futurum_archive/si-eval-2.png",
    "/webAssets/hanyue_blog/favicon.svg",
    "/webAssets/mail/unknown-room-4a1441343515.jpg",
    "/webAssets/mail/void.png",
    "/webAssets/manifold_inst/favicon.svg",
    "/webAssets/manifold_inst/fonts/_generated/ibm-plex-mono-400.woff2",
    "/webAssets/manifold_inst/fonts/_generated/ibm-plex-mono-500.woff2",
    "/webAssets/manifold_inst/fonts/_generated/ibm-plex-mono-600.woff2",
    "/webAssets/manifold_inst/fonts/_generated/noto-serif-sc-400.woff2",
    "/webAssets/manifold_inst/fonts/_generated/noto-serif-sc-500.woff2",
    "/webAssets/manifold_inst/fonts/_generated/noto-serif-sc-600.woff2",
    "/webAssets/manifold_inst/fonts/_generated/noto-serif-sc-700.woff2",
    "/webAssets/manifold_inst/fonts/_generated/spectral-400.woff2",
    "/webAssets/manifold_inst/fonts/_generated/spectral-500.woff2",
    "/webAssets/manifold_inst/fonts/_generated/spectral-600.woff2",
    "/webAssets/manifold_inst/fonts/_generated/spectral-700.woff2",
    "/webAssets/meridian_post/favicon.svg",
    "/webAssets/meridian_post/fonts/_generated/noto-sans-sc-400.woff2",
    "/webAssets/meridian_post/fonts/_generated/noto-sans-sc-500.woff2",
    "/webAssets/meridian_post/fonts/_generated/noto-sans-sc-700.woff2",
    "/webAssets/meridian_post/fonts/_generated/noto-serif-sc-400.woff2",
    "/webAssets/meridian_post/fonts/_generated/noto-serif-sc-500.woff2",
    "/webAssets/meridian_post/fonts/_generated/noto-serif-sc-600.woff2",
    "/webAssets/meridian_post/fonts/_generated/noto-serif-sc-700.woff2",
    "/webAssets/meridian_post/fonts/_generated/noto-serif-sc-900.woff2",
    "/webAssets/meridian_post/fonts/_generated/unifrakturmaguntia-400.woff2",
    "/webAssets/meridian_post/pexels-11720316.jpg",
    "/webAssets/meridian_post/pexels-12060425.jpg",
    "/webAssets/meridian_post/pexels-12875546.jpg",
    "/webAssets/meridian_post/pexels-14553829.jpg",
    "/webAssets/meridian_post/pexels-15591206.jpg",
    "/webAssets/meridian_post/pexels-16705852.jpg",
    "/webAssets/meridian_post/pexels-17486595.jpg",
    "/webAssets/meridian_post/pexels-17489157.jpg",
    "/webAssets/meridian_post/pexels-18897265.jpg",
    "/webAssets/meridian_post/pexels-263402.jpg",
    "/webAssets/meridian_post/pexels-27277171.jpg",
    "/webAssets/meridian_post/pexels-28437443.jpg",
    "/webAssets/meridian_post/pexels-29982465.jpg",
    "/webAssets/meridian_post/pexels-30429912.jpg",
    "/webAssets/meridian_post/pexels-32266781.jpg",
    "/webAssets/meridian_post/pexels-32845700.jpg",
    "/webAssets/meridian_post/pexels-33824654.jpg",
    "/webAssets/meridian_post/pexels-34728839.jpg",
    "/webAssets/meridian_post/pexels-34774346.jpg",
    "/webAssets/meridian_post/pexels-36442043.jpg",
    "/webAssets/meridian_post/pexels-36494117.jpg",
    "/webAssets/meridian_post/pexels-6167333.jpg",
    "/webAssets/meridian_post/pexels-7663284.jpg",
    "/webAssets/meridian_post/pexels-8539945.jpg",
    "/webAssets/meridian_post/pexels-8673896.jpg",
    "/webAssets/nas/deep-dive-consent-review.pdf",
    "/webAssets/pulse/5ea6b49f-3df5-454f-9fdb-4a6040018a3f.jpg",
    "/webAssets/pulse/621ebd71-171a-45e5-b6e6-e51208e091d9.jpg",
    "/webAssets/pulse/avatar-buck-pexels-38155426.jpg",
    "/webAssets/pulse/avatar-frank-unsplash-84E44EdD18o.jpg",
    "/webAssets/pulse/avatar-jack.jpg",
    "/webAssets/pulse/avatar-lixiang-unsplash-cCOkKfw4TUc.jpg",
    "/webAssets/pulse/avatar-maggie-pexels-9534280.jpg",
    "/webAssets/pulse/banner-buck-hero.jpg",
    "/webAssets/pulse/c00e0bab-862b-4948-9a29-ff3b49d53cc8.jpg",
    "/webAssets/pulse/c41cffa3-e1a2-427d-b58f-99c05fa81154.jpg",
    "/webAssets/pulse/close-up-of-hands-lighting-candles-on-birthday-cak-2026-01-06-09-24-45-utc.jpg",
    "/webAssets/pulse/dan-cat-01.png",
    "/webAssets/pulse/dan-cat-02.png",
    "/webAssets/pulse/dan-cat-03.png",
    "/webAssets/pulse/dan-cat-04.png",
    "/webAssets/pulse/dan-cat-05.png",
    "/webAssets/pulse/dan-cat-06.png",
    "/webAssets/pulse/dan-cat-07.png",
    "/webAssets/pulse/dan-cat-08.png",
    "/webAssets/pulse/dan-cat-09.png",
    "/webAssets/pulse/daniel-avatar.png",
    "/webAssets/pulse/favicon.svg",
    "/webAssets/pulse/fc8c7cec-cceb-4b34-8ae7-9b323a955cd8.jpg",
    "/webAssets/pulse/fonts/_generated/jetbrains-mono-400.woff2",
    "/webAssets/pulse/fonts/_generated/jetbrains-mono-700.woff2",
    "/webAssets/pulse/fonts/_generated/noto-sans-sc-400.woff2",
    "/webAssets/pulse/fonts/_generated/noto-sans-sc-500.woff2",
    "/webAssets/pulse/fonts/_generated/noto-sans-sc-700.woff2",
    "/webAssets/pulse/fonts/_generated/noto-sans-sc-900.woff2",
    "/webAssets/pulse/front-view-fresh-juicy-orange-on-dark-background-c-2026-03-18-13-45-09-utc.jpg",
    "/webAssets/pulse/futurum-avatar.png",
    "/webAssets/pulse/futurum-banner.png",
    "/webAssets/pulse/hanyue-card.png",
    "/webAssets/pulse/kaifeng-chicken-breakfast.jpg",
    "/webAssets/pulse/memorachain-card.png",
    "/webAssets/pulse/meridian-avatar.png",
    "/webAssets/pulse/meridian-banner.png",
    "/webAssets/pulse/pexels-14553829.jpg",
    "/webAssets/pulse/pexels-17486595.jpg",
    "/webAssets/pulse/pexels-18897265.jpg",
    "/webAssets/pulse/pexels-263402.jpg",
    "/webAssets/pulse/pexels-28437443.jpg",
    "/webAssets/pulse/pexels-34774346.jpg",
    "/webAssets/pulse/pexels-36494117.jpg",
    "/webAssets/pulse/pexels-8539945.jpg",
    "/webAssets/pulse/pexels-8673896.jpg",
    "/webAssets/pulse/post-jack-fiveyear-plan.png",
    "/webAssets/pulse/post-jack-nightshift.jpg",
    "/webAssets/signal/dan-cat-01.png",
    "/webAssets/signal/dan-cat-02.png",
    "/webAssets/signal/dan-cat-06.png",
    "/webAssets/signal/daniel-avatar.png",
    "/webAssets/timecapsule/favicon.svg",
    "/webAssets/timecapsule/fonts/_generated/jetbrains-mono-400.woff2",
    "/webAssets/timecapsule/fonts/_generated/jetbrains-mono-500.woff2",
    "/webAssets/timecapsule/fonts/_generated/jetbrains-mono-600.woff2",
    "/webAssets/timecapsule/fonts/_generated/jetbrains-mono-700.woff2",
    "/webAssets/timecapsule/fonts/_generated/noto-sans-sc-300.woff2",
    "/webAssets/timecapsule/fonts/_generated/noto-sans-sc-400.woff2",
    "/webAssets/timecapsule/fonts/_generated/noto-sans-sc-500.woff2",
    "/webAssets/timecapsule/fonts/_generated/noto-sans-sc-700.woff2",
    "/webAssets/timecapsule/fonts/_generated/noto-sans-sc-800.woff2",
    "/webAssets/timecapsule/fonts/_generated/noto-sans-sc-900.woff2",
];

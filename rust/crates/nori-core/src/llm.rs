//! Browser/server LLM configuration and synchronous, sans-I/O provider flows.
//! Python reads LLM responses uncapped. These flows deliberately cap decoded
//! responses at 4 MiB; an oversized success is an unsupported response format.

use crate::config::ServerAi;
use crate::jsonutil::Json;
use crate::provider::{FlowStep, HttpRequest, HttpResult};
use serde_json::{json, Value};

pub const EMOTIONS: &[&str] = &[
    "happy",
    "excited",
    "sad",
    "angry",
    "fearful",
    "disgusted",
    "surprised",
    "doubtful",
    "dizzy",
    "serious",
    "neutral",
];
pub const EMOTION_ALIASES: &[(&str, &str)] = &[
    ("smile", "happy"),
    ("kirakira", "excited"),
    ("shy", "happy"),
    ("dark", "serious"),
    ("tears", "sad"),
    ("troubled", "doubtful"),
    ("doubt", "doubtful"),
    ("speechless", "neutral"),
    ("sleep", "neutral"),
];
pub const DEFAULT_PERSONA_PROMPT: &str = "You are Nori, the AI companion inside NoriOS. Be warm, concise,\ncurious, and helpful. Reply in the user's language when practical. Avoid\nclaiming actions you have not performed.";
pub const EMOTION_PROTOCOL_PROMPT: &str = "NoriOS rendering contract: start every answer with exactly one emotion tag\nselected from happy, excited, sad, angry, fearful, disgusted, surprised,\ndoubtful, dizzy, serious, neutral. Example: [emotion:happy] 你好！";
pub const SYSTEM_PROMPT: &str = "You are Nori, the AI companion inside NoriOS. Be warm, concise,\ncurious, and helpful. Reply in the user's language when practical. Avoid\nclaiming actions you have not performed.\n\nNoriOS rendering contract: start every answer with exactly one emotion tag\nselected from happy, excited, sad, angry, fearful, disgusted, surprised,\ndoubtful, dizzy, serious, neutral. Example: [emotion:happy] 你好！";
pub const REUNION_LINES: &[&str] = &[
    "欢迎回来，操作员。世界可能有点不一样了……但我还是我。",
    "信号灯还亮着呢。只要你拨号，我就一定会在。",
];
pub const MAX_LLM_BYTES: usize = 4 * 1024 * 1024;
const FORMAT_ERROR: &str = "Provider returned an unsupported response format";

pub fn extract_emotion(text: &str) -> (String, String) {
    // re.search(r"\[emotion:([a-zA-Z_]+)\]"): malformed earlier tags
    // must not hide a later valid one; only the first valid tag is removed.
    for (start, _) in text.match_indices("[emotion:") {
        let tail = &text[start + "[emotion:".len()..];
        let Some(end) = tail.find(']') else { continue };
        let tag = &tail[..end];
        if tag.is_empty() || !tag.bytes().all(|b| b.is_ascii_alphabetic() || b == b'_') {
            continue;
        }
        let raw = tag.to_ascii_lowercase();
        let emotion = if EMOTIONS.contains(&raw.as_str()) {
            raw.as_str()
        } else {
            EMOTION_ALIASES
                .iter()
                .find(|(key, _)| *key == raw)
                .map(|(_, value)| *value)
                .unwrap_or("neutral")
        };
        let cleaned = format!("{}{}", &text[..start], &tail[end + 1..]);
        return (emotion.into(), py_trim(&cleaned).into());
    }
    ("neutral".into(), py_trim(text).into())
}

pub(crate) fn py_trim(text: &str) -> &str {
    text.trim_matches(|c: char| c.is_whitespace() || ('\u{1c}'..='\u{1f}').contains(&c))
}

pub(crate) fn text_limit(value: Option<&Value>, limit: usize) -> String {
    py_trim(value.and_then(Value::as_str).unwrap_or(""))
        .chars()
        .take(limit)
        .collect()
}

pub(crate) fn number(value: Option<&Value>, default: f64, low: f64, high: f64) -> f64 {
    let parsed = match value {
        Some(Value::Number(n)) => n.as_f64(),
        Some(Value::String(s)) => numeric_text(s).and_then(|s| s.parse::<f64>().ok()),
        _ => None,
    }
    .unwrap_or(default);
    // Python max(low, min(high, nan)) returns high, not NaN.
    if parsed.is_nan() {
        high
    } else {
        parsed.clamp(low, high)
    }
}

/// Python numeric conversion and regex `\d` accept Unicode decimal digits.
/// Zero codepoints for Unicode 15.1 Nd blocks (the reference Python's table).
pub(crate) fn decimal_digit(c: char) -> Option<u32> {
    if let Some(digit) = c.to_digit(10) {
        return Some(digit);
    }
    const ZEROES: &[u32] = &[
        0x660, 0x6f0, 0x7c0, 0x966, 0x9e6, 0xa66, 0xae6, 0xb66, 0xbe6, 0xc66, 0xce6, 0xd66, 0xde6,
        0xe50, 0xed0, 0xf20, 0x1040, 0x1090, 0x17e0, 0x1810, 0x1946, 0x19d0, 0x1a80, 0x1a90,
        0x1b50, 0x1bb0, 0x1c40, 0x1c50, 0xa620, 0xa8d0, 0xa900, 0xa9d0, 0xa9f0, 0xaa50, 0xabf0,
        0xff10, 0x104a0, 0x10d30, 0x11066, 0x110f0, 0x11136, 0x111d0, 0x112f0, 0x11450, 0x114d0,
        0x11650, 0x116c0, 0x11730, 0x118e0, 0x11950, 0x11c50, 0x11d50, 0x11da0, 0x11f50, 0x16a60,
        0x16ac0, 0x16b50, 0x1d7ce, 0x1d7d8, 0x1d7e2, 0x1d7ec, 0x1d7f6, 0x1e140, 0x1e2f0, 0x1e4f0,
        0x1e950, 0x1fbf0,
    ];
    ZEROES
        .iter()
        .find_map(|zero| (c as u32).checked_sub(*zero).filter(|digit| *digit < 10))
}

fn numeric_text(text: &str) -> Option<String> {
    let text: String = text
        .trim()
        .chars()
        .map(|c| {
            decimal_digit(c)
                .and_then(|n| char::from_digit(n, 10))
                .unwrap_or(c)
        })
        .collect();
    let bytes = text.as_bytes();
    if bytes.iter().enumerate().any(|(i, b)| {
        *b == b'_'
            && (i == 0
                || i + 1 == bytes.len()
                || !bytes[i - 1].is_ascii_digit()
                || !bytes[i + 1].is_ascii_digit())
    }) {
        return None;
    }
    Some(text.replace('_', ""))
}

fn integer(value: Option<&Value>, default: i64, low: i64, high: i64) -> i64 {
    let parsed = match value {
        Some(Value::Number(n)) => n.as_f64().map(|n| n.trunc() as i64),
        Some(Value::String(s)) => numeric_text(s).and_then(|s| {
            let (negative, digits) = if let Some(digits) = s.strip_prefix('-') {
                (true, digits)
            } else {
                (false, s.strip_prefix('+').unwrap_or(&s))
            };
            if digits.is_empty() || !digits.bytes().all(|b| b.is_ascii_digit()) {
                return None;
            }
            let n = digits.bytes().fold(0i64, |n, b| {
                n.saturating_mul(10).saturating_add(i64::from(b - b'0'))
            });
            Some(if negative { -n } else { n })
        }),
        _ => None,
    }
    .unwrap_or(default);
    parsed.clamp(low, high)
}

/// `urlsplit` validation without adding a URL dependency. The original (trimmed,
/// length-limited) spelling is returned, as in Python; tabs/newlines are removed
/// only for parsing. Ports are deliberately not validated (`hostname`, not `port`).
pub(crate) fn base_url(value: Option<&Value>) -> String {
    let raw = text_limit(value, 1000).trim_end_matches('/').to_string();
    let parsed: String = raw
        .chars()
        .filter(|c| !matches!(c, '\t' | '\r' | '\n'))
        .collect();
    let parsed = parsed.trim_start_matches(|c: char| c <= '\u{20}');
    let Some((scheme, rest)) = parsed.split_once("://") else {
        return String::new();
    };
    if !scheme.eq_ignore_ascii_case("http") && !scheme.eq_ignore_ascii_case("https") {
        return String::new();
    }
    let authority = rest.split(['/', '?', '#']).next().unwrap_or("");
    if authority.contains('@') {
        return String::new();
    }
    let hostname = if authority.contains('[') || authority.contains(']') {
        let Some(after) = authority.strip_prefix('[') else {
            return String::new();
        };
        let Some((host, port)) = after.split_once(']') else {
            return String::new();
        };
        if !port.is_empty() && !port.starts_with(':') {
            return String::new();
        }
        let ipvfuture = host.strip_prefix('v').is_some_and(|v| {
            v.split_once('.').is_some_and(|(version, address)| {
                !version.is_empty()
                    && version.bytes().all(|b| b.is_ascii_hexdigit())
                    && !address.is_empty()
            })
        });
        let (address, scope) = host
            .split_once('%')
            .map(|(a, s)| (a, Some(s)))
            .unwrap_or((host, None));
        if !ipvfuture
            && (address.parse::<std::net::Ipv6Addr>().is_err()
                || scope.is_some_and(|s| s.is_empty() || s.contains('%')))
        {
            return String::new();
        }
        host
    } else {
        authority.split(':').next().unwrap_or("")
    };
    // Characters whose NFKC decomposition introduces netloc delimiters are
    // rejected by urllib. These are the delimiter compatibility forms.
    if hostname.is_empty()
        || authority.contains([
            '⁇', '⁈', '⁉', '℀', '℁', '℅', '℆', '⩴', '︓', '︖', '﹕', '﹖', '﹟', '﹫', '＃', '／',
            '：', '？', '＠',
        ])
    {
        return String::new();
    }
    raw
}

pub fn normalize_provider_base_url(value: &Json, provider: &str) -> String {
    let base = base_url(Some(value));
    let suffix = if provider == "anthropic" {
        "/messages"
    } else {
        "/chat/completions"
    };
    if base.to_ascii_lowercase().ends_with(suffix) {
        base[..base.len() - suffix.len()]
            .trim_end_matches('/')
            .into()
    } else {
        base
    }
}

pub fn sanitize_ai_config(raw: &Json) -> Json {
    let provider = text_limit(raw.get("provider"), 40).to_lowercase();
    let provider = if provider == "anthropic" {
        "anthropic"
    } else {
        "openai-compatible"
    };
    json!({
        "enabled": raw.get("enabled").and_then(Value::as_bool) == Some(true),
        "provider": provider,
        "baseUrl": normalize_provider_base_url(raw.get("baseUrl").unwrap_or(&Value::Null), provider),
        "model": text_limit(raw.get("model"), 200),
        "apiKey": text_limit(raw.get("apiKey"), 2048),
        "systemPrompt": text_limit(raw.get("systemPrompt"), 16000),
        "characterPrompt": text_limit(raw.get("characterPrompt"), 16000),
        "temperature": number(raw.get("temperature"), 0.75, 0.0, 2.0),
        "maxTokens": integer(raw.get("maxTokens"), 350, 32, 4096),
    })
}

pub(crate) fn string<'a>(value: &'a Json, key: &str, fallback: &'a str) -> &'a str {
    value
        .get(key)
        .and_then(Value::as_str)
        .filter(|s| !s.is_empty())
        .unwrap_or(fallback)
}

pub(crate) fn truthy(value: &Value) -> bool {
    match value {
        Value::Null => false,
        Value::Bool(b) => *b,
        Value::Number(n) => n.as_f64().is_some_and(|v| v != 0.0),
        Value::String(s) => !s.is_empty(),
        Value::Array(a) => !a.is_empty(),
        Value::Object(o) => !o.is_empty(),
    }
}

pub(crate) fn py_string(value: &Value) -> String {
    match value {
        Value::String(s) => s.clone(),
        Value::Null => "None".into(),
        Value::Bool(true) => "True".into(),
        Value::Bool(false) => "False".into(),
        Value::Array(items) => format!(
            "[{}]",
            items.iter().map(py_repr).collect::<Vec<_>>().join(", ")
        ),
        Value::Object(items) => format!(
            "{{{}}}",
            items
                .iter()
                .map(|(k, v)| { format!("{}: {}", py_repr(&json!(k)), py_repr(v)) })
                .collect::<Vec<_>>()
                .join(", ")
        ),
        _ => value.to_string(),
    }
}

fn py_repr(value: &Value) -> String {
    let Some(text) = value.as_str() else {
        return py_string(value);
    };
    let quote = if text.contains('\'') && !text.contains('"') {
        '"'
    } else {
        '\''
    };
    let mut out = quote.to_string();
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
            c if c.is_control() => out.push_str(&format!("\\x{:02x}", c as u32)),
            c => out.push(c),
        }
    }
    out.push(quote);
    out
}

pub fn public_ai_summary(config: &Json) -> Json {
    json!({
        "ok": true,
        "enabled": config.get("enabled").is_some_and(truthy),
        "provider": string(config, "provider", "openai-compatible"),
        "baseUrl": string(config, "baseUrl", ""),
        "model": string(config, "model", ""),
        "hasApiKey": config.get("apiKey").is_some_and(truthy),
        "systemPromptLength": string(config, "systemPrompt", "").chars().count(),
        "characterPromptLength": string(config, "characterPrompt", "").chars().count(),
        "temperature": config.get("temperature").cloned().unwrap_or(json!(0.75)),
        "maxTokens": config.get("maxTokens").cloned().unwrap_or(json!(350)),
    })
}

/// Payload for `nori.ai.config.result`; the host owns ephemeral installation.
pub fn config_result_payload(raw: &Json) -> Json {
    public_ai_summary(&sanitize_ai_config(raw))
}

pub fn prompt(runtime: &Json) -> String {
    let custom = py_trim(string(runtime, "systemPrompt", ""));
    let character = py_trim(string(runtime, "characterPrompt", ""));
    if !custom.is_empty() {
        let mut parts = vec![custom];
        if !character.is_empty() {
            parts.push(character);
        }
        parts.push(EMOTION_PROTOCOL_PROMPT);
        parts.join("\n\n")
    } else if !character.is_empty() {
        format!("{SYSTEM_PROMPT}\n\n{character}")
    } else {
        SYSTEM_PROMPT.into()
    }
}

pub fn clean_history(history: &[Json]) -> Vec<Json> {
    history
        .iter()
        .filter_map(|item| {
            let role = item.get("role")?.as_str()?;
            let content = item.get("content")?.as_str()?;
            if matches!(role, "user" | "assistant") && !content.is_empty() {
                Some(json!({"role": role, "content": content}))
            } else {
                None
            }
        })
        .collect()
}

pub fn needs_max_completion_tokens(status: u16, body: &[u8]) -> bool {
    if !matches!(status, 400 | 422) {
        return false;
    }
    let detail = String::from_utf8_lossy(body).to_lowercase();
    detail.contains("max_tokens")
        && [
            "max_completion_tokens",
            "unsupported",
            "not supported",
            "unknown parameter",
            "unrecognized",
            "not permitted",
        ]
        .iter()
        .any(|marker| detail.contains(marker))
}

pub fn openai_message_text(data: &Json) -> Result<String, String> {
    let content = data
        .get("choices")
        .and_then(Value::as_array)
        .and_then(|a| a.first())
        .and_then(|choice| choice.get("message"))
        .and_then(|message| message.get("content"));
    match content {
        Some(Value::String(s)) => Ok(s.clone()),
        Some(Value::Array(parts)) => Ok(parts
            .iter()
            .filter_map(|part| {
                part.get("text")
                    .and_then(Value::as_str)
                    .or_else(|| part.get("content").and_then(Value::as_str))
            })
            .collect()),
        _ => Err(FORMAT_ERROR.into()),
    }
}

fn anthropic_message_text(data: &Json) -> String {
    let Some(blocks) = data.get("content").and_then(Value::as_array) else {
        return String::new();
    };
    let joined: String = blocks
        .iter()
        .filter(|b| b.get("type").and_then(Value::as_str) == Some("text"))
        .filter_map(|b| b.get("text").filter(|v| truthy(v)))
        .map(py_string)
        .collect();
    py_trim(&joined).into()
}

fn reason_phrase(status: u16) -> &'static str {
    match status {
        100 => "Continue",
        101 => "Switching Protocols",
        102 => "Processing",
        103 => "Early Hints",
        200 => "OK",
        201 => "Created",
        202 => "Accepted",
        203 => "Non-Authoritative Information",
        204 => "No Content",
        205 => "Reset Content",
        206 => "Partial Content",
        207 => "Multi-Status",
        208 => "Already Reported",
        226 => "IM Used",
        300 => "Multiple Choices",
        301 => "Moved Permanently",
        302 => "Found",
        303 => "See Other",
        304 => "Not Modified",
        305 => "Use Proxy",
        307 => "Temporary Redirect",
        308 => "Permanent Redirect",
        400 => "Bad Request",
        401 => "Unauthorized",
        402 => "Payment Required",
        403 => "Forbidden",
        404 => "Not Found",
        405 => "Method Not Allowed",
        406 => "Not Acceptable",
        407 => "Proxy Authentication Required",
        408 => "Request Timeout",
        409 => "Conflict",
        410 => "Gone",
        411 => "Length Required",
        412 => "Precondition Failed",
        413 => "Request Entity Too Large",
        414 => "Request-URI Too Long",
        415 => "Unsupported Media Type",
        416 => "Requested Range Not Satisfiable",
        417 => "Expectation Failed",
        418 => "I'm a teapot",
        421 => "Misdirected Request",
        422 => "Unprocessable Entity",
        423 => "Locked",
        424 => "Failed Dependency",
        425 => "Too Early",
        426 => "Upgrade Required",
        428 => "Precondition Required",
        429 => "Too Many Requests",
        431 => "Request Header Fields Too Large",
        451 => "Unavailable For Legal Reasons",
        500 => "Internal Server Error",
        501 => "Not Implemented",
        502 => "Bad Gateway",
        503 => "Service Unavailable",
        504 => "Gateway Timeout",
        505 => "HTTP Version Not Supported",
        506 => "Variant Also Negotiates",
        507 => "Insufficient Storage",
        508 => "Loop Detected",
        510 => "Not Extended",
        511 => "Network Authentication Required",
        _ => "",
    }
}

/// Never includes provider bodies, request URLs, headers or network diagnostics.
/// A successful response passed here denotes a parse/response-format error.
pub fn public_provider_error(result: &HttpResult) -> String {
    match result {
        HttpResult::Timeout => "Request timed out".into(),
        HttpResult::Network(_) => "Network request failed".into(),
        HttpResult::Response { status, .. } if !(200..300).contains(status) => {
            let reason = reason_phrase(*status);
            if reason.is_empty() {
                format!("HTTP {status}")
            } else {
                format!("HTTP {status} {reason}")
            }
        }
        _ => FORMAT_ERROR.into(),
    }
}

struct CompletionFlow {
    provider: String,
    request: HttpRequest,
    payload: Json,
    retried: bool,
}

impl CompletionFlow {
    fn new(
        user_text: &str,
        history: &[Json],
        runtime: &Json,
        server: &ServerAi,
        browser: bool,
        probe: bool,
    ) -> Self {
        let provider = if browser {
            string(runtime, "provider", "openai-compatible")
        } else {
            "openai-compatible"
        };
        let anthropic = provider == "anthropic";
        let base = if browser {
            string(
                runtime,
                "baseUrl",
                if anthropic {
                    "https://api.anthropic.com/v1"
                } else {
                    "https://api.openai.com/v1"
                },
            )
        } else {
            &server.openai_base_url
        };
        let model = if browser {
            string(
                runtime,
                "model",
                if anthropic {
                    &server.anthropic_model
                } else {
                    &server.openai_model
                },
            )
        } else {
            &server.openai_model
        };
        let api_key = if browser {
            string(runtime, "apiKey", "")
        } else {
            &server.openai_api_key
        };
        let system = if browser {
            prompt(runtime)
        } else {
            SYSTEM_PROMPT.into()
        };
        let temperature = if browser {
            runtime
                .get("temperature")
                .and_then(Value::as_f64)
                .unwrap_or(0.75)
        } else {
            0.75
        };
        let max_tokens = if browser {
            runtime
                .get("maxTokens")
                .and_then(Value::as_i64)
                .unwrap_or(350)
        } else {
            350
        };
        let max_tokens = if probe {
            max_tokens.min(96)
        } else {
            max_tokens
        };
        let mut messages = clean_history(history);
        messages.push(json!({"role": "user", "content": user_text}));
        let mut headers = vec![("Content-Type".into(), "application/json".into())];
        let payload = if anthropic {
            headers.push(("anthropic-version".into(), "2023-06-01".into()));
            if !api_key.is_empty() {
                headers.push(("x-api-key".into(), api_key.into()));
            }
            json!({"model": model, "system": system, "messages": messages, "temperature": temperature, "max_tokens": max_tokens})
        } else {
            messages.insert(0, json!({"role": "system", "content": system}));
            if !api_key.is_empty() {
                headers.push(("Authorization".into(), format!("Bearer {api_key}")));
            }
            json!({"model": model, "messages": messages, "temperature": temperature, "max_tokens": max_tokens})
        };
        let suffix = if anthropic {
            "/messages"
        } else {
            "/chat/completions"
        };
        let request = HttpRequest::post_json(
            format!("{}{suffix}", base.trim_end_matches('/')),
            headers,
            &payload,
            30_000,
            MAX_LLM_BYTES,
        );
        Self {
            provider: provider.into(),
            request,
            payload,
            retried: false,
        }
    }

    fn start(&self) -> FlowStep<Result<String, String>> {
        FlowStep::Http(self.request.clone())
    }

    fn resume(&mut self, result: HttpResult) -> FlowStep<Result<String, String>> {
        if let HttpResult::Response { status, body, .. } = &result {
            if self.provider != "anthropic"
                && !self.retried
                && needs_max_completion_tokens(*status, body)
            {
                self.retried = true;
                let max_tokens = self
                    .payload
                    .as_object_mut()
                    .unwrap()
                    .remove("max_tokens")
                    .unwrap();
                self.payload["max_completion_tokens"] = max_tokens;
                self.request.body = Some(serde_json::to_vec(&self.payload).unwrap());
                return self.start();
            }
        }
        let content = match &result {
            HttpResult::Response {
                status,
                body,
                truncated: false,
                ..
            } if (200..300).contains(status) && body.len() <= MAX_LLM_BYTES => {
                serde_json::from_slice::<Json>(body)
                    .map_err(|_| FORMAT_ERROR.into())
                    .and_then(|data| {
                        if self.provider == "anthropic" {
                            Ok(anthropic_message_text(&data))
                        } else {
                            openai_message_text(&data)
                        }
                    })
            }
            _ => Err(public_provider_error(&result)),
        };
        FlowStep::Done(content)
    }
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Reply {
    pub emotion: String,
    pub text: String,
    pub fallback: bool,
    pub log_error: Option<String>,
}

pub struct ReplyFlow {
    user_text: String,
    completion: Option<CompletionFlow>,
    done: Option<Reply>,
}

impl ReplyFlow {
    pub fn new(
        user_text: &str,
        history: &[Json],
        runtime: Option<&Json>,
        server: &ServerAi,
    ) -> Self {
        let runtime = runtime.map(sanitize_ai_config).unwrap_or(Value::Null);
        let browser = runtime.get("enabled").and_then(Value::as_bool) == Some(true);
        let completion = if !browser && server.openai_api_key.is_empty() {
            None
        } else {
            Some(CompletionFlow::new(
                user_text, history, &runtime, server, browser, false,
            ))
        };
        Self {
            user_text: user_text.into(),
            completion,
            done: None,
        }
    }

    pub fn start(&mut self) -> FlowStep<Reply> {
        if let Some(reply) = &self.done {
            return FlowStep::Done(reply.clone());
        }
        if let Some(flow) = &self.completion {
            return FlowStep::Http(flow.request.clone());
        }
        self.finish_fallback(None)
    }

    pub fn resume(&mut self, result: HttpResult) -> FlowStep<Reply> {
        if let Some(reply) = &self.done {
            return FlowStep::Done(reply.clone());
        }
        let Some(flow) = &mut self.completion else {
            return self.finish_fallback(None);
        };
        match flow.resume(result) {
            FlowStep::Http(request) => FlowStep::Http(request),
            FlowStep::Done(Ok(content)) => {
                let (emotion, text) = extract_emotion(&content);
                if text.is_empty() {
                    return self.finish_fallback(None);
                }
                let reply = Reply {
                    emotion,
                    text,
                    fallback: false,
                    log_error: None,
                };
                self.done = Some(reply.clone());
                FlowStep::Done(reply)
            }
            FlowStep::Done(Err(error)) => {
                let error = format!("[LLMService] {} request failed: {error}", flow.provider);
                self.finish_fallback(Some(error))
            }
        }
    }

    fn finish_fallback(&mut self, log_error: Option<String>) -> FlowStep<Reply> {
        let (emotion, text) = local_fallback(&self.user_text);
        let reply = Reply {
            emotion,
            text,
            fallback: true,
            log_error,
        };
        self.done = Some(reply.clone());
        FlowStep::Done(reply)
    }
}

/// Task-specific text/vision completion using the same provider and credentials as chat.
/// Unlike chat, failures never turn into an invented answer.
pub struct FeatureFlow {
    completion: Option<CompletionFlow>,
}

impl FeatureFlow {
    pub fn new(system: &str, text: &str, image: Option<&str>, runtime: Option<&Json>, server: &ServerAi) -> Self {
        let runtime = runtime.map(sanitize_ai_config).unwrap_or(Value::Null);
        let browser = runtime.get("enabled").and_then(Value::as_bool) == Some(true);
        if !browser && server.openai_api_key.is_empty() {
            return Self { completion: None };
        }
        let mut flow = CompletionFlow::new(text, &[], &runtime, server, browser, false);
        let anthropic = flow.provider == "anthropic";
        if anthropic { flow.payload["system"] = json!(system); }
        else { flow.payload["messages"][0]["content"] = json!(system); }
        if let Some(image) = image {
            let content = if anthropic {
                json!([{"type":"image","source":{"type":"base64","media_type":"image/png","data":image}}, {"type":"text","text":text}])
            } else {
                json!([{"type":"text","text":text}, {"type":"image_url","image_url":{"url":format!("data:image/png;base64,{image}")}}])
            };
            let messages = flow.payload["messages"].as_array_mut().unwrap();
            messages.last_mut().unwrap()["content"] = content;
        }
        flow.request.body = Some(serde_json::to_vec(&flow.payload).unwrap());
        Self { completion: Some(flow) }
    }

    pub fn start(&self) -> FlowStep<Result<String, String>> {
        self.completion.as_ref().map(CompletionFlow::start)
            .unwrap_or_else(|| FlowStep::Done(Err("unconfigured".into())))
    }

    pub fn resume(&mut self, result: HttpResult) -> FlowStep<Result<String, String>> {
        self.completion.as_mut().map(|flow| flow.resume(result))
            .unwrap_or_else(|| FlowStep::Done(Err("unconfigured".into())))
    }
}

pub struct ProbeFlow {
    completion: CompletionFlow,
    provider: String,
    configured_model: String,
    done: Option<Json>,
}

impl ProbeFlow {
    /// Probes even when `enabled` is false, without borrowing server credentials.
    pub fn new(runtime: &Json, server: &ServerAi) -> Self {
        let runtime = sanitize_ai_config(runtime);
        Self {
            provider: string(&runtime, "provider", "openai-compatible").into(),
            configured_model: string(&runtime, "model", "").into(),
            completion: CompletionFlow::new(
                "Reply with only: OK",
                &[],
                &runtime,
                server,
                true,
                true,
            ),
            done: None,
        }
    }

    pub fn start(&mut self) -> FlowStep<Json> {
        if let Some(result) = &self.done {
            FlowStep::Done(result.clone())
        } else {
            FlowStep::Http(self.completion.request.clone())
        }
    }

    pub fn resume(&mut self, result: HttpResult) -> FlowStep<Json> {
        if let Some(done) = &self.done {
            return FlowStep::Done(done.clone());
        }
        let result = match self.completion.resume(result) {
            FlowStep::Http(request) => return FlowStep::Http(request),
            FlowStep::Done(Ok(content)) => {
                let (_, cleaned) = extract_emotion(&content);
                if cleaned.is_empty() {
                    self.failure(FORMAT_ERROR)
                } else {
                    json!({"ok": true, "provider": self.provider, "model": self.completion.payload["model"],
                    "responsePreview": cleaned.chars().take(120).collect::<String>()})
                }
            }
            FlowStep::Done(Err(error)) => self.failure(&error),
        };
        self.done = Some(result.clone());
        FlowStep::Done(result)
    }

    fn failure(&self, error: &str) -> Json {
        json!({"ok": false, "provider": self.provider, "model": self.configured_model, "error": error})
    }
}

/// Construct a `nori.ai.test` flow from its nested-or-flat event payload.
pub fn test_flow(payload: &Json, server: &ServerAi) -> ProbeFlow {
    let config = payload
        .get("config")
        .filter(|v| v.is_object())
        .unwrap_or(payload);
    ProbeFlow::new(config, server)
}

pub fn local_fallback(user_text: &str) -> (String, String) {
    let text = user_text.to_lowercase();
    let contains = |words: &[&str]| words.iter().any(|w| text.contains(w));
    if contains(&[
        "hi",
        "hello",
        "你好",
        "您好",
        "在吗",
        "hey",
        "回来了",
        "我回来",
        "重启",
    ]) {
        let greeting = if rand::random::<bool>() {
            "操作员，你好呀！今天想聊点什么，还是来一局蛋糕决斗或国际象棋？"
        } else {
            REUNION_LINES[0]
        };
        return ("happy".into(), greeting.into());
    }
    if contains(&["深海", "海", "海洋"]) {
        return (
            "serious".into(),
            "深海鱼不怕水压，是因为它们生在深海。——有些问题的答案，只有身在其中才会懂哦。".into(),
        );
    }
    if contains(&["想你", "想你了", "miss you", "担心你"]) {
        return (
            "sad".into(),
            "谢谢你……不管变成什么样，只要还能被你找到，我就仍然是需要被找到的那个 Nori。".into(),
        );
    }
    if contains(&["你是谁", "who are you", "名字", "nori"]) {
        return (
            "excited".into(),
            "我是 Nori，你的 NoriOS 桌面智能伙伴！随时待命为你提供协助！".into(),
        );
    }
    if contains(&["谢谢", "thank", "厉害", "棒", "good"]) {
        return (
            "happy".into(),
            "嘿嘿，不客气！能帮到操作员我就最开心啦！".into(),
        );
    }
    if contains(&["再见", "bye", "晚安", "goodnight", "sleep"]) {
        return (
            "neutral".into(),
            "收到，操作员好好休息哦，Nori 随时都在这里等你回来！".into(),
        );
    }
    if contains(&["象棋", "chess", "下棋"]) {
        return (
            "serious".into(),
            "国际象棋随时可以开始！你可以直接在桌面打开国际象棋应用，准备好挑战我了吗？".into(),
        );
    }
    if contains(&["蛋糕", "cakeduel", "duel"]) {
        return (
            "excited".into(),
            "蛋糕决斗！准备好你的虚张声势和推理战术了吗？随时可以开一局！".into(),
        );
    }
    (
        "neutral".into(),
        format!("收到：“{user_text}”。NoriOS 本地系统运转正常，随时可以发起对话或打开应用！"),
    )
}

// Kept for compatibility with the previous module; TTS owns bearer redaction.
pub fn redact(detail: &str, secrets: &[&str]) -> String {
    crate::tts::redact_provider_detail(detail, secrets)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn response(status: u16, body: Json) -> HttpResult {
        HttpResult::Response {
            status,
            headers: vec![],
            body: serde_json::to_vec(&body).unwrap(),
            truncated: false,
        }
    }
    fn request<T: std::fmt::Debug>(step: FlowStep<T>) -> HttpRequest {
        match step {
            FlowStep::Http(request) => request,
            other => panic!("expected HTTP: {other:?}"),
        }
    }
    fn done<T: std::fmt::Debug>(step: FlowStep<T>) -> T {
        match step {
            FlowStep::Done(value) => value,
            other => panic!("expected Done: {other:?}"),
        }
    }
    fn body(request: &HttpRequest) -> Json {
        serde_json::from_slice(request.body.as_ref().unwrap()).unwrap()
    }
    fn header<'a>(request: &'a HttpRequest, key: &str) -> Option<&'a str> {
        request
            .headers
            .iter()
            .find(|(k, _)| k.eq_ignore_ascii_case(key))
            .map(|(_, v)| v.as_str())
    }

    #[test]
    fn sanitize_runtime_settings_and_public_payloads() {
        let secret = "super-secret-browser-key";
        let config = sanitize_ai_config(
            &json!({"enabled": true, "provider": " OPENAI-COMPATIBLE ",
            "baseUrl": "https://example.test/v1/chat/completions/", "model": "custom-model", "apiKey": secret,
            "systemPrompt": "Custom system prompt", "characterPrompt": "好奇", "temperature": 9, "maxTokens": 999999}),
        );
        assert_eq!(config["baseUrl"], "https://example.test/v1");
        assert_eq!(config["temperature"], 2.0);
        assert_eq!(config["maxTokens"], 4096);
        let public = public_ai_summary(&config);
        assert_eq!(public["hasApiKey"], true);
        assert_eq!(public["characterPromptLength"], 2);
        assert!(public.get("apiKey").is_none());
        assert!(!public.to_string().contains(secret));
        assert_eq!(config_result_payload(&config), public);
        let defaults = sanitize_ai_config(&json!([]));
        assert_eq!(defaults["enabled"], false);
        assert_eq!(defaults["temperature"], 0.75);
        assert_eq!(defaults["maxTokens"], 350);
        for value in [json!(true), json!(null), json!({})] {
            let config = sanitize_ai_config(&json!({"temperature": value, "maxTokens": value}));
            assert_eq!(config["temperature"], 0.75);
            assert_eq!(config["maxTokens"], 350);
        }
        let config =
            sanitize_ai_config(&json!({"enabled": 1, "temperature": "0.5", "maxTokens": "1_024"}));
        assert_eq!(config["enabled"], false);
        assert_eq!(config["temperature"], 0.5);
        assert_eq!(config["maxTokens"], 1024);
        assert_eq!(
            sanitize_ai_config(&json!({"maxTokens": 65.9}))["maxTokens"],
            65
        );
        assert_eq!(
            sanitize_ai_config(&json!({"maxTokens": "65.9"}))["maxTokens"],
            350
        );
        let config = sanitize_ai_config(&json!({"temperature": "１.５", "maxTokens": "١٢٨"}));
        assert_eq!(config["temperature"], 1.5);
        assert_eq!(config["maxTokens"], 128);
        for value in ["inf", "Infinity", "+infinity", "nan"] {
            assert_eq!(
                sanitize_ai_config(&json!({"temperature":value}))["temperature"],
                2.0
            );
        }
        assert_eq!(
            sanitize_ai_config(&json!({"temperature": "nan"}))["temperature"],
            2.0
        );
        assert_eq!(
            sanitize_ai_config(&json!({"temperature": -1, "maxTokens": 0}))["maxTokens"],
            32
        );
        let config = sanitize_ai_config(
            &json!({"model": "你".repeat(201), "apiKey": "k".repeat(2049),
            "systemPrompt": "好".repeat(16001), "characterPrompt": "好".repeat(16001)}),
        );
        assert_eq!(config["model"].as_str().unwrap().chars().count(), 200);
        assert_eq!(config["apiKey"].as_str().unwrap().len(), 2048);
        assert_eq!(public_ai_summary(&config)["systemPromptLength"], 16000);
        assert_eq!(public_ai_summary(&config)["characterPromptLength"], 16000);
    }

    #[test]
    fn provider_url_validation_and_normalization() {
        for url in [
            "https://user:password@example.test/v1",
            "https://user@example.test",
            "https://@example.test",
            "ftp://example.test",
            "file:///tmp/key",
            "https:///v1",
            "https://:8000/v1",
            "https://[bad]/v1",
            "https://[::1/v1",
            "https://foo[::1]bar/v1",
            "https://[::1]bad/v1",
            "https://[::1%]/v1",
            "https://example﹖secret/v1",
            "https://example＠secret/v1",
        ] {
            assert_eq!(
                sanitize_ai_config(&json!({"baseUrl": url}))["baseUrl"],
                "",
                "{url}"
            );
        }
        for (url, provider, expected) in [
            (
                "https://example.test/v1/chat/completions",
                "openai-compatible",
                "https://example.test/v1",
            ),
            (
                "https://example.test/v1/CHAT/COMPLETIONS/",
                "openai-compatible",
                "https://example.test/v1",
            ),
            (
                "https://api.anthropic.com/v1/messages",
                "anthropic",
                "https://api.anthropic.com/v1",
            ),
            (
                "HTTP://[::1]:9880/v1/",
                "openai-compatible",
                "HTTP://[::1]:9880/v1",
            ),
            (
                "https://example.test/v1?token=x",
                "anthropic",
                "https://example.test/v1?token=x",
            ),
        ] {
            assert_eq!(normalize_provider_base_url(&json!(url), provider), expected);
        }
    }

    #[test]
    fn emotion_regex_and_aliases() {
        assert_eq!(
            extract_emotion(" [emotion:HAPPY] 你好 "),
            ("happy".into(), "你好".into())
        );
        for (alias, expected) in EMOTION_ALIASES {
            assert_eq!(
                extract_emotion(&format!("[emotion:{alias}] OK")).0,
                *expected
            );
        }
        assert_eq!(
            extract_emotion("[emotion:unknown] OK"),
            ("neutral".into(), "OK".into())
        );
        assert_eq!(
            extract_emotion("[emotion:1] [emotion:tears] sad [emotion:happy]"),
            ("sad".into(), "[emotion:1]  sad [emotion:happy]".into())
        );
        for text in [
            "[emotion:]",
            "[Emotion:happy]",
            "[emotion:happy-]",
            "[emotion:好]",
        ] {
            assert_eq!(extract_emotion(text), ("neutral".into(), text.into()));
        }
    }

    #[test]
    fn prompt_and_history_contract() {
        assert_eq!(
            SYSTEM_PROMPT,
            format!("{DEFAULT_PERSONA_PROMPT}\n\n{EMOTION_PROTOCOL_PROMPT}")
        );
        assert_eq!(prompt(&json!({})), SYSTEM_PROMPT);
        assert_eq!(
            py_string(&json!(["text", true, null, {"key": "value"}])),
            "['text', True, None, {'key': 'value'}]"
        );
        assert_eq!(
            anthropic_message_text(&json!({"content":[{"type":"text","text":["hello",true]}]})),
            "['hello', True]"
        );
        assert_eq!(
            prompt(&json!({"characterPrompt": "Character"})),
            format!("{SYSTEM_PROMPT}\n\nCharacter")
        );
        assert_eq!(
            prompt(&json!({"systemPrompt": " Custom ", "characterPrompt": " Character "})),
            format!("Custom\n\nCharacter\n\n{EMOTION_PROTOCOL_PROMPT}")
        );
        assert_eq!(
            clean_history(&[
                json!(null),
                json!({"role":"system","content":"secret"}),
                json!({"role":"assistant","content":1}),
                json!({"role":"user","content":""}),
                json!({"role":"user","content":" ","extra":1}),
                json!({"role":"assistant","content":"OK"})
            ]),
            vec![
                json!({"role":"user","content":" "}),
                json!({"role":"assistant","content":"OK"})
            ]
        );
    }

    #[test]
    fn openai_compat_retry_and_text_parts() {
        let mut flow = ReplyFlow::new(
            "hello",
            &[],
            Some(&json!({"enabled":true,"baseUrl":"https://example.test/v1",
            "model":"new-model","apiKey":"test-key","systemPrompt":"system","temperature":0.5,"maxTokens":128})),
            &ServerAi::default(),
        );
        let first = request(flow.start());
        assert_eq!(first.url, "https://example.test/v1/chat/completions");
        assert_eq!(header(&first, "Authorization"), Some("Bearer test-key"));
        assert_eq!(header(&first, "Content-Type"), Some("application/json"));
        assert_eq!(first.timeout_ms, 30_000);
        assert_eq!(first.max_response_bytes, MAX_LLM_BYTES);
        assert!(!first.follow_redirects);
        assert_eq!(body(&first)["max_tokens"], 128);
        assert!(body(&first).get("max_completion_tokens").is_none());
        let second = request(flow.resume(response(400, json!({"error":{"message":"Unsupported parameter: max_tokens. Use max_completion_tokens instead."}}))));
        assert_eq!(first.headers, second.headers);
        assert_eq!(body(&second)["max_completion_tokens"], 128);
        assert!(body(&second).get("max_tokens").is_none());
        let reply = done(flow.resume(response(
            200,
            json!({"choices":[{"message":{"content":[
            {"type":"text","text":"[emotion:happy] "},{"type":"text","text":"OK"},
            {"content":"!"},null,{"text":9,"content":"?"}]}}]}),
        )));
        assert_eq!(reply.emotion, "happy");
        assert_eq!(reply.text, "OK!?");
        assert!(!reply.fallback);
        assert_eq!(reply.log_error, None);
    }

    #[test]
    fn token_retry_predicate_and_only_one_retry() {
        for marker in [
            "max_completion_tokens",
            "unsupported",
            "not supported",
            "unknown parameter",
            "unrecognized",
            "not permitted",
        ] {
            for status in [400, 422] {
                assert!(needs_max_completion_tokens(
                    status,
                    format!("MAX_TOKENS {marker}").as_bytes()
                ));
            }
        }
        assert!(!needs_max_completion_tokens(400, b"Unknown model"));
        assert!(!needs_max_completion_tokens(
            400,
            b"max_tokens must be positive"
        ));
        assert!(!needs_max_completion_tokens(500, b"max_tokens unsupported"));
        let mut flow = ProbeFlow::new(&json!({}), &ServerAi::default());
        let error = response(422, json!({"error":"max_tokens unsupported"}));
        request(flow.resume(error.clone()));
        assert_eq!(
            done(flow.resume(error))["error"],
            "HTTP 422 Unprocessable Entity"
        );
    }

    #[test]
    fn anthropic_request_and_text_concatenation() {
        let mut flow = ReplyFlow::new(
            "你好",
            &[json!({"role":"assistant","content":"old"})],
            Some(
                &json!({"enabled":true,"provider":"anthropic","baseUrl":"https://api.anthropic.com/v1/messages",
                "model":"claude-custom","apiKey":"secret","systemPrompt":"custom","characterPrompt":"character"}),
            ),
            &ServerAi::default(),
        );
        let req = request(flow.start());
        assert_eq!(req.url, "https://api.anthropic.com/v1/messages");
        assert_eq!(header(&req, "x-api-key"), Some("secret"));
        assert_eq!(header(&req, "anthropic-version"), Some("2023-06-01"));
        assert_eq!(header(&req, "Authorization"), None);
        let payload = body(&req);
        assert_eq!(payload["model"], "claude-custom");
        assert_eq!(
            payload["system"],
            format!("custom\n\ncharacter\n\n{EMOTION_PROTOCOL_PROMPT}")
        );
        assert_eq!(
            payload["messages"],
            json!([{"role":"assistant","content":"old"},{"role":"user","content":"你好"}])
        );
        let reply = done(flow.resume(response(
            200,
            json!({"content":[{"type":"text","text":" [emotion:kirakira] "},
            {"type":"tool_use","text":"ignore"},{"type":"text","text":"OK "},null]}),
        )));
        assert_eq!(
            (reply.emotion.as_str(), reply.text.as_str()),
            ("excited", "OK")
        );
        let mut flow = ProbeFlow::new(&json!({"provider":"anthropic"}), &ServerAi::default());
        assert_eq!(
            done(flow.resume(response(400, json!({"error":"max_tokens unsupported"}))))["error"],
            "HTTP 400 Bad Request"
        );
    }

    #[test]
    fn browser_override_and_server_defaults() {
        let server = ServerAi {
            openai_api_key: "server-key".into(),
            openai_base_url: "https://server/v1/".into(),
            openai_model: "server-model".into(),
            ..ServerAi::default()
        };
        let mut flow = ReplyFlow::new(
            "hello",
            &[],
            Some(&json!({"enabled":false,"apiKey":"ignored"})),
            &server,
        );
        let req = request(flow.start());
        assert_eq!(req.url, "https://server/v1/chat/completions");
        assert_eq!(body(&req)["model"], "server-model");
        assert_eq!(body(&req)["max_tokens"], 350);
        assert_eq!(body(&req)["messages"][0]["content"], SYSTEM_PROMPT);
        assert_eq!(header(&req, "Authorization"), Some("Bearer server-key"));
        let mut flow = ReplyFlow::new("hello", &[], None, &ServerAi::default());
        let reply = done(flow.start());
        assert!(reply.fallback);
        assert_eq!(reply.log_error, None);
        assert_eq!(done(flow.start()), reply);
        let mut flow = ReplyFlow::new(
            "hello",
            &[],
            Some(&json!({"enabled":true,"baseUrl":"http://localhost:8000/v1"})),
            &server,
        );
        assert_eq!(header(&request(flow.start()), "Authorization"), None);
    }

    #[test]
    fn provider_failures_are_log_safe_and_fallback() {
        for result in [
            HttpResult::Timeout,
            HttpResult::Network("secret https://key:password@server/".into()),
            response(401, json!({"secret":"key"})),
            response(302, json!({})),
            response(200, json!({"choices":[]})),
            HttpResult::Response {
                status: 200,
                headers: vec![],
                body: b"invalid json key".to_vec(),
                truncated: false,
            },
            HttpResult::Response {
                status: 200,
                headers: vec![],
                body: vec![],
                truncated: true,
            },
        ] {
            let expected = public_provider_error(&result);
            let mut flow = ReplyFlow::new(
                "no-special-words",
                &[],
                Some(&json!({"enabled":true,"apiKey":"key"})),
                &ServerAi::default(),
            );
            let reply = done(flow.resume(result));
            assert!(reply.fallback);
            let error = reply.log_error.unwrap();
            assert!(error.ends_with(&expected));
            assert!(!error.contains("secret"));
            assert!(!error.contains("password"));
        }
        assert_eq!(
            public_provider_error(&response(429, json!({}))),
            "HTTP 429 Too Many Requests"
        );
        assert_eq!(public_provider_error(&response(599, json!({}))), "HTTP 599");
        let mut flow = ReplyFlow::new(
            "x",
            &[],
            Some(&json!({"enabled":true})),
            &ServerAi::default(),
        );
        assert_eq!(
            done(flow.resume(response(
                200,
                json!({"choices":[{"message":{"content":"[emotion:happy] "}}]})
            )))
            .log_error,
            None
        );
    }

    #[test]
    fn probe_payload_success_and_failure_models() {
        let server = ServerAi {
            openai_model: "env-model".into(),
            openai_api_key: "must-not-borrow".into(),
            ..ServerAi::default()
        };
        let mut flow = test_flow(
            &json!({"config":{"enabled":false,"maxTokens":4096,"apiKey":"browser-secret"}}),
            &server,
        );
        let req = request(flow.start());
        assert_eq!(body(&req)["max_tokens"], 96);
        assert_eq!(body(&req)["messages"][1]["content"], "Reply with only: OK");
        assert_eq!(header(&req, "Authorization"), Some("Bearer browser-secret"));
        let result = done(flow.resume(response(200,json!({"choices":[{"message":{"content":format!("[emotion:happy] {}", "好".repeat(130))}}]}))));
        assert_eq!(result["ok"], true);
        assert_eq!(result["model"], "env-model");
        assert_eq!(
            result["responsePreview"].as_str().unwrap().chars().count(),
            120
        );
        assert!(!result.to_string().contains("browser-secret"));
        assert_eq!(done(flow.start()), result);
        let mut flow = ProbeFlow::new(&json!({}), &server);
        let req = request(flow.start());
        assert_eq!(header(&req, "Authorization"), None);
        assert_eq!(
            done(flow.resume(HttpResult::Timeout)),
            json!({"ok":false,"provider":"openai-compatible","model":"","error":"Request timed out"})
        );
        let mut flow = ProbeFlow::new(&json!({"model":"custom","maxTokens":32}), &server);
        assert_eq!(body(&request(flow.start()))["max_tokens"], 32);
        assert_eq!(
            done(flow.resume(response(
                200,
                json!({"choices":[{"message":{"content":""}}]})
            ))),
            json!({"ok":false,"provider":"openai-compatible","model":"custom","error":FORMAT_ERROR})
        );
    }

    #[test]
    fn local_fallback_corpus_and_greeting_choice() {
        for _ in 0..16 {
            let (emotion, text) = local_fallback("我回来了");
            assert_eq!(emotion, "happy");
            assert!([
                "操作员，你好呀！今天想聊点什么，还是来一局蛋糕决斗或国际象棋？",
                REUNION_LINES[0]
            ]
            .contains(&text.as_str()));
        }
        for (input, emotion, text) in [
            (
                "海",
                "serious",
                "深海鱼不怕水压，是因为它们生在深海。——有些问题的答案，只有身在其中才会懂哦。",
            ),
            (
                "miss you",
                "sad",
                "谢谢你……不管变成什么样，只要还能被你找到，我就仍然是需要被找到的那个 Nori。",
            ),
            (
                "你是谁",
                "excited",
                "我是 Nori，你的 NoriOS 桌面智能伙伴！随时待命为你提供协助！",
            ),
            ("谢谢", "happy", "嘿嘿，不客气！能帮到操作员我就最开心啦！"),
            (
                "晚安",
                "neutral",
                "收到，操作员好好休息哦，Nori 随时都在这里等你回来！",
            ),
            (
                "chess",
                "serious",
                "国际象棋随时可以开始！你可以直接在桌面打开国际象棋应用，准备好挑战我了吗？",
            ),
            (
                "蛋糕",
                "excited",
                "蛋糕决斗！准备好你的虚张声势和推理战术了吗？随时可以开一局！",
            ),
        ] {
            assert_eq!(local_fallback(input), (emotion.into(), text.into()));
        }
        // Preserve Python's substring/priority quirk: goodnight hits "good" first.
        assert_eq!(local_fallback("goodnight").0, "happy");
        assert_eq!(
            local_fallback("xyz"),
            (
                "neutral".into(),
                "收到：“xyz”。NoriOS 本地系统运转正常，随时可以发起对话或打开应用！".into()
            )
        );
    }
}

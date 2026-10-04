//! Browser TTS configuration, pure event payloads, and sans-I/O synthesis.
//!
//! Hosts must supply decoded bodies and never follow redirects. The frozen
//! HttpRequest has one cap, so requests specify the success cap; error bodies
//! are sliced to MAX_ERROR_BYTES here. To stop reading error streams at 64 KiB
//! (as Python does), hosts also need a status-aware error cap.

use crate::jsonutil::Json;
use crate::llm::{base_url, decimal_digit, number, py_string, py_trim, string, text_limit, truthy};
use crate::provider::{FlowStep, HttpRequest, HttpResult};
use base64::engine::{general_purpose, GeneralPurpose, GeneralPurposeConfig};
use base64::Engine;
use serde_json::{json, Value};

pub const MAX_AUDIO_BYTES: usize = 8 * 1024 * 1024;
pub const MAX_JSON_BYTES: usize = 2 * MAX_AUDIO_BYTES + 64 * 1024;
pub const MAX_ERROR_BYTES: usize = 64 * 1024;
const TOO_LARGE: &str = "语音服务返回的音频过大";
const EMPTY_AUDIO: &str = "语音服务返回了空音频";

pub fn sanitize_tts_config(raw: &Json) -> Json {
    let provider = text_limit(raw.get("provider"), 40).to_lowercase();
    let provider = if [
        "openai-compatible",
        "custom",
        "gpt-sovits",
        "minimax",
        "gemini",
    ]
    .contains(&provider.as_str())
    {
        provider.as_str()
    } else {
        "openai-compatible"
    };
    let prompt_lang = text_limit(raw.get("promptLang"), 40);
    let text_lang = text_limit(raw.get("textLang"), 40);
    json!({
        "enabled": raw.get("enabled").and_then(Value::as_bool) == Some(true),
        "provider": provider,
        "baseUrl": base_url(raw.get("baseUrl")),
        "apiKey": text_limit(raw.get("apiKey"), 2048),
        "model": text_limit(raw.get("model"), 200),
        "voice": text_limit(raw.get("voice"), 200),
        "speed": number(raw.get("speed"), 1.0, 0.25, 4.0),
        "refAudio": text_limit(raw.get("refAudio"), 4000),
        "promptText": text_limit(raw.get("promptText"), 4000),
        "promptLang": if prompt_lang.is_empty() { "zh" } else { &prompt_lang },
        "textLang": if text_lang.is_empty() { "zh" } else { &text_lang },
    })
}

pub fn public_tts_summary(config: &Json) -> Json {
    json!({
        "ok": true,
        "enabled": config.get("enabled").is_some_and(truthy),
        "provider": string(config, "provider", "openai-compatible"),
        "baseUrl": string(config, "baseUrl", ""),
        "model": string(config, "model", ""),
        "voice": string(config, "voice", ""),
        "speed": config.get("speed").cloned().unwrap_or(json!(1.0)),
        "hasApiKey": config.get("apiKey").is_some_and(truthy),
        "hasReferenceAudio": config.get("refAudio").is_some_and(truthy),
    })
}

/// Payload for `nori.tts.config.result`; installation is owned by the host.
pub fn config_result_payload(raw: &Json) -> Json {
    public_tts_summary(&sanitize_tts_config(raw))
}

pub fn provider_endpoint(base_url: &str, suffix: &str) -> String {
    let base = py_trim(base_url).trim_end_matches('/');
    let suffix = format!("/{}", py_trim(suffix).trim_start_matches('/'));
    if base.to_lowercase().ends_with(&suffix.to_lowercase()) {
        base.into()
    } else {
        format!("{base}{suffix}")
    }
}

/// Literal replacement followed by Python's case-insensitive
/// `bearer\s+[A-Za-z0-9._~+/=-]{6,}` substitution, before the 300-character cap.
pub fn redact_provider_detail(detail: &str, secrets: &[&str]) -> String {
    let mut safe = detail.to_string();
    for secret in secrets {
        if !secret.is_empty() {
            safe = safe.replace(secret, "***");
        }
    }
    let bytes = safe.as_bytes();
    let mut out = String::new();
    let mut copied = 0;
    let mut scan = 0;
    while scan + 6 <= bytes.len() {
        if bytes[scan..scan + 6].eq_ignore_ascii_case(b"bearer") {
            let mut token_start = scan + 6;
            for c in safe[token_start..].chars() {
                if c.is_whitespace() || ('\u{1c}'..='\u{1f}').contains(&c) {
                    token_start += c.len_utf8();
                } else {
                    break;
                }
            }
            if token_start > scan + 6 {
                let mut end = token_start;
                while end < bytes.len()
                    && (bytes[end].is_ascii_alphanumeric() || b"._~+/=-".contains(&bytes[end]))
                {
                    end += 1;
                }
                if end - token_start >= 6 {
                    out.push_str(&safe[copied..scan]);
                    out.push_str("Bearer ***");
                    scan = end;
                    copied = end;
                    continue;
                }
            }
        }
        scan += 1;
    }
    out.push_str(&safe[copied..]);
    let clipped = out.chars().take(300).collect::<String>().replace('\n', " ");
    py_trim(&clipped).into()
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Speech {
    pub audio: Vec<u8>,
    pub mime: String,
    pub provider: String,
}

impl Speech {
    pub fn event_payload(&self) -> Json {
        json!({"audio": general_purpose::STANDARD.encode(&self.audio), "mime": self.mime, "provider": self.provider})
    }
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct TtsError {
    pub provider: String,
    pub message: String,
}

impl TtsError {
    fn new(provider: &str, message: impl Into<String>) -> Self {
        Self {
            provider: provider.into(),
            message: message.into(),
        }
    }
    fn parse(provider: &str, exception: &str) -> Self {
        Self::new(provider, format!("语音服务响应无法解析: {exception}"))
    }
}

impl std::fmt::Display for TtsError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(&self.message)
    }
}
impl std::error::Error for TtsError {}

/// Mono PCM16 WAV; an odd trailing byte is discarded. Rates not representable
/// in a WAV header fail with the same exception taxonomy as Python wave/struct.
pub fn pcm16_to_wav(pcm: &[u8], sample_rate: u32) -> Result<Vec<u8>, TtsError> {
    if sample_rate == 0 {
        return Err(TtsError::parse("gemini", "Error"));
    }
    let byte_rate = sample_rate
        .checked_mul(2)
        .ok_or_else(|| TtsError::parse("gemini", "error"))?;
    let size = u32::try_from(pcm.len() / 2 * 2).map_err(|_| TtsError::parse("gemini", "error"))?;
    let riff_size = size
        .checked_add(36)
        .ok_or_else(|| TtsError::parse("gemini", "error"))?;
    let mut wav = Vec::with_capacity(size as usize + 44);
    wav.extend_from_slice(b"RIFF");
    wav.extend_from_slice(&riff_size.to_le_bytes());
    wav.extend_from_slice(b"WAVEfmt ");
    wav.extend_from_slice(&16u32.to_le_bytes());
    wav.extend_from_slice(&1u16.to_le_bytes()); // PCM
    wav.extend_from_slice(&1u16.to_le_bytes()); // mono
    wav.extend_from_slice(&sample_rate.to_le_bytes());
    wav.extend_from_slice(&byte_rate.to_le_bytes());
    wav.extend_from_slice(&2u16.to_le_bytes()); // block alignment
    wav.extend_from_slice(&16u16.to_le_bytes());
    wav.extend_from_slice(b"data");
    wav.extend_from_slice(&size.to_le_bytes());
    wav.extend_from_slice(&pcm[..size as usize]);
    Ok(wav)
}

fn bounded_audio(audio: Vec<u8>, provider: &str, mime: String) -> Result<Speech, TtsError> {
    if audio.is_empty() {
        return Err(TtsError::new(provider, EMPTY_AUDIO));
    }
    if audio.len() > MAX_AUDIO_BYTES {
        return Err(TtsError::new(provider, TOO_LARGE));
    }
    Ok(Speech {
        audio,
        mime,
        provider: provider.into(),
    })
}

fn response_mime(headers: &[(String, String)], fallback: &str) -> String {
    let value = headers
        .iter()
        .find(|(key, _)| key.eq_ignore_ascii_case("content-type"))
        .map(|(_, value)| value.split(';').next().unwrap_or("").trim().to_lowercase())
        .unwrap_or_default();
    if value.starts_with("audio/") || value == "application/octet-stream" {
        value
    } else {
        fallback.into()
    }
}

fn percent_encode(text: &str) -> String {
    const HEX: &[u8] = b"0123456789ABCDEF";
    let mut out = String::new();
    for b in text.bytes() {
        if b.is_ascii_alphanumeric() || b"_.-~".contains(&b) {
            out.push(char::from(b));
        } else if b == b' ' {
            out.push('+');
        } else {
            out.push('%');
            out.push(char::from(HEX[(b >> 4) as usize]));
            out.push(char::from(HEX[(b & 15) as usize]));
        }
    }
    out
}

pub struct SynthFlow {
    provider: String,
    api_key: String,
    request: Option<HttpRequest>,
    fallback_request: Option<HttpRequest>,
    done: Option<Result<Speech, TtsError>>,
}

impl SynthFlow {
    /// `config` is the output of `sanitize_tts_config` (not server defaults).
    pub fn new(text: &str, config: &Json) -> Self {
        let provider = string(config, "provider", "openai-compatible").to_string();
        let mut flow = Self {
            provider,
            api_key: string(config, "apiKey", "").into(),
            request: None,
            fallback_request: None,
            done: None,
        };
        if config.get("enabled").and_then(Value::as_bool) != Some(true) {
            flow.done = Some(Err(TtsError::new("disabled", "浏览器 TTS 未启用")));
            return flow;
        }
        let text: String = py_trim(text).chars().take(4000).collect();
        if text.is_empty() {
            flow.done = Some(Err(TtsError::new(
                string(config, "provider", "tts"),
                "没有可合成的文本",
            )));
            return flow;
        }
        let speed = config
            .get("speed")
            .and_then(Value::as_f64)
            .filter(|v| *v != 0.0)
            .unwrap_or(1.0);
        let (url, payload) = match flow.provider.as_str() {
            "custom" => {
                let url = py_trim(string(config, "baseUrl", ""));
                if url.is_empty() {
                    flow.done = Some(Err(TtsError::new("custom", "未配置自定义 TTS 请求端点")));
                    return flow;
                }
                (
                    url.to_string(),
                    json!({"text":text, "voice":string(config,"voice",""), "speed":speed}),
                )
            }
            "gpt-sovits" => (
                provider_endpoint(string(config, "baseUrl", "http://127.0.0.1:9880"), "/tts"),
                json!({"text":text, "text_lang":string(config,"textLang","zh"),
                    "ref_audio_path":string(config,"refAudio",""), "prompt_text":string(config,"promptText",""),
                    "prompt_lang":string(config,"promptLang","zh"), "speed_factor":speed}),
            ),
            "minimax" => (
                provider_endpoint(
                    string(config, "baseUrl", "https://api.minimaxi.com/v1"),
                    "/t2a_v2",
                ),
                json!({"model":string(config,"model","speech-2.8-turbo"), "text":text, "stream":false,
                    "voice_setting":{"voice_id":string(config,"voice","male-qn-qingse"),"speed":speed},
                    "audio_setting":{"sample_rate":32000,"format":"mp3","channel":1}, "output_format":"hex"}),
            ),
            "gemini" => {
                let base = string(
                    config,
                    "baseUrl",
                    "https://generativelanguage.googleapis.com/v1beta",
                )
                .trim_end_matches('/');
                let model = string(config, "model", "gemini-3.1-flash-tts-preview");
                let url = if base.to_ascii_lowercase().ends_with(":generatecontent") {
                    base.into()
                } else {
                    format!("{base}/models/{model}:generateContent")
                };
                (
                    url,
                    json!({"contents":[{"parts":[{"text":text}]}],
                    "generationConfig":{"responseModalities":["AUDIO"],
                        "speechConfig":{"voiceConfig":{"prebuiltVoiceConfig":{"voiceName":string(config,"voice","Kore")}}}}}),
                )
            }
            _ => (
                provider_endpoint(
                    string(config, "baseUrl", "https://api.openai.com/v1"),
                    "/audio/speech",
                ),
                json!({"model":string(config,"model","gpt-4o-mini-tts"), "input":text,
                    "voice":string(config,"voice","nova"), "speed":speed}),
            ),
        };
        let mut headers = vec![("Content-Type".into(), "application/json".into())];
        if !flow.api_key.is_empty() {
            if flow.provider == "gemini" {
                headers.push(("x-goog-api-key".into(), flow.api_key.clone()));
            } else {
                headers.push(("Authorization".into(), format!("Bearer {}", flow.api_key)));
            }
        }
        let cap = if matches!(flow.provider.as_str(), "minimax" | "gemini") {
            MAX_JSON_BYTES
        } else {
            MAX_AUDIO_BYTES
        };
        let request = HttpRequest::post_json(url, headers, &payload, 45_000, cap);
        if flow.provider == "gpt-sovits" {
            let query = payload
                .as_object()
                .unwrap()
                .iter()
                .map(|(key, value)| {
                    let value = value
                        .as_str()
                        .map(str::to_string)
                        .unwrap_or_else(|| value.to_string());
                    format!("{}={}", percent_encode(key), percent_encode(&value))
                })
                .collect::<Vec<_>>()
                .join("&");
            flow.fallback_request = Some(HttpRequest {
                method: "GET".into(),
                url: format!("{}?{query}", request.url),
                body: None,
                ..request.clone()
            });
        }
        flow.request = Some(request);
        flow
    }

    pub fn start(&mut self) -> FlowStep<Result<Speech, TtsError>> {
        if let Some(result) = &self.done {
            FlowStep::Done(result.clone())
        } else {
            FlowStep::Http(self.request.as_ref().unwrap().clone())
        }
    }

    pub fn resume(&mut self, result: HttpResult) -> FlowStep<Result<Speech, TtsError>> {
        if let Some(done) = &self.done {
            return FlowStep::Done(done.clone());
        }
        let result = match result {
            HttpResult::Timeout => Err(TtsError::new(&self.provider, "语音服务请求超时")),
            // The frozen contract does not retain httpx exception subclasses.
            // Never reflect the diagnostic string (it may contain URLs/keys).
            HttpResult::Network(_) => Err(TtsError::new(
                &self.provider,
                "语音服务网络请求失败: RequestError",
            )),
            HttpResult::Response {
                status,
                headers,
                body,
                truncated,
            } => {
                let success = (200..300).contains(&status);
                if success
                    && (truncated || body.len() > self.request.as_ref().unwrap().max_response_bytes)
                {
                    Err(TtsError::new(&self.provider, TOO_LARGE))
                } else if self.provider == "gpt-sovits"
                    && (!success || body.is_empty())
                    && self.fallback_request.is_some()
                {
                    let request = self.fallback_request.take().unwrap();
                    self.request = Some(request.clone());
                    return FlowStep::Http(request);
                } else if !success {
                    if self.provider == "gpt-sovits" {
                        Err(TtsError::new(
                            &self.provider,
                            format!("GPT-SoVITS 合成失败: HTTP {status}"),
                        ))
                    } else {
                        let detail =
                            String::from_utf8_lossy(&body[..body.len().min(MAX_ERROR_BYTES)]);
                        let safe = redact_provider_detail(&detail, &[&self.api_key]);
                        let suffix = if safe.is_empty() {
                            String::new()
                        } else {
                            format!(" {safe}")
                        };
                        Err(TtsError::new(
                            &self.provider,
                            format!("语音服务请求失败: HTTP {status}{suffix}"),
                        ))
                    }
                } else {
                    match self.provider.as_str() {
                        "minimax" => minimax_speech(&body, &self.api_key),
                        "gemini" => gemini_speech(&body),
                        "gpt-sovits" => bounded_audio(
                            body,
                            &self.provider,
                            response_mime(&headers, "audio/wav"),
                        ),
                        _ => bounded_audio(
                            body,
                            &self.provider,
                            response_mime(&headers, "audio/mpeg"),
                        ),
                    }
                }
            }
        };
        self.done = Some(result.clone());
        FlowStep::Done(result)
    }
}

fn decode_hex(text: &str) -> Option<Vec<u8>> {
    let mut out = Vec::with_capacity(text.len() / 2);
    let mut high = None;
    for b in text.bytes() {
        if high.is_none() && (b.is_ascii_whitespace() || b == b'\x0b') {
            continue;
        }
        let digit = char::from(b).to_digit(16)? as u8;
        if let Some(high) = high.take() {
            out.push(high * 16 + digit);
        } else {
            high = Some(digit);
        }
    }
    if high.is_some() {
        None
    } else {
        Some(out)
    }
}

fn minimax_speech(data: &[u8], api_key: &str) -> Result<Speech, TtsError> {
    let provider = "minimax";
    let body: Json =
        serde_json::from_slice(data).map_err(|_| TtsError::parse(provider, "JSONDecodeError"))?;
    if let Some(base) = body.get("base_resp").and_then(Value::as_object) {
        let status = base.get("status_code").unwrap_or(&Value::Null);
        if status.is_array() || status.is_object() {
            return Err(TtsError::parse(provider, "TypeError"));
        }
        let ok =
            status.is_null() || status.as_f64() == Some(0.0) || status.as_bool() == Some(false);
        if !ok {
            let message = base
                .get("status_msg")
                .filter(|v| truthy(v))
                .map(py_string)
                .unwrap_or("MiniMax TTS 请求失败".into());
            let trace = body
                .get("trace_id")
                .filter(|v| truthy(v))
                .map(py_string)
                .unwrap_or_default();
            // Python's base_resp errors did not redact reflected credentials;
            // preserve the diagnostic text, but never expose the browser key.
            let message = redact_provider_detail(&message, &[api_key]);
            let trace = redact_provider_detail(&trace, &[api_key]);
            let status = redact_provider_detail(&py_string(status), &[api_key]);
            let suffix = if trace.is_empty() {
                String::new()
            } else {
                format!(" trace_id={trace}")
            };
            return Err(TtsError::new(
                provider,
                format!("MiniMax TTS {status}: {message}{suffix}"),
            ));
        }
    }
    let hex = body
        .get("data")
        .and_then(|data| data.get("audio"))
        .and_then(Value::as_str)
        .filter(|s| !s.is_empty())
        .ok_or_else(|| TtsError::new(provider, "MiniMax TTS 响应缺少 data.audio"))?;
    let audio = decode_hex(hex)
        .ok_or_else(|| TtsError::new(provider, "MiniMax TTS 返回了无效的 hex 音频"))?;
    bounded_audio(audio, provider, "audio/mpeg".into())
}

fn sample_rate(mime: &str) -> Result<u32, TtsError> {
    let lower = mime.to_lowercase();
    for (offset, _) in lower.match_indices("rate=") {
        let digits: String = lower[offset + 5..]
            .chars()
            .map_while(decimal_digit)
            .filter_map(|digit| char::from_digit(digit, 10))
            .collect();
        if !digits.is_empty() {
            return digits
                .parse()
                .map_err(|_| TtsError::parse("gemini", "error"));
        }
    }
    Ok(24_000)
}

fn gemini_speech(data: &[u8]) -> Result<Speech, TtsError> {
    let provider = "gemini";
    let body: Json =
        serde_json::from_slice(data).map_err(|_| TtsError::parse(provider, "JSONDecodeError"))?;
    let part = body
        .get("candidates")
        .and_then(Value::as_array)
        .and_then(|a| a.first())
        .and_then(|c| c.get("content"))
        .and_then(|c| c.get("parts"))
        .and_then(Value::as_array)
        .and_then(|a| a.first())
        .ok_or_else(|| TtsError::new(provider, "Gemini TTS 响应缺少音频内容"))?;
    let inline = part
        .get("inlineData")
        .filter(|v| truthy(v))
        .or_else(|| part.get("inline_data"))
        .filter(|v| v.is_object())
        .ok_or_else(|| TtsError::new(provider, "Gemini TTS 响应缺少 inlineData.data"))?;
    let encoded = inline
        .get("data")
        .and_then(Value::as_str)
        .ok_or_else(|| TtsError::new(provider, "Gemini TTS 响应缺少 inlineData.data"))?;
    // Python validate=True does not reject nonzero unused bits in the last sextet.
    let decoder = GeneralPurpose::new(
        &base64::alphabet::STANDARD,
        GeneralPurposeConfig::new().with_decode_allow_trailing_bits(true),
    );
    let audio = decoder
        .decode(encoded)
        .map_err(|_| TtsError::new(provider, "Gemini TTS 返回了无效的 base64 音频"))?;
    let mime = inline
        .get("mimeType")
        .filter(|v| truthy(v))
        .or_else(|| inline.get("mime_type").filter(|v| truthy(v)))
        .map(py_string)
        .unwrap_or("audio/L16;rate=24000".into());
    if mime.to_lowercase().contains("wav") {
        return bounded_audio(audio, provider, "audio/wav".into());
    }
    if audio.len() / 2 * 2 + 44 > MAX_AUDIO_BYTES {
        return Err(TtsError::new(provider, TOO_LARGE));
    }
    let wav = pcm16_to_wav(&audio, sample_rate(&mime)?)?;
    bounded_audio(wav, provider, "audio/wav".into())
}

/// Construct a `nori.tts.test` flow from the nested-or-flat event payload.
pub fn test_flow(payload: &Json) -> SynthFlow {
    let raw = payload
        .get("config")
        .filter(|v| v.is_object())
        .unwrap_or(payload);
    let config = sanitize_tts_config(raw);
    let text = payload
        .get("text")
        .filter(|v| truthy(v))
        .map(py_string)
        .unwrap_or("你好，我是 Nori。这是一段语音测试。".into());
    let text: String = py_trim(&text).chars().take(400).collect();
    SynthFlow::new(&text, &config)
}

/// Exact channel and payload for the Settings synthesis result.
pub fn test_result_payload(result: &Result<Speech, TtsError>) -> (&'static str, Json) {
    result_payload(result, "test", None)
}

/// Exact channel and payload for chat speech; only successful audio has blockId.
pub fn chat_result_payload(
    result: &Result<Speech, TtsError>,
    operation_id: &str,
    message_id: &str,
) -> (&'static str, Json) {
    result_payload(result, "chat", Some((operation_id, message_id)))
}

fn result_payload(
    result: &Result<Speech, TtsError>,
    purpose: &str,
    ids: Option<(&str, &str)>,
) -> (&'static str, Json) {
    let (channel, mut payload) = match result {
        Ok(speech) => ("nori.tts.audio", speech.event_payload()),
        Err(error) => (
            "nori.tts.error",
            json!({"ok":false,"provider":error.provider,"error":error.message}),
        ),
    };
    if result.is_ok() {
        payload["ok"] = json!(true);
    }
    payload["purpose"] = json!(purpose);
    if let Some((operation_id, message_id)) = ids {
        payload["operationId"] = json!(operation_id);
        payload["messageId"] = json!(message_id);
        if result.is_ok() {
            payload["blockId"] = json!(0);
        }
    }
    (channel, payload)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn config(provider: &str) -> Json {
        sanitize_tts_config(
            &json!({"enabled":true,"provider":provider,"baseUrl":"http://127.0.0.1:9880",
            "apiKey":"test-secret","voice":"test-voice","refAudio":"local.wav"}),
        )
    }
    fn response(status: u16, bytes: Vec<u8>, mime: &str, truncated: bool) -> HttpResult {
        HttpResult::Response {
            status,
            body: bytes,
            headers: vec![("content-type".into(), mime.into())],
            truncated,
        }
    }
    fn json_response(body: Json) -> HttpResult {
        response(
            200,
            serde_json::to_vec(&body).unwrap(),
            "application/json",
            false,
        )
    }
    fn request(step: FlowStep<Result<Speech, TtsError>>) -> HttpRequest {
        match step {
            FlowStep::Http(request) => request,
            other => panic!("expected HTTP: {other:?}"),
        }
    }
    fn done(step: FlowStep<Result<Speech, TtsError>>) -> Result<Speech, TtsError> {
        match step {
            FlowStep::Done(result) => result,
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
    fn gemini_body(audio: &[u8], mime: &str) -> Json {
        json!({"candidates":[{"content":{"parts":[{"inlineData":{"mimeType":mime,
            "data":general_purpose::STANDARD.encode(audio)}}]}}]})
    }

    #[test]
    fn sanitize_settings_bounds_defaults_and_summary() {
        let raw = json!({"enabled":true,"provider":" MINIMAX ","baseUrl":"https://api.minimaxi.com/v1/",
            "apiKey":"tts-super-secret","model":"speech-2.8-turbo","voice":"male-qn-qingse","speed":9});
        let config = sanitize_tts_config(&raw);
        assert_eq!(config["enabled"], true);
        assert_eq!(config["provider"], "minimax");
        assert_eq!(config["baseUrl"], "https://api.minimaxi.com/v1");
        assert_eq!(config["speed"], 4.0);
        let summary = public_tts_summary(&config);
        assert_eq!(summary["hasApiKey"], true);
        assert_eq!(summary["hasReferenceAudio"], false);
        assert!(summary.get("apiKey").is_none());
        assert!(!summary.to_string().contains("tts-super-secret"));
        assert_eq!(config_result_payload(&raw), summary);
        let defaults = sanitize_tts_config(&json!([]));
        assert_eq!(defaults["enabled"], false);
        assert_eq!(defaults["provider"], "openai-compatible");
        assert_eq!(defaults["speed"], 1.0);
        assert_eq!(defaults["promptLang"], "zh");
        assert_eq!(defaults["textLang"], "zh");
        for url in [
            "https://user:password@example.test/v1",
            "https://key@example.test",
            "https:///v1",
            "file:///tmp/a",
        ] {
            assert_eq!(sanitize_tts_config(&json!({"baseUrl":url}))["baseUrl"], "");
        }
        assert_eq!(sanitize_tts_config(&json!({"speed":false}))["speed"], 1.0);
        assert_eq!(sanitize_tts_config(&json!({"speed":"0.1"}))["speed"], 0.25);
        assert_eq!(sanitize_tts_config(&json!({"speed":"nan"}))["speed"], 4.0);
        let config = sanitize_tts_config(
            &json!({"refAudio":"你".repeat(4001),"promptText":"好".repeat(4001),
            "apiKey":"k".repeat(2049),"model":"m".repeat(201),"voice":"v".repeat(201),
            "promptLang":"p".repeat(41),"textLang":"t".repeat(41)}),
        );
        for (key, length) in [
            ("refAudio", 4000),
            ("promptText", 4000),
            ("apiKey", 2048),
            ("model", 200),
            ("voice", 200),
            ("promptLang", 40),
            ("textLang", 40),
        ] {
            assert_eq!(config[key].as_str().unwrap().chars().count(), length);
        }
        assert_eq!(public_tts_summary(&config)["hasReferenceAudio"], true);
    }

    #[test]
    fn endpoint_normalization_and_bearer_redaction() {
        for (base, suffix, expected) in [
            (
                "https://api.openai.com/v1",
                "/audio/speech",
                "https://api.openai.com/v1/audio/speech",
            ),
            (
                "https://api.openai.com/v1/audio/speech/",
                "/audio/speech",
                "https://api.openai.com/v1/audio/speech",
            ),
            (
                "https://api.minimaxi.com/v1/t2a_v2",
                "/t2a_v2",
                "https://api.minimaxi.com/v1/t2a_v2",
            ),
            (" https://provider/TTS/ ", " tts ", "https://provider/TTS"),
        ] {
            assert_eq!(provider_endpoint(base, suffix), expected);
        }
        assert_eq!(
            redact_provider_detail(
                "Authorization: Bearer tts-super-secret key=tts-super-secret",
                &["tts-super-secret"]
            ),
            "Authorization: Bearer *** key=***"
        );
        assert_eq!(
            redact_provider_detail("bEaReR\t\nAbcD_~+/=-123 Bearer short", &[]),
            "Bearer *** Bearer short"
        );
        assert_eq!(
            redact_provider_detail("foobearer abcdef! bearer\u{2003}abcdef", &[]),
            "fooBearer ***! Bearer ***"
        );
        let safe = redact_provider_detail(&format!("\n{}\n", "好".repeat(500)), &[]);
        assert_eq!(safe.chars().count(), 299); // cap before newline replacement/strip
        assert!(!safe.contains('\n'));
        assert_eq!(
            redact_provider_detail("literal [a.*] [a.*]", &["[a.*]"]),
            "literal *** ***"
        );
    }

    #[test]
    fn all_provider_request_shapes_and_auth_headers() {
        for provider in [
            "openai-compatible",
            "custom",
            "gpt-sovits",
            "minimax",
            "gemini",
        ] {
            let mut flow = SynthFlow::new("hello", &config(provider));
            let req = request(flow.start());
            assert_eq!(req.method, "POST");
            assert_eq!(req.timeout_ms, 45_000);
            assert!(!req.follow_redirects);
            assert_eq!(header(&req, "content-type"), Some("application/json"));
            assert_eq!(
                req.max_response_bytes,
                if matches!(provider, "minimax" | "gemini") {
                    MAX_JSON_BYTES
                } else {
                    MAX_AUDIO_BYTES
                }
            );
            let payload = body(&req);
            if provider == "gemini" {
                assert_eq!(header(&req, "x-goog-api-key"), Some("test-secret"));
                assert_eq!(header(&req, "authorization"), None);
                assert_eq!(
                    payload["generationConfig"]["responseModalities"],
                    json!(["AUDIO"])
                );
                assert_eq!(payload["contents"][0]["parts"][0]["text"], "hello");
                assert_eq!(
                    payload["generationConfig"]["speechConfig"]["voiceConfig"]
                        ["prebuiltVoiceConfig"]["voiceName"],
                    "test-voice"
                );
                assert_eq!(
                    req.url,
                    "http://127.0.0.1:9880/models/gemini-3.1-flash-tts-preview:generateContent"
                );
            } else {
                assert_eq!(header(&req, "authorization"), Some("Bearer test-secret"));
            }
            match provider {
                "openai-compatible" => {
                    assert_eq!(req.url, "http://127.0.0.1:9880/audio/speech");
                    assert_eq!(
                        payload,
                        json!({"model":"gpt-4o-mini-tts","input":"hello","voice":"test-voice","speed":1.0})
                    );
                }
                "custom" => {
                    assert_eq!(req.url, "http://127.0.0.1:9880");
                    assert_eq!(
                        payload,
                        json!({"text":"hello","voice":"test-voice","speed":1.0})
                    );
                }
                "gpt-sovits" => {
                    assert_eq!(req.url, "http://127.0.0.1:9880/tts");
                    assert_eq!(
                        payload,
                        json!({"text":"hello","text_lang":"zh","ref_audio_path":"local.wav", "prompt_text":"","prompt_lang":"zh","speed_factor":1.0})
                    );
                }
                "minimax" => {
                    assert_eq!(req.url, "http://127.0.0.1:9880/t2a_v2");
                    assert_eq!(
                        payload,
                        json!({"model":"speech-2.8-turbo","text":"hello","stream":false,
                        "voice_setting":{"voice_id":"test-voice","speed":1.0},
                        "audio_setting":{"sample_rate":32000,"format":"mp3","channel":1},"output_format":"hex"})
                    );
                }
                _ => {}
            }
        }
    }

    #[test]
    fn provider_defaults_and_full_endpoints() {
        for (provider,url) in [
            ("openai-compatible","https://api.openai.com/v1/audio/speech"),
            ("gpt-sovits","http://127.0.0.1:9880/tts"),
            ("minimax","https://api.minimaxi.com/v1/t2a_v2"),
            ("gemini","https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-tts-preview:generateContent"),
        ] {
            let config = sanitize_tts_config(&json!({"enabled":true,"provider":provider}));
            let req = request(SynthFlow::new("hello",&config).start());
            assert_eq!(req.url,url);
            assert_eq!(header(&req,"Authorization"),None);
            assert_eq!(header(&req,"x-goog-api-key"),None);
            let payload = body(&req);
            match provider {
                "openai-compatible" => assert_eq!(payload["voice"],"nova"),
                "minimax" => assert_eq!(payload["voice_setting"]["voice_id"],"male-qn-qingse"),
                "gemini" => assert_eq!(payload["generationConfig"]["speechConfig"]["voiceConfig"]["prebuiltVoiceConfig"]["voiceName"],"Kore"),
                _ => {}
            }
        }
        for (provider, url) in [
            ("openai-compatible", "https://provider/v1/audio/speech"),
            ("gpt-sovits", "https://provider/tts"),
            ("minimax", "https://provider/t2a_v2"),
            ("gemini", "https://provider/models/model:generateContent"),
        ] {
            let config = sanitize_tts_config(
                &json!({"enabled":true,"provider":provider,"baseUrl":format!("{url}/")}),
            );
            assert_eq!(request(SynthFlow::new("hello", &config).start()).url, url);
        }
    }

    #[test]
    fn decoded_stream_success_for_each_provider() {
        let audio = b"ID3-test";
        for provider in [
            "openai-compatible",
            "custom",
            "gpt-sovits",
            "minimax",
            "gemini",
        ] {
            let mut flow = SynthFlow::new("hello", &config(provider));
            request(flow.start());
            // Gzip decoding/stream closure belong to the host; core receives
            // the same decoded bytes that Python's aiter_bytes supplies.
            let result = match provider {
                "minimax" => json_response(
                    json!({"data":{"audio":crate::jsonutil::hex_encode(audio)},"base_resp":{"status_code":0}}),
                ),
                "gemini" => json_response(gemini_body(audio, "audio/wav")),
                _ => response(200, audio.to_vec(), " Audio/MPEG ; codec=test", false),
            };
            let speech = done(flow.resume(result)).unwrap();
            assert_eq!(speech.audio, audio);
            assert_eq!(speech.provider, provider);
            assert_eq!(
                speech.mime,
                if provider == "gemini" {
                    "audio/wav"
                } else {
                    "audio/mpeg"
                }
            );
            assert_eq!(done(flow.start()).unwrap(), speech);
        }
        for (mime, expected) in [
            ("application/octet-stream", "application/octet-stream"),
            ("text/html", "audio/mpeg"),
            ("", "audio/mpeg"),
        ] {
            let mut flow = SynthFlow::new("x", &config("custom"));
            assert_eq!(
                done(flow.resume(response(200, b"audio".to_vec(), mime, false)))
                    .unwrap()
                    .mime,
                expected
            );
        }
    }

    #[test]
    fn streaming_caps_and_oversized_gpt_never_retries() {
        for provider in [
            "openai-compatible",
            "custom",
            "gpt-sovits",
            "minimax",
            "gemini",
        ] {
            let mut flow = SynthFlow::new("hello", &config(provider));
            let req = request(flow.start());
            let error =
                done(flow.resume(response(200, b"decoded-prefix".to_vec(), "", true))).unwrap_err();
            assert_eq!(error.provider, provider);
            assert_eq!(error.message, TOO_LARGE);
            // Also reject a host that supplied an oversize body without the flag.
            let mut flow = SynthFlow::new("hello", &config(provider));
            assert_eq!(
                done(flow.resume(response(
                    200,
                    vec![b'x'; req.max_response_bytes + 1],
                    "",
                    false
                )))
                .unwrap_err()
                .message,
                TOO_LARGE
            );
        }
        let mut flow = SynthFlow::new("x", &config("custom"));
        assert_eq!(
            done(flow.resume(response(200, vec![b'x'; MAX_AUDIO_BYTES], "", false)))
                .unwrap()
                .audio
                .len(),
            MAX_AUDIO_BYTES
        );
    }

    #[test]
    fn json_envelope_and_decoded_audio_caps() {
        for provider in ["minimax", "gemini"] {
            for size in [MAX_AUDIO_BYTES, MAX_AUDIO_BYTES + 1] {
                let audio = vec![b'x'; size];
                let json = if provider == "minimax" {
                    json!({"data":{"audio":crate::jsonutil::hex_encode(&audio)}})
                } else {
                    gemini_body(&audio, "audio/wav")
                };
                let bytes = serde_json::to_vec(&json).unwrap();
                assert!(bytes.len() > MAX_AUDIO_BYTES && bytes.len() <= MAX_JSON_BYTES);
                let mut flow = SynthFlow::new("hello", &config(provider));
                let result = done(flow.resume(response(200, bytes, "application/json", false)));
                if size == MAX_AUDIO_BYTES {
                    assert_eq!(result.unwrap().audio.len(), size);
                } else {
                    assert_eq!(result.unwrap_err().message, TOO_LARGE);
                }
            }
        }
        // A PCM WAV includes a 44-byte header, and trims an odd tail first.
        let mut flow = SynthFlow::new("x", &config("gemini"));
        assert_eq!(
            done(flow.resume(json_response(gemini_body(
                &vec![0; MAX_AUDIO_BYTES],
                "audio/L16"
            ))))
            .unwrap_err()
            .message,
            TOO_LARGE
        );
    }

    #[test]
    fn bounded_redacted_error_detail_and_redirects() {
        for provider in ["openai-compatible", "custom", "minimax", "gemini"] {
            let mut flow = SynthFlow::new("hello", &config(provider));
            let detail = format!(
                "test-secret Bearer unknown-reflected-token\n{}",
                "好".repeat(MAX_ERROR_BYTES)
            );
            let error =
                done(flow.resume(response(400, detail.into_bytes(), "", true))).unwrap_err();
            assert!(error
                .message
                .starts_with("语音服务请求失败: HTTP 400 *** Bearer *** "));
            assert!(!error.message.contains("test-secret"));
            assert!(!error.message.contains('\n'));
            assert!(error.message.chars().count() <= 330);
            let mut flow = SynthFlow::new("hello", &config(provider));
            let mut detail = vec![b' '; MAX_ERROR_BYTES];
            detail.extend_from_slice(b"must-not-be-read");
            assert_eq!(
                done(flow.resume(response(302, detail, "", true)))
                    .unwrap_err()
                    .message,
                "语音服务请求失败: HTTP 302"
            );
        }
    }

    #[test]
    fn gpt_post_to_get_fallback_query_and_failures() {
        for (status, truncated) in [(200, false), (405, true), (302, false)] {
            let config = sanitize_tts_config(
                &json!({"enabled":true,"provider":"gpt-sovits","apiKey":"secret",
                "refAudio":"C:/音频/a b.wav","promptText":"a+b&c","textLang":"en","promptLang":"ja","speed":1.25}),
            );
            let mut flow = SynthFlow::new("你好 hello", &config);
            let post = request(flow.start());
            let get = request(flow.resume(response(
                status,
                if status == 200 {
                    vec![]
                } else {
                    vec![b'e'; 64]
                },
                "",
                truncated,
            )));
            assert_eq!(get.method, "GET");
            assert_eq!(get.body, None);
            assert_eq!(post.headers, get.headers);
            assert_eq!(get.max_response_bytes, MAX_AUDIO_BYTES);
            assert_eq!(get.url,"http://127.0.0.1:9880/tts?text=%E4%BD%A0%E5%A5%BD+hello&text_lang=en&ref_audio_path=C%3A%2F%E9%9F%B3%E9%A2%91%2Fa+b.wav&prompt_text=a%2Bb%26c&prompt_lang=ja&speed_factor=1.25");
            let speech =
                done(flow.resume(response(200, b"RIFF-audio".to_vec(), "audio/wav", false)))
                    .unwrap();
            assert_eq!(speech.audio, b"RIFF-audio");
        }
        for (result, message) in [
            (
                response(503, b"secret".to_vec(), "", true),
                "GPT-SoVITS 合成失败: HTTP 503",
            ),
            (response(200, vec![], "", false), EMPTY_AUDIO),
            (response(200, b"prefix".to_vec(), "", true), TOO_LARGE),
        ] {
            let mut flow = SynthFlow::new("hello", &config("gpt-sovits"));
            request(flow.resume(response(405, vec![], "", false)));
            assert_eq!(done(flow.resume(result)).unwrap_err().message, message);
        }
        let mut flow = SynthFlow::new("hello", &config("gpt-sovits"));
        assert_eq!(
            done(flow.resume(HttpResult::Timeout)).unwrap_err().message,
            "语音服务请求超时"
        );
    }

    #[test]
    fn minimax_hex_base_response_and_trace_id() {
        let mut flow = SynthFlow::new("你好", &config("minimax"));
        let speech = done(
            flow.resume(json_response(json!({"data":{"audio":"49\u{0b}44\n33"},
            "base_resp":{"status_code":0,"status_msg":"success"},"trace_id":"trace-test"}))),
        )
        .unwrap();
        assert_eq!(speech.audio, b"ID3");
        assert_eq!(speech.mime, "audio/mpeg");
        for (body, message) in [
            (
                json!({"base_resp":{"status_code":1001,"status_msg":"bad voice"},"trace_id":"trace-test"}),
                "MiniMax TTS 1001: bad voice trace_id=trace-test",
            ),
            (
                json!({"base_resp":{"status_code":1001}}),
                "MiniMax TTS 1001: MiniMax TTS 请求失败",
            ),
            (json!({}), "MiniMax TTS 响应缺少 data.audio"),
            (
                json!({"data":{"audio":""}}),
                "MiniMax TTS 响应缺少 data.audio",
            ),
            (
                json!({"data":{"audio":"4 9"}}),
                "MiniMax TTS 返回了无效的 hex 音频",
            ),
            (
                json!({"data":{"audio":"xyz"}}),
                "MiniMax TTS 返回了无效的 hex 音频",
            ),
            (json!({"data":{"audio":"  "}}), EMPTY_AUDIO),
        ] {
            let mut flow = SynthFlow::new("x", &config("minimax"));
            assert_eq!(
                done(flow.resume(json_response(body))).unwrap_err().message,
                message
            );
        }
        let mut flow = SynthFlow::new("x", &config("minimax"));
        let error = done(flow.resume(json_response(json!({"base_resp":{"status_code":1,"status_msg":"test-secret Bearer different-token"},"trace_id":"test-secret"})))).unwrap_err();
        assert_eq!(error.message, "MiniMax TTS 1: *** Bearer *** trace_id=***");
        assert!(!test_result_payload(&Err(error))
            .1
            .to_string()
            .contains("test-secret"));
    }

    #[test]
    fn gemini_inline_audio_pcm_rate_and_validation() {
        assert_eq!(sample_rate("audio/L16;RATE=１６０００").unwrap(), 16000);
        assert_eq!(
            sample_rate("audio/L16;rate=oops;rate=12000").unwrap(),
            12000
        );
        let pcm = b"\x00\x00\x01\x00\x02\x00\xff";
        let mut flow = SynthFlow::new("Hello", &config("gemini"));
        let wav = done(flow.resume(json_response(gemini_body(
            pcm,
            "audio/L16;codec=pcm;RATE=16000",
        ))))
        .unwrap();
        assert_eq!(wav.mime, "audio/wav");
        assert_eq!(&wav.audio[..4], b"RIFF");
        assert_eq!(&wav.audio[8..12], b"WAVE");
        assert_eq!(
            u32::from_le_bytes(wav.audio[24..28].try_into().unwrap()),
            16000
        );
        assert_eq!(&wav.audio[44..], &pcm[..6]);
        let mut flow = SynthFlow::new("x", &config("gemini"));
        let default = done(flow.resume(json_response(
            json!({"candidates":[{"content":{"parts":[{"inlineData":{},
            "inline_data":{"data":"","mime_type":"audio/L16"}}]}}]}),
        )))
        .unwrap();
        assert_eq!(default.audio.len(), 44); // Python wraps even empty raw PCM
        assert_eq!(
            u32::from_le_bytes(default.audio[24..28].try_into().unwrap()),
            24000
        );
        for (body, message) in [
            (json!({"candidates":[]}), "Gemini TTS 响应缺少音频内容"),
            (
                json!({"candidates":[{"content":{"parts":[{}]}}]}),
                "Gemini TTS 响应缺少 inlineData.data",
            ),
            (
                json!({"candidates":[{"content":{"parts":[{"inlineData":{"data":"bad!"}}]}}]}),
                "Gemini TTS 返回了无效的 base64 音频",
            ),
            (gemini_body(&[], "audio/wav"), EMPTY_AUDIO),
            (
                gemini_body(pcm, "audio/L16;rate=0"),
                "语音服务响应无法解析: Error",
            ),
        ] {
            let mut flow = SynthFlow::new("x", &config("gemini"));
            assert_eq!(
                done(flow.resume(json_response(body))).unwrap_err().message,
                message
            );
        }
    }

    #[test]
    fn pcm16_wav_riff_header() {
        let wav = pcm16_to_wav(b"\x00\x00\x01\x00\xff", 24000).unwrap();
        assert_eq!(&wav[..4], b"RIFF");
        assert_eq!(&wav[8..16], b"WAVEfmt ");
        assert_eq!(u32::from_le_bytes(wav[4..8].try_into().unwrap()), 40);
        assert_eq!(u16::from_le_bytes(wav[20..22].try_into().unwrap()), 1);
        assert_eq!(u16::from_le_bytes(wav[22..24].try_into().unwrap()), 1);
        assert_eq!(u32::from_le_bytes(wav[24..28].try_into().unwrap()), 24000);
        assert_eq!(u32::from_le_bytes(wav[28..32].try_into().unwrap()), 48000);
        assert_eq!(u16::from_le_bytes(wav[32..34].try_into().unwrap()), 2);
        assert_eq!(u16::from_le_bytes(wav[34..36].try_into().unwrap()), 16);
        assert_eq!(&wav[36..40], b"data");
        assert_eq!(u32::from_le_bytes(wav[40..44].try_into().unwrap()), 4);
        assert_eq!(wav.len(), 48);
    }

    #[test]
    fn disabled_empty_text_limits_and_error_taxonomy() {
        let error =
            done(SynthFlow::new("hello", &sanitize_tts_config(&json!({}))).start()).unwrap_err();
        assert_eq!(
            (error.provider.as_str(), error.message.as_str()),
            ("disabled", "浏览器 TTS 未启用")
        );
        assert_eq!(
            done(SynthFlow::new(" \n", &config("custom")).start())
                .unwrap_err()
                .message,
            "没有可合成的文本"
        );
        let settings = sanitize_tts_config(&json!({"enabled":true,"provider":"custom"}));
        assert_eq!(
            done(SynthFlow::new("x", &settings).start())
                .unwrap_err()
                .message,
            "未配置自定义 TTS 请求端点"
        );
        let settings = sanitize_tts_config(&json!({"enabled":true}));
        let payload = body(&request(
            SynthFlow::new(&"好".repeat(4001), &settings).start(),
        ));
        assert_eq!(payload["input"].as_str().unwrap().chars().count(), 4000);
        for provider in [
            "openai-compatible",
            "custom",
            "gpt-sovits",
            "minimax",
            "gemini",
        ] {
            for (result, message) in [
                (HttpResult::Timeout, "语音服务请求超时"),
                (
                    HttpResult::Network("test-secret https://key:password@host".into()),
                    "语音服务网络请求失败: RequestError",
                ),
            ] {
                let mut flow = SynthFlow::new("hello", &config(provider));
                assert_eq!(
                    done(flow.resume(result)).unwrap_err(),
                    TtsError::new(provider, message)
                );
            }
        }
        for provider in ["minimax", "gemini"] {
            let mut flow = SynthFlow::new("hello", &config(provider));
            assert_eq!(
                done(flow.resume(response(200, b"not json".to_vec(), "", false)))
                    .unwrap_err()
                    .message,
                "语音服务响应无法解析: JSONDecodeError"
            );
        }
        let mut flow = SynthFlow::new("hello", &config("openai-compatible"));
        assert_eq!(
            done(flow.resume(response(200, vec![], "", false)))
                .unwrap_err()
                .message,
            EMPTY_AUDIO
        );
    }

    #[test]
    fn test_and_chat_payload_contracts_without_secrets() {
        let mut flow = test_flow(&json!({"config":{"enabled":true,"apiKey":"tts-super-secret"}}));
        let req = request(flow.start());
        assert!(body(&req)["input"].as_str().unwrap().contains("Nori"));
        assert_eq!(
            header(&req, "Authorization"),
            Some("Bearer tts-super-secret")
        );
        let speech =
            done(flow.resume(response(200, b"test-audio".to_vec(), "audio/mpeg", false))).unwrap();
        assert_eq!(
            speech.event_payload(),
            json!({"audio":"dGVzdC1hdWRpbw==","mime":"audio/mpeg","provider":"openai-compatible"})
        );
        let result = Ok(speech);
        let (channel, payload) = test_result_payload(&result);
        assert_eq!(channel, "nori.tts.audio");
        assert_eq!(payload["ok"], true);
        assert_eq!(payload["purpose"], "test");
        assert!(!payload.to_string().contains("tts-super-secret"));
        assert!(payload.get("operationId").is_none());
        let (channel, payload) = chat_result_payload(&result, "op", "msg");
        assert_eq!(channel, "nori.tts.audio");
        assert_eq!(payload["purpose"], "chat");
        assert_eq!(payload["operationId"], "op");
        assert_eq!(payload["messageId"], "msg");
        assert_eq!(payload["blockId"], 0);
        let error = Err(TtsError::new("minimax", "failure"));
        assert_eq!(
            test_result_payload(&error),
            (
                "nori.tts.error",
                json!({"ok":false,"provider":"minimax","error":"failure","purpose":"test"})
            )
        );
        assert_eq!(
            chat_result_payload(&error, "op", "msg"),
            (
                "nori.tts.error",
                json!({"ok":false,"provider":"minimax","error":"failure","purpose":"chat","operationId":"op","messageId":"msg"})
            )
        );
        let mut flow = test_flow(&json!({"enabled":true,"text":"你".repeat(401)}));
        assert_eq!(
            body(&request(flow.start()))["input"]
                .as_str()
                .unwrap()
                .chars()
                .count(),
            400
        );
        assert_eq!(
            done(test_flow(&json!({"enabled":true,"text":" "})).start())
                .unwrap_err()
                .message,
            "没有可合成的文本"
        );
        let mut flow = test_flow(&json!({"enabled":true,"text":null}));
        assert!(body(&request(flow.start()))["input"]
            .as_str()
            .unwrap()
            .contains("Nori"));
    }
}

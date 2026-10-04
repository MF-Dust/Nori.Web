//! End-to-end provider path of the local server: per-dispatch browser
//! credentials (`noriAiConfig` / `noriTtsConfig`) → reqwest → chat reply and
//! `nori.tts.audio` broadcast, against local mock providers.

use axum::extract::State;
use axum::http::{HeaderMap, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::routing::post;
use axum::{Json, Router};
use futures_util::{SinkExt, StreamExt};
use nori_core::auth::issue_ticket;
use nori_core::config::ServerAi;
use nori_core::jsonutil::now_secs;
use nori_core::live_pack::LivePack;
use nori_local::executor::Executor;
use nori_local::registry::Registry;
use nori_local::ws::{self, WsContext};
use serde_json::{json, Value};
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tokio_tungstenite::tungstenite::client::IntoClientRequest;
use tokio_tungstenite::tungstenite::Message;

const SECRET: &str = "provider-test-secret";

#[derive(Clone, Default)]
struct Seen {
    chat: Arc<Mutex<Vec<(HeaderMap, Value)>>>,
    speech: Arc<Mutex<Vec<(HeaderMap, Value)>>>,
}

async fn chat_completions(State(seen): State<Seen>, headers: HeaderMap, Json(body): Json<Value>) -> Response {
    let first = {
        let mut calls = seen.chat.lock().unwrap();
        calls.push((headers, body.clone()));
        calls.len() == 1
    };
    if first && body.get("max_tokens").is_some() {
        // Gateways that only accept the newer parameter (Python retries once).
        let error = json!({"error": {"message": "Unsupported parameter: 'max_tokens' is not supported with this model. Use 'max_completion_tokens' instead."}});
        return (StatusCode::BAD_REQUEST, Json(error)).into_response();
    }
    Json(json!({"choices": [{"message": {"role": "assistant", "content": [
        {"type": "text", "text": "[emotion:kirakira] 你好，"},
        {"type": "text", "text": "操作员！"},
    ]}}]}))
    .into_response()
}

async fn audio_speech(State(seen): State<Seen>, headers: HeaderMap, Json(body): Json<Value>) -> Response {
    seen.speech.lock().unwrap().push((headers, body));
    ([("content-type", "audio/mpeg")], vec![0x49u8, 0x44, 0x33, 0x04, 0x00, 0x01]).into_response()
}

async fn serve(app: Router) -> String {
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let addr = listener.local_addr().unwrap();
    tokio::spawn(async move { axum::serve(listener, app).await.unwrap() });
    format!("127.0.0.1:{}", addr.port())
}

type Socket = tokio_tungstenite::WebSocketStream<tokio_tungstenite::MaybeTlsStream<tokio::net::TcpStream>>;

async fn connect(addr: &str, user: &str) -> Socket {
    let mut request = format!("ws://{addr}{}", ws::MAIN_PATH).into_client_request().unwrap();
    let protocols = format!("arcade.v1, ticket.{}", issue_ticket(SECRET, user, now_secs()));
    request.headers_mut().insert("Sec-WebSocket-Protocol", protocols.parse().unwrap());
    tokio_tungstenite::connect_async(request).await.unwrap().0
}

/// Collect frames until `done` matches one of them (or time out).
async fn collect_until(socket: &mut Socket, done: impl Fn(&Value) -> bool) -> Vec<Value> {
    let mut frames = Vec::new();
    loop {
        let next = tokio::time::timeout(Duration::from_secs(10), socket.next()).await.expect("timeout waiting for frames");
        if let Some(Ok(Message::Text(text))) = next {
            let value: Value = serde_json::from_str(&text).unwrap();
            let finished = done(&value);
            frames.push(value);
            if finished {
                return frames;
            }
        }
    }
}

#[tokio::test]
async fn browser_ai_and_tts_settings_drive_real_provider_calls() {
    let seen = Seen::default();
    let provider = serve(
        Router::new()
            .route("/v1/chat/completions", post(chat_completions))
            .route("/v1/audio/speech", post(audio_speech))
            .with_state(seen.clone()),
    )
    .await;
    let ctx = Arc::new(WsContext {
        registry: Arc::new(Registry::new(Arc::new(LivePack::empty()))),
        // No server key: without browser settings this would use the local fallback.
        executor: Executor::new(ServerAi::default()),
        secret: SECRET.into(),
    });
    let addr = serve(ws::routes(ctx)).await;
    let mut socket = connect(&addr, "guest_provider").await;
    let base = format!("http://{provider}/v1");
    let dispatch = json!({
        "type": "dispatch", "actor": "player", "cartridgeId": "chat", "requestId": "r1",
        "expectedHeadVersion": 0, "cmd": {"type": "playerMessage", "text": "在吗？"},
        "noriAiConfig": {"enabled": true, "provider": "openai-compatible", "baseUrl": format!("{base}/chat/completions"), "model": "mock-model", "apiKey": "sk-browser-secret", "maxTokens": 77},
        "noriTtsConfig": {"enabled": true, "provider": "openai-compatible", "baseUrl": base, "apiKey": "tts-browser-secret", "voice": "alloy"},
    });
    socket.send(Message::Text(dispatch.to_string().into())).await.unwrap();

    let frames = collect_until(&mut socket, |m| m["channel"] == "nori.tts.audio").await;
    // The secrets never reach any frame (transition cmd, ack, events).
    for frame in &frames {
        let text = frame.to_string();
        assert!(!text.contains("sk-browser-secret") && !text.contains("tts-browser-secret"), "{text}");
    }
    let ingest = frames
        .iter()
        .find(|m| m.pointer("/transition/cmd/type") == Some(&json!("ingestBlock")))
        .expect("agent reply transition");
    assert_eq!(ingest["transition"]["cmd"]["content"], "你好，操作员！");
    assert_eq!(ingest["transition"]["cmd"]["emotion"], "excited", "kirakira alias");
    let audio = frames.last().unwrap();
    assert_eq!(audio["cartridgeId"], "chat");
    assert_eq!(audio["payload"]["ok"], true);
    assert_eq!(audio["payload"]["purpose"], "chat");
    assert_eq!(audio["payload"]["mime"], "audio/mpeg");
    assert_eq!(audio["payload"]["audio"], "SUQzBAAB");
    assert_eq!(audio["payload"]["blockId"], 0);

    let chat_calls = seen.chat.lock().unwrap().clone();
    assert_eq!(chat_calls.len(), 2, "one retry with max_completion_tokens");
    let (headers, first) = &chat_calls[0];
    assert_eq!(headers["authorization"], "Bearer sk-browser-secret");
    assert_eq!(first["model"], "mock-model");
    assert_eq!(first["max_tokens"], 77);
    let system = first["messages"][0]["content"].as_str().unwrap();
    assert!(system.contains("[emotion:"), "emotion protocol is always appended");
    assert_eq!(first["messages"].as_array().unwrap().last().unwrap()["content"], "在吗？");
    let (_, retry) = &chat_calls[1];
    assert!(retry.get("max_tokens").is_none());
    assert_eq!(retry["max_completion_tokens"], 77);

    let speech_calls = seen.speech.lock().unwrap().clone();
    assert_eq!(speech_calls.len(), 1);
    let (headers, body) = &speech_calls[0];
    assert_eq!(headers["authorization"], "Bearer tts-browser-secret");
    assert_eq!(body["input"], "你好，操作员！");
    assert_eq!(body["voice"], "alloy");
}

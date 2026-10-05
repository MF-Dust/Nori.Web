//! Arcade WebSocket endpoints (Python `backend/api/arcade.py`).
//!
//! Python rejects a handshake by closing before `accept()`; uvicorn turns
//! that into an HTTP 403, which is what clients observe. We do the same.

use crate::executor::Executor;
use crate::registry::{Outgoing, Registry};
use axum::extract::ws::{CloseFrame, Message, WebSocket, WebSocketUpgrade};
use axum::extract::State;
use axum::http::{header, HeaderMap, StatusCode, Uri};
use axum::response::{IntoResponse, Response};
use axum::routing::get;
use axum::Router;
use futures_util::{SinkExt, StreamExt};
use nori_core::{auth, session};
use serde_json::Value;
use std::sync::Arc;
use tokio::sync::mpsc;

pub const MAIN_PATH: &str = "/api/arcade/web/v1";
pub const MEDIA_PATH: &str = "/api/arcade/web/v1/media";

pub struct WsContext {
    pub registry: Arc<Registry>,
    pub executor: Executor,
    /// Ticket signing key (`SECRET_KEY`).
    pub secret: String,
}

pub fn routes(ctx: Arc<WsContext>) -> Router {
    Router::new()
        .route(MAIN_PATH, get(main_socket))
        .route(MEDIA_PATH, get(media_socket))
        .with_state(ctx)
}

fn header_text(headers: &HeaderMap, name: header::HeaderName) -> Option<&str> {
    headers.get(name).and_then(|v| v.to_str().ok())
}

fn forbidden() -> Response {
    StatusCode::FORBIDDEN.into_response()
}

/// Origin, subprotocol and ticket checks shared by both endpoints.
#[allow(clippy::result_large_err)]
fn authorize(ctx: &WsContext, headers: &HeaderMap, uri: &Uri) -> Result<String, Response> {
    let host = header_text(headers, header::HOST).unwrap_or("localhost");
    let url = format!("ws://{host}{}", uri.path());
    if !auth::is_same_origin(header_text(headers, header::ORIGIN), &url) {
        return Err(forbidden());
    }
    let protocols: Vec<&str> = header_text(headers, header::SEC_WEBSOCKET_PROTOCOL)
        .unwrap_or("")
        .split(',')
        .map(str::trim)
        .filter(|p| !p.is_empty())
        .collect();
    if !protocols.contains(&"arcade.v1") {
        return Err(forbidden());
    }
    let ticket = protocols
        .iter()
        .find_map(|p| p.strip_prefix("ticket."))
        .unwrap_or("");
    auth::resolve_ticket(&ctx.secret, ticket, nori_core::jsonutil::now_secs()).ok_or_else(forbidden)
}

fn not_a_websocket() -> Response {
    (
        StatusCode::NOT_FOUND,
        axum::Json(serde_json::json!({"detail": "API endpoint not found"})),
    )
        .into_response()
}

async fn main_socket(
    State(ctx): State<Arc<WsContext>>,
    headers: HeaderMap,
    uri: Uri,
    upgrade: Result<WebSocketUpgrade, axum::extract::ws::rejection::WebSocketUpgradeRejection>,
) -> Response {
    let Ok(upgrade) = upgrade else {
        return not_a_websocket();
    };
    let user_id = match authorize(&ctx, &headers, &uri) {
        Ok(user_id) => user_id,
        Err(response) => return response,
    };
    // The historical client stores its story/archive choice in a cookie.
    let story = auth::story_preference(header_text(&headers, header::COOKIE).unwrap_or(""));
    upgrade
        .protocols(["arcade.v1"])
        .on_upgrade(move |socket| run_main(ctx, socket, user_id, story))
}

async fn media_socket(
    State(ctx): State<Arc<WsContext>>,
    headers: HeaderMap,
    uri: Uri,
    upgrade: Result<WebSocketUpgrade, axum::extract::ws::rejection::WebSocketUpgradeRejection>,
) -> Response {
    let Ok(upgrade) = upgrade else {
        return not_a_websocket();
    };
    let user_id = match authorize(&ctx, &headers, &uri) {
        Ok(user_id) => user_id,
        Err(response) => return response,
    };
    upgrade
        .protocols(["arcade.v1"])
        .on_upgrade(move |socket| run_media(ctx, socket, user_id))
}

/// Split a socket into a reader and a channel-fed writer task.
fn writer(socket: WebSocket) -> (futures_util::stream::SplitStream<WebSocket>, Outgoing) {
    let (mut sink, stream) = socket.split();
    let (tx, mut rx) = mpsc::unbounded_channel::<Message>();
    tokio::spawn(async move {
        while let Some(message) = rx.recv().await {
            if let Message::Close(frame) = message {
                // Server-initiated: writes our Close frame. After a client
                // Close tungstenite refuses new frames (SendAfterClosing);
                // `close()` then flushes its queued reply, keeping it clean.
                let _ = sink.send(Message::Close(frame)).await;
                let _ = sink.close().await;
                break;
            }
            if sink.send(message).await.is_err() {
                break;
            }
        }
    });
    (stream, tx)
}

fn send_json(tx: &Outgoing, message: &Value) {
    let _ = tx.send(Message::Text(nori_core::protocol::ws_text(message).into()));
}

fn close(tx: &Outgoing, code: u16, reason: &str) {
    let _ = tx.send(Message::Close(Some(CloseFrame {
        code,
        reason: reason.into(),
    })));
}

async fn run_main(ctx: Arc<WsContext>, socket: WebSocket, user_id: String, story: Option<bool>) {
    let (mut stream, tx) = writer(socket);
    let slot = ctx.registry.slot(&user_id);
    let socket_id = ctx.registry.socket_id();
    slot.add_main(socket_id, tx.clone());
    while let Some(Ok(frame)) = stream.next().await {
        let raw = match frame {
            Message::Text(text) => text,
            Message::Close(frame) => {
                // Complete the closing handshake like uvicorn (clean close).
                let _ = tx.send(Message::Close(frame));
                break;
            }
            _ => continue,
        };
        let (message, secrets) = match session::prepare(raw.as_str(), story) {
            Ok(prepared) => prepared,
            Err(reply) => {
                send_json(&tx, &reply);
                continue;
            }
        };
        let out = {
            let mut world = slot.world();
            session::handle(&mut world, &message, &secrets)
        };
        slot.broadcast(&out.broadcast);
        for message in &out.direct {
            send_json(&tx, message);
        }
        for task in out.tasks {
            ctx.executor.spawn(slot.clone(), task, Some(tx.clone()));
        }
    }
    slot.remove(socket_id);
}

async fn run_media(ctx: Arc<WsContext>, socket: WebSocket, user_id: String) {
    let (mut stream, tx) = writer(socket);
    let first = match stream.next().await {
        Some(Ok(Message::Text(text))) => text,
        Some(Ok(Message::Close(_))) | None | Some(Err(_)) => return,
        Some(Ok(_)) => return close(&tx, 1002, "invalid_media_open"),
    };
    let Ok(message) = serde_json::from_str::<Value>(first.as_str()) else {
        return close(&tx, 1002, "invalid_media_open");
    };
    let grant = message
        .get("grant")
        .and_then(Value::as_str)
        .filter(|g| !g.is_empty());
    let (Some("open_media"), Some(grant)) = (message.get("type").and_then(Value::as_str), grant)
    else {
        return close(&tx, 4005, "media_grant_invalid");
    };
    let Some(slot) = ctx.registry.slot_for_grant(&user_id, grant) else {
        return close(&tx, 4005, "media_grant_invalid");
    };
    let socket_id = ctx.registry.socket_id();
    let world_id = slot.world().world_id.clone();
    slot.add_media(socket_id, world_id, tx.clone());
    // Keep the socket alive; client frames are ignored.
    while let Some(Ok(frame)) = stream.next().await {
        if let Message::Close(frame) = frame {
            let _ = tx.send(Message::Close(frame));
            break;
        }
    }
    slot.remove(socket_id);
}

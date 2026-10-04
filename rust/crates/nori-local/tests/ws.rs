//! Black-box WebSocket behavior of the local server (Python
//! `tests/test_backend_integration.py` WS parts).

use futures_util::{SinkExt, StreamExt};
use nori_core::auth::issue_ticket;
use nori_core::config::ServerAi;
use nori_core::jsonutil::now_secs;
use nori_core::live_pack::LivePack;
use nori_local::executor::Executor;
use nori_local::registry::Registry;
use nori_local::ws::{self, WsContext};
use serde_json::{json, Value};
use std::sync::Arc;
use std::time::Duration;
use tokio_tungstenite::tungstenite::client::IntoClientRequest;
use tokio_tungstenite::tungstenite::Message;

const SECRET: &str = "ws-test-secret";

async fn serve() -> String {
    let ctx = Arc::new(WsContext {
        registry: Arc::new(Registry::new(Arc::new(LivePack::empty()))),
        executor: Executor::new(ServerAi::default()),
        secret: SECRET.into(),
    });
    let app = ws::routes(ctx);
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let addr = listener.local_addr().unwrap();
    tokio::spawn(async move { axum::serve(listener, app).await.unwrap() });
    format!("127.0.0.1:{}", addr.port())
}

type Socket = tokio_tungstenite::WebSocketStream<tokio_tungstenite::MaybeTlsStream<tokio::net::TcpStream>>;

async fn connect(addr: &str, path: &str, protocols: &str) -> Result<Socket, tokio_tungstenite::tungstenite::Error> {
    let mut request = format!("ws://{addr}{path}").into_client_request().unwrap();
    request.headers_mut().insert("Sec-WebSocket-Protocol", protocols.parse().unwrap());
    tokio_tungstenite::connect_async(request).await.map(|(socket, response)| {
        assert_eq!(response.headers().get("sec-websocket-protocol").unwrap(), "arcade.v1");
        socket
    })
}

async fn send(socket: &mut Socket, message: Value) {
    socket.send(Message::Text(message.to_string().into())).await.unwrap();
}

/// Next JSON frame of the given type (skips others).
async fn expect(socket: &mut Socket, kind: &str) -> Value {
    loop {
        let frame = tokio::time::timeout(Duration::from_secs(5), socket.next()).await.expect("timeout").unwrap().unwrap();
        if let Message::Text(text) = frame {
            let value: Value = serde_json::from_str(&text).unwrap();
            if value["type"] == kind {
                return value;
            }
        }
    }
}

fn protocols(user: &str) -> String {
    format!("arcade.v1, ticket.{}", issue_ticket(SECRET, user, now_secs()))
}

#[tokio::test]
async fn handshake_rejections_are_http_403() {
    let addr = serve().await;
    for bad in ["ticket.nope", "arcade.v1, ticket.invalid", &format!("ticket.{}", issue_ticket(SECRET, "u", now_secs()))] {
        let error = connect(&addr, ws::MAIN_PATH, bad).await.unwrap_err();
        let tokio_tungstenite::tungstenite::Error::Http(response) = error else { panic!("{error:?}") };
        assert_eq!(response.status(), 403);
    }
    let mut request = format!("ws://{addr}{}", ws::MAIN_PATH).into_client_request().unwrap();
    request.headers_mut().insert("Sec-WebSocket-Protocol", protocols("u").parse().unwrap());
    request.headers_mut().insert("Origin", "http://evil.test".parse().unwrap());
    assert!(tokio_tungstenite::connect_async(request).await.is_err());
}

#[tokio::test]
async fn main_and_media_sockets_follow_the_protocol() {
    let addr = serve().await;
    let mut socket = connect(&addr, ws::MAIN_PATH, &protocols("guest_a")).await.unwrap();
    send(&mut socket, json!({"type": "open_my_web_world", "locale": "en"})).await;
    let joined = expect(&mut socket, "world_joined").await;
    let world_id = joined["world"]["worldId"].as_str().unwrap().to_string();
    let grant = joined["session"]["mediaGrant"].as_str().unwrap().to_string();

    send(&mut socket, json!({"type": "ping"})).await;
    let pong = expect(&mut socket, "pong").await;
    assert_eq!(pong["serverId"], "nori-local-arcade");
    assert!(pong["now"].is_i64());

    socket.send(Message::Text("not json".into())).await.unwrap();
    assert_eq!(expect(&mut socket, "error").await["message"], "Invalid JSON");

    let mut media = connect(&addr, ws::MEDIA_PATH, &protocols("guest_a")).await.unwrap();
    send(&mut media, json!({"type": "open_media", "grant": grant})).await;
    tokio::time::sleep(Duration::from_millis(100)).await;

    send(&mut socket, json!({
        "type": "dispatch", "actor": "player", "cartridgeId": "chat", "requestId": "r1",
        "expectedHeadVersion": 0, "cmd": {"type": "playerMessage", "text": "hello"},
    }))
    .await;
    let transition = expect(&mut socket, "runtime_transition").await;
    assert_eq!(transition["worldId"], world_id.as_str());
    let ack = expect(&mut socket, "dispatch_ack").await;
    assert_eq!((ack["success"].clone(), ack["committed"].clone(), ack["requestId"].clone()), (json!(true), json!(true), json!("r1")));

    // Fallback tones arrive on the media socket after the 150 ms reply delay.
    let frame = loop {
        match tokio::time::timeout(Duration::from_secs(5), media.next()).await.expect("media timeout").unwrap().unwrap() {
            Message::Binary(bytes) => break bytes,
            _ => continue,
        }
    };
    assert_eq!((frame[0], frame[1]), (1, 1));
    assert!(frame.len() >= 48);

    // Reconnect with a fresh ticket keeps the same world.
    drop(socket);
    let mut again = connect(&addr, ws::MAIN_PATH, &protocols("guest_a")).await.unwrap();
    send(&mut again, json!({"type": "join_world", "worldId": world_id})).await;
    let rejoined = expect(&mut again, "world_joined").await;
    let lines = rejoined["world"]["mountedCartridges"][0]["runtimes"][0]["state"]["lines"].as_array().map(Vec::len).unwrap_or(0);
    assert!(lines >= 1, "chat history survives reconnect: {rejoined}");
}

#[tokio::test]
async fn client_close_gets_a_clean_close_reply() {
    let addr = serve().await;
    let mut socket = connect(&addr, ws::MAIN_PATH, &protocols("guest_close")).await.unwrap();
    socket.close(None).await.unwrap();
    let reply = tokio::time::timeout(Duration::from_secs(5), socket.next()).await.expect("close reply timeout");
    // tungstenite surfaces the peer's Close reply, then the stream ends (no 1006).
    match reply {
        Some(Ok(Message::Close(_))) | None => {}
        other => panic!("expected a close reply, got {other:?}"),
    }
}

#[tokio::test]
async fn media_grants_do_not_cross_users() {
    let addr = serve().await;
    let mut a = connect(&addr, ws::MAIN_PATH, &protocols("guest_a")).await.unwrap();
    send(&mut a, json!({"type": "open_my_web_world"})).await;
    let grant = expect(&mut a, "world_joined").await["session"]["mediaGrant"].as_str().unwrap().to_string();
    let mut media_b = connect(&addr, ws::MEDIA_PATH, &protocols("guest_b")).await.unwrap();
    send(&mut media_b, json!({"type": "open_media", "grant": grant})).await;
    let closed = loop {
        match tokio::time::timeout(Duration::from_secs(5), media_b.next()).await.expect("close timeout") {
            Some(Ok(Message::Close(frame))) => break frame,
            Some(Ok(_)) => continue,
            other => panic!("{other:?}"),
        }
    };
    let frame = closed.expect("close frame");
    assert_eq!((u16::from(frame.code), frame.reason.as_str()), (4005, "media_grant_invalid"));

    let mut bad_json = connect(&addr, ws::MEDIA_PATH, &protocols("guest_b")).await.unwrap();
    bad_json.send(Message::Text("{".into())).await.unwrap();
    let Some(Ok(Message::Close(Some(frame)))) = bad_json.next().await else { panic!("expected close") };
    assert_eq!((u16::from(frame.code), frame.reason.as_str()), (1002, "invalid_media_open"));
}

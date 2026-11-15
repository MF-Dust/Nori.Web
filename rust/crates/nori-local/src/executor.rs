//! Runs core follow-up tasks with real time and real HTTP (local pacing).

use crate::registry::{Outgoing, UserSlot};
use axum::extract::ws::Message;
use futures_util::StreamExt;
use nori_core::config::ServerAi;
use nori_core::provider::{HttpRequest, HttpResult};
use nori_core::tasks::{Step, Task};
use std::sync::Arc;
use std::time::Duration;

// Bound server-funded provider work without queuing requests.
const MAX_PROVIDER_REQUESTS: usize = 4;
static PROVIDER_GATE: tokio::sync::Semaphore =
    tokio::sync::Semaphore::const_new(MAX_PROVIDER_REQUESTS);

#[derive(Clone)]
pub struct Executor {
    http: reqwest::Client,
    server_ai: Arc<ServerAi>,
}

impl Executor {
    pub fn new(server_ai: ServerAi) -> Self {
        let http = reqwest::Client::builder()
            // Python providers use `follow_redirects=False`.
            .redirect(reqwest::redirect::Policy::none())
            .build()
            .expect("HTTP client");
        Self {
            http,
            server_ai: Arc::new(server_ai),
        }
    }

    /// Run a task in the background; `origin` receives `Step::Direct`.
    pub fn spawn(&self, slot: Arc<UserSlot>, task: Task, origin: Option<Outgoing>) {
        let executor = self.clone();
        tokio::spawn(async move { executor.run(slot, task, origin).await });
    }

    pub async fn run(self, slot: Arc<UserSlot>, mut task: Task, origin: Option<Outgoing>) {
        let mut input = None;
        loop {
            let step = {
                let mut world = slot.world();
                task.poll(&mut world, &self.server_ai, input.take())
            };
            match step {
                Step::Sleep(0) => tokio::task::yield_now().await,
                Step::Sleep(ms) => tokio::time::sleep(Duration::from_millis(ms)).await,
                Step::Http(request) => {
                    input = Some(self.perform_for(request, origin.as_ref()).await)
                }
                Step::Broadcast(messages) => slot.broadcast(&messages),
                Step::Media(frame) => slot.broadcast_media(frame),
                Step::Direct(message) => {
                    if let Some(tx) = &origin {
                        let _ =
                            tx.send(Message::Text(nori_core::protocol::ws_text(&message).into()));
                    }
                }
                Step::Spawn(child) => self.spawn(slot.clone(), child, origin.clone()),
                Step::Done => break,
            }
        }
    }

    /// Execute a provider request: no redirects, whole-request timeout,
    /// transparent gzip/deflate, body capped at `max_response_bytes`.
    pub async fn perform(&self, request: HttpRequest) -> HttpResult {
        self.perform_for(request, None).await
    }

    async fn perform_for(&self, request: HttpRequest, origin: Option<&Outgoing>) -> HttpResult {
        let _socket_permit = match origin.map(|tx| tx.provider_gate.try_acquire()) {
            Some(Ok(permit)) => Some(permit),
            Some(Err(_)) => return HttpResult::Network("provider admission limit".into()),
            None => None,
        };
        let Ok(_permit) = PROVIDER_GATE.try_acquire() else {
            return HttpResult::Network("provider admission limit".into());
        };
        let method =
            reqwest::Method::from_bytes(request.method.as_bytes()).unwrap_or(reqwest::Method::GET);
        let mut builder = self
            .http
            .request(method, &request.url)
            .timeout(Duration::from_millis(request.timeout_ms));
        for (name, value) in &request.headers {
            builder = builder.header(name.as_str(), value.as_str());
        }
        if let Some(body) = request.body {
            builder = builder.body(body);
        }
        let response = match builder.send().await {
            Ok(response) => response,
            Err(error) if error.is_timeout() => return HttpResult::Timeout,
            Err(error) => return HttpResult::Network(error.to_string()),
        };
        let status = response.status().as_u16();
        let headers = response
            .headers()
            .iter()
            .filter(|(name, _)| !matches!(name.as_str(), "content-encoding" | "content-length"))
            .map(|(name, value)| {
                (
                    name.as_str().to_ascii_lowercase(),
                    value.to_str().unwrap_or("").to_string(),
                )
            })
            .collect();
        let cap = nori_core::provider::body_cap(status, request.max_response_bytes);
        let mut body = Vec::new();
        let mut truncated = false;
        let mut stream = response.bytes_stream();
        while let Some(chunk) = stream.next().await {
            match chunk {
                Ok(bytes) => {
                    let room = cap.saturating_sub(body.len());
                    if bytes.len() > room {
                        body.extend_from_slice(&bytes[..room]);
                        truncated = true;
                        break;
                    }
                    body.extend_from_slice(&bytes);
                }
                Err(error) if error.is_timeout() => return HttpResult::Timeout,
                Err(error) => return HttpResult::Network(error.to_string()),
            }
        }
        HttpResult::Response {
            status,
            headers,
            body,
            truncated,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::registry::Registry;
    use nori_core::{live_pack::LivePack, tasks::Pacing};
    use serde_json::json;

    #[tokio::test]
    async fn saturated_executor_rejects_without_queuing_and_uses_probe_error() {
        let _permits = PROVIDER_GATE
            .try_acquire_many(MAX_PROVIDER_REQUESTS as u32)
            .unwrap();
        let registry = Registry::new(Arc::new(LivePack::empty()));
        let (tx, mut rx, _) = Outgoing::channel();
        let slot = registry.add_main("guest", 1, tx.clone());
        let task = Task::ai_test(
            &slot.world(),
            Pacing::Edge,
            json!({"baseUrl":"http://127.0.0.1:1/v1"}),
            json!("chat"),
            json!("request"),
        );
        tokio::time::timeout(
            Duration::from_millis(100),
            Executor::new(ServerAi::default()).run(slot.clone(), task, Some(tx.clone())),
        )
        .await
        .unwrap();
        let Message::Text(text) = rx.try_recv().unwrap() else {
            panic!("expected error event")
        };
        let message: serde_json::Value = serde_json::from_str(&text).unwrap();
        assert_eq!(message["channel"], "nori.ai.test.result");
        assert_eq!(message["requestId"], "request");
        assert_eq!(message["payload"]["ok"], false);
        assert_eq!(message["payload"]["error"], "Network request failed");
        assert!(rx.try_recv().is_err());

        let task = Task::tts_test(
            &slot.world(),
            Pacing::Edge,
            &json!({"config":{"enabled":true,"provider":"openai-compatible","baseUrl":"http://127.0.0.1:1/v1"}}),
            json!("chat"),
            json!("speech"),
        );
        tokio::time::timeout(
            Duration::from_millis(100),
            Executor::new(ServerAi::default()).run(slot, task, Some(tx)),
        )
        .await
        .unwrap();
        let Message::Text(text) = rx.try_recv().unwrap() else {
            panic!("expected TTS error event")
        };
        let message: serde_json::Value = serde_json::from_str(&text).unwrap();
        assert_eq!(message["channel"], "nori.tts.error");
        assert_eq!(message["requestId"], "speech");
        assert!(message.to_string().contains("RequestError"));
        assert!(rx.try_recv().is_err());
    }

    #[tokio::test]
    async fn socket_gate_rejects_without_waiting() {
        let (tx, _, _) = Outgoing::channel();
        let _permit = tx.provider_gate.try_acquire().unwrap();
        let request = HttpRequest::post_json("http://127.0.0.1:1", vec![], &json!({}), 30000, 1024);
        let result = Executor::new(ServerAi::default())
            .perform_for(request, Some(&tx))
            .await;
        assert!(
            matches!(result, HttpResult::Network(error) if error == "provider admission limit")
        );
    }
}

//! Runs core follow-up tasks with real time and real HTTP (local pacing).

use crate::registry::{Outgoing, UserSlot};
use axum::extract::ws::Message;
use futures_util::StreamExt;
use nori_core::config::ServerAi;
use nori_core::provider::{HttpRequest, HttpResult};
use nori_core::tasks::{Step, Task};
use std::sync::Arc;
use std::time::Duration;

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
        Self { http, server_ai: Arc::new(server_ai) }
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
                Step::Http(request) => input = Some(self.perform(request).await),
                Step::Broadcast(messages) => slot.broadcast(&messages),
                Step::Media(frame) => slot.broadcast_media(frame),
                Step::Direct(message) => {
                    if let Some(tx) = &origin {
                        let _ = tx.send(Message::Text(nori_core::protocol::ws_text(&message).into()));
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
        let method = reqwest::Method::from_bytes(request.method.as_bytes()).unwrap_or(reqwest::Method::GET);
        let mut builder = self.http.request(method, &request.url).timeout(Duration::from_millis(request.timeout_ms));
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
            .map(|(name, value)| (name.as_str().to_ascii_lowercase(), value.to_str().unwrap_or("").to_string()))
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
        HttpResult::Response { status, headers, body, truncated }
    }
}

//! Only SDK adaptation: all routing/session/cache decisions live in `edge`.
use crate::edge::{
    attachment, host, provider_io,
    router::{self, Route},
    session_object::{Frame, SessionObject},
    Isolate,
};
use futures_util::future::{select, Either};
use nori_core::{
    http::HttpResponse,
    provider::{HttpRequest, HttpResult},
};
use serde_json::Value;
use std::{rc::Rc, time::Duration};
use worker::{durable_object, event, js_sys, *};

thread_local! {
    static ISOLATE: Rc<Isolate> = Rc::new(Isolate::default());
}
fn isolate() -> Rc<Isolate> {
    ISOLATE.with(Rc::clone)
}
fn err(error: impl ToString) -> Error {
    Error::RustError(error.to_string())
}

struct CfHost {
    env: Env,
    state: Option<State>,
}

impl host::Bindings for CfHost {
    fn value(&self, name: &str) -> Option<String> {
        self.env
            .var(name)
            .map(|v| v.to_string())
            .or_else(|_| self.env.secret(name).map(|v| v.to_string()))
            .ok()
    }
}
impl host::Clock for CfHost {
    fn now_ms(&self) -> i64 {
        js_sys::Date::now() as i64
    }
}
impl host::Log for CfHost {
    fn log(&self, message: &str) {
        console_log!("{}", message);
    }
}
impl host::Storage for CfHost {
    async fn get(&self, key: &str) -> host::Result<Option<String>> {
        let state = self.state.as_ref().ok_or("DO state missing")?;
        // Old/corrupt non-string values restore as absent, like Python.
        state
            .storage()
            .get::<Value>(key)
            .await
            .map(|v| v.and_then(|v| v.as_str().map(str::to_owned)))
            .map_err(|e| e.to_string())
    }
    async fn put(&self, key: &str, value: &str) -> host::Result<()> {
        self.state
            .as_ref()
            .ok_or("DO state missing")?
            .storage()
            .put(key, value)
            .await
            .map_err(|e| e.to_string())
    }
    async fn set_alarm(&self, at_ms: i64) -> host::Result<()> {
        self.state
            .as_ref()
            .ok_or("DO state missing")?
            .storage()
            .set_alarm(at_ms)
            .await
            .map_err(|e| e.to_string())
    }
}
impl host::Sockets for CfHost {
    type Socket = WebSocket;
    fn list(&self) -> Vec<WebSocket> {
        self.state
            .as_ref()
            .map(State::get_websockets)
            .unwrap_or_default()
    }
    fn attachment(&self, ws: &WebSocket) -> Option<Value> {
        ws.deserialize_attachment::<Value>().ok().flatten()
    }
    fn set_attachment(&self, ws: &WebSocket, json: &str) -> host::Result<()> {
        ws.serialize_attachment(json).map_err(|e| e.to_string())
    }
    fn send_text(&self, ws: &WebSocket, text: &str) -> host::Result<()> {
        ws.send_with_str(text).map_err(|e| e.to_string())
    }
    fn send_binary(&self, ws: &WebSocket, bytes: &[u8]) -> host::Result<()> {
        ws.send_with_bytes(bytes).map_err(|e| e.to_string())
    }
    fn close(&self, ws: &WebSocket, code: u16, reason: &str) -> host::Result<()> {
        ws.close(Some(code), Some(reason))
            .map_err(|e| e.to_string())
    }
}
impl host::ObjectStore for CfHost {
    async fn get_bytes(&self, key: &str) -> host::Result<Option<Vec<u8>>> {
        let bucket = self
            .env
            .bucket("NORI_ASSETS_R2")
            .map_err(|e| e.to_string())?;
        let object = bucket.get(key).execute().await.map_err(|e| e.to_string())?;
        match object {
            Some(object) => match object.body() {
                Some(body) => body.bytes().await.map(Some).map_err(|e| e.to_string()),
                None => Ok(None),
            },
            None => Ok(None),
        }
    }
}
impl host::ModelStore for CfHost {
    type Body = ResponseBody;
    async fn model(
        &self,
        key: &str,
        head: bool,
    ) -> host::Result<Option<host::AssetObject<ResponseBody>>> {
        let bucket = self
            .env
            .bucket("NORI_ASSETS_R2")
            .map_err(|e| e.to_string())?;
        let object = if head {
            bucket.head(key).await
        } else {
            bucket.get(key).execute().await
        }
        .map_err(|e| e.to_string())?;
        object
            .map(|object| {
                Ok(host::AssetObject {
                    size: object.size(),
                    http_etag: Some(object.http_etag()),
                    body: if head {
                        None
                    } else {
                        object
                            .body()
                            .map(|b| b.response_body())
                            .transpose()
                            .map_err(|e| e.to_string())?
                    },
                })
            })
            .transpose()
    }
}
impl host::Sleep for CfHost {
    async fn sleep(&self, ms: u64) {
        Delay::from(Duration::from_millis(ms)).await;
    }
}
impl host::Fetch for CfHost {
    async fn fetch(&self, request: HttpRequest) -> HttpResult {
        let timeout = request.timeout_ms;
        let controller = AbortController::default();
        let signal = controller.signal();
        // The timer includes body streaming, not just arrival of headers.
        let operation = Box::pin(provider_fetch(request, signal));
        let timer = Box::pin(Delay::from(Duration::from_millis(timeout)));
        match select(operation, timer).await {
            Either::Left((result, _)) => {
                let result = result.unwrap_or_else(|e| HttpResult::Network(e.to_string()));
                if matches!(
                    result,
                    HttpResult::Response {
                        truncated: true,
                        ..
                    }
                ) {
                    controller.abort();
                }
                result
            }
            Either::Right(((), _)) => {
                controller.abort();
                HttpResult::Timeout
            }
        }
    }
}

async fn provider_fetch(request: HttpRequest, signal: AbortSignal) -> Result<HttpResult> {
    let headers = Headers::new();
    for (name, value) in request.headers {
        headers.set(&name, &value)?;
    }
    let mut init = RequestInit::new();
    init.with_method(Method::from(request.method))
        .with_headers(headers)
        .with_redirect(if request.follow_redirects {
            RequestRedirect::Follow
        } else {
            RequestRedirect::Manual
        });
    if let Some(bytes) = request.body {
        init.with_body(Some(js_sys::Uint8Array::from(bytes.as_slice()).into()));
    }
    let req = Request::new_with_init(&request.url, &init)?;
    let mut response = Fetch::Request(req).send_with_signal(&signal).await?;
    let status = response.status_code();
    let headers = response
        .headers()
        .entries()
        .filter(|(k, _)| !matches!(k.as_str(), "content-length" | "content-encoding"))
        .collect();
    let cap = provider_io::body_cap(status, request.max_response_bytes);
    let (body, truncated) = provider_io::read_limited(response.stream()?, cap).await?;
    // The outer adapter aborts the producer on truncation.
    Ok(HttpResult::Response {
        status,
        headers,
        body,
        truncated,
    })
}

fn request_meta(req: &Request) -> Result<host::Request> {
    let url = req.url()?;
    Ok(host::Request {
        url: url.to_string(),
        http: nori_core::http::HttpRequest {
            method: req.method().to_string(),
            path: url.path().to_string(),
            headers: req.headers().entries().collect(),
            body: Vec::new(),
            scheme: url.scheme().to_string(),
        },
    })
}
fn headers(values: Vec<(String, String)>) -> Result<Headers> {
    let headers = Headers::new();
    for (name, value) in values {
        headers.append(&name, &value)?;
    }
    Ok(headers)
}
fn response(value: HttpResponse) -> Result<Response> {
    Ok(Response::from_body(ResponseBody::Body(value.body))?
        .with_status(value.status)
        .with_headers(headers(value.headers)?))
}

#[event(fetch)]
pub async fn fetch(mut req: Request, env: Env, _ctx: Context) -> Result<Response> {
    let mut meta = request_meta(&req)?;
    // Before any env read, isolate construction or request-body consumption.
    if meta.http.path.starts_with("/api/") {
        if let Some(rejected) = router::forbidden(&meta) {
            return response(rejected);
        }
    }
    let host = CfHost { env, state: None };
    host::RuntimeConfig::read(&host).map_err(err)?;
    if meta.http.path.starts_with("/api/")
        && !meta.http.path.starts_with("/api/arcade/web/v1")
        && !matches!(meta.http.method.as_str(), "GET" | "HEAD")
    {
        meta.http.body = req.bytes().await?;
    }
    match router::route(&host, &isolate(), &meta).await.map_err(err)? {
        Route::Response(value) => response(value),
        Route::Model(object) => {
            let headers = headers(router::model_headers(&object))?;
            Ok(
                Response::from_body(object.body.unwrap_or(ResponseBody::Empty))?
                    .with_headers(headers),
            )
        }
        Route::Durable(name) => {
            host.env
                .durable_object("NORI_ARCADE")?
                .get_by_name(&name)?
                .fetch_with_request(req)
                .await
        }
        Route::Assets => host.env.service("ASSETS")?.fetch_request(req).await,
    }
}

#[durable_object]
pub struct NoriArcadeSession {
    host: CfHost,
    session: SessionObject,
    isolate: Rc<Isolate>,
}

impl DurableObject for NoriArcadeSession {
    fn new(state: State, env: Env) -> Self {
        Self {
            host: CfHost {
                env,
                state: Some(state),
            },
            session: SessionObject::default(),
            isolate: isolate(),
        }
    }
    async fn fetch(&self, req: Request) -> Result<Response> {
        let meta = request_meta(&req)?;
        let user = match SessionObject::upgrade(&self.host, &meta).map_err(err)? {
            Ok(user) => user,
            Err(rejected) => return response(rejected),
        };
        let pair = WebSocketPair::new()?;
        let json = attachment::new(
            &user,
            &nori_core::jsonutil::token_urlsafe(12),
            &meta.http.path,
            meta.header("cookie").unwrap_or(""),
        );
        pair.server.serialize_attachment(json)?; // String, deliberately NOT Value.
        self.host
            .state
            .as_ref()
            .expect("DO state")
            .accept_web_socket(&pair.server);
        let response = Response::from_websocket(pair.client)?;
        response
            .headers()
            .set("Sec-WebSocket-Protocol", "arcade.v1")?;
        Ok(response)
    }
    async fn alarm(&self) -> Result<Response> {
        self.session.on_alarm(&self.host).await;
        Response::empty()
    }
    async fn websocket_message(
        &self,
        ws: WebSocket,
        message: WebSocketIncomingMessage,
    ) -> Result<()> {
        let frame = match message {
            WebSocketIncomingMessage::String(raw) => Frame::Text(raw),
            WebSocketIncomingMessage::Binary(bytes) => Frame::Binary(bytes),
        };
        self.session
            .on_message(&self.host, &self.isolate, &ws, frame)
            .await;
        Ok(())
    }
    async fn websocket_close(
        &self,
        ws: WebSocket,
        code: usize,
        reason: String,
        clean: bool,
    ) -> Result<()> {
        self.session
            .on_close(&self.host, &ws, code as u16, &reason, clean)
            .await;
        Ok(())
    }
    async fn websocket_error(&self, _ws: WebSocket, error: Error) -> Result<()> {
        self.session.on_error(&self.host, &error.to_string());
        Ok(())
    }
}

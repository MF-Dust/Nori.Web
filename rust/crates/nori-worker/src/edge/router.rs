use super::{host::*, Isolate};
use nori_core::{
    auth,
    http::{self, HttpResponse},
};
use serde_json::json;
use sha2::{Digest, Sha256};

pub const MODEL_PATH: &str = "/datasea/cosmicweb.min.glb";
pub const MODEL_KEY: &str = "datasea/cosmicweb.min.glb";

pub enum Route<B> {
    Response(HttpResponse),
    Model(AssetObject<B>),
    Durable(String),
    Assets,
}

pub fn plain(status: u16, body: &str) -> HttpResponse {
    HttpResponse {
        status,
        headers: vec![("Content-Type".into(), "text/plain;charset=UTF-8".into())],
        body: body.as_bytes().to_vec(),
    }
}

pub fn durable_name(user_id: &str) -> String {
    nori_core::jsonutil::hex_encode(&Sha256::digest(if user_id.is_empty() {
        b"missing-user"
    } else {
        user_id.as_bytes()
    }))
}

pub fn forbidden(req: &Request) -> Option<HttpResponse> {
    if auth::is_same_origin(req.header("origin"), &req.url) {
        return None;
    }
    // Edge HTTP, like WebSocket handshakes, uses the plain response, not ASGI's JSON rejection.
    let mut response = http::reject_origin(true);
    response
        .headers
        .push(("Content-Type".into(), "text/plain;charset=UTF-8".into()));
    Some(response)
}

pub fn validate_upgrade(
    req: &Request,
    secret: &str,
    now: i64,
) -> std::result::Result<String, HttpResponse> {
    if !req
        .header("upgrade")
        .unwrap_or("")
        .eq_ignore_ascii_case("websocket")
    {
        return Err(plain(426, "WebSocket upgrade required"));
    }
    let protocols: Vec<_> = req
        .header("sec-websocket-protocol")
        .unwrap_or("")
        .split(',')
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .collect();
    if !protocols.contains(&"arcade.v1") {
        return Err(plain(400, "arcade.v1 subprotocol required"));
    }
    let ticket = protocols
        .iter()
        .find_map(|p| p.strip_prefix("ticket."))
        .unwrap_or("");
    auth::resolve_ticket(secret, ticket, now).ok_or_else(|| plain(401, "session_invalid"))
}

fn asgi_allow(path: &str) -> &'static str {
    // Starlette uses the first partial route match before its GET catch-all.
    match path {
        "/api/auth/get-session" => "GET, POST",
        "/api/auth/convex/token"
        | "/api/arcade/ws-ticket"
        | "/api/auth/email-otp/send-verification-otp"
        | "/api/auth/send-email-otp"
        | "/api/auth/sign-in/email-otp"
        | "/api/auth/email-otp/verify-email"
        | "/api/auth/sign-out"
        | "/api/query"
        | "/api/mutation"
        | "/api/action"
        | "/api/function"
        | "/api/query_at_ts"
        | "/api/query_ts" => "POST",
        _ => "GET",
    }
}

fn unique_headers(values: Vec<(String, String)>) -> Vec<(String, String)> {
    let mut headers: Vec<(String, String)> = Vec::new();
    for (name, value) in values {
        if !name.eq_ignore_ascii_case("set-cookie") {
            if let Some((_, prior)) = headers
                .iter_mut()
                .find(|(key, _)| key.eq_ignore_ascii_case(&name))
            {
                *prior = value;
                continue;
            }
        }
        headers.push((name, value));
    }
    headers
}

pub fn model_headers<B>(object: &AssetObject<B>) -> Vec<(String, String)> {
    let mut headers = vec![
        ("Content-Type".into(), "model/gltf-binary".into()),
        (
            "Cache-Control".into(),
            "public, max-age=604800, immutable".into(),
        ),
        ("Content-Length".into(), object.size.to_string()),
    ];
    if let Some(etag) = object.http_etag.as_ref().filter(|s| !s.is_empty()) {
        headers.push(("ETag".into(), etag.clone()));
    }
    headers
}

pub async fn route<H: Bindings + Clock + ModelStore>(
    host: &H,
    isolate: &Isolate,
    req: &Request,
) -> Result<Route<H::Body>> {
    let path = &req.http.path;
    if path.starts_with("/api/") {
        if let Some(response) = forbidden(req) {
            return Ok(Route::Response(response));
        }
    }
    let config = RuntimeConfig::read(host)?;
    if config.disable_live_pack {
        isolate.pack.clear();
    }
    if path == MODEL_PATH {
        if !matches!(req.http.method.as_str(), "GET" | "HEAD") {
            let mut response = plain(405, "Method Not Allowed");
            response.headers.push(("Allow".into(), "GET, HEAD".into()));
            return Ok(Route::Response(response));
        }
        return Ok(
            match host.model(MODEL_KEY, req.http.method == "HEAD").await? {
                Some(object) => Route::Model(object),
                None => Route::Response(plain(404, "Object Not Found")),
            },
        );
    }
    if path.starts_with("/api/arcade/web/v1") {
        return Ok(
            match validate_upgrade(req, &config.secret, host.now_ms() / 1000) {
                Ok(user_id) => Route::Durable(durable_name(&user_id)),
                Err(response) => Route::Response(response),
            },
        );
    }
    if path.starts_with("/api/") {
        let mut http_host = isolate.http.borrow_mut();
        http_host.secret = config.secret;
        http_host.machine_id = "nori-local".into();
        http_host.auto_guest = config.auto_guest;
        http_host.dev_otp = config.dev_otp;
        if let Some(mut response) =
            http::handle_http(&mut http_host, &req.http, host.now_ms() / 1000)
        {
            // Python's bootstrap/guest Convex fast paths add charset; ASGI JSON does not.
            let guest_fast = http_host.auto_guest
                && auth::cookie_token(
                    req.header("cookie").unwrap_or(""),
                    req.header("better-auth-cookie").unwrap_or(""),
                )
                .is_none_or(|token| {
                    token.starts_with(auth::GUEST_PREFIX) || token == "local-guest-token"
                });
            let bootstrap = matches!(
                path.as_str(),
                "/api/entry-status" | "/api/version" | "/api/query_ts"
            ) || guest_fast
                && matches!(
                    path.as_str(),
                    "/api/auth/get-session"
                        | "/api/auth/convex/token"
                        | "/api/arcade/ws-ticket"
                        | "/api/query"
                        | "/api/mutation"
                        | "/api/action"
                        | "/api/function"
                        | "/api/query_at_ts"
                );
            if bootstrap {
                for (name, value) in &mut response.headers {
                    if name.eq_ignore_ascii_case("content-type") {
                        *value = "application/json; charset=utf-8".into();
                    }
                }
            }
            // Python updates a header mapping; the core may return duplicate
            // Cache-Control entries while creating a guest cookie.
            response.headers = unique_headers(response.headers);
            return Ok(Route::Response(response));
        }
        // server.create_app() includes the GET static catch-all, whose first branch
        // rejects api/ rather than serving the SPA (including known paths with wrong methods).
        return Ok(Route::Response(
            if req.http.method.eq_ignore_ascii_case("GET") {
                HttpResponse::json(404, &json!({"detail": "API endpoint not found"}), vec![])
            } else {
                HttpResponse::json(
                    405,
                    &json!({"detail": "Method Not Allowed"}),
                    vec![("Allow".into(), asgi_allow(path).into())],
                )
            },
        ));
    }
    Ok(Route::Assets)
}

use crate::auth::{self, MemoryAuth};
use crate::jsonutil::{now_ms, now_secs, Json};
use serde_json::{json, Value};
use std::collections::HashMap;

#[derive(Clone, Debug)]
pub struct HttpRequest {
    pub method: String,
    pub path: String,
    pub headers: Vec<(String, String)>,
    pub body: Vec<u8>,
    pub scheme: String,
}

#[derive(Clone, Debug)]
pub struct HttpResponse {
    pub status: u16,
    pub headers: Vec<(String, String)>,
    pub body: Vec<u8>,
}

impl HttpResponse {
    pub fn json(status: u16, value: &Json, extra: Vec<(String, String)>) -> Self {
        let mut headers = vec![("content-type".into(), "application/json".into())];
        headers.extend(extra);
        Self {
            status,
            headers,
            body: serde_json::to_vec(value).unwrap_or_else(|_| b"{}".to_vec()),
        }
    }
}

#[derive(Default)]
pub struct HttpHost {
    pub secret: String,
    pub machine_id: String,
    pub auto_guest: bool,
    pub dev_otp: String,
    pub auth: MemoryAuth,
}

fn header<'a>(headers: &'a [(String, String)], name: &str) -> Option<&'a str> {
    headers
        .iter()
        .find(|(k, _)| k.eq_ignore_ascii_case(name))
        .map(|(_, v)| v.as_str())
}

fn json_body(body: &[u8]) -> Json {
    serde_json::from_slice(body).unwrap_or(Value::Null)
}

pub fn handle_http(host: &mut HttpHost, req: &HttpRequest, now: i64) -> Option<HttpResponse> {
    let origin = header(&req.headers, "origin");
    let url = format!("{}://local{}", req.scheme, req.path);
    if req.path.starts_with("/api/") && !auth::is_same_origin(origin, &url) && origin.is_some() {
        // Local callers pass the real URL from the host. If origin is present and the host
        // did not supply a comparable URL, the host should call `reject_origin` first.
    }
    let method = req.method.to_uppercase();
    let path = req.path.as_str();
    if path == "/api/query_ts" && method == "POST" {
        return Some(HttpResponse::json(200, &json!({"ts": "0"}), vec![]));
    }
    if path == "/api/entry-status" && method == "GET" {
        return Some(HttpResponse::json(
            200,
            &json!({"status": "ok", "machineId": host.machine_id}),
            vec![],
        ));
    }
    if path == "/api/version" && method == "GET" {
        return Some(HttpResponse::json(
            200,
            &json!({"version": "2.0.0", "service": "NoriOS local compatibility server"}),
            vec![],
        ));
    }
    if path == "/api/auth/get-session" && (method == "GET" || method == "POST") {
        return Some(session_response(host, req, now));
    }
    if (path == "/api/auth/email-otp/send-verification-otp" || path == "/api/auth/send-email-otp")
        && method == "POST"
    {
        if host.dev_otp.is_empty() {
            return Some(HttpResponse::json(
                200,
                &json!({"status": false, "code": "OTP_DISABLED", "message": "Development email OTP is disabled"}),
                vec![],
            ));
        }
        let body = json_body(&req.body);
        let email = body.get("email").and_then(Value::as_str).unwrap_or("");
        if !email.contains('@') {
            return Some(HttpResponse::json(
                200,
                &json!({"status": false, "code": "INVALID_EMAIL", "message": "A valid email is required"}),
                vec![],
            ));
        }
        host.auth.otps.insert(
            email.trim().to_lowercase(),
            (host.dev_otp.clone(), now + 600),
        );
        return Some(HttpResponse::json(200, &json!({"status": true}), vec![]));
    }
    if (path == "/api/auth/sign-in/email-otp" || path == "/api/auth/email-otp/verify-email")
        && method == "POST"
    {
        return Some(sign_in_otp(host, req, now));
    }
    if path == "/api/auth/sign-out" && method == "POST" {
        let token = cookie_of(req);
        if let Some(token) = token {
            host.auth.sessions.remove(&token);
        }
        return Some(HttpResponse::json(
            200,
            &json!({"success": true}),
            vec![
                ("Cache-Control".into(), "private, no-store".into()),
                (
                    "set-better-auth-cookie".into(),
                    format!("{}=; Path=/; Max-Age=0; SameSite=Lax", auth::SESSION_COOKIE),
                ),
                // Starlette `Response.delete_cookie(SESSION_COOKIE)`.
                (
                    "Set-Cookie".into(),
                    format!(
                        "{}=\"\"; expires={}; Max-Age=0; Path=/; SameSite=lax",
                        auth::SESSION_COOKIE,
                        http_date(now)
                    ),
                ),
            ],
        ));
    }
    if path == "/api/auth/convex/token" && (method == "GET" || method == "POST") {
        let (session, headers) = current_session(host, req, now);
        let token = session
            .as_ref()
            .and_then(|s| s.pointer("/user/id"))
            .and_then(Value::as_str)
            .map(|id| format!("local-convex.{id}"));
        return Some(HttpResponse::json(200, &json!({"token": token}), headers));
    }
    if path == "/api/arcade/ws-ticket" && method == "POST" {
        let (session, headers) = current_session(host, req, now);
        let Some(user_id) = session
            .as_ref()
            .and_then(|s| s.pointer("/user/id"))
            .and_then(Value::as_str)
        else {
            return Some(HttpResponse::json(
                401,
                &json!({"error": "Unauthorized"}),
                vec![("Cache-Control".into(), "private, no-store".into())],
            ));
        };
        let ticket = auth::issue_ticket(&host.secret, user_id, now);
        return Some(HttpResponse::json(200, &json!({"ticket": ticket}), headers));
    }
    if matches!(
        path,
        "/api/mutation" | "/api/query" | "/api/action" | "/api/function" | "/api/query_at_ts"
    ) && method == "POST"
    {
        return Some(convex(host, req, now));
    }
    None
}

pub fn reject_origin(is_ws: bool) -> HttpResponse {
    if is_ws {
        HttpResponse {
            status: 403,
            headers: vec![],
            body: b"origin_forbidden".to_vec(),
        }
    } else {
        HttpResponse::json(403, &json!({"error": "origin_forbidden"}), vec![])
    }
}

fn cookie_of(req: &HttpRequest) -> Option<String> {
    auth::cookie_token(
        header(&req.headers, "cookie").unwrap_or(""),
        header(&req.headers, "better-auth-cookie").unwrap_or(""),
    )
}

fn current_session(
    host: &mut HttpHost,
    req: &HttpRequest,
    now: i64,
) -> (Option<Json>, Vec<(String, String)>) {
    let mut headers = vec![("Cache-Control".into(), "private, no-store".into())];
    if let Some(token) = cookie_of(req) {
        if let Some(session) = host.auth.sessions.get(&token).cloned() {
            if session
                .pointer("/session/expiresAt")
                .and_then(|v| v.as_i64())
                .unwrap_or(0)
                > now * 1000
            {
                return (Some(session), headers);
            }
        }
    }
    if host.auto_guest {
        let (session, created) = auth::guest_session(&host.secret, cookie_of(req).as_deref(), now);
        if created {
            if let Some(token) = session.pointer("/session/token").and_then(Value::as_str) {
                headers.extend(auth::auth_cookie_headers(token, req.scheme == "https"));
            }
        }
        return (Some(session), headers);
    }
    (None, headers)
}

fn session_response(host: &mut HttpHost, req: &HttpRequest, now: i64) -> HttpResponse {
    let (session, headers) = current_session(host, req, now);
    HttpResponse::json(200, &session.unwrap_or(Value::Null), headers)
}

fn sign_in_otp(host: &mut HttpHost, req: &HttpRequest, now: i64) -> HttpResponse {
    let body = json_body(&req.body);
    let email = body
        .get("email")
        .and_then(Value::as_str)
        .filter(|e| e.contains('@'));
    // Python only requires `otp` to be a string; an empty one fails below.
    let (Some(email), Some(otp)) = (email, body.get("otp").and_then(Value::as_str)) else {
        return HttpResponse::json(
            200,
            &json!({"code": "INVALID_OTP", "message": "Invalid email or OTP"}),
            vec![],
        );
    };
    let key = email.trim().to_lowercase();
    let valid = !host.dev_otp.is_empty()
        && host
            .auth
            .otps
            .get(&key)
            .is_some_and(|(stored, exp)| stored == otp && *exp > now);
    if !valid {
        return HttpResponse::json(
            200,
            &json!({"code": "INVALID_OTP", "message": "Invalid OTP"}),
            vec![],
        );
    }
    // Python keeps one user per normalized email across logins.
    let existing = host
        .auth
        .users
        .values()
        .find(|u| u.get("email").and_then(Value::as_str) == Some(key.as_str()))
        .cloned();
    let user = existing.unwrap_or_else(|| {
        let name = key
            .split('@')
            .next()
            .filter(|n| !n.is_empty())
            .unwrap_or("Operator");
        let user = json!({
            "id": format!("user_{}", crate::jsonutil::uuid4().replace('-', "")),
            "name": name,
            "email": key,
            "image": "/icon.png",
            "createdAt": now_ms(),
        });
        if let Some(id) = user.get("id").and_then(Value::as_str) {
            host.auth.users.insert(id.to_string(), user.clone());
        }
        user
    });
    let token = crate::jsonutil::token_urlsafe(32);
    let session = json!({"session": {"id": format!("session_{}", crate::jsonutil::uuid4().replace('-', "")), "userId": user["id"], "token": token, "expiresAt": now_ms() + auth::SESSION_TTL * 1000}, "user": user});
    host.auth.sessions.insert(token.clone(), session.clone());
    host.auth.otps.remove(&key);
    HttpResponse::json(
        200,
        &session,
        auth::auth_cookie_headers(&token, req.scheme == "https"),
    )
}

/// RFC 7231 IMF-fixdate, e.g. `Sun, 04 Oct 2026 10:27:27 GMT`.
pub fn http_date(unix_secs: i64) -> String {
    const DAYS: [&str; 7] = ["Thu", "Fri", "Sat", "Sun", "Mon", "Tue", "Wed"];
    const MONTHS: [&str; 12] = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    let days = unix_secs.div_euclid(86_400);
    let secs = unix_secs.rem_euclid(86_400);
    // Howard Hinnant's civil-from-days.
    let z = days + 719_468;
    let era = z.div_euclid(146_097);
    let doe = z - era * 146_097;
    let yoe = (doe - doe / 1460 + doe / 36_524 - doe / 146_096) / 365;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let day = doy - (153 * mp + 2) / 5 + 1;
    let month = if mp < 10 { mp + 3 } else { mp - 9 };
    let year = yoe + era * 400 + i64::from(month <= 2);
    format!(
        "{}, {:02} {} {} {:02}:{:02}:{:02} GMT",
        DAYS[days.rem_euclid(7) as usize],
        day,
        MONTHS[(month - 1) as usize],
        year,
        secs / 3600,
        secs % 3600 / 60,
        secs % 60
    )
}

fn convex(host: &mut HttpHost, req: &HttpRequest, now: i64) -> HttpResponse {
    let body = json_body(&req.body);
    let path = body.get("path").and_then(Value::as_str).unwrap_or("");
    if path == "auth/wsTickets:issueWebUserWsTicket" {
        let (session, headers) = current_session(host, req, now);
        let Some(user_id) = session
            .as_ref()
            .and_then(|s| s.pointer("/user/id"))
            .and_then(Value::as_str)
        else {
            return HttpResponse::json(
                200,
                &json!({"status": "error", "errorMessage": "Unauthorized", "logLines": []}),
                headers,
            );
        };
        let ticket = auth::issue_ticket(&host.secret, user_id, now);
        return HttpResponse::json(
            200,
            &json!({"status": "success", "value": {"ticket": ticket}, "logLines": []}),
            headers,
        );
    }
    if path == "auth/otpEmail:preflightOtpSend" {
        return HttpResponse::json(
            200,
            &json!({"status": "success", "value": Value::Null, "logLines": []}),
            vec![],
        );
    }
    HttpResponse::json(
        200,
        &json!({"status": "error", "errorMessage": format!("Unsupported local Convex function: {}", if path.is_empty() { "<missing>" } else { path }), "logLines": []}),
        vec![],
    )
}

/// Archive sections a message needs before it is handled (edge R2 prefetch).
///
/// The first three channels are exactly `cloudflare/entry.py`'s
/// `_prefetch_parsed_arcade_message`. The rest load sections that their
/// handlers read (story recovery rules, Signal recovery, mail/signal read):
/// the Python edge only had them if an earlier request happened to load
/// them in the same isolate. Browser pages are fetched by URL separately.
pub fn required_sections(message: &Json) -> Vec<&'static str> {
    const ARTIFACTS: [&str; 4] = [
        "mail_artifacts",
        "file_artifacts",
        "signal_thread_artifacts",
        "signal_message_artifacts",
    ];
    if message.get("type").and_then(Value::as_str) != Some("event") {
        return Vec::new();
    }
    let empty = json!({});
    let payload = message
        .get("payload")
        .filter(|p| p.is_object())
        .unwrap_or(&empty);
    match message.get("channel").and_then(Value::as_str).unwrap_or("") {
        "manifold.artifacts.request" => match payload.get("artifactType") {
            None | Some(Value::Null) => ARTIFACTS.to_vec(),
            Some(Value::String(kind)) => match kind.as_str() {
                "mail" => vec!["mail_artifacts"],
                "file" => vec!["file_artifacts"],
                "signal_thread" => vec!["signal_thread_artifacts"],
                "signal_message" => vec!["signal_message_artifacts"],
                _ => Vec::new(),
            },
            Some(_) => Vec::new(),
        },
        "manifold.bounty.submit" if payload.get("fileId").is_some_and(python_truthy) => {
            vec!["file_artifacts"]
        }
        "idle.sync" => vec!["file_artifacts"],
        "manifold.command.request" => match payload
            .get("command")
            .and_then(Value::as_str)
            .map(str::trim)
            .unwrap_or("")
        {
            "idle.sync" | "idle.complete" | "signal.login" | "signal.recover" => {
                vec!["file_artifacts"]
            }
            "mail.read" => vec!["mail_artifacts"],
            "signal.read" => vec!["signal_thread_artifacts", "signal_message_artifacts"],
            _ => Vec::new(),
        },
        _ => Vec::new(),
    }
}

/// Python truthiness of a JSON value.
pub fn python_truthy(value: &Json) -> bool {
    match value {
        Value::Null => false,
        Value::Bool(b) => *b,
        Value::Number(n) => n.as_f64().is_some_and(|f| f != 0.0),
        Value::String(s) => !s.is_empty(),
        Value::Array(items) => !items.is_empty(),
        Value::Object(map) => !map.is_empty(),
    }
}

#[allow(dead_code)]
pub fn empty_map() -> HashMap<String, Json> {
    HashMap::new()
}

pub fn now_for_http() -> i64 {
    now_secs()
}

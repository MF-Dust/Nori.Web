use crate::{static_files, AppState};
use axum::body::{to_bytes, Body};
use axum::extract::State;
use axum::http::{header, HeaderName, HeaderValue, Request, StatusCode};
use axum::response::Response;
use nori_core::http::{handle_http, HttpRequest, HttpResponse};
use serde_json::Value;
use std::time::{SystemTime, UNIX_EPOCH};

pub(crate) async fn handle(State(state): State<AppState>, request: Request<Body>) -> Response {
    let (parts, body) = request.into_parts();
    let body = to_bytes(body, usize::MAX)
        .await
        .unwrap_or_default()
        .to_vec();
    let path = parts.uri.path().to_string();
    let method = parts.method.as_str().to_string();
    let scheme = parts.uri.scheme_str().unwrap_or("http").to_string();
    let headers: Vec<(String, String)> = parts
        .headers
        .iter()
        .filter_map(|(name, value)| Some((name.to_string(), value.to_str().ok()?.to_string())))
        .collect();
    let http_request = HttpRequest {
        method: method.clone(),
        path: path.clone(),
        headers,
        body,
        scheme,
    };
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_secs() as i64)
        .unwrap_or(0);
    let mut host = state
        .http_host
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner());
    let Some(mut response) = handle_http(&mut host, &http_request, now) else {
        return route_fallback(&path, &method);
    };

    if method == "POST"
        && matches!(
            path.as_str(),
            "/api/auth/sign-in/email-otp" | "/api/auth/email-otp/verify-email"
        )
    {
        retain_otp_user(&mut host, &http_request.body, &mut response);
    }
    if method == "POST" && path == "/api/auth/sign-out" {
        response.headers.push((
            "Set-Cookie".into(),
            format!(
                "{}=\"\"; expires={}; Max-Age=0; Path=/; SameSite=lax",
                nori_core::auth::SESSION_COOKIE,
                static_files::http_date(SystemTime::now()),
            ),
        ));
    }
    to_axum_response(response)
}

fn route_fallback(path: &str, method: &str) -> Response {
    if method == "GET" && path.starts_with("/api/") {
        return json_response(404, r#"{"detail":"API endpoint not found"}"#, None);
    }
    if let Some(allow) = allowed_methods(path) {
        if method == "GET" && !allow.split(", ").any(|allowed| allowed == "GET") {
            return json_response(404, r#"{"detail":"API endpoint not found"}"#, None);
        }
        return method_not_allowed(allow);
    }
    // The FastAPI static catch-all is GET-only: an unknown POST/PUT hits its
    // partial match and returns 405 with Allow: GET.
    method_not_allowed("GET")
}

fn allowed_methods(path: &str) -> Option<&'static str> {
    Some(match path {
        "/api/entry-status" | "/api/version" => "GET",
        "/api/auth/get-session" | "/api/auth/convex/token" => "GET, POST",
        "/api/auth/send-email-otp"
        | "/api/auth/email-otp/send-verification-otp"
        | "/api/auth/sign-in/email-otp"
        | "/api/auth/email-otp/verify-email"
        | "/api/auth/sign-out"
        | "/api/arcade/ws-ticket"
        | "/api/query_ts"
        | "/api/query"
        | "/api/mutation"
        | "/api/action"
        | "/api/function"
        | "/api/query_at_ts" => "POST",
        _ => return None,
    })
}

fn method_not_allowed(allow: &str) -> Response {
    json_response(
        405,
        r#"{"detail":"Method Not Allowed"}"#,
        Some((header::ALLOW, allow)),
    )
}

fn json_response(status: u16, body: &str, extra: Option<(header::HeaderName, &str)>) -> Response {
    let mut response = Response::new(Body::from(body.to_string()));
    *response.status_mut() =
        StatusCode::from_u16(status).unwrap_or(StatusCode::INTERNAL_SERVER_ERROR);
    response.headers_mut().insert(
        header::CONTENT_TYPE,
        HeaderValue::from_static("application/json"),
    );
    response.headers_mut().insert(
        header::CONTENT_LENGTH,
        HeaderValue::from_str(&body.len().to_string()).unwrap(),
    );
    if let Some((name, value)) = extra {
        response
            .headers_mut()
            .insert(name, HeaderValue::from_str(value).unwrap());
    }
    response
}

fn to_axum_response(response: HttpResponse) -> Response {
    let content_length = response.body.len().to_string();
    let mut out = Response::new(Body::from(response.body));
    *out.status_mut() =
        StatusCode::from_u16(response.status).unwrap_or(StatusCode::INTERNAL_SERVER_ERROR);
    for (name, value) in response.headers {
        let (Ok(name), Ok(value)) = (
            HeaderName::from_bytes(name.as_bytes()),
            HeaderValue::from_str(&value),
        ) else {
            continue;
        };
        if name == header::SET_COOKIE {
            out.headers_mut().append(name, value);
        } else {
            out.headers_mut().insert(name, value);
        }
    }
    if !out.headers().contains_key(header::CONTENT_LENGTH) {
        out.headers_mut().insert(
            header::CONTENT_LENGTH,
            HeaderValue::from_str(&content_length).unwrap(),
        );
    }
    out
}

fn retain_otp_user(
    host: &mut nori_core::http::HttpHost,
    request_body: &[u8],
    response: &mut HttpResponse,
) {
    let Ok(mut value) = serde_json::from_slice::<Value>(&response.body) else {
        return;
    };
    let Some(new_user) = value.get("user").filter(|user| user.is_object()).cloned() else {
        return;
    };
    let email = serde_json::from_slice::<Value>(request_body)
        .ok()
        .and_then(|body| {
            body.get("email")
                .and_then(Value::as_str)
                .map(|email| email.trim().to_lowercase())
        });
    let existing = email.as_deref().and_then(|email| {
        host.auth
            .users
            .values()
            .find(|user| user.get("email").and_then(Value::as_str) == Some(email))
            .cloned()
    });
    let user = existing.unwrap_or(new_user);
    let Some(user_id) = user.get("id").and_then(Value::as_str).map(str::to_string) else {
        return;
    };
    value["user"] = user.clone();
    if let Some(session) = value.get_mut("session") {
        session["userId"] = Value::String(user_id.clone());
    }
    if let Some(token) = value
        .pointer("/session/token")
        .and_then(Value::as_str)
        .map(str::to_string)
    {
        host.auth.sessions.insert(token, value.clone());
    }
    host.auth.users.insert(user_id, user);
    if let Ok(body) = serde_json::to_vec(&value) {
        response.body = body;
    }
}

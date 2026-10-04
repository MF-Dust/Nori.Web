use crate::AppState;
use axum::body::Body;
use axum::extract::State;
use axum::http::{header, HeaderValue, Request, StatusCode};
use axum::middleware::Next;
use axum::response::Response;
use nori_core::auth::is_same_origin;

pub(crate) async fn same_origin_guard(
    State(state): State<AppState>,
    request: Request<Body>,
    next: Next,
) -> Response {
    let path = request.uri().path();
    if path.starts_with("/api/") {
        let origin = request.headers().get(header::ORIGIN);
        let scheme = request.uri().scheme_str().unwrap_or("http");
        let host = match request.headers().get(header::HOST) {
            Some(value) => value.to_str().unwrap_or("").to_string(),
            None => host_with_port(&state.config.host, state.config.port),
        };
        let target = format!(
            "{scheme}://{host}{}",
            request.uri().path_and_query().map_or("/", |v| v.as_str())
        );
        let forbidden = origin.is_some_and(|value| {
            value
                .to_str()
                .map_or(true, |origin| !is_same_origin(Some(origin), &target))
        });
        if forbidden {
            let body = r#"{"error":"origin_forbidden"}"#;
            let mut response = Response::new(Body::from(body));
            *response.status_mut() = StatusCode::FORBIDDEN;
            response.headers_mut().insert(
                header::CONTENT_TYPE,
                HeaderValue::from_static("application/json"),
            );
            response
                .headers_mut()
                .insert(header::CONTENT_LENGTH, HeaderValue::from_static("28"));
            return response;
        }
    }
    next.run(request).await
}

fn host_with_port(host: &str, port: u16) -> String {
    if host.contains(':') && !host.starts_with('[') {
        format!("[{host}]:{port}")
    } else {
        format!("{host}:{port}")
    }
}

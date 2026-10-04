use crate::static_files::{RangeResponse, StaticFileResponse};
use axum::body::{to_bytes, Body};
use axum::http::{header, Extensions, HeaderMap, Request, StatusCode, Version};
use axum::middleware::Next;
use axum::response::Response;
use tower_http::compression::{CompressionLayer, CompressionLevel};

type GzipPredicate = fn(StatusCode, Version, &HeaderMap, &Extensions) -> bool;

pub(crate) fn compression_layer() -> CompressionLayer<GzipPredicate> {
    CompressionLayer::new()
        .gzip(true)
        .quality(CompressionLevel::Precise(6))
        .compress_when(should_compress as GzipPredicate)
}

fn should_compress(
    status: StatusCode,
    _version: Version,
    headers: &HeaderMap,
    extensions: &Extensions,
) -> bool {
    if status == StatusCode::NOT_MODIFIED {
        return false;
    }
    if extensions.get::<RangeResponse>().is_some() {
        // Starlette streams Range bodies and gzip-compresses them even when the
        // selected range is shorter than its normal 500-byte threshold.
        return true;
    }
    headers
        .get(header::CONTENT_LENGTH)
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.parse::<u64>().ok())
        .is_some_and(|length| length >= 500)
}

pub(crate) async fn restore_static_headers(mut request: Request<Body>, next: Next) -> Response {
    let accepts_gzip = request
        .headers()
        .get(header::ACCEPT_ENCODING)
        .and_then(|value| value.to_str().ok())
        .is_some_and(|value| value.to_ascii_lowercase().contains("gzip"));
    if accepts_gzip {
        request
            .headers_mut()
            .insert(header::ACCEPT_ENCODING, "gzip".parse().unwrap());
    } else {
        request.headers_mut().remove(header::ACCEPT_ENCODING);
    }
    let mut response = next.run(request).await;
    let range = response.extensions_mut().remove::<RangeResponse>();
    let static_size = response
        .extensions()
        .get::<StaticFileResponse>()
        .map(|response| response.size);
    if let Some(range) = range {
        if let Ok(value) = range.content_range.parse() {
            response.headers_mut().insert(header::CONTENT_RANGE, value);
        }
    }
    if static_size.is_some() && !response.headers().contains_key(header::ACCEPT_RANGES) {
        response
            .headers_mut()
            .insert(header::ACCEPT_RANGES, "bytes".parse().unwrap());
    }
    if !accepts_gzip
        && response
            .headers()
            .get(header::VARY)
            .is_some_and(|value| value.as_bytes().eq_ignore_ascii_case(b"accept-encoding"))
    {
        response.headers_mut().remove(header::VARY);
    }
    if response
        .headers()
        .get(header::CONTENT_ENCODING)
        .is_some_and(|value| value.as_bytes().eq_ignore_ascii_case(b"gzip"))
    {
        response
            .headers_mut()
            .insert(header::VARY, "Accept-Encoding".parse().unwrap());
        let status = response.status();
        let should_buffer = status != StatusCode::PARTIAL_CONTENT
            && static_size.is_none_or(|size| size <= 64 * 1024);
        if should_buffer {
            let body = std::mem::replace(response.body_mut(), Body::empty());
            if let Ok(bytes) = to_bytes(body, usize::MAX).await {
                response.headers_mut().insert(
                    header::CONTENT_LENGTH,
                    bytes.len().to_string().parse().unwrap(),
                );
                *response.body_mut() = Body::from(bytes);
            }
        }
    }
    response
}

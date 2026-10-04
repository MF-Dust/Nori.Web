use crate::AppState;
use axum::body::Body;
use axum::extract::State;
use axum::http::{header, HeaderName, HeaderValue, Request, StatusCode};
use axum::response::Response;
use std::io::SeekFrom;
use std::path::{Component, Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};
use tokio::io::{AsyncReadExt, AsyncSeekExt};

#[derive(Clone, Debug)]
pub(crate) struct StaticFileResponse {
    pub size: u64,
}

#[derive(Clone, Debug)]
pub(crate) struct RangeResponse {
    pub content_range: String,
}

pub(crate) async fn handle(State(state): State<AppState>, request: Request<Body>) -> Response {
    if request.method() != axum::http::Method::GET {
        return json_response(
            405,
            r#"{"detail":"Method Not Allowed"}"#,
            Some((header::ALLOW, "GET")),
        );
    }
    let raw_path = request
        .uri()
        .path()
        .strip_prefix('/')
        .unwrap_or(request.uri().path());
    let Some(path) = percent_decode(raw_path) else {
        return not_found();
    };
    if path.starts_with("api/") {
        return json_response(404, r#"{"detail":"API endpoint not found"}"#, None);
    }

    let Some(file_path) = select_file(&state.public_dir, &path) else {
        return json_response(404, r#"{"detail":"Not found"}"#, None);
    };
    let Ok(metadata) = std::fs::metadata(&file_path) else {
        return json_response(404, r#"{"detail":"Not found"}"#, None);
    };
    if !metadata.is_file() {
        return json_response(404, r#"{"detail":"Not found"}"#, None);
    }
    let size = metadata.len();
    let modified = metadata.modified().unwrap_or(UNIX_EPOCH);
    let modified_ns = modified
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos();
    let etag = format!("\"{modified_ns:x}-{size:x}\"");
    let cache_control = cache_control(&state.public_dir, &file_path);

    if let Some(value) = request
        .headers()
        .get(header::IF_NONE_MATCH)
        .and_then(|v| v.to_str().ok())
    {
        let weak = format!("W/{etag}");
        if value
            .split(',')
            .map(str::trim)
            .any(|tag| tag == etag || tag == weak || tag == "*")
        {
            return static_response(
                StatusCode::NOT_MODIFIED,
                Body::empty(),
                0,
                [
                    (header::ETAG, etag),
                    (header::CACHE_CONTROL, cache_control),
                    (header::ACCEPT_RANGES, "bytes".into()),
                ],
            );
        }
    }

    let media_type = mime_type(&file_path);
    if size > 0 {
        if let Some(range_header) = request
            .headers()
            .get(header::RANGE)
            .and_then(|v| v.to_str().ok())
        {
            match parse_range(range_header, size) {
                Range::Valid(start, end) => {
                    let length = end - start + 1;
                    let Ok(body) = file_body(&file_path, start, length).await else {
                        return not_found();
                    };
                    let content_range = format!("bytes {start}-{end}/{size}");
                    let mut response = static_response(
                        StatusCode::PARTIAL_CONTENT,
                        body,
                        length,
                        [
                            (header::ACCEPT_RANGES, "bytes".into()),
                            (header::CONTENT_LENGTH, length.to_string()),
                            (header::CONTENT_TYPE, media_type),
                            (header::ETAG, etag),
                            (header::CACHE_CONTROL, cache_control),
                        ],
                    );
                    response
                        .extensions_mut()
                        .insert(StaticFileResponse { size });
                    response
                        .extensions_mut()
                        .insert(RangeResponse { content_range });
                    return response;
                }
                Range::Unsatisfiable => {
                    return static_response(
                        StatusCode::RANGE_NOT_SATISFIABLE,
                        Body::empty(),
                        0,
                        [
                            (header::CONTENT_RANGE, format!("bytes */{size}")),
                            (header::ACCEPT_RANGES, "bytes".into()),
                            (header::CONTENT_LENGTH, "0".into()),
                        ],
                    );
                }
                Range::Ignore => {}
            }
        }
    }

    let Ok(body) = file_body(&file_path, 0, size).await else {
        return not_found();
    };
    let full_media_type = if media_type.starts_with("text/") {
        format!("{media_type}; charset=utf-8")
    } else {
        media_type
    };
    let mut response = static_response(
        StatusCode::OK,
        body,
        size,
        [
            (header::ETAG, etag),
            (header::CACHE_CONTROL, cache_control),
            (header::ACCEPT_RANGES, "bytes".into()),
            (header::CONTENT_TYPE, full_media_type),
            (header::CONTENT_LENGTH, size.to_string()),
            (header::LAST_MODIFIED, http_date(modified)),
        ],
    );
    response
        .extensions_mut()
        .insert(StaticFileResponse { size });
    response
}

async fn file_body(path: &Path, start: u64, length: u64) -> Result<Body, std::io::Error> {
    let mut file = tokio::fs::File::open(path).await?;
    file.seek(SeekFrom::Start(start)).await?;
    let stream =
        futures_util::stream::try_unfold((file, length), |(mut file, remaining)| async move {
            if remaining == 0 {
                return Ok::<_, std::io::Error>(None);
            }
            let mut chunk = vec![0; remaining.min(64 * 1024) as usize];
            let read = file.read(&mut chunk).await?;
            if read == 0 {
                return Ok(None);
            }
            chunk.truncate(read);
            Ok(Some((chunk, (file, remaining - read as u64))))
        });
    Ok(Body::from_stream(stream))
}

fn select_file(public_dir: &Path, path: &str) -> Option<PathBuf> {
    let root = std::fs::canonicalize(public_dir).ok()?;
    let requested = Path::new(path);
    let safe = !requested.components().any(|component| {
        matches!(
            component,
            Component::ParentDir | Component::RootDir | Component::Prefix(_)
        )
    });
    if safe {
        let candidate = root.join(requested);
        if let Ok(resolved) = std::fs::canonicalize(&candidate) {
            if resolved.starts_with(&root) && resolved.is_file() {
                return Some(resolved);
            }
        }
    }
    let index = root.join("index.html");
    index.is_file().then_some(index)
}

fn cache_control(public_dir: &Path, file_path: &Path) -> String {
    let name = file_path
        .file_name()
        .and_then(|name| name.to_str())
        .unwrap_or("")
        .to_ascii_lowercase();
    let extension = file_path
        .extension()
        .and_then(|ext| ext.to_str())
        .unwrap_or("")
        .to_ascii_lowercase();
    if matches!(
        name.as_str(),
        "index.html" | "sw.js" | "asset-manifest.json"
    ) || extension == "html"
    {
        return "no-cache, no-transform".into();
    }
    let assets = std::fs::canonicalize(public_dir.join("assets"))
        .unwrap_or_else(|_| public_dir.join("assets"));
    if file_path.starts_with(assets) {
        "public, max-age=31536000, immutable".into()
    } else {
        "public, max-age=0, must-revalidate".into()
    }
}

enum Range {
    Valid(u64, u64),
    Unsatisfiable,
    Ignore,
}

fn parse_range(value: &str, size: u64) -> Range {
    let Some(value) = value.trim().strip_prefix("bytes=") else {
        return Range::Ignore;
    };
    let Some((start, end)) = value.split_once('-') else {
        return Range::Ignore;
    };
    if end.contains('-')
        || (!start.is_empty() && !start.bytes().all(|b| b.is_ascii_digit()))
        || (!end.is_empty() && !end.bytes().all(|b| b.is_ascii_digit()))
    {
        return Range::Ignore;
    }
    let (start, end) = match (start.is_empty(), end.is_empty()) {
        (true, true) => (0, size - 1),
        (false, true) => (start.parse::<u64>().unwrap_or(u64::MAX), size - 1),
        (true, false) => {
            let suffix = end.parse::<u64>().unwrap_or(u64::MAX);
            (size.saturating_sub(suffix), size - 1)
        }
        (false, false) => {
            let start = start.parse::<u64>().unwrap_or(u64::MAX);
            let end = end.parse::<u64>().unwrap_or(u64::MAX).min(size - 1);
            (start, end)
        }
    };
    if start <= end && end < size {
        Range::Valid(start, end)
    } else {
        Range::Unsatisfiable
    }
}

fn mime_type(path: &Path) -> String {
    let extension = path
        .extension()
        .and_then(|ext| ext.to_str())
        .unwrap_or("")
        .to_ascii_lowercase();
    match extension.as_str() {
        "bin" => "application/octet-stream",
        "css" => "text/css",
        "gif" => "image/gif",
        "glb" => "model/gltf-binary",
        "html" => "text/html",
        "jpg" => "image/jpeg",
        "js" => "text/javascript",
        "json" => "application/json",
        "m4a" => "audio/mp4",
        "md" => "text/markdown",
        "moc3" => "application/octet-stream",
        "mp3" => "audio/mpeg",
        "mp4" => "video/mp4",
        "ogg" => "audio/ogg",
        "pdf" => "application/pdf",
        "png" => "image/png",
        "svg" => "image/svg+xml",
        "txt" => "text/plain",
        "wasm" => "application/wasm",
        "wav" => "audio/wav",
        "webp" => "image/webp",
        "woff2" => "font/woff2",
        _ => "application/octet-stream",
    }
    .into()
}

fn static_response<const N: usize>(
    status: StatusCode,
    body: Body,
    body_length: u64,
    headers: [(HeaderName, String); N],
) -> Response {
    let mut response = Response::new(body);
    *response.status_mut() = status;
    for (name, value) in headers {
        if let Ok(value) = HeaderValue::from_str(&value) {
            response.headers_mut().insert(name, value);
        }
    }
    if status != StatusCode::NOT_MODIFIED
        && !response.headers().contains_key(header::CONTENT_LENGTH)
    {
        response.headers_mut().insert(
            header::CONTENT_LENGTH,
            body_length.to_string().parse().unwrap(),
        );
    }
    response
}

fn json_response(status: u16, body: &str, extra: Option<(HeaderName, &str)>) -> Response {
    let mut response = Response::new(Body::from(body.to_string()));
    *response.status_mut() =
        StatusCode::from_u16(status).unwrap_or(StatusCode::INTERNAL_SERVER_ERROR);
    response.headers_mut().insert(
        header::CONTENT_TYPE,
        HeaderValue::from_static("application/json"),
    );
    response.headers_mut().insert(
        header::CONTENT_LENGTH,
        body.len().to_string().parse().unwrap(),
    );
    if let Some((name, value)) = extra {
        response.headers_mut().insert(name, value.parse().unwrap());
    }
    response
}

fn not_found() -> Response {
    json_response(404, r#"{"detail":"Not found"}"#, None)
}

fn percent_decode(value: &str) -> Option<String> {
    let bytes = value.as_bytes();
    let mut decoded = Vec::with_capacity(bytes.len());
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'%' {
            if i + 2 >= bytes.len() {
                return None;
            }
            let high = hex_digit(bytes[i + 1])?;
            let low = hex_digit(bytes[i + 2])?;
            decoded.push(high * 16 + low);
            i += 3;
        } else {
            decoded.push(bytes[i]);
            i += 1;
        }
    }
    String::from_utf8(decoded).ok()
}

fn hex_digit(value: u8) -> Option<u8> {
    match value {
        b'0'..=b'9' => Some(value - b'0'),
        b'a'..=b'f' => Some(value - b'a' + 10),
        b'A'..=b'F' => Some(value - b'A' + 10),
        _ => None,
    }
}

pub(crate) fn http_date(time: SystemTime) -> String {
    const DAYS: [&str; 7] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const MONTHS: [&str; 12] = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    let seconds = time
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    let days = (seconds / 86_400) as i64;
    let day_seconds = seconds % 86_400;
    let weekday = DAYS[((days + 4) % 7) as usize];
    let z = days + 719_468;
    let era = z / 146_097;
    let day_of_era = z - era * 146_097;
    let year_of_era =
        (day_of_era - day_of_era / 1_460 + day_of_era / 36_524 - day_of_era / 146_096) / 365;
    let mut year = year_of_era + era * 400;
    let day_of_year = day_of_era - (365 * year_of_era + year_of_era / 4 - year_of_era / 100);
    let month_prime = (5 * day_of_year + 2) / 153;
    let day = day_of_year - (153 * month_prime + 2) / 5 + 1;
    let month = month_prime + if month_prime < 10 { 3 } else { -9 };
    year += i64::from(month <= 2);
    format!(
        "{weekday}, {day:02} {} {year:04} {:02}:{:02}:{:02} GMT",
        MONTHS[(month - 1) as usize],
        day_seconds / 3_600,
        day_seconds / 60 % 60,
        day_seconds % 60,
    )
}

#[cfg(test)]
mod tests {
    use super::http_date;
    use std::time::UNIX_EPOCH;

    #[test]
    fn formats_http_dates_as_gmt() {
        assert_eq!(http_date(UNIX_EPOCH), "Thu, 01 Jan 1970 00:00:00 GMT");
    }
}

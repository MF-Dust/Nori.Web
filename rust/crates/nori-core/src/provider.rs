//! Sans-IO HTTP contract shared by the LLM/TTS flows and both hosts.
//!
//! The core never performs I/O. Provider flows return [`HttpRequest`]s; the
//! host executes them (reqwest locally, `worker::Fetch` at the edge) and feeds
//! an [`HttpResult`] back into the flow.

/// Error responses (status >= 400) are read at most this far by hosts.
pub const MAX_ERROR_BODY_BYTES: usize = 64 * 1024;

/// Effective body cap for a response status (see `HttpRequest::max_response_bytes`).
pub fn body_cap(status: u16, max_response_bytes: usize) -> usize {
    if status >= 400 {
        max_response_bytes.min(MAX_ERROR_BODY_BYTES)
    } else {
        max_response_bytes
    }
}

/// One outbound provider request.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct HttpRequest {
    /// `GET` or `POST`.
    pub method: String,
    /// Absolute URL including any query string.
    pub url: String,
    pub headers: Vec<(String, String)>,
    pub body: Option<Vec<u8>>,
    /// Whole-request timeout. The host maps expiry to [`HttpResult::Timeout`].
    pub timeout_ms: u64,
    /// The host stops reading the (decoded) body once this many bytes have
    /// arrived and reports `truncated: true`. It must never buffer more.
    /// For error statuses (>= 400) hosts cap at
    /// `min(max_response_bytes, MAX_ERROR_BODY_BYTES)` instead (Python TTS
    /// reads at most 64 KiB of an error body).
    pub max_response_bytes: usize,
    /// Python providers use `follow_redirects=False`; hosts must not follow.
    pub follow_redirects: bool,
}

impl HttpRequest {
    pub fn post_json(
        url: impl Into<String>,
        headers: Vec<(String, String)>,
        body: &serde_json::Value,
        timeout_ms: u64,
        max_response_bytes: usize,
    ) -> Self {
        let mut headers = headers;
        if !headers
            .iter()
            .any(|(k, _)| k.eq_ignore_ascii_case("content-type"))
        {
            headers.push(("Content-Type".into(), "application/json".into()));
        }
        Self {
            method: "POST".into(),
            url: url.into(),
            headers,
            body: Some(serde_json::to_vec(body).unwrap_or_default()),
            timeout_ms,
            max_response_bytes,
            follow_redirects: false,
        }
    }
}

/// What the host observed for one [`HttpRequest`].
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum HttpResult {
    Response {
        status: u16,
        /// Lower-case header names. Hosts drop `content-encoding` and
        /// `content-length` after transparently decoding gzip/br bodies.
        headers: Vec<(String, String)>,
        /// Decoded body, at most `max_response_bytes` long.
        body: Vec<u8>,
        /// True when the body was cut at `max_response_bytes`.
        truncated: bool,
    },
    Timeout,
    /// Connection/DNS/TLS failure. The text is diagnostic only and must never
    /// be shown to users (it can contain URLs).
    Network(String),
}

impl HttpResult {
    pub fn header(&self, name: &str) -> Option<&str> {
        match self {
            HttpResult::Response { headers, .. } => headers
                .iter()
                .find(|(k, _)| k.eq_ignore_ascii_case(name))
                .map(|(_, v)| v.as_str()),
            _ => None,
        }
    }
}

/// One step of a sans-IO provider flow.
#[derive(Clone, Debug, PartialEq)]
pub enum FlowStep<T> {
    /// Execute this request and pass the result to the flow's `resume`.
    Http(HttpRequest),
    Done(T),
}

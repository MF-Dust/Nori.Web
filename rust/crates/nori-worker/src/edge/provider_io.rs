//! Host response limits (shared rule: `nori_core::provider::body_cap`).
use futures_util::{Stream, StreamExt};

pub use nori_core::provider::{body_cap, MAX_ERROR_BODY_BYTES};

pub async fn read_limited<S, E>(mut stream: S, cap: usize) -> Result<(Vec<u8>, bool), E>
where
    S: Stream<Item = Result<Vec<u8>, E>> + Unpin,
{
    let mut body = Vec::new();
    while let Some(chunk) = stream.next().await {
        let chunk = chunk?;
        let remaining = cap.saturating_sub(body.len());
        body.extend_from_slice(&chunk[..chunk.len().min(remaining)]);
        if chunk.len() > remaining {
            return Ok((body, true));
        }
    }
    Ok((body, false))
}

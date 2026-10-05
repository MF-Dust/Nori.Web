pub const OUTER_VERSION: u8 = 1;
pub const CHAT_AUDIO_CHANNEL: u8 = 1;
pub const SAMPLE_RATE: u32 = 32_000;

pub fn uuid_bytes(value: &str) -> Option<[u8; 16]> {
    uuid::Uuid::parse_str(value).ok().map(|id| *id.as_bytes())
}

pub fn chat_audio_frame(
    sequence: u32,
    block_id: u32,
    chunk_id: u32,
    operation_id: &str,
    message_id: &str,
    is_complete: bool,
    pcm: &[u8],
) -> Option<Vec<u8>> {
    let op = uuid_bytes(operation_id)?;
    let msg = uuid_bytes(message_id)?;
    let flags: u16 = if is_complete { 1 } else { 0 };
    let mut out = Vec::with_capacity(48 + pcm.len());
    out.push(OUTER_VERSION);
    out.push(CHAT_AUDIO_CHANNEL);
    out.extend_from_slice(&flags.to_le_bytes());
    out.extend_from_slice(&sequence.to_le_bytes());
    out.extend_from_slice(&block_id.to_le_bytes());
    out.extend_from_slice(&chunk_id.to_le_bytes());
    out.extend_from_slice(&op);
    out.extend_from_slice(&msg);
    out.extend_from_slice(pcm);
    Some(out)
}

pub fn tone_pcm(frequency: f64, duration_ms: u32) -> Vec<u8> {
    let samples = ((SAMPLE_RATE as u64 * duration_ms as u64) / 1000).max(1) as usize;
    let mut result = vec![0u8; samples * 2];
    for index in 0..samples {
        let position = index as f64 / SAMPLE_RATE as f64;
        let envelope =
            (std::f64::consts::PI * index as f64 / (samples.saturating_sub(1).max(1) as f64)).sin();
        let amplitude =
            (32767.0 * 0.16 * envelope * (2.0 * std::f64::consts::PI * frequency * position).sin())
                as i16;
        result[index * 2..index * 2 + 2].copy_from_slice(&amplitude.to_le_bytes());
    }
    result
}

pub fn fallback_frames(
    operation_id: &str,
    message_id: &str,
    text: &str,
    start_sequence: u32,
) -> Vec<Vec<u8>> {
    let count = text.chars().count().div_ceil(8).clamp(1, 12);
    let notes = [523.25, 587.33, 659.25, 698.46, 783.99, 880.0];
    let mut frames = Vec::with_capacity(count);
    for chunk_id in 0..count {
        if let Some(frame) = chat_audio_frame(
            start_sequence.wrapping_add(chunk_id as u32 + 1),
            0,
            chunk_id as u32,
            operation_id,
            message_id,
            chunk_id + 1 == count,
            &tone_pcm(notes[chunk_id % notes.len()], 180),
        ) {
            frames.push(frame);
        }
    }
    frames
}

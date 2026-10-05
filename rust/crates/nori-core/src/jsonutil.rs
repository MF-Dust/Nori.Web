use serde_json::{Map, Value};

pub type Json = Value;

thread_local! {
    static FIXED_TIME_MS: std::cell::Cell<Option<i64>> = const { std::cell::Cell::new(None) };
}

/// Run synchronous fixture replays with the same frozen clock as the Python exporter.
/// Overrides are thread-local and restore the previous clock even when unwinding.
pub fn with_now_ms<T>(now: i64, run: impl FnOnce() -> T) -> T {
    struct Restore(Option<i64>);
    impl Drop for Restore {
        fn drop(&mut self) {
            FIXED_TIME_MS.set(self.0);
        }
    }
    let _restore = Restore(FIXED_TIME_MS.replace(Some(now)));
    run()
}

/// Wall clock in Unix milliseconds. `SystemTime` is unsupported on
/// wasm32-unknown-unknown (it panics), so the edge reads JavaScript's clock.
#[cfg(target_arch = "wasm32")]
fn wall_clock_ms() -> i64 {
    js_sys::Date::now() as i64
}

#[cfg(not(target_arch = "wasm32"))]
fn wall_clock_ms() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0)
}

pub fn now_ms() -> i64 {
    if let Some(now) = FIXED_TIME_MS.get() {
        return now;
    }
    wall_clock_ms()
}

pub fn now_secs() -> i64 {
    if let Some(now) = FIXED_TIME_MS.get() {
        return now.div_euclid(1000);
    }
    wall_clock_ms().div_euclid(1000)
}

pub fn is_int(value: &Value) -> bool {
    value.as_i64().is_some() || value.as_u64().is_some()
}

pub fn as_i64(value: &Value) -> Option<i64> {
    value
        .as_i64()
        .or_else(|| value.as_u64().and_then(|n| i64::try_from(n).ok()))
}

pub fn as_nonneg(value: &Value) -> Option<u64> {
    match value {
        Value::Number(n) => n
            .as_u64()
            .or_else(|| n.as_i64().and_then(|v| u64::try_from(v).ok())),
        _ => None,
    }
}

pub fn obj(value: &Value) -> Option<&Map<String, Value>> {
    value.as_object()
}

pub fn obj_mut(value: &mut Value) -> Option<&mut Map<String, Value>> {
    value.as_object_mut()
}

pub fn get<'a>(value: &'a Value, key: &str) -> Option<&'a Value> {
    value.get(key)
}

pub fn get_str<'a>(value: &'a Value, key: &str) -> Option<&'a str> {
    value.get(key).and_then(Value::as_str)
}

/// Python `json.dumps(..., sort_keys=True, separators=(",", ":"), ensure_ascii=False)`.
pub fn canonical_json(value: &Value) -> String {
    let mut out = String::new();
    write_canonical(&mut out, value);
    out
}

fn write_canonical(out: &mut String, value: &Value) {
    match value {
        Value::Null => out.push_str("null"),
        Value::Bool(true) => out.push_str("true"),
        Value::Bool(false) => out.push_str("false"),
        Value::Number(n) => out.push_str(&n.to_string()),
        Value::String(s) => {
            out.push_str(&serde_json::to_string(s).unwrap_or_else(|_| "\"\"".into()))
        }
        Value::Array(items) => {
            out.push('[');
            for (i, item) in items.iter().enumerate() {
                if i > 0 {
                    out.push(',');
                }
                write_canonical(out, item);
            }
            out.push(']');
        }
        Value::Object(map) => {
            out.push('{');
            let mut keys: Vec<&String> = map.keys().collect();
            keys.sort();
            for (i, key) in keys.iter().enumerate() {
                if i > 0 {
                    out.push(',');
                }
                out.push_str(&serde_json::to_string(key).unwrap_or_else(|_| "\"\"".into()));
                out.push(':');
                write_canonical(out, &map[*key]);
            }
            out.push('}');
        }
    }
}

pub fn hex_encode(bytes: &[u8]) -> String {
    const HEX: &[u8; 16] = b"0123456789abcdef";
    let mut out = String::with_capacity(bytes.len() * 2);
    for byte in bytes {
        out.push(HEX[(byte >> 4) as usize] as char);
        out.push(HEX[(byte & 0xf) as usize] as char);
    }
    out
}

pub fn token_urlsafe(nbytes: usize) -> String {
    use base64::engine::general_purpose::URL_SAFE_NO_PAD;
    use base64::Engine;
    use rand::RngCore;
    let mut buf = vec![0u8; nbytes];
    rand::rng().fill_bytes(&mut buf);
    URL_SAFE_NO_PAD.encode(buf)
}

/// Random UUID v4 string (randomness via `rand`, which also works on wasm32).
pub fn uuid4() -> String {
    uuid::Builder::from_random_bytes(rand::random())
        .into_uuid()
        .to_string()
}

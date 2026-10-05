use crate::jsonutil::{hex_encode, token_urlsafe, Json};
use base64::engine::general_purpose::URL_SAFE_NO_PAD;
use base64::Engine;
use hmac::{Hmac, Mac};
use serde_json::{json, Value};
use sha2::Sha256;
use std::collections::HashMap;

type HmacSha256 = Hmac<Sha256>;

pub const SESSION_COOKIE: &str = "arcade-auth.session_token";
pub const STORY_COOKIE: &str = "nori_full_unlock";
pub const GUEST_PREFIX: &str = "guest.v1.";
pub const SESSION_TTL: i64 = 30 * 24 * 60 * 60;
const TICKET_TTL: i64 = 300;

fn hmac_sha256(secret: &str, payload: &str) -> Vec<u8> {
    let mut mac = HmacSha256::new_from_slice(secret.as_bytes()).expect("hmac key");
    mac.update(payload.as_bytes());
    mac.finalize().into_bytes().to_vec()
}

fn sign_hex(secret: &str, payload: &str) -> String {
    hex_encode(&hmac_sha256(secret, payload))
}

fn b64(data: &[u8]) -> String {
    URL_SAFE_NO_PAD.encode(data)
}

fn b64_decode(value: &str) -> Option<Vec<u8>> {
    URL_SAFE_NO_PAD.decode(value).ok()
}

pub fn cookie_token(cookie_header: &str, better_auth: &str) -> Option<String> {
    for raw in [cookie_header, better_auth] {
        for part in raw.split(';') {
            let Some((key, value)) = part.trim().split_once('=') else {
                continue;
            };
            if key == SESSION_COOKIE || key.ends_with("session_token") {
                return Some(value.to_string());
            }
        }
    }
    None
}

pub fn story_preference(cookie_header: &str) -> Option<bool> {
    for part in cookie_header.split(';') {
        let Some((key, value)) = part.trim().split_once('=') else {
            continue;
        };
        if key == STORY_COOKIE {
            return match value {
                "1" => Some(true),
                "0" => Some(false),
                _ => None,
            };
        }
    }
    None
}

pub fn apply_story_default(message: &mut Json, preference: Option<bool>) {
    let Some(preference) = preference else {
        return;
    };
    let Some(obj) = message.as_object_mut() else {
        return;
    };
    let kind = obj.get("type").and_then(Value::as_str).unwrap_or("");
    if (kind == "open_my_web_world" || kind == "reset_my_web_world")
        && !obj.contains_key("fullUnlock")
    {
        obj.insert("fullUnlock".into(), json!(preference));
    }
}

pub fn guest_session(secret: &str, token: Option<&str>, now: i64) -> (Json, bool) {
    let mut valid = false;
    let mut nonce = String::new();
    let mut expires_at = 0;
    let mut issued = token.unwrap_or("").to_string();
    if let Some(token) = token {
        if let Some(rest) = token.strip_prefix(GUEST_PREFIX) {
            let parts: Vec<&str> = rest.split('.').collect();
            // guest.v1.{nonce}.{expiry}.{sig} => rest is {nonce}.{expiry}.{sig}
            if parts.len() == 3 {
                let (n, exp, sig) = (parts[0], parts[1], parts[2]);
                if let Ok(exp_i) = exp.parse::<i64>() {
                    let payload = format!("{GUEST_PREFIX}{n}.{exp}");
                    let sig_ok = sig.len() == 64
                        && sig
                            .bytes()
                            .all(|c| c.is_ascii_digit() || (b'a'..=b'f').contains(&c))
                        && n.len() == 32
                        && n.bytes()
                            .all(|c| c.is_ascii_digit() || (b'a'..=b'f').contains(&c))
                        && now < exp_i
                        && exp_i <= now + SESSION_TTL
                        && constant_hex_eq(&sign_hex(secret, &payload), sig);
                    if sig_ok {
                        valid = true;
                        nonce = n.to_string();
                        expires_at = exp_i;
                        issued = token.to_string();
                    }
                }
            }
        }
    }
    if !valid {
        nonce = hex_encode(&{
            use rand::RngCore;
            let mut buf = [0u8; 16];
            rand::rng().fill_bytes(&mut buf);
            buf
        });
        expires_at = now + SESSION_TTL;
        let payload = format!("{GUEST_PREFIX}{nonce}.{expires_at}");
        issued = format!("{payload}.{}", sign_hex(secret, &payload));
    }
    let user_id = format!("guest_{nonce}");
    let session = json!({
        "session": {
            "id": format!("session_{user_id}"),
            "userId": user_id,
            "token": issued,
            "expiresAt": expires_at * 1000,
        },
        "user": {
            "id": user_id,
            "name": "Operator",
            "email": format!("{user_id}@nori.local"),
            "image": "/icon.png",
            "createdAt": (expires_at - SESSION_TTL) * 1000,
        }
    });
    (session, !valid)
}

fn constant_hex_eq(left: &str, right: &str) -> bool {
    if left.len() != right.len() {
        return false;
    }
    let mut diff = 0u8;
    for (a, b) in left.bytes().zip(right.bytes()) {
        diff |= a ^ b;
    }
    diff == 0
}

pub fn auth_cookie_headers(token: &str, secure: bool) -> Vec<(String, String)> {
    let mut cookie =
        format!("{SESSION_COOKIE}={token}; Path=/; Max-Age={SESSION_TTL}; HttpOnly; SameSite=Lax");
    if secure {
        cookie.push_str("; Secure");
    }
    vec![
        ("Set-Cookie".into(), cookie.clone()),
        ("set-better-auth-cookie".into(), cookie),
        ("Cache-Control".into(), "private, no-store".into()),
    ]
}

pub fn issue_ticket(secret: &str, user_id: &str, now: i64) -> String {
    let payload = json!({"u": user_id, "e": now + TICKET_TTL, "n": token_urlsafe(8)});
    let raw = serde_json::to_string(&payload).unwrap_or_else(|_| "{}".into());
    let encoded = b64(raw.as_bytes());
    let sig = b64(&hmac_sha256(secret, &encoded));
    format!("{encoded}.{sig}")
}

pub fn resolve_ticket(secret: &str, token: &str, now: i64) -> Option<String> {
    let (encoded, signature) = token.rsplit_once('.')?;
    let expected = b64(&hmac_sha256(secret, encoded));
    if !constant_hex_eq(&expected, signature) && expected != signature {
        // base64 is not hex; compare raw bytes in constant time via length-checked xor
        if expected.len() != signature.len() {
            return None;
        }
        let mut diff = 0u8;
        for (a, b) in expected.bytes().zip(signature.bytes()) {
            diff |= a ^ b;
        }
        if diff != 0 {
            return None;
        }
    } else if expected != signature {
        return None;
    }
    let bytes = b64_decode(encoded)?;
    let text = String::from_utf8(bytes).ok()?;
    let payload: Value = serde_json::from_str(&text).ok()?;
    let user_id = payload.get("u").and_then(Value::as_str)?;
    let expires = payload.get("e").and_then(|v| v.as_i64())?;
    if user_id.is_empty() || user_id == "guest-user-001" || expires < now {
        return None;
    }
    Some(user_id.to_string())
}

pub fn is_same_origin(origin: Option<&str>, request_url: &str) -> bool {
    let Some(origin) = origin else {
        return true;
    };
    if origin.chars().any(char::is_whitespace) {
        return false;
    }
    let Ok(source) = url_parts(origin) else {
        return false;
    };
    let Ok(mut target) = url_parts(request_url) else {
        return false;
    };
    if !matches!(source.scheme.as_str(), "http" | "https")
        || source.host.is_empty()
        || source.has_userinfo
        || !matches!(source.path.as_str(), "" | "/")
        || source.has_query
        || source.has_fragment
    {
        return false;
    }
    if target.scheme == "ws" {
        target.scheme = "http".into();
    } else if target.scheme == "wss" {
        target.scheme = "https".into();
    }
    let source_port = source
        .port
        .unwrap_or(if source.scheme == "https" { 443 } else { 80 });
    let target_port = target
        .port
        .unwrap_or(if target.scheme == "https" { 443 } else { 80 });
    source.scheme == target.scheme
        && source.host.eq_ignore_ascii_case(&target.host)
        && source_port == target_port
}

struct UrlParts {
    scheme: String,
    host: String,
    port: Option<u16>,
    path: String,
    has_userinfo: bool,
    has_query: bool,
    has_fragment: bool,
}

fn url_parts(raw: &str) -> Result<UrlParts, ()> {
    let (scheme, rest) = raw.split_once("://").ok_or(())?;
    let (authority, after) = rest
        .split_once('/')
        .map(|(a, b)| (a, format!("/{b}")))
        .unwrap_or((rest, String::new()));
    let (authority, query_fragment) = if after.is_empty() {
        authority
            .split_once('?')
            .map(|(a, q)| (a, Some(q)))
            .unwrap_or((authority, None))
    } else {
        (authority, None)
    };
    let has_fragment = raw.contains('#') || query_fragment.is_some_and(|q| q.contains('#'));
    let has_query = raw.contains('?');
    if authority.contains('@') {
        return Ok(UrlParts {
            scheme: scheme.into(),
            host: String::new(),
            port: None,
            path: after,
            has_userinfo: true,
            has_query,
            has_fragment,
        });
    }
    let (host, port) = if let Some(host) = authority.strip_prefix('[') {
        let (host, rest) = host.split_once(']').ok_or(())?;
        let port = rest.strip_prefix(':').and_then(|p| p.parse().ok());
        (host.to_string(), port)
    } else if let Some((host, port)) = authority.rsplit_once(':') {
        if port.chars().all(|c| c.is_ascii_digit()) {
            (host.to_string(), port.parse().ok())
        } else {
            (authority.to_string(), None)
        }
    } else {
        (authority.to_string(), None)
    };
    let path = if after.is_empty() {
        if let Some(q) = query_fragment {
            let path = q.split(['?', '#']).next().unwrap_or("");
            path.to_string()
        } else {
            String::new()
        }
    } else {
        after.split(['?', '#']).next().unwrap_or("").to_string()
    };
    Ok(UrlParts {
        scheme: scheme.into(),
        host,
        port,
        path,
        has_userinfo: false,
        has_query,
        has_fragment,
    })
}

#[derive(Default)]
pub struct MemoryAuth {
    pub sessions: HashMap<String, Json>,
    pub users: HashMap<String, Json>,
    pub otps: HashMap<String, (String, i64)>,
}

pub fn header<'a>(headers: &'a [(String, String)], name: &str) -> Option<&'a str> {
    headers
        .iter()
        .find(|(k, _)| k.eq_ignore_ascii_case(name))
        .map(|(_, v)| v.as_str())
}

mod support;

use base64::engine::general_purpose::URL_SAFE_NO_PAD;
use base64::Engine;
use hmac::{Hmac, Mac};
use nori_core::auth::{self, SESSION_TTL};
use serde_json::{json, Value};
use sha2::Sha256;
use support::{assert_json_eq, fixture};

type HmacSha256 = Hmac<Sha256>;

fn signature(secret: &str, payload: &str) -> Vec<u8> {
    let mut mac = HmacSha256::new_from_slice(secret.as_bytes()).unwrap();
    mac.update(payload.as_bytes());
    mac.finalize().into_bytes().to_vec()
}

fn hex(bytes: &[u8]) -> String {
    bytes.iter().map(|b| format!("{b:02x}")).collect()
}

fn guest_structure(secret: &str, session: &Value, expiry: i64) {
    let token = session["session"]["token"].as_str().unwrap();
    let parts: Vec<_> = token.split('.').collect();
    assert_eq!(parts.len(), 5);
    assert_eq!(&parts[..2], &["guest", "v1"]);
    assert_eq!(parts[2].len(), 32);
    assert!(parts[2]
        .bytes()
        .all(|c| c.is_ascii_digit() || (b'a'..=b'f').contains(&c)));
    assert_eq!(parts[3], expiry.to_string());
    assert_eq!(parts[4], hex(&signature(secret, &parts[..4].join("."))));
    let user = format!("guest_{}", parts[2]);
    let expected = json!({
        "session": {"id": format!("session_{user}"), "userId": user,
            "token": token, "expiresAt": expiry * 1000},
        "user": {"id": user, "name": "Operator", "email": format!("{user}@nori.local"),
            "image": "/icon.png", "createdAt": (expiry - SESSION_TTL) * 1000},
    });
    assert_json_eq(&expected, session, "Python guest-session structure/HMAC");
}

#[test]
fn guest_validation_and_expiry_window() {
    let fixture = fixture("auth_vectors.json");
    let secret = fixture["secret"].as_str().unwrap();
    for vector in fixture["guestSessions"].as_array().unwrap() {
        let token = vector["token"].as_str().unwrap();
        let issued_at = vector["issuedAt"].as_i64().unwrap();
        let expiry = vector["expiry"].as_i64().unwrap();
        let (session, created) =
            auth::guest_session(secret, Some(token), vector["validAt"].as_i64().unwrap());
        assert_eq!(
            json!(created),
            vector["validOutcome"]["created"],
            "{}",
            vector["case"]
        );
        assert_eq!(session["session"]["token"], vector["validOutcome"]["token"]);
        assert_eq!(session["user"]["id"], vector["validOutcome"]["userId"]);
        assert_eq!(session["user"]["id"], vector["userId"]);
        guest_structure(secret, &session, expiry);
        for now in [issued_at, expiry - 1] {
            let (session, created) = auth::guest_session(secret, Some(token), now);
            assert!(!created);
            assert_eq!(session["session"]["token"], token);
        }
        // Python: now < expiry <= now + SESSION_TTL (no overly future tokens).
        for now in [issued_at - 1, expiry, expiry + 1] {
            let (session, created) = auth::guest_session(secret, Some(token), now);
            assert!(created);
            assert_ne!(session["session"]["token"], token);
            guest_structure(secret, &session, now + SESSION_TTL);
        }
        let (issued, created) = auth::guest_session(secret, None, issued_at);
        assert_eq!(json!(created), vector["created"]);
        guest_structure(secret, &issued, expiry);
        let (restored, created) =
            auth::guest_session(secret, issued["session"]["token"].as_str(), issued_at + 1);
        assert!(!created);
        assert_json_eq(&issued, &restored, "Rust-issued guest token round trip");
    }
}

#[test]
fn invalid_guest_tokens_rotate_and_python_replacements_validate() {
    let fixture = fixture("auth_vectors.json");
    let secret = fixture["secret"].as_str().unwrap();
    for vector in fixture["guestInvalidVariants"].as_array().unwrap() {
        let now = vector["validationAt"].as_i64().unwrap();
        let (session, created) = auth::guest_session(secret, vector["input"].as_str(), now);
        assert_eq!(json!(created), vector["created"], "{}", vector["case"]);
        assert_eq!(
            json!(session["user"]["id"] != "guest-user-001"),
            vector["notLegacy"]
        );
        assert_ne!(session["session"]["token"], vector["input"]);
        guest_structure(secret, &session, now + SESSION_TTL);
        let (replacement, created) =
            auth::guest_session(secret, vector["replacementToken"].as_str(), now + 1);
        assert!(!created);
        assert_eq!(replacement["user"]["id"], vector["userId"]);
        assert_eq!(replacement["session"]["token"], vector["replacementToken"]);
        guest_structure(secret, &replacement, now + SESSION_TTL);
    }
}

#[test]
fn guest_nonce_must_be_lowercase_even_with_a_valid_signature() {
    let fixture = fixture("auth_vectors.json");
    let secret = fixture["secret"].as_str().unwrap();
    let now = fixture["guestSessions"][0]["issuedAt"].as_i64().unwrap();
    for nonce in ["a".repeat(32), "A".repeat(32)] {
        let payload = format!("guest.v1.{nonce}.{}", now + SESSION_TTL);
        let token = format!("{payload}.{}", hex(&signature(secret, &payload)));
        let (session, created) = auth::guest_session(secret, Some(&token), now);
        assert_eq!(
            created,
            nonce.starts_with('A'),
            "Python only accepts [0-9a-f] nonces"
        );
        guest_structure(secret, &session, now + SESSION_TTL);
    }
}

#[test]
fn ticket_resolution_and_python_compatible_issuance() {
    let fixture = fixture("auth_vectors.json");
    let secret = fixture["secret"].as_str().unwrap();
    for vector in fixture["tickets"].as_array().unwrap() {
        let now = vector["resolveAt"].as_i64().unwrap();
        let resolved = auth::resolve_ticket(secret, vector["token"].as_str().unwrap_or(""), now);
        assert_eq!(
            json!(resolved),
            vector["expectedUserId"],
            "{}",
            vector["case"]
        );
        assert_eq!(json!(resolved), vector["actualUserId"]);
        if let Some(expiry) = vector["expiry"].as_i64() {
            let (encoded, signature) = vector["token"].as_str().unwrap().rsplit_once('.').unwrap();
            let payload: Value =
                serde_json::from_slice(&URL_SAFE_NO_PAD.decode(encoded).unwrap()).unwrap();
            assert_eq!(payload["e"], expiry);
            assert_eq!(
                signature,
                URL_SAFE_NO_PAD.encode(self::signature(secret, encoded))
            );
        }
    }
    for user in [
        "guest_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        "user_rust_parity",
        "guest-user-001",
    ] {
        let now = 1_700_000_000;
        let token = auth::issue_ticket(secret, user, now);
        let (encoded, signature) = token.split_once('.').unwrap();
        assert!(!encoded.contains('='));
        assert!(!signature.contains('='));
        let payload: Value =
            serde_json::from_slice(&URL_SAFE_NO_PAD.decode(encoded).unwrap()).unwrap();
        assert_eq!(payload.as_object().unwrap().len(), 3);
        assert_eq!(payload["u"], user);
        assert_eq!(payload["e"], now + 300);
        assert_eq!(
            URL_SAFE_NO_PAD
                .decode(payload["n"].as_str().unwrap())
                .unwrap()
                .len(),
            8
        );
        assert_eq!(
            signature,
            URL_SAFE_NO_PAD.encode(self::signature(secret, encoded))
        );
        let expected = if user == "guest-user-001" {
            None
        } else {
            Some(user.to_string())
        };
        assert_eq!(auth::resolve_ticket(secret, &token, now + 1), expected);
        assert_eq!(auth::resolve_ticket(secret, &token, now + 300), expected);
        assert_eq!(auth::resolve_ticket(secret, &token, now + 301), None);
        assert_eq!(auth::resolve_ticket("wrong secret", &token, now), None);
    }
}

#[test]
fn cookie_precedence_values_and_headers() {
    let fixture = fixture("auth_vectors.json");
    for vector in fixture["cookieCases"].as_array().unwrap() {
        let headers = &vector["headers"];
        let token = auth::cookie_token(
            headers["cookie"].as_str().unwrap_or(""),
            headers["better-auth-cookie"].as_str().unwrap_or(""),
        );
        assert_eq!(json!(token), vector["token"], "{}", vector["case"]);
    }
    for (label, secure) in [("insecure", false), ("secure", true)] {
        let headers: serde_json::Map<String, Value> = auth::auth_cookie_headers("opaque", secure)
            .into_iter()
            .map(|(key, value)| (key, json!(value)))
            .collect();
        assert_json_eq(
            &fixture["cookieHeaders"][label],
            &Value::Object(headers),
            label,
        );
    }
}

//! Python parity details found while building the edge host.

use nori_core::http::{handle_http, http_date, required_sections, HttpHost, HttpRequest};
use nori_core::live_pack::LivePack;
use nori_core::snapshot::{world_from_snapshot, world_snapshot};
use nori_core::world::World;
use serde_json::{json, Value};
use std::sync::Arc;

fn post(path: &str, body: Value, cookie: Option<&str>) -> HttpRequest {
    let mut headers = vec![("content-type".to_string(), "application/json".to_string())];
    if let Some(cookie) = cookie {
        headers.push(("cookie".into(), cookie.into()));
    }
    HttpRequest {
        method: "POST".into(),
        path: path.into(),
        headers,
        body: body.to_string().into_bytes(),
        scheme: "http".into(),
    }
}

fn header<'a>(headers: &'a [(String, String)], name: &str) -> Vec<&'a str> {
    headers
        .iter()
        .filter(|(k, _)| k.eq_ignore_ascii_case(name))
        .map(|(_, v)| v.as_str())
        .collect()
}

#[test]
fn http_date_matches_imf_fixdate() {
    assert_eq!(http_date(0), "Thu, 01 Jan 1970 00:00:00 GMT");
    assert_eq!(http_date(1_791_109_647), "Sun, 04 Oct 2026 10:27:27 GMT");
    assert_eq!(http_date(951_782_400), "Tue, 29 Feb 2000 00:00:00 GMT");
}

#[test]
fn otp_reuses_users_by_email_and_sign_out_deletes_cookie() {
    let mut host = HttpHost {
        secret: "s".into(),
        dev_otp: "123456".into(),
        ..HttpHost::default()
    };
    let now = 1_800_000_000;
    let mut ids = Vec::new();
    for email in ["Op@Example.test", " op@example.test "] {
        handle_http(
            &mut host,
            &post("/api/auth/send-email-otp", json!({"email": email}), None),
            now,
        )
        .unwrap();
        let blank = handle_http(
            &mut host,
            &post(
                "/api/auth/sign-in/email-otp",
                json!({"email": email, "otp": ""}),
                None,
            ),
            now,
        )
        .unwrap();
        let blank: Value = serde_json::from_slice(&blank.body).unwrap();
        assert_eq!(
            blank["message"], "Invalid OTP",
            "an empty string OTP is a string in Python"
        );
        let ok = handle_http(
            &mut host,
            &post(
                "/api/auth/sign-in/email-otp",
                json!({"email": email, "otp": "123456"}),
                None,
            ),
            now,
        )
        .unwrap();
        let session: Value = serde_json::from_slice(&ok.body).unwrap();
        assert_eq!(session["user"]["name"], "op");
        ids.push(session["user"]["id"].as_str().unwrap().to_string());
    }
    assert_eq!(ids[0], ids[1], "one user per normalized email");
    let missing = handle_http(
        &mut host,
        &post(
            "/api/auth/sign-in/email-otp",
            json!({"email": "op@example.test"}),
            None,
        ),
        now,
    )
    .unwrap();
    assert_eq!(
        serde_json::from_slice::<Value>(&missing.body).unwrap()["message"],
        "Invalid email or OTP"
    );

    let out = handle_http(&mut host, &post("/api/auth/sign-out", json!({}), None), now).unwrap();
    let cookies = header(&out.headers, "set-cookie");
    assert_eq!(
        cookies,
        [format!(
            "arcade-auth.session_token=\"\"; expires={}; Max-Age=0; Path=/; SameSite=lax",
            http_date(now)
        )
        .as_str()]
    );
    assert_eq!(
        header(&out.headers, "set-better-auth-cookie"),
        ["arcade-auth.session_token=; Path=/; Max-Age=0; SameSite=Lax"]
    );
}

#[test]
fn required_sections_follow_python_prefetch_rules() {
    let event = |channel: &str, payload: Value| json!({"type": "event", "channel": channel, "payload": payload});
    assert_eq!(
        required_sections(&event("manifold.artifacts.request", json!({}))).len(),
        4
    );
    assert_eq!(
        required_sections(&event(
            "manifold.artifacts.request",
            json!({"artifactType": null})
        ))
        .len(),
        4
    );
    assert_eq!(
        required_sections(&event(
            "manifold.artifacts.request",
            json!({"artifactType": "mail"})
        )),
        ["mail_artifacts"]
    );
    assert!(required_sections(&event(
        "manifold.artifacts.request",
        json!({"artifactType": 3})
    ))
    .is_empty());
    assert!(required_sections(&event(
        "manifold.artifacts.request",
        json!({"artifactType": "app"})
    ))
    .is_empty());
    assert!(required_sections(&event("manifold.bounty.submit", json!({"fileId": ""}))).is_empty());
    assert!(
        required_sections(&event("manifold.bounty.submit", json!({"fileId": false}))).is_empty()
    );
    assert_eq!(
        required_sections(&event("manifold.bounty.submit", json!({"fileId": "f1"}))),
        ["file_artifacts"]
    );
    assert_eq!(
        required_sections(&event("idle.sync", json!({}))),
        ["file_artifacts"]
    );
    let command = |name: &str| {
        event(
            "manifold.command.request",
            json!({"command": name, "payload": {}}),
        )
    };
    assert_eq!(
        required_sections(&command("signal.login")),
        ["file_artifacts"]
    );
    assert_eq!(required_sections(&command("mail.read")), ["mail_artifacts"]);
    assert_eq!(
        required_sections(&command("signal.read")),
        ["signal_thread_artifacts", "signal_message_artifacts"]
    );
    assert!(required_sections(&json!({"type": "dispatch"})).is_empty());
}

#[test]
fn snapshot_sorts_grants_and_skips_bad_cartridges() {
    let pack = Arc::new(LivePack::empty());
    let mut world = World::new("guest_x", Some("zh-CN"), true, pack.clone());
    world.media_grants = vec!["b".into(), "a".into()];
    let mut snapshot = world_snapshot(&world);
    assert_eq!(snapshot["mediaGrants"], json!(["a", "b"]));
    snapshot["cartridges"]["unknown"] = json!({"state": {}, "headVersion": 1});
    snapshot["cartridges"]["chess"] = json!({"state": "not-a-dict"});
    snapshot["cartridges"]["chat"]["headVersion"] = json!("3");
    snapshot["cartridges"]["chat"]["visibleVersion"] = json!(9.7);
    snapshot["locale"] = json!("");
    snapshot["mediaSequence"] = json!(4_294_967_297u64);
    let restored = world_from_snapshot(&snapshot, pack.clone()).expect("partial snapshot restores");
    let ids: Vec<&str> = restored.cartridges.iter().map(|c| c.id.as_str()).collect();
    assert_eq!(ids, ["chat", "manifold.web"]);
    let chat = restored.cartridge("chat").unwrap();
    assert_eq!((chat.head_version, chat.visible_version), (3, 3));
    assert_eq!(restored.locale, "en");
    assert_eq!(restored.media_sequence, 1);
    snapshot["cartridges"]
        .as_object_mut()
        .unwrap()
        .remove("chat");
    assert!(
        world_from_snapshot(&snapshot, pack).is_none(),
        "chat is required"
    );
}

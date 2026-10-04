mod support;

use reqwest::Client;
use support::{config, start, TempDir};

#[tokio::test]
async fn compatibility_routes_preserve_entry_ticket_and_convex_contracts() {
    let public = TempDir::new("api");
    let mut config = config(public.path());
    config.machine_id = "machine-test".into();
    let server = start(config).await;
    let client = Client::builder().no_gzip().no_deflate().build().unwrap();

    let status = client
        .get(format!("{}/api/entry-status", server.base))
        .send()
        .await
        .unwrap();
    assert_eq!(status.status(), 200);
    assert_eq!(
        status.json::<serde_json::Value>().await.unwrap(),
        serde_json::json!({"status":"ok","machineId":"machine-test"})
    );

    let session = client
        .get(format!("{}/api/auth/get-session", server.base))
        .send()
        .await
        .unwrap();
    assert_eq!(session.status(), 200);
    assert_eq!(session.headers()["cache-control"], "private, no-store");
    assert_eq!(session.headers().get_all("cache-control").iter().count(), 1);
    let set_cookie = session
        .headers()
        .get("set-cookie")
        .unwrap()
        .to_str()
        .unwrap()
        .to_string();
    assert!(set_cookie.contains("HttpOnly") && set_cookie.contains("SameSite=Lax"));
    assert_eq!(
        session.headers()["set-better-auth-cookie"],
        set_cookie.as_str()
    );
    let cookie = set_cookie.split(';').next().unwrap().to_string();
    let guest = session.json::<serde_json::Value>().await.unwrap();
    let user_id = guest["user"]["id"].as_str().unwrap();

    let ticket = client
        .post(format!("{}/api/arcade/ws-ticket", server.base))
        .header("cookie", &cookie)
        .send()
        .await
        .unwrap();
    assert_eq!(ticket.status(), 200);
    let ticket = ticket.json::<serde_json::Value>().await.unwrap()["ticket"]
        .as_str()
        .unwrap()
        .to_string();
    assert_eq!(
        nori_core::auth::resolve_ticket(&server.state.config.secret_key, &ticket, now_secs()),
        Some(user_id.to_string())
    );

    let convex = client
        .post(format!("{}/api/query", server.base))
        .header("cookie", &cookie)
        .json(&serde_json::json!({"path":"auth/wsTickets:issueWebUserWsTicket"}))
        .send()
        .await
        .unwrap();
    assert_eq!(convex.status(), 200);
    assert_eq!(convex.headers()["cache-control"], "private, no-store");
    let convex = convex.json::<serde_json::Value>().await.unwrap();
    assert_eq!(convex["status"], "success");
    assert_eq!(convex["logLines"], serde_json::json!([]));
    let convex_ticket = convex["value"]["ticket"].as_str().unwrap();
    assert_eq!(
        nori_core::auth::resolve_ticket(&server.state.config.secret_key, convex_ticket, now_secs()),
        Some(user_id.to_string())
    );

    let preflight = client
        .post(format!("{}/api/mutation", server.base))
        .json(&serde_json::json!({"path":"auth/otpEmail:preflightOtpSend"}))
        .send()
        .await
        .unwrap();
    assert_eq!(
        preflight.json::<serde_json::Value>().await.unwrap(),
        serde_json::json!({"status":"success","value":null,"logLines":[]})
    );
    let timestamp = client
        .post(format!("{}/api/query_ts", server.base))
        .send()
        .await
        .unwrap();
    assert_eq!(
        timestamp.json::<serde_json::Value>().await.unwrap(),
        serde_json::json!({"ts":"0"})
    );

    let get_unknown = client
        .get(format!("{}/api/no-such", server.base))
        .send()
        .await
        .unwrap();
    assert_eq!(get_unknown.status(), 404);
    assert_eq!(
        get_unknown.json::<serde_json::Value>().await.unwrap(),
        serde_json::json!({"detail":"API endpoint not found"})
    );
    let post_unknown = client
        .post(format!("{}/api/no-such", server.base))
        .send()
        .await
        .unwrap();
    assert_eq!(post_unknown.status(), 405);
    assert_eq!(post_unknown.headers()["allow"], "GET");
    assert_eq!(
        post_unknown.json::<serde_json::Value>().await.unwrap(),
        serde_json::json!({"detail":"Method Not Allowed"})
    );
    let wrong_method = client
        .post(format!("{}/api/entry-status", server.base))
        .send()
        .await
        .unwrap();
    assert_eq!(wrong_method.status(), 405);
    assert_eq!(wrong_method.headers()["allow"], "GET");
    let get_post_route = client
        .get(format!("{}/api/query", server.base))
        .send()
        .await
        .unwrap();
    assert_eq!(get_post_route.status(), 404);
    assert_eq!(
        get_post_route.json::<serde_json::Value>().await.unwrap()["detail"],
        "API endpoint not found"
    );
}

#[test]
fn app_state_loads_live_pack_once_and_keeps_it_shareable() {
    let data = TempDir::new("live-pack");
    std::fs::write(
        data.path().join("live_world_pack.json"),
        r#"{"world_id":"fixture","mail_artifacts":[{}],"facts":{"x":1}}"#,
    )
    .unwrap();
    let config = nori_local::Config {
        data_dir: data.path().to_path_buf(),
        ..nori_local::Config::default()
    };
    let state = nori_local::AppState::new(config);
    assert!(state.live_pack.is_available());
    assert!(state.live_pack.summary().contains("mails=1"));
    assert!(state.live_pack.summary().contains("world=fixture"));
}

fn now_secs() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64
}

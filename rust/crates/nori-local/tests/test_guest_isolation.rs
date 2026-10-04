mod support;

use reqwest::Client;
use serde_json::{json, Value};
use support::{config, start, TempDir};

const COOKIE_NAME: &str = "arcade-auth.session_token";
const TICKET_RPC: &str = "auth/wsTickets:issueWebUserWsTicket";

#[tokio::test]
async fn guest_sessions_and_tickets_are_isolated_per_browser() {
    let public = TempDir::new("guests");
    let server = start(config(public.path())).await;
    let a = Client::builder().no_gzip().no_deflate().build().unwrap();
    let b = Client::builder().no_gzip().no_deflate().build().unwrap();
    let first_a = a
        .get(format!("{}/api/auth/get-session", server.base))
        .send()
        .await
        .unwrap();
    let cookie_a_full = first_a.headers()["set-cookie"]
        .to_str()
        .unwrap()
        .to_string();
    let cookie_a = cookie_a_full.split(';').next().unwrap().to_string();
    assert_eq!(first_a.headers()["cache-control"], "private, no-store");
    assert_eq!(
        first_a.headers()["set-better-auth-cookie"],
        cookie_a_full.as_str()
    );
    let session_a = first_a.json::<Value>().await.unwrap();
    let first_b = b
        .get(format!("{}/api/auth/get-session", server.base))
        .send()
        .await
        .unwrap();
    let cookie_b_full = first_b.headers()["set-cookie"]
        .to_str()
        .unwrap()
        .to_string();
    let cookie_b = cookie_b_full.split(';').next().unwrap().to_string();
    assert_eq!(
        first_b.headers()["set-better-auth-cookie"],
        cookie_b_full.as_str()
    );
    let session_b = first_b.json::<Value>().await.unwrap();
    let user_a = session_a["user"]["id"].as_str().unwrap();
    let user_b = session_b["user"]["id"].as_str().unwrap();

    assert_ne!(user_a, user_b);
    assert!(user_a.starts_with("guest_") && user_b.starts_with("guest_"));
    for full_cookie in [&cookie_a_full, &cookie_b_full] {
        assert!(full_cookie.contains("Path=/; Max-Age=2592000; HttpOnly; SameSite=Lax"));
        assert!(!full_cookie.contains("Secure"));
    }

    let a_session = a
        .get(format!("{}/api/auth/get-session", server.base))
        .header("cookie", &cookie_a)
        .send()
        .await
        .unwrap();
    assert_eq!(a_session.headers()["cache-control"], "private, no-store");
    assert!(!a_session.headers().contains_key("set-better-auth-cookie"));
    assert_eq!(a_session.json::<Value>().await.unwrap(), session_a);
    assert_eq!(
        b.get(format!("{}/api/auth/get-session", server.base))
            .header("cookie", &cookie_b)
            .send()
            .await
            .unwrap()
            .json::<Value>()
            .await
            .unwrap(),
        session_b
    );

    let stale = format!("{COOKIE_NAME}=local-guest-token");
    let current = a
        .get(format!("{}/api/auth/get-session", server.base))
        .header("cookie", &cookie_a)
        .header("better-auth-cookie", stale)
        .send()
        .await
        .unwrap();
    assert_eq!(current.json::<Value>().await.unwrap(), session_a);

    let convex = a
        .get(format!("{}/api/auth/convex/token", server.base))
        .header("cookie", &cookie_a)
        .send()
        .await
        .unwrap();
    assert_eq!(
        convex.json::<Value>().await.unwrap()["token"],
        format!("local-convex.{user_a}")
    );
    for (client, cookie, user) in [(&a, &cookie_a, user_a), (&b, &cookie_b, user_b)] {
        let direct = client
            .post(format!("{}/api/arcade/ws-ticket", server.base))
            .header("cookie", cookie)
            .send()
            .await
            .unwrap();
        assert_eq!(direct.headers()["cache-control"], "private, no-store");
        let direct_ticket = direct.json::<Value>().await.unwrap()["ticket"]
            .as_str()
            .unwrap()
            .to_string();
        assert_eq!(
            nori_core::auth::resolve_ticket(
                &server.state.config.secret_key,
                &direct_ticket,
                now_secs()
            )
            .as_deref(),
            Some(user)
        );

        for path in [
            "/api/query",
            "/api/mutation",
            "/api/action",
            "/api/function",
            "/api/query_at_ts",
        ] {
            let response = client
                .post(format!("{}{path}", server.base))
                .header("cookie", cookie)
                .json(&json!({"path":TICKET_RPC}))
                .send()
                .await
                .unwrap();
            assert_eq!(response.headers()["cache-control"], "private, no-store");
            let body = response.json::<Value>().await.unwrap();
            let ticket = body["value"]["ticket"].as_str().unwrap();
            assert_eq!(
                nori_core::auth::resolve_ticket(
                    &server.state.config.secret_key,
                    ticket,
                    now_secs()
                )
                .as_deref(),
                Some(user)
            );
        }
    }

    let rotated = a
        .get(format!("{}/api/auth/get-session", server.base))
        .header("cookie", format!("{COOKIE_NAME}=local-guest-token"))
        .send()
        .await
        .unwrap();
    let rotated_cookie = rotated.headers()["set-cookie"]
        .to_str()
        .unwrap()
        .split(';')
        .next()
        .unwrap()
        .to_string();
    let rotated_session = rotated.json::<Value>().await.unwrap();
    assert_ne!(rotated_session["user"]["id"], user_a);
    assert_ne!(rotated_cookie, cookie_a);
}

#[tokio::test]
async fn otp_disabled_invalid_expired_reused_and_signout_contracts() {
    let public = TempDir::new("otp");
    let mut config = config(public.path());
    config.auto_guest = false;
    let server = start(config).await;
    let client = Client::builder().no_gzip().no_deflate().build().unwrap();
    let email = "security@nori.test";

    let disabled = client
        .post(format!("{}/api/auth/send-email-otp", server.base))
        .json(&json!({"email":email}))
        .send()
        .await
        .unwrap();
    assert_eq!(
        disabled.json::<Value>().await.unwrap()["code"],
        "OTP_DISABLED"
    );
    let invalid = client
        .post(format!("{}/api/auth/sign-in/email-otp", server.base))
        .json(&json!({"email":email,"otp":"123456"}))
        .send()
        .await
        .unwrap();
    assert_eq!(
        invalid.json::<Value>().await.unwrap()["code"],
        "INVALID_OTP"
    );
    assert_eq!(
        client
            .get(format!("{}/api/auth/get-session", server.base))
            .send()
            .await
            .unwrap()
            .json::<Value>()
            .await
            .unwrap(),
        Value::Null
    );
    assert_eq!(
        client
            .post(format!("{}/api/arcade/ws-ticket", server.base))
            .send()
            .await
            .unwrap()
            .status(),
        401
    );

    server.state.http_host.lock().unwrap().dev_otp = "654321".into();
    let send = |path: &'static str| client.post(format!("{}{path}", server.base));
    let sent = send("/api/auth/email-otp/send-verification-otp")
        .json(&json!({"email":email}))
        .send()
        .await
        .unwrap();
    assert_eq!(sent.json::<Value>().await.unwrap()["status"], true);
    let invalid_email = send("/api/auth/send-email-otp")
        .json(&json!({"email":"invalid"}))
        .send()
        .await
        .unwrap();
    assert_eq!(
        invalid_email.json::<Value>().await.unwrap()["code"],
        "INVALID_EMAIL"
    );

    {
        let mut host = server.state.http_host.lock().unwrap();
        host.auth.otps.get_mut(email).unwrap().1 = 0;
    }
    let expired = send("/api/auth/sign-in/email-otp")
        .json(&json!({"email":email,"otp":"654321"}))
        .send()
        .await
        .unwrap();
    assert_eq!(
        expired.json::<Value>().await.unwrap()["code"],
        "INVALID_OTP"
    );
    let _ = send("/api/auth/send-email-otp")
        .json(&json!({"email":email}))
        .send()
        .await
        .unwrap();
    let wrong = send("/api/auth/sign-in/email-otp")
        .json(&json!({"email":email,"otp":"000000"}))
        .send()
        .await
        .unwrap();
    assert_eq!(wrong.json::<Value>().await.unwrap()["code"], "INVALID_OTP");

    let login = send("/api/auth/email-otp/verify-email")
        .json(&json!({"email":email,"otp":"654321"}))
        .send()
        .await
        .unwrap();
    assert_eq!(login.status(), 200);
    let login_cookie = login.headers()["set-cookie"].to_str().unwrap().to_string();
    assert!(login_cookie.contains("Path=/; Max-Age=2592000; HttpOnly; SameSite=Lax"));
    assert!(!login_cookie.contains("Secure"));
    assert_eq!(
        login.headers()["set-better-auth-cookie"],
        login_cookie.as_str()
    );
    let login_body = login.json::<Value>().await.unwrap();
    let token = login_body["session"]["token"].as_str().unwrap().to_string();
    let user_id = login_body["user"]["id"].as_str().unwrap().to_string();
    assert!(user_id.starts_with("user_"));

    let reused = send("/api/auth/sign-in/email-otp")
        .json(&json!({"email":email,"otp":"654321"}))
        .send()
        .await
        .unwrap();
    assert_eq!(reused.json::<Value>().await.unwrap()["code"], "INVALID_OTP");
    let _ = send("/api/auth/send-email-otp")
        .json(&json!({"email":email}))
        .send()
        .await
        .unwrap();
    let second_login = send("/api/auth/sign-in/email-otp")
        .json(&json!({"email":email,"otp":"654321"}))
        .send()
        .await
        .unwrap();
    let second_body = second_login.json::<Value>().await.unwrap();
    assert_eq!(second_body["user"]["id"], user_id);

    let signout = client
        .post(format!("{}/api/auth/sign-out", server.base))
        .header("cookie", format!("{COOKIE_NAME}={token}"))
        .send()
        .await
        .unwrap();
    let clear_cookie = signout.headers()["set-cookie"]
        .to_str()
        .unwrap()
        .to_string();
    assert_eq!(signout.json::<Value>().await.unwrap()["success"], true);
    assert!(clear_cookie.starts_with(&format!("{COOKIE_NAME}=\"\"; expires=")));
    assert!(clear_cookie.contains("; Max-Age=0; Path=/; SameSite=lax"));
    assert!(!clear_cookie.contains("HttpOnly") && !clear_cookie.contains("Secure"));
    let replay = client
        .get(format!("{}/api/auth/get-session", server.base))
        .header("cookie", format!("{COOKIE_NAME}={token}"))
        .send()
        .await
        .unwrap();
    assert_eq!(replay.json::<Value>().await.unwrap(), Value::Null);
}

#[tokio::test]
async fn guest_cookie_is_issued_by_ticket_and_convex_calls_before_get_session() {
    let public = TempDir::new("guest-first-api");
    let server = start(config(public.path())).await;
    let client = Client::builder().no_gzip().no_deflate().build().unwrap();
    for path in [
        "/api/arcade/ws-ticket",
        "/api/query",
        "/api/auth/convex/token",
    ] {
        let response = if path == "/api/auth/convex/token" {
            client
                .get(format!("{}{}", server.base, path))
                .send()
                .await
                .unwrap()
        } else {
            let mut request = client.post(format!("{}{}", server.base, path));
            if path == "/api/query" {
                request = request.json(&json!({"path":TICKET_RPC}));
            }
            request.send().await.unwrap()
        };
        let cookie = response.headers()["set-cookie"]
            .to_str()
            .unwrap()
            .split(';')
            .next()
            .unwrap()
            .to_string();
        let session = client
            .get(format!("{}/api/auth/get-session", server.base))
            .header("cookie", &cookie)
            .send()
            .await
            .unwrap()
            .json::<Value>()
            .await
            .unwrap();
        let user = session["user"]["id"].as_str().unwrap();
        let body = response.json::<Value>().await.unwrap();
        if path == "/api/auth/convex/token" {
            assert_eq!(body["token"], format!("local-convex.{user}"));
        } else {
            let ticket = if path == "/api/query" {
                body["value"]["ticket"].as_str().unwrap()
            } else {
                body["ticket"].as_str().unwrap()
            };
            assert_eq!(
                nori_core::auth::resolve_ticket(
                    &server.state.config.secret_key,
                    ticket,
                    now_secs()
                )
                .as_deref(),
                Some(user)
            );
        }
    }
}

fn now_secs() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64
}

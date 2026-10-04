mod support;

use reqwest::{Client, Method};
use support::{config, start, TempDir};

#[tokio::test]
async fn rejects_foreign_null_and_mismatched_origins_before_http_handlers() {
    let public = TempDir::new("origin");
    let server = start(config(public.path())).await;
    let client = Client::builder().no_gzip().no_deflate().build().unwrap();
    let paths = [
        (Method::GET, "/api/entry-status"),
        (Method::GET, "/api/version"),
        (Method::GET, "/api/auth/get-session"),
        (Method::POST, "/api/auth/get-session"),
        (Method::POST, "/api/auth/send-email-otp"),
        (Method::POST, "/api/auth/email-otp/send-verification-otp"),
        (Method::POST, "/api/auth/sign-in/email-otp"),
        (Method::POST, "/api/auth/email-otp/verify-email"),
        (Method::POST, "/api/auth/sign-out"),
        (Method::GET, "/api/auth/convex/token"),
        (Method::POST, "/api/auth/convex/token"),
        (Method::POST, "/api/arcade/ws-ticket"),
        (Method::POST, "/api/query"),
        (Method::POST, "/api/mutation"),
        (Method::POST, "/api/action"),
        (Method::POST, "/api/function"),
        (Method::POST, "/api/query_at_ts"),
        (Method::POST, "/api/query_ts"),
    ];

    for origin in [
        "https://foreign.test",
        "null",
        "http://nori.test",
        "https://nori.test:444",
    ] {
        for (method, path) in &paths {
            let response = client
                .request(method.clone(), format!("{}{path}", server.base))
                .header("origin", origin)
                .send()
                .await
                .unwrap();
            assert_eq!(response.status(), 403, "{origin} {path}");
            assert!(!response.headers().contains_key("set-cookie"));
            assert!(!response
                .headers()
                .contains_key("access-control-allow-origin"));
            assert_eq!(
                response.json::<serde_json::Value>().await.unwrap(),
                serde_json::json!({"error":"origin_forbidden"})
            );
        }
        let response = client
            .get(format!("{}/api/auth/get-session", server.base))
            .header("origin", origin)
            .send()
            .await
            .unwrap();
        assert_eq!(response.status(), 403, "{origin} get-session");
        assert!(!response.headers().contains_key("set-cookie"));
    }

    let same_origin = server.base.clone();
    assert_eq!(
        client
            .post(format!("{}/api/arcade/ws-ticket", server.base))
            .header("origin", same_origin)
            .send()
            .await
            .unwrap()
            .status(),
        200
    );

    // Vite's HTTP proxy preserves its public Host header; compare against that,
    // not the backend listener address.
    let vite = client
        .post(format!("{}/api/arcade/ws-ticket", server.base))
        .header("host", "localhost:5173")
        .header("origin", "http://localhost:5173")
        .send()
        .await
        .unwrap();
    assert_eq!(vite.status(), 200, "{}", vite.text().await.unwrap());
}

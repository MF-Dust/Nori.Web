mod support;

use axum::routing::get;
use axum::Router;
use nori_local::{build_app, AppState};
use reqwest::Client;
use support::{config, start_app, TempDir};

#[tokio::test]
async fn specific_routes_merged_for_websockets_win_over_http_wildcards() {
    let public = TempDir::new("ws-hook");
    let state = AppState::new(config(public.path()));
    let ws_routes = Router::new()
        .route("/api/arcade/web/v1", get(|| async { "main ws route" }))
        .route(
            "/api/arcade/web/v1/media",
            get(|| async { "media ws route" }),
        );
    let server = start_app(state.clone(), build_app(state).merge(ws_routes)).await;
    let client = Client::builder().no_gzip().no_deflate().build().unwrap();

    for (path, expected) in [
        ("/api/arcade/web/v1", "main ws route"),
        ("/api/arcade/web/v1/media", "media ws route"),
    ] {
        let response = client
            .get(format!("{}{path}", server.base))
            .send()
            .await
            .unwrap();
        assert_eq!(response.status(), 200);
        assert_eq!(response.text().await.unwrap(), expected);
    }
}

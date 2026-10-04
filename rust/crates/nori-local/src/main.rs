use nori_local::{build_server, AppState, Config};
use tokio::net::TcpListener;

#[tokio::main]
async fn main() -> std::io::Result<()> {
    let config = Config::from_env();
    let host = config.host.clone();
    let port = config.port;
    let state = AppState::new(config);
    println!("NoriOS local compatibility server: http://{host}:{port}");
    println!("Arcade WebSocket: ws://{host}:{port}/api/arcade/web/v1");
    println!("{}", state.live_pack.summary());
    let listener = TcpListener::bind((host.as_str(), port)).await?;
    axum::serve(listener, build_server(state))
        .with_graceful_shutdown(async {
            let _ = tokio::signal::ctrl_c().await;
        })
        .await
}

//! NoriOS local compatibility server (replaces `server.py`).

pub mod api;
pub mod app;
pub mod config;
pub mod executor;
pub mod gzip;
pub mod origin;
pub mod registry;
pub mod static_files;
pub mod ws;

pub use app::{build_app, AppState};
pub use config::Config;

use std::sync::Arc;

/// The complete local server: HTTP API, static files and Arcade WebSockets.
pub fn build_server(state: AppState) -> axum::Router {
    let lookup = |key: &str| std::env::var(key).ok();
    let ctx = Arc::new(ws::WsContext {
        registry: Arc::new(registry::Registry::new(state.live_pack.clone())),
        executor: executor::Executor::new(nori_core::config::ServerAi::from_env(&lookup)),
        secret: state.config.secret_key.clone(),
    });
    build_app(state).merge(ws::routes(ctx))
}

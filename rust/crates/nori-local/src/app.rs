use crate::{api, config::Config, gzip, origin, static_files};
use axum::routing::any;
use axum::Router;
use nori_core::{http::HttpHost, live_pack::LivePack};
use serde_json::Value;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};

#[derive(Clone)]
pub struct AppState {
    pub config: Arc<Config>,
    pub http_host: Arc<Mutex<HttpHost>>,
    pub live_pack: Arc<LivePack>,
    pub public_dir: PathBuf,
    pub data_dir: PathBuf,
}

impl AppState {
    pub fn from_env() -> Self {
        Self::new(Config::from_env())
    }

    pub fn new(config: Config) -> Self {
        let live_pack = load_live_pack(&config);
        let http_host = HttpHost {
            secret: config.secret_key.clone(),
            machine_id: config.machine_id.clone(),
            auto_guest: config.auto_guest,
            dev_otp: config.dev_otp.clone(),
            ..HttpHost::default()
        };
        Self {
            public_dir: config.public_dir.clone(),
            data_dir: config.data_dir.clone(),
            config: Arc::new(config),
            http_host: Arc::new(Mutex::new(http_host)),
            live_pack: Arc::new(live_pack),
        }
    }
}

pub fn build_app(state: AppState) -> Router {
    Router::new()
        // Keep API handling a wildcard: exact WebSocket routes merged by the
        // server take precedence over it and over the static catch-all.
        .route("/api/{*path}", any(api::handle))
        // WebSocket module hook: merge ws::routes(...) separately; do not add
        // HTTP/static handlers for /api/arcade/web/v1 or /media here.
        .route("/", any(static_files::handle))
        .route("/{*path}", any(static_files::handle))
        .with_state(state.clone())
        .layer(gzip::compression_layer())
        .layer(axum::middleware::from_fn(gzip::restore_static_headers))
        .layer(axum::middleware::from_fn_with_state(
            state,
            origin::same_origin_guard,
        ))
}

fn load_live_pack(config: &Config) -> LivePack {
    if config.disable_live_pack {
        return LivePack::empty();
    }

    let path = config.data_dir.join("live_world_pack.json");
    match std::fs::read(&path) {
        Ok(bytes) => match serde_json::from_slice::<Value>(&bytes) {
            Ok(value) if value.is_object() => LivePack::from_value(value),
            Ok(_) => {
                eprintln!(
                    "[live_pack] invalid pack {}: root must be an object",
                    path.display()
                );
                LivePack::empty()
            }
            Err(error) => {
                eprintln!("[live_pack] failed to load {}: {error}", path.display());
                LivePack::empty()
            }
        },
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
            eprintln!(
                "[live_pack] missing {}; continuing with empty pack",
                path.display()
            );
            LivePack::empty()
        }
        Err(error) => {
            eprintln!("[live_pack] failed to load {}: {error}", path.display());
            LivePack::empty()
        }
    }
}

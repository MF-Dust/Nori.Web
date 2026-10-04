use axum::serve;
use nori_local::{build_app, AppState, Config};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};
use tokio::net::TcpListener;
use tokio::task::JoinHandle;

static NEXT_DIR: AtomicU64 = AtomicU64::new(0);

pub struct TestServer {
    pub base: String,
    #[allow(dead_code)]
    pub state: AppState,
    task: JoinHandle<()>,
}

impl Drop for TestServer {
    fn drop(&mut self) {
        self.task.abort();
    }
}

#[allow(dead_code)]
pub async fn start(mut config: Config) -> TestServer {
    config.disable_live_pack = true;
    let state = AppState::new(config);
    let app = build_app(state.clone());
    start_app(state, app).await
}

pub async fn start_app(state: AppState, app: axum::Router) -> TestServer {
    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let address = listener.local_addr().unwrap();
    let task = tokio::spawn(async move {
        serve(listener, app).await.unwrap();
    });
    TestServer {
        base: format!("http://{address}"),
        state,
        task,
    }
}

pub fn config(public_dir: &Path) -> Config {
    Config {
        public_dir: public_dir.to_path_buf(),
        auto_guest: true,
        dev_otp: String::new(),
        ..Config::default()
    }
}

pub struct TempDir(pub PathBuf);

impl TempDir {
    pub fn new(label: &str) -> Self {
        let path = std::env::temp_dir().join(format!(
            "nori-local-{label}-{}-{}",
            std::process::id(),
            NEXT_DIR.fetch_add(1, Ordering::Relaxed)
        ));
        std::fs::create_dir_all(&path).unwrap();
        Self(path)
    }

    pub fn path(&self) -> &Path {
        &self.0
    }
}

impl Drop for TempDir {
    fn drop(&mut self) {
        let _ = std::fs::remove_dir_all(&self.0);
    }
}

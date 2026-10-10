use nori_core::{config::ServerAi, http::HttpRequest, provider};
use serde_json::Value;

pub type Result<T> = std::result::Result<T, String>;

pub trait Bindings {
    fn value(&self, name: &str) -> Option<String>;
    fn process_env(&self, _name: &str) -> Option<String> {
        None
    }
}

pub trait Clock {
    fn now_ms(&self) -> i64;
}

pub trait Log {
    fn log(&self, message: &str);
}

pub trait Storage {
    async fn get(&self, key: &str) -> Result<Option<String>>;
    async fn put(&self, key: &str, value: &str) -> Result<()>;
    async fn set_alarm(&self, at_ms: i64) -> Result<()>;
}

pub trait Sockets {
    type Socket: Clone + PartialEq;
    fn list(&self) -> Vec<Self::Socket>;
    fn attachment(&self, socket: &Self::Socket) -> Option<Value>;
    /// `json` is serialized as a JSON STRING, not a JavaScript object.
    fn set_attachment(&self, socket: &Self::Socket, json: &str) -> Result<()>;
    fn send_text(&self, socket: &Self::Socket, text: &str) -> Result<()>;
    fn send_binary(&self, socket: &Self::Socket, bytes: &[u8]) -> Result<()>;
    fn close(&self, socket: &Self::Socket, code: u16, reason: &str) -> Result<()>;
}

pub trait ObjectStore {
    async fn get_bytes(&self, key: &str) -> Result<Option<Vec<u8>>>;
}

pub struct AssetObject<B> {
    pub body: Option<B>,
    pub size: u64,
    pub http_etag: Option<String>,
}

/// Separate from JSON archive reads so the GLB can pass through as a stream.
pub trait ModelStore {
    type Body;
    async fn model(&self, key: &str, head: bool) -> Result<Option<AssetObject<Self::Body>>>;
}

pub trait Fetch {
    /// Whole-request timeout, bounded decoded body, no automatic redirects.
    async fn fetch(&self, request: provider::HttpRequest) -> provider::HttpResult;
}

pub trait Sleep {
    async fn sleep(&self, ms: u64);
}

#[derive(Clone, Debug)]
pub struct Request {
    pub url: String,
    pub http: HttpRequest,
}

impl Request {
    pub fn header(&self, name: &str) -> Option<&str> {
        nori_core::auth::header(&self.http.headers, name)
    }
}

pub struct RuntimeConfig {
    pub secret: String,
    pub auto_guest: bool,
    pub dev_otp: String,
    pub disable_live_pack: bool,
    pub ai: ServerAi,
}

impl RuntimeConfig {
    pub fn read(env: &impl Bindings) -> Result<Self> {
        // Blank bindings must fail, even if a process environment fallback exists.
        let secret = env
            .value("SECRET_KEY")
            .or_else(|| env.process_env("SECRET_KEY"))
            .unwrap_or_default();
        if secret.trim().is_empty() {
            return Err(
                "Cloudflare requires a nonblank SECRET_KEY binding or environment variable".into(),
            );
        }
        let auto_guest = !matches!(
            env.value("NORI_AUTO_GUEST")
                .unwrap_or_else(|| "true".into())
                .trim()
                .to_ascii_lowercase()
                .as_str(),
            "0" | "false" | "no"
        );
        Ok(Self {
            secret,
            auto_guest,
            dev_otp: env.value("NORI_DEV_OTP").unwrap_or_default().trim().into(),
            disable_live_pack: nori_core::config::env_flag(
                env.value("NORI_DISABLE_LIVE_PACK").as_deref(),
            ),
            ai: ServerAi::from_env(&|name| env.value(name)),
        })
    }
}

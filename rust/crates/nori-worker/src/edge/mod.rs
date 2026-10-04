//! Cloudflare behavior without Cloudflare types. No I/O or entropy at startup.
#![allow(async_fn_in_trait)]

pub mod attachment;
pub mod host;
pub mod live_pack_loader;
pub mod provider_io;
pub mod router;
pub mod session_object;

use futures_util::lock::Mutex;
use live_pack_loader::LivePackLoader;
use nori_core::{http::HttpHost, live_pack::LivePack};
use std::{cell::RefCell, sync::Arc};

#[derive(Default)]
pub struct Isolate {
    pub http: RefCell<HttpHost>,
    pub pack: Arc<LivePack>,
    pub loader: Mutex<LivePackLoader>,
}

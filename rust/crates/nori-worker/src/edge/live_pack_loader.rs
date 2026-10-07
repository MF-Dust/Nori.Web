use super::host::{Clock, Log, ObjectStore};
use futures_util::lock::{Mutex, OwnedMutexGuard};
use nori_core::{
    http::required_sections,
    live_pack::{canonical_lookup, lookup_variants, LivePack},
};
use serde_json::{json, Value};
use std::{
    cell::{Cell, OnceCell, RefCell},
    collections::{BTreeSet, HashMap},
    sync::Arc,
};

pub const CORE_KEY: &str = "runtime/live/core.json";
pub const INDEX_KEY: &str = "runtime/live/browser-index.json";
/// Parsed browser shards kept besides the one resident in the pack. Shards are
/// ~0.5 MB of JSON each, so the cache stays at a few MB.
pub const SHARD_CACHE: usize = 8;

/// The isolate is single-threaded: `RefCell` borrows never span an `.await`, and
/// only a per-key gate (`read_lock`) is held while R2 is read and parsed.
#[derive(Default)]
pub struct LivePackLoader {
    retry_at: Cell<i64>,
    unavailable_logged: Cell<bool>,
    index: OnceCell<HashMap<String, String>>,
    /// Shard currently installed in the shared pack.
    loaded_shard: RefCell<Option<String>>,
    /// Parsed shards, least recently used first.
    shards: RefCell<Vec<(String, Value)>>,
    /// One gate per R2 key: core, index, four sections and the index's shards.
    gates: RefCell<HashMap<String, Arc<Mutex<()>>>>,
}

impl LivePackLoader {
    /// Held while one caller reads `key`: concurrent callers wait, then find
    /// the result installed instead of reading it again.
    async fn read_lock(&self, key: &str) -> OwnedMutexGuard<()> {
        let gate = self
            .gates
            .borrow_mut()
            .entry(key.into())
            .or_default()
            .clone();
        gate.lock_owned().await
    }

    async fn json(host: &(impl ObjectStore + Log), key: &str) -> Option<Value> {
        match host.get_bytes(key).await {
            Ok(Some(bytes)) => serde_json::from_slice(&bytes).ok(),
            Ok(None) => None,
            Err(error) => {
                host.log(&format!("[live_pack] failed R2 read {key}: {error}"));
                None
            }
        }
    }

    pub async fn core(
        &self,
        host: &(impl ObjectStore + Clock + Log),
        pack: &LivePack,
        disabled: bool,
    ) -> bool {
        if disabled {
            return false;
        }
        if pack.is_available() {
            return true;
        }
        let _read = self.read_lock(CORE_KEY).await;
        if pack.is_available() {
            return true;
        }
        let now = host.now_ms();
        if now < self.retry_at.get() {
            return false;
        }
        if let Some(data) = Self::json(host, CORE_KEY).await.filter(Value::is_object) {
            if pack.install_core(data) {
                self.retry_at.set(0);
                host.log(&format!(
                    "[live_pack] core loaded from R2: {}",
                    pack.summary()
                ));
                return true;
            }
        }
        self.retry_at.set(now + 60_000);
        self.unavailable(host);
        false
    }

    pub fn unavailable(&self, host: &impl Log) {
        if !self.unavailable_logged.replace(true) {
            host.log("[arcade] live-world archive unavailable; continuing with mock data (upload runtime/live/core.json)");
        }
    }

    pub async fn section(
        &self,
        host: &(impl ObjectStore + Log),
        pack: &LivePack,
        section: &str,
    ) -> bool {
        if pack.section_loaded(section) {
            return true;
        }
        if !matches!(
            section,
            "mail_artifacts"
                | "file_artifacts"
                | "signal_thread_artifacts"
                | "signal_message_artifacts"
        ) {
            return false;
        }
        let key = format!("runtime/live/{section}.json");
        let _read = self.read_lock(&key).await;
        if pack.section_loaded(section) {
            return true;
        }
        match Self::json(host, &key).await.filter(Value::is_array) {
            Some(data) => pack.install_section(section, data),
            None => {
                host.log(&format!("[live_pack] R2 section missing/invalid: {key}"));
                false
            }
        }
    }

    async fn browser_index(&self, host: &(impl ObjectStore + Log)) -> &HashMap<String, String> {
        if let Some(index) = self.index.get() {
            return index;
        }
        let _read = self.read_lock(INDEX_KEY).await;
        if let Some(index) = self.index.get() {
            return index;
        }
        let data = Self::json(host, INDEX_KEY).await;
        self.index.get_or_init(|| {
            match data
                .as_ref()
                .and_then(|d| d.get("entries"))
                .and_then(Value::as_object)
            {
                Some(entries) => entries
                    .iter()
                    .filter_map(|(key, value)| match value {
                        Value::String(value) => Some((key.clone(), value.clone())),
                        Value::Number(value) if value.is_i64() || value.is_u64() => {
                            Some((key.clone(), value.to_string()))
                        }
                        // Python bool is an int as well.
                        Value::Bool(value) => {
                            Some((key.clone(), if *value { "True" } else { "False" }.into()))
                        }
                        _ => None,
                    })
                    .collect(),
                None => {
                    host.log("[live_pack] browser index missing/invalid: runtime/live/browser-index.json");
                    HashMap::new()
                }
            }
        })
    }

    /// Copy of a cached shard, now the most recently used.
    fn cached_shard(&self, shard: &str) -> Option<Value> {
        let mut shards = self.shards.borrow_mut();
        let at = shards.iter().position(|(name, _)| name == shard)?;
        shards[at..].rotate_left(1);
        shards.last().map(|(_, data)| data.clone())
    }

    /// Parsed shard to install: from the LRU, else one R2 read shared by
    /// concurrent callers.
    async fn shard(&self, host: &(impl ObjectStore + Log), shard: &str) -> Option<Value> {
        if let Some(data) = self.cached_shard(shard) {
            return Some(data);
        }
        let key = format!("runtime/live/browser/{shard}.json");
        let _read = self.read_lock(&key).await;
        if let Some(data) = self.cached_shard(shard) {
            return Some(data);
        }
        let Some(data) = Self::json(host, &key).await.filter(Value::is_array) else {
            host.log(&format!("[live_pack] browser shard missing/invalid: {key}"));
            return None;
        };
        let mut shards = self.shards.borrow_mut();
        if shards.len() >= SHARD_CACHE {
            shards.remove(0);
        }
        shards.push((shard.into(), data.clone()));
        Some(data)
    }

    pub async fn browser(
        &self,
        host: &(impl ObjectStore + Log),
        pack: &LivePack,
        lookup: &str,
        contains: bool,
    ) -> bool {
        let shard = lookup_browser_shard(self.browser_index(host).await, lookup, contains);
        let Some(shard) = shard else {
            pack.replace_browser_pages(json!([]));
            *self.loaded_shard.borrow_mut() = None;
            return false;
        };
        if self.loaded_shard.borrow().as_deref() == Some(&shard)
            && pack.section_loaded("browser_pages")
        {
            return true;
        }
        let Some(data) = self.shard(host, &shard).await else {
            return false;
        };
        pack.replace_browser_pages(data);
        *self.loaded_shard.borrow_mut() = Some(shard);
        true
    }

    pub async fn prefetch(
        &self,
        host: &(impl ObjectStore + Log),
        pack: &LivePack,
        message: &Value,
    ) {
        let payload = message
            .get("payload")
            .filter(|p| p.is_object())
            .cloned()
            .unwrap_or(json!({}));
        let channel = message.get("channel").and_then(Value::as_str).unwrap_or("");
        // Python-exact mapping (plus sections later handlers read) lives in core.
        let sections = required_sections(message);
        for section in sections {
            self.section(host, pack, section).await;
        }
        if message.get("type").and_then(Value::as_str) != Some("event") {
            return;
        }
        match channel {
            "manifold.artifacts.fetch"
                if payload.get("artifactType").and_then(Value::as_str) == Some("browser_page") =>
            {
                if let Some(lookup) = payload
                    .get("lookup_key")
                    .and_then(Value::as_str)
                    .filter(|s| !s.is_empty())
                {
                    self.browser(host, pack, lookup, false).await;
                }
            }
            "manifold.bounty.submit" => {
                if let Some(url) = payload
                    .get("url")
                    .and_then(Value::as_str)
                    .filter(|s| !s.is_empty())
                {
                    self.browser(host, pack, url, true).await;
                }
            }
            _ => {}
        }
    }
}

pub fn lookup_browser_shard(
    index: &HashMap<String, String>,
    lookup: &str,
    contains: bool,
) -> Option<String> {
    for variant in lookup_variants(lookup) {
        if let Some(shard) = index.get(&variant) {
            return Some(shard.clone());
        }
    }
    let canonical = canonical_lookup(lookup);
    let base = canonical.split('?').next().unwrap_or("");
    let queryless: BTreeSet<_> = index
        .iter()
        .filter(|(key, _)| !key.contains('?') && key.split('?').next() == Some(base))
        .map(|(_, shard)| shard.clone())
        .collect();
    if queryless.len() == 1 {
        return queryless.into_iter().next();
    }
    if contains && !canonical.is_empty() {
        let matches: BTreeSet<_> = index
            .iter()
            .filter(|(key, _)| canonical.contains(key.as_str()) || key.contains(&canonical))
            .map(|(_, shard)| shard.clone())
            .collect();
        if matches.len() == 1 {
            return matches.into_iter().next();
        }
    }
    None
}

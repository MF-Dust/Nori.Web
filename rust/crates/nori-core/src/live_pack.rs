//! Optional live-world archive (`backend/data/live_world_pack.json`).
//!
//! Hosts own the I/O: the local binary installs the whole decoded file, the
//! edge installs the lightweight core first and attaches heavy sections from R2
//! on demand. The core only stores decoded JSON and answers lookups.
//!
//! Unlike the Python module global, one `LivePack` is shared explicitly
//! (`Arc<LivePack>`) by every world of a process or isolate.

use serde_json::{Map, Value};
use std::collections::{BTreeSet, HashMap};
use std::fmt;
use std::sync::{RwLock, RwLockReadGuard, RwLockWriteGuard};

pub const SECTION_KEYS: [&str; 5] = [
    "mail_artifacts",
    "file_artifacts",
    "signal_thread_artifacts",
    "signal_message_artifacts",
    "browser_pages",
];

#[derive(Default)]
pub struct LivePack {
    inner: RwLock<Inner>,
}

#[derive(Default)]
struct Inner {
    data: Option<Map<String, Value>>,
    /// URL variant -> index into `browser_pages`; rebuilt lazily.
    page_index: Option<HashMap<String, usize>>,
}

impl fmt::Debug for LivePack {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(&self.summary())
    }
}

impl LivePack {
    /// An archive that is not installed (`is_available() == false`).
    pub fn empty() -> Self {
        Self::default()
    }

    /// A complete, already decoded archive (local mode).
    pub fn from_value(data: Value) -> Self {
        let pack = Self::empty();
        pack.install_pack(data);
        pack
    }

    fn read(&self) -> RwLockReadGuard<'_, Inner> {
        self.inner.read().unwrap_or_else(|e| e.into_inner())
    }

    fn write(&self) -> RwLockWriteGuard<'_, Inner> {
        self.inner.write().unwrap_or_else(|e| e.into_inner())
    }

    /// Install a complete already-decoded archive.
    pub fn install_pack(&self, data: Value) -> bool {
        let Value::Object(map) = data else {
            return false;
        };
        let mut inner = self.write();
        inner.data = Some(map);
        inner.page_index = None;
        true
    }

    /// Install the archive core while keeping heavy sections lazy.
    pub fn install_core(&self, data: Value) -> bool {
        let Value::Object(mut map) = data else {
            return false;
        };
        for key in SECTION_KEYS {
            map.remove(key);
        }
        let mut inner = self.write();
        inner.data = Some(map);
        inner.page_index = None;
        true
    }

    /// Install one artifact section fetched from R2.
    pub fn install_section(&self, key: &str, value: Value) -> bool {
        if !SECTION_KEYS.contains(&key) || !value.is_array() {
            return false;
        }
        let mut inner = self.write();
        inner.data.get_or_insert_with(Map::new).insert(key.to_string(), value);
        if key == "browser_pages" {
            inner.page_index = None;
        }
        true
    }

    /// Replace the resident browser shard, bounding browser replay memory.
    pub fn replace_browser_pages(&self, pages: Value) -> bool {
        self.install_section("browser_pages", pages)
    }

    /// Drop the archive (Python `set_disabled(True)`).
    pub fn clear(&self) {
        let mut inner = self.write();
        inner.data = None;
        inner.page_index = None;
    }

    pub fn section_loaded(&self, key: &str) -> bool {
        self.read().data.as_ref().is_some_and(|data| data.contains_key(key))
    }

    /// Whether at least the archive core is resident.
    pub fn is_available(&self) -> bool {
        self.read().data.is_some()
    }

    pub fn summary(&self) -> String {
        let inner = self.read();
        let Some(p) = inner.data.as_ref() else {
            return "live pack: not installed".into();
        };
        let count = |key: &str| match p.get(key) {
            Some(Value::Array(items)) => items.len().to_string(),
            _ => "lazy".into(),
        };
        let fact_count = p.get("facts").and_then(Value::as_object).map(Map::len).unwrap_or(0);
        format!(
            "live pack: mails={} files={} threads={} messages={} pages={} facts={} world={}",
            count("mail_artifacts"),
            count("file_artifacts"),
            count("signal_thread_artifacts"),
            count("signal_message_artifacts"),
            count("browser_pages"),
            fact_count,
            p.get("world_id").and_then(Value::as_str).unwrap_or(""),
        )
    }

    pub fn world_id(&self) -> Option<String> {
        self.read().data.as_ref()?.get("world_id")?.as_str().map(str::to_string)
    }

    /// Read-only view of a resident section without copying it.
    pub fn with_section<R>(&self, key: &str, f: impl FnOnce(&[Value]) -> R) -> R {
        let inner = self.read();
        let items = inner
            .data
            .as_ref()
            .and_then(|data| data.get(key))
            .and_then(Value::as_array)
            .map(Vec::as_slice)
            .unwrap_or(&[]);
        f(items)
    }

    /// Owned copy of a section (Python `_list`).
    pub fn section(&self, key: &str) -> Vec<Value> {
        self.with_section(key, <[Value]>::to_vec)
    }

    pub fn mail_artifacts(&self) -> Vec<Value> {
        self.section("mail_artifacts")
    }

    pub fn file_artifacts(&self) -> Vec<Value> {
        self.section("file_artifacts")
    }

    pub fn signal_thread_artifacts(&self) -> Vec<Value> {
        self.section("signal_thread_artifacts")
    }

    pub fn signal_message_artifacts(&self) -> Vec<Value> {
        self.section("signal_message_artifacts")
    }

    /// Find an archived browser page in the resident local/R2 shard.
    pub fn page(&self, lookup_key: &str) -> Option<Value> {
        if lookup_key.is_empty() {
            return None;
        }
        let mut inner = self.write();
        if inner.page_index.is_none() {
            let index = build_page_index(inner.data.as_ref());
            inner.page_index = Some(index);
        }
        let index = inner.page_index.as_ref()?;
        let canon = canonical_lookup(lookup_key);
        // Python also accepts the queryless form when exactly one page owns it;
        // index keys are unique, so that is a plain second lookup.
        let base = canon.split('?').next().unwrap_or("");
        let position = index.get(&canon).or_else(|| index.get(base)).copied()?;
        inner
            .data
            .as_ref()?
            .get("browser_pages")?
            .as_array()?
            .get(position)
            .cloned()
    }

    pub fn facts(&self) -> Map<String, Value> {
        self.core_object("facts")
    }

    pub fn variables(&self) -> Map<String, Value> {
        self.core_object("variables")
    }

    pub fn chip_status(&self) -> Option<Value> {
        let inner = self.read();
        inner.data.as_ref()?.get("chip_status").filter(|v| v.is_object()).cloned()
    }

    fn core_object(&self, key: &str) -> Map<String, Value> {
        self.read()
            .data
            .as_ref()
            .and_then(|data| data.get(key))
            .and_then(Value::as_object)
            .cloned()
            .unwrap_or_default()
    }
}

fn alias_text(value: &Value) -> Option<String> {
    match value {
        Value::String(text) if !text.is_empty() => Some(text.clone()),
        Value::Number(n) if n.as_f64() != Some(0.0) => Some(n.to_string()),
        _ => None,
    }
}

fn build_page_index(data: Option<&Map<String, Value>>) -> HashMap<String, usize> {
    let mut index = HashMap::new();
    let Some(pages) = data.and_then(|d| d.get("browser_pages")).and_then(Value::as_array) else {
        return index;
    };
    for (position, entry) in pages.iter().enumerate() {
        let mut aliases = Vec::new();
        aliases.extend(entry.get("key").and_then(alias_text));
        aliases.extend(entry.pointer("/data/url").and_then(alias_text));
        if let Some(list) = entry.get("aliases").and_then(Value::as_array) {
            aliases.extend(list.iter().filter_map(alias_text));
        }
        for alias in aliases {
            for variant in lookup_variants(&alias) {
                index.entry(variant).or_insert(position);
            }
        }
    }
    index
}

/// Python `urllib.parse.urlsplit` subset needed for canonicalization.
struct Split<'a> {
    scheme: String,
    netloc: &'a str,
    path: &'a str,
    query: &'a str,
}

fn urlsplit(url: &str) -> Option<Split<'_>> {
    let mut rest = url;
    let mut scheme = String::new();
    if let Some(colon) = rest.find(':') {
        let candidate = &rest[..colon];
        let valid = colon > 0
            && candidate.as_bytes()[0].is_ascii_alphabetic()
            && candidate.bytes().all(|b| b.is_ascii_alphanumeric() || matches!(b, b'+' | b'-' | b'.'));
        if valid {
            scheme = candidate.to_ascii_lowercase();
            rest = &rest[colon + 1..];
        }
    }
    let mut netloc = "";
    if let Some(after) = rest.strip_prefix("//") {
        let end = after.find(['/', '?', '#']).unwrap_or(after.len());
        netloc = &after[..end];
        rest = &after[end..];
        // Mirrors Python's ValueError on unbalanced IPv6 brackets.
        if netloc.contains('[') != netloc.contains(']') {
            return None;
        }
    }
    if let Some(hash) = rest.find('#') {
        rest = &rest[..hash];
    }
    let (path, query) = match rest.split_once('?') {
        Some((path, query)) => (path, query),
        None => (rest, ""),
    };
    Some(Split { scheme, netloc, path, query })
}

fn collapse_slashes(text: &str) -> String {
    let mut out = String::with_capacity(text.len());
    let mut previous_slash = false;
    for ch in text.chars() {
        if ch == '/' {
            if !previous_slash {
                out.push(ch);
            }
            previous_slash = true;
        } else {
            out.push(ch);
            previous_slash = false;
        }
    }
    out
}

/// Scheme/query-preserving canonicalization used by local and R2 indexes.
pub fn canonical_lookup(url: &str) -> String {
    let raw = url.trim();
    let cleaned: String = raw.chars().filter(|c| !matches!(c, '\t' | '\r' | '\n')).collect();
    let Some(parts) = urlsplit(&cleaned) else {
        return raw.to_lowercase();
    };
    if parts.netloc.is_empty() {
        return collapse_slashes(raw).to_lowercase();
    }
    let path = collapse_slashes(parts.path);
    let query = if parts.query.is_empty() { String::new() } else { format!("?{}", parts.query) };
    format!("{}://{}{}{}", parts.scheme, parts.netloc.to_lowercase(), path, query)
}

/// The forgiving URL variants used by the archived browser.
pub fn lookup_variants(url: &str) -> BTreeSet<String> {
    let c = canonical_lookup(url);
    let trimmed = c.trim_end_matches('/').to_string();
    let mut variants = BTreeSet::from([c.clone(), trimmed.clone(), format!("{trimmed}/")]);
    if let Some((_, rest)) = c.split_once("://") {
        let swapped = if c.starts_with("http://") { format!("https://{rest}") } else { format!("http://{rest}") };
        let swapped_trimmed = swapped.trim_end_matches('/').to_string();
        variants.extend([swapped, swapped_trimmed.clone(), format!("{swapped_trimmed}/")]);
    }
    variants.retain(|item| !item.is_empty());
    variants
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn canonicalizes_like_python_urlsplit() {
        assert_eq!(canonical_lookup(" HTTPS://Example.COM//a//b?q=1#frag "), "https://example.com/a/b?q=1");
        assert_eq!(canonical_lookup("Example.com//Foo"), "example.com/foo");
        assert_eq!(canonical_lookup("http://[::1"), "http://[::1");
    }

    #[test]
    fn variants_cover_scheme_and_trailing_slash() {
        let variants = lookup_variants("http://a.test/x/");
        for expected in ["http://a.test/x", "http://a.test/x/", "https://a.test/x", "https://a.test/x/"] {
            assert!(variants.contains(expected), "{expected}");
        }
    }

    #[test]
    fn sections_install_lazily_and_pages_resolve() {
        let pack = LivePack::empty();
        assert!(!pack.is_available());
        assert!(pack.install_core(json!({"world_id": "w", "facts": {"a": 1}, "mail_artifacts": [1]})));
        assert!(pack.is_available());
        assert!(!pack.section_loaded("mail_artifacts"));
        assert!(pack.summary().contains("mails=lazy"));
        assert!(!pack.install_section("unknown", json!([])));
        assert!(pack.replace_browser_pages(json!([
            {"key": "https://Doodle.test/search?q=1", "data": {"url": "https://doodle.test/"}, "aliases": ["doodle.test/alias"]}
        ])));
        assert!(pack.page("http://doodle.test").is_some());
        assert!(pack.page("https://doodle.test/search?q=1").is_some());
        assert!(pack.page("https://doodle.test/?q=other").is_some());
        assert!(pack.page("https://missing.test").is_none());
        assert_eq!(pack.facts()["a"], json!(1));
        pack.clear();
        assert!(!pack.is_available());
    }
}

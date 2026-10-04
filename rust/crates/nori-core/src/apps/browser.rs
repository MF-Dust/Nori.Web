use crate::{live_pack::LivePack, Json};
use serde_json::Map;

const DOODLE_HTML: &str = r###"<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: sans-serif; background: #0f172a; color: #f8fafc; text-align: center; padding: 50px 20px; }
        h1 { color: #38bdf8; font-size: 32px; }
        input { width: 80%; max-width: 500px; padding: 12px 18px; border-radius: 24px; border: 1px solid #334155; background: #1e293b; color: #fff; font-size: 16px; outline: none; }
        .results { margin-top: 40px; text-align: left; max-width: 600px; margin-left: auto; margin-right: auto; }
        .card { background: #1e293b; padding: 16px; border-radius: 8px; margin-bottom: 12px; border: 1px solid #334155; }
        .card a { color: #38bdf8; text-decoration: none; font-weight: bold; }
    </style>
</head>
<body>
    <h1>Doodle Search</h1>
    <p>Fictional Internet Gateway · NoriOS Network</p>
    <input type="text" placeholder="Search the simulated net..." value="NoriOS architecture">
    <div class="results">
        <div class="card">
            <a href="https://meridianpost.com/">The Meridian Post: NoriOS Next-Gen Node Launch</a>
            <p style="color:#94a3b8; font-size:14px;">Autonomous AI companion and world engine successfully deployed in production.</p>
        </div>
        <div class="card">
            <a href="https://pulse.social/">Pulse Social Feed</a>
            <p style="color:#94a3b8; font-size:14px;">Latest network chatter, developer updates and community signals.</p>
        </div>
    </div>
</body>
</html>"###;

const MERIDIAN_HTML: &str = r###"<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: serif; background: #fafaf9; color: #1c1917; padding: 30px; line-height: 1.6; }
        h1 { border-bottom: 2px solid #1c1917; padding-bottom: 10px; }
        .meta { color: #78716c; font-size: 14px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <h1>The Meridian Post</h1>
    <div class="meta">Special Edition · 2026</div>
    <h2>NoriOS: The Convergence of Live Virtual Companions and Realtime Runtimes</h2>
    <p>In a breakthrough development, NoriOS has seamlessly integrated Live2D emotional state tracking, WebSocket-based world presence, and local cognitive models into a unified desktop interface.</p>
</body>
</html>"###;

const PULSE_HTML: &str = r###"<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: sans-serif; background: #09090b; color: #fafafa; padding: 20px; }
        .post { background: #18181b; padding: 14px; border-radius: 8px; margin-bottom: 12px; border: 1px solid #27272a; }
        .author { font-weight: bold; color: #a1a1aa; margin-bottom: 4px; }
    </style>
</head>
<body>
    <h2>Pulse Network</h2>
    <div class="post">
        <div class="author">@nori_core</div>
        <div>System status: optimal. Memory link: synchronized. Happy exploring! ✨</div>
    </div>
    <div class="post">
        <div class="author">@operator</div>
        <div>Connected to NoriOS node. Ready for party games and chat.</div>
    </div>
</body>
</html>"###;

/// Resolve an archived page, else the simulated-net fallback.
pub fn page(pack: &LivePack, url: &str) -> Json {
    if pack.is_available() {
        if let Some(entry) = pack.page(url) {
            let mut data = entry
                .get("data")
                .and_then(Json::as_object)
                .cloned()
                .map(Json::Object)
                .unwrap_or_else(|| Json::Object(Map::new()));
            let object = data.as_object_mut().expect("page data is an object");
            object
                .entry("url")
                .or_insert_with(|| Json::String(url.into()));
            object
                .entry("supported_locales")
                .or_insert_with(|| serde_json::json!(["zh-CN"]));
            object
                .entry("title")
                .or_insert_with(|| Json::String(url.into()));
            object
                .entry("body_html")
                .or_insert_with(|| Json::String(String::new()));
            object
                .entry("allowed_commands")
                .or_insert_with(|| serde_json::json!([]));
            return data;
        }
    }

    let clean = format!(
        "{}/",
        url.split('?').next().unwrap_or("").trim_end_matches('/')
    );
    let (title, html) = mock_site(&clean).unwrap_or_else(|| ("Simulated Net Page", String::new()));
    let html = if html.is_empty() {
        format!(
            "<html><body style='font-family:sans-serif;background:#111;color:#eee;padding:40px;text-align:center;'><h2>Page: {url}</h2><p>Simulated web page hosted inside NoriOS network.</p></body></html>"
        )
    } else {
        html
    };

    let mut output = Map::new();
    output.insert("title".into(), Json::String(title.into()));
    output.insert("html".into(), Json::String(html.clone()));
    output.insert("url".into(), Json::String(url.into()));
    output.insert("supported_locales".into(), serde_json::json!(["zh-CN"]));
    output.insert("body_html".into(), Json::String(html));
    output.insert("allowed_commands".into(), serde_json::json!([]));
    Json::Object(output)
}

fn mock_site(clean_url: &str) -> Option<(&'static str, String)> {
    let normalized = clean_url.trim_end_matches('/');
    let site = match normalized {
        "https://doodle.search" => ("Doodle Search", DOODLE_HTML),
        "https://meridianpost.com" => ("The Meridian Post", MERIDIAN_HTML),
        "https://pulse.social" => ("Pulse Social", PULSE_HTML),
        _ => return None,
    };
    Some((site.0, site.1.into()))
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn real_pack() -> LivePack {
        LivePack::from_value(
            serde_json::from_str(
                &std::fs::read_to_string(concat!(
                    env!("CARGO_MANIFEST_DIR"),
                    "/../../../backend/data/live_world_pack.json"
                ))
                .unwrap(),
            )
            .unwrap(),
        )
    }

    fn assert_page_contract(page: &Json, url: &str) {
        assert_eq!(page["url"], url);
        assert!(page["supported_locales"].is_array());
        assert!(!page["supported_locales"].as_array().unwrap().is_empty());
        assert!(page["title"].is_string());
        assert!(page["body_html"].is_string());
        assert!(page["allowed_commands"].is_array());
    }

    #[test]
    fn apps_browser_demo_and_unknown_pages_obey_contract() {
        let pack = LivePack::empty();
        let doodle_url = "https://doodle.search/";
        let doodle = page(&pack, doodle_url);
        assert_page_contract(&doodle, doodle_url);
        assert_eq!(doodle["title"], "Doodle Search");
        assert_eq!(doodle["html"], DOODLE_HTML);
        assert!(doodle["html"]
            .as_str()
            .unwrap()
            .starts_with("<!DOCTYPE html>"));

        let unknown_url = "https://unknown.local/";
        let unknown = page(&pack, unknown_url);
        assert_page_contract(&unknown, unknown_url);
        assert_eq!(unknown["title"], "Simulated Net Page");
        assert!(unknown["body_html"]
            .as_str()
            .unwrap()
            .contains("Page: https://unknown.local/"));
    }

    #[test]
    fn apps_browser_archive_and_doodle_query_fallback_obey_contract() {
        let pack = real_pack();
        let root = "https://doodle.search/";
        let archived_root = page(&pack, root);
        assert_page_contract(&archived_root, root);
        assert_eq!(archived_root["title"], "Doodle 搜索");

        let url = "https://doodle.search/?q=%E4%B8%96%E7%95%8C%E4%B8%83%E5%A4%A7%E5%A5%87%E8%BF%B9";
        let archived = page(&pack, url);
        assert_page_contract(&archived, root);
        assert_eq!(archived["title"], "Doodle 搜索");
        let html = archived["body_html"].as_str().unwrap();
        assert!(html.contains("世界七大奇迹"));
        assert!(html.contains("亚历山大灯塔"));
        assert!(html.contains("pharos"));

        let unknown_url = "https://unknown.local/";
        let unknown = page(&pack, unknown_url);
        assert_page_contract(&unknown, unknown_url);
        assert_eq!(unknown["title"], "Simulated Net Page");
    }

    #[test]
    fn apps_browser_archive_hits_apply_python_setdefaults() {
        let pack = LivePack::from_value(json!({
            "browser_pages": [{
                "key": "https://defaults.test/",
                "data": {"title": "Archived title"}
            }]
        }));
        let actual = page(&pack, "https://defaults.test/");
        assert_eq!(
            actual,
            json!({
                "title": "Archived title",
                "url": "https://defaults.test/",
                "supported_locales": ["zh-CN"],
                "body_html": "",
                "allowed_commands": []
            })
        );
    }
}

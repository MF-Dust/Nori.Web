mod support;

use reqwest::Client;
use support::{config, start, TempDir};

#[tokio::test]
async fn etags_cache_rules_ranges_spa_fallback_and_mime_types_match_static_server() {
    let public = TempDir::new("static");
    std::fs::create_dir_all(public.path().join("assets")).unwrap();
    std::fs::create_dir_all(public.path().join("audio")).unwrap();
    std::fs::write(public.path().join("index.html"), vec![b'i'; 1_200]).unwrap();
    std::fs::write(
        public.path().join("assets/app-AbCd1234.js"),
        vec![b'a'; 1_000],
    )
    .unwrap();
    std::fs::write(public.path().join("mutable.js"), b"before").unwrap();
    std::fs::write(
        public.path().join("wallpaper.html"),
        b"<html>wallpaper</html>",
    )
    .unwrap();
    std::fs::write(public.path().join("sw.js"), b"service worker").unwrap();
    std::fs::write(public.path().join("asset-manifest.json"), b"{}").unwrap();
    let server = start(config(public.path())).await;
    let client = Client::builder().no_gzip().no_deflate().build().unwrap();

    let root = client
        .get(format!("{}/", server.base))
        .header("accept-encoding", "identity")
        .send()
        .await
        .unwrap();
    assert_eq!(root.status(), 200);
    assert_eq!(root.headers()["cache-control"], "no-cache, no-transform");
    assert_eq!(root.headers()["content-type"], "text/html; charset=utf-8");
    assert_eq!(root.headers()["accept-ranges"], "bytes");
    let etag = root.headers()["etag"].to_str().unwrap().to_string();
    assert!(etag.starts_with('"') && etag.ends_with('"') && etag.contains('-'));
    assert_eq!(root.headers()["content-length"], "1200");

    let fallback = client
        .get(format!("{}/missing/route", server.base))
        .header("accept-encoding", "identity")
        .send()
        .await
        .unwrap();
    assert_eq!(fallback.status(), 200);
    assert_eq!(fallback.bytes().await.unwrap().len(), 1_200);

    for validator in [etag.clone(), format!("W/{etag}"), "*".to_string()] {
        let not_modified = client
            .get(format!("{}/", server.base))
            .header("if-none-match", validator)
            .header("accept-encoding", "gzip")
            .send()
            .await
            .unwrap();
        assert_eq!(not_modified.status(), 304);
        assert_eq!(not_modified.headers()["etag"], etag.as_str());
        assert_eq!(
            not_modified.headers()["cache-control"],
            "no-cache, no-transform"
        );
        assert_eq!(not_modified.headers()["accept-ranges"], "bytes");
        assert!(!not_modified.headers().contains_key("content-encoding"));
        assert!(!not_modified.headers().contains_key("content-length"));
    }

    let asset = client
        .get(format!("{}/assets/app-AbCd1234.js", server.base))
        .header("accept-encoding", "identity")
        .send()
        .await
        .unwrap();
    assert_eq!(asset.status(), 200);
    assert_eq!(
        asset.headers()["cache-control"],
        "public, max-age=31536000, immutable"
    );
    assert_eq!(
        asset.headers()["content-type"],
        "text/javascript; charset=utf-8"
    );
    let asset_etag = asset.headers()["etag"].to_str().unwrap().to_string();
    assert_eq!(asset.headers()["content-length"], "1000");

    let mutable = client
        .get(format!("{}/mutable.js", server.base))
        .header("accept-encoding", "identity")
        .send()
        .await
        .unwrap();
    assert_eq!(
        mutable.headers()["cache-control"],
        "public, max-age=0, must-revalidate"
    );
    for path in ["wallpaper.html", "sw.js", "asset-manifest.json"] {
        let response = client
            .get(format!("{}/{path}", server.base))
            .send()
            .await
            .unwrap();
        assert_eq!(
            response.headers()["cache-control"],
            "no-cache, no-transform",
            "{path}"
        );
    }

    let range = client
        .get(format!("{}/assets/app-AbCd1234.js", server.base))
        .header("range", "bytes=1-4")
        .header("accept-encoding", "identity")
        .send()
        .await
        .unwrap();
    assert_eq!(range.status(), 206);
    assert_eq!(range.headers()["content-range"], "bytes 1-4/1000");
    assert_eq!(range.headers()["content-length"], "4");
    assert_eq!(range.headers()["accept-ranges"], "bytes");
    assert_eq!(range.headers()["etag"], asset_etag);
    assert_eq!(range.bytes().await.unwrap().as_ref(), b"aaaa");

    let suffix = client
        .get(format!("{}/assets/app-AbCd1234.js", server.base))
        .header("range", "bytes=-3")
        .header("accept-encoding", "identity")
        .send()
        .await
        .unwrap();
    assert_eq!(suffix.status(), 206);
    assert_eq!(suffix.headers()["content-range"], "bytes 997-999/1000");
    assert_eq!(suffix.bytes().await.unwrap().as_ref(), b"aaa");

    let unsatisfiable = client
        .get(format!("{}/assets/app-AbCd1234.js", server.base))
        .header("range", "bytes=1000-")
        .send()
        .await
        .unwrap();
    assert_eq!(unsatisfiable.status(), 416);
    assert_eq!(unsatisfiable.headers()["content-range"], "bytes */1000");
    assert_eq!(unsatisfiable.headers()["accept-ranges"], "bytes");
    assert_eq!(unsatisfiable.headers()["content-length"], "0");
    assert!(!unsatisfiable.headers().contains_key("etag"));
    assert!(!unsatisfiable.headers().contains_key("cache-control"));

    for invalid in ["bytes=bad", "bytes=0-2,5-7", "Bytes=0-2"] {
        let response = client
            .get(format!("{}/assets/app-AbCd1234.js", server.base))
            .header("range", invalid)
            .header("accept-encoding", "identity")
            .send()
            .await
            .unwrap();
        assert_eq!(response.status(), 200, "{invalid}");
        assert_eq!(response.bytes().await.unwrap().len(), 1_000);
    }

    let gzip = client
        .get(format!("{}/assets/app-AbCd1234.js", server.base))
        .header("accept-encoding", "gzip")
        .send()
        .await
        .unwrap();
    assert_eq!(gzip.status(), 200);
    assert_eq!(gzip.headers()["content-encoding"], "gzip");
    assert_eq!(gzip.headers()["vary"], "Accept-Encoding");
    assert_eq!(gzip.headers()["accept-ranges"], "bytes");
    assert!(
        gzip.headers()["content-length"]
            .to_str()
            .unwrap()
            .parse::<usize>()
            .unwrap()
            < 1_000
    );
    assert!(gzip.bytes().await.unwrap().starts_with(&[0x1f, 0x8b]));

    // Starlette streams range responses and consequently gzips them even below 500 bytes.
    let gzip_range = client
        .get(format!("{}/assets/app-AbCd1234.js", server.base))
        .header("range", "bytes=0-9")
        .header("accept-encoding", "gzip")
        .send()
        .await
        .unwrap();
    assert_eq!(gzip_range.status(), 206);
    assert_eq!(gzip_range.headers()["content-encoding"], "gzip");
    assert_eq!(gzip_range.headers()["content-range"], "bytes 0-9/1000");
    assert_eq!(gzip_range.headers()["accept-ranges"], "bytes");
    assert!(!gzip_range.headers().contains_key("content-length"));
    assert!(gzip_range.bytes().await.unwrap().starts_with(&[0x1f, 0x8b]));

    let python_mime_types = [
        ("bin", "application/octet-stream"),
        ("css", "text/css"),
        ("gif", "image/gif"),
        ("glb", "model/gltf-binary"),
        ("html", "text/html"),
        ("jpg", "image/jpeg"),
        ("js", "text/javascript"),
        ("json", "application/json"),
        ("m4a", "audio/mp4"),
        ("md", "text/markdown"),
        ("moc3", "application/octet-stream"),
        ("mp3", "audio/mpeg"),
        ("mp4", "video/mp4"),
        ("ogg", "audio/ogg"),
        ("pdf", "application/pdf"),
        ("png", "image/png"),
        ("svg", "image/svg+xml"),
        ("txt", "text/plain"),
        ("wasm", "application/wasm"),
        ("wav", "audio/wav"),
        ("webp", "image/webp"),
        ("woff2", "font/woff2"),
    ];
    for (extension, mime) in python_mime_types {
        let path = format!("assets/mime.{extension}");
        std::fs::write(public.path().join(&path), b"mime").unwrap();
        let expected = if mime.starts_with("text/") {
            format!("{mime}; charset=utf-8")
        } else {
            mime.to_string()
        };
        let response = client
            .get(format!("{}/{path}", server.base))
            .send()
            .await
            .unwrap();
        assert_eq!(response.headers()["content-type"], expected, "{extension}");
    }

    let traversal = client
        .get(format!("{}/%2e%2e%2fsecret", server.base))
        .header("accept-encoding", "identity")
        .send()
        .await
        .unwrap();
    assert_eq!(traversal.status(), 200);
    assert_eq!(traversal.bytes().await.unwrap().len(), 1_200);
}

#[tokio::test]
async fn missing_index_returns_the_static_router_404_body() {
    let public = TempDir::new("empty-public");
    let server = start(config(public.path())).await;
    let response = Client::builder()
        .no_gzip()
        .no_deflate()
        .build()
        .unwrap()
        .get(format!("{}/missing", server.base))
        .send()
        .await
        .unwrap();
    assert_eq!(response.status(), 404);
    assert_eq!(
        response.json::<serde_json::Value>().await.unwrap(),
        serde_json::json!({"detail":"Not found"})
    );
}

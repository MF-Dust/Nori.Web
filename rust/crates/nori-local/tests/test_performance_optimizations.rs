mod support;

use reqwest::Client;
use support::{config, start, TempDir};

#[tokio::test]
async fn gzip_etag_range_and_bootstrap_asset_delivery() {
    let public = TempDir::new("performance");
    std::fs::create_dir_all(public.path().join("assets")).unwrap();
    std::fs::create_dir_all(public.path().join("audio/sfx")).unwrap();
    std::fs::write(public.path().join("index.html"), b"<html>index</html>").unwrap();
    std::fs::write(
        public.path().join("assets/NormalApp-Cn6agT0F.js"),
        vec![b'j'; 12_000],
    )
    .unwrap();
    std::fs::write(
        public.path().join("assets/index-FU-0vwSE.css"),
        vec![b'c'; 2_000],
    )
    .unwrap();
    std::fs::write(
        public.path().join("assets/large-test.js"),
        vec![b'l'; 200_000],
    )
    .unwrap();
    std::fs::write(public.path().join("audio/sfx/pop.mp3"), vec![b'p'; 2_048]).unwrap();
    std::fs::write(
        public.path().join("fonts.css"),
        "@font-face { font-family: SarasaFixed; font-display: swap; }",
    )
    .unwrap();
    let server = start(config(public.path())).await;
    let client = Client::builder().no_gzip().no_deflate().build().unwrap();

    for path in [
        "/assets/NormalApp-Cn6agT0F.js",
        "/assets/index-FU-0vwSE.css",
    ] {
        let response = client
            .get(format!("{}{path}", server.base))
            .header("accept-encoding", "gzip")
            .send()
            .await
            .unwrap();
        assert_eq!(response.status(), 200);
        assert_eq!(response.headers()["content-encoding"], "gzip");
        assert_eq!(response.headers()["vary"], "Accept-Encoding");
        assert!(response.headers()["cache-control"]
            .to_str()
            .unwrap()
            .contains("max-age=31536000"));
        assert!(response.headers().contains_key("etag"));
        assert!(response.bytes().await.unwrap().starts_with(&[0x1f, 0x8b]));
    }

    let large = client
        .get(format!("{}/assets/large-test.js", server.base))
        .header("accept-encoding", "gzip")
        .send()
        .await
        .unwrap();
    assert_eq!(large.headers()["content-encoding"], "gzip");
    assert!(!large.headers().contains_key("content-length"));
    assert!(large.bytes().await.unwrap().starts_with(&[0x1f, 0x8b]));

    let root = client
        .get(format!("{}/", server.base))
        .send()
        .await
        .unwrap();
    let etag = root.headers()["etag"].to_str().unwrap().to_string();
    drop(root);
    let not_modified = client
        .get(format!("{}/", server.base))
        .header("if-none-match", etag)
        .header("accept-encoding", "gzip")
        .send()
        .await
        .unwrap();
    assert_eq!(not_modified.status(), 304);
    assert!(!not_modified.headers().contains_key("content-encoding"));

    let full_audio = client
        .get(format!("{}/audio/sfx/pop.mp3", server.base))
        .header("accept-encoding", "identity")
        .send()
        .await
        .unwrap();
    assert_eq!(full_audio.status(), 200);
    let total = full_audio.bytes().await.unwrap().len();
    let partial = client
        .get(format!("{}/audio/sfx/pop.mp3", server.base))
        .header("range", "bytes=0-99")
        .header("accept-encoding", "identity")
        .send()
        .await
        .unwrap();
    assert_eq!(partial.status(), 206);
    assert_eq!(
        partial.headers()["content-range"],
        format!("bytes 0-99/{total}")
    );
    assert_eq!(partial.headers()["accept-ranges"], "bytes");
    assert_eq!(partial.bytes().await.unwrap().len(), 100);

    let fonts = client
        .get(format!("{}/fonts.css", server.base))
        .header("accept-encoding", "identity")
        .send()
        .await
        .unwrap();
    let fonts = fonts.text().await.unwrap();
    assert!(fonts.contains("SarasaFixed") && fonts.contains("font-display: swap"));
}

use nori_core::{
    auth,
    http::{HttpRequest as Incoming, HttpResponse},
    jsonutil::canonical_json,
    live_pack::LivePack,
    provider::{HttpRequest, HttpResult},
    world::SERVER_ID,
};
use nori_worker::edge::{
    attachment,
    host::*,
    live_pack_loader::{LivePackLoader, CORE_KEY, INDEX_KEY},
    provider_io,
    router::{self, Route},
    session_object::{Frame, SessionObject, AI_KEY, WORLD_KEY},
    Isolate,
};
use serde_json::{json, Value};
use std::{
    cell::{Cell, RefCell},
    collections::HashMap,
    future::Future,
    pin::pin,
    sync::Arc,
    task::{Context, Poll, Wake, Waker},
    thread,
};

// No async runtime: fakes yield cooperatively and wake this one test thread.
struct ThreadWake(thread::Thread);
impl Wake for ThreadWake {
    fn wake(self: Arc<Self>) {
        self.0.unpark();
    }
}
fn run<F: Future>(future: F) -> F::Output {
    let waker = Waker::from(Arc::new(ThreadWake(thread::current())));
    let mut cx = Context::from_waker(&waker);
    let mut future = pin!(future);
    loop {
        match future.as_mut().poll(&mut cx) {
            Poll::Ready(value) => return value,
            Poll::Pending => thread::park(),
        }
    }
}
async fn yield_once() {
    let mut yielded = false;
    futures_util::future::poll_fn(|cx| {
        if yielded {
            Poll::Ready(())
        } else {
            yielded = true;
            cx.waker().wake_by_ref();
            Poll::Pending
        }
    })
    .await
}

#[derive(Default)]
struct Fake {
    env: RefCell<HashMap<String, String>>,
    binding_reads: Cell<usize>,
    now: Cell<i64>,
    storage: RefCell<HashMap<String, String>>,
    puts: RefCell<Vec<(String, String)>>,
    get_error: Cell<bool>,
    sockets: RefCell<HashMap<usize, Value>>,
    text: RefCell<Vec<(usize, Value)>>,
    binary: RefCell<Vec<(usize, Vec<u8>)>>,
    closes: RefCell<Vec<(usize, u16, String)>>,
    lists: Cell<usize>,
    objects: RefCell<HashMap<String, Vec<u8>>>,
    keys: RefCell<Vec<String>>,
    model: RefCell<Option<Vec<u8>>>,
    model_reads: RefCell<Vec<(String, bool)>>,
    logs: RefCell<Vec<String>>,
    sleeps: RefCell<Vec<u64>>,
    active_sleeps: Cell<usize>,
    max_active_sleeps: Cell<usize>,
    requests: RefCell<Vec<HttpRequest>>,
}
impl Fake {
    fn new() -> Self {
        let fake = Self::default();
        fake.env
            .borrow_mut()
            .insert("SECRET_KEY".into(), "edge-secret".into());
        fake.now.set(1_800_000_000_000);
        fake
    }
    fn socket(&self, id: usize, user: &str, role: &str) {
        let value = attachment::new(
            user,
            &format!("socket-{id}"),
            if role == "pending_media" {
                "/api/arcade/web/v1/media"
            } else {
                "/api/arcade/web/v1"
            },
            "",
        );
        let mut value: Value = serde_json::from_str(&value).unwrap();
        value["role"] = json!(role);
        self.sockets
            .borrow_mut()
            .insert(id, Value::String(value.to_string()));
    }
    fn saved(&self, id: usize) -> Value {
        Value::Object(attachment::read(self.attachment(&id)))
    }
    fn store_json(&self, key: &str, value: Value) {
        self.objects
            .borrow_mut()
            .insert(key.into(), serde_json::to_vec(&value).unwrap());
    }
    fn world_puts(&self) -> usize {
        self.puts
            .borrow()
            .iter()
            .filter(|(key, _)| key == WORLD_KEY)
            .count()
    }
    fn last(&self, kind: &str) -> Value {
        self.text
            .borrow()
            .iter()
            .rev()
            .find(|(_, value)| value["type"] == kind)
            .expect(kind)
            .1
            .clone()
    }
}
impl Bindings for Fake {
    fn value(&self, name: &str) -> Option<String> {
        self.binding_reads.set(self.binding_reads.get() + 1);
        self.env.borrow().get(name).cloned()
    }
}
impl Clock for Fake {
    fn now_ms(&self) -> i64 {
        self.now.get()
    }
}
impl Log for Fake {
    fn log(&self, message: &str) {
        self.logs.borrow_mut().push(message.into());
    }
}
impl Storage for Fake {
    async fn get(&self, key: &str) -> Result<Option<String>> {
        if self.get_error.get() {
            Err("storage failure".into())
        } else {
            Ok(self.storage.borrow().get(key).cloned())
        }
    }
    async fn put(&self, key: &str, value: &str) -> Result<()> {
        self.puts.borrow_mut().push((key.into(), value.into()));
        self.storage.borrow_mut().insert(key.into(), value.into());
        Ok(())
    }
}
impl Sockets for Fake {
    type Socket = usize;
    fn list(&self) -> Vec<usize> {
        self.lists.set(self.lists.get() + 1);
        self.sockets.borrow().keys().copied().collect()
    }
    fn attachment(&self, id: &usize) -> Option<Value> {
        self.sockets.borrow().get(id).cloned()
    }
    fn set_attachment(&self, id: &usize, json: &str) -> Result<()> {
        self.sockets
            .borrow_mut()
            .insert(*id, Value::String(json.into()));
        Ok(())
    }
    fn send_text(&self, id: &usize, text: &str) -> Result<()> {
        self.text
            .borrow_mut()
            .push((*id, serde_json::from_str(text).unwrap()));
        Ok(())
    }
    fn send_binary(&self, id: &usize, bytes: &[u8]) -> Result<()> {
        self.binary.borrow_mut().push((*id, bytes.to_vec()));
        Ok(())
    }
    fn close(&self, id: &usize, code: u16, reason: &str) -> Result<()> {
        self.closes.borrow_mut().push((*id, code, reason.into()));
        Ok(())
    }
}
impl ObjectStore for Fake {
    async fn get_bytes(&self, key: &str) -> Result<Option<Vec<u8>>> {
        self.keys.borrow_mut().push(key.into());
        Ok(self.objects.borrow().get(key).cloned())
    }
}
impl ModelStore for Fake {
    type Body = Vec<u8>;
    async fn model(&self, key: &str, head: bool) -> Result<Option<AssetObject<Vec<u8>>>> {
        self.model_reads.borrow_mut().push((key.into(), head));
        Ok(self.model.borrow().as_ref().map(|bytes| AssetObject {
            body: if head { None } else { Some(bytes.clone()) },
            size: bytes.len() as u64,
            http_etag: Some("\"r2-etag\"".into()),
        }))
    }
}
impl Sleep for Fake {
    async fn sleep(&self, ms: u64) {
        self.sleeps.borrow_mut().push(ms);
        let active = self.active_sleeps.get() + 1;
        self.active_sleeps.set(active);
        self.max_active_sleeps
            .set(self.max_active_sleeps.get().max(active));
        yield_once().await;
        self.active_sleeps.set(self.active_sleeps.get() - 1);
    }
}
impl Fetch for Fake {
    async fn fetch(&self, request: HttpRequest) -> HttpResult {
        self.requests.borrow_mut().push(request);
        yield_once().await;
        HttpResult::Network("fake network".into())
    }
}
fn request(path: &str, method: &str) -> Request {
    Request {
        url: format!("https://nori.test{path}"),
        http: Incoming {
            method: method.into(),
            path: path.into(),
            headers: Vec::new(),
            body: Vec::new(),
            scheme: "https".into(),
        },
    }
}
fn response(host: &Fake, req: &Request) -> HttpResponse {
    match run(router::route(host, &Isolate::default(), req)).unwrap() {
        Route::Response(value) => value,
        _ => panic!("not an HTTP response"),
    }
}
fn send(object: &SessionObject, host: &Fake, isolate: &Isolate, id: usize, message: Value) {
    run(object.on_message(host, isolate, &id, Frame::Text(message.to_string())));
}
fn dispatch() -> Value {
    json!({"type":"dispatch","actor":"player","cartridgeId":"chat","requestId":"chat-1","expectedHeadVersion":0,"cmd":{"type":"playerMessage","text":"hello"}})
}
fn setup() -> (Fake, Isolate, SessionObject) {
    let fake = Fake::new();
    fake.socket(1, "guest-1", "main");
    (fake, Isolate::default(), SessionObject::default())
}

#[test]
fn origin_rejected_before_bindings_and_body_routing() {
    let fake = Fake::default(); // SECRET_KEY absent too: origin still wins.
    let mut req = request("/api/entry-status", "GET");
    req.http
        .headers
        .push(("Origin".into(), "https://attacker.test".into()));
    let value = response(&fake, &req);
    assert_eq!(value.status, 403);
    assert_eq!(value.body, b"origin_forbidden");
    assert_eq!(fake.binding_reads.get(), 0);
    let value = SessionObject::upgrade(&fake, &req).unwrap().unwrap_err();
    assert_eq!(value.status, 403);
    assert_eq!(fake.binding_reads.get(), 0);
}
#[test]
fn missing_or_blank_secret_raises_python_binding_error() {
    let fake = Fake::default();
    let req = request("/api/entry-status", "GET");
    for secret in [None, Some("   ")] {
        fake.env.borrow_mut().clear();
        if let Some(secret) = secret {
            fake.env
                .borrow_mut()
                .insert("SECRET_KEY".into(), secret.into());
        }
        let error = match run(router::route(&fake, &Isolate::default(), &req)) {
            Err(error) => error,
            _ => panic!("blank secret accepted"),
        };
        assert_eq!(
            error,
            "Cloudflare requires a nonblank SECRET_KEY binding or environment variable"
        );
    }
}
#[test]
fn upgrade_validation_codes_and_ticket_hash() {
    let fake = Fake::new();
    let mut req = request("/api/arcade/web/v1", "GET");
    assert_eq!(response(&fake, &req).status, 426);
    req.http
        .headers
        .push(("Upgrade".into(), "WEBSOCKET".into()));
    assert_eq!(
        response(&fake, &req).body,
        b"arcade.v1 subprotocol required"
    );
    req.http.headers.push((
        "Sec-WebSocket-Protocol".into(),
        "arcade.v1,ticket.bad".into(),
    ));
    assert_eq!(response(&fake, &req).status, 401);
    let ticket = auth::issue_ticket("edge-secret", "alice", fake.now_ms() / 1000);
    req.http.headers[1].1 = format!("  arcade.v1, ticket.{ticket} ");
    let user = SessionObject::upgrade(&fake, &req).unwrap().unwrap();
    assert_eq!(user, "alice");
    match run(router::route(&fake, &Isolate::default(), &req)).unwrap() {
        Route::Durable(name) => assert_eq!(name, router::durable_name("alice")),
        _ => panic!("not forwarded"),
    }
    assert_eq!(
        router::durable_name("alice"),
        "2bd806c97f0e00af1a1fc3328fa763a9269723c8db8fac4f93af71db186d6e90"
    );
}
#[test]
fn unknown_api_matches_python_static_catchall() {
    let fake = Fake::new();
    let get = response(&fake, &request("/api/unknown", "GET"));
    assert_eq!(get.status, 404);
    assert_eq!(get.body, br#"{"detail":"API endpoint not found"}"#);
    for method in ["POST", "HEAD", "DELETE"] {
        let value = response(&fake, &request("/api/unknown", method));
        assert_eq!(value.status, 405);
        assert!(value.headers.contains(&("Allow".into(), "GET".into())));
    }
}
#[test]
fn wrong_api_method_preserves_asgi_first_partial_route_allow() {
    let fake = Fake::new();
    for (path, allow) in [
        ("/api/arcade/ws-ticket", "POST"),
        ("/api/auth/convex/token", "POST"),
        ("/api/auth/get-session", "GET, POST"),
        ("/api/entry-status", "GET"),
    ] {
        let value = response(&fake, &request(path, "HEAD"));
        assert_eq!(value.status, 405);
        assert!(value.headers.contains(&("Allow".into(), allow.into())));
    }
    assert_eq!(
        response(&fake, &request("/api/arcade/ws-ticket", "GET")).status,
        404
    );
}

#[test]
fn http_host_otp_memory_is_per_isolate_and_bindings_are_per_request() {
    let fake = Fake::new();
    let isolate = Isolate::default();
    fake.env
        .borrow_mut()
        .insert("NORI_DEV_OTP".into(), "123456".into());
    let mut req = request("/api/auth/send-email-otp", "POST");
    req.http.body = br#"{"email":"a@nori.test"}"#.to_vec();
    run(router::route(&fake, &isolate, &req)).unwrap();
    assert_eq!(isolate.http.borrow().auth.otps.len(), 1);
    fake.env
        .borrow_mut()
        .insert("NORI_AUTO_GUEST".into(), "false".into());
    let req = request("/api/auth/get-session", "GET");
    let Route::Response(value) = run(router::route(&fake, &isolate, &req)).unwrap() else {
        panic!()
    };
    assert_eq!(value.body, b"null");
    assert_eq!(isolate.http.borrow().auth.otps.len(), 1);
    assert_eq!(isolate.http.borrow().machine_id, "nori-local");
    fake.env
        .borrow_mut()
        .insert("NORI_AUTO_GUEST".into(), "true".into());
    let Route::Response(value) = run(router::route(&fake, &isolate, &req)).unwrap() else {
        panic!()
    };
    let cache: Vec<_> = value
        .headers
        .iter()
        .filter(|(k, _)| k.eq_ignore_ascii_case("cache-control"))
        .collect();
    assert_eq!(cache.len(), 1);
    assert_eq!(cache[0].1, "private, no-store");
}
#[test]
fn glb_get_head_missing_and_method_headers() {
    let fake = Fake::new();
    assert_eq!(
        response(&fake, &request(router::MODEL_PATH, "GET")).body,
        b"Object Not Found"
    );
    fake.model.replace(Some(b"glb".to_vec()));
    for head in [false, true] {
        let Route::Model(object) = run(router::route(
            &fake,
            &Isolate::default(),
            &request(router::MODEL_PATH, if head { "HEAD" } else { "GET" }),
        ))
        .unwrap() else {
            panic!()
        };
        assert_eq!(object.body, if head { None } else { Some(b"glb".to_vec()) });
        assert!(router::model_headers(&object).contains(&("ETag".into(), "\"r2-etag\"".into())));
        assert!(router::model_headers(&object).contains(&("Content-Length".into(), "3".into())));
        assert!(router::model_headers(&object).contains(&(
            "Cache-Control".into(),
            "public, max-age=604800, immutable".into()
        )));
    }
    let value = response(&fake, &request(router::MODEL_PATH, "POST"));
    assert_eq!(value.status, 405);
    assert_eq!(value.body, b"Method Not Allowed");
    assert!(value
        .headers
        .contains(&("Allow".into(), "GET, HEAD".into())));
}
#[test]
fn attachment_is_a_json_string_and_legacy_keys_scrub_on_ping() {
    let json = attachment::new(
        "user",
        "random",
        "/api/arcade/web/v1/media",
        "nori_full_unlock=0",
    );
    let value: Value = serde_json::from_str(&json).unwrap();
    assert_eq!(
        value,
        json!({"version":1,"socketId":"random","userId":"user","role":"pending_media","fullUnlock":false})
    );
    for legacy_object in [false, true] {
        let (fake, isolate, object) = setup();
        let mut saved = fake.saved(1);
        saved["apiKey"] = json!("old-ai");
        saved["ttsApiKey"] = json!("old-tts");
        fake.sockets.borrow_mut().insert(
            1,
            if legacy_object {
                saved
            } else {
                Value::String(saved.to_string())
            },
        );
        send(&object, &fake, &isolate, 1, json!({"type":"ping"}));
        assert!(matches!(fake.attachment(&1), Some(Value::String(_))));
        assert!(fake.saved(1).get("apiKey").is_none());
        assert!(fake.saved(1).get("ttsApiKey").is_none());
        assert_eq!(fake.world_puts(), 0);
    }
}
#[test]
fn pending_media_opens_only_this_world_grant_and_then_ignores_frames() {
    let (fake, isolate, object) = setup();
    send(
        &object,
        &fake,
        &isolate,
        1,
        json!({"type":"open_my_web_world"}),
    );
    let joined = fake.last("world_joined");
    fake.socket(2, "guest-1", "pending_media");
    send(
        &object,
        &fake,
        &isolate,
        2,
        json!({"type":"open_media","grant":joined["session"]["mediaGrant"]}),
    );
    assert_eq!(fake.saved(2)["role"], "media");
    assert_eq!(fake.saved(2)["worldId"], joined["world"]["worldId"]);
    let writes = fake.world_puts();
    run(object.on_message(&fake, &isolate, &2, Frame::Binary(vec![1])));
    send(
        &object,
        &fake,
        &isolate,
        2,
        json!({"type":"reset_my_web_world"}),
    );
    assert_eq!(fake.world_puts(), writes);
    assert!(fake.closes.borrow().is_empty());
}
#[test]
fn pending_media_json_and_shape_close_codes() {
    for (frame, code, reason) in [
        (Frame::Text("{".into()), 1002, "invalid_media_open"),
        (Frame::Binary(vec![]), 1002, "invalid_media_open"),
        (Frame::Text("[]".into()), 4005, "media_grant_invalid"),
        (
            Frame::Text(r#"{"type":"open_media","grant":"wrong"}"#.into()),
            4005,
            "media_grant_invalid",
        ),
        (
            Frame::Text(r#"{"type":"open_media","grant":""}"#.into()),
            4005,
            "media_grant_invalid",
        ),
    ] {
        let fake = Fake::new();
        fake.socket(1, "guest-1", "pending_media");
        let isolate = Isolate::default();
        let object = SessionObject::default();
        run(object.on_message(&fake, &isolate, &1, frame));
        assert_eq!(*fake.closes.borrow(), vec![(1, code, reason.into())]);
        assert_eq!(fake.world_puts(), 0);
    }
}
#[test]
fn ping_has_no_prefetch_settings_or_snapshot_write() {
    let (fake, isolate, object) = setup();
    send(
        &object,
        &fake,
        &isolate,
        1,
        json!({"type":"open_my_web_world"}),
    );
    fake.keys.borrow_mut().clear();
    fake.puts.borrow_mut().clear();
    fake.binding_reads.set(0);
    send(
        &object,
        &fake,
        &isolate,
        1,
        json!({"type":"ping","noriAiConfig":{"apiKey":"secret"}}),
    );
    assert_eq!(fake.last("pong")["serverId"], SERVER_ID);
    assert_eq!(fake.world_puts(), 0);
    assert!(fake.puts.borrow().is_empty());
    assert!(fake.keys.borrow().is_empty());
    assert!(fake.lists.get() >= 2);
}
#[test]
fn dispatch_drains_concurrent_tasks_and_persists_once_only_on_change() {
    let (fake, isolate, object) = setup();
    send(
        &object,
        &fake,
        &isolate,
        1,
        json!({"type":"open_my_web_world"}),
    );
    fake.puts.borrow_mut().clear();
    fake.text.borrow_mut().clear();
    send(&object, &fake, &isolate, 1, dispatch());
    assert_eq!(fake.world_puts(), 1);
    assert_eq!(fake.last("dispatch_ack")["success"], true);
    let sent = fake.text.borrow();
    assert_eq!(sent[0].1["type"], "runtime_transition");
    assert_eq!(sent[1].1["type"], "visibility_fence_advanced");
    assert_eq!(sent[2].1["type"], "dispatch_ack");
    drop(sent);
    let snapshot: Value =
        serde_json::from_str(fake.storage.borrow().get(WORLD_KEY).unwrap()).unwrap();
    assert!(snapshot["cartridges"]["chat"]["state"]["lines"]
        .as_array()
        .unwrap()
        .iter()
        .any(|line| line["sender"] == "agent"));
    assert!(
        fake.max_active_sleeps.get() >= 2,
        "speech and progress must run concurrently"
    );
    assert!(!fake.sleeps.borrow().contains(&150));
    send(&object, &fake, &isolate, 1, dispatch());
    assert_eq!(fake.world_puts(), 1);
    assert_eq!(fake.last("dispatch_ack")["success"], false);
    send(&object, &fake, &isolate, 1, json!({"type":"leave_world"}));
    assert_eq!(fake.world_puts(), 1);
}
#[test]
fn reconnect_restores_same_world_id_from_storage() {
    let (fake, isolate, object) = setup();
    send(
        &object,
        &fake,
        &isolate,
        1,
        json!({"type":"open_my_web_world"}),
    );
    let id = object.world_id().unwrap();
    fake.socket(2, "guest-1", "main");
    let wake = SessionObject::default();
    send(
        &wake,
        &fake,
        &isolate,
        2,
        json!({"type":"join_world","worldId":id}),
    );
    assert_eq!(wake.world_id().as_deref(), Some(id.as_str()));
    assert_eq!(fake.last("world_joined")["world"]["worldId"], id);
}
#[test]
fn restores_snapshot_generated_by_real_python_and_keeps_exact_persisted_string() {
    let fake = Fake::new();
    fake.socket(1, "python-fixture-owner", "main");
    let raw = include_str!("fixtures/snapshot_python.json");
    fake.storage
        .borrow_mut()
        .insert(WORLD_KEY.into(), raw.into());
    let value: Value = serde_json::from_str(raw).unwrap();
    let object = SessionObject::default();
    send(
        &object,
        &fake,
        &Isolate::default(),
        1,
        json!({"type":"create_world"}),
    );
    assert_eq!(
        object.world_id().unwrap(),
        value["worldId"].as_str().unwrap()
    );
    assert_eq!(fake.world_puts(), 0);
    assert_eq!(fake.storage.borrow().get(WORLD_KEY).unwrap(), raw);
}
#[test]
fn corrupt_or_owner_mismatched_snapshot_creates_new_world() {
    for raw in ["corrupt", include_str!("fixtures/snapshot_python.json")] {
        let (fake, isolate, object) = setup();
        fake.storage
            .borrow_mut()
            .insert(WORLD_KEY.into(), raw.into());
        send(&object, &fake, &isolate, 1, json!({"type":"create_world"}));
        assert_eq!(fake.world_puts(), 1);
        let stored: Value =
            serde_json::from_str(fake.storage.borrow().get(WORLD_KEY).unwrap()).unwrap();
        assert_eq!(stored["ownerId"], "guest-1");
        if let Ok(old) = serde_json::from_str::<Value>(raw) {
            assert_ne!(stored["worldId"], old["worldId"]);
        }
    }
}
#[test]
fn public_ai_config_is_canonical_and_contains_no_key_event_or_dispatch() {
    let (fake, isolate, object) = setup();
    send(&object, &fake, &isolate, 1, json!({"type":"nori_unused"}));
    fake.puts.borrow_mut().clear();
    send(
        &object,
        &fake,
        &isolate,
        1,
        json!({"type":"event","channel":"nori.ai.config","payload":{"apiKey":"private-credential","model":"test","enabled":true}}),
    );
    assert_eq!(
        fake.puts
            .borrow()
            .iter()
            .filter(|(k, _)| k == AI_KEY)
            .count(),
        1
    );
    let raw = fake.storage.borrow().get(AI_KEY).unwrap().clone();
    let value: Value = serde_json::from_str(&raw).unwrap();
    assert!(value.get("apiKey").is_none());
    assert_eq!(raw, canonical_json(&value));
    let mut message = dispatch();
    message["noriAiConfig"] = json!({"apiKey":"private-dispatch-credential","enabled":false});
    message["noriTtsConfig"] = json!({"apiKey":"private-tts-credential","enabled":false});
    send(&object, &fake, &isolate, 1, message);
    for (_, raw) in fake.puts.borrow().iter() {
        assert!(!raw.contains("private-"));
        assert!(!raw.contains("noriAiConfig"));
        assert!(!raw.contains("noriTtsConfig"));
    }
}
#[test]
fn story_cookie_defaults_are_applied_and_reset_forces_persistence() {
    let (fake, isolate, object) = setup();
    let mut saved = fake.saved(1);
    saved["fullUnlock"] = json!(false);
    fake.set_attachment(&1, &saved.to_string()).unwrap();
    send(
        &object,
        &fake,
        &isolate,
        1,
        json!({"type":"open_my_web_world"}),
    );
    let id = object.world_id().unwrap();
    let stored: Value =
        serde_json::from_str(fake.storage.borrow().get(WORLD_KEY).unwrap()).unwrap();
    assert_eq!(stored["fullUnlock"], false);
    send(
        &object,
        &fake,
        &isolate,
        1,
        json!({"type":"reset_my_web_world"}),
    );
    assert_ne!(object.world_id().unwrap(), id);
    assert_eq!(fake.world_puts(), 2);
    let stored: Value =
        serde_json::from_str(fake.storage.borrow().get(WORLD_KEY).unwrap()).unwrap();
    assert_eq!(stored["fullUnlock"], false);
}
#[test]
fn broadcasts_rebuild_main_and_current_world_media_membership() {
    let (fake, isolate, object) = setup();
    send(
        &object,
        &fake,
        &isolate,
        1,
        json!({"type":"open_my_web_world"}),
    );
    let grant = fake.last("world_joined")["session"]["mediaGrant"].clone();
    fake.socket(2, "guest-1", "main");
    fake.socket(3, "someone-else", "main");
    fake.socket(4, "guest-1", "pending_media");
    send(
        &object,
        &fake,
        &isolate,
        4,
        json!({"type":"open_media","grant":grant}),
    );
    fake.socket(5, "guest-1", "media");
    let mut stale = fake.saved(5);
    stale["worldId"] = json!("stale-world");
    fake.set_attachment(&5, &stale.to_string()).unwrap();
    fake.text.borrow_mut().clear();
    send(&object, &fake, &isolate, 1, dispatch());
    assert!(fake
        .text
        .borrow()
        .iter()
        .any(|(id, v)| *id == 2 && v["type"] == "runtime_transition"));
    assert!(!fake
        .text
        .borrow()
        .iter()
        .any(|(id, _)| *id == 3 || *id == 4 || *id == 5));
    assert!(!fake
        .text
        .borrow()
        .iter()
        .any(|(id, v)| *id == 2 && v["type"] == "dispatch_ack"));
    assert!(!fake.binary.borrow().is_empty());
    assert!(fake.binary.borrow().iter().all(|(id, _)| *id == 4));
}
#[test]
fn unexpected_frame_runtime_failure_close_and_close_error_handlers() {
    let (fake, isolate, object) = setup();
    run(object.on_message(&fake, &isolate, &1, Frame::Binary(vec![1])));
    assert_eq!(
        fake.closes.borrow()[0],
        (1, 1002, "invalid_arcade_message".into())
    );
    fake.get_error.set(true);
    send(&object, &fake, &isolate, 1, json!({"type":"ping"}));
    assert_eq!(
        fake.closes.borrow()[1],
        (1, 1011, "arcade_runtime_error".into())
    );
    object.on_close(&fake, &1, 1000, "bye", true);
    assert_eq!(fake.closes.borrow()[2], (1, 1000, "bye".into()));
    object.on_error(&fake, "failure");
    assert!(fake
        .logs
        .borrow()
        .iter()
        .any(|l| l.contains("WebSocket error: failure")));
}
#[test]
fn malformed_main_json_is_a_direct_error_not_a_close_or_persist() {
    let (fake, isolate, object) = setup();
    for raw in ["{", "[]"] {
        run(object.on_message(&fake, &isolate, &1, Frame::Text(raw.into())));
        assert_eq!(fake.last("error")["code"], "bad_request");
    }
    assert!(fake.closes.borrow().is_empty());
    assert_eq!(fake.world_puts(), 0);
}
#[test]
fn live_prefetch_artifacts_browser_and_bounty_use_python_keys() {
    let fake = Fake::new();
    let pack = LivePack::empty();
    pack.install_core(json!({"facts":{}}));
    let mut loader = LivePackLoader::default();
    for section in [
        "mail_artifacts",
        "file_artifacts",
        "signal_thread_artifacts",
        "signal_message_artifacts",
    ] {
        fake.store_json(&format!("runtime/live/{section}.json"), json!([]));
    }
    fake.store_json(
        INDEX_KEY,
        json!({"entries":{"https://a.test":"a","https://b.test":"b"}}),
    );
    fake.store_json(
        "runtime/live/browser/a.json",
        json!([{"key":"https://a.test","data":{"url":"https://a.test"}}]),
    );
    fake.store_json(
        "runtime/live/browser/b.json",
        json!([{"key":"https://b.test","data":{"url":"https://b.test"}}]),
    );
    run(loader.prefetch(&fake,&pack,&json!({"type":"event","channel":"manifold.artifacts.request","payload":{"artifactType":"mail"}})));
    assert_eq!(
        *fake.keys.borrow(),
        vec!["runtime/live/mail_artifacts.json"]
    );
    run(loader.prefetch(
        &fake,
        &pack,
        &json!({"type":"event","channel":"manifold.artifacts.request","payload":{}}),
    ));
    assert_eq!(
        &fake.keys.borrow()[1..],
        &[
            "runtime/live/file_artifacts.json",
            "runtime/live/signal_thread_artifacts.json",
            "runtime/live/signal_message_artifacts.json"
        ]
    );
    run(loader.prefetch(&fake,&pack,&json!({"type":"event","channel":"manifold.artifacts.fetch","payload":{"artifactType":"browser_page","lookup_key":"http://a.test/"}})));
    assert_eq!(
        &fake.keys.borrow()[4..],
        &[INDEX_KEY, "runtime/live/browser/a.json"]
    );
    run(loader.prefetch(&fake,&pack,&json!({"type":"event","channel":"manifold.bounty.submit","payload":{"fileId":"id","url":"https://b.test/path"}})));
    assert_eq!(
        fake.keys.borrow().last().unwrap(),
        "runtime/live/browser/b.json"
    );
    assert_eq!(pack.section("browser_pages")[0]["key"], "https://b.test");
    run(loader.prefetch(&fake,&pack,&json!({"type":"event","channel":"manifold.artifacts.fetch","payload":{"artifactType":"browser_page","lookup_key":"https://missing.test"}})));
    assert!(pack.section("browser_pages").is_empty());
}
#[test]
fn live_core_failure_retries_after_sixty_seconds_logs_unavailable_once() {
    let fake = Fake::new();
    let pack = LivePack::empty();
    let mut loader = LivePackLoader::default();
    assert!(!run(loader.core(&fake, &pack, false)));
    assert!(!run(loader.core(&fake, &pack, false)));
    assert_eq!(*fake.keys.borrow(), vec![CORE_KEY]);
    fake.now.set(fake.now.get() + 59_999);
    assert!(!run(loader.core(&fake, &pack, false)));
    fake.now.set(fake.now.get() + 1);
    assert!(!run(loader.core(&fake, &pack, false)));
    assert_eq!(fake.keys.borrow().len(), 2);
    assert_eq!(
        fake.logs
            .borrow()
            .iter()
            .filter(|l| l.contains("archive unavailable"))
            .count(),
        1
    );
    fake.store_json(
        CORE_KEY,
        json!({"facts":{},"browser_pages":["do-not-reside"]}),
    );
    fake.now.set(fake.now.get() + 60_000);
    assert!(run(loader.core(&fake, &pack, false)));
    assert!(!pack.section_loaded("browser_pages"));
}
#[test]
fn prefetch_skips_false_file_ids_nonstring_types_and_non_events() {
    let fake = Fake::new();
    let pack = LivePack::empty();
    let mut loader = LivePackLoader::default();
    for payload in [
        json!({"fileId":false}),
        json!({"fileId":""}),
        json!({"fileId":null}),
        json!({"fileId":0}),
    ] {
        run(loader.prefetch(
            &fake,
            &pack,
            &json!({"type":"event","channel":"manifold.bounty.submit","payload":payload}),
        ));
    }
    run(loader.prefetch(&fake,&pack,&json!({"type":"event","channel":"manifold.artifacts.request","payload":{"artifactType":17}})));
    run(loader.prefetch(
        &fake,
        &pack,
        &json!({"type":"dispatch","channel":"manifold.artifacts.request"}),
    ));
    assert!(fake.keys.borrow().is_empty());
}
#[test]
fn media_joining_during_task_sleep_receives_remaining_frames() {
    let (fake, isolate, object) = setup();
    send(
        &object,
        &fake,
        &isolate,
        1,
        json!({"type":"open_my_web_world"}),
    );
    let grant = fake.last("world_joined")["session"]["mediaGrant"].clone();
    fake.socket(2, "guest-1", "pending_media");
    let chat = object.on_message(&fake, &isolate, &1, Frame::Text(dispatch().to_string()));
    let media = async {
        yield_once().await;
        object
            .on_message(
                &fake,
                &isolate,
                &2,
                Frame::Text(json!({"type":"open_media", "grant":grant}).to_string()),
            )
            .await;
    };
    run(futures_util::future::join(chat, media));
    assert!(fake.binary.borrow().iter().any(|(id, _)| *id == 2));
    assert_eq!(fake.world_puts(), 2);
}

#[test]
fn provider_stream_caps_errors_at_64k_stops_and_reports_truncation() {
    assert_eq!(provider_io::body_cap(400, 1_000_000), 65_536);
    assert_eq!(provider_io::body_cap(500, 100), 100);
    assert_eq!(provider_io::body_cap(200, 1_000_000), 1_000_000);
    let reads = Cell::new(0);
    let chunks = [vec![1; 40_000], vec![2; 40_000], vec![3; 40_000]];
    let stream = futures_util::stream::iter(chunks.into_iter().map(|bytes| {
        reads.set(reads.get() + 1);
        Ok::<_, String>(bytes)
    }));
    let (bytes, truncated) = run(provider_io::read_limited(
        stream,
        provider_io::body_cap(503, 1_000_000),
    ))
    .unwrap();
    assert_eq!(bytes.len(), 65_536);
    assert!(truncated);
    assert_eq!(reads.get(), 2);
    let stream = futures_util::stream::iter([Ok::<_, String>(vec![1, 2])]);
    let (bytes, truncated) = run(provider_io::read_limited(stream, 2)).unwrap();
    assert_eq!(bytes, vec![1, 2]);
    assert!(!truncated);
}

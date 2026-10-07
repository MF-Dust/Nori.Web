use nori_core::{
    config::ServerAi,
    live_pack::LivePack,
    provider::HttpResult,
    session,
    tasks::{Pacing, Step, Task},
    world::{Secrets, World},
};
use serde_json::{json, Value};
use std::sync::Arc;

const PNG: &str =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aF9sAAAAASUVORK5CYII=";
fn world() -> World {
    World::new("test", Some("en"), true, Arc::new(LivePack::empty())).with_pacing(Pacing::Edge)
}
fn ai(provider: &str) -> Value {
    json!({"enabled":true,"provider":provider,"baseUrl":"https://model.example/v1","model":"vision-model","apiKey":"private-key"})
}
fn send(
    world: &mut World,
    channel: &str,
    payload: Value,
    config: Option<Value>,
) -> nori_core::world::Outbound {
    let mut message = json!({"type":"event","channel":channel,"requestId":"req","cartridgeId":"pictionary","payload":payload});
    if let Some(config) = config {
        message["noriAiConfig"] = config;
    }
    let (message, secrets) = session::prepare(&message.to_string(), None).unwrap();
    assert!(message.get("noriAiConfig").is_none());
    session::handle(world, &message, &secrets)
}
fn response(provider: &str, text: &str) -> HttpResult {
    let body = if provider == "anthropic" {
        json!({"content":[{"type":"text","text":text}]})
    } else {
        json!({"choices":[{"message":{"content":text}}]})
    };
    HttpResult::Response {
        status: 200,
        headers: vec![],
        body: serde_json::to_vec(&body).unwrap(),
        truncated: false,
    }
}
fn messages(task: &mut Task, world: &mut World, input: Option<HttpResult>) -> Vec<Value> {
    let mut input = input;
    let mut messages = vec![];
    for _ in 0..12 {
        match task.poll(world, &ServerAi::default(), input.take()) {
            Step::Broadcast(batch) => messages.extend(batch),
            Step::Direct(message) => messages.push(message),
            Step::Spawn(_) => {}
            Step::Done => return messages,
            other => panic!("unexpected {other:?}"),
        }
    }
    panic!("feature did not finish")
}
fn mount_drawing(world: &mut World) -> String {
    session::handle(
        world,
        &json!({"type":"mount_cartridge","cartridgeId":"pictionary","requestId":"mount"}),
        &Secrets::default(),
    );
    world.dispatch_internal("pictionary","player", &json!({"type":"startSession","atMs":0,"settings":{"locale":"en","sessionDurationMs":600000}})).unwrap();
    let state = &mut world.cartridge_mut("pictionary").unwrap().state;
    state["gameState"]["round"]["word"] = json!("cat");
    state["gameState"]["round"]["drawingId"] = json!("secret-do-not-send");
    state["gameState"]["round"]["roundId"]
        .as_str()
        .unwrap()
        .into()
}
fn drawing(round: &str, revision: u64) -> Value {
    json!({"roundId":round,"revision":revision,"image":PNG,"width":1,"height":1})
}

#[test]
fn version_conflict_returns_a_fresh_redacted_snapshot_without_running_the_command() {
    let mut world = world();
    mount_drawing(&mut world);
    let cartridge = world.cartridge_mut("pictionary").unwrap();
    cartridge.state["gameState"]["round"]["roles"] = json!({"drawer":"agent","guesser":"player"});
    let before = cartridge.state.clone();
    let head = cartridge.head_version;
    let out = session::handle(&mut world, &json!({"type":"dispatch","cartridgeId":"pictionary","actor":"player","requestId":"conflict","expectedHeadVersion":head+1,"cmd":{"type":"skipRound","atMs":1}}), &Secrets::default());
    assert_eq!(out.direct[0]["errorCode"], "version_mismatch");
    assert_eq!(out.direct[0]["runtimes"][0]["headVersion"], head);
    let snapshot = &out.direct[0]["runtimes"][0]["state"]["gameState"]["round"];
    assert!(snapshot.get("word").is_none());
    assert!(snapshot.get("drawingId").is_none());
    assert_eq!(world.cartridge("pictionary").unwrap().state, before);
    assert!(out.broadcast.is_empty());
}

#[test]
fn chip_analyzes_visible_content_and_replays_the_real_readout() {
    let mut world = world();
    let payload = json!({"contentKey":"file:test","title":"Letter","content":"The visible letter says the departure is tomorrow."});
    let out = send(
        &mut world,
        "manifold.chip.scan",
        payload.clone(),
        Some(ai("openai-compatible")),
    );
    assert!(out.direct.is_empty());
    let mut task = out.tasks.into_iter().next().unwrap();
    let Step::Http(request) = task.poll(&mut world, &ServerAi::default(), None) else {
        panic!("no AI request")
    };
    let body: Value = serde_json::from_slice(request.body.as_ref().unwrap()).unwrap();
    assert!(body.to_string().contains("departure is tomorrow"));
    assert!(!body.to_string().contains("private-key"));
    let reply = messages(
        &mut task,
        &mut world,
        Some(response(
            "openai-compatible",
            "The letter announces a departure tomorrow.",
        )),
    );
    assert!(reply
        .iter()
        .any(|m| m["channel"] == "manifold.chip.scan.result"
            && m["payload"]["text"] == "The letter announces a departure tomorrow."));
    let replay = send(&mut world, "manifold.chip.scan", payload, None);
    assert!(replay.tasks.is_empty());
    assert_eq!(
        replay.direct[0]["payload"]["text"],
        "The letter announces a departure tomorrow."
    );
    assert!(!world
        .cartridge("manifold.web")
        .unwrap()
        .state
        .to_string()
        .contains("private-key"));
}

#[test]
fn vision_sends_the_png_not_the_answer_for_both_providers() {
    for provider in ["openai-compatible", "anthropic"] {
        let mut world = world();
        let round = mount_drawing(&mut world);
        let out = send(
            &mut world,
            "pictionary.snapshot",
            drawing(&round, 1),
            Some(ai(provider)),
        );
        assert_eq!(out.tasks.len(), 1);
        let mut task = out.tasks.into_iter().next().unwrap();
        assert!(
            send(
                &mut world,
                "pictionary.snapshot",
                drawing(&round, 2),
                Some(ai(provider))
            )
            .tasks
            .is_empty(),
            "only one in-flight request"
        );
        let Step::Http(request) = task.poll(&mut world, &ServerAi::default(), None) else {
            panic!("no vision request")
        };
        let body: Value = serde_json::from_slice(request.body.as_ref().unwrap()).unwrap();
        assert!(body.to_string().contains(PNG));
        assert!(!body.to_string().contains("secret-do-not-send"));
        assert!(!body.to_string().contains("\"word\""));
        assert_eq!(
            request.url,
            format!(
                "https://model.example/v1/{}",
                if provider == "anthropic" {
                    "messages"
                } else {
                    "chat/completions"
                }
            )
        );
        let reply = messages(&mut task, &mut world, Some(response(provider, "cat")));
        assert_eq!(
            world.cartridge("pictionary").unwrap().state["gameState"]["round"]["status"],
            "solved"
        );
        assert!(reply.iter().any(
            |m| m["channel"] == "pictionary.vision.status" && m["payload"]["status"] == "ready"
        ));
        assert!(!world
            .cartridge("pictionary")
            .unwrap()
            .state
            .to_string()
            .contains(PNG));
        assert!(!world
            .cartridge("pictionary")
            .unwrap()
            .state
            .to_string()
            .contains("private-key"));
    }
}

#[test]
fn vision_rejects_invalid_images_and_late_answers_and_reports_no_model() {
    let mut world = world();
    let round = mount_drawing(&mut world);
    let mut invalid = drawing(&round, 1);
    invalid["image"] = json!("not-base64");
    assert!(send(
        &mut world,
        "pictionary.snapshot",
        invalid,
        Some(ai("openai-compatible"))
    )
    .tasks
    .is_empty());
    let mut task = send(&mut world, "pictionary.snapshot", drawing(&round, 1), None)
        .tasks
        .remove(0);
    let reply = messages(&mut task, &mut world, None);
    assert_eq!(reply[0]["payload"]["status"], "unconfigured");
    assert!(
        world.cartridge("pictionary").unwrap().state["gameState"]["round"]["lastGuess"].is_null()
    );
    // Fresh world: a response from a skipped round must not mutate the next one.
    let mut world = crate::world();
    let round = mount_drawing(&mut world);
    let mut task = send(
        &mut world,
        "pictionary.snapshot",
        drawing(&round, 1),
        Some(ai("openai-compatible")),
    )
    .tasks
    .remove(0);
    assert!(matches!(
        task.poll(&mut world, &ServerAi::default(), None),
        Step::Http(_)
    ));
    world
        .dispatch_internal(
            "pictionary",
            "player",
            &json!({"type":"skipRound","atMs":1}),
        )
        .unwrap();
    assert!(matches!(
        task.poll(
            &mut world,
            &ServerAi::default(),
            Some(response("openai-compatible", "cat"))
        ),
        Step::Done
    ));
    assert!(
        world.cartridge("pictionary").unwrap().state["gameState"]["round"]["lastGuess"].is_null()
    );
}

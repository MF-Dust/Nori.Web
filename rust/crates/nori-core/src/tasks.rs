//! Sans-IO follow-up work (Python `WorldSession._spawn` coroutines).
//!
//! A client dispatch can schedule work that outlives the request: the chat
//! reply, speech, audio-progress fallbacks, opponent turns and the next
//! Pictionary round. Each [`Task`] is a small state machine. The host drives
//! it by calling [`Task::poll`] with the world locked, then performs the
//! returned [`Step`] without holding the lock (sleep, HTTP, socket sends) and
//! polls again. Pacing differences between the local server and the edge are
//! decided when the task is created, so hosts never re-implement them.

use crate::cartridges::{cakeduel, chat, pictionary};
use crate::config::ServerAi;
use crate::jsonutil::{now_ms, Json};
use crate::provider::{HttpRequest, HttpResult};
use crate::world::{Secrets, World};
use serde_json::{json, Value};
use std::collections::VecDeque;
use std::sync::{Arc, Weak};

/// Which runtime is executing the tasks.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Pacing {
    /// Local server: keeps the human-facing presentation delays.
    Local,
    /// Edge Durable Object: drops presentation-only waits (Python
    /// `cloudflare/entry.py` overrides) but keeps audio-progress fallbacks.
    Edge,
}

/// What the host must do next for a task.
#[derive(Debug)]
pub enum Step {
    /// Wait, then poll again. `0` means "yield once".
    Sleep(u64),
    /// Perform the request and poll again with its result.
    Http(HttpRequest),
    /// Send to every main socket of the world, in order.
    Broadcast(Vec<Json>),
    /// Send one binary frame to every media socket of the world.
    Media(Vec<u8>),
    /// Send to the socket whose frame created this task.
    Direct(Json),
    /// Start another task concurrently.
    Spawn(Task),
    Done,
}

const AGENT_TURN_LIMIT: u8 = 64;

pub struct Task {
    world_id: String,
    pacing: Pacing,
    pending: VecDeque<Step>,
    kind: Kind,
    agent_loop: Option<Arc<()>>,
}

enum Kind {
    ChatReply {
        user_text: String,
        secrets: Secrets,
        stage: u8,
        flow: Option<Box<crate::llm::ReplyFlow>>,
    },
    Speak {
        operation_id: String,
        message_id: String,
        text: String,
        tts: Option<Json>,
        stage: u8,
        flow: Option<Box<crate::tts::SynthFlow>>,
        frames: VecDeque<Vec<u8>>,
    },
    EnsureProgress {
        operation_id: String,
        stage: u8,
    },
    SettleChat {
        operation_id: String,
        stage: u8,
    },
    AgentTurns {
        cartridge_id: String,
        turns: u8,
        slept: bool,
    },
    PictionaryNext {
        stage: u8,
    },
    /// Nori guessing the player's drawing, one round at a time.
    PictionaryGuess {
        round_id: String,
        tried: Vec<String>,
        slept: bool,
    },
    Probe {
        flow: Box<Probe>,
        stage: u8,
    },
}

pub(crate) enum Probe {
    /// `nori.ai.test`: the flow is built on first poll (needs server config).
    Ai {
        payload: Json,
        flow: Option<crate::llm::ProbeFlow>,
        cartridge_id: Json,
        request_id: Json,
    },
    /// `nori.tts.test`.
    Tts {
        flow: crate::tts::SynthFlow,
        cartridge_id: Json,
        request_id: Json,
    },
}

impl std::fmt::Debug for Task {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("Task")
            .field("kind", &self.label())
            .field("world_id", &self.world_id)
            .field("pacing", &self.pacing)
            .finish()
    }
}

impl Task {
    fn new(world: &World, pacing: Pacing, kind: Kind) -> Self {
        Task {
            world_id: world.world_id.clone(),
            pacing,
            pending: VecDeque::new(),
            agent_loop: matches!(
                &kind,
                Kind::AgentTurns { .. } | Kind::PictionaryGuess { .. }
            )
            .then(|| Arc::new(())),
            kind,
        }
    }

    pub fn chat_reply(world: &World, pacing: Pacing, user_text: String, secrets: Secrets) -> Self {
        Self::new(
            world,
            pacing,
            Kind::ChatReply {
                user_text,
                secrets,
                stage: 0,
                flow: None,
            },
        )
    }

    pub fn settle_chat(world: &World, pacing: Pacing, operation_id: String) -> Self {
        Self::new(
            world,
            pacing,
            Kind::SettleChat {
                operation_id,
                stage: 0,
            },
        )
    }

    pub fn agent_turns(world: &World, pacing: Pacing, cartridge_id: String) -> Self {
        Self::new(
            world,
            pacing,
            Kind::AgentTurns {
                cartridge_id,
                turns: 0,
                slept: false,
            },
        )
    }

    pub fn pictionary_next(world: &World, pacing: Pacing) -> Self {
        Self::new(world, pacing, Kind::PictionaryNext { stage: 0 })
    }

    pub fn pictionary_guess(world: &World, pacing: Pacing, round_id: String) -> Self {
        Self::new(
            world,
            pacing,
            Kind::PictionaryGuess {
                round_id,
                tried: Vec::new(),
                slept: false,
            },
        )
    }

    fn speak(
        world: &World,
        pacing: Pacing,
        operation_id: String,
        message_id: String,
        text: String,
        tts: Option<Json>,
    ) -> Self {
        Self::new(
            world,
            pacing,
            Kind::Speak {
                operation_id,
                message_id,
                text,
                tts,
                stage: 0,
                flow: None,
                frames: VecDeque::new(),
            },
        )
    }

    fn ensure_progress(world: &World, pacing: Pacing, operation_id: String) -> Self {
        Self::new(
            world,
            pacing,
            Kind::EnsureProgress {
                operation_id,
                stage: 0,
            },
        )
    }

    /// Python `ai_event_bridge` `nori.ai.test`: probe the provider and reply
    /// `nori.ai.test.result` on the requesting socket.
    pub fn ai_test(
        world: &World,
        pacing: Pacing,
        payload: Json,
        cartridge_id: Json,
        request_id: Json,
    ) -> Self {
        Self::new(
            world,
            pacing,
            Kind::Probe {
                flow: Box::new(Probe::Ai {
                    payload,
                    flow: None,
                    cartridge_id,
                    request_id,
                }),
                stage: 0,
            },
        )
    }

    /// Python `ai_event_bridge` `nori.tts.test`: synthesize and reply
    /// `nori.tts.audio` / `nori.tts.error` on the requesting socket.
    pub fn tts_test(
        world: &World,
        pacing: Pacing,
        payload: &Json,
        cartridge_id: Json,
        request_id: Json,
    ) -> Self {
        let flow = crate::tts::test_flow(payload);
        Self::new(
            world,
            pacing,
            Kind::Probe {
                flow: Box::new(Probe::Tts {
                    flow,
                    cartridge_id,
                    request_id,
                }),
                stage: 0,
            },
        )
    }

    /// Agent-turn loops are deduplicated per cartridge (Python `_agent_tasks`).
    pub fn agent_cartridge(&self) -> Option<&str> {
        match &self.kind {
            Kind::AgentTurns { cartridge_id, .. } => Some(cartridge_id),
            _ => None,
        }
    }

    /// Weak registration expires on completion or when any host drops the task.
    pub(crate) fn agent_loop_lease(&self) -> Weak<()> {
        Arc::downgrade(self.agent_loop.as_ref().expect("agent task lease"))
    }

    pub fn label(&self) -> &'static str {
        match self.kind {
            Kind::ChatReply { .. } => "chat_reply",
            Kind::Speak { .. } => "speak",
            Kind::EnsureProgress { .. } => "ensure_chat_progress",
            Kind::SettleChat { .. } => "settle_chat",
            Kind::AgentTurns { .. } => "agent_turns",
            Kind::PictionaryNext { .. } => "pictionary_next_round",
            Kind::PictionaryGuess { .. } => "pictionary_guess",
            Kind::Probe { .. } => "probe",
        }
    }

    /// Advance the task. `input` carries the result of the previous
    /// [`Step::Http`] and must be `None` otherwise.
    pub fn poll(
        &mut self,
        world: &mut World,
        server_ai: &ServerAi,
        input: Option<HttpResult>,
    ) -> Step {
        let mut input = input;
        loop {
            let step = match self.pending.pop_front() {
                Some(step) => step,
                None => self.advance(world, server_ai, input.take()),
            };
            match step {
                // Nothing to send; keep the state machine moving.
                Step::Broadcast(messages) if messages.is_empty() => continue,
                Step::Done => {
                    self.agent_loop.take();
                    return Step::Done;
                }
                other => return other,
            }
        }
    }

    fn advance(
        &mut self,
        world: &mut World,
        server_ai: &ServerAi,
        input: Option<HttpResult>,
    ) -> Step {
        // A reset replaced the world; Python's orphaned coroutine would keep
        // mutating the old object, which nobody observes any more.
        if world.world_id != self.world_id {
            return Step::Done;
        }
        let pacing = self.pacing;
        let pending = &mut self.pending;
        match &mut self.kind {
            Kind::ChatReply {
                user_text,
                secrets,
                stage,
                flow,
            } => poll_chat_reply(
                world, pacing, server_ai, user_text, secrets, stage, flow, input, pending,
            ),
            Kind::Speak {
                operation_id,
                message_id,
                text,
                tts,
                stage,
                flow,
                frames,
            } => poll_speak(
                world,
                operation_id,
                message_id,
                text,
                tts,
                stage,
                flow,
                frames,
                input,
                pending,
            ),
            Kind::EnsureProgress {
                operation_id,
                stage,
            } => poll_ensure_progress(world, operation_id, stage, pending),
            Kind::SettleChat {
                operation_id,
                stage,
            } => {
                if *stage == 0 && pacing == Pacing::Local {
                    *stage = 1;
                    return Step::Sleep(100);
                }
                pending.push_back(Step::Done);
                Step::Broadcast(settle(world, operation_id))
            }
            Kind::AgentTurns {
                cartridge_id,
                turns,
                slept,
            } => poll_agent_turns(world, pacing, cartridge_id, turns, slept),
            Kind::PictionaryNext { stage } => {
                if *stage == 0 && pacing == Pacing::Local {
                    *stage = 1;
                    return Step::Sleep(1200);
                }
                let messages = world.pictionary_next_round();
                pending.extend(
                    world
                        .schedule_pictionary_guess()
                        .into_iter()
                        .map(Step::Spawn),
                );
                pending.push_back(Step::Done);
                Step::Broadcast(messages)
            }
            Kind::PictionaryGuess {
                round_id,
                tried,
                slept,
            } => poll_pictionary_guess(world, pacing, round_id, tried, slept, pending),
            Kind::Probe { flow, stage } => poll_probe(world, server_ai, flow, stage, input),
        }
    }
}

fn settle(world: &mut World, operation_id: &str) -> Vec<Json> {
    world
        .dispatch_internal("chat", "agent", &json!({"type": "operationSettled", "operationId": operation_id, "outcome": "completed"}))
        .map(|(_, messages)| messages)
        .unwrap_or_default()
}

#[allow(clippy::too_many_arguments)]
fn poll_chat_reply(
    world: &mut World,
    pacing: Pacing,
    server_ai: &ServerAi,
    user_text: &str,
    secrets: &Secrets,
    stage: &mut u8,
    flow: &mut Option<Box<crate::llm::ReplyFlow>>,
    input: Option<HttpResult>,
    pending: &mut VecDeque<Step>,
) -> Step {
    use crate::provider::FlowStep;
    if *stage == 0 {
        *stage = 1;
        if pacing == Pacing::Local {
            // 150 ms of theatrical latency before generation (local only).
            return Step::Sleep(150);
        }
    }
    let outcome = if *stage == 1 {
        *stage = 2;
        let history = world
            .cartridge("chat")
            .map(|c| chat::history(&c.state))
            .unwrap_or_default();
        let mut reply_flow = Box::new(crate::llm::ReplyFlow::new(
            user_text,
            &history,
            secrets.ai.as_ref(),
            server_ai,
        ));
        let step = reply_flow.start();
        *flow = Some(reply_flow);
        step
    } else {
        match (flow.as_mut(), input) {
            (Some(reply_flow), Some(result)) => reply_flow.resume(result),
            _ => return Step::Done,
        }
    };
    let reply = match outcome {
        FlowStep::Http(request) => return Step::Http(request),
        FlowStep::Done(reply) => reply,
    };
    let (operation_id, message_id, commands) = chat::build_agent_turn(&reply.text, &reply.emotion);
    let mut messages = Vec::new();
    for command in commands {
        if let Some((_, emitted)) = world.dispatch_internal("chat", "agent", &command) {
            messages.extend(emitted);
        }
    }
    pending.push_back(Step::Broadcast(messages));
    let text_mode = world
        .cartridge("chat")
        .map(|c| chat::presentation_mode(&c.state) == "text")
        .unwrap_or(false);
    let tts_enabled = secrets
        .tts
        .as_ref()
        .and_then(|c| c.get("enabled"))
        .and_then(Value::as_bool)
        == Some(true);
    if pacing == Pacing::Edge && text_mode {
        // Text is visible after ingestBlock; only an enabled TTS still speaks.
        if tts_enabled {
            pending.push_back(Step::Spawn(Task::speak(
                world,
                pacing,
                operation_id.clone(),
                message_id,
                reply.text.clone(),
                secrets.tts.clone(),
            )));
        }
        pending.push_back(Step::Broadcast(settle(world, &operation_id)));
    } else {
        pending.push_back(Step::Spawn(Task::speak(
            world,
            pacing,
            operation_id.clone(),
            message_id,
            reply.text.clone(),
            secrets.tts.clone(),
        )));
        pending.push_back(Step::Spawn(Task::ensure_progress(
            world,
            pacing,
            operation_id,
        )));
    }
    pending.push_back(Step::Done);
    pending.pop_front().unwrap_or(Step::Done)
}

#[allow(clippy::too_many_arguments)]
fn poll_speak(
    world: &mut World,
    operation_id: &str,
    message_id: &str,
    text: &str,
    tts: &Option<Json>,
    stage: &mut u8,
    flow: &mut Option<Box<crate::tts::SynthFlow>>,
    frames: &mut VecDeque<Vec<u8>>,
    input: Option<HttpResult>,
    pending: &mut VecDeque<Step>,
) -> Step {
    use crate::provider::FlowStep;
    const START: u8 = 0;
    const SYNTH: u8 = 1;
    let step = match *stage {
        START => {
            let enabled = tts
                .as_ref()
                .and_then(|c| c.get("enabled"))
                .and_then(Value::as_bool)
                == Some(true);
            match tts.as_ref().filter(|_| enabled) {
                // Python `tts_world_bridge`: configured TTS replaces the tones.
                Some(config) => {
                    *stage = SYNTH;
                    let mut synth = Box::new(crate::tts::SynthFlow::new(text, config));
                    let step = synth.start();
                    *flow = Some(synth);
                    Some(step)
                }
                None => {
                    start_tones(world, operation_id, message_id, text, stage, frames);
                    None
                }
            }
        }
        SYNTH => match (flow.as_mut(), input) {
            (Some(synth), Some(result)) => Some(synth.resume(result)),
            _ => return Step::Done,
        },
        _ => None,
    };
    match step {
        Some(FlowStep::Http(request)) => return Step::Http(request),
        Some(FlowStep::Done(result)) => {
            return speech_outcome(
                world,
                operation_id,
                message_id,
                text,
                stage,
                frames,
                result,
                pending,
            )
        }
        None => {}
    }
    // Python sleeps 0.14 s after every frame, including the last one.
    match frames.pop_front() {
        Some(frame) => {
            pending.push_back(Step::Sleep(140));
            Step::Media(frame)
        }
        None => Step::Done,
    }
}

fn start_tones(
    world: &mut World,
    operation_id: &str,
    message_id: &str,
    text: &str,
    stage: &mut u8,
    frames: &mut VecDeque<Vec<u8>>,
) {
    frames.extend(world.stream_fallback(operation_id, message_id, text));
    *stage = 2;
}

#[allow(clippy::too_many_arguments)]
fn speech_outcome(
    world: &mut World,
    operation_id: &str,
    message_id: &str,
    text: &str,
    stage: &mut u8,
    frames: &mut VecDeque<Vec<u8>>,
    result: Result<crate::tts::Speech, crate::tts::TtsError>,
    pending: &mut VecDeque<Step>,
) -> Step {
    // Python `tts_world_bridge`: broadcast the outcome; on failure still play
    // the fallback tones so the user is never left in silence.
    let (channel, payload) = crate::tts::chat_result_payload(&result, operation_id, message_id);
    let message = json!({"type": "event", "worldId": world.world_id, "cartridgeId": "chat", "channel": channel, "payload": payload});
    if result.is_ok() {
        pending.push_back(Step::Done);
    } else {
        start_tones(world, operation_id, message_id, text, stage, frames);
    }
    Step::Broadcast(vec![message])
}

fn poll_ensure_progress(
    world: &mut World,
    operation_id: &str,
    stage: &mut u8,
    pending: &mut VecDeque<Step>,
) -> Step {
    // Python `_ensure_chat_progress` (kept at the edge too).
    let through = |world: &World, key: &str| -> Option<i64> {
        let op = world
            .cartridge("chat")?
            .state
            .get("operations")?
            .get(operation_id)?;
        if op.is_null() || op.as_object().is_some_and(|m| m.is_empty()) {
            return None;
        }
        Some(op.get(key).and_then(Value::as_i64).unwrap_or(-1))
    };
    let dispatch = |world: &mut World, cmd: Json| {
        world
            .dispatch_internal("chat", "agent", &cmd)
            .map(|(_, m)| m)
            .unwrap_or_default()
    };
    *stage += 1;
    match *stage {
        1 => Step::Sleep(1100),
        2 => {
            pending.push_back(Step::Sleep(450));
            if through(world, "startedThrough").is_some_and(|v| v < 0) {
                Step::Broadcast(dispatch(
                    world,
                    json!({"type": "audioStarted", "operationId": operation_id, "blockId": 0}),
                ))
            } else {
                Step::Broadcast(Vec::new())
            }
        }
        3 => {
            pending.push_back(Step::Sleep(100));
            if through(world, "presentedThrough").is_some_and(|v| v < 0) {
                Step::Broadcast(dispatch(
                    world,
                    json!({"type": "audioDone", "operationId": operation_id, "blockId": 0}),
                ))
            } else {
                Step::Broadcast(Vec::new())
            }
        }
        4 => {
            pending.push_back(Step::Done);
            Step::Broadcast(settle(world, operation_id))
        }
        _ => Step::Done,
    }
}

fn poll_agent_turns(
    world: &mut World,
    pacing: Pacing,
    cartridge_id: &str,
    turns: &mut u8,
    slept: &mut bool,
) -> Step {
    if !*slept {
        *slept = true;
        // Local: 350 ms per opponent turn. Edge: cooperative yield only.
        return Step::Sleep(if pacing == Pacing::Local { 350 } else { 0 });
    }
    *slept = false;
    *turns += 1;
    let recover = *turns >= AGENT_TURN_LIMIT;
    if recover {
        // A safety budget must yield a legal pass/endTurn, not strand a turn.
        // If recovery is unavailable (e.g. giving a clue), keep playing.
        *turns = 0;
    }
    match world.agent_step_with_recovery(cartridge_id, recover) {
        Some(messages) => Step::Broadcast(messages),
        None => Step::Done,
    }
}

/// Pause before each guess, so the player has time to draw.
const PICTIONARY_FIRST_GUESS_MS: u64 = 9_000;
const PICTIONARY_GUESS_INTERVAL_MS: u64 = 7_000;

fn poll_pictionary_guess(
    world: &mut World,
    pacing: Pacing,
    round_id: &str,
    tried: &mut Vec<String>,
    slept: &mut bool,
    pending: &mut VecDeque<Step>,
) -> Step {
    let state = |world: &World| world.cartridge("pictionary").map(|c| c.state.clone());
    let Some(current) = state(world) else {
        return Step::Done;
    };
    if pictionary::agent_guess(&current, round_id, tried, 0).is_none() {
        return Step::Done;
    }
    if !*slept {
        *slept = true;
        // Guess pacing is gameplay, not presentation: the edge keeps it too.
        return Step::Sleep(if tried.is_empty() {
            PICTIONARY_FIRST_GUESS_MS
        } else {
            PICTIONARY_GUESS_INTERVAL_MS
        });
    }
    *slept = false;
    let Some(command) = pictionary::agent_guess(&current, round_id, tried, now_ms()) else {
        return Step::Done;
    };
    tried.push(command["text"].as_str().unwrap_or_default().to_string());
    let Some((_, messages)) = world.dispatch_internal("pictionary", "agent", &command) else {
        return Step::Done;
    };
    let solved = state(world).is_some_and(|s| pictionary::agent_guess_round(&s).is_none());
    if solved {
        // Mirror the player's submitGuess follow-up: queue the next round.
        pending.push_back(Step::Spawn(Task::pictionary_next(world, pacing)));
        pending.push_back(Step::Done);
    }
    Step::Broadcast(messages)
}

fn poll_probe(
    world: &mut World,
    server_ai: &ServerAi,
    probe: &mut Probe,
    stage: &mut u8,
    input: Option<HttpResult>,
) -> Step {
    use crate::provider::FlowStep;
    let first = *stage == 0;
    *stage = 1;
    match probe {
        Probe::Ai {
            payload,
            flow,
            cartridge_id,
            request_id,
        } => {
            let step = match (flow.as_mut(), input) {
                (None, _) if first => flow
                    .insert(crate::llm::test_flow(payload, server_ai))
                    .start(),
                (Some(probe_flow), Some(result)) => probe_flow.resume(result),
                _ => return Step::Done,
            };
            match step {
                FlowStep::Http(request) => Step::Http(request),
                FlowStep::Done(result) => {
                    let message = crate::world::event_message(
                        world,
                        "nori.ai.test.result",
                        result,
                        cartridge_id.clone(),
                        request_id.clone(),
                    );
                    Step::Direct(message)
                }
            }
        }
        Probe::Tts {
            flow,
            cartridge_id,
            request_id,
        } => {
            let step = match input {
                None if first => flow.start(),
                Some(result) => flow.resume(result),
                None => return Step::Done,
            };
            match step {
                FlowStep::Http(request) => Step::Http(request),
                FlowStep::Done(result) => {
                    let (channel, payload) = crate::tts::test_result_payload(&result);
                    Step::Direct(crate::world::event_message(
                        world,
                        channel,
                        payload,
                        cartridge_id.clone(),
                        request_id.clone(),
                    ))
                }
            }
        }
    }
}

/// Python `_start_next_pictionary_round` guard and dispatch.
pub(crate) fn pictionary_due(state: &Json) -> bool {
    let Some(game) = state.get("gameState").filter(|g| g.is_object()) else {
        return false;
    };
    if game.get("phase").and_then(Value::as_str) != Some("PLAYING") {
        return false;
    }
    match game.get("round") {
        None => true,
        // `game.get("round", {})` returns None for an explicit null and the
        // following `.get` raises, so no round starts.
        Some(Value::Null) => false,
        Some(round) => round.get("status").and_then(Value::as_str) != Some("active"),
    }
}

pub(crate) fn pictionary_command() -> Json {
    json!({"type": "startNextRound", "atMs": now_ms()})
}

/// Python `_cakeduel_recovery_command` / `_agent_recovery_command`.
pub(crate) fn recovery_command(cartridge_id: &str, state: &Json) -> Option<Json> {
    match cartridge_id {
        "cakeduel" => cakeduel::recovery_command(state),
        "codenames" => {
            let game = state.get("gameState")?;
            let agent_side = state.get("agentSide")?.as_str()?;
            let turn = game.get("history")?.as_array()?.last()?;
            (game.get("phase")?.as_str()? == "NORMAL"
                && turn.get("endedBy")?.is_null()
                && turn.get("clueGiver")?.as_str()? != agent_side
                && !turn.get("guesses")?.as_array()?.is_empty())
            .then(|| json!({"type": "endTurn"}))
        }
        _ => None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::cartridge;
    use crate::live_pack::LivePack;
    use std::sync::Arc;

    #[test]
    fn agent_budget_recovers_without_dropping_pending_actions() {
        for already_guessed in [false, true] {
            let mut world = World::new("guest", Some("en"), true, Arc::new(LivePack::empty()))
                .with_pacing(Pacing::Edge);
            world
                .cartridges
                .push(cartridge::create("codenames", true, &world.pack).unwrap());
            world
                .dispatch_internal(
                    "codenames",
                    "player",
                    &json!({"type": "startGame", "settings": {"seed": 42}}),
                )
                .unwrap();
            world.cartridge_mut("codenames").unwrap().state["gameState"]["key"] =
                json!({"A": vec!["AGENT"; 25], "B": vec!["AGENT"; 25]});
            world
                .dispatch_internal(
                    "codenames",
                    "player",
                    &json!({"type": "submitClue", "clue": {"word": "NORI", "count": "infinity"}}),
                )
                .unwrap();
            if already_guessed {
                world
                    .dispatch_internal(
                        "codenames",
                        "agent",
                        &json!({"type": "submitGuess", "cell": 0}),
                    )
                    .unwrap();
            }
            let mut turns = AGENT_TURN_LIMIT - 1;
            let mut slept = true;
            let Step::Broadcast(messages) = poll_agent_turns(
                &mut world,
                Pacing::Edge,
                "codenames",
                &mut turns,
                &mut slept,
            ) else {
                panic!("the budget must not finish a pending turn");
            };
            assert_eq!(
                messages[0]["transition"]["cmd"]["type"],
                if already_guessed {
                    "endTurn"
                } else {
                    "submitGuess"
                }
            );
            assert_eq!(turns, 0);
            if already_guessed {
                assert!(matches!(
                    poll_agent_turns(
                        &mut world,
                        Pacing::Edge,
                        "codenames",
                        &mut turns,
                        &mut slept
                    ),
                    Step::Sleep(0)
                ));
                let Step::Broadcast(messages) = poll_agent_turns(
                    &mut world,
                    Pacing::Edge,
                    "codenames",
                    &mut turns,
                    &mut slept,
                ) else {
                    panic!("recovery must continue to the agent's clue");
                };
                assert_eq!(messages[0]["transition"]["cmd"]["type"], "submitClue");
            }
        }
    }
}

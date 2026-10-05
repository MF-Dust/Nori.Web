use crate::jsonutil::Json;
use crate::live_pack::LivePack;
use serde_json::{json, Map, Value};
use std::fmt;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CommandRejected(pub String);

impl fmt::Display for CommandRejected {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(&self.0)
    }
}

impl CommandRejected {
    pub fn new(message: impl Into<String>) -> Self {
        Self(message.into())
    }
}

#[derive(Clone, Debug)]
pub struct ReducerResult {
    pub state: Json,
    pub result: Json,
    pub events: Vec<Json>,
}

impl ReducerResult {
    pub fn new(state: Json, result: Json, events: Vec<Json>) -> Self {
        Self {
            state,
            result,
            events,
        }
    }

    pub fn ok(state: Json, result: Json) -> Self {
        Self::new(state, result, Vec::new())
    }
}

/// Why a dispatch did not commit.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum DispatchError {
    /// Reducer rejected the command (wire `command_rejected`, message verbatim).
    Rejected(String),
    /// Runtime fault such as an event without `type` (Python `ValueError`);
    /// wire `dispatch_error` / "Local runtime dispatch error".
    Internal(String),
}

impl From<CommandRejected> for DispatchError {
    fn from(value: CommandRejected) -> Self {
        DispatchError::Rejected(value.0)
    }
}

#[derive(Clone, Debug)]
pub struct Commit {
    pub committed: bool,
    pub version: u64,
    pub transition: Option<Json>,
    pub result: Json,
}

fn escape_token(token: &str) -> String {
    token.replace('~', "~0").replace('/', "~1")
}

pub fn top_level_patch(before: &Json, after: &Json) -> Vec<Json> {
    let Some(before_obj) = before.as_object() else {
        return vec![json!({"op": "replace", "path": "", "value": after})];
    };
    let Some(after_obj) = after.as_object() else {
        return vec![json!({"op": "replace", "path": "", "value": after})];
    };
    let mut patches = Vec::new();
    let mut removed: Vec<&String> = before_obj
        .keys()
        .filter(|k| !after_obj.contains_key(*k))
        .collect();
    removed.sort();
    for key in removed {
        patches.push(json!({"op": "remove", "path": format!("/{}", escape_token(key))}));
    }
    let mut added: Vec<&String> = after_obj
        .keys()
        .filter(|k| !before_obj.contains_key(*k))
        .collect();
    added.sort();
    for key in added {
        patches.push(json!({
            "op": "add",
            "path": format!("/{}", escape_token(key)),
            "value": after_obj[key],
        }));
    }
    let mut shared: Vec<&String> = before_obj
        .keys()
        .filter(|k| after_obj.contains_key(*k))
        .collect();
    shared.sort();
    for key in shared {
        if before_obj[key] != after_obj[key] {
            patches.push(json!({
                "op": "replace",
                "path": format!("/{}", escape_token(key)),
                "value": after_obj[key],
            }));
        }
    }
    patches
}

#[derive(Clone, Debug)]
pub struct Cartridge {
    pub id: String,
    pub initial_state: Json,
    pub state: Json,
    pub head_version: u64,
    pub visible_version: u64,
}

impl Cartridge {
    pub fn new(id: impl Into<String>, initial_state: Json) -> Self {
        Self {
            id: id.into(),
            state: initial_state.clone(),
            initial_state,
            head_version: 0,
            visible_version: 0,
        }
    }

    pub fn snapshot(&self, fence: &str) -> Json {
        json!({
            "visibilityFenceId": fence,
            "headVersion": self.head_version,
            "visibleVersion": self.visible_version,
            "state": self.state,
        })
    }

    pub fn dispatch(
        &mut self,
        actor: &str,
        cmd: &Json,
        pack: &LivePack,
    ) -> Result<Commit, DispatchError> {
        if actor.is_empty() {
            return Err(CommandRejected::new("actor is required").into());
        }
        // Python only requires a string type here; empty types reach the reducer.
        if !cmd.get("type").is_some_and(Value::is_string) {
            return Err(CommandRejected::new("cmd.type is required").into());
        }
        let reduced = reduce(self.id.as_str(), &self.state, actor, cmd, pack)?;
        self.commit(actor, cmd, reduced)
    }

    fn commit(
        &mut self,
        actor: &str,
        cmd: &Json,
        reduced: ReducerResult,
    ) -> Result<Commit, DispatchError> {
        for event in &reduced.events {
            if !event
                .get("type")
                .and_then(Value::as_str)
                .is_some_and(|t| !t.is_empty())
            {
                return Err(DispatchError::Internal(format!(
                    "{}: transition event requires a type",
                    self.id
                )));
            }
        }
        let patches = top_level_patch(&self.state, &reduced.state);
        if patches.is_empty() && reduced.events.is_empty() {
            return Ok(Commit {
                committed: false,
                version: self.head_version,
                transition: None,
                result: reduced.result,
            });
        }
        let version = self.head_version + 1;
        let events: Vec<Json> = reduced
            .events
            .into_iter()
            .enumerate()
            .map(|(index, mut event)| {
                if let Some(obj) = event.as_object_mut() {
                    obj.insert("version".into(), json!(version));
                    obj.insert("index".into(), json!(index));
                }
                event
            })
            .collect();
        let transition = json!({
            "actor": actor,
            "cmd": cmd,
            "patches": patches,
            "events": events,
        });
        self.state = reduced.state;
        self.head_version = version;
        self.visible_version = version;
        Ok(Commit {
            committed: true,
            version,
            transition: Some(transition),
            result: reduced.result,
        })
    }
}

pub fn reduce(
    id: &str,
    state: &Json,
    actor: &str,
    cmd: &Json,
    pack: &LivePack,
) -> Result<ReducerResult, DispatchError> {
    match id {
        "chat" => crate::cartridges::chat::reduce(state, actor, cmd).map_err(DispatchError::from),
        "cakeduel" => {
            crate::cartridges::cakeduel::reduce(state, actor, cmd).map_err(DispatchError::from)
        }
        "codenames" => {
            crate::cartridges::codenames::reduce(state, actor, cmd).map_err(DispatchError::from)
        }
        "chess" => crate::cartridges::chess::reduce(state, actor, cmd).map_err(DispatchError::from),
        "pictionary" => {
            crate::cartridges::pictionary::reduce(state, actor, cmd).map_err(DispatchError::from)
        }
        "manifold.web" => crate::cartridges::manifold::reduce(state, actor, cmd, pack),
        _ => Err(CommandRejected::new(format!("Unknown cartridge: {id}")).into()),
    }
}

pub fn create(id: &str, full_unlock: bool, pack: &LivePack) -> Option<Cartridge> {
    let state = match id {
        "chat" => crate::cartridges::chat::initial_state(pack.is_available()),
        "cakeduel" => crate::cartridges::cakeduel::initial_state(),
        "codenames" => crate::cartridges::codenames::initial_state(),
        "chess" => crate::cartridges::chess::initial_state(),
        "pictionary" => crate::cartridges::pictionary::initial_state(),
        "manifold.web" => crate::cartridges::manifold::initial_state(full_unlock, pack),
        _ => return None,
    };
    Some(Cartridge::new(id, state))
}

pub fn default_cartridges(full_unlock: bool, pack: &LivePack) -> Vec<Cartridge> {
    ["chat", "manifold.web"]
        .into_iter()
        .filter_map(|id| create(id, full_unlock, pack))
        .collect()
}

/// Registered cartridge ids (Python `CartridgeRegistry.list_available`).
pub const AVAILABLE: [&str; 6] = [
    "chat",
    "cakeduel",
    "codenames",
    "chess",
    "manifold.web",
    "pictionary",
];

pub fn agent_command(id: &str, state: &Json) -> Option<Json> {
    match id {
        "cakeduel" => crate::cartridges::cakeduel::agent_next_command(state),
        "codenames" => crate::cartridges::codenames::agent_next_command(state),
        "chess" => crate::cartridges::chess::agent_next_command(state),
        _ => None,
    }
}

pub fn object_insert(state: &mut Json, key: &str, value: Json) {
    if let Some(map) = state.as_object_mut() {
        map.insert(key.into(), value);
    }
}

pub fn ensure_object(value: &Json) -> &Map<String, Value> {
    value.as_object().expect("object")
}

//! Server-side configuration read by the hosts and passed into the core.

/// Host-provided environment lookup (`std::env::var` locally, Worker
/// vars/secrets at the edge). Blank values count as unset.
pub fn read_env(lookup: &dyn Fn(&str) -> Option<String>, key: &str) -> Option<String> {
    lookup(key).map(|v| v.trim().to_string()).filter(|v| !v.is_empty())
}

/// Server default LLM credentials (Python `backend/core/config.py`).
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ServerAi {
    pub openai_api_key: String,
    pub openai_base_url: String,
    pub openai_model: String,
    pub anthropic_api_key: String,
    pub anthropic_model: String,
}

impl Default for ServerAi {
    fn default() -> Self {
        Self {
            openai_api_key: String::new(),
            openai_base_url: "https://api.openai.com/v1".into(),
            openai_model: "gpt-4o-mini".into(),
            anthropic_api_key: String::new(),
            anthropic_model: "claude-3-5-sonnet-20241022".into(),
        }
    }
}

impl ServerAi {
    pub fn from_env(lookup: &dyn Fn(&str) -> Option<String>) -> Self {
        let defaults = Self::default();
        Self {
            openai_api_key: read_env(lookup, "OPENAI_API_KEY").unwrap_or_default(),
            openai_base_url: read_env(lookup, "OPENAI_BASE_URL").unwrap_or(defaults.openai_base_url),
            openai_model: read_env(lookup, "OPENAI_MODEL").unwrap_or(defaults.openai_model),
            anthropic_api_key: read_env(lookup, "ANTHROPIC_API_KEY").unwrap_or_default(),
            anthropic_model: read_env(lookup, "ANTHROPIC_MODEL").unwrap_or(defaults.anthropic_model),
        }
    }
}

/// Truthy flag parsing shared by `DEBUG`, `NORI_DISABLE_LIVE_PACK`, ...
pub fn env_flag(value: Option<&str>) -> bool {
    matches!(value.map(|v| v.trim().to_ascii_lowercase()).as_deref(), Some("1" | "true" | "yes" | "on"))
}

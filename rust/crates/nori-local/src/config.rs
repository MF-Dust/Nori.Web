use nori_core::jsonutil::token_urlsafe;
use std::env;
use std::path::{Path, PathBuf};

#[derive(Clone, Debug)]
pub struct Config {
    pub host: String,
    pub port: u16,
    pub debug: bool,
    pub secret_key: String,
    pub machine_id: String,
    pub auto_guest: bool,
    pub dev_otp: String,
    pub disable_live_pack: bool,
    pub public_dir: PathBuf,
    /// Built source frontend (`index.html` + hashed bundles), layered over
    /// `public_dir`. A release ships it as `frontend/`; a source checkout uses
    /// the Vite output in `.artifacts/build/app`.
    pub frontend_dir: Option<PathBuf>,
    pub data_dir: PathBuf,
}

impl Default for Config {
    fn default() -> Self {
        let cwd = env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
        let exe_dir = env::current_exe()
            .ok()
            .and_then(|p| p.parent().map(Path::to_path_buf));
        Self {
            host: "127.0.0.1".into(),
            port: 4173,
            debug: false,
            secret_key: token_urlsafe(32),
            machine_id: "nori-local".into(),
            auto_guest: true,
            dev_otp: String::new(),
            disable_live_pack: false,
            public_dir: default_dir("public", &cwd, exe_dir.as_deref()),
            frontend_dir: default_frontend_dir(&cwd, exe_dir.as_deref()),
            data_dir: default_dir("backend/data", &cwd, exe_dir.as_deref()),
        }
    }
}

impl Config {
    pub fn from_env() -> Self {
        let mut config = Self::default();
        if let Ok(value) = env::var("HOST") {
            config.host = value;
        }
        if let Ok(value) = env::var("PORT") {
            config.port = value.parse().expect("PORT must be an integer in 0..=65535");
        }
        if let Ok(value) = env::var("DEBUG") {
            config.debug = matches!(value.to_ascii_lowercase().as_str(), "true" | "1" | "yes");
        }
        if let Ok(value) = env::var("SECRET_KEY") {
            if !value.trim().is_empty() {
                config.secret_key = value;
            }
        }
        if let Ok(value) = env::var("NORI_MACHINE_ID") {
            config.machine_id = value;
        }
        if let Ok(value) = env::var("NORI_AUTO_GUEST") {
            config.auto_guest = !matches!(
                value.trim().to_ascii_lowercase().as_str(),
                "0" | "false" | "no"
            );
        }
        if let Ok(value) = env::var("NORI_DEV_OTP") {
            config.dev_otp = value.trim().to_string();
        }
        if let Ok(value) = env::var("NORI_DISABLE_LIVE_PACK") {
            config.disable_live_pack = matches!(
                value.trim().to_ascii_lowercase().as_str(),
                "1" | "true" | "yes" | "on"
            );
        }
        if let Ok(value) = env::var("NORI_PUBLIC_DIR") {
            if !value.trim().is_empty() {
                config.public_dir = resolve_override(&value);
            }
        }
        if let Ok(value) = env::var("NORI_FRONTEND_DIR") {
            if !value.trim().is_empty() {
                config.frontend_dir = Some(resolve_override(&value));
            }
        }
        if let Ok(value) = env::var("NORI_DATA_DIR") {
            if !value.trim().is_empty() {
                config.data_dir = resolve_override(&value);
            }
        }
        config
    }
}

fn resolve_override(value: &str) -> PathBuf {
    let path = PathBuf::from(value);
    if path.is_absolute() {
        path
    } else {
        env::current_dir()
            .unwrap_or_else(|_| PathBuf::from("."))
            .join(path)
    }
}

fn default_dir(relative: &str, cwd: &Path, exe_dir: Option<&Path>) -> PathBuf {
    if let Some(candidate) = exe_dir
        .map(|dir| dir.join(relative))
        .filter(|path| path.is_dir())
    {
        return candidate;
    }
    cwd.join(relative)
}

const FRONTEND_DIRS: [&str; 2] = ["frontend", ".artifacts/build/app"];

fn default_frontend_dir(cwd: &Path, exe_dir: Option<&Path>) -> Option<PathBuf> {
    exe_dir
        .into_iter()
        .chain([cwd])
        .flat_map(|base| FRONTEND_DIRS.map(|relative| base.join(relative)))
        .find(|path| path.join("index.html").is_file())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_paths_are_resolved_from_cwd_when_not_next_to_executable() {
        let cwd = PathBuf::from("working");
        assert_eq!(default_dir("public", &cwd, None), cwd.join("public"));
    }

    #[test]
    fn frontend_build_is_found_next_to_the_executable_before_the_checkout() {
        let base = env::temp_dir().join(format!("nori-frontend-dir-{}", std::process::id()));
        let (exe, cwd) = (base.join("release"), base.join("checkout"));
        assert_eq!(default_frontend_dir(&cwd, Some(&exe)), None);
        let checkout_build = cwd.join(".artifacts/build/app");
        std::fs::create_dir_all(&checkout_build).unwrap();
        std::fs::write(checkout_build.join("index.html"), "checkout").unwrap();
        assert_eq!(default_frontend_dir(&cwd, Some(&exe)), Some(checkout_build));
        std::fs::create_dir_all(exe.join("frontend")).unwrap();
        std::fs::write(exe.join("frontend/index.html"), "release").unwrap();
        assert_eq!(
            default_frontend_dir(&cwd, Some(&exe)),
            Some(exe.join("frontend"))
        );
        std::fs::remove_dir_all(base).unwrap();
    }
}

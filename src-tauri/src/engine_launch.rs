//! Normalize engine binaries (Flatpak RetroArch vs native) before session supervisor spawn.
//!
//! Failure codes: `XIO-LCH-015` (Flatpak/supervisor parse), `XIO-LCH-016` (preflight via `prepare_launch`).
//! Runbook: `docs/operations/troubleshooting-pass-b.md` § SNES Flatpak / preflight validation.
//! UI parity: `validate_launch_plan` Tauri command in `lib.rs` calls `prepare_launch` here.

use std::path::{Path, PathBuf};

pub const FLATPAK_RETROARCH_APP: &str = "org.libretro.RetroArch";

pub fn is_flatpak_export_launcher(program: &str) -> bool {
    let lower = program.to_lowercase();
    lower.contains("/exports/bin/org.libretro.retroarch") || lower.ends_with("/org.libretro.retroarch")
}

pub fn needs_flatpak_run_wrapper(program: &str) -> bool {
    if program == "flatpak" || is_flatpak_export_launcher(program) {
        return false;
    }
    let lower = program.to_lowercase();
    lower.contains("flatpak") || lower.contains("org.libretro.retroarch")
}

pub fn flatpak_available() -> bool {
    find_on_path("flatpak").is_some()
        || std::process::Command::new("flatpak")
            .arg("--version")
            .output()
            .map(|o| o.status.success())
            .unwrap_or(false)
}

pub fn find_on_path(name: &str) -> Option<PathBuf> {
    std::env::var_os("PATH").and_then(|paths| {
        std::env::split_paths(&paths).find_map(|dir| {
            let candidate = dir.join(name);
            if candidate.is_file() {
                Some(candidate)
            } else {
                None
            }
        })
    })
}

pub fn validate_launch_program(program: &str) -> Result<(), String> {
    if program.contains('/') {
        if Path::new(program).exists() {
            return Ok(());
        }
        return Err(format!("Engine binary not found: {program}"));
    }
    if find_on_path(program).is_some() {
        return Ok(());
    }
    Err(format!("Engine binary not found: {program}"))
}

fn repair_flatpak_args(args: &[String]) -> Vec<String> {
    if args.first().map(|s| s.as_str()) == Some("run")
        && args.get(1).map(|s| s.as_str()) == Some(FLATPAK_RETROARCH_APP)
    {
        return args.to_vec();
    }
    if let Some(run_at) = args.iter().position(|a| a == "run") {
        if args.get(run_at + 1).map(|s| s.as_str()) == Some(FLATPAK_RETROARCH_APP) {
            let before = args[..run_at].to_vec();
            let after = args[run_at + 2..].to_vec();
            let mut fixed = vec!["run".to_string(), FLATPAK_RETROARCH_APP.to_string()];
            fixed.extend(before);
            fixed.extend(after);
            return fixed;
        }
    }
    let mut flatpak_args = vec!["run".to_string(), FLATPAK_RETROARCH_APP.to_string()];
    flatpak_args.extend(args.iter().cloned());
    flatpak_args
}

/// Rewrap internal Flatpak RetroArch binaries as `flatpak run org.libretro.RetroArch …`.
pub fn normalize_engine_launch(program: &str, args: &[String]) -> (String, Vec<String>) {
    if program == "flatpak" {
        return (program.to_string(), repair_flatpak_args(args));
    }
    if !needs_flatpak_run_wrapper(program) {
        return (program.to_string(), args.to_vec());
    }
    if !flatpak_available() {
        eprintln!(
            "[xi-io] flatpak not on PATH; launching RetroArch directly: {program}"
        );
        return (program.to_string(), args.to_vec());
    }
    let mut flatpak_args = vec!["run".to_string(), FLATPAK_RETROARCH_APP.to_string()];
    flatpak_args.extend(args.iter().cloned());
    eprintln!("[xi-io] normalized Flatpak RetroArch launch via flatpak run");
    (String::from("flatpak"), flatpak_args)
}

#[derive(Clone, Debug)]
pub struct PreparedLaunch {
    pub program: String,
    pub args: Vec<String>,
}

/// Single entry point: validate paths, normalize Flatpak, validate again.
pub fn prepare_launch(program: &str, args: &[String]) -> Result<PreparedLaunch, String> {
    // Internal Flatpak install paths are rewrapped as `flatpak run` — don't require the sandbox binary to exist.
    if !needs_flatpak_run_wrapper(program) {
        validate_launch_program(program)?;
    }
    let (program, args) = normalize_engine_launch(program, args);
    if program == "flatpak" && !flatpak_available() {
        return Err(
            "Flatpak RetroArch is configured but the flatpak command is not on PATH".into(),
        );
    }
    validate_launch_program(&program)?;
    if args.is_empty() {
        return Err("Launch plan has no emulator arguments.".into());
    }
    Ok(PreparedLaunch { program, args })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn prepare_launch_wraps_internal_flatpak() {
        let path = "/home/user/.local/share/flatpak/app/org.libretro.RetroArch/current/active/files/bin/retroarch";
        let args = vec!["-f".to_string(), "-L".to_string(), "core.so".to_string()];
        if !flatpak_available() {
            return;
        }
        let prepared = prepare_launch(path, &args).expect("prepare_launch");
        assert_eq!(prepared.program, "flatpak");
        assert_eq!(prepared.args[0], "run");
        assert_eq!(prepared.args[1], FLATPAK_RETROARCH_APP);
        assert_eq!(prepared.args[2], "-f");
    }

    #[test]
    fn detects_internal_flatpak_paths() {
        assert!(needs_flatpak_run_wrapper(
            "/home/user/.local/share/flatpak/app/org.libretro.RetroArch/current/active/files/bin/retroarch"
        ));
        assert!(!needs_flatpak_run_wrapper(
            "/home/user/.local/share/flatpak/exports/bin/org.libretro.RetroArch"
        ));
    }

    #[test]
    fn repairs_malformed_flatpak_args() {
        let args = vec![
            "-f".to_string(),
            "--video-fullscreen-screen".to_string(),
            "0".to_string(),
            "run".to_string(),
            FLATPAK_RETROARCH_APP.to_string(),
            "-L".to_string(),
            "core.so".to_string(),
        ];
        let fixed = repair_flatpak_args(&args);
        assert_eq!(fixed[0], "run");
        assert_eq!(fixed[1], FLATPAK_RETROARCH_APP);
        assert_eq!(fixed[2], "-f");
    }
}

//! Poll until an emulator PID exists before reporting launch success to the UI.
//!
//! Failure code: `XIO-LCH-014` (startup timeout — `startup_timeout()` is 12s).
//! Runbook: `docs/operations/troubleshooting-pass-b.md` § loading then nothing.
//! Supervisor exit code 2 → parse failure (`XIO-LCH-015` overlap via `format_supervisor_failure`).

use crate::emulator_process::{
    collect_descendant_pids, find_emulator_pids, is_process_alive, poll_session_pids_once,
};
use std::time::Duration;

const STARTUP_TIMEOUT: Duration = Duration::from_secs(12);

pub fn startup_timeout() -> Duration {
    STARTUP_TIMEOUT
}

pub fn format_supervisor_failure(exit_code: i32, stderr: &str) -> String {
    let detail = stderr.trim();
    if detail.contains("Engine binary not found") {
        return detail.to_string();
    }
    if !detail.is_empty() {
        return format!(
            "Supervisor exited before the game started (code {exit_code}): {detail}"
        );
    }
    match exit_code {
        2 => "Supervisor could not parse the launch command. Check engine and core paths.".into(),
        1 => "Supervisor failed to start the emulator. Check engine, core, and ROM paths.".into(),
        _ => format!(
            "Supervisor exited before the game started (code {exit_code}). Check engine and core paths."
        ),
    }
}

/// True when /proc shows an emulator process (not just the supervisor wrapper).
pub fn emulator_processes_ready(
    program: &str,
    content_path: &str,
    pids: &[u32],
    supervisor_pid: Option<u32>,
) -> bool {
    if let Some(sp) = supervisor_pid {
        if !is_process_alive(sp) {
            return false;
        }
    }

    let matched = find_emulator_pids(program, content_path, false);
    if !matched.is_empty() {
        return true;
    }

    if let Some(sp) = supervisor_pid {
        let descendants: Vec<u32> = collect_descendant_pids(&[sp])
            .into_iter()
            .filter(|p| *p != sp && is_process_alive(*p))
            .collect();
        if !descendants.is_empty() {
            return true;
        }
    }

    if pids.is_empty() {
        return false;
    }

    // Direct native emulator child (e.g. FCEUX) — not only the supervisor pid.
    pids.iter().any(|p| supervisor_pid.is_none_or(|sp| *p != sp))
}

pub fn poll_emulator_startup_once(
    program: &str,
    content_path: &str,
    supervisor_pid: Option<u32>,
) -> Result<Option<Vec<u32>>, String> {
    if let Some(sp) = supervisor_pid {
        if !is_process_alive(sp) {
            return Err("Supervisor exited before the game started.".into());
        }
    }
    let pids = poll_session_pids_once(program, content_path, supervisor_pid);
    if emulator_processes_ready(program, content_path, &pids, supervisor_pid) {
        Ok(Some(pids))
    } else {
        Ok(None)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn formats_supervisor_parse_error() {
        let msg = format_supervisor_failure(2, "Engine binary not found: flatpak");
        assert!(msg.contains("flatpak"));
    }
}

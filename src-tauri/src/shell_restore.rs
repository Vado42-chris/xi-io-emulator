//! Debounced shell focus restore — single owner in Rust; UI listens on `emulator-session-finished` only.
//!
//! Failure codes: `XIO-LCH-008` (focus restore failed), desktop freeze mitigated (runbook freeze section).
//! Guardrails: 2.5s debounce, mutex, `timeout` wrapper on WM tools, single wake pass (no retry storm).
use serde::Serialize;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::OnceLock;

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ShellRestoreResult {
    pub success: bool,
    pub reason_code: Option<String>,
    pub stage: Option<String>,
}

impl ShellRestoreResult {
    pub fn ok(stage: &str) -> Self {
        Self {
            success: true,
            reason_code: None,
            stage: Some(stage.to_string()),
        }
    }

    pub fn failed(reason_code: &str, stage: &str) -> Self {
        Self {
            success: false,
            reason_code: Some(reason_code.to_string()),
            stage: Some(stage.to_string()),
        }
    }
}

static RESTORE_IN_PROGRESS: AtomicBool = AtomicBool::new(false);
static RESTORE_ATTEMPTS: AtomicU64 = AtomicU64::new(0);
static LAST_RESTORE_MS: AtomicU64 = AtomicU64::new(0);
static HAS_TIMEOUT: OnceLock<bool> = OnceLock::new();
static TIMEOUT_SUPPORTS_KILL_AFTER: OnceLock<bool> = OnceLock::new();

fn now_ms() -> u64 {
    use std::time::{SystemTime, UNIX_EPOCH};
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

/// Minimum gap between full shell-restore cycles (Rust + UI must share this gate).
const RESTORE_DEBOUNCE_MS: u64 = 2500;

/// Returns false when a restore was already performed recently — caller should skip duplicate work.
pub fn try_begin_shell_restore(reason: &str) -> bool {
    let now = now_ms();
    let last = LAST_RESTORE_MS.load(Ordering::Relaxed);
    if now.saturating_sub(last) < RESTORE_DEBOUNCE_MS {
        eprintln!(
            "[xi-io] skip duplicate shell restore reason={reason} (debounce {}ms)",
            now.saturating_sub(last)
        );
        return false;
    }
    if RESTORE_IN_PROGRESS
        .compare_exchange(false, true, Ordering::SeqCst, Ordering::SeqCst)
        .is_err()
    {
        eprintln!("[xi-io] skip shell restore reason={reason} (already in progress)");
        return false;
    }
    LAST_RESTORE_MS.store(now, Ordering::Relaxed);
    let attempt = RESTORE_ATTEMPTS.fetch_add(1, Ordering::Relaxed) + 1;
    eprintln!("[xi-io] begin shell restore reason={reason} attempt={attempt}");
    true
}

pub fn finish_shell_restore() {
    RESTORE_IN_PROGRESS.store(false, Ordering::SeqCst);
}

/// Run subprocess with `timeout` when available — prevents blocking the WM/compositor forever.
pub fn run_subprocess_with_timeout(program: &str, args: &[&str], timeout_secs: u64) -> bool {
    if has_timeout_binary() {
        let mut cmd_args: Vec<String> = vec![timeout_secs.to_string()];
        if timeout_supports_kill_after() {
            cmd_args.push("--kill-after=1".to_string());
        }
        cmd_args.push(program.to_string());
        cmd_args.extend(args.iter().map(|s| s.to_string()));
        return std::process::Command::new("timeout")
            .args(&cmd_args)
            .status()
            .map(|s| s.success())
            .unwrap_or(false);
    }
    std::process::Command::new(program)
        .args(args)
        .status()
        .map(|s| s.success())
        .unwrap_or(false)
}

pub fn has_timeout_binary() -> bool {
    *HAS_TIMEOUT.get_or_init(|| {
        std::process::Command::new("timeout")
            .arg("--version")
            .output()
            .map(|o| o.status.success())
            .unwrap_or(false)
    })
}

fn timeout_supports_kill_after() -> bool {
    *TIMEOUT_SUPPORTS_KILL_AFTER.get_or_init(|| {
        if !has_timeout_binary() {
            return false;
        }
        // Busybox timeout treats `--kill-after=1` as the command name — probe safely.
        std::process::Command::new("timeout")
            .args(["0", "--kill-after=1", "true"])
            .output()
            .map(|o| o.status.success())
            .unwrap_or(false)
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn blocks_concurrent_restore() {
        assert!(try_begin_shell_restore("test"));
        assert!(!try_begin_shell_restore("test"));
        finish_shell_restore();
    }
}

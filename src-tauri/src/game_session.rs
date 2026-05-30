//! Isolated game session supervisor — the Linux launcher pattern used by Steam/Lutris.
//!
//! Architecture:
//! ```text
//! xi-io shell (hibernated, never group-killed)
//!   └── same xi-io binary (--xi-io-session-run)  ← xi-io waits on THIS pid only
//!         └── fceux / retroarch  ← idle monitoring + pid-only teardown
//! ```
//!
//! xi-io never sends process-group signals. The supervisor owns emulator lifecycle.

use crate::emulator_process::{resolve_session_pids, wait_for_session_end};
use std::collections::HashSet;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::Duration;

#[derive(Clone, Debug)]
pub struct SessionLaunchSpec {
    pub program: String,
    pub args: Vec<String>,
    pub env: Vec<(String, String)>,
    pub content_path: String,
}

static SUPERVISOR_TERMINATE: AtomicBool = AtomicBool::new(false);

extern "C" fn supervisor_on_signal(_: libc::c_int) {
    SUPERVISOR_TERMINATE.store(true, Ordering::Relaxed);
}

fn install_supervisor_signal_handlers() {
    SUPERVISOR_TERMINATE.store(false, Ordering::Relaxed);
    unsafe {
        libc::signal(libc::SIGTERM, supervisor_on_signal as *const () as usize);
        libc::signal(libc::SIGINT, supervisor_on_signal as *const () as usize);
    }
}

pub const SESSION_RUN_ARG: &str = "--xi-io-session-run";

/// Re-exec the xi-io binary in supervisor mode — always colocated with the shell process.
pub fn resolve_session_runner_path() -> PathBuf {
    if let Ok(exe) = std::env::current_exe() {
        return exe;
    }
    PathBuf::from("xi-io-emulator")
}

pub fn build_supervisor_command(spec: &SessionLaunchSpec) -> Command {
    let runner = resolve_session_runner_path();
    let mut cmd = Command::new(runner);
    cmd.arg("--program").arg(&spec.program);
    cmd.arg("--content-path").arg(&spec.content_path);
    cmd.arg("--");
    cmd.args(&spec.args);
    for (key, value) in &spec.env {
        cmd.env(key, value);
    }
    cmd.stdin(Stdio::null());
    cmd.stdout(Stdio::null());
    cmd.stderr(Stdio::piped());
    cmd
}

/// Entry point for the `xi-io-session-run` binary.
pub fn session_run_main() -> ! {
    crate::platform::log_platform_context();
    install_supervisor_signal_handlers();

    let spec = match parse_session_run_cli() {
        Ok(spec) => spec,
        Err(err) => {
            eprintln!("[xi-io-session-run] {err}");
            std::process::exit(2);
        }
    };

    let code = run_isolated_session(&spec);
    std::process::exit(code);
}

fn parse_session_run_cli() -> Result<SessionLaunchSpec, String> {
    let args: Vec<String> = std::env::args().collect();
    let mut program = None;
    let mut content_path = None;
    let mut emulator_args: Vec<String> = Vec::new();
    let mut i = 1;

    while i < args.len() {
        match args[i].as_str() {
            SESSION_RUN_ARG => {
                i += 1;
                continue;
            }
            "--program" => {
                i += 1;
                program = Some(
                    args.get(i)
                        .ok_or("--program requires a value")?
                        .clone(),
                );
            }
            "--content-path" => {
                i += 1;
                content_path = Some(
                    args.get(i)
                        .ok_or("--content-path requires a value")?
                        .clone(),
                );
            }
            "--" => {
                emulator_args = args[i + 1..].to_vec();
                break;
            }
            other => return Err(format!("Unknown argument: {other}")),
        }
        i += 1;
    }

    let program = program.ok_or("--program is required")?;
    let content_path = content_path.ok_or("--content-path is required")?;
    if emulator_args.is_empty() {
        return Err("Emulator arguments required after --".into());
    }
    if !Path::new(&program).exists() {
        return Err(format!("Engine binary not found: {program}"));
    }

    Ok(SessionLaunchSpec {
        program,
        args: emulator_args,
        env: Vec::new(),
        content_path,
    })
}

/// Runs inside an isolated session: spawn emulator, monitor until exit, pid-only teardown.
pub fn run_isolated_session(spec: &SessionLaunchSpec) -> i32 {
    unsafe {
        if libc::setsid() == -1 {
            eprintln!(
                "[xi-io-session-run] setsid failed: {}",
                std::io::Error::last_os_error()
            );
        }
    }

    let mut cmd = Command::new(&spec.program);
    cmd.args(&spec.args);
    let mut child = match cmd.spawn() {
        Ok(child) => child,
        Err(err) => {
            eprintln!("[xi-io-session-run] spawn failed: {err}");
            return 1;
        }
    };

    let spawn_pid = child.id();
    eprintln!(
        "[xi-io-session-run] started {} pid={spawn_pid} rom={}",
        spec.program, spec.content_path
    );

    let mut accumulated: HashSet<u32> = HashSet::new();
    wait_for_session_end(
        &spec.program,
        &spec.content_path,
        None,
        Some(spawn_pid),
        &mut accumulated,
        &SUPERVISOR_TERMINATE,
        None::<fn()>,
    );

    let _ = child.kill();
    let _ = child.wait();
    eprintln!("[xi-io-session-run] session ended");
    0
}

/// Resolve emulator PIDs after the supervisor has started (for window tagging).
pub fn resolve_emulator_pids_after_start(
    program: &str,
    content_path: &str,
    supervisor_pid: Option<u32>,
) -> Vec<u32> {
    std::thread::sleep(Duration::from_millis(500));
    let pids = resolve_session_pids(program, content_path, None);
    if !pids.is_empty() {
        return pids;
    }
    if let Some(pid) = supervisor_pid {
        if Path::new(&format!("/proc/{pid}")).exists() {
            return vec![pid];
        }
    }
    pids
}

pub fn signal_supervisor_stop(supervisor_pid: u32) {
    if supervisor_pid == std::process::id() {
        eprintln!("[xi-io] refuse SIGTERM supervisor pid={supervisor_pid} (shell)");
        return;
    }
    eprintln!("[xi-io] signaling supervisor pid={supervisor_pid} to stop");
    unsafe {
        libc::kill(supervisor_pid as libc::pid_t, libc::SIGTERM);
    }
}

pub fn wait_for_supervisor_exit(supervisor_pid: u32, timeout: Duration) -> bool {
    let deadline = std::time::Instant::now() + timeout;
    while std::time::Instant::now() < deadline {
        if !Path::new(&format!("/proc/{supervisor_pid}")).exists() {
            return true;
        }
        std::thread::sleep(Duration::from_millis(80));
    }
    Path::new(&format!("/proc/{supervisor_pid}")).exists() == false
}

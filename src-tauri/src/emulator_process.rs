use serde::{Deserialize, Serialize};
use std::collections::{HashSet, VecDeque};
use std::fs;
use std::io::{self, Read};
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::{Duration, Instant};
use tauri::AppHandle;
use tauri::Manager;

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EmulatorSessionRecord {
    pub game_id: String,
    pub content_path: String,
    pub engine_id: String,
    pub program: String,
    pub started_at: String,
    pub ended_at: Option<String>,
    pub exit_reason: String,
    pub pids: Vec<u32>,
}

fn read_cmdline(pid: u32) -> Option<String> {
    let path = format!("/proc/{pid}/cmdline");
    let mut file = fs::File::open(path).ok()?;
    let mut raw = Vec::new();
    file.read_to_end(&mut raw).ok()?;
    Some(
        raw.iter()
            .map(|b| if *b == 0 { ' ' } else { *b as char })
            .collect::<String>()
            .trim()
            .to_string(),
    )
}

fn read_exe(pid: u32) -> Option<PathBuf> {
    fs::read_link(format!("/proc/{pid}/exe")).ok()
}

fn read_ppid(pid: u32) -> Option<u32> {
    let status = fs::read_to_string(format!("/proc/{pid}/status")).ok()?;
    for line in status.lines() {
        if let Some(rest) = line.strip_prefix("PPid:") {
            return rest.trim().parse().ok();
        }
    }
    None
}

fn is_pid_alive(pid: u32) -> bool {
    Path::new(&format!("/proc/{pid}")).exists()
}

pub fn is_process_alive(pid: u32) -> bool {
    is_pid_alive(pid)
}

fn program_matches_pid(program: &str, pid: u32) -> bool {
    if program == "flatpak" {
        return read_cmdline(pid)
            .map(|cmd| {
                let lower = cmd.to_lowercase();
                lower.contains("retroarch") || lower.contains("org.libretro")
            })
            .unwrap_or(false);
    }

    let program_path = Path::new(program);
    let program_base = program_path
        .file_name()
        .and_then(|s| s.to_str())
        .unwrap_or(program)
        .to_lowercase();

    if let Some(exe) = read_exe(pid) {
        if exe == program_path {
            return true;
        }
        if exe.file_name().and_then(|s| s.to_str()).unwrap_or("").to_lowercase() == program_base {
            return true;
        }
    }

    read_cmdline(pid)
        .map(|cmd| {
            let lower = cmd.to_lowercase();
            lower.contains(&program.to_lowercase()) || lower.starts_with(&program_base)
        })
        .unwrap_or(false)
}

fn content_marker(content_path: &str) -> String {
    Path::new(content_path)
        .file_name()
        .and_then(|s| s.to_str())
        .unwrap_or(content_path)
        .to_lowercase()
}

/// Finds emulator processes. When `require_content` is true, cmdline must include the ROM name.
pub fn find_emulator_pids(program: &str, content_path: &str, require_content: bool) -> Vec<u32> {
    let marker = content_marker(content_path);
    let Ok(entries) = fs::read_dir("/proc") else {
        return Vec::new();
    };

    let mut pids = Vec::new();
    for entry in entries.flatten() {
        let file_name = entry.file_name();
        let Some(pid_str) = file_name.to_str() else {
            continue;
        };
        let Ok(pid) = pid_str.parse::<u32>() else {
            continue;
        };
        if !program_matches_pid(program, pid) {
            continue;
        }
        if require_content {
            let Some(cmdline) = read_cmdline(pid) else {
                continue;
            };
            if !cmdline.to_lowercase().contains(&marker) {
                continue;
            }
        }
        pids.push(pid);
    }

    pids.sort_unstable();
    pids.dedup();
    pids
}

pub fn find_emulator_pids_by_program(program: &str) -> Vec<u32> {
    find_emulator_pids(program, "", false)
}

pub fn collect_descendant_pids(roots: &[u32]) -> Vec<u32> {
    let Ok(entries) = fs::read_dir("/proc") else {
        return Vec::new();
    };

    let mut children: Vec<(u32, u32)> = Vec::new();
    for entry in entries.flatten() {
        let file_name = entry.file_name();
        let Some(pid_str) = file_name.to_str() else {
            continue;
        };
        let Ok(pid) = pid_str.parse::<u32>() else {
            continue;
        };
        if let Some(ppid) = read_ppid(pid) {
            children.push((pid, ppid));
        }
    }

    let mut seen: HashSet<u32> = roots.iter().copied().collect();
    let mut queue: VecDeque<u32> = roots.iter().copied().collect();
    while let Some(parent) = queue.pop_front() {
        for (pid, ppid) in &children {
            if *ppid == parent && seen.insert(*pid) {
                queue.push_back(*pid);
            }
        }
    }

    seen.into_iter().collect()
}

fn belongs_to_session(
    pid: u32,
    program: &str,
    content_path: &str,
    pgid: Option<i32>,
    accumulated: &HashSet<u32>,
) -> bool {
    if !is_pid_alive(pid) || !program_matches_pid(program, pid) {
        return false;
    }
    if accumulated.contains(&pid) {
        return true;
    }
    if pgid.is_some_and(|g| collect_pgid(pid) == Some(g)) {
        return true;
    }
    let marker = content_marker(content_path);
    read_cmdline(pid)
        .map(|cmd| cmd.to_lowercase().contains(&marker))
        .unwrap_or(false)
}

/// Re-scan /proc each tick so fork/detach cannot leave a stray emulator window alive.
pub fn refresh_session_pids(
    program: &str,
    content_path: &str,
    pgid: Option<i32>,
    spawn_pid: Option<u32>,
    accumulated: &mut HashSet<u32>,
) -> Vec<u32> {
    let mut found: HashSet<u32> = HashSet::new();

    if let Some(pid) = spawn_pid {
        if is_pid_alive(pid) && program_matches_pid(program, pid) {
            found.insert(pid);
        }
    }

    if let Some(g) = pgid {
        for pid in pids_in_process_group(program, g) {
            found.insert(pid);
        }
    }

    for pid in find_emulator_pids(program, content_path, true) {
        found.insert(pid);
    }

    for pid in find_emulator_pids_by_program(program) {
        if belongs_to_session(pid, program, content_path, pgid, accumulated) {
            found.insert(pid);
        }
    }

    for pid in accumulated.iter().copied() {
        if is_pid_alive(pid) && program_matches_pid(program, pid) {
            found.insert(pid);
        }
    }

    let roots: Vec<u32> = found.iter().copied().collect();
    for pid in collect_descendant_pids(&roots) {
        if is_pid_alive(pid) {
            found.insert(pid);
        }
    }

    for pid in &found {
        accumulated.insert(*pid);
    }

    let mut out: Vec<u32> = found.into_iter().filter(|p| is_pid_alive(*p)).collect();
    out.sort_unstable();
    out.dedup();
    out
}

pub fn resolve_session_pids(program: &str, content_path: &str, spawn_pid: Option<u32>) -> Vec<u32> {
    std::thread::sleep(Duration::from_millis(450));
    let pgid = spawn_pid.and_then(collect_pgid);
    let mut accumulated = HashSet::new();
    refresh_session_pids(program, content_path, pgid, spawn_pid, &mut accumulated)
}

fn normalize_content_path(content_path: &str) -> PathBuf {
    fs::canonicalize(content_path).unwrap_or_else(|_| PathBuf::from(content_path))
}

/// Linux cmdline is fixed at exec — use open FDs to detect in-emulator "Close Game".
fn pid_has_open_content(pid: u32, content_path: &str) -> bool {
    let target = normalize_content_path(content_path);
    let marker = content_marker(content_path);
    let fd_dir = format!("/proc/{pid}/fd");
    let Ok(entries) = fs::read_dir(fd_dir) else {
        return false;
    };

    for entry in entries.flatten() {
        let Ok(link) = fs::read_link(entry.path()) else {
            continue;
        };
        if link == target {
            return true;
        }
        let lossy = link.to_string_lossy().to_lowercase();
        if lossy.contains(&marker) {
            return true;
        }
    }
    false
}

fn window_titles_for_pid(pid: u32) -> Vec<String> {
    let output = match Command::new("xdotool")
        .args(["search", "--pid", &pid.to_string()])
        .output()
    {
        Ok(out) if out.status.success() => out,
        _ => return Vec::new(),
    };

    let stdout = String::from_utf8_lossy(&output.stdout);
    let ids: Vec<&str> = stdout.split_whitespace().collect();
    let mut titles = Vec::new();
    for id in ids {
        let name_out = Command::new("xdotool")
            .args(["getwindowname", id])
            .output();
        if let Ok(out) = name_out {
            if out.status.success() {
                let title = String::from_utf8_lossy(&out.stdout).trim().to_string();
                if !title.is_empty() {
                    titles.push(title);
                }
            }
        }
    }
    titles
}

fn session_content_active(program: &str, content_path: &str, accumulated: &HashSet<u32>) -> bool {
    let alive: Vec<u32> = accumulated
        .iter()
        .copied()
        .filter(|pid| is_pid_alive(*pid))
        .collect();
    if alive.is_empty() {
        return false;
    }

    let program_base = Path::new(program)
        .file_name()
        .and_then(|s| s.to_str())
        .unwrap_or(program)
        .to_lowercase();

    if program_base.contains("fceux") {
        let mut saw_window = false;
        for pid in &alive {
            let titles = window_titles_for_pid(*pid);
            if titles.is_empty() {
                continue;
            }
            saw_window = true;
            for title in &titles {
                let lower = title.to_lowercase();
                if lower == "fceux" || lower.starts_with("fceux ") || lower.starts_with("fceux2") {
                    continue;
                }
                if fceux_titles_show_game(std::slice::from_ref(title), content_path) {
                    return true;
                }
            }
        }
        if saw_window {
            return false;
        }
    }

    if program_base.contains("retroarch") || program == "flatpak" {
        for pid in &alive {
            let titles = window_titles_for_pid(*pid);
            if titles.iter().any(|t| !t.trim().is_empty()) {
                return true;
            }
        }
    }

    alive
        .iter()
        .any(|pid| pid_has_open_content(*pid, content_path))
}

fn fceux_titles_show_game(titles: &[String], content_path: &str) -> bool {
    let marker = content_marker(content_path);
    let stem = Path::new(content_path)
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("")
        .to_lowercase();
    titles.iter().any(|title| {
        let lower = title.to_lowercase();
        lower.contains(&marker)
            || (!stem.is_empty() && lower.contains(&stem))
    })
}

pub fn collect_pgid(pid: u32) -> Option<i32> {
    let status = fs::read_to_string(format!("/proc/{pid}/status")).ok()?;
    for line in status.lines() {
        if let Some(rest) = line.strip_prefix("Tpgid:") {
            return rest.trim().parse().ok();
        }
    }
    None
}

fn shell_pid() -> u32 {
    std::process::id()
}

fn shell_pgid() -> Option<i32> {
    collect_pgid(shell_pid())
}

fn pids_with_pgid(pgid: i32) -> Vec<u32> {
    let Ok(entries) = fs::read_dir("/proc") else {
        return Vec::new();
    };
    let mut pids = Vec::new();
    for entry in entries.flatten() {
        let file_name = entry.file_name();
        let Some(pid_str) = file_name.to_str() else {
            continue;
        };
        let Ok(pid) = pid_str.parse::<u32>() else {
            continue;
        };
        if collect_pgid(pid) == Some(pgid) {
            pids.push(pid);
        }
    }
    pids.sort_unstable();
    pids
}

/// Never signal our own PID — pgid kills can take down xi-io if the emulator shares our process group.
fn signal_pid_safe(pid: u32, signal: &str) {
    if pid == shell_pid() {
        eprintln!("[xi-io] refuse kill pid={pid} (shell process)");
        return;
    }
    let _ = signal_pid(pid, signal);
}

fn signal_pgid(pgid: i32, signal: &str) -> io::Result<()> {
    if pgid <= 1 {
        return Ok(());
    }
    Command::new("kill")
        .args([signal, &format!("-{pgid}")])
        .status()
        .map(|_| ())
}

/// Process-group kill is only safe when the group is emulator-only and not the xi-io shell group.
fn signal_pgid_safe(pgid: i32, program: &str, signal: &str) {
    if pgid <= 1 {
        return;
    }
    if shell_pgid() == Some(pgid) {
        eprintln!("[xi-io] refuse pgid signal pgid={pgid} (matches shell process group)");
        return;
    }
    let members = pids_with_pgid(pgid);
    if members.iter().any(|pid| *pid == shell_pid()) {
        eprintln!("[xi-io] refuse pgid signal pgid={pgid} (shell pid in group)");
        return;
    }
    if !members.is_empty() && !members.iter().all(|pid| program_matches_pid(program, *pid)) {
        eprintln!(
            "[xi-io] refuse pgid signal pgid={pgid} (non-emulator members: {members:?})"
        );
        return;
    }
    let _ = signal_pgid(pgid, signal);
}

fn signal_pid(pid: u32, signal: &str) -> io::Result<()> {
    Command::new("kill")
        .args([signal, &pid.to_string()])
        .status()
        .map(|_| ())
}

/// Drop session pgid when it matches the shell — setsid() may have failed and pgid kill would close xi-io.
pub fn sanitize_session_pgid(spawn_pid: Option<u32>, pgid: Option<i32>) -> Option<i32> {
    let pgid = pgid.or_else(|| spawn_pid.and_then(collect_pgid));
    let Some(g) = pgid else {
        return None;
    };
    if shell_pgid() == Some(g) {
        eprintln!(
            "[xi-io] emulator pgid={g} matches shell — using pid-only session teardown"
        );
        return None;
    }
    Some(g)
}

fn pids_in_process_group(program: &str, pgid: i32) -> Vec<u32> {
    find_emulator_pids_by_program(program)
        .into_iter()
        .filter(|pid| collect_pgid(*pid) == Some(pgid))
        .collect()
}

fn pkill_session(program: &str, content_path: &str, signal: &str) {
    let marker = content_marker(content_path);
    if marker.is_empty() {
        return;
    }
    let pattern = format!("{program}.*{marker}");
    let _ = Command::new("pkill")
        .args([signal, "-f", &pattern])
        .status();
}

pub struct TerminateOutcome {
    pub terminated: bool,
    pub remaining_pids: Vec<u32>,
}

fn is_fceux_program(program: &str) -> bool {
    Path::new(program)
        .file_name()
        .and_then(|s| s.to_str())
        .unwrap_or(program)
        .to_lowercase()
        .contains("fceux")
}

fn session_rom_fd_open(content_path: &str, accumulated: &HashSet<u32>) -> bool {
    accumulated
        .iter()
        .copied()
        .filter(|pid| is_pid_alive(*pid))
        .any(|pid| pid_has_open_content(pid, content_path))
}

/// FCEUX often ignores SIGTERM and stays on a black "no game loaded" window — kill the session hard.
fn force_terminate_fceux_session(
    program: &str,
    content_path: &str,
    stored_pids: &[u32],
    pgid: Option<i32>,
) -> TerminateOutcome {
    let mut pids = stored_pids.to_vec();
    pids.extend(collect_descendant_pids(stored_pids));
    pids.extend(find_emulator_pids(program, content_path, false));
    if let Some(g) = pgid {
        pids.extend(pids_in_process_group(program, g));
    }
    pids.sort_unstable();
    pids.dedup();

    let session_pgid = sanitize_session_pgid(
        stored_pids.first().copied(),
        pgid.or_else(|| stored_pids.first().and_then(|pid| collect_pgid(*pid))),
    );

    for &pid in &pids {
        signal_pid_safe(pid, "-KILL");
    }
    if let Some(g) = session_pgid {
        signal_pgid_safe(g, program, "-KILL");
    }

    std::thread::sleep(Duration::from_millis(200));
    let remaining: Vec<u32> = pids
        .iter()
        .copied()
        .filter(|pid| is_pid_alive(*pid))
        .collect();
    TerminateOutcome {
        terminated: remaining.is_empty(),
        remaining_pids: remaining,
    }
}

/// FCEUX often survives SIGTERM with a black "no game loaded" window; prefer a short TERM grace.
fn terminate_timeout_for_program(program: &str) -> Duration {
    let base = Path::new(program)
        .file_name()
        .and_then(|s| s.to_str())
        .unwrap_or(program)
        .to_lowercase();
    if base.contains("fceux") {
        Duration::from_millis(400)
    } else {
        Duration::from_secs(3)
    }
}

/// Sends SIGTERM, waits, then SIGKILL for stubborn processes.
pub fn force_terminate_pids(
    program: &str,
    pids: &[u32],
    pgid: Option<i32>,
    timeout: Duration,
) -> TerminateOutcome {
    for &pid in pids {
        signal_pid_safe(pid, "-TERM");
    }
    if let Some(pgid) = pgid {
        signal_pgid_safe(pgid, program, "-TERM");
    }

    let deadline = Instant::now() + timeout;
    loop {
        let remaining: Vec<u32> = pids.iter().copied().filter(|p| is_pid_alive(*p)).collect();
        if remaining.is_empty() {
            return TerminateOutcome {
                terminated: true,
                remaining_pids: Vec::new(),
            };
        }
        if Instant::now() >= deadline {
            break;
        }
        std::thread::sleep(Duration::from_millis(100));
    }

    for &pid in pids {
        if is_pid_alive(pid) {
            signal_pid_safe(pid, "-KILL");
        }
    }
    if let Some(pgid) = pgid {
        signal_pgid_safe(pgid, program, "-KILL");
    }

    std::thread::sleep(Duration::from_millis(150));
    let remaining: Vec<u32> = pids.iter().copied().filter(|p| is_pid_alive(*p)).collect();
    TerminateOutcome {
        terminated: remaining.is_empty(),
        remaining_pids: remaining,
    }
}

pub fn force_terminate_session(
    program: &str,
    content_path: &str,
    stored_pids: &[u32],
    pgid: Option<i32>,
) -> TerminateOutcome {
    if is_fceux_program(program) {
        return force_terminate_fceux_session(program, content_path, stored_pids, pgid);
    }

    let mut pids = stored_pids.to_vec();
    pids.extend(collect_descendant_pids(stored_pids));
    pids.extend(find_emulator_pids(program, content_path, true));
    pids.extend(find_emulator_pids(program, content_path, false));
    if let Some(pgid) = pgid {
        pids.extend(pids_in_process_group(program, pgid));
    }
    pids.sort_unstable();
    pids.dedup();

    let session_pgid = sanitize_session_pgid(None, pgid.or_else(|| pids.first().and_then(|pid| collect_pgid(*pid))));
    let mut outcome = force_terminate_pids(
        program,
        &pids,
        session_pgid,
        terminate_timeout_for_program(program),
    );

    // Fallback: ROM may already be unloaded, so pgid kill is the reliable path.
    if !outcome.terminated {
        if let Some(pgid) = session_pgid {
            signal_pgid_safe(pgid, program, "-KILL");
        }
        pkill_session(program, content_path, "-KILL");
        for pid in find_emulator_pids_by_program(program) {
            if session_pgid.is_none_or(|g| collect_pgid(pid) == Some(g)) {
                signal_pid_safe(pid, "-KILL");
            }
        }
        std::thread::sleep(Duration::from_millis(150));
        let remaining: Vec<u32> = pids
            .iter()
            .copied()
            .chain(find_emulator_pids_by_program(program))
            .filter(|pid| is_pid_alive(*pid))
            .collect();
        outcome = TerminateOutcome {
            terminated: remaining.is_empty(),
            remaining_pids: remaining,
        };
    }

    outcome
}

pub fn cleanup_orphan_emulators(program: &str, content_path: &str) -> Vec<u32> {
    let pids = find_emulator_pids_by_program(program);
    if pids.is_empty() {
        return pids;
    }
    let marker = content_marker(content_path);
    let targeted: Vec<u32> = pids
        .into_iter()
        .filter(|pid| {
            read_cmdline(*pid)
                .map(|cmd| cmd.to_lowercase().contains(&marker))
                .unwrap_or(false)
        })
        .collect();
    if targeted.is_empty() {
        return Vec::new();
    }
    let pgid = sanitize_session_pgid(targeted.first().copied(), targeted.first().and_then(|pid| collect_pgid(*pid)));
    force_terminate_pids(program, &targeted, pgid, Duration::from_secs(2));
    targeted
}

fn session_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Unable to resolve app data dir: {e}"))?;
    Ok(dir.join("emulator_last_session.json"))
}

pub fn save_session_record(app: &AppHandle, record: &EmulatorSessionRecord) -> Result<(), String> {
    let path = session_path(app)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Unable to create app data dir: {e}"))?;
    }
    let raw = serde_json::to_string_pretty(record)
        .map_err(|e| format!("Unable to serialize emulator session: {e}"))?;
    fs::write(&path, raw).map_err(|e| format!("Unable to write emulator session: {e}"))
}

pub fn load_session_record(app: &AppHandle) -> Result<Option<EmulatorSessionRecord>, String> {
    let path = session_path(app)?;
    if !path.exists() {
        return Ok(None);
    }
    let raw = fs::read_to_string(&path).map_err(|e| format!("Unable to read emulator session: {e}"))?;
    let record: EmulatorSessionRecord =
        serde_json::from_str(&raw).map_err(|e| format!("Invalid emulator session JSON: {e}"))?;
    Ok(Some(record))
}

pub fn wait_for_pids_exit(pids: &[u32], poll: Duration) {
    loop {
        let alive: Vec<u32> = pids.iter().copied().filter(|p| is_pid_alive(*p)).collect();
        if alive.is_empty() {
            break;
        }
        std::thread::sleep(poll);
    }
}

pub fn wait_for_session_end<F: FnOnce()>(
    program: &str,
    content_path: &str,
    pgid: Option<i32>,
    spawn_pid: Option<u32>,
    accumulated: &mut HashSet<u32>,
    terminate_requested: &std::sync::atomic::AtomicBool,
    on_session_end: Option<F>,
) {
    const LAUNCH_GRACE_MS: u64 = 6000;
    const IDLE_KILL_MS: u64 = 500;

    let session_started = Instant::now();
    let mut content_ever_active = false;
    let mut rom_fd_ever_open = false;
    let mut idle_since: Option<Instant> = None;
    let mut on_session_end = on_session_end;
    let mut restored = false;

    let mut restore_ui = |on_end: &mut Option<F>| {
        if restored {
            return;
        }
        if let Some(f) = on_end.take() {
            f();
            restored = true;
        }
    };

    let kill_session = |accumulated: &mut HashSet<u32>| {
        let current: Vec<u32> = accumulated.iter().copied().collect();
        if current.is_empty() {
            return;
        }
        force_terminate_session(program, content_path, &current, pgid);
        for _ in 0..40 {
            let remaining =
                refresh_session_pids(program, content_path, pgid, spawn_pid, accumulated);
            if remaining.is_empty() {
                break;
            }
            std::thread::sleep(Duration::from_millis(100));
        }
    };

    loop {
        if terminate_requested.load(std::sync::atomic::Ordering::Relaxed) {
            kill_session(accumulated);
            restore_ui(&mut on_session_end);
            break;
        }

        let current = refresh_session_pids(
            program,
            content_path,
            pgid,
            spawn_pid,
            accumulated,
        );

        if current.is_empty() {
            restore_ui(&mut on_session_end);
            break;
        }

        let rom_open = session_rom_fd_open(content_path, accumulated);
        let content_active = session_content_active(program, content_path, accumulated);

        if rom_open || content_active {
            if rom_open {
                rom_fd_ever_open = true;
            }
            content_ever_active = true;
            idle_since = None;
        } else {
            let past_grace =
                session_started.elapsed() >= Duration::from_millis(LAUNCH_GRACE_MS);
            let fceux = is_fceux_program(program);
            // FCEUX black-window idle exit uses grace; RetroArch must show content/window first.
            let may_kill_idle = content_ever_active
                || rom_fd_ever_open
                || (past_grace && fceux);
            if may_kill_idle {
                idle_since.get_or_insert_with(Instant::now);
                if idle_since
                    .expect("set above")
                    .elapsed()
                    >= Duration::from_millis(IDLE_KILL_MS)
                {
                    // Gamepad "close game" leaves FCEUX on a black window — end the whole session.
                    kill_session(accumulated);
                    restore_ui(&mut on_session_end);
                    break;
                }
            }
        }

        std::thread::sleep(Duration::from_millis(120));
    }

    for _ in 0..5 {
        let remaining =
            refresh_session_pids(program, content_path, pgid, spawn_pid, accumulated);
        if remaining.is_empty() {
            break;
        }
        force_terminate_session(program, content_path, &remaining, pgid);
        std::thread::sleep(Duration::from_millis(200));
    }
}

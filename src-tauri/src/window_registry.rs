use std::fs;
use std::path::PathBuf;
use std::process::Command;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use crate::platform::x11_wm_tools_available;
use crate::shell_restore::run_subprocess_with_timeout;
use tauri::{AppHandle, Manager};

/// Stable WM title for the xi-io arcade shell — never unmap/kill; target by stored XID.
pub const SHELL_WINDOW_TITLE: &str = "xi-io::shell";
const SHELL_XID_FILE: &str = "shell_window_xid.txt";

pub fn game_window_title(session_id: &str) -> String {
    format!("xi-io::game::{session_id}")
}

pub fn new_session_id(game_id: &str) -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let ts = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);
    format!("{game_id}@{ts}")
}

#[derive(Clone, Debug)]
pub struct TrackedGameSession {
    pub session_id: String,
    pub game_id: String,
    pub window_xids: Vec<u64>,
    pub pids: Vec<u32>,
}

#[derive(Clone, Default)]
pub struct WindowRegistry {
    inner: Arc<WindowRegistryInner>,
}

#[derive(Default)]
struct WindowRegistryInner {
    shell_xid: Mutex<Option<u64>>,
    open_sessions: Mutex<Vec<TrackedGameSession>>,
}

impl WindowRegistry {
    pub fn register_shell_window(&self, app: &AppHandle) {
        if let Some(main) = app.get_webview_window("main") {
            let _ = main.set_title(SHELL_WINDOW_TITLE);
            let _ = main.show();
        }
        self.refresh_shell_xid(app);
    }

    pub fn shell_xid(&self) -> Option<u64> {
        self.inner
            .shell_xid
            .lock()
            .ok()
            .and_then(|g| *g)
    }

    pub fn start_session(&self, session_id: String, game_id: String, pids: Vec<u32>) {
        let session = TrackedGameSession {
            session_id,
            game_id,
            window_xids: Vec::new(),
            pids,
        };
        if let Ok(mut guard) = self.inner.open_sessions.lock() {
            guard.retain(|s| s.pids.iter().any(|p| is_pid_alive(*p)));
            guard.push(session);
        }
    }

    pub fn attach_session_windows(&self, session_id: &str, window_xids: Vec<u64>) {
        if let Ok(mut guard) = self.inner.open_sessions.lock() {
            if let Some(session) = guard.iter_mut().find(|s| s.session_id == session_id) {
                session.window_xids = window_xids;
            }
        }
    }

    pub fn end_session(&self, session_id: &str) {
        if let Ok(mut guard) = self.inner.open_sessions.lock() {
            guard.retain(|s| s.session_id != session_id);
        }
    }

    pub fn open_sessions(&self) -> Vec<TrackedGameSession> {
        self.inner
            .open_sessions
            .lock()
            .map(|g| g.clone())
            .unwrap_or_default()
    }

    pub fn session_window_xids(&self, session_id: &str) -> Vec<u64> {
        self.inner
            .open_sessions
            .lock()
            .ok()
            .and_then(|guard| {
                guard
                    .iter()
                    .find(|s| s.session_id == session_id)
                    .map(|s| s.window_xids.clone())
            })
            .unwrap_or_default()
    }

    /// Send shell behind the emulator. Process stays alive; hide (faster than minimize/unminimize) + optional X11 lower.
    pub fn hibernate_shell(&self, app: &AppHandle) {
        if let Some(main) = app.get_webview_window("main") {
            let _ = main.set_title(SHELL_WINDOW_TITLE);
            let _ = main.hide();
        }
        self.refresh_shell_xid(app);
        if x11_wm_tools_available() {
            if let Some(xid) = self.shell_xid() {
                persist_shell_xid(app, xid);
                eprintln!("[xi-io] hibernate shell xid={xid}");
                let id = xid.to_string();
                let _ = run_xdotool(&["windowlower", &id]);
            }
        }
    }

    fn refresh_shell_xid(&self, app: &AppHandle) {
        if let Some(xid) = load_persisted_shell_xid(app) {
            if xid_is_alive(xid) {
                if let Ok(mut guard) = self.inner.shell_xid.lock() {
                    *guard = Some(xid);
                }
                return;
            }
        }
        for xid in discover_shell_xids() {
            if let Ok(mut guard) = self.inner.shell_xid.lock() {
                *guard = Some(xid);
            }
            persist_shell_xid(app, xid);
            return;
        }
    }

    /// Tauri-only wake — safe on Wayland and X11; avoids WM tool storms.
    pub fn wake_shell(&self, app: &AppHandle) {
        if let Some(main) = app.get_webview_window("main") {
            let _ = main.set_title(SHELL_WINDOW_TITLE);
            let _ = main.show();
            let _ = main.set_focus();
        }
    }

    /// Optional bounded X11 focus pass — never blocks on compositor sync.
    pub fn wake_shell_wm_once(&self, app: &AppHandle) -> bool {
        if !x11_wm_tools_available() {
            return false;
        }
        self.refresh_shell_xid(app);
        if let Some(xid) = self
            .shell_xid()
            .or_else(|| load_persisted_shell_xid(app))
        {
            if window_title_matches_shell(xid) {
                eprintln!("[xi-io] wake_shell_wm_once xid={xid}");
                wm_activate_xid(xid);
                return true;
            }
        }
        for xid in discover_shell_xids() {
            if window_title_matches_shell(xid) {
                eprintln!("[xi-io] wake_shell_wm_once discovered xid={xid}");
                wm_activate_xid(xid);
                persist_shell_xid(app, xid);
                if let Ok(mut guard) = self.inner.shell_xid.lock() {
                    *guard = Some(xid);
                }
                return true;
            }
        }
        false
    }

    /// WM wake via xdotool — X11 only; no-op on Wayland.
    pub fn wake_shell_wm(&self, app: &AppHandle) -> bool {
        self.wake_shell_wm_once(app)
    }

    pub fn close_session_windows(&self, session_id: &str) {
        if !x11_wm_tools_available() {
            return;
        }
        let title = game_window_title(session_id);
        for xid in discover_xids_by_title(&title) {
            if window_title_matches_game_session(xid, session_id) {
                let id = xid.to_string();
                let _ = run_xdotool(&["windowkill", &id]);
            }
        }
    }
}

pub fn tag_session_windows(session_id: &str, pids: &[u32]) -> Vec<u64> {
    let title = game_window_title(session_id);
    let deadline = Instant::now() + Duration::from_secs(10);
    let mut tagged: Vec<u64> = Vec::new();

    while Instant::now() < deadline {
        for pid in pids {
            for xid in discover_xids_for_pid(*pid) {
                let _ = run_xdotool(&["set_window", "--name", &title, &xid.to_string()]);
                if !tagged.contains(&xid) {
                    tagged.push(xid);
                }
            }
        }
        if !tagged.is_empty() {
            break;
        }
        std::thread::sleep(Duration::from_millis(120));
    }

    tagged
}

fn shell_xid_path(app: &AppHandle) -> Option<PathBuf> {
    app.path()
        .app_data_dir()
        .ok()
        .map(|dir| dir.join(SHELL_XID_FILE))
}

fn persist_shell_xid(app: &AppHandle, xid: u64) {
    if let Some(path) = shell_xid_path(app) {
        if let Some(parent) = path.parent() {
            let _ = fs::create_dir_all(parent);
        }
        let _ = fs::write(path, xid.to_string());
    }
}

fn load_persisted_shell_xid(app: &AppHandle) -> Option<u64> {
    shell_xid_path(app)
        .and_then(|path| fs::read_to_string(path).ok())
        .and_then(|raw| raw.trim().parse::<u64>().ok())
}

fn discover_shell_xids() -> Vec<u64> {
    let mut ids = discover_xids_by_title(SHELL_WINDOW_TITLE);
    for xid in xdotool_search(&["--iconic", "--name", SHELL_WINDOW_TITLE]) {
        if !ids.contains(&xid) {
            ids.push(xid);
        }
    }
    let our_pid = std::process::id();
    for xid in discover_xids_for_pid(our_pid) {
        if !ids.contains(&xid) {
            ids.push(xid);
        }
    }
    ids
}

fn discover_xids_by_title(title: &str) -> Vec<u64> {
    let pattern = format!("^{}$", regex_escape(title));
    xdotool_search(&["--name", &pattern])
}

fn discover_xids_for_pid(pid: u32) -> Vec<u64> {
    xdotool_search(&["--pid", &pid.to_string()])
}

fn xdotool_search(args: &[&str]) -> Vec<u64> {
    let mut cmd = Command::new("xdotool");
    cmd.arg("search");
    for arg in args {
        cmd.arg(arg);
    }
    let output = match cmd.output() {
        Ok(o) if o.status.success() => o,
        _ => return Vec::new(),
    };
    String::from_utf8_lossy(&output.stdout)
        .split_whitespace()
        .filter_map(|s| s.parse::<u64>().ok())
        .collect()
}

fn run_xdotool(args: &[&str]) -> bool {
    run_subprocess_with_timeout("xdotool", args, 2)
}

fn wm_activate_xid(xid: u64) {
    let id = xid.to_string();
    let _ = run_xdotool(&["windowmap", &id]);
    let _ = run_xdotool(&["windowraise", &id]);
    // Never use --sync: it can block indefinitely and wedge the compositor under load.
    let _ = run_xdotool(&["windowactivate", &id]);
    if Command::new("wmctrl")
        .arg("-V")
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
    {
        let _ = run_subprocess_with_timeout("wmctrl", &["-ia", &format!("0x{xid:x}")], 2);
    }
}

fn window_name_for_xid(xid: u64) -> Option<String> {
    let output = run_xdotool_output(&["getwindowname", &xid.to_string()])?;
    let name = output.trim().to_string();
    if name.is_empty() {
        None
    } else {
        Some(name)
    }
}

fn window_title_matches_shell(xid: u64) -> bool {
    window_name_for_xid(xid)
        .map(|name| name == SHELL_WINDOW_TITLE)
        .unwrap_or(false)
}

fn window_title_matches_game_session(xid: u64, session_id: &str) -> bool {
    let expected = game_window_title(session_id);
    window_name_for_xid(xid)
        .map(|name| name == expected)
        .unwrap_or(false)
}

fn run_xdotool_output(args: &[&str]) -> Option<String> {
    let output = if crate::shell_restore::has_timeout_binary() {
        let mut cmd_args: Vec<String> = vec!["2".to_string(), "xdotool".to_string()];
        cmd_args.extend(args.iter().map(|s| s.to_string()));
        Command::new("timeout").args(&cmd_args).output().ok()?
    } else {
        Command::new("xdotool").args(args).output().ok()?
    };
    if !output.status.success() {
        return None;
    }
    Some(String::from_utf8_lossy(&output.stdout).to_string())
}

fn xid_is_alive(xid: u64) -> bool {
    window_name_for_xid(xid).is_some()
}

fn regex_escape(s: &str) -> String {
    s.chars()
        .flat_map(|c| {
            if ".^$|?*+()[]{}\\".contains(c) {
                vec!['\\', c]
            } else {
                vec![c]
            }
        })
        .collect()
}

fn is_pid_alive(pid: u32) -> bool {
    std::path::Path::new(&format!("/proc/{pid}")).exists()
}

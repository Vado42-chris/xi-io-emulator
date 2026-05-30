use std::fs;
use std::path::PathBuf;
use std::process::Command;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use crate::platform::x11_wm_tools_available;
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

    /// Send shell behind the emulator. Process stays alive; Tauri minimize + optional X11 lower.
    pub fn hibernate_shell(&self, app: &AppHandle) {
        if let Some(main) = app.get_webview_window("main") {
            let _ = main.set_title(SHELL_WINDOW_TITLE);
            let _ = main.minimize();
        }
        self.refresh_shell_xid(app);
        if x11_wm_tools_available() {
            if let Some(xid) = self.shell_xid() {
                persist_shell_xid(app, xid);
                eprintln!("[xi-io] hibernate shell xid={xid}");
                let id = xid.to_string();
                let _ = Command::new("xdotool")
                    .args(["windowlower", &id])
                    .status();
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

    /// WM wake via xdotool — X11 only; no-op on Wayland.
    pub fn wake_shell_wm(&self, app: &AppHandle) -> bool {
        if !x11_wm_tools_available() {
            return false;
        }
        let mut tried = false;
        if let Some(xid) = self
            .shell_xid()
            .or_else(|| load_persisted_shell_xid(app))
        {
            eprintln!("[xi-io] wake_shell_wm stored xid={xid}");
            wm_activate_xid(xid);
            tried = true;
        }
        self.refresh_shell_xid(app);
        if let Some(xid) = self.shell_xid() {
            eprintln!("[xi-io] wake_shell_wm refreshed xid={xid}");
            wm_activate_xid(xid);
            return true;
        }
        for xid in discover_shell_xids() {
            eprintln!("[xi-io] wake_shell_wm discovered xid={xid}");
            wm_activate_xid(xid);
            persist_shell_xid(app, xid);
            if let Ok(mut guard) = self.inner.shell_xid.lock() {
                *guard = Some(xid);
            }
            return true;
        }
        tried
    }

    pub fn wake_shell(&self, app: &AppHandle) {
        if let Some(main) = app.get_webview_window("main") {
            let _ = main.set_title(SHELL_WINDOW_TITLE);
            let _ = main.show();
            let _ = main.unminimize();
            let _ = main.set_always_on_top(true);
            let _ = main.set_focus();
            let _ = main.request_user_attention(Some(tauri::UserAttentionType::Critical));
            let _ = main.set_always_on_top(false);
        }
        if x11_wm_tools_available() {
            self.wake_shell_wm(app);
        }
    }

    pub fn spawn_shell_focus_retries(self, app: AppHandle) {
        std::thread::spawn(move || {
            for delay_ms in [0_u64, 100, 250, 500, 1000, 2000, 4000] {
                if delay_ms > 0 {
                    std::thread::sleep(Duration::from_millis(delay_ms));
                }
                let app_for_main = app.clone();
                let app_in_closure = app_for_main.clone();
                let registry = self.clone();
                let _ = app_for_main.run_on_main_thread(move || {
                    registry.wake_shell(&app_in_closure);
                });
                if x11_wm_tools_available() {
                    self.wake_shell_wm(&app);
                }
            }
        });
    }

    pub fn close_session_windows(&self, session_id: &str) {
        let title = game_window_title(session_id);
        for xid in discover_xids_by_title(&title) {
            let _ = Command::new("xdotool")
                .args(["windowkill", &xid.to_string()])
                .status();
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
                let _ = Command::new("xdotool")
                    .args(["set_window", "--name", &title, &xid.to_string()])
                    .status();
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

fn wm_activate_xid(xid: u64) {
    let id = xid.to_string();
    let _ = Command::new("xdotool")
        .args(["windowmap", &id])
        .status();
    let _ = Command::new("xdotool")
        .args(["windowraise", &id])
        .status();
    let _ = Command::new("xdotool")
        .args(["windowactivate", "--sync", &id])
        .status();
    if Command::new("wmctrl")
        .arg("-V")
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
    {
        let _ = Command::new("wmctrl")
            .args(["-ia", &format!("0x{xid:x}")])
            .status();
    }
}

fn xid_is_alive(xid: u64) -> bool {
    Command::new("xdotool")
        .args(["getwindowname", &xid.to_string()])
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
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

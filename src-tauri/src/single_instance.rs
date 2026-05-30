use std::fs::{self, OpenOptions};
use std::os::unix::io::AsRawFd;
use std::process::Command;
use tauri::{AppHandle, Manager};

use crate::shell_restore::run_subprocess_with_timeout;
use crate::window_registry::SHELL_WINDOW_TITLE;

/// Ensures only one xi-io Emulator instance runs. A second launch focuses the existing window and exits.
pub fn acquire_or_exit(app: &AppHandle) {
    let dir = match app.path().app_data_dir() {
        Ok(dir) => dir,
        Err(_) => return,
    };
    if fs::create_dir_all(&dir).is_err() {
        return;
    }

    let lock_path = dir.join("single-instance.lock");
    let file = match OpenOptions::new()
        .create(true)
        .write(true)
        .truncate(false)
        .open(&lock_path)
    {
        Ok(file) => file,
        Err(_) => return,
    };

    let locked = unsafe { libc::flock(file.as_raw_fd(), libc::LOCK_EX | libc::LOCK_NB) == 0 };
    if locked {
        std::mem::forget(file);
        return;
    }

    if let Some(window) = app.get_webview_window("main") {
        let _ = window.set_title(SHELL_WINDOW_TITLE);
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
    if let Ok(output) = Command::new("xdotool")
        .args(["search", "--name", SHELL_WINDOW_TITLE])
        .output()
    {
        if output.status.success() {
            if let Some(xid) = String::from_utf8_lossy(&output.stdout)
                .split_whitespace()
                .next()
            {
                let _ = run_subprocess_with_timeout("xdotool", &["windowactivate", xid], 2);
            }
        }
    }

    std::process::exit(0);
}

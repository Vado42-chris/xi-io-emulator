use std::process::Command;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum DisplayServer {
    X11,
    Wayland,
    Unknown,
}

pub fn display_server() -> DisplayServer {
    match std::env::var("XDG_SESSION_TYPE")
        .unwrap_or_default()
        .to_lowercase()
        .as_str()
    {
        "x11" => DisplayServer::X11,
        "wayland" => DisplayServer::Wayland,
        _ => DisplayServer::Unknown,
    }
}

/// xdotool/wmctrl only work on X11; on Wayland rely on Tauri window APIs.
pub fn x11_wm_tools_available() -> bool {
    if display_server() == DisplayServer::Wayland {
        return false;
    }
    Command::new("xdotool")
        .arg("--version")
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
}

pub fn log_platform_context() {
    eprintln!(
        "[xi-io] platform XDG_SESSION_TYPE={} x11_tools={}",
        std::env::var("XDG_SESSION_TYPE").unwrap_or_else(|_| "unknown".into()),
        x11_wm_tools_available()
    );
}

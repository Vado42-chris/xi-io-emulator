use serde::Serialize;
use std::fs;
use std::path::Path;
use tauri::{AppHandle, Manager, Window};

#[derive(Serialize)]
pub struct PathCheckResult {
    pub path: String,
    pub exists: bool,
    pub is_file: bool,
}

#[derive(Serialize)]
pub struct SpawnResult {
    pub success: bool,
    pub exit_code: Option<i32>,
    pub stdout: String,
    pub stderr: String,
}

#[derive(Serialize)]
pub struct InputDeviceInfo {
    pub name: String,
    pub handlers: Vec<String>,
    pub is_joystick: bool,
}

// #xar:controller-launch-proof/tauri/active
#[tauri::command]
fn path_exists(path: String) -> PathCheckResult {
    let p = Path::new(&path);
    PathCheckResult {
        path: path.clone(),
        exists: p.exists(),
        is_file: p.is_file(),
    }
}

// #xar:controller-launch-proof/launch/active
#[tauri::command]
async fn launch_emulator(
    app: AppHandle,
    window: Window,
    program: String,
    args: Vec<String>,
) -> Result<SpawnResult, String> {
    use tokio::process::Command;

    if !Path::new(&program).exists() {
        return Err(format!("Engine binary not found: {}", program));
    }

    let mut child = Command::new(&program)
        .args(&args)
        .spawn()
        .map_err(|e| format!("Failed to spawn {}: {}", program, e))?;

    let output = child
        .wait_with_output()
        .await
        .map_err(|e| format!("Failed waiting for emulator exit: {}", e))?;

    let _ = window.show();
    let _ = window.unminimize();
    let _ = window.set_focus();

    if let Some(main_window) = app.get_webview_window("main") {
        let _ = main_window.show();
        let _ = main_window.unminimize();
        let _ = main_window.set_focus();
    }

    Ok(SpawnResult {
        success: output.status.success(),
        exit_code: output.status.code(),
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
    })
}

// #xio:emulator/controller/proof
#[tauri::command]
fn list_input_devices() -> Result<Vec<InputDeviceInfo>, String> {
    let raw = fs::read_to_string("/proc/bus/input/devices")
        .map_err(|e| format!("Unable to read /proc/bus/input/devices: {}", e))?;

    let mut devices: Vec<InputDeviceInfo> = Vec::new();
    let mut current_name = String::new();
    let mut current_handlers: Vec<String> = Vec::new();

    for line in raw.lines() {
        if line.starts_with('N') {
            if !current_name.is_empty() {
                let is_joystick = current_handlers.iter().any(|h| h.starts_with("js"));
                if is_joystick || current_name.to_lowercase().contains("gamepad") {
                    devices.push(InputDeviceInfo {
                        name: current_name.clone(),
                        handlers: current_handlers.clone(),
                        is_joystick,
                    });
                }
            }
            current_name = line
                .trim_start_matches('N')
                .trim_start_matches(':')
                .trim()
                .to_string();
            current_handlers.clear();
        } else if line.starts_with('H') {
            let handlers = line.trim_start_matches('H').trim_start_matches(':').trim();
            for handler in handlers.split('=').nth(1).unwrap_or("").split(' ') {
                let h = handler.trim();
                if !h.is_empty() {
                    current_handlers.push(h.to_string());
                }
            }
        }
    }

    if !current_name.is_empty() {
        let is_joystick = current_handlers.iter().any(|h| h.starts_with("js"));
        if is_joystick || current_name.to_lowercase().contains("gamepad") {
            devices.push(InputDeviceInfo {
                name: current_name,
                handlers: current_handlers,
                is_joystick,
            });
        }
    }

    Ok(devices)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            path_exists,
            launch_emulator,
            list_input_devices
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

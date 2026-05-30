// #xar:controller-launch-proof/pass-b — native in-game return button (works while emulator has focus)
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::fs::{self, File, OpenOptions};
use std::io::Read;
use std::os::unix::fs::OpenOptionsExt;
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter, Manager};

const JS_EVENT_BUTTON: u8 = 0x01;
const EV_KEY: u16 = 1;
const BTN_SELECT: u16 = 314;
const BTN_START: u16 = 315;
const BTN_GUIDE: u16 = 316;
const JS_BTN_SELECT: u8 = 8;
const JS_BTN_START: u8 = 9;
const JS_BTN_GUIDE: u8 = 16;
const DEFAULT_CHORD_HOLD_MS: u64 = 800;
const RETURN_MONITOR_ARM_MS: u64 = 3000;
const EV_ABS: u16 = 3;
const ABS_X: u16 = 0;
const ABS_Y: u16 = 1;
const ABS_HAT0X: u16 = 16;
const ABS_HAT0Y: u16 = 17;
const STICK_DEADZONE: i32 = 8000;
const CONFIG_FILE: &str = "shell_exit_mapping.json";

#[derive(Clone, Copy, Debug, Default, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ShellGamepadEdges {
    pub up: bool,
    pub down: bool,
    pub left: bool,
    pub right: bool,
    pub confirm: bool,
    pub back: bool,
    pub favorite: bool,
    pub search: bool,
    pub menu: bool,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ShellExitMapping {
    pub device_path: String,
    pub device_name: String,
    pub input_kind: String,
    pub button_code: u16,
    pub button_label: String,
    pub configured_at: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub button_number: Option<u8>,
}

#[derive(Clone, Debug)]
struct InputDeviceEntry {
    name: String,
    handlers: Vec<String>,
}

#[repr(C)]
struct JsEvent {
    time: u32,
    value: i16,
    event_type: u8,
    number: u8,
}

fn parse_js_event(bytes: &[u8]) -> Option<JsEvent> {
    if bytes.len() < 8 {
        return None;
    }
    Some(JsEvent {
        time: u32::from_le_bytes([bytes[0], bytes[1], bytes[2], bytes[3]]),
        value: i16::from_le_bytes([bytes[4], bytes[5]]),
        event_type: bytes[6],
        number: bytes[7],
    })
}

fn config_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Unable to resolve app data dir: {}", e))?;
    Ok(dir.join(CONFIG_FILE))
}

fn normalize_mapping(mut mapping: ShellExitMapping) -> ShellExitMapping {
    if mapping.input_kind.is_empty() {
        mapping.input_kind = if mapping.device_path.contains("/js") {
            "js".to_string()
        } else {
            "evdev".to_string()
        };
    }
    if mapping.button_code == 0 {
        if let Some(number) = mapping.button_number {
            mapping.button_code = number as u16;
        }
    }
    mapping
}

pub fn load_shell_exit_mapping(app: &AppHandle) -> Result<Option<ShellExitMapping>, String> {
    let path = config_path(app)?;
    if !path.exists() {
        return Ok(None);
    }
    let raw = fs::read_to_string(&path).map_err(|e| format!("Unable to read shell exit mapping: {}", e))?;
    let mapping: ShellExitMapping =
        serde_json::from_str(&raw).map_err(|e| format!("Invalid shell exit mapping JSON: {}", e))?;
    Ok(Some(normalize_mapping(mapping)))
}

pub fn save_shell_exit_mapping(app: &AppHandle, mapping: &ShellExitMapping) -> Result<(), String> {
    let path = config_path(app)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Unable to create app data dir: {}", e))?;
    }
    let raw = serde_json::to_string_pretty(mapping)
        .map_err(|e| format!("Unable to serialize shell exit mapping: {}", e))?;
    fs::write(&path, raw).map_err(|e| format!("Unable to write shell exit mapping: {}", e))?;
    Ok(())
}

pub fn clear_shell_exit_mapping(app: &AppHandle) -> Result<(), String> {
    let path = config_path(app)?;
    if path.exists() {
        fs::remove_file(&path).map_err(|e| format!("Unable to remove shell exit mapping: {}", e))?;
    }
    Ok(())
}

fn parse_input_devices() -> Result<Vec<InputDeviceEntry>, String> {
    let raw = fs::read_to_string("/proc/bus/input/devices")
        .map_err(|e| format!("Unable to read /proc/bus/input/devices: {}", e))?;

    let mut devices: Vec<InputDeviceEntry> = Vec::new();
    let mut current_name = String::new();
    let mut current_handlers: Vec<String> = Vec::new();

    for line in raw.lines() {
        if line.starts_with('N') {
            if !current_name.is_empty() {
                devices.push(InputDeviceEntry {
                    name: current_name.clone(),
                    handlers: current_handlers.clone(),
                });
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
        devices.push(InputDeviceEntry {
            name: current_name,
            handlers: current_handlers,
        });
    }

    Ok(devices)
}

fn is_denied_capture_device(name: &str) -> bool {
    let lower = name.to_lowercase();
    lower.contains("power button")
        || lower.contains("sleep button")
        || lower.contains("video bus")
        || lower.contains("hdmi")
        || lower.contains("tartarus")
        || lower.contains("g502")
        || lower.contains("hero se")
        || lower.contains("corsair")
        || lower.contains("mouse")
        || lower.contains("keyboard")
        || lower.contains("keypad")
        || lower.contains("consumer control")
}

fn is_likely_gamepad(name: &str, handlers: &[String]) -> bool {
    if is_denied_capture_device(name) {
        return false;
    }

    if handlers.iter().any(|h| h.starts_with("js")) {
        return true;
    }

    let lower = name.to_lowercase();
    lower.contains("gamepad")
        || lower.contains("joystick")
        || lower.contains("controller")
        || lower.contains("xbox")
        || lower.contains("xinput")
        || lower.contains("playstation")
        || lower.contains("dualshock")
        || lower.contains("dualsense")
        || lower.contains("8bitdo")
        || lower.contains("zikway")
        || lower.contains("switch pro")
        || lower.contains("wireless gamepad")
        || lower.contains("usb gamepad")
        || (lower.contains("usb") && lower.contains("pad"))
        || (lower.contains("generic") && lower.contains("game"))
}

fn list_evdev_candidate_devices() -> Result<Vec<(String, String)>, String> {
    let mut devices: Vec<(String, String)> = Vec::new();
    for entry in parse_input_devices()? {
        if is_denied_capture_device(&entry.name) {
            continue;
        }
        if !entry.handlers.iter().any(|h| h.starts_with("event")) {
            continue;
        }
        if !is_likely_gamepad(&entry.name, &entry.handlers) {
            // Still allow unknown USB input endpoints that are not keyboards/mice.
            let lower = entry.name.to_lowercase();
            if !(lower.contains("usb") || entry.handlers.iter().any(|h| h.starts_with("js"))) {
                continue;
            }
        }
        for handler in &entry.handlers {
            if let Some(index) = handler.strip_prefix("event") {
                if index.chars().all(|c| c.is_ascii_digit()) {
                    devices.push((format!("/dev/input/{handler}"), entry.name.clone()));
                }
            }
        }
    }
    Ok(devices)
}

fn list_evdev_gamepad_devices() -> Result<Vec<(String, String)>, String> {
    list_evdev_candidate_devices()
}

pub fn list_js_devices() -> Result<Vec<(String, String)>, String> {
    let mut devices: Vec<(String, String)> = Vec::new();
    for entry in parse_input_devices()? {
        if !is_likely_gamepad(&entry.name, &entry.handlers) {
            continue;
        }
        for handler in &entry.handlers {
            if let Some(index) = handler.strip_prefix("js") {
                if index.chars().all(|c| c.is_ascii_digit()) {
                    devices.push((format!("/dev/input/{handler}"), entry.name.clone()));
                }
            }
        }
    }
    Ok(devices)
}

pub fn list_capture_source_summary() -> Result<String, String> {
    let evdev = list_evdev_gamepad_devices()?;
    let js = list_js_devices()?;
    if evdev.is_empty() && js.is_empty() {
        return Ok("No gamepad input nodes found under /dev/input.".to_string());
    }
    let mut lines: Vec<String> = Vec::new();
    for (path, name) in evdev {
        lines.push(format!("evdev: {path} ({name})"));
    }
    for (path, name) in js {
        lines.push(format!("js: {path} ({name})"));
    }
    Ok(lines.join("\n"))
}

fn open_nonblocking(path: &str) -> Result<File, String> {
    OpenOptions::new()
        .read(true)
        .custom_flags(libc::O_NONBLOCK)
        .open(path)
        .map_err(|e| format!("Unable to open {}: {}", path, e))
}

fn button_label_for_js(number: u8) -> String {
    match number {
        0 => "A / Cross".to_string(),
        1 => "B / Circle".to_string(),
        2 => "X / Square".to_string(),
        3 => "Y / Triangle".to_string(),
        8 => "Select / Share".to_string(),
        9 => "Start / Options".to_string(),
        10 => "L3".to_string(),
        11 => "R3".to_string(),
        12 => "D-pad Up".to_string(),
        13 => "D-pad Down".to_string(),
        14 => "D-pad Left".to_string(),
        15 => "D-pad Right".to_string(),
        16 => "Guide / Home / System".to_string(),
        other => format!("Button {other}"),
    }
}

fn button_label_for_evdev(code: u16) -> String {
    match code {
        304 => "A / Cross".to_string(),
        305 => "B / Circle".to_string(),
        306 => "C".to_string(),
        307 => "X / Square".to_string(),
        308 => "Y / Triangle".to_string(),
        309 => "Z".to_string(),
        310 => "L1 / LB".to_string(),
        311 => "R1 / RB".to_string(),
        312 => "L2 / LT".to_string(),
        313 => "R2 / RT".to_string(),
        314 => "Select / Back".to_string(),
        315 => "Start / Options".to_string(),
        316 => "Guide / Home / System".to_string(),
        317 => "L3".to_string(),
        318 => "R3".to_string(),
        544 => "D-pad Up".to_string(),
        545 => "D-pad Down".to_string(),
        546 => "D-pad Left".to_string(),
        547 => "D-pad Right".to_string(),
        other => format!("Button code {other}"),
    }
}

fn is_gamepad_button_code(code: u16) -> bool {
    (288..=547).contains(&code)
}

fn verify_capture_access(devices: &[(String, String)]) -> Result<(), String> {
    if devices.is_empty() {
        return Ok(());
    }

    let mut opened = 0usize;
    let mut last_err = String::new();
    for (path, name) in devices {
        match open_nonblocking(path) {
            Ok(_) => opened += 1,
            Err(err) => last_err = format!("{name} ({path}): {}", permission_hint(&err)),
        }
    }

    if opened == 0 {
        return Err(if last_err.is_empty() {
            "Unable to open gamepad input devices.".to_string()
        } else {
            last_err
        });
    }

    Ok(())
}

fn drain_evdev_button_press_file(file: &mut File) -> Option<u16> {
    let mut buf = [0u8; 24];
    loop {
        match file.read(&mut buf) {
            Ok(24) => {
                let type_ = u16::from_le_bytes([buf[16], buf[17]]);
                let code = u16::from_le_bytes([buf[18], buf[19]]);
                let value = i32::from_le_bytes([buf[20], buf[21], buf[22], buf[23]]);
                if type_ == EV_KEY && value == 1 && is_gamepad_button_code(code) {
                    return Some(code);
                }
            }
            Ok(0) => break,
            Ok(_) => break,
            Err(err) if err.kind() == std::io::ErrorKind::WouldBlock => break,
            Err(err) if err.kind() == std::io::ErrorKind::Interrupted => continue,
            Err(_) => break,
        }
    }
    None
}

fn drain_evdev_button_press(path: &str) -> Option<u16> {
    let mut file = open_nonblocking(path).ok()?;
    drain_evdev_button_press_file(&mut file)
}

fn drain_js_button_press_file(file: &mut File) -> Option<u8> {
    let mut buf = [0u8; 8];
    loop {
        match file.read(&mut buf) {
            Ok(0) => break,
            Ok(n) if n >= 8 => {
                if let Some(ev) = parse_js_event(&buf) {
                    if ev.event_type == JS_EVENT_BUTTON && ev.value == 1 {
                        return Some(ev.number);
                    }
                }
            }
            Ok(_) => break,
            Err(err) if err.kind() == std::io::ErrorKind::WouldBlock => break,
            Err(err) if err.kind() == std::io::ErrorKind::Interrupted => continue,
            Err(_) => break,
        }
    }
    None
}

fn drain_js_button_press(path: &str) -> Option<u8> {
    let mut file = open_nonblocking(path).ok()?;
    drain_js_button_press_file(&mut file)
}

fn permission_hint(err: &str) -> String {
    if err.contains("Permission denied") || err.contains("EACCES") {
        format!(
            "{err}. Linux may require input device access — try: sudo usermod -aG input \"$USER\" then log out and back in."
        )
    } else {
        err.to_string()
    }
}

pub fn capture_shell_exit_button(timeout_ms: u64) -> Result<ShellExitMapping, String> {
    let evdev_devices = list_evdev_gamepad_devices()?;
    let js_devices = list_js_devices()?;

    if evdev_devices.is_empty() && js_devices.is_empty() {
        return Err(
            "No gamepad input devices found. Connect a USB controller, then retry. \
             If a pad is connected, Linux may not expose it as a joystick yet."
                .to_string(),
        );
    }

    verify_capture_access(&evdev_devices)?;
    verify_capture_access(&js_devices)?;

    let mut evdev_handles: Vec<(File, String, String)> = Vec::new();
    for (path, name) in evdev_devices {
        if let Ok(file) = open_nonblocking(&path) {
            evdev_handles.push((file, path, name));
        }
    }

    let mut js_handles: Vec<(File, String, String)> = Vec::new();
    for (path, name) in js_devices {
        if let Ok(file) = open_nonblocking(&path) {
            js_handles.push((file, path, name));
        }
    }

    let deadline = Instant::now() + Duration::from_millis(timeout_ms);

    while Instant::now() < deadline {
        for (file, path, name) in &mut evdev_handles {
            if let Some(code) = drain_evdev_button_press_file(file) {
                return Ok(ShellExitMapping {
                    device_path: path.clone(),
                    device_name: name.clone(),
                    input_kind: "evdev".to_string(),
                    button_code: code,
                    button_label: button_label_for_evdev(code),
                    configured_at: chrono_now(),
                    button_number: None,
                });
            }
        }

        for (file, path, name) in &mut js_handles {
            if let Some(number) = drain_js_button_press_file(file) {
                return Ok(ShellExitMapping {
                    device_path: path.clone(),
                    device_name: name.clone(),
                    input_kind: "js".to_string(),
                    button_code: number as u16,
                    button_label: button_label_for_js(number),
                    configured_at: chrono_now(),
                    button_number: Some(number),
                });
            }
        }

        thread::sleep(Duration::from_millis(20));
    }

    Err("Timed out waiting for a controller button press. Press any face, menu, or guide button on your controller.".to_string())
}

fn chrono_now() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let ms = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis())
        .unwrap_or(0);
    format!("{ms}")
}

fn update_js_pressed(file: &mut File, pressed: &mut HashSet<u8>) {
    let mut buf = [0u8; 8];
    loop {
        match file.read(&mut buf) {
            Ok(0) => break,
            Ok(n) if n >= 8 => {
                if let Some(ev) = parse_js_event(&buf) {
                    if ev.event_type == JS_EVENT_BUTTON {
                        if ev.value == 0 {
                            pressed.remove(&ev.number);
                        } else if ev.value == 1 {
                            pressed.insert(ev.number);
                        }
                    }
                }
            }
            Ok(_) => break,
            Err(err) if err.kind() == std::io::ErrorKind::WouldBlock => break,
            Err(err) if err.kind() == std::io::ErrorKind::Interrupted => continue,
            Err(_) => break,
        }
    }
}

fn update_evdev_pressed(file: &mut File, pressed: &mut HashSet<u16>) {
    let mut buf = [0u8; 24];
    loop {
        match file.read(&mut buf) {
            Ok(24) => {
                let type_ = u16::from_le_bytes([buf[16], buf[17]]);
                let code = u16::from_le_bytes([buf[18], buf[19]]);
                let value = i32::from_le_bytes([buf[20], buf[21], buf[22], buf[23]]);
                if type_ == EV_KEY && is_gamepad_button_code(code) {
                    if value == 0 {
                        pressed.remove(&code);
                    } else if value == 1 {
                        pressed.insert(code);
                    }
                }
            }
            Ok(0) => break,
            Ok(_) => break,
            Err(err) if err.kind() == std::io::ErrorKind::WouldBlock => break,
            Err(err) if err.kind() == std::io::ErrorKind::Interrupted => continue,
            Err(_) => break,
        }
    }
}

fn default_exit_chord_active(
    evdev_pressed: &HashSet<u16>,
    js_pressed: &HashSet<u8>,
    chord_since: &mut Option<Instant>,
) -> bool {
    if evdev_pressed.contains(&BTN_GUIDE) || js_pressed.contains(&JS_BTN_GUIDE) {
        return true;
    }

    let chord_held = (evdev_pressed.contains(&BTN_SELECT) && evdev_pressed.contains(&BTN_START))
        || (js_pressed.contains(&JS_BTN_SELECT) && js_pressed.contains(&JS_BTN_START));

    if chord_held {
        let since = chord_since.get_or_insert_with(Instant::now);
        if since.elapsed() >= Duration::from_millis(DEFAULT_CHORD_HOLD_MS) {
            return true;
        }
    } else {
        *chord_since = None;
    }

    false
}

fn focus_main_window(app: &AppHandle) {
    let _ = app.get_webview_window("main").map(|window| {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    });
}

/// Native return-to-arcade monitor. Works while FCEUX/RetroArch has focus — no emulator menus required.
/// Always listens for Guide/Home and hold Select + Start; also honors a saved single-button mapping.
pub fn spawn_launch_return_monitor(
    app: AppHandle,
    stop: Arc<AtomicBool>,
    on_trigger: Arc<dyn Fn() + Send + Sync>,
) {
    let custom = load_shell_exit_mapping(&app).ok().flatten();

    thread::spawn(move || {
        let mut last_trigger = Instant::now() - Duration::from_secs(2);
        let armed_at = Instant::now();

        let mut custom_source = custom.as_ref().and_then(|mapping| {
            open_nonblocking(&mapping.device_path)
                .ok()
                .map(|file| (file, mapping.clone()))
        });

        let mut evdev_handles: Vec<File> = list_evdev_gamepad_devices()
            .unwrap_or_default()
            .into_iter()
            .filter_map(|(path, _)| open_nonblocking(&path).ok())
            .collect();
        let mut js_handles: Vec<File> = list_js_devices()
            .unwrap_or_default()
            .into_iter()
            .filter_map(|(path, _)| open_nonblocking(&path).ok())
            .collect();

        let mut evdev_pressed: HashSet<u16> = HashSet::new();
        let mut js_pressed: HashSet<u8> = HashSet::new();
        let mut chord_since: Option<Instant> = None;

        while !stop.load(Ordering::Relaxed) {
            let mut matched = false;

            if let Some((file, mapping)) = custom_source.as_mut() {
                matched = match mapping.input_kind.as_str() {
                    "js" => drain_js_button_press_file(file)
                        .map(|number| number as u16 == mapping.button_code)
                        .unwrap_or(false),
                    _ => drain_evdev_button_press_file(file)
                        .map(|code| code == mapping.button_code)
                        .unwrap_or(false),
                };
                if !matched {
                    if open_nonblocking(&mapping.device_path).is_ok() {
                        custom_source = custom.as_ref().and_then(|m| {
                            open_nonblocking(&m.device_path)
                                .ok()
                                .map(|file| (file, m.clone()))
                        });
                    }
                }
            }

            for file in &mut evdev_handles {
                update_evdev_pressed(file, &mut evdev_pressed);
            }
            for file in &mut js_handles {
                update_js_pressed(file, &mut js_pressed);
            }

            if !matched {
                matched = default_exit_chord_active(&evdev_pressed, &js_pressed, &mut chord_since);
            }

            if matched && armed_at.elapsed() >= Duration::from_millis(RETURN_MONITOR_ARM_MS)
                && last_trigger.elapsed() >= Duration::from_millis(400)
            {
                last_trigger = Instant::now();
                chord_since = None;
                on_trigger();
            }

            thread::sleep(Duration::from_millis(25));
        }
    });
}

#[derive(Default)]
struct EvdevGamepadState {
    pressed: HashSet<u16>,
    hat_x: i32,
    hat_y: i32,
    abs_x: i32,
    abs_y: i32,
}

struct EvdevGamepadDevice {
    file: File,
    name: String,
    state: EvdevGamepadState,
}

fn apply_evdev_event(state: &mut EvdevGamepadState, type_: u16, code: u16, value: i32) {
    match type_ {
        EV_KEY => {
            if value == 0 {
                state.pressed.remove(&code);
            } else if value == 1 {
                state.pressed.insert(code);
            }
        }
        EV_ABS => match code {
            ABS_HAT0X => state.hat_x = value,
            ABS_HAT0Y => state.hat_y = value,
            ABS_X => state.abs_x = value,
            ABS_Y => state.abs_y = value,
            _ => {}
        },
        _ => {}
    }
}

fn drain_evdev_state_file(file: &mut File, state: &mut EvdevGamepadState) {
    let mut buf = [0u8; 24];
    loop {
        match file.read(&mut buf) {
            Ok(24) => {
                let type_ = u16::from_le_bytes([buf[16], buf[17]]);
                let code = u16::from_le_bytes([buf[18], buf[19]]);
                let value = i32::from_le_bytes([buf[20], buf[21], buf[22], buf[23]]);
                apply_evdev_event(state, type_, code, value);
            }
            Ok(0) => break,
            Ok(_) => break,
            Err(err) if err.kind() == std::io::ErrorKind::WouldBlock => break,
            Err(err) if err.kind() == std::io::ErrorKind::Interrupted => continue,
            Err(_) => break,
        }
    }
}

fn axis_direction(value: i32) -> i8 {
    if value < -STICK_DEADZONE {
        -1
    } else if value > STICK_DEADZONE {
        1
    } else {
        0
    }
}

fn snapshot_to_edges(state: &EvdevGamepadState) -> ShellGamepadEdges {
    let up = state.hat_y == -1
        || state.pressed.contains(&544)
        || axis_direction(state.abs_y) < 0;
    let down = state.hat_y == 1
        || state.pressed.contains(&545)
        || axis_direction(state.abs_y) > 0;
    let left = state.hat_x == -1
        || state.pressed.contains(&546)
        || axis_direction(state.abs_x) < 0;
    let right = state.hat_x == 1
        || state.pressed.contains(&547)
        || axis_direction(state.abs_x) > 0;

    ShellGamepadEdges {
        up,
        down,
        left,
        right,
        confirm: state.pressed.contains(&304),
        back: state.pressed.contains(&305),
        favorite: state.pressed.contains(&307),
        search: state.pressed.contains(&308),
        menu: state.pressed.contains(&315) || state.pressed.contains(&314),
    }
}

fn edge_delta(prev: &ShellGamepadEdges, next: &ShellGamepadEdges) -> ShellGamepadEdges {
    ShellGamepadEdges {
        up: next.up && !prev.up,
        down: next.down && !prev.down,
        left: next.left && !prev.left,
        right: next.right && !prev.right,
        confirm: next.confirm && !prev.confirm,
        back: next.back && !prev.back,
        favorite: next.favorite && !prev.favorite,
        search: next.search && !prev.search,
        menu: next.menu && !prev.menu,
    }
}

fn open_evdev_devices() -> Vec<EvdevGamepadDevice> {
    let mut devices = Vec::new();
    let Ok(list) = list_evdev_candidate_devices() else {
        return devices;
    };

    for (path, name) in list {
        if let Ok(file) = open_nonblocking(&path) {
            devices.push(EvdevGamepadDevice {
                file,
                name,
                state: EvdevGamepadState::default(),
            });
        }
    }

    devices
}

pub fn spawn_shell_gamepad_bridge(app: AppHandle, active_pid: Arc<Mutex<Option<u32>>>) {
    thread::spawn(move || {
        let mut devices = open_evdev_devices();
        let mut prev = ShellGamepadEdges::default();

        loop {
            let emulator_running = active_pid
                .lock()
                .ok()
                .and_then(|guard| *guard)
                .is_some();

            if emulator_running {
                prev = ShellGamepadEdges::default();
                thread::sleep(Duration::from_millis(50));
                if devices.is_empty() {
                    devices = open_evdev_devices();
                }
                continue;
            }

            if devices.is_empty() {
                devices = open_evdev_devices();
            }

            let mut combined = ShellGamepadEdges::default();
            for device in &mut devices {
                drain_evdev_state_file(&mut device.file, &mut device.state);
                let snap = snapshot_to_edges(&device.state);
                combined.up |= snap.up;
                combined.down |= snap.down;
                combined.left |= snap.left;
                combined.right |= snap.right;
                combined.confirm |= snap.confirm;
                combined.back |= snap.back;
                combined.favorite |= snap.favorite;
                combined.search |= snap.search;
                combined.menu |= snap.menu;
            }

            let edges = edge_delta(&prev, &combined);
            prev = combined;

            if edges != ShellGamepadEdges::default() {
                let _ = app.emit("shell-gamepad-edges", edges);
            }

            thread::sleep(Duration::from_millis(16));
        }
    });
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_js_button_event() {
        let mut bytes = [0u8; 8];
        bytes[4] = 1;
        bytes[6] = JS_EVENT_BUTTON;
        bytes[7] = 16;
        let ev = parse_js_event(&bytes).expect("event");
        assert_eq!(ev.event_type, JS_EVENT_BUTTON);
        assert_eq!(ev.number, 16);
        assert_eq!(ev.value, 1);
    }

    #[test]
    fn recognizes_gamepad_names() {
        assert!(is_likely_gamepad(
            "Zikway USB Joystick",
            &["event7".to_string(), "js0".to_string()]
        ));
        assert!(!is_likely_gamepad(
            "Logitech G502 HERO SE",
            &["mouse0".to_string(), "event3".to_string()]
        ));
    }
}

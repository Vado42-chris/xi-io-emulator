use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::Path;
use std::sync::atomic::AtomicBool;
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager, State, Window};

mod display_service;
pub mod emulator_process;
pub mod game_session;
pub mod platform;
mod shell_exit_input;
mod engine_launch;
mod gamepad_guid;
mod fceux_input_config;
mod session_startup;
mod shell_restore;
mod single_instance;
mod window_registry;
mod play_session_db;

use display_service::{identify_displays, list_connected_displays, DisplayInfo};
use emulator_process::{
    cleanup_blocking_emulator_instances, cleanup_orphan_emulators,
    cleanup_stale_session_supervisors, collect_pgid, emulator_playable_signal,
    force_terminate_session, is_process_alive,
    load_session_record, save_session_record, EmulatorSessionRecord,
};
use game_session::{
    resolve_session_runner_path, signal_supervisor_stop,
    wait_for_supervisor_exit, SESSION_RUN_ARG,
};
use shell_exit_input::{
    capture_shell_exit_button, clear_shell_exit_mapping, load_shell_exit_mapping,
    save_shell_exit_mapping, spawn_launch_return_monitor, spawn_shell_gamepad_bridge,
    ShellExitMapping,
};
use window_registry::{tag_session_windows, new_session_id, WindowRegistry};
use shell_restore::{finish_shell_restore, try_begin_shell_restore, ShellRestoreResult};
use fceux_input_config::{prepare_fceux_input_config, FceuxLaunchInputPrep};

#[derive(Clone, Debug)]
struct ActiveEmulatorSession {
    session_id: String,
    supervisor_pid: Option<u32>,
    pids: Vec<u32>,
    pgid: Option<i32>,
    program: String,
    content_path: String,
    game_id: String,
    engine_id: String,
    started_at: String,
    game_window_xids: Vec<u64>,
    session_reached_game: bool,
}

#[derive(Clone, Default)]
struct EmulatorLaunchState {
    active_session: Arc<Mutex<Option<ActiveEmulatorSession>>>,
    terminate_requested: Arc<AtomicBool>,
    terminate_in_progress: Arc<AtomicBool>,
}

impl EmulatorLaunchState {
    fn active_pid(&self) -> Arc<Mutex<Option<u32>>> {
        let session = self.active_session.clone();
        Arc::new(Mutex::new(
            session
                .lock()
                .ok()
                .and_then(|guard| guard.as_ref().and_then(|s| s.pids.first().copied())),
        ))
    }

    fn terminate_session(&self, app: &AppHandle, reason: &str) -> bool {
        if self
            .terminate_in_progress
            .compare_exchange(false, true, std::sync::atomic::Ordering::SeqCst, std::sync::atomic::Ordering::SeqCst)
            .is_err()
        {
            eprintln!("[xi-io] skip duplicate terminate_session reason={reason}");
            return false;
        }

        let result = self.terminate_session_inner(app, reason);
        self.terminate_in_progress
            .store(false, std::sync::atomic::Ordering::SeqCst);
        result
    }

    fn terminate_session_inner(&self, app: &AppHandle, reason: &str) -> bool {
        let session = self
            .active_session
            .lock()
            .ok()
            .and_then(|guard| guard.clone());

        let Some(session) = session else {
            return false;
        };

        // Wake the shell immediately on intentional exit — game teardown runs in parallel.
        schedule_restore_arcade_shell(
            app,
            &session.game_id,
            &session.session_id,
            reason,
        );

        let pids = session.pids.clone();
        let pgid = session.pgid.or_else(|| pids.first().and_then(|pid| collect_pgid(*pid)));

        if let Some(supervisor_pid) = session.supervisor_pid {
            signal_supervisor_stop(supervisor_pid);
            let exited = wait_for_supervisor_exit(supervisor_pid, Duration::from_secs(4));
            if !exited {
                eprintln!("[xi-io] supervisor pid={supervisor_pid} did not exit — pid-only emulator cleanup");
                let _ = force_terminate_session(
                    &session.program,
                    &session.content_path,
                    &pids,
                    pgid,
                );
            }
        } else {
            let _ = force_terminate_session(&session.program, &session.content_path, &pids, pgid);
        }

        let ended_at = chrono_like_now();
        let record = EmulatorSessionRecord {
            game_id: session.game_id.clone(),
            content_path: session.content_path.clone(),
            engine_id: session.engine_id.clone(),
            program: session.program.clone(),
            started_at: session.started_at.clone(),
            ended_at: Some(ended_at),
            exit_reason: reason.to_string(),
            pids: pids.clone(),
        };
        let _ = save_session_record(app, &record);
        let game_id = session.game_id.clone();
        let session_id = session.session_id.clone();

        if let Ok(mut guard) = self.active_session.lock() {
            *guard = None;
        }
        let registry = app.state::<WindowRegistry>();
        registry.close_session_windows(&session_id);
        registry.end_session(&session_id);

        if reason == "shell_exit_button" || reason == "shell_ui_exit" {
            complete_emulator_session(
                app,
                &game_id,
                &session_id,
                reason,
                true,
                None,
                true,
            );
        }

        true
    }
}

fn chrono_like_now() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);
    secs.to_string()
}

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
    /// True when the emulator is running in the background and the shell hibernated.
    pub session_started: bool,
}

#[derive(Serialize)]
pub struct InputDeviceInfo {
    pub name: String,
    pub handlers: Vec<String>,
    pub is_joystick: bool,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LaunchDisplayPreferences {
    pub mode: String,
    pub display_id: String,
    pub display_index: u32,
    pub window_width: u32,
    pub window_height: u32,
    pub remember_choice: bool,
}

const DISPLAY_PREFS_FILE: &str = "launch_display_preferences.json";

fn display_prefs_path(app: &AppHandle) -> Result<std::path::PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Unable to resolve app data dir: {e}"))?;
    Ok(dir.join(DISPLAY_PREFS_FILE))
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

#[tauri::command]
fn command_on_path(name: String) -> bool {
    engine_launch::find_on_path(&name).is_some()
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct LaunchPlanValidation {
    valid: bool,
    error: Option<String>,
    program: String,
    args: Vec<String>,
}

#[tauri::command]
fn validate_launch_plan(program: String, args: Vec<String>) -> LaunchPlanValidation {
    match engine_launch::prepare_launch(&program, &args) {
        Ok(prepared) => LaunchPlanValidation {
            valid: true,
            error: None,
            program: prepared.program,
            args: prepared.args,
        },
        Err(err) => LaunchPlanValidation {
            valid: false,
            error: Some(err),
            program,
            args,
        },
    }
}

#[tauri::command]
fn list_connected_displays_cmd() -> Vec<DisplayInfo> {
    list_connected_displays()
}

#[tauri::command]
fn get_launch_display_preferences(app: AppHandle) -> Result<Option<LaunchDisplayPreferences>, String> {
    let path = display_prefs_path(&app)?;
    if !path.exists() {
        return Ok(None);
    }
    let raw = fs::read_to_string(&path).map_err(|e| format!("Unable to read display prefs: {e}"))?;
    serde_json::from_str(&raw).map_err(|e| format!("Invalid display prefs JSON: {e}"))
}

#[tauri::command]
fn save_launch_display_preferences(
    app: AppHandle,
    prefs: LaunchDisplayPreferences,
) -> Result<(), String> {
    let path = display_prefs_path(&app)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Unable to create app data dir: {e}"))?;
    }
    let raw = serde_json::to_string_pretty(&prefs)
        .map_err(|e| format!("Unable to serialize display prefs: {e}"))?;
    fs::write(&path, raw).map_err(|e| format!("Unable to write display prefs: {e}"))
}

#[tauri::command]
fn get_last_emulator_session(app: AppHandle) -> Result<Option<EmulatorSessionRecord>, String> {
    load_session_record(&app)
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct EmulatorSessionStartedPayload {
    game_id: String,
    session_id: String,
    shell_window_title: String,
    game_window_title: String,
}

fn emit_emulator_session_started(app: &AppHandle, game_id: &str, session_id: &str) {
    let game_title = window_registry::game_window_title(session_id);
    let _ = app.emit(
        "emulator-session-started",
        EmulatorSessionStartedPayload {
            game_id: game_id.to_string(),
            session_id: session_id.to_string(),
            shell_window_title: window_registry::SHELL_WINDOW_TITLE.to_string(),
            game_window_title: game_title,
        },
    );
}

fn hibernate_shell_for_session(app: &AppHandle, game_id: &str, session_id: &str) {
    let app_for_main = app.clone();
    let game_id_owned = game_id.to_string();
    let session_id_owned = session_id.to_string();
    if app_for_main
        .clone()
        .run_on_main_thread(move || {
            emit_emulator_session_started(&app_for_main, &game_id_owned, &session_id_owned);
            let registry = (*app_for_main.state::<WindowRegistry>()).clone();
            registry.hibernate_shell(&app_for_main);
        })
        .is_err()
    {
        emit_emulator_session_started(app, game_id, session_id);
        let registry = (*app.state::<WindowRegistry>()).clone();
        registry.hibernate_shell(app);
    }
}

fn emit_emulator_session_finished(
    app: &AppHandle,
    game_id: &str,
    session_id: &str,
    reason: &str,
    returned_cleanly: bool,
    error_message: Option<String>,
    session_reached_game: bool,
) {
    let _ = app.emit(
        "emulator-session-finished",
        EmulatorSessionFinishedPayload {
            game_id: game_id.to_string(),
            session_id: session_id.to_string(),
            reason: reason.to_string(),
            returned_cleanly,
            error_message,
            session_reached_game,
        },
    );
}

/// UI notification always fires; WM restore is debounced separately.
pub fn complete_emulator_session(
    app: &AppHandle,
    game_id: &str,
    session_id: &str,
    reason: &str,
    returned_cleanly: bool,
    error_message: Option<String>,
    session_reached_game: bool,
) {
    emit_emulator_session_finished(
        app,
        game_id,
        session_id,
        reason,
        returned_cleanly,
        error_message,
        session_reached_game,
    );
    schedule_restore_arcade_shell(app, game_id, session_id, reason);
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct EmulatorSessionFinishedPayload {
    game_id: String,
    session_id: String,
    reason: String,
    returned_cleanly: bool,
    error_message: Option<String>,
    session_reached_game: bool,
}

/// Wake xi-io shell — Tauri APIs first (Wayland-safe); X11 WM tools optional and bounded.
pub fn restore_arcade_shell(app: &AppHandle, game_id: &str, session_id: &str, reason: &str) {
    if !try_begin_shell_restore(reason) {
        return;
    }

    eprintln!("[xi-io] restore_arcade_shell reason={reason}");
    let registry = (*app.state::<WindowRegistry>()).clone();
    let app_for_main = app.clone();
    let registry_for_main = registry.clone();
    let (tx, rx) = std::sync::mpsc::channel();

    let dispatch = app_for_main.clone().run_on_main_thread(move || {
        let result = registry_for_main.wake_shell(&app_for_main);
        let _ = tx.send(result);
    });

    let tauri_result = if dispatch.is_ok() {
        rx.recv_timeout(Duration::from_secs(3)).unwrap_or_else(|_| {
            ShellRestoreResult::failed("unknown_restore_failure", "tauri_show")
        })
    } else {
        registry.wake_shell(app)
    };

    let final_result = if tauri_result.success {
        if crate::platform::x11_wm_tools_available() {
            let wm_result = registry.wake_shell_wm_once(app);
            if !wm_result.success {
                eprintln!(
                    "[xi-io] wm wake best-effort failed reason={:?} stage={:?}",
                    wm_result.reason_code, wm_result.stage
                );
            }
        }
        tauri_result
    } else {
        tauri_result
    };

    emit_shell_focus_restore_result(app, game_id, session_id, &final_result);
    finish_shell_restore();
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct ShellFocusRestorePayload {
    game_id: String,
    session_id: String,
    reason_code: Option<String>,
    stage: Option<String>,
    timestamp: String,
}

/// PRH-02 / XIO-LCH-008: emit `shell-focus-restored` or `shell-focus-restore-failed` to UI.
/// Payload: gameId, sessionId, reasonCode?, stage?, timestamp — no ROM paths.
fn emit_shell_focus_restore_result(
    app: &AppHandle,
    game_id: &str,
    session_id: &str,
    result: &ShellRestoreResult,
) {
    let payload = ShellFocusRestorePayload {
        game_id: game_id.to_string(),
        session_id: session_id.to_string(),
        reason_code: result.reason_code.clone(),
        stage: result.stage.clone(),
        timestamp: chrono_like_now(),
    };
    let event_name = if result.success {
        "shell-focus-restored"
    } else {
        "shell-focus-restore-failed"
    };
    if let Err(err) = app.emit(event_name, payload) {
        eprintln!("[xi-io] emit {event_name} failed: {err}");
    }
}

/// Window show/focus must run on Tauri's main thread — not from spawn_blocking or evdev monitor threads.
pub fn schedule_restore_arcade_shell(app: &AppHandle, game_id: &str, session_id: &str, reason: &str) {
    let app_for_main = app.clone();
    let game_id = game_id.to_string();
    let session_id = session_id.to_string();
    let reason = reason.to_string();
    let game_id_fallback = game_id.clone();
    let session_id_fallback = session_id.clone();
    let reason_fallback = reason.clone();
    if app_for_main
        .clone()
        .run_on_main_thread(move || {
            restore_arcade_shell(&app_for_main, &game_id, &session_id, &reason);
        })
        .is_err()
    {
        restore_arcade_shell(
            app,
            &game_id_fallback,
            &session_id_fallback,
            &reason_fallback,
        );
    }
}

#[tauri::command]
async fn identify_connected_displays(
    app: AppHandle,
    highlight_index: Option<u32>,
) -> Result<(), String> {
    identify_displays(&app, highlight_index).await
}

#[tauri::command]
async fn launch_emulator(
    app: AppHandle,
    _window: Window,
    state: State<'_, EmulatorLaunchState>,
    program: String,
    args: Vec<String>,
    env: HashMap<String, String>,
    game_id: String,
    engine_id: String,
    content_path: String,
) -> Result<SpawnResult, String> {
    use engine_launch::prepare_launch;
    use session_startup::{format_supervisor_failure, poll_emulator_startup_once, startup_timeout};
    use tokio::io::AsyncReadExt;
    use tokio::process::Command as AsyncCommand;

    let prepared = prepare_launch(&program, &args)?;

    let runner = resolve_session_runner_path();

    if state
        .active_session
        .lock()
        .ok()
        .and_then(|guard| guard.as_ref().map(|_| ()))
        .is_some()
    {
        eprintln!("[xi-io] terminating prior session before new launch");
        state.terminate_session(&app, "prior_session_replace");
        tokio::time::sleep(Duration::from_millis(400)).await;
    }

    cleanup_stale_session_supervisors();
    cleanup_blocking_emulator_instances(&prepared.program);
    cleanup_orphan_emulators(&prepared.program, &content_path);
    state.terminate_requested.store(false, std::sync::atomic::Ordering::Relaxed);

    let mut async_cmd = AsyncCommand::new(&runner);
    async_cmd
        .arg(SESSION_RUN_ARG)
        .arg("--program")
        .arg(&prepared.program)
        .arg("--content-path")
        .arg(&content_path)
        .arg("--")
        .args(&prepared.args);
    for (key, value) in &env {
        async_cmd.env(key, value);
    }
    if !env.contains_key("DISPLAY") {
        if let Ok(display) = std::env::var("DISPLAY") {
            async_cmd.env("DISPLAY", display);
        }
    }
    async_cmd.stdin(std::process::Stdio::null());
    async_cmd.stdout(std::process::Stdio::null());
    async_cmd.stderr(std::process::Stdio::piped());

    let mut child = async_cmd
        .spawn()
        .map_err(|e| format!("Failed to spawn session supervisor: {e}"))?;

    let supervisor_pid = child.id();
    eprintln!(
        "[xi-io] session supervisor pid={supervisor_pid:?} runner={}",
        runner.display()
    );

    let startup_deadline =
        tokio::time::Instant::now() + startup_timeout() + Duration::from_secs(1);
    let program_for_poll = prepared.program.clone();
    let content_for_poll = content_path.clone();
    let mut tracked_pids: Vec<u32> = Vec::new();
    let mut startup_error: Option<String> = None;

    while tokio::time::Instant::now() < startup_deadline {
        if let Ok(Some(status)) = child.try_wait() {
            let mut stderr_text = String::new();
            if let Some(mut stderr) = child.stderr.take() {
                let _ = stderr.read_to_string(&mut stderr_text).await;
            }
            let code = status.code().unwrap_or(-1);
            startup_error = Some(format_supervisor_failure(code, &stderr_text));
            break;
        }

        let poll_program = program_for_poll.clone();
        let poll_content = content_for_poll.clone();
        match tokio::task::spawn_blocking(move || {
            poll_emulator_startup_once(&poll_program, &poll_content, supervisor_pid)
        })
        .await
        {
            Ok(Ok(Some(pids))) => {
                tracked_pids = pids;
                eprintln!("[xi-io] emulator startup confirmed pids={tracked_pids:?}");
                break;
            }
            Ok(Ok(None)) => {}
            Ok(Err(msg)) if msg.contains("Supervisor exited") => {
                startup_error = Some(msg);
                break;
            }
            Ok(Err(_)) => {}
            Err(e) => {
                startup_error = Some(format!("Startup check failed: {e}"));
                break;
            }
        }

        tokio::time::sleep(Duration::from_millis(200)).await;
    }

    if tracked_pids.is_empty() {
        let _ = child.kill().await;
        let _ = child.wait().await;
        return Err(startup_error.unwrap_or_else(|| {
            "The emulator did not start in time. Verify engine, core, and ROM paths.".into()
        }));
    }

    // Do not hide the shell until the ROM is open or a game window exists (XIO-LCH-014).
    let playable_deadline = tokio::time::Instant::now() + Duration::from_secs(6);
    let content_for_playable = content_path.clone();
    let mut playable = false;
    while tokio::time::Instant::now() < playable_deadline {
        if let Ok(Some(_status)) = child.try_wait() {
            break;
        }
        let pids_snapshot = tracked_pids.clone();
        let content = content_for_playable.clone();
        playable = tokio::task::spawn_blocking(move || {
            emulator_playable_signal(&pids_snapshot, &content)
        })
        .await
        .unwrap_or(false);
        if playable {
            eprintln!("[xi-io] emulator playable signal confirmed");
            break;
        }
        tokio::time::sleep(Duration::from_millis(250)).await;
    }

    if !playable {
        eprintln!("[xi-io] startup abort: no game window or ROM fd before shell hibernate");
        let _ = child.kill().await;
        let _ = child.wait().await;
        return Err(
            "The emulator did not show a game window. Check Admin → Engines paths, proof ROM, and display settings."
                .into(),
        );
    }

    let session_id = new_session_id(&game_id);
    let window_registry = (*app.state::<WindowRegistry>()).clone();
    window_registry.start_session(session_id.clone(), game_id.clone(), tracked_pids.clone());

    let session_for_tag = session_id.clone();
    let pids_for_tag = tracked_pids.clone();
    let registry_for_tag = window_registry.clone();
    std::thread::spawn(move || {
        let xids = tag_session_windows(&session_for_tag, &pids_for_tag);
        registry_for_tag.attach_session_windows(&session_for_tag, xids);
    });

    let started_at = chrono_like_now();
    {
        let mut guard = state.active_session.lock().map_err(|e| e.to_string())?;
        *guard = Some(ActiveEmulatorSession {
            session_id: session_id.clone(),
            supervisor_pid,
            pids: tracked_pids.clone(),
            pgid: None,
            program: prepared.program.clone(),
            content_path: content_path.clone(),
            game_id: game_id.clone(),
            engine_id: engine_id.clone(),
            started_at: started_at.clone(),
            game_window_xids: Vec::new(),
            session_reached_game: true,
        });
    }

    let monitor_stop = Arc::new(AtomicBool::new(false));
    let monitor_stop_bg = monitor_stop.clone();
    let terminate_flag = state.terminate_requested.clone();
    let app_for_monitor = app.clone();
    let state_for_monitor = state.inner().clone();

    spawn_launch_return_monitor(
        app.clone(),
        monitor_stop.clone(),
        Arc::new(move || {
            terminate_flag.store(true, std::sync::atomic::Ordering::Relaxed);
            state_for_monitor.terminate_session(&app_for_monitor, "shell_exit_button");
        }),
    );

    hibernate_shell_for_session(&app, &game_id, &session_id);

    let state_bg = state.inner().clone();

    // Wake the shell as soon as the emulator process exits — do not wait for supervisor cleanup.
    {
        let app_early = app.clone();
        let game_id_early = game_id.clone();
        let session_id_early = session_id.clone();
        let tracked_pids_early = tracked_pids.clone();
        tokio::spawn(async move {
            let deadline = tokio::time::Instant::now() + Duration::from_secs(3600);
            while tokio::time::Instant::now() < deadline {
                let still_running = tokio::task::spawn_blocking({
                    let pids = tracked_pids_early.clone();
                    move || pids.iter().any(|p| is_process_alive(*p))
                })
                .await
                .unwrap_or(true);
                if !still_running {
                    schedule_restore_arcade_shell(
                        &app_early,
                        &game_id_early,
                        &session_id_early,
                        "emulator_exited",
                    );
                    break;
                }
                tokio::time::sleep(Duration::from_millis(60)).await;
            }
        });
    }

    tokio::spawn(async move {
        let app_bg = app;
        let window_registry_bg = window_registry;
        let program_bg = prepared.program;
        let content_path_bg = content_path;
        let game_id_bg = game_id;
        let session_id_bg = session_id;
        let engine_id_bg = engine_id;
        let started_at_bg = started_at;
        let tracked_pids_bg = tracked_pids;

        let wait_status = child.wait().await;
        monitor_stop_bg.store(true, std::sync::atomic::Ordering::Relaxed);

        let terminated_by_shell = state_bg
            .terminate_requested
            .load(std::sync::atomic::Ordering::Relaxed);

        eprintln!(
            "[xi-io] session supervisor exited terminated_by_shell={terminated_by_shell} status={wait_status:?}"
        );

        let game_window_xids = window_registry_bg.session_window_xids(&session_id_bg);
        let ended_at = chrono_like_now();
        let session_duration_secs = ended_at
            .parse::<u64>()
            .ok()
            .and_then(|end| {
                started_at_bg
                    .parse::<u64>()
                    .ok()
                    .map(|start| end.saturating_sub(start))
            })
            .unwrap_or(0);
        let session_reached_game =
            !game_window_xids.is_empty() || session_duration_secs >= 3;

        if !terminated_by_shell {
            let record = EmulatorSessionRecord {
                game_id: game_id_bg.clone(),
                content_path: content_path_bg,
                engine_id: engine_id_bg,
                program: program_bg.clone(),
                started_at: started_at_bg,
                ended_at: Some(ended_at),
                exit_reason: "natural_exit".to_string(),
                pids: tracked_pids_bg,
            };
            let _ = save_session_record(&app_bg, &record);
        }

        if let Ok(mut guard) = state_bg.active_session.lock() {
            *guard = None;
        }

        window_registry_bg.end_session(&session_id_bg);
        window_registry_bg.close_session_windows(&session_id_bg);

        let exit_reason = if terminated_by_shell {
            "shell_exit_button"
        } else {
            "emulator_session_ended"
        };
        if !terminated_by_shell {
            let returned_cleanly = session_reached_game;
            let error_message = if session_reached_game {
                None
            } else {
                Some(
                    "The emulator exited before the game window appeared. Check engine paths and display settings."
                        .into(),
                )
            };
            complete_emulator_session(
                &app_bg,
                &game_id_bg,
                &session_id_bg,
                exit_reason,
                returned_cleanly,
                error_message,
                session_reached_game,
            );
        }
    });

    Ok(SpawnResult {
        success: true,
        exit_code: None,
        stdout: String::new(),
        stderr: String::new(),
        session_started: true,
    })
}

#[tauri::command]
fn prepare_fceux_controller_launch_cmd(
    app: AppHandle,
    device_guid: String,
    input_file_content: String,
) -> Result<FceuxLaunchInputPrep, String> {
    prepare_fceux_input_config(&app, &device_guid, &input_file_content)
}

#[tauri::command]
fn resolve_primary_gamepad_sdl_guid_cmd() -> Result<Option<String>, String> {
    Ok(gamepad_guid::resolve_primary_gamepad_sdl_guid())
}

#[tauri::command]
fn list_input_devices() -> Result<Vec<InputDeviceInfo>, String> {
    let raw = fs::read_to_string("/proc/bus/input/devices")
        .map_err(|e| format!("Unable to read /proc/bus/input/devices: {e}"))?;

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

#[tauri::command]
fn restore_arcade_window(app: AppHandle, game_id: Option<String>) -> Result<(), String> {
    let session_id = app
        .state::<WindowRegistry>()
        .open_sessions()
        .into_iter()
        .find(|s| Some(s.game_id.as_str()) == game_id.as_deref())
        .map(|s| s.session_id)
        .unwrap_or_default();
    restore_arcade_shell(
        &app,
        game_id.as_deref().unwrap_or(""),
        &session_id,
        "ui_restore",
    );
    Ok(())
}

#[tauri::command]
async fn terminate_active_emulator(
    app: AppHandle,
    state: State<'_, EmulatorLaunchState>,
) -> Result<bool, String> {
    state.terminate_requested.store(true, std::sync::atomic::Ordering::Relaxed);
    Ok(state.terminate_session(&app, "shell_ui_exit"))
}

#[tauri::command]
fn get_shell_exit_mapping(app: AppHandle) -> Result<Option<ShellExitMapping>, String> {
    load_shell_exit_mapping(&app)
}

#[tauri::command]
fn save_shell_exit_mapping_cmd(app: AppHandle, mapping: ShellExitMapping) -> Result<(), String> {
    save_shell_exit_mapping(&app, &mapping)
}

#[tauri::command]
fn clear_shell_exit_mapping_cmd(app: AppHandle) -> Result<(), String> {
    clear_shell_exit_mapping(&app)
}

#[tauri::command]
async fn capture_shell_exit_button_cmd(timeout_ms: u64) -> Result<ShellExitMapping, String> {
    let timeout = timeout_ms.max(1000);
    tokio::task::spawn_blocking(move || capture_shell_exit_button(timeout))
        .await
        .map_err(|e| format!("Capture task failed: {e}"))?
}

#[tauri::command]
fn list_shell_exit_capture_sources() -> Result<String, String> {
    shell_exit_input::list_capture_source_summary()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(EmulatorLaunchState::default())
        .manage(WindowRegistry::default())
        .setup(|app| {
            platform::log_platform_context();
            single_instance::acquire_or_exit(&app.handle());
            if let Ok(app_data) = app.path().app_data_dir() {
                play_session_db::init_on_startup(&app_data);
            } else {
                eprintln!("[xi-io] play_session.db skipped: app_data_dir unavailable");
            }
            app.state::<WindowRegistry>()
                .register_shell_window(&app.handle());
            let handle = app.handle().clone();
            let active_pid = app.state::<EmulatorLaunchState>().active_pid();
            spawn_shell_gamepad_bridge(handle, active_pid);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            path_exists,
            command_on_path,
            validate_launch_plan,
            prepare_fceux_controller_launch_cmd,
            resolve_primary_gamepad_sdl_guid_cmd,
            launch_emulator,
            terminate_active_emulator,
            list_input_devices,
            list_connected_displays_cmd,
            identify_connected_displays,
            get_launch_display_preferences,
            save_launch_display_preferences,
            get_last_emulator_session,
            restore_arcade_window,
            get_shell_exit_mapping,
            save_shell_exit_mapping_cmd,
            clear_shell_exit_mapping_cmd,
            capture_shell_exit_button_cmd,
            list_shell_exit_capture_sources,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

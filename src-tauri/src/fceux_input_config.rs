//! Isolated FCEUX config under app data — avoids mutating `~/.fceux`.
//!
//! XARCADE-CONTROLLER-MAPPING-001 slice 2: set `HOME` so FCEUX reads `$HOME/.fceux/`.

use crate::gamepad_guid;
use std::fs;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};

const GENERIC_GUID: &str = "03000000000000000000000000000000";

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FceuxLaunchInputPrep {
    pub home_dir: String,
    pub device_guid: String,
}

fn fceux_isolated_home(app: &AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_data_dir()
        .map(|d| d.join("fceux-isolated-home"))
        .map_err(|e| format!("Unable to resolve app data dir: {e}"))
}

fn normalize_device_guid(device_guid: &str) -> Result<String, String> {
    let guid = device_guid.trim().to_lowercase();
    if guid.len() != 32 || !guid.chars().all(|c| c.is_ascii_hexdigit()) {
        return Err(format!("Invalid FCEUX device GUID: {device_guid}"));
    }
    Ok(guid)
}

fn resolve_launch_guid(device_guid: &str) -> Result<String, String> {
    let mut guid = normalize_device_guid(device_guid)?;
    if guid == GENERIC_GUID {
        if let Some(resolved) = gamepad_guid::resolve_primary_gamepad_sdl_guid() {
            eprintln!("[xi-io] resolved gamepad SDL GUID {resolved}");
            guid = resolved;
        }
    }
    Ok(guid)
}

fn user_fceux_input_mapping(real_home: &Path, guid: &str) -> Option<String> {
    let path = real_home.join(".fceux/input").join(guid).join("default.txt");
    fs::read_to_string(path).ok()
}

fn rewrite_input_guid(content: &str, guid: &str) -> String {
    content.replace(GENERIC_GUID, guid)
}

fn write_fceux_cfg(fceux_dir: &Path, guid: &str) -> Result<(), String> {
    let path = fceux_dir.join("fceux.cfg");
    if path.exists() {
        let raw = fs::read_to_string(&path).map_err(|e| format!("Unable to read FCEUX cfg: {e}"))?;
        if raw.contains("SDL.Sound = 1") && raw.contains(&format!("SDL.Input.GamePad.0.DeviceGUID = {guid}")) {
            return Ok(());
        }
    }

    let cfg = format!(
        "SDL.Input.0 = GamePad.0\n\
         SDL.Input.1 = GamePad.1\n\
         SDL.Input.GamePad.0.DeviceGUID = {guid}\n\
         SDL.Input.GamePad.0.DeviceType = GamePad\n\
         SDL.Input.GamePad.0.Profile = default\n\
         SDL.AutoInputPreset = 0\n\
         SDL.DrawInputAids = 0\n\
         SDL.Sound = 1\n\
         SDL.Sound.Volume = 255\n\
         SDL.Sound.Rate = 44100\n\
         SDL.Sound.Quality = 1\n\
         SDL.Sound.UseGlobalFocus = 1\n\
         SDL.Sound.BufSize = 128\n"
    );
    fs::write(&path, cfg).map_err(|e| format!("Unable to write FCEUX cfg: {e}"))
}

pub fn prepare_fceux_input_config(
    app: &AppHandle,
    device_guid: &str,
    input_file_content: &str,
) -> Result<FceuxLaunchInputPrep, String> {
    let guid = resolve_launch_guid(device_guid)?;

    let home_dir = fceux_isolated_home(app)?;
    let fceux_dir = home_dir.join(".fceux");
    let input_dir = fceux_dir.join("input").join(&guid);

    fs::create_dir_all(&input_dir).map_err(|e| format!("Unable to create FCEUX input dir: {e}"))?;

    let input_content = if let Ok(real_home) = std::env::var("HOME") {
        user_fceux_input_mapping(Path::new(&real_home), &guid)
            .unwrap_or_else(|| rewrite_input_guid(input_file_content, &guid))
    } else {
        rewrite_input_guid(input_file_content, &guid)
    };

    fs::write(input_dir.join("default.txt"), &input_content)
        .map_err(|e| format!("Unable to write FCEUX input mapping: {e}"))?;

    write_fceux_cfg(&fceux_dir, &guid)?;

    Ok(FceuxLaunchInputPrep {
        home_dir: home_dir.to_string_lossy().into_owned(),
        device_guid: guid,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn normalizes_valid_guid() {
        assert_eq!(
            normalize_device_guid("03000000373500004110000011010000").unwrap(),
            "03000000373500004110000011010000"
        );
    }

    #[test]
    fn rejects_bad_guid() {
        assert!(normalize_device_guid("bad").is_err());
    }

    #[test]
    fn rewrites_generic_guid_in_mapping() {
        let rewritten = rewrite_input_guid(
            "03000000000000000000000000000000,default,config:0,a:b1",
            "03000000373500004110000011010000",
        );
        assert!(rewritten.contains("03000000373500004110000011010000"));
        assert!(!rewritten.contains(GENERIC_GUID));
    }
}

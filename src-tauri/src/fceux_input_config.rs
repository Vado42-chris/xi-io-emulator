//! Isolated FCEUX config under app data — avoids mutating `~/.fceux`.
//!
//! XARCADE-CONTROLLER-MAPPING-001 slice 2: set `HOME` so FCEUX reads `$HOME/.fceux/`.

use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

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

pub fn prepare_fceux_input_config(
    app: &AppHandle,
    device_guid: &str,
    input_file_content: &str,
) -> Result<FceuxLaunchInputPrep, String> {
    let guid = normalize_device_guid(device_guid)?;

    let home_dir = fceux_isolated_home(app)?;
    let fceux_dir = home_dir.join(".fceux");
    let input_dir = fceux_dir.join("input").join(&guid);

    fs::create_dir_all(&input_dir).map_err(|e| format!("Unable to create FCEUX input dir: {e}"))?;
    fs::write(input_dir.join("default.txt"), input_file_content)
        .map_err(|e| format!("Unable to write FCEUX input mapping: {e}"))?;

    let cfg = format!(
        "SDL.Input.0 = GamePad.0\n\
         SDL.Input.1 = GamePad.1\n\
         SDL.Input.GamePad.0.DeviceGUID = {guid}\n\
         SDL.Input.GamePad.0.DeviceType = GamePad\n\
         SDL.Input.GamePad.0.Profile = default\n\
         SDL.AutoInputPreset = 0\n\
         SDL.DrawInputAids = 0\n"
    );
    fs::write(fceux_dir.join("fceux.cfg"), cfg)
        .map_err(|e| format!("Unable to write FCEUX cfg: {e}"))?;

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
}

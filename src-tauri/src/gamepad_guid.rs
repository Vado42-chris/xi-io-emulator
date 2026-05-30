//! Resolve Linux evdev IDs to the 32-char SDL joystick GUID FCEUX expects.

use std::fs;
use std::path::Path;

const GENERIC_GUID: &str = "03000000000000000000000000000000";

#[derive(Default, Debug)]
struct InputDeviceBlock {
    name: String,
    handlers: Vec<String>,
    bus: Option<u16>,
    vendor: Option<u16>,
    product: Option<u16>,
    version: Option<u16>,
}

fn parse_input_device_blocks() -> Result<Vec<InputDeviceBlock>, String> {
    let raw = fs::read_to_string("/proc/bus/input/devices")
        .map_err(|e| format!("Unable to read /proc/bus/input/devices: {e}"))?;

    let mut blocks: Vec<InputDeviceBlock> = Vec::new();
    let mut current = InputDeviceBlock::default();

    for line in raw.lines() {
        if line.starts_with('N') {
            if !current.name.is_empty() {
                blocks.push(current);
            }
            current = InputDeviceBlock::default();
            current.name = line
                .trim_start_matches('N')
                .trim_start_matches(':')
                .trim()
                .to_string();
        } else if line.starts_with('H') {
            let handlers = line.trim_start_matches('H').trim_start_matches(':').trim();
            for handler in handlers.split('=').nth(1).unwrap_or("").split(' ') {
                let h = handler.trim();
                if !h.is_empty() {
                    current.handlers.push(h.to_string());
                }
            }
        } else if line.starts_with('I') {
            for part in line.trim_start_matches('I').trim_start_matches(':').split_whitespace() {
                if let Some((key, value)) = part.split_once('=') {
                    let Ok(parsed) = u16::from_str_radix(value, 16) else {
                        continue;
                    };
                    match key {
                        "Bus" => current.bus = Some(parsed),
                        "Vendor" => current.vendor = Some(parsed),
                        "Product" => current.product = Some(parsed),
                        "Version" => current.version = Some(parsed),
                        _ => {}
                    }
                }
            }
        }
    }

    if !current.name.is_empty() {
        blocks.push(current);
    }

    Ok(blocks)
}

fn is_denied_device(name: &str) -> bool {
    let lower = name.to_lowercase();
    lower.contains("keyboard")
        || lower.contains("mouse")
        || lower.contains("keypad")
        || lower.contains("consumer control")
        || lower.contains("power button")
        || lower.contains("sleep button")
}

fn is_likely_gamepad(name: &str, handlers: &[String]) -> bool {
    if is_denied_device(name) {
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
        || lower.contains("8bitdo")
        || lower.contains("zikway")
        || lower.contains("x-arcade")
        || lower.contains("arcade")
        || (lower.contains("usb") && lower.contains("pad"))
}

fn is_valid_guid(name: &str) -> bool {
    name.len() == 32 && name.chars().all(|c| c.is_ascii_hexdigit())
}

/// GUID layouts seen in the wild — pick the one that matches an existing FCEUX profile when possible.
pub fn guid_candidates(bus: u16, vendor: u16, product: u16, version: u16) -> Vec<String> {
    let mut out = Vec::new();

    // Vendor/product/version as big-endian 16-bit pairs (FCEUX directory naming on common USB pads).
    let mut fceux = [0u8; 16];
    fceux[0] = (bus & 0xff) as u8;
    fceux[1] = (bus >> 8) as u8;
    fceux[4] = (vendor >> 8) as u8;
    fceux[5] = (vendor & 0xff) as u8;
    fceux[8] = (product >> 8) as u8;
    fceux[9] = (product & 0xff) as u8;
    fceux[12] = (version >> 8) as u8;
    fceux[13] = (version & 0xff) as u8;
    out.push(bytes_to_guid(&fceux));

    // Alternate vendor byte order seen on some SDL builds.
    let mut alt = fceux;
    alt[4] = (vendor & 0xff) as u8;
    alt[5] = (vendor >> 8) as u8;
    alt[8] = (product & 0xff) as u8;
    alt[9] = (product >> 8) as u8;
    alt[12] = (version & 0xff) as u8;
    alt[13] = (version >> 8) as u8;
    out.push(bytes_to_guid(&alt));

    // SDL2 classic 8-byte + zero padding.
    let mut classic = [0u8; 16];
    classic[0] = (bus & 0xff) as u8;
    classic[1] = (bus >> 8) as u8;
    classic[2] = (vendor & 0xff) as u8;
    classic[3] = (vendor >> 8) as u8;
    classic[4] = (product & 0xff) as u8;
    classic[5] = (product >> 8) as u8;
    classic[6] = (version & 0xff) as u8;
    classic[7] = (version >> 8) as u8;
    out.push(bytes_to_guid(&classic));

    out.sort_unstable();
    out.dedup();
    out
}

fn bytes_to_guid(bytes: &[u8; 16]) -> String {
    bytes.iter().map(|b| format!("{b:02x}")).collect()
}

pub fn scan_user_fceux_input_guids(home: &Path) -> Vec<String> {
    let input_dir = home.join(".fceux/input");
    let Ok(entries) = fs::read_dir(&input_dir) else {
        return Vec::new();
    };

    let mut guids: Vec<String> = entries
        .flatten()
        .filter_map(|entry| {
            let name = entry.file_name().to_string_lossy().to_lowercase();
            if !is_valid_guid(&name) || name == GENERIC_GUID {
                return None;
            }
            if !entry.path().join("default.txt").exists() {
                return None;
            }
            Some(name)
        })
        .collect();
    guids.sort_unstable();
    guids.dedup();
    guids
}

pub fn resolve_primary_gamepad_sdl_guid() -> Option<String> {
    if let Ok(home) = std::env::var("HOME") {
        let guids = scan_user_fceux_input_guids(Path::new(&home));
        if let Some(guid) = guids.into_iter().next() {
            return Some(guid);
        }
    }

    let blocks = parse_input_device_blocks().ok()?;
    for block in blocks {
        if !is_likely_gamepad(&block.name, &block.handlers) {
            continue;
        }
        let (bus, vendor, product, version) = (
            block.bus?,
            block.vendor?,
            block.product?,
            block.version?,
        );
        let candidates = guid_candidates(bus, vendor, product, version);
        if let Ok(home) = std::env::var("HOME") {
            let known = scan_user_fceux_input_guids(Path::new(&home));
            for candidate in &candidates {
                if known.iter().any(|k| k == candidate) {
                    return Some(candidate.clone());
                }
            }
        }
        return candidates.into_iter().next();
    }
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn candidates_include_classic_and_fceux_layouts() {
        let candidates = guid_candidates(0x0003, 0x7375, 0x4110, 0x0111);
        assert!(candidates.len() >= 2);
        assert!(candidates.iter().any(|g| g.contains("7375") || g.contains("3735")));
    }
}

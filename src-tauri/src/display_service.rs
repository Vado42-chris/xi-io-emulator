use serde::Serialize;
use std::process::Command;
use std::time::Duration;
use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DisplayInfo {
    pub id: String,
    pub name: String,
    pub width: u32,
    pub height: u32,
    pub x: i32,
    pub y: i32,
    pub primary: bool,
    pub index: u32,
}

fn fallback_displays() -> Vec<DisplayInfo> {
    vec![DisplayInfo {
        id: "primary".to_string(),
        name: "Primary Display".to_string(),
        width: 1920,
        height: 1080,
        x: 0,
        y: 0,
        primary: true,
        index: 0,
    }]
}

/// Lists connected monitors via xrandr when available.
pub fn list_connected_displays() -> Vec<DisplayInfo> {
    let output = Command::new("xrandr").arg("--query").output();

    let Ok(output) = output else {
        return fallback_displays();
    };

    if !output.status.success() {
        return fallback_displays();
    }

    let text = String::from_utf8_lossy(&output.stdout);
    let mut displays: Vec<DisplayInfo> = Vec::new();
    let mut index: u32 = 0;

    for line in text.lines() {
        if !line.contains(" connected") {
            continue;
        }

        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() < 2 {
            continue;
        }

        let name = parts[0].to_string();
        let primary = line.contains(" primary");
        let mut width = 1920u32;
        let mut height = 1080u32;
        let mut x = 0i32;
        let mut y = 0i32;

        for token in parts.iter().skip(1) {
            if token.contains('+') && token.contains('x') {
                // e.g. 1920x1080+0+0
                let geom = token.split('+').collect::<Vec<_>>();
                if let Some(res) = geom.first() {
                    if let Some((w, h)) = res.split_once('x') {
                        width = w.parse().unwrap_or(width);
                        height = h.parse().unwrap_or(height);
                    }
                }
                if geom.len() >= 3 {
                    x = geom[1].parse().unwrap_or(x);
                    y = geom[2].parse().unwrap_or(y);
                }
                break;
            }
        }

        displays.push(DisplayInfo {
            id: name.clone(),
            name: if primary {
                format!("{name} (Primary)")
            } else {
                name.clone()
            },
            width,
            height,
            x,
            y,
            primary,
            index,
        });
        index += 1;
    }

    if displays.is_empty() {
        fallback_displays()
    } else {
        displays
    }
}

fn identify_page_url(display: &DisplayInfo, highlight_index: Option<u32>) -> WebviewUrl {
    let n = display.index + 1;
    let selected = highlight_index == Some(display.index);
    let query = format!(
        "n={n}&name={}&selected={}",
        url_encode(&display.name),
        if selected { "1" } else { "0" }
    );

    WebviewUrl::App(format!("display-identify.html?{query}").into())
}

fn url_encode(input: &str) -> String {
    input
        .chars()
        .map(|c| match c {
            'A'..='Z' | 'a'..='z' | '0'..='9' | '-' | '_' | '.' | '~' => c.to_string(),
            _ => format!("%{:02X}", c as u8),
        })
        .collect()
}

/// Windows-style identify: large number on each connected monitor for a few seconds.
pub async fn identify_displays(app: &AppHandle, highlight_index: Option<u32>) -> Result<(), String> {
    let displays = list_connected_displays();
    if displays.is_empty() {
        return Err("No connected displays found.".to_string());
    }

    let mut windows = Vec::new();
    for display in &displays {
        let label = format!("display-identify-{}", display.index);
        let _ = app.get_webview_window(&label).map(|w| w.close());

        let window = WebviewWindowBuilder::new(
            app,
            &label,
            identify_page_url(display, highlight_index),
        )
        .title(format!("Display {}", display.index + 1))
        .position(display.x as f64, display.y as f64)
        .inner_size(display.width as f64, display.height as f64)
        .decorations(false)
        .always_on_top(true)
        .transparent(true)
        .skip_taskbar(true)
        .resizable(false)
        .focused(false)
        .visible(true)
        .build()
        .map_err(|e| format!("Unable to show display label on {}: {e}", display.name))?;

        windows.push(window);
    }

    tokio::time::sleep(Duration::from_secs(3)).await;

    for window in windows {
        let _ = window.close();
    }

    Ok(())
}

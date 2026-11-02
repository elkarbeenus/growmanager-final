#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::path::PathBuf;

/// Datei, in der die Darstellungsart (Grafikbeschleunigung an/aus) gespeichert wird.
/// Linux: ~/.config/growmanager/render-mode · Windows: %APPDATA%\growmanager\render-mode
fn render_mode_path() -> Option<PathBuf> {
    let base = if cfg!(target_os = "windows") {
        std::env::var_os("APPDATA").map(PathBuf::from)
    } else {
        std::env::var_os("XDG_CONFIG_HOME")
            .map(PathBuf::from)
            .or_else(|| std::env::var_os("HOME").map(|h| PathBuf::from(h).join(".config")))
    };
    base.map(|b| b.join("growmanager").join("render-mode"))
}

fn read_mode() -> String {
    render_mode_path()
        .and_then(|p| std::fs::read_to_string(p).ok())
        .map(|s| s.trim().to_string())
        .unwrap_or_default()
}

fn write_mode(mode: &str) -> Result<(), String> {
    let path = render_mode_path().ok_or_else(|| "no config dir".to_string())?;
    if let Some(dir) = path.parent() {
        std::fs::create_dir_all(dir).map_err(|e| e.to_string())?;
    }
    std::fs::write(&path, mode).map_err(|e| e.to_string())
}

/// Modus, mit dem die App gestartet wurde: "gpu", "safe" oder "fallback".
struct StartMode(String);

#[tauri::command]
fn get_render_mode(state: tauri::State<'_, StartMode>) -> String {
    state.0.clone()
}

#[tauri::command]
fn set_render_mode(mode: String) -> Result<(), String> {
    if mode == "gpu" {
        write_mode("gpu-try")
    } else {
        write_mode("safe")
    }
}

/// Wird von der Oberfläche aufgerufen, sobald sie sichtbar ist: Grafikbeschleunigung funktioniert.
#[tauri::command]
fn confirm_render_mode(state: tauri::State<'_, StartMode>) -> Result<(), String> {
    if state.0 == "gpu" {
        write_mode("gpu")
    } else {
        Ok(())
    }
}

fn main() {
    // Grafikbeschleunigung mit automatischer Rückfallebene:
    // Jeder Start mit Beschleunigung gilt als "unbestätigt", bis die Oberfläche ihn bestätigt.
    // Bleibt die Bestätigung aus (z. B. graues Fenster), startet die App beim nächsten Mal im sicheren Modus.
    let saved = read_mode();
    let start_mode = match saved.as_str() {
        "gpu" | "gpu-try" => {
            let _ = write_mode("gpu-unconfirmed");
            "gpu"
        }
        "gpu-unconfirmed" => {
            let _ = write_mode("safe");
            "fallback"
        }
        _ => "safe",
    };

    #[cfg(target_os = "linux")]
    {
        // Behebt graue/leere Fenster mit neueren WebKitGTK-Versionen
        std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
        // Sicherer Modus: ohne Compositing (stabil, aber Scrollen weniger flüssig)
        if start_mode != "gpu" {
            std::env::set_var("WEBKIT_DISABLE_COMPOSITING_MODE", "1");
        }

        // Optional: Falls Wayland-Probleme bestehen
        if std::env::var("LD_PRELOAD").is_err() && std::path::Path::new("/usr/lib/libwayland-client.so.0").exists() {
            std::env::set_var("LD_PRELOAD", "/usr/lib/libwayland-client.so.0");
        }
    }

    tauri::Builder::default()
        .manage(StartMode(start_mode.to_string()))
        .invoke_handler(tauri::generate_handler![get_render_mode, set_render_mode, confirm_render_mode])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

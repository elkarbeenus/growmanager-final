#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // WebKit-Workarounds für graues Fenster unter Linux / Wayland erzwingen
    #[cfg(target_os = "linux")]
    {
        std::env::set_var("WEBKIT_DISABLE_COMPOSITING_MODE", "1");
        std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
        
        // Optional: Falls Wayland-Probleme bestehen
        if std::env::var("LD_PRELOAD").is_err() && std::path::Path::new("/usr/lib/libwayland-client.so.0").exists() {
            std::env::set_var("LD_PRELOAD", "/usr/lib/libwayland-client.so.0");
        }
    }

    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

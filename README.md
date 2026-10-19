# growmanager

Persönlicher Grow-Manager (React + Vite + Tailwind, Desktop-App mit Tauri).

## Builds

Bei jedem Push auf `main` baut der GitHub-Workflow (`.github/workflows/main.yml`) automatisch:

- **Linux:** AppImage (und .deb)
- **Windows:** Setup-`.exe` (NSIS-Installer)

Die Dateien erscheinen unter **Releases** (Tag = aktuelle Version, z. B. `v1.0.7`).
Wird die Version erhöht, müssen `package.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml` sowie `tagName`/`releaseName` im Workflow angepasst werden.

## Lokal entwickeln

```bash
npm install
npm run dev          # Web-Entwicklung
npm run build        # Produktions-Build
npx tauri dev        # Desktop-App (benötigt Rust)
npx tauri build      # Installer für das aktuelle System
```

Patchnotes: siehe `CHANGELOG.md`.

Created with Bolt.new and Git.

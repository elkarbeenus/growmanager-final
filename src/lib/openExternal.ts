// Link im Standardbrowser des Rechners öffnen.
// Desktop-App (Tauri): über die Shell-API (öffnet den systemweit eingestellten Standardbrowser).
// Browser-Version: neuer Tab.
interface TauriShell {
  shell?: { open: (url: string) => Promise<void> };
}

export async function openExternal(url: string): Promise<boolean> {
  const tg = (window as unknown as { __TAURI__?: TauriShell }).__TAURI__;
  if (tg?.shell?.open) {
    try {
      await tg.shell.open(url);
      return true;
    } catch {
      /* Fallback unten */
    }
  }
  const w = window.open(url, '_blank', 'noopener,noreferrer');
  return !!w;
}

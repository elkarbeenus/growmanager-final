// Funktionen, die es nur in der Desktop-App (Tauri) gibt: Fenster merken, Schließen abfangen,
// Darstellungsmodus (Grafikbeschleunigung). In der Browser-Version tun diese Funktionen nichts.
import { getUi, setUi } from '@/lib/uiState';

type Unlisten = () => void;

interface TauriWindow {
  listen: (event: string, handler: (e: unknown) => void) => Promise<Unlisten>;
  close: () => Promise<void>;
  innerSize: () => Promise<{ width: number; height: number }>;
  outerPosition: () => Promise<{ x: number; y: number }>;
  scaleFactor: () => Promise<number>;
  isMaximized: () => Promise<boolean>;
  setSize: (s: unknown) => Promise<void>;
  setPosition: (p: unknown) => Promise<void>;
  maximize: () => Promise<void>;
}

interface TauriGlobal {
  window?: {
    appWindow?: TauriWindow;
    LogicalSize?: new (w: number, h: number) => unknown;
    LogicalPosition?: new (x: number, y: number) => unknown;
  };
  invoke?: (cmd: string, args?: Record<string, unknown>) => Promise<unknown>;
  tauri?: { invoke?: (cmd: string, args?: Record<string, unknown>) => Promise<unknown> };
}

const g = (): TauriGlobal | null => (window as unknown as { __TAURI__?: TauriGlobal }).__TAURI__ ?? null;
export const isDesktop = () => !!g();
export const appWindow = (): TauriWindow | null => g()?.window?.appWindow ?? null;
const invoke = (cmd: string, args?: Record<string, unknown>) => {
  const fn = g()?.tauri?.invoke ?? g()?.invoke;
  return fn ? fn(cmd, args) : Promise.reject(new Error('no tauri'));
};
export const isLinuxDesktop = () => isDesktop() && /Linux/i.test(navigator.userAgent) && !/Android/i.test(navigator.userAgent);

// ---- Fenstergröße und -position merken ----

interface WinState {
  w: number;
  h: number;
  x?: number;
  y?: number;
  max?: boolean;
}

export async function restoreWindowState(): Promise<void> {
  const w = appWindow();
  const api = g()?.window;
  const s = getUi<WinState | null>('window', null);
  if (!w || !api || !s) return;
  try {
    if (s.w >= 400 && s.h >= 300 && api.LogicalSize) await w.setSize(new api.LogicalSize(Math.round(s.w), Math.round(s.h)));
    if (s.x !== undefined && s.y !== undefined && s.x > -200 && s.y > -50 && api.LogicalPosition) {
      await w.setPosition(new api.LogicalPosition(Math.round(s.x), Math.round(s.y)));
    }
    if (s.max) await w.maximize();
  } catch {
    /* Fenster-API nicht erlaubt → Standardgröße */
  }
}

export function trackWindowState(): Unlisten {
  const w = appWindow();
  if (!w) return () => {};
  let timer: ReturnType<typeof setTimeout> | null = null;
  const save = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(async () => {
      try {
        const [size, pos, scale, max] = await Promise.all([w.innerSize(), w.outerPosition(), w.scaleFactor(), w.isMaximized()]);
        const prev = getUi<WinState | null>('window', null);
        // Maximiert: Größe/Position vom normalen Fenster behalten
        if (max && prev) setUi('window', { ...prev, max: true });
        else setUi('window', { w: size.width / scale, h: size.height / scale, x: pos.x / scale, y: pos.y / scale, max });
      } catch {
        /* ignore */
      }
    }, 400);
  };
  const offs: Unlisten[] = [];
  void w.listen('tauri://resize', save).then((u) => offs.push(u));
  void w.listen('tauri://move', save).then((u) => offs.push(u));
  return () => offs.forEach((u) => u());
}

// ---- Schließen abfangen ----

/**
 * Ruft `onRequest` auf, wenn das Fenster geschlossen werden soll (X-Knopf, Alt+F4 …).
 * Solange dieser Listener aktiv ist, schließt Tauri das Fenster nicht selbst – `closeWindowNow()` schließt es.
 */
let closeUnlisten: Unlisten | null = null;
export function guardClose(onRequest: () => void): Unlisten {
  const w = appWindow();
  if (!w) return () => {};
  let alive = true;
  void w.listen('tauri://close-requested', () => onRequest()).then((u) => {
    if (alive) closeUnlisten = u;
    else u();
  });
  return () => {
    alive = false;
    closeUnlisten?.();
    closeUnlisten = null;
  };
}

export async function closeWindowNow(): Promise<void> {
  // Listener vorher entfernen, damit das Schließen nicht erneut abgefangen wird
  closeUnlisten?.();
  closeUnlisten = null;
  const w = appWindow();
  if (w) await w.close();
}

// ---- Darstellungsmodus (Linux): Grafikbeschleunigung ----

/** 'gpu' = Grafikbeschleunigung aktiv, 'safe' = sicherer Modus, 'fallback' = nach Problem automatisch zurückgeschaltet. */
export type RenderMode = 'gpu' | 'safe' | 'fallback';

export async function getRenderMode(): Promise<RenderMode | null> {
  try {
    const m = String(await invoke('get_render_mode'));
    return m === 'gpu' || m === 'fallback' ? m : 'safe';
  } catch {
    return null;
  }
}

export async function setRenderMode(mode: 'gpu' | 'safe'): Promise<boolean> {
  try {
    await invoke('set_render_mode', { mode });
    return true;
  } catch {
    return false;
  }
}

/** Nach erfolgreichem Start bestätigen, dass die Grafikbeschleunigung funktioniert. */
export function confirmRenderMode(): void {
  void invoke('confirm_render_mode').catch(() => {});
}

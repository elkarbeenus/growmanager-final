// Update-Check: Beim Start wird bei GitHub nachgesehen, ob es ein neueres Release gibt.
// Es werden dabei keine Nutzerdaten gesendet – nur eine einfache Abfrage der öffentlichen Release-Liste.
// Offline oder bei Fehlern passiert nichts (kein Fehler-Popup).
import { useSyncExternalStore } from 'react';
import { APP_VERSION } from '@/lib/appInfo';

export const REPO = 'elkarbeenus/growmanager-final';
export const RELEASES_PAGE = `https://github.com/${REPO}/releases`;
const API = `https://api.github.com/repos/${REPO}`;
const TIMEOUT_MS = 8000;

const SETTINGS_KEY = 'growhub:update:v1';

export interface ReleaseInfo {
  version: string; // ohne führendes „v“
  url: string; // Seite zum Herunterladen
  notes: string; // Patchnotes (kann leer sein)
  publishedAt?: string;
}

export type UpdateStatus =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'current'; latest: string; checkedAt: number }
  | { state: 'available'; release: ReleaseInfo; checkedAt: number }
  | { state: 'error'; message: string };

// ---- Versionen vergleichen ----

/** Zerlegt „v1.10.2-beta.1“ in Zahlen [1,10,2] und Zusatz „beta.1“. */
function parse(v: string): { nums: number[]; pre: string } | null {
  const m = String(v).trim().replace(/^v/i, '').match(/^(\d+(?:\.\d+)*)(?:-([0-9A-Za-z.-]+))?/);
  if (!m) return null;
  return { nums: m[1].split('.').map((n) => parseInt(n, 10)), pre: m[2] ?? '' };
}

/** >0 wenn a neuer ist als b, <0 wenn älter, 0 wenn gleich. Ungültige Versionen gelten als „älter“. */
export function compareVersions(a: string, b: string): number {
  const pa = parse(a);
  const pb = parse(b);
  if (!pa && !pb) return 0;
  if (!pa) return -1;
  if (!pb) return 1;
  const len = Math.max(pa.nums.length, pb.nums.length);
  for (let i = 0; i < len; i++) {
    const d = (pa.nums[i] ?? 0) - (pb.nums[i] ?? 0);
    if (d !== 0) return d > 0 ? 1 : -1;
  }
  // 1.9.0-beta ist älter als 1.9.0
  if (pa.pre && !pb.pre) return -1;
  if (!pa.pre && pb.pre) return 1;
  return pa.pre === pb.pre ? 0 : pa.pre > pb.pre ? 1 : -1;
}

export const cleanVersion = (v: string) => String(v).trim().replace(/^v/i, '');

// ---- Einstellungen (lokal gespeichert) ----

interface Settings {
  auto: boolean; // beim Start prüfen
  skipped?: string; // „Diese Version überspringen“
}

function loadSettings(): Settings {
  try {
    const v = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? 'null');
    if (v && typeof v === 'object') return { auto: v.auto !== false, skipped: typeof v.skipped === 'string' ? v.skipped : undefined };
  } catch {
    /* ignore */
  }
  return { auto: true };
}

let settings: Settings = loadSettings();
function saveSettings(): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
  emit();
}

export const isAutoCheckEnabled = () => settings.auto;
export function setAutoCheck(on: boolean): void {
  settings = { ...settings, auto: on };
  saveSettings();
}
export const getSkippedVersion = () => settings.skipped;
export function skipVersion(v: string): void {
  settings = { ...settings, skipped: cleanVersion(v) };
  saveSettings();
}

// ---- Abfrage bei GitHub ----

type FetchFn = typeof fetch;
let fetchImpl: FetchFn | null = null;
/** Nur für Tests: eigene fetch-Funktion einsetzen. */
export function _setFetch(fn: FetchFn | null): void {
  fetchImpl = fn;
}

async function getJson(path: string): Promise<{ status: number; body: unknown }> {
  const f = fetchImpl ?? fetch;
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = setTimeout(() => ctrl?.abort(), TIMEOUT_MS);
  try {
    const res = await f(`${API}${path}`, {
      headers: { Accept: 'application/vnd.github+json' },
      cache: 'no-store',
      signal: ctrl?.signal,
    });
    const body = res.ok ? await res.json() : null;
    return { status: res.status, body };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Neuestes veröffentlichtes Release holen.
 * 1. /releases/latest (nur fertige Releases, keine Entwürfe/Vorabversionen)
 * 2. Falls es noch gar keine Releases gibt: höchster Versions-Tag (v1.2.3)
 */
export async function fetchLatestRelease(): Promise<ReleaseInfo | null> {
  const rel = await getJson('/releases/latest');
  if (rel.status === 200 && rel.body && typeof rel.body === 'object') {
    const b = rel.body as { tag_name?: string; html_url?: string; body?: string; published_at?: string };
    if (b.tag_name && parse(b.tag_name)) {
      return {
        version: cleanVersion(b.tag_name),
        url: b.html_url || RELEASES_PAGE,
        notes: (b.body ?? '').trim(),
        publishedAt: b.published_at,
      };
    }
  }
  if (rel.status !== 404 && rel.status !== 200) throw new Error(`GitHub ${rel.status}`);

  const tags = await getJson('/tags?per_page=100');
  if (tags.status !== 200 || !Array.isArray(tags.body)) {
    if (tags.status === 200 || tags.status === 404) return null;
    throw new Error(`GitHub ${tags.status}`);
  }
  const names = (tags.body as { name?: string }[])
    .map((t) => t.name ?? '')
    .filter((n) => /^v?\d+\.\d+/.test(n));
  if (!names.length) return null;
  names.sort((a, b) => compareVersions(b, a));
  return { version: cleanVersion(names[0]), url: RELEASES_PAGE, notes: '' };
}

// ---- Status-Store (für Dialog, Versionsanzeige und „Über“-Reiter) ----

let status: UpdateStatus = { state: 'idle' };
let dialogOpen = false;
const listeners = new Set<() => void>();
function emit(): void {
  listeners.forEach((l) => l());
}
function setStatus(s: UpdateStatus): void {
  status = s;
  emit();
}

export const getUpdateStatus = () => status;
export const isUpdateDialogOpen = () => dialogOpen;
export function closeUpdateDialog(): void {
  dialogOpen = false;
  emit();
}
export function openUpdateDialog(): void {
  if (status.state === 'available') {
    dialogOpen = true;
    emit();
  }
}

function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

let snapshot: { status: UpdateStatus; dialogOpen: boolean; settings: Settings } = { status, dialogOpen, settings };
function getSnapshot() {
  if (snapshot.status !== status || snapshot.dialogOpen !== dialogOpen || snapshot.settings !== settings) {
    snapshot = { status, dialogOpen, settings };
  }
  return snapshot;
}

export function useUpdateState() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

let running: Promise<UpdateStatus> | null = null;

/**
 * Nach Updates suchen.
 * @param manual true = vom Nutzer ausgelöst: Dialog auch bei übersprungener Version zeigen, Fehler anzeigen.
 */
export function checkForUpdates(opts: { manual?: boolean; currentVersion?: string } = {}): Promise<UpdateStatus> {
  if (running) return running;
  const current = opts.currentVersion ?? APP_VERSION;
  setStatus({ state: 'checking' });
  running = (async (): Promise<UpdateStatus> => {
    try {
      const latest = await fetchLatestRelease();
      if (latest && compareVersions(latest.version, current) > 0) {
        setStatus({ state: 'available', release: latest, checkedAt: Date.now() });
        if (opts.manual || settings.skipped !== latest.version) {
          dialogOpen = true;
          emit();
        }
      } else {
        setStatus({ state: 'current', latest: latest?.version ?? current, checkedAt: Date.now() });
      }
    } catch (e) {
      const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
      setStatus({
        state: 'error',
        message: offline ? 'offline' : e instanceof Error && e.name === 'AbortError' ? 'timeout' : String((e as Error)?.message ?? e),
      });
    } finally {
      running = null;
    }
    return status;
  })();
  return running;
}

/** Beim App-Start aufrufen: prüft (wenn nicht abgeschaltet) kurz nach dem Start im Hintergrund. */
export function checkOnStartup(delayMs = 2500): () => void {
  if (!settings.auto) return () => {};
  const timer = setTimeout(() => void checkForUpdates(), delayMs);
  return () => clearTimeout(timer);
}

/** Nur für Tests. */
export function _resetUpdateState(): void {
  status = { state: 'idle' };
  dialogOpen = false;
  running = null;
  settings = loadSettings();
  emit();
}

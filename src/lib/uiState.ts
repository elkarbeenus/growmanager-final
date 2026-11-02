// Oberflächen-Zustand (aktiver Reiter, geöffneter Grow, eingeklappte Bereiche, Scroll-Position …)
// wird lokal gemerkt, damit die App beim nächsten Start genauso aussieht, wie man sie verlassen hat.
import { useCallback, useEffect, useRef, useState } from 'react';

const KEY = 'growhub:ui:v1';

type UiMap = Record<string, unknown>;

function readAll(): UiMap {
  try {
    const raw = localStorage.getItem(KEY);
    const v = raw ? JSON.parse(raw) : {};
    return v && typeof v === 'object' ? (v as UiMap) : {};
  } catch {
    return {};
  }
}

let memory: UiMap | null = null;
const all = (): UiMap => (memory ??= readAll());

export function getUi<T>(key: string, fallback: T): T {
  const v = all()[key];
  return v === undefined ? fallback : (v as T);
}

let writeTimer: ReturnType<typeof setTimeout> | null = null;
export function setUi(key: string, value: unknown): void {
  const m = all();
  if (value === undefined) delete m[key];
  else m[key] = value;
  // Scroll-Position und Fenstermaße gebündelt schreiben, alles andere sofort
  if (key.startsWith('scroll:') || key === 'window') {
    if (writeTimer) clearTimeout(writeTimer);
    writeTimer = setTimeout(flushUi, 250);
  } else {
    flushUi();
  }
}

export function flushUi(): void {
  if (writeTimer) {
    clearTimeout(writeTimer);
    writeTimer = null;
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(all()));
  } catch {
    /* ignore */
  }
}

export function resetUi(): void {
  memory = {};
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', flushUi);
  window.addEventListener('beforeunload', flushUi);
}

/** Wie useState, aber der Wert bleibt über Neustarts der App erhalten. */
export function usePersistentState<T>(key: string, fallback: T, validate?: (v: unknown) => v is T): [T, (v: T | ((p: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    const v = getUi<unknown>(key, fallback);
    return validate && !validate(v) ? fallback : (v as T);
  });
  const set = useCallback(
    (v: T | ((p: T) => T)) => {
      setValue((prev) => {
        const next = typeof v === 'function' ? (v as (p: T) => T)(prev) : v;
        setUi(key, next);
        return next;
      });
    },
    [key]
  );
  return [value, set];
}

/**
 * Scroll-Position je Ansicht merken und beim Zurückkehren/Neustart wiederherstellen.
 * `viewKey` z. B. "grows" oder "grow:<id>".
 */
export function useScrollMemory(viewKey: string, ready = true): void {
  const restored = useRef<string | null>(null);
  useEffect(() => {
    if (!ready || restored.current === viewKey) return;
    restored.current = viewKey;
    const y = getUi<number>(`scroll:${viewKey}`, 0);
    // nach dem Rendern (Inhalte/Bilder) wiederherstellen
    let tries = 0;
    const apply = () => {
      window.scrollTo(0, y);
      if (Math.abs(window.scrollY - y) > 2 && tries++ < 10) setTimeout(apply, 60);
    };
    requestAnimationFrame(apply);
  }, [viewKey, ready]);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        setUi(`scroll:${viewKey}`, Math.round(window.scrollY));
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [viewKey]);
}

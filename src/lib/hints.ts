// Merkt sich, welche Hinweis-Karten und welche Einführungstour der Nutzer bereits gesehen/ausgeblendet hat.
import { useSyncExternalStore } from 'react';

const HINTS_KEY = 'growhub:hints:v1';
const TOUR_KEY = 'growhub:tour:v1';
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

function dismissedSet(): Set<string> {
  try {
    const v = JSON.parse(read(HINTS_KEY) ?? '[]');
    return new Set(Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []);
  } catch {
    return new Set();
  }
}

export function isHintDismissed(id: string): boolean {
  return dismissedSet().has(id);
}

export function dismissHint(id: string): void {
  const s = dismissedSet();
  s.add(id);
  write(HINTS_KEY, JSON.stringify([...s]));
  emit();
}

export function resetHints(): void {
  write(HINTS_KEY, '[]');
  emit();
}

/** true = Tour wurde gesehen bzw. der Nutzer möchte sie beim Start nicht mehr sehen. */
export function isTourSeen(): boolean {
  return read(TOUR_KEY) === 'seen';
}

export function setTourSeen(seen: boolean): void {
  write(TOUR_KEY, seen ? 'seen' : 'pending');
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function useHintDismissed(id: string): boolean {
  return useSyncExternalStore(subscribe, () => isHintDismissed(id), () => false);
}

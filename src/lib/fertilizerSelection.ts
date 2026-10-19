// Der im Reiter "Dünger" gewählte Dünger gilt als aktiver Dünger für die Verbrauchsrechnung
// (Reiter "Nährlösung" und Grow-Detail). Gespeichert wird unter demselben Schlüssel wie bisher.
import { useSyncExternalStore } from 'react';
import { FERTILIZER_IDS } from '@/lib/fertilizerData';

export const FERTILIZER_STORAGE_KEY = 'grow-calendar:fertilizer';

const listeners = new Set<() => void>();

export function getSelectedFertilizer(): string {
  try {
    const v = localStorage.getItem(FERTILIZER_STORAGE_KEY);
    if (v && FERTILIZER_IDS.includes(v)) return v;
  } catch {
    /* ignore */
  }
  return FERTILIZER_IDS[0];
}

export function setSelectedFertilizer(id: string): void {
  if (!FERTILIZER_IDS.includes(id) || id === getSelectedFertilizer()) return;
  try {
    localStorage.setItem(FERTILIZER_STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => e.key === FERTILIZER_STORAGE_KEY && cb();
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener('storage', onStorage);
  };
}

/** React-Hook: aktiver Dünger (ID), rendert bei Änderung neu. */
export function useSelectedFertilizer(): string {
  return useSyncExternalStore(subscribe, getSelectedFertilizer, getSelectedFertilizer);
}

/** Auswahl auf den Standard zurücksetzen (beim Zurücksetzen der App). */
export function resetSelectedFertilizer(): void {
  try {
    localStorage.removeItem(FERTILIZER_STORAGE_KEY);
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

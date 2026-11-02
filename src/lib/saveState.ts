// Merkt sich, wo zuletzt ein Backup gespeichert wurde („Speichern unter …“), und welcher Datenstand
// zuletzt gesichert war – für die Anzeige des Speicherorts und die Frage beim Schließen der App.
import { useSyncExternalStore } from 'react';
import type { AppData } from '@/types';

const LAST_SAVE_KEY = 'growhub:lastSave:v1';
const SAVED_HASH_KEY = 'growhub:savedHash:v1';

export interface LastSave {
  location?: string; // vollständiger Pfad (Desktop-App)
  folder?: string; // Ordner des Pfads
  filename: string;
  method: 'tauri' | 'picker' | 'download' | 'folder';
  at: string; // ISO
}

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

let cachedRaw: string | null | undefined;
let cachedValue: LastSave | null = null;

export function getLastSave(): LastSave | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(LAST_SAVE_KEY);
  } catch {
    raw = null;
  }
  if (raw === cachedRaw) return cachedValue;
  cachedRaw = raw;
  try {
    cachedValue = raw ? (JSON.parse(raw) as LastSave) : null;
  } catch {
    cachedValue = null;
  }
  return cachedValue;
}

/** Ordner eines Pfads (Linux / Windows). */
export function folderOf(path: string): string {
  const i = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
  return i > 0 ? path.slice(0, i) : path;
}

export function joinPath(folder: string, name: string): string {
  const sep = folder.includes('\\') && !folder.includes('/') ? '\\' : '/';
  return folder.endsWith(sep) ? folder + name : folder + sep + name;
}

export function setLastSave(s: Omit<LastSave, 'at' | 'folder'> & { at?: string }): void {
  const value: LastSave = { ...s, folder: s.location ? folderOf(s.location) : undefined, at: s.at ?? new Date().toISOString() };
  try {
    localStorage.setItem(LAST_SAVE_KEY, JSON.stringify(value));
  } catch {
    /* ignore */
  }
  emit();
}

export function useLastSave(): LastSave | null {
  return useSyncExternalStore(subscribe, getLastSave, getLastSave);
}

// ---- Änderungen seit dem letzten Backup ----

/** Schneller Prüfwert (FNV-1a) über den Datenstand. */
export function dataHash(data: AppData): string {
  const { images: _drop, ...rest } = data as AppData & { images?: unknown };
  void _drop;
  const str = JSON.stringify(rest);
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16) + ':' + str.length;
}

export function getSavedHash(): string | null {
  try {
    return localStorage.getItem(SAVED_HASH_KEY);
  } catch {
    return null;
  }
}

/** Datenstand als „gesichert“ markieren (nach jedem Backup / Export). */
export function markSaved(data: AppData): void {
  try {
    localStorage.setItem(SAVED_HASH_KEY, dataHash(data));
  } catch {
    /* ignore */
  }
  emit();
}

/** Beim ersten Start dieser Version: aktuellen Stand als Ausgangspunkt nehmen. */
export function ensureSavedBaseline(data: AppData): void {
  if (getSavedHash() === null) markSaved(data);
}

export function hasUnsavedChanges(data: AppData): boolean {
  const saved = getSavedHash();
  if (saved === null) return false;
  return saved !== dataHash(data);
}

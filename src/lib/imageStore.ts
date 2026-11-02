// Bilder an Grows: Die Bilddaten werden lokal in IndexedDB gespeichert (eine Kopie des Bildes –
// das Original darf danach verschoben oder gelöscht werden). In Backup-Dateien (Export / Speichern unter …)
// werden die Bilder als data-URL mitgespeichert und beim Import wiederhergestellt.
// Die täglichen Auto-Backups im App-Speicher enthalten nur die Bild-Infos, nicht die Bilddaten
// (der App-Speicher ist dafür zu klein) – die Bilder selbst bleiben in IndexedDB erhalten.
import { useEffect, useState } from 'react';
import type { AppData } from '@/types';

const DB_NAME = 'growhub-images';
const STORE = 'images';
export const MAX_IMAGE_EDGE = 1600; // längste Kante in Pixel
export const JPEG_QUALITY = 0.82;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      dbPromise = null;
      reject(req.error);
    };
  });
  return dbPromise;
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    let result: T | undefined;
    if (req) req.onsuccess = () => (result = req.result);
    t.oncomplete = () => resolve(result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

const cache = new Map<string, string>();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export async function putImage(id: string, dataUrl: string): Promise<void> {
  await tx('readwrite', (s) => s.put(dataUrl, id));
  cache.set(id, dataUrl);
  emit();
}

export async function getImage(id: string): Promise<string | undefined> {
  if (cache.has(id)) return cache.get(id);
  const v = await tx<string>('readonly', (s) => s.get(id));
  if (typeof v === 'string') cache.set(id, v);
  return typeof v === 'string' ? v : undefined;
}

export async function deleteImage(id: string): Promise<void> {
  await tx('readwrite', (s) => s.delete(id));
  cache.delete(id);
  emit();
}

export async function clearImages(): Promise<void> {
  await tx('readwrite', (s) => s.clear());
  cache.clear();
  emit();
}

/** Bild-URL (data-URL) für eine Bild-ID; undefined = lädt noch, null = nicht vorhanden. */
export function useImageUrl(id: string | undefined): string | null | undefined {
  const [url, setUrl] = useState<string | null | undefined>(() => (id && cache.has(id) ? cache.get(id) : undefined));
  useEffect(() => {
    if (!id) {
      setUrl(null);
      return;
    }
    let alive = true;
    const load = () =>
      getImage(id)
        .then((v) => alive && setUrl(v ?? null))
        .catch(() => alive && setUrl(null));
    void load();
    listeners.add(load);
    return () => {
      alive = false;
      listeners.delete(load);
    };
  }, [id]);
  return url;
}

export interface PreparedImage {
  dataUrl: string;
  width: number;
  height: number;
  bytes: number;
}

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Bild konnte nicht gelesen werden'));
    img.src = src;
  });
}

/** Bild einlesen und auf max. 1600 px (längste Kante) als JPEG verkleinern – spart Speicher und Backup-Größe. */
export async function prepareImage(file: File): Promise<PreparedImage> {
  const src = await readAsDataUrl(file);
  const img = await loadImg(src);
  const w0 = img.naturalWidth || img.width;
  const h0 = img.naturalHeight || img.height;
  const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(w0, h0));
  const w = Math.max(1, Math.round(w0 * scale));
  const h = Math.max(1, Math.round(h0 * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return { dataUrl: src, width: w0, height: h0, bytes: Math.round((src.length * 3) / 4) };
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  let dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  // Kleine Bilder (z. B. Screenshots) nicht unnötig vergrößern
  if (scale === 1 && src.length < dataUrl.length && /^data:image\/(jpeg|png|webp)/.test(src)) dataUrl = src;
  return { dataUrl, width: w, height: h, bytes: Math.round(((dataUrl.length - dataUrl.indexOf(',') - 1) * 3) / 4) };
}

/** Alle Bild-IDs der Grows. */
export function imageIdsOf(data: AppData): string[] {
  return data.grows.flatMap((g) => (g.images ?? []).map((i) => i.id));
}

/** Für Backup-Dateien: Bilddaten mitnehmen. */
export async function withImages(data: AppData): Promise<AppData> {
  const ids = imageIdsOf(data);
  if (ids.length === 0) return data;
  const images: Record<string, string> = {};
  for (const id of ids) {
    try {
      const v = await getImage(id);
      if (v) images[id] = v;
    } catch {
      /* fehlendes Bild überspringen */
    }
  }
  return Object.keys(images).length ? { ...data, images } : data;
}

/** Beim Import: Bilddaten aus der Datei lokal speichern und aus den Daten entfernen. */
export async function storeImportedImages(data: AppData): Promise<AppData> {
  const { images, ...rest } = data;
  if (!images) return data;
  for (const [id, url] of Object.entries(images)) {
    if (typeof url === 'string' && url.startsWith('data:image/')) {
      try {
        await putImage(id, url);
      } catch {
        /* einzelnes Bild überspringen */
      }
    }
  }
  return rest as AppData;
}

/** Bilddaten-Map aus einer Datei bereinigen. */
export function normalizeImageMap(input: unknown): Record<string, string> | undefined {
  if (!input || typeof input !== 'object') return undefined;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (typeof v === 'string' && v.startsWith('data:image/')) out[k] = v;
  }
  return Object.keys(out).length ? out : undefined;
}

// Backup-Speicherort über File System Access API
// Erlaubt dem Nutzer, ein Verzeichnis zu wählen, in das Backups automatisch
// gespeichert werden. Der Verzeichnis-Handle wird in IndexedDB persistiert,
// damit er über Sessions hinweg erhalten bleibt.

const DB_NAME = 'growhub-fs';
const STORE_NAME = 'handles';
const DIR_KEY = 'backup-dir';
const ONCE_COUNT_KEY = 'growhub:once-count:v1';
const PERMANENT_FLAG_KEY = 'growhub:backup-dir-permanent:v1';

const PERMANENT_THRESHOLD = 3;

// ---- IndexedDB Handle-Speicher ----

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key: string, value: unknown): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbGet<T>(key: string): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

async function idbDelete(key: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ---- File System Access API ----

export function supportsFileSystemAccess(): boolean {
  return typeof (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker === 'function';
}

export async function pickBackupDirectory(): Promise<FileSystemDirectoryHandle | null> {
  if (!supportsFileSystemAccess()) return null;
  try {
    const handle = await (window as unknown as {
      showDirectoryPicker: (opts?: { mode?: 'read' | 'readwrite' }) => Promise<FileSystemDirectoryHandle>;
    }).showDirectoryPicker({ mode: 'readwrite' });
    return handle;
  } catch (e) {
    // User cancelled
    return null;
  }
}

export async function getStoredDirectory(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const handle = await idbGet<FileSystemDirectoryHandle>(DIR_KEY);
    return handle ?? null;
  } catch {
    return null;
  }
}

export async function storeDirectory(handle: FileSystemDirectoryHandle, permanent: boolean): Promise<void> {
  await idbSet(DIR_KEY, handle);
  localStorage.setItem(PERMANENT_FLAG_KEY, permanent ? '1' : '0');
}

export async function clearStoredDirectory(): Promise<void> {
  await idbDelete(DIR_KEY);
  localStorage.removeItem(PERMANENT_FLAG_KEY);
  localStorage.removeItem(ONCE_COUNT_KEY);
}

export function isPermanent(): boolean {
  return localStorage.getItem(PERMANENT_FLAG_KEY) === '1';
}

export function getOnceCount(): number {
  return parseInt(localStorage.getItem(ONCE_COUNT_KEY) ?? '0', 10);
}

export function incrementOnceCount(): number {
  const count = getOnceCount() + 1;
  localStorage.setItem(ONCE_COUNT_KEY, String(count));
  return count;
}

export function resetOnceCount(): void {
  localStorage.removeItem(ONCE_COUNT_KEY);
}

export function getPermanentThreshold(): number {
  return PERMANENT_THRESHOLD;
}

export async function verifyPermission(handle: FileSystemDirectoryHandle): Promise<boolean> {
  const opts = { mode: 'readwrite' as const };
  if ((await handle.queryPermission(opts)) === 'granted') return true;
  if ((await handle.requestPermission(opts)) === 'granted') return true;
  return false;
}

// Schreibt eine Backup-Datei in das gewählte Verzeichnis
export async function writeToBackupDir(
  handle: FileSystemDirectoryHandle,
  filename: string,
  content: string
): Promise<void> {
  const fileHandle = await handle.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
}

// Liest alle Backup-Dateien (.json) aus dem Verzeichnis
export async function listBackupFiles(handle: FileSystemDirectoryHandle): Promise<{ name: string; size: number; lastModified: number }[]> {
  const files: { name: string; size: number; lastModified: number }[] = [];
  for await (const entry of handle.values()) {
    if (entry.kind === 'file' && entry.name.endsWith('.json')) {
      const fileHandle = entry as FileSystemFileHandle;
      const file = await fileHandle.getFile();
      files.push({ name: entry.name, size: file.size, lastModified: file.lastModified });
    }
  }
  return files.sort((a, b) => b.lastModified - a.lastModified);
}

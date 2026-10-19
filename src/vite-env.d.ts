/// <reference types="vite/client" />

// File System Access API — TypeScript-Ergänzungen
// Die DOM-Lib-Typen decken queryPermission/requestPermission und das asynchrone
// Iterieren über Verzeichniseinträge nicht vollständig ab, daher hier eigene Typen.

interface FileSystemDirectoryHandle {
  queryPermission(descriptor?: { mode: 'read' | 'readwrite' }): Promise<PermissionState>;
  requestPermission(descriptor?: { mode: 'read' | 'readwrite' }): Promise<PermissionState>;
  values(): AsyncIterableIterator<FileSystemHandle>;
  keys(): AsyncIterableIterator<string>;
  entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
  [Symbol.asyncIterator](): AsyncIterableIterator<FileSystemHandle>;
}

interface FileSystemFileHandle {
  getFile(): Promise<File>;
}

// Wird von vite.config.ts aus package.json injiziert
declare const __APP_VERSION__: string;

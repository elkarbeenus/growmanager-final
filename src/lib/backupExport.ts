// Backup exportieren mit frei wählbarem Dateipfad („Speichern unter …“).
// Reihenfolge der Methoden:
//  1. Desktop-App (Tauri): nativer "Speichern unter"-Dialog, Pfad wird angezeigt
//  2. Browser mit File System Access API: "Speichern unter"-Dialog (Dateiname)
//  3. Fallback: normaler Datei-Download
import type { AppData } from '@/types';
import { addBackupLog, exportDataAsJSON, verifyBackup } from '@/lib/storage';
import { t } from '@/lib/i18n';

interface TauriGlobal {
  dialog?: {
    save: (opts?: { defaultPath?: string; filters?: { name: string; extensions: string[] }[] }) => Promise<string | null>;
  };
  fs?: {
    writeTextFile: (path: string, contents: string) => Promise<void>;
    writeBinaryFile?: (path: string, contents: Uint8Array) => Promise<void>;
  };
}

function tauri(): TauriGlobal | null {
  return (window as unknown as { __TAURI__?: TauriGlobal }).__TAURI__ ?? null;
}

type SavePicker = (opts?: {
  suggestedName?: string;
  types?: { description: string; accept: Record<string, string[]> }[];
}) => Promise<{
  name: string;
  createWritable: () => Promise<{ write: (d: string | Blob) => Promise<void>; close: () => Promise<void> }>;
}>;

function savePicker(): SavePicker | null {
  const fn = (window as unknown as { showSaveFilePicker?: SavePicker }).showSaveFilePicker;
  return typeof fn === 'function' ? fn.bind(window) : null;
}

export function backupFilename(): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `growmanager-backup-${stamp}.json`;
}

export type SaveResult =
  | { ok: true; method: 'tauri' | 'picker' | 'download'; filename: string; location?: string }
  | { ok: false; cancelled?: boolean; message: string };

/** Speichert das Backup an einem vom Nutzer gewählten Ort. */
export async function saveBackupAs(data: AppData): Promise<SaveResult> {
  const verification = verifyBackup(data);
  if (!verification.ok) {
    const message = `${t('Verifizierung fehlgeschlagen', 'Verification failed')}: ${verification.errors.join('; ')}`;
    addBackupLog('export', 'error', message);
    return { ok: false, message };
  }
  const json = JSON.stringify(data, null, 2);
  const filename = backupFilename();
  const summary = `${verification.growCount} Grows, ${verification.logCount} ${t('Einträge', 'entries')}`;

  try {
    const tg = tauri();
    if (tg?.dialog?.save && tg.fs?.writeTextFile) {
      const path = await tg.dialog.save({
        defaultPath: filename,
        filters: [{ name: 'JSON', extensions: ['json'] }],
      });
      if (!path) return { ok: false, cancelled: true, message: t('Speichern abgebrochen.', 'Saving cancelled.') };
      await tg.fs.writeTextFile(path, json);
      addBackupLog('export', 'success', t(`Backup gespeichert unter ${path} (${summary}). Verifiziert.`, `Backup saved to ${path} (${summary}). Verified.`));
      return { ok: true, method: 'tauri', filename: path.split(/[\\/]/).pop() ?? filename, location: path };
    }

    const picker = savePicker();
    if (picker) {
      const handle = await picker({
        suggestedName: filename,
        types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }],
      });
      const w = await handle.createWritable();
      await w.write(json);
      await w.close();
      addBackupLog('export', 'success', t(`Backup gespeichert als ${handle.name} (${summary}). Verifiziert.`, `Backup saved as ${handle.name} (${summary}). Verified.`));
      return { ok: true, method: 'picker', filename: handle.name };
    }

    exportDataAsJSON(data); // protokolliert selbst
    return { ok: true, method: 'download', filename };
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      return { ok: false, cancelled: true, message: t('Speichern abgebrochen.', 'Saving cancelled.') };
    }
    const message = e instanceof Error ? e.message : t('Fehler beim Speichern.', 'Error while saving.');
    addBackupLog('export', 'error', `${t('Speichern fehlgeschlagen', 'Saving failed')}: ${message}`);
    return { ok: false, message };
  }
}

export function exportCapability(): 'tauri' | 'picker' | 'download' {
  const tg = tauri();
  if (tg?.dialog?.save && tg.fs?.writeTextFile) return 'tauri';
  return savePicker() ? 'picker' : 'download';
}

/** Speichert eine beliebige Binärdatei (z. B. PDF-Bericht) über "Speichern unter …". */
export async function saveBinaryAs(
  filename: string,
  bytes: Uint8Array,
  mime: string,
  ext: string
): Promise<SaveResult> {
  try {
    const tg = tauri();
    if (tg?.dialog?.save && tg.fs?.writeBinaryFile) {
      const path = await tg.dialog.save({
        defaultPath: filename,
        filters: [{ name: ext.toUpperCase(), extensions: [ext] }],
      });
      if (!path) return { ok: false, cancelled: true, message: t('Speichern abgebrochen.', 'Saving cancelled.') };
      await tg.fs.writeBinaryFile(path, bytes);
      return { ok: true, method: 'tauri', filename: path.split(/[\\/]/).pop() ?? filename, location: path };
    }

    const blob = new Blob([bytes as BlobPart], { type: mime });
    const picker = savePicker();
    if (picker) {
      const handle = await picker({
        suggestedName: filename,
        types: [{ description: ext.toUpperCase(), accept: { [mime]: [`.${ext}`] } }],
      });
      const w = await handle.createWritable();
      await w.write(blob);
      await w.close();
      return { ok: true, method: 'picker', filename: handle.name };
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return { ok: true, method: 'download', filename };
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      return { ok: false, cancelled: true, message: t('Speichern abgebrochen.', 'Saving cancelled.') };
    }
    return { ok: false, message: e instanceof Error ? e.message : t('Fehler beim Speichern.', 'Error while saving.') };
  }
}

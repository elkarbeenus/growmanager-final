import type { AppData, AppSettings, CostEntry, Device, Grow, NutrientBatch } from '@/types';
import { t } from '@/lib/i18n';

const STORAGE_KEY = 'growhub:data:v1';
const BACKUP_KEY = 'growhub:backups:v1';
const CURRENT_VERSION = 1;
const MAX_BACKUPS = 14; // max. 14 tägliche Snapshots behalten

export function emptyData(): AppData {
  return { version: CURRENT_VERSION, grows: [], batches: [] };
}

// Nährlösungs-Ansätze bereinigen (alte Backups haben das Feld nicht)
export function normalizeBatches(input: unknown): NutrientBatch[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((b): b is NutrientBatch => !!b && typeof b.date === 'string' && Number.isFinite(Number(b.liters)))
    .map((b) => ({
      id: b.id ?? crypto.randomUUID(),
      date: b.date,
      liters: Number(b.liters),
      note: b.note,
      growId: typeof b.growId === 'string' && b.growId ? b.growId : undefined,
      weekIndex: typeof b.weekIndex === 'number' && Number.isInteger(b.weekIndex) && b.weekIndex >= 0 ? b.weekIndex : undefined,
      createdAt: b.createdAt ?? new Date().toISOString(),
    }));
}

const COST_CATEGORIES = ['nutrients', 'electricity', 'equipment', 'substrate', 'genetics', 'other'];

// Kosten bereinigen (ältere Backups haben das Feld nicht)
export function normalizeCosts(input: unknown): CostEntry[] | undefined {
  if (!Array.isArray(input)) return undefined;
  const list = input
    .filter((c) => !!c && Number.isFinite(Number(c.amount)))
    .map((c) => ({
      id: c.id ?? crypto.randomUUID(),
      category: (COST_CATEGORIES.includes(c.category) ? c.category : 'other') as CostEntry['category'],
      label: typeof c.label === 'string' && c.label.trim() ? c.label : undefined,
      amount: Number(c.amount),
      date: typeof c.date === 'string' && c.date ? c.date : undefined,
    }));
  return list.length ? list : undefined;
}

/** Eigene Düngerpreise bereinigen (nur endliche Zahlen >= 0). */
export function normalizeFertPrices(input: unknown): Record<string, number> | undefined {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return undefined;
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    const n = Number(v);
    if (typeof k === 'string' && k.includes(':') && Number.isFinite(n) && n >= 0) out[k] = n;
  }
  return Object.keys(out).length ? out : undefined;
}

const num = (v: unknown, min: number, max: number): number | undefined => {
  const n = Number(v);
  return v !== undefined && v !== null && v !== '' && Number.isFinite(n) && n >= min && n <= max ? n : undefined;
};

/** Einstellungen bereinigen (Strompreis, Lichtstunden, LED-Lampen). */
export function normalizeSettings(input: unknown): AppSettings | undefined {
  if (!input || typeof input !== 'object') return undefined;
  const o = input as Record<string, unknown>;
  const lamps = Array.isArray(o.lamps)
    ? o.lamps
        .filter((l) => !!l && typeof (l as { name?: unknown }).name === 'string' && Number.isFinite(Number((l as { watts?: unknown }).watts)))
        .map((l) => {
          const x = l as { id?: string; name: string; watts: unknown };
          return { id: x.id ?? crypto.randomUUID(), name: x.name, watts: Math.max(0, Number(x.watts)) };
        })
    : undefined;
  const TYPES = ['exhaust', 'clipfan', 'controller', 'dehumidifier', 'humidifier', 'other'];
  const devices: Device[] | undefined = Array.isArray(o.devices)
    ? o.devices
        .filter((d) => !!d && typeof (d as { name?: unknown }).name === 'string' && Number.isFinite(Number((d as { watts?: unknown }).watts)))
        .map((d) => {
          const x = d as { id?: string; type?: string; name: string; watts: unknown; hours?: unknown; phase?: string };
          return {
            id: x.id ?? crypto.randomUUID(),
            type: (TYPES.includes(x.type ?? '') ? x.type : 'other') as Device['type'],
            name: x.name,
            watts: Math.max(0, Number(x.watts)),
            hours: num(x.hours, 0, 24) ?? 24,
            phase: (x.phase === 'veg' || x.phase === 'flower' ? x.phase : 'both') as Device['phase'],
          };
        })
    : undefined;
  const out: AppSettings = {
    devices: devices && devices.length ? devices : undefined,
    kwhPrice: num(o.kwhPrice, 0, 10),
    hoursVeg: num(o.hoursVeg, 0, 24),
    hoursFlower: num(o.hoursFlower, 0, 24),
    lamps: lamps && lamps.length ? lamps : undefined,
  };
  return Object.values(out).some((v) => v !== undefined) ? out : undefined;
}

export function normalizePlantCount(v: unknown): number | undefined {
  const n = Number(v);
  if (!Number.isFinite(n)) return undefined;
  return Math.min(10, Math.max(1, Math.round(n)));
}

// Einheitliche Grow-Bereinigung für Import und Wiederherstellung
export function normalizeGrow(g: Partial<Grow>): Grow {
  return {
    id: g.id ?? crypto.randomUUID(),
    name: g.name ?? 'Untitled Grow',
    strain: g.strain,
    color: g.color ?? '#10b981',
    milestones: g.milestones ?? {},
    logs: Array.isArray(g.logs) ? g.logs : [],
    drying: g.drying,
    lampId: typeof g.lampId === 'string' && g.lampId ? g.lampId : undefined,
    deviceIds: Array.isArray(g.deviceIds) && g.deviceIds.some((x) => typeof x === 'string') ? g.deviceIds.filter((x): x is string => typeof x === 'string') : undefined,
    lampCount: g.lampId ? Math.min(4, Math.max(1, Math.round(Number(g.lampCount ?? 1)) || 1)) : undefined,
    powerCostAuto: g.powerCostAuto === false ? false : undefined,
    fertCostAuto: g.fertCostAuto === false ? false : undefined,
    fertilizerId: typeof g.fertilizerId === 'string' && g.fertilizerId ? g.fertilizerId : undefined,
    plantCount: normalizePlantCount(g.plantCount),
    costs: normalizeCosts(g.costs),
    createdAt: g.createdAt ?? new Date().toISOString(),
  };
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyData();
    const parsed = JSON.parse(raw) as AppData;
    if (!parsed || !Array.isArray(parsed.grows)) return emptyData();
    parsed.grows = parsed.grows.map((g) => ({
      ...g,
      milestones: g.milestones ?? {},
      logs: Array.isArray(g.logs) ? g.logs : [],
    }));
    return { ...parsed, batches: normalizeBatches(parsed.batches), fertPrices: normalizeFertPrices(parsed.fertPrices), settings: normalizeSettings(parsed.settings), version: CURRENT_VERSION };
  } catch (e) {
    console.error('Failed to load GrowHub data', e);
    return emptyData();
  }
}

export function saveData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save GrowHub data', e);
  }
}

// ---- Auto-Backup (täglich) ----

export interface AutoBackup {
  id: string;
  date: string; // YYYY-MM-DD
  timestamp: string; // ISO
  growCount: number;
  logCount: number;
  data: AppData;
  manual?: boolean;
  label?: BackupLabel; // Sicherheits-Backup vor einer überschreibenden Aktion
}

export type BackupLabel = 'import' | 'restore' | 'reset';

// ---- Backup-Log ----

export type BackupLogKind = 'auto' | 'manual' | 'restore' | 'export' | 'import' | 'delete' | 'verify';
export type BackupLogStatus = 'success' | 'warning' | 'error';

export interface BackupLogEntry {
  id: string;
  timestamp: string; // ISO
  kind: BackupLogKind;
  status: BackupLogStatus;
  message: string;
}

const LOG_KEY = 'growhub:backuplog:v1';
const MAX_LOG_ENTRIES = 50;

export function getBackupLog(): BackupLogEntry[] {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as BackupLogEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addBackupLog(kind: BackupLogKind, status: BackupLogStatus, message: string): void {
  const entry: BackupLogEntry = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    kind,
    status,
    message,
  };
  const updated = [entry, ...getBackupLog()].slice(0, MAX_LOG_ENTRIES);
  try {
    localStorage.setItem(LOG_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save backup log', e);
  }
}

export function clearBackupLog(): void {
  try {
    localStorage.removeItem(LOG_KEY);
  } catch (e) {
    console.error('Failed to clear backup log', e);
  }
}

// Verifiziert, dass ein Backup-Datensatz wohlgeformt und konsistent ist
export function verifyBackup(data: AppData): { ok: boolean; errors: string[]; growCount: number; logCount: number } {
  const errors: string[] = [];
  if (!data || typeof data !== 'object') {
    errors.push(t('Datensatz ist kein gültiges Objekt.', 'Data set is not a valid object.'));
    return { ok: false, errors, growCount: 0, logCount: 0 };
  }
  if (!Array.isArray(data.grows)) {
    errors.push(t('Grows-Liste fehlt oder ist kein Array.', 'Grows list is missing or not an array.'));
    return { ok: false, errors, growCount: 0, logCount: 0 };
  }
  let logCount = 0;
  data.grows.forEach((g, i) => {
    if (!g.id) errors.push(`Grow ${i + 1}: ${t('ID fehlt.', 'ID missing.')}`);
    if (!g.name) errors.push(`Grow ${i + 1}: ${t('Name fehlt.', 'name missing.')}`);
    if (!g.milestones || typeof g.milestones !== 'object') errors.push(`Grow ${i + 1}: ${t('Meilensteine fehlen.', 'milestones missing.')}`);
    if (!Array.isArray(g.logs)) {
      errors.push(`Grow ${i + 1}: ${t('Logs sind kein Array.', 'logs are not an array.')}`);
    } else {
      logCount += g.logs.length;
    }
  });
  return { ok: errors.length === 0, errors, growCount: data.grows.length, logCount };
}

export function getAutoBackups(): AutoBackup[] {
  try {
    const raw = localStorage.getItem(BACKUP_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AutoBackup[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function createAutoBackupIfDue(data: AppData): boolean {
  // Nichts zu sichern, solange keine Daten vorhanden sind (z. B. frisch installiert oder zurückgesetzt)
  if (data.grows.length === 0 && (data.batches ?? []).length === 0) return false;
  const today = new Date().toISOString().slice(0, 10);
  const backups = getAutoBackups();
  if (backups.some((b) => b.date === today)) return false;

  const verification = verifyBackup(data);
  if (!verification.ok) {
    addBackupLog('auto', 'error', `${t('Auto-Backup fehlgeschlagen', 'Auto backup failed')}: ${verification.errors.join('; ')}`);
    return false;
  }

  const backup: AutoBackup = {
    id: crypto.randomUUID(),
    date: today,
    timestamp: new Date().toISOString(),
    growCount: data.grows.length,
    logCount: verification.logCount,
    data,
  };

  const updated = [backup, ...backups].slice(0, MAX_BACKUPS);
  try {
    localStorage.setItem(BACKUP_KEY, JSON.stringify(updated));
    addBackupLog('auto', 'success', `${t('Auto-Backup erstellt', 'Auto backup created')}: ${verification.growCount} Grows, ${verification.logCount} ${t('Einträge', 'entries')}. ${t('Verifiziert.', 'Verified.')}`);
    return true;
  } catch (e) {
    console.error('Failed to save auto-backup', e);
    addBackupLog('auto', 'error', t('Auto-Backup fehlgeschlagen: Speicherfehler.', 'Auto backup failed: storage error.'));
    return false;
  }
}

/**
 * Sicherheits-Backup VOR einer Aktion, die alle aktuellen Daten überschreibt (Import, Wiederherstellung,
 * Zurücksetzen). Ersetzt keine anderen Backups, damit auch mehrere Aktionen am selben Tag rückgängig
 * gemacht werden können. Gibt true zurück, wenn gesichert wurde (false = es gab nichts zu sichern).
 */
export function createSafetyBackup(data: AppData, label: BackupLabel): boolean {
  if (data.grows.length === 0 && (data.batches ?? []).length === 0) return false;
  const verification = verifyBackup(data);
  if (!verification.ok) return false;
  const now = new Date();
  const backup: AutoBackup = {
    id: crypto.randomUUID(),
    date: now.toISOString().slice(0, 10),
    timestamp: now.toISOString(),
    growCount: data.grows.length,
    logCount: verification.logCount,
    data,
    manual: true,
    label,
  };
  try {
    localStorage.setItem(BACKUP_KEY, JSON.stringify([backup, ...getAutoBackups()].slice(0, MAX_BACKUPS)));
    const what = { import: t('Import', 'import'), restore: t('Wiederherstellung', 'restore'), reset: t('Zurücksetzen', 'reset') }[label];
    addBackupLog('manual', 'success', t(`Sicherheits-Backup vor ${what} erstellt: ${verification.growCount} Grows, ${verification.logCount} Einträge.`, `Safety backup before ${what} created: ${verification.growCount} grows, ${verification.logCount} entries.`));
    return true;
  } catch {
    return false;
  }
}

/** Löscht alle gespeicherten Backups (Reset). */
export function clearAllBackups(): void {
  try {
    localStorage.removeItem(BACKUP_KEY);
  } catch {
    /* ignore */
  }
}

// Manuelles Backup erstellen (mit Verifizierung)
export function createManualBackup(data: AppData): { ok: boolean; backup?: AutoBackup; errors: string[] } {
  const verification = verifyBackup(data);
  if (!verification.ok) {
    addBackupLog('manual', 'error', `${t('Manuelles Backup fehlgeschlagen', 'Manual backup failed')}: ${verification.errors.join('; ')}`);
    return { ok: false, errors: verification.errors };
  }

  const now = new Date();
  const backup: AutoBackup = {
    id: crypto.randomUUID(),
    date: now.toISOString().slice(0, 10),
    timestamp: now.toISOString(),
    growCount: data.grows.length,
    logCount: verification.logCount,
    data,
    manual: true,
  };

  // Duplikat für heute entfernen (manuelles Backup ersetzt heutiges Auto-Backup)
  const filtered = getAutoBackups().filter((b) => b.date !== backup.date);
  const updated = [backup, ...filtered].slice(0, MAX_BACKUPS);
  try {
    localStorage.setItem(BACKUP_KEY, JSON.stringify(updated));
    addBackupLog('manual', 'success', `${t('Manuelles Backup erstellt & verifiziert', 'Manual backup created & verified')}: ${verification.growCount} Grows, ${verification.logCount} ${t('Einträge', 'entries')}.`);
    return { ok: true, backup, errors: [] };
  } catch (e) {
    console.error('Failed to save manual backup', e);
    addBackupLog('manual', 'error', t('Manuelles Backup fehlgeschlagen: Speicherfehler.', 'Manual backup failed: storage error.'));
    return { ok: false, errors: [t('Speicherfehler — Backup konnte nicht gespeichert werden.', 'Storage error — backup could not be saved.')] };
  }
}

export function deleteAutoBackup(id: string): void {
  const backups = getAutoBackups();
  const target = backups.find((b) => b.id === id);
  const updated = backups.filter((b) => b.id !== id);
  try {
    localStorage.setItem(BACKUP_KEY, JSON.stringify(updated));
    if (target) {
      addBackupLog('delete', 'warning', t(`Backup vom ${target.date} gelöscht.`, `Backup from ${target.date} deleted.`));
    }
  } catch (e) {
    console.error('Failed to delete auto-backup', e);
  }
}

/** Bereinigt Daten eines Backups/Imports (ältere Backups haben neue Felder nicht). */
export function normalizeAppData(d: AppData): AppData {
  return {
    version: CURRENT_VERSION,
    grows: d.grows.map((g: Partial<Grow>) => normalizeGrow(g)),
    batches: normalizeBatches(d.batches),
    fertPrices: normalizeFertPrices(d.fertPrices),
    settings: normalizeSettings(d.settings),
  };
}

export function restoreAutoBackup(backup: AutoBackup): AppData {
  const verification = verifyBackup(backup.data);
  if (!verification.ok) {
    addBackupLog('restore', 'error', `${t('Wiederherstellung fehlgeschlagen', 'Restore failed')}: ${verification.errors.join('; ')}`);
  }
  const normalized = normalizeAppData(backup.data);
  saveData(normalized);
  if (verification.ok) {
    addBackupLog('restore', 'success', `${t(`Backup vom ${backup.date} wiederhergestellt & verifiziert`, `Backup from ${backup.date} restored & verified`)}: ${verification.growCount} Grows, ${verification.logCount} ${t('Einträge', 'entries')}.`);
  }
  return normalized;
}

// ---- Export / Import als Datei ----

export function exportDataAsJSON(data: AppData): void {
  const verification = verifyBackup(data);
  if (!verification.ok) {
    addBackupLog('export', 'error', `${t('Export fehlgeschlagen', 'Export failed')}: ${verification.errors.join('; ')}`);
    return;
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `growhub-backup-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  addBackupLog('export', 'success', `${t('Export als Datei', 'Export as file')}: ${verification.growCount} Grows, ${verification.logCount} ${t('Einträge', 'entries')}. ${t('Verifiziert.', 'Verified.')}`);
}

export function importDataFromJSON(file: File): Promise<AppData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as AppData;
        const verification = verifyBackup(parsed);
        if (!verification.ok) {
          addBackupLog('import', 'error', `${t('Import fehlgeschlagen', 'Import failed')}: ${verification.errors.join('; ')}`);
          throw new Error(`${t('Ungültige Backup-Datei', 'Invalid backup file')}: ${verification.errors.join('; ')}`);
        }
        const normalized: AppData = {
          version: CURRENT_VERSION,
          grows: parsed.grows.map((g: Partial<Grow>) => normalizeGrow(g)),
          batches: normalizeBatches(parsed.batches),
          fertPrices: normalizeFertPrices(parsed.fertPrices),
          settings: normalizeSettings(parsed.settings),
        };
        addBackupLog('import', 'success', `${t('Import aus Datei', 'Import from file')}: ${verification.growCount} Grows, ${verification.logCount} ${t('Einträge', 'entries')}. ${t('Verifiziert.', 'Verified.')}`);
        resolve(normalized);
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

export const GROW_COLOR_PRESETS = [
  '#10b981', // emerald
  '#84cc16', // lime
  '#22d3ee', // cyan
  '#f59e0b', // amber
  '#fb7185', // rose
  '#a78bfa', // violet
  '#60a5fa', // blue
];

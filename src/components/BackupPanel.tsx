import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Database,
  Download,
  Upload,
  Clock,
  Trash2,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Info,
  CalendarDays,
  Archive,
  ShieldCheck,
  PlusCircle,
  FileText,
  X,
  FolderOpen,
  FolderCheck,
  HardDrive,
  MapPin,
  FileJson,
} from 'lucide-react';
import type { AppData } from '@/types';
import {
  exportDataAsJSON,
  importDataFromJSON,
  getAutoBackups,
  deleteAutoBackup,
  restoreAutoBackup,
  createManualBackup,
  getBackupLog,
  clearBackupLog,
  addBackupLog,
  verifyBackup,
  type AutoBackup,
  type BackupLogEntry,
  type BackupLogKind,
  type BackupLogStatus,
} from '@/lib/storage';
import {
  supportsFileSystemAccess,
  pickBackupDirectory,
  getStoredDirectory,
  storeDirectory,
  clearStoredDirectory,
  isPermanent,
  getOnceCount,
  incrementOnceCount,
  resetOnceCount,
  getPermanentThreshold,
  verifyPermission,
  writeToBackupDir,
  listBackupFiles,
} from '@/lib/backupDir';
import BackupExportCard from '@/components/BackupExportCard';
import BackupLocationInfo from '@/components/BackupLocationInfo';
import RestorePreviewDialog from '@/components/RestorePreviewDialog';
import { saveBackupAs, exportCapability } from '@/lib/backupExport';
import { t, locale } from '@/lib/i18n';

interface BackupPanelProps {
  data: AppData;
  onRestore: (data: AppData, kind?: 'import' | 'restore') => void;
}

export default function BackupPanel({ data, onRestore }: BackupPanelProps) {
  const [backups, setBackups] = useState<AutoBackup[]>([]);
  const [logEntries, setLogEntries] = useState<BackupLogEntry[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [confirmRestore, setConfirmRestore] = useState<AutoBackup | null>(null);
  const [confirmImport, setConfirmImport] = useState<AppData | null>(null);
  const [manualBackupStatus, setManualBackupStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [dirPermanent, setDirPermanent] = useState(false);
  const [onceCount, setOnceCount] = useState(0);
  const [dirFiles, setDirFiles] = useState<{ name: string; size: number; lastModified: number }[]>([]);
  const [dirStatus, setDirStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [pendingDirHandle, setPendingDirHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [autoPermanent, setAutoPermanent] = useState(false);

  const refresh = () => {
    setBackups(getAutoBackups());
    setLogEntries(getBackupLog());
  };

  useEffect(() => {
    refresh();
    // Tick jede Minute für Countdown
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Gespeicherten Backup-Speicherort laden
  useEffect(() => {
    if (!supportsFileSystemAccess()) return;
    getStoredDirectory().then((handle) => {
      if (handle) {
        setDirHandle(handle);
        setDirPermanent(isPermanent());
        setOnceCount(getOnceCount());
        refreshDirFiles(handle);
      }
    });
  }, []);

  const refreshDirFiles = async (handle: FileSystemDirectoryHandle) => {
    try {
      const ok = await verifyPermission(handle);
      if (!ok) return;
      const files = await listBackupFiles(handle);
      setDirFiles(files);
    } catch {
      // ignore
    }
  };

  // Countdown bis zum nächsten Auto-Backup (Mitternacht)
  const nextBackupInfo = useMemo(() => {
    const nextMidnight = new Date();
    nextMidnight.setHours(24, 0, 0, 0);
    const diffMs = nextMidnight.getTime() - now;
    const diffH = Math.floor(diffMs / 3600000);
    const diffM = Math.floor((diffMs % 3600000) / 60000);
    return { hours: diffH, minutes: diffM, nextMidnight };
  }, [now]);

  const lastBackupDate = backups[0]?.timestamp;

  const handleExport = async () => {
    setImportError(null);
    if (exportCapability() === 'tauri') {
      // Desktop-App: Datei über den Speichern-Dialog ablegen und den Pfad anzeigen
      const r = await saveBackupAs(data);
      if (r.ok) {
        setImportSuccess(t(`Backup-Datei gespeichert unter: ${r.location ?? r.filename} (verifiziert).`, `Backup file saved to: ${r.location ?? r.filename} (verified).`));
      } else if (!r.cancelled) {
        setImportError(r.message);
      }
      setTimeout(() => setImportSuccess(null), 8000);
      refresh();
      return;
    }
    exportDataAsJSON(data);
    const fname = `growhub-backup-${new Date().toISOString().slice(0, 10)}.json`;
    setImportSuccess(
      t(
        `Backup-Datei „${fname}“ wurde verifiziert und heruntergeladen – gespeichert im Download-Ordner deines Systems/Browsers.`,
        `Backup file “${fname}” was verified and downloaded – saved in the download folder of your system/browser.`
      )
    );
    setTimeout(() => setImportSuccess(null), 8000);
    refresh();
  };

  const handleImportClick = () => {
    setImportError(null);
    setImportSuccess(null);
    fileInputRef.current?.click();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const imported = await importDataFromJSON(file);
      setConfirmImport(imported);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : t('Backup-Datei konnte nicht gelesen werden.', 'Backup file could not be read.'));
      refresh();
    }
  };

  const confirmImportRestore = () => {
    if (!confirmImport) return;
    onRestore(confirmImport, 'import');
    setConfirmImport(null);
    setImportSuccess(t('Daten erfolgreich aus Backup-Datei wiederhergestellt und verifiziert.', 'Data successfully restored from backup file and verified.'));
    setTimeout(() => setImportSuccess(null), 4000);
    refresh();
  };

  const handleManualBackup = () => {
    const result = createManualBackup(data);
    if (result.ok && result.backup) {
      setManualBackupStatus({ ok: true, message: `${t('Manuelles Backup erstellt & verifiziert', 'Manual backup created & verified')} — ${result.backup.growCount} Grows, ${result.backup.logCount} ${t('Einträge', 'entries')}.` });
    } else {
      setManualBackupStatus({ ok: false, message: result.errors.join('; ') });
    }
    setTimeout(() => setManualBackupStatus(null), 5000);
    refresh();
  };

  const handleRestore = (backup: AutoBackup) => {
    setConfirmRestore(backup);
  };

  const confirmRestoreBackup = () => {
    if (!confirmRestore) return;
    const restored = restoreAutoBackup(confirmRestore);
    onRestore(restored, 'restore');
    setConfirmRestore(null);
    setImportSuccess(t(`Auto-Backup vom ${formatBackupDate(confirmRestore.date)} wiederhergestellt und verifiziert.`, `Auto backup from ${formatBackupDate(confirmRestore.date)} restored and verified.`));
    setTimeout(() => setImportSuccess(null), 4000);
    refresh();
  };

  const handleDelete = (id: string) => {
    deleteAutoBackup(id);
    refresh();
  };

  const handleClearLog = () => {
    clearBackupLog();
    refresh();
  };

  // ---- Backup-Speicherort Handler ----

  const handlePickDir = async () => {
    if (!supportsFileSystemAccess()) return;
    const handle = await pickBackupDirectory();
    if (!handle) return;
    setPendingDirHandle(handle);
  };

  const confirmDirOnce = async () => {
    if (!pendingDirHandle) return;
    await storeDirectory(pendingDirHandle, false);
    setDirHandle(pendingDirHandle);
    setDirPermanent(false);
    const count = incrementOnceCount();
    setOnceCount(count);
    setPendingDirHandle(null);
    setDirStatus({ ok: true, message: t(`Speicherort einmalig gesetzt: „${pendingDirHandle.name}".`, `Location set once: "${pendingDirHandle.name}".`) });
    addBackupLog('manual', 'success', t(`Backup-Speicherort gewählt: ${pendingDirHandle.name} (einmalig).`, `Backup location selected: ${pendingDirHandle.name} (once).`));
    refreshDirFiles(pendingDirHandle);
    setTimeout(() => setDirStatus(null), 4000);
  };

  const confirmDirPermanent = async () => {
    if (!pendingDirHandle) return;
    await storeDirectory(pendingDirHandle, true);
    setDirHandle(pendingDirHandle);
    setDirPermanent(true);
    resetOnceCount();
    setOnceCount(0);
    setPendingDirHandle(null);
    setDirStatus({ ok: true, message: t(`Speicherort dauerhaft gesetzt: „${pendingDirHandle.name}".`, `Location set permanently: "${pendingDirHandle.name}".`) });
    addBackupLog('manual', 'success', t(`Backup-Speicherort dauerhaft gewählt: ${pendingDirHandle.name}.`, `Backup location selected permanently: ${pendingDirHandle.name}.`));
    refreshDirFiles(pendingDirHandle);
    setTimeout(() => setDirStatus(null), 4000);
  };

  const handleClearDir = async () => {
    await clearStoredDirectory();
    setDirHandle(null);
    setDirPermanent(false);
    setOnceCount(0);
    setDirFiles([]);
    setDirStatus({ ok: true, message: t('Speicherort entfernt. Backups werden wieder als Download gespeichert.', 'Location removed. Backups are saved as downloads again.') });
    addBackupLog('delete', 'warning', t('Backup-Speicherort entfernt.', 'Backup location removed.'));
    setTimeout(() => setDirStatus(null), 4000);
  };

  const handleSaveToDir = async () => {
    if (!dirHandle) return;
    try {
      const ok = await verifyPermission(dirHandle);
      if (!ok) {
        setDirStatus({ ok: false, message: t('Keine Schreibberechtigung für den Speicherort.', 'No write permission for the location.') });
        return;
      }
      const verification = verifyBackup(data);
      if (!verification.ok) {
        setDirStatus({ ok: false, message: `${t('Verifizierung fehlgeschlagen', 'Verification failed')}: ${verification.errors.join('; ')}` });
        addBackupLog('export', 'error', `${t('Speichern fehlgeschlagen', 'Saving failed')}: ${verification.errors.join('; ')}`);
        return;
      }
      const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `growhub-backup-${stamp}.json`;
      await writeToBackupDir(dirHandle, filename, JSON.stringify(data, null, 2));
      setDirStatus({ ok: true, message: t(`Backup in „${dirHandle.name}/${filename}" gespeichert & verifiziert.`, `Backup saved to "${dirHandle.name}/${filename}" & verified.`) });
      addBackupLog('export', 'success', t(`Backup in Speicherort gespeichert: ${filename} (${verification.growCount} Grows, ${verification.logCount} Einträge). Verifiziert.`, `Backup saved to location: ${filename} (${verification.growCount} grows, ${verification.logCount} entries). Verified.`));
      refreshDirFiles(dirHandle);
      setTimeout(() => setDirStatus(null), 4000);
    } catch (e) {
      setDirStatus({ ok: false, message: e instanceof Error ? e.message : t('Fehler beim Speichern.', 'Error while saving.') });
      addBackupLog('export', 'error', t('Speichern in Speicherort fehlgeschlagen.', 'Saving to location failed.'));
    }
  };

  const handleMakePermanent = async () => {
    if (!dirHandle) return;
    await storeDirectory(dirHandle, true);
    setDirPermanent(true);
    resetOnceCount();
    setOnceCount(0);
    setDirStatus({ ok: true, message: t('Speicherort ist nun dauerhaft gespeichert.', 'Location is now saved permanently.') });
    addBackupLog('manual', 'success', t('Backup-Speicherort auf dauerhaft umgestellt.', 'Backup location switched to permanent.'));
    setTimeout(() => setDirStatus(null), 4000);
  };

  const totalLogs = data.grows.reduce((sum, g) => sum + (g.logs?.length ?? 0), 0);
  const verification = useMemo(() => verifyBackup(data), [data]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Intro */}
      <div className="rounded-2xl border border-ink-800 bg-ink-900/60 p-5">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 border border-primary-500/30 flex items-center justify-center shrink-0">
            <Database size={24} className="text-primary-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white tracking-tight">{t('Backup & Wiederherstellung', 'Backup & restore')}</h2>
            <p className="text-sm text-ink-400 mt-1 leading-relaxed">
              {t(
                'Exportiere alle deine Daten als Datei für den Transfer auf einen anderen Rechner. Automatische Tages-Backups werden lokal gespeichert und verifiziert. Jede Aktion wird im Backup-Log unten protokolliert.',
                'Export all your data as a file to transfer it to another computer. Automatic daily backups are stored locally and verified. Every action is recorded in the backup log below.'
              )}
            </p>
          </div>
          {verification.ok && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-accent-500/10 border border-accent-500/20 text-xs font-medium text-accent-300 shrink-0">
              <ShieldCheck size={13} />
              <span className="hidden sm:inline">{t('Daten verifiziert', 'Data verified')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Status-Karten */}
      <div className="grid sm:grid-cols-3 gap-3">
        <StatusCard
          icon={<Archive size={16} />}
          label={t('Aktuelle Grows', 'Current grows')}
          value={String(data.grows.length)}
          tone="primary"
        />
        <StatusCard
          icon={<CalendarDays size={16} />}
          label={t('Tagebucheinträge', 'Journal entries')}
          value={String(totalLogs)}
          tone="accent"
        />
        <StatusCard
          icon={<Clock size={16} />}
          label="Auto-Backups"
          value={String(backups.length)}
          tone="warning"
        />
      </div>

      {/* Nächstes Auto-Backup Countdown + manueller Backup-Button */}
      <div className="rounded-2xl border border-ink-800 bg-ink-900/60 p-5">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-warning-500/10 border border-warning-500/20 flex items-center justify-center shrink-0">
              <Clock size={18} className="text-warning-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">{t('Nächstes Auto-Backup', 'Next auto backup')}</h3>
              <p className="text-xs text-ink-500 mt-0.5">
                {t('Tägliche Sicherung um Mitternacht', 'Daily backup at midnight')}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-warning-300 tabular-nums">
              {nextBackupInfo.hours}h {nextBackupInfo.minutes}m
            </div>
            <div className="text-[10px] uppercase tracking-wide text-ink-500 mt-0.5">
              {t('bis Mitternacht', 'until midnight')}
            </div>
          </div>
        </div>

        {lastBackupDate && (
          <div className="text-xs text-ink-500 mb-4 flex items-center gap-1.5">
            <CheckCircle2 size={12} className="text-accent-400" />
            {t('Letztes Backup', 'Last backup')}: {formatBackupDate(lastBackupDate.slice(0, 10))} {t('um', 'at')}{' '}
            {formatBackupTime(lastBackupDate)}
            {backups[0]?.manual && <span className="text-primary-400 ml-1">({t('manuell', 'manual')})</span>}
          </div>
        )}

        <button
          onClick={handleManualBackup}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-ink-950 bg-primary-500 hover:bg-primary-400 transition-colors shadow-glow"
        >
          <PlusCircle size={16} />
          {t('Manuelles Backup jetzt erstellen', 'Create manual backup now')}
        </button>

        {manualBackupStatus && (
          <div
            className={`mt-3 flex items-start gap-2 rounded-xl px-3.5 py-3 animate-fade-in ${
              manualBackupStatus.ok
                ? 'bg-accent-500/10 border border-accent-500/30'
                : 'bg-error-500/10 border border-error-500/30'
            }`}
          >
            {manualBackupStatus.ok ? (
              <CheckCircle2 size={15} className="text-accent-400 mt-0.5 shrink-0" />
            ) : (
              <AlertTriangle size={15} className="text-error-400 mt-0.5 shrink-0" />
            )}
            <p className={`text-sm ${manualBackupStatus.ok ? 'text-accent-300' : 'text-error-300'}`}>
              {manualBackupStatus.message}
            </p>
          </div>
        )}
      </div>

      {/* Aktionen: Export / Import */}
      <div className="rounded-2xl border border-ink-800 bg-ink-900/60 p-5">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Download size={16} className="text-primary-400" />
          {t('Manuelle Sicherung als Datei', 'Manual backup as file')}
        </h3>
        <p className="text-xs text-ink-500 mb-4 leading-relaxed">
          {t(
            'Exportiere eine JSON-Datei mit allen Grows, Meilensteinen, Tagebucheinträgen und Trocknungsdaten. Lade diese Datei auf einem anderen Rechner hier wieder hoch, um alles exakt wiederherzustellen. Jede Datei wird vor dem Import verifiziert.',
            'Export a JSON file with all grows, milestones, journal entries and drying data. Upload this file here on another computer to restore everything exactly. Every file is verified before import.'
          )}
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-ink-200 bg-ink-850 hover:bg-ink-800 border border-ink-700/60 transition-colors"
          >
            <Download size={16} />
            {t('Alle Daten als Datei exportieren', 'Export all data as file')}
          </button>
          <button
            onClick={handleImportClick}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-ink-200 bg-ink-850 hover:bg-ink-800 border border-ink-700/60 transition-colors"
          >
            <Upload size={16} />
            {t('Backup-Datei einlesen', 'Load backup file')}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImportFile}
            className="hidden"
          />
        </div>

        {importError && (
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-error-500/10 border border-error-500/30 px-3.5 py-3 animate-fade-in">
            <AlertTriangle size={15} className="text-error-400 mt-0.5 shrink-0" />
            <p className="text-sm text-error-300">{importError}</p>
          </div>
        )}
        {importSuccess && (
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-accent-500/10 border border-accent-500/30 px-3.5 py-3 animate-fade-in">
            <CheckCircle2 size={15} className="text-accent-400 mt-0.5 shrink-0" />
            <p className="text-sm text-accent-300">{importSuccess}</p>
          </div>
        )}
      </div>

      {/* Backup speichern unter … */}
      <BackupExportCard data={data} onDone={refresh} />

      {/* Wo werden Backups gespeichert? */}
      <BackupLocationInfo dirName={dirHandle?.name} />

      {/* Backup-Speicherort */}
      <div className="rounded-2xl border border-ink-800 bg-ink-900/60 p-5">
        <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
          <FolderOpen size={16} className="text-primary-400" />
          {t('Backup-Speicherort', 'Backup location')}
        </h3>
        <p className="text-xs text-ink-500 mb-4 leading-relaxed">
          {t(
            'Wähle einen Ordner auf deinem Rechner, in den Backups automatisch gespeichert werden. So kannst du die Datei an einem bekannten Ort sichern, z. B. auf einem USB-Stick oder in einem Cloud-Ordner. Du kannst einmalig speichern oder den Speicherort dauerhaft hinterlegen.',
            'Choose a folder on your computer where backups are saved automatically. This lets you keep the file in a known place, e.g. on a USB stick or in a cloud folder. You can save once or store the location permanently.'
          )}
        </p>

        {!supportsFileSystemAccess() ? (
          <div className="rounded-xl bg-ink-850/60 border border-ink-800 px-4 py-3.5 flex items-start gap-2.5">
            <Info size={15} className="text-ink-500 mt-0.5 shrink-0" />
            <p className="text-sm text-ink-400 leading-relaxed">
              {t(
                'Dein Browser unterstützt die direkte Ordner-Auswahl nicht. Verwende stattdessen „Alle Daten als Datei exportieren“ oben, um die Backup-Datei manuell in deinen Wunschordner zu speichern.',
                'Your browser does not support direct folder selection. Use “Export all data as file” above instead to save the backup file manually to your preferred folder.'
              )}
            </p>
          </div>
        ) : !dirHandle ? (
          <button
            onClick={handlePickDir}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-ink-200 bg-ink-850 hover:bg-ink-800 border border-ink-700/60 transition-colors"
          >
            <FolderOpen size={16} />
            {t('Speicherort wählen', 'Choose location')}
          </button>
        ) : (
          <div className="space-y-4">
            {/* Aktueller Speicherort */}
            <div className="rounded-xl bg-ink-850/60 border border-ink-800 p-4">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary-500/10 border border-primary-500/20 flex items-center justify-center shrink-0">
                  <FolderCheck size={16} className="text-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-ink-100 truncate">
                      {dirHandle.name}
                    </span>
                    {dirPermanent ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-accent-400 bg-accent-500/10 border border-accent-500/20 px-1.5 py-0.5 rounded">
                        <HardDrive size={10} /> {t('dauerhaft', 'permanent')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-warning-400 bg-warning-500/10 border border-warning-500/20 px-1.5 py-0.5 rounded">
                        {t('einmalig', 'once')} ({onceCount}/{getPermanentThreshold()})
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-ink-500 mt-1 flex items-center gap-1.5">
                    <MapPin size={11} />
                    {t('Ordner auf diesem Rechner', 'Folder on this computer')}
                    {dirFiles.length > 0 && (
                      <span className="ml-1">· {dirFiles.length} {t('Backup-Datei(en)', 'backup file(s)')}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleClearDir}
                  className="h-7 w-7 rounded-lg flex items-center justify-center text-ink-500 hover:text-error-400 hover:bg-error-500/10 transition-colors shrink-0"
                  title={t('Speicherort entfernen', 'Remove location')}
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Aktionen für bestehenden Speicherort */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleSaveToDir}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-ink-950 bg-primary-500 hover:bg-primary-400 transition-colors shadow-glow"
              >
                <FileJson size={16} />
                {t('Backup in Speicherort speichern', 'Save backup to location')}
              </button>
              {!dirPermanent && (
                <button
                  onClick={handleMakePermanent}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-accent-300 bg-accent-500/10 hover:bg-accent-500/20 border border-accent-500/30 transition-colors"
                >
                  <HardDrive size={16} />
                  {t('Dauerhaft speichern', 'Save permanently')}
                </button>
              )}
            </div>

            {/* Hinweis bei einmaligem Speichern */}
            {!dirPermanent && onceCount < getPermanentThreshold() && onceCount > 0 && (
              <div className="rounded-xl bg-warning-500/5 border border-warning-500/20 px-3.5 py-3 flex items-start gap-2.5">
                <Info size={14} className="text-warning-400 mt-0.5 shrink-0" />
                <p className="text-xs text-warning-300/80 leading-relaxed">
                  {t(
                    `Noch ${getPermanentThreshold() - onceCount} weitere einmalige Speicherung(en), dann wird der Speicherort automatisch dauerhaft übernommen. Du kannst ihn auch jetzt schon dauerhaft speichern.`,
                    `${getPermanentThreshold() - onceCount} more one-time save(s), then the location will be stored permanently automatically. You can also save it permanently right now.`
                  )}
                </p>
              </div>
            )}

            {/* Dateien im Speicherort */}
            {dirFiles.length > 0 && (
              <div className="rounded-xl border border-ink-800 bg-ink-900/40 overflow-hidden">
                <div className="px-3.5 py-2 text-xs font-semibold uppercase tracking-wide text-ink-500 border-b border-ink-800 flex items-center gap-1.5">
                  <FileJson size={12} />
                  {t('Backups in diesem Ordner', 'Backups in this folder')}
                </div>
                <div className="max-h-48 overflow-y-auto scrollbar-thin">
                  {dirFiles.map((f) => (
                    <div
                      key={f.name}
                      className="flex items-center justify-between gap-2 px-3.5 py-2 border-b border-ink-850 last:border-0 text-xs"
                    >
                      <span className="text-ink-200 truncate font-mono">{f.name}</span>
                      <span className="text-ink-500 shrink-0 tabular-nums">
                        {(f.size / 1024).toFixed(1)} KB · {formatBackupTime(new Date(f.lastModified).toISOString())}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {dirStatus && (
          <div
            className={`mt-4 flex items-start gap-2 rounded-xl px-3.5 py-3 animate-fade-in ${
              dirStatus.ok
                ? 'bg-accent-500/10 border border-accent-500/30'
                : 'bg-error-500/10 border border-error-500/30'
            }`}
          >
            {dirStatus.ok ? (
              <CheckCircle2 size={15} className="text-accent-400 mt-0.5 shrink-0" />
            ) : (
              <AlertTriangle size={15} className="text-error-400 mt-0.5 shrink-0" />
            )}
            <p className={`text-sm ${dirStatus.ok ? 'text-accent-300' : 'text-error-300'}`}>
              {dirStatus.message}
            </p>
          </div>
        )}
      </div>

      {/* Speicherort-Wahl Bestätigungsdialog (einmal vs. dauerhaft) */}
      {pendingDirHandle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm" onClick={() => setPendingDirHandle(null)} />
          <div className="relative w-full max-w-md rounded-2xl border border-ink-700 bg-ink-900 p-6 shadow-2xl animate-slide-up">
            <div className="flex items-start gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center shrink-0">
                <FolderOpen size={20} className="text-primary-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-white">{t('Speicherort bestätigen', 'Confirm location')}</h3>
                <p className="text-sm text-ink-400 mt-1.5 leading-relaxed">
                  {t(
                    `Ordner „${pendingDirHandle.name}" gewählt. Wie soll der Speicherort gespeichert werden?`,
                    `Folder "${pendingDirHandle.name}" selected. How should the location be saved?`
                  )}
                </p>
              </div>
            </div>
            <div className="space-y-2.5 mb-4">
              <button
                onClick={confirmDirOnce}
                className="w-full flex items-start gap-3 rounded-xl bg-ink-850 hover:bg-ink-800 border border-ink-700/60 px-4 py-3.5 text-left transition-colors"
              >
                <Clock size={16} className="text-warning-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-ink-100">{t('Einmalig speichern', 'Save once')}</div>
                  <div className="text-xs text-ink-500 mt-0.5">
                    {t(
                      `Beim nächsten Mal erneut fragen. Nach ${getPermanentThreshold()} einmaligen Speicherungen automatisch dauerhaft übernehmen.`,
                      `Ask again next time. Automatically make it permanent after ${getPermanentThreshold()} one-time saves.`
                    )}
                  </div>
                </div>
              </button>
              <button
                onClick={confirmDirPermanent}
                className="w-full flex items-start gap-3 rounded-xl bg-accent-500/5 hover:bg-accent-500/10 border border-accent-500/30 px-4 py-3.5 text-left transition-colors"
              >
                <HardDrive size={16} className="text-accent-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-accent-300">{t('Dauerhaft speichern', 'Save permanently')}</div>
                  <div className="text-xs text-ink-500 mt-0.5">
                    {t('Speicherort wird gespeichert und für alle zukünftigen Backups verwendet.', 'The location is saved and used for all future backups.')}
                  </div>
                </div>
              </button>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setPendingDirHandle(null)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-ink-300 bg-ink-850 hover:bg-ink-800 border border-ink-700/60 transition-colors"
              >
                {t('Abbrechen', 'Cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Backups Liste */}
      <div className="rounded-2xl border border-ink-800 bg-ink-900/60 p-5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Clock size={16} className="text-warning-400" />
            {t('Gespeicherte Backups', 'Saved backups')}
          </h3>
          <button
            onClick={refresh}
            className="text-xs text-ink-500 hover:text-ink-200 transition-colors"
          >
            {t('aktualisieren', 'refresh')}
          </button>
        </div>
        <p className="text-xs text-ink-500 mb-4 leading-relaxed">
          {t(
            'Automatische Tages-Backups und manuelle Backups. Bis zu 14 Tage werden behalten. Wähle einen Eintrag zum Wiederherstellen aus.',
            'Automatic daily backups and manual backups. Up to 14 days are kept. Select an entry to restore.'
          )}
        </p>

        {backups.length === 0 ? (
          <div className="rounded-xl border border-dashed border-ink-700/60 bg-ink-900/40 px-4 py-8 text-center">
            <Info size={20} className="text-ink-600 mx-auto mb-2" />
            <p className="text-sm text-ink-500">
              {t(
                'Noch keine Backups vorhanden. Erstelle ein manuelles Backup oben oder warte bis Mitternacht für das erste Auto-Backup.',
                'No backups yet. Create a manual backup above or wait until midnight for the first auto backup.'
              )}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {backups.map((b) => (
              <div
                key={b.id}
                className="flex items-center gap-3 rounded-xl border border-ink-800 bg-ink-850/60 p-3.5 hover:border-ink-700 transition-colors"
              >
                <div
                  className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 border ${
                    b.manual
                      ? 'bg-primary-500/10 border-primary-500/20'
                      : 'bg-warning-500/10 border-warning-500/20'
                  }`}
                >
                  {b.manual ? (
                    <PlusCircle size={15} className="text-primary-400" />
                  ) : (
                    <Clock size={15} className="text-warning-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-ink-100">
                    {formatBackupDate(b.date)}
                    {b.manual && !b.label && (
                      <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-primary-400">
                        {t('manuell', 'manual')}
                      </span>
                    )}
                    {b.label && (
                      <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-warning-400" data-testid="backup-safety-label">
                        {{ import: t('vor Import', 'before import'), restore: t('vor Wiederherstellung', 'before restore'), reset: t('vor Zurücksetzen', 'before reset') }[b.label]}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-ink-500 mt-0.5">
                    {b.growCount} Grows · {b.logCount} {t('Einträge', 'entries')} · {formatBackupTime(b.timestamp)}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleRestore(b)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-primary-300 bg-primary-500/10 hover:bg-primary-500/20 border border-primary-500/20 transition-colors"
                  >
                    <RotateCcw size={13} />
                    <span className="hidden sm:inline">{t('Wiederherstellen', 'Restore')}</span>
                  </button>
                  <button
                    onClick={() => handleDelete(b.id)}
                    className="h-7 w-7 rounded-lg flex items-center justify-center text-ink-500 hover:text-error-400 hover:bg-error-500/10 transition-colors"
                    title={t('Backup löschen', 'Delete backup')}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Backup-Log */}
      <div className="rounded-2xl border border-ink-800 bg-ink-900/60 p-5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <FileText size={16} className="text-ink-400" />
            {t('Backup-Verlauf', 'Backup history')}
          </h3>
          {logEntries.length > 0 && (
            <button
              onClick={handleClearLog}
              className="flex items-center gap-1 text-xs text-ink-500 hover:text-error-400 transition-colors"
            >
              <X size={12} />
              {t('Log leeren', 'Clear log')}
            </button>
          )}
        </div>
        <p className="text-xs text-ink-500 mb-4 leading-relaxed">
          {t(
            'Jede Backup-Aktion (automatisch, manuell, Export, Import, Wiederherstellung) wird hier protokolliert und mit Verifizierungs-Status markiert.',
            'Every backup action (automatic, manual, export, import, restore) is logged here and marked with its verification status.'
          )}
        </p>

        {backups.length > 0 && (
          <div className="mb-5 rounded-xl border border-warning-500/25 bg-warning-500/5 p-4" data-testid="quick-rollback">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <RotateCcw size={15} className="text-warning-400" />
              {t('Schnell zurückspringen', 'Quick rollback')}
              <span className="text-[11px] font-normal text-ink-500">
                {t('(nur die letzten 2 Backups)', '(last 2 backups only)')}
              </span>
            </div>
            <p className="text-xs text-ink-500 mt-1 mb-3">
              {t(
                'Springe auf den Stand eines der zuletzt erstellten Backups zurück. Vorher siehst du, was dabei verloren geht, und musst bestätigen.',
                'Go back to the state of one of the most recent backups. You will see what would be lost first and have to confirm.'
              )}
            </p>
            <div className="space-y-2">
              {backups.slice(0, 2).map((b, i) => (
                <div key={b.id} className="flex items-center gap-3 rounded-lg border border-ink-800 bg-ink-850/60 px-3 py-2.5" data-testid="quick-rollback-row">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ink-100">
                      {i === 0 ? t('Zuletzt erstellt', 'Most recent') : t('Davor', 'Before that')} · {formatBackupDate(b.date)} {formatBackupTime(b.timestamp)}
                      {b.label && (
                        <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-warning-400">
                          {{ import: t('vor Import', 'before import'), restore: t('vor Wiederherstellung', 'before restore'), reset: t('vor Zurücksetzen', 'before reset') }[b.label]}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-ink-500">
                      {b.growCount} Grows · {b.logCount} {t('Einträge', 'entries')}
                    </div>
                  </div>
                  <button
                    data-testid={`quick-rollback-${i}`}
                    onClick={() => handleRestore(b)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-warning-200 bg-warning-500/10 hover:bg-warning-500/20 border border-warning-500/30 transition-colors"
                  >
                    <RotateCcw size={13} />
                    {t('Zurückspringen', 'Go back')}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {logEntries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-ink-700/60 bg-ink-900/40 px-4 py-6 text-center">
            <FileText size={18} className="text-ink-600 mx-auto mb-2" />
            <p className="text-sm text-ink-500">
              {t('Noch keine Aktivität. Backup-Aktionen werden hier angezeigt.', 'No activity yet. Backup actions will appear here.')}
            </p>
          </div>
        ) : (
          <div className="max-h-72 overflow-y-auto scrollbar-thin space-y-1.5 pr-1">
            {logEntries.map((entry) => (
              <LogRow key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>

      {/* Bestätigungs-Dialog: Auto-Backup wiederherstellen */}
      {confirmRestore && (
        <RestorePreviewDialog
          backup={confirmRestore}
          current={data}
          onConfirm={confirmRestoreBackup}
          onCancel={() => setConfirmRestore(null)}
        />
      )}

      {/* Bestätigungs-Dialog: Datei-Import */}
      {confirmImport && (
        <ConfirmRestoreDialog
          title={t('Backup-Datei einlesen?', 'Load backup file?')}
          message={t('Möchtest du die ausgewählte Backup-Datei einlesen? Alle aktuellen Daten werden damit überschrieben. Die Datei wurde verifiziert und ist gültig. Deine aktuellen Daten werden vorher automatisch als Backup gesichert.', 'Do you want to load the selected backup file? All current data will be overwritten. The file has been verified and is valid. Your current data is backed up automatically first.')}
          confirmLabel={t('Einlesen & überschreiben', 'Load & overwrite')}
          onConfirm={confirmImportRestore}
          onCancel={() => setConfirmImport(null)}
        />
      )}
    </div>
  );
}

function StatusCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: 'primary' | 'accent' | 'warning';
}) {
  const toneMap = {
    primary: 'text-primary-400 bg-primary-500/10 border-primary-500/20',
    accent: 'text-accent-400 bg-accent-500/10 border-accent-500/20',
    warning: 'text-warning-400 bg-warning-500/10 border-warning-500/20',
  } as const;
  return (
    <div className="rounded-2xl border border-ink-800 bg-ink-900/60 p-4 flex items-center gap-3.5">
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${toneMap[tone]}`}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-white tabular-nums leading-none">{value}</div>
        <div className="text-xs text-ink-500 mt-1">{label}</div>
      </div>
    </div>
  );
}

const kindLabel = (k: BackupLogKind): string =>
  ({
    auto: t('Auto-Backup', 'Auto backup'),
    manual: t('Manuelles Backup', 'Manual backup'),
    restore: t('Wiederherstellung', 'Restore'),
    export: 'Export',
    import: 'Import',
    delete: t('Löschung', 'Deletion'),
    verify: t('Verifizierung', 'Verification'),
  })[k];

const STATUS_ICON: Record<BackupLogStatus, { icon: React.ReactNode; color: string }> = {
  success: { icon: <CheckCircle2 size={13} />, color: 'text-accent-400' },
  warning: { icon: <AlertTriangle size={13} />, color: 'text-warning-400' },
  error: { icon: <AlertTriangle size={13} />, color: 'text-error-400' },
};

function LogRow({ entry }: { entry: BackupLogEntry }) {
  const st = STATUS_ICON[entry.status];
  return (
    <div className="flex items-start gap-2.5 rounded-lg bg-ink-850/40 border border-ink-800/60 px-3 py-2 text-xs">
      <span className={`${st.color} mt-0.5 shrink-0`}>{st.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-ink-200">{kindLabel(entry.kind)}</span>
          <span className="text-ink-600 tabular-nums">{formatBackupTime(entry.timestamp)}</span>
          <span className="text-ink-600">·</span>
          <span className="text-ink-600 tabular-nums">
            {new Date(entry.timestamp).toLocaleDateString(locale(), { day: '2-digit', month: 'short' })}
          </span>
        </div>
        <p className="text-ink-400 mt-0.5 leading-relaxed">{entry.message}</p>
      </div>
    </div>
  );
}

function ConfirmRestoreDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-2xl border border-ink-700 bg-ink-900 p-6 shadow-2xl animate-slide-up">
        <div className="flex items-start gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-warning-500/10 border border-warning-500/20 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} className="text-warning-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-white">{title}</h3>
            <p className="text-sm text-ink-400 mt-1.5 leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-ink-300 bg-ink-850 hover:bg-ink-800 border border-ink-700/60 transition-colors"
          >
            {t('Abbrechen', 'Cancel')}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-ink-950 bg-warning-500 hover:bg-warning-400 transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatBackupDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(locale(), {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatBackupTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(locale(), {
    hour: '2-digit',
    minute: '2-digit',
  });
}

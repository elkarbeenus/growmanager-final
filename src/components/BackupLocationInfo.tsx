import { HardDrive, FileJson, FolderOpen, MapPin } from 'lucide-react';
import { exportCapability } from '@/lib/backupExport';
import { t } from '@/lib/i18n';

/** Übersicht: Wo werden welche Backups gespeichert? */
export default function BackupLocationInfo({ dirName }: { dirName?: string | null }) {
  const desktop = exportCapability() === 'tauri';
  const isWindows = typeof navigator !== 'undefined' && /Windows/i.test(navigator.userAgent);

  const rows = [
    {
      icon: <HardDrive size={15} className="text-warning-400" />,
      title: t('Auto-Backups & manuelle Backups', 'Auto & manual backups'),
      text: desktop
        ? t(
            `Lokal im Datenspeicher der App auf diesem Rechner (keine sichtbare Datei). ${isWindows ? 'Unter Windows meist im Ordner %LOCALAPPDATA%\\com.growmanager.app' : 'Unter Linux meist im Ordner ~/.local/share/com.growmanager.app'}. Es werden bis zu 14 Tage behalten.`,
            `Stored locally in the app’s data storage on this computer (not a visible file). ${isWindows ? 'On Windows usually in %LOCALAPPDATA%\\com.growmanager.app' : 'On Linux usually in ~/.local/share/com.growmanager.app'}. Up to 14 days are kept.`
          )
        : t(
            'Lokal im Datenspeicher deines Browsers auf diesem Gerät (keine sichtbare Datei). Es werden bis zu 14 Tage behalten. Browserdaten zu löschen entfernt auch diese Backups – sichere wichtige Stände zusätzlich als Datei.',
            'Stored locally in your browser’s data storage on this device (not a visible file). Up to 14 days are kept. Clearing browser data also removes these backups – additionally save important states as a file.'
          ),
    },
    {
      icon: <FileJson size={15} className="text-primary-400" />,
      title: t('Export als Datei', 'Export as file'),
      text: desktop
        ? t(
            'Du wählst den Speicherort im Dialog selbst. Nach dem Speichern wird der vollständige Pfad angezeigt.',
            'You choose the location in the dialog. After saving, the full path is shown.'
          )
        : t(
            'Landet im Download-Ordner deines Systems/Browsers. Mit „Speichern unter …“ wählst du den Ordner selbst.',
            'Goes to the download folder of your system/browser. With “Save as …” you choose the folder yourself.'
          ),
    },
    {
      icon: <FolderOpen size={15} className="text-accent-400" />,
      title: t('Backup-Speicherort (Ordner)', 'Backup location (folder)'),
      text: dirName
        ? t(`Aktuell gewählter Ordner: „${dirName}“.`, `Currently selected folder: “${dirName}”.`)
        : t('Noch kein Ordner gewählt – siehe „Backup-Speicherort“ weiter unten.', 'No folder selected yet – see “Backup location” below.'),
    },
  ];

  return (
    <div className="rounded-2xl border border-ink-800 bg-ink-900/60 p-5" data-testid="backup-location-info">
      <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        <MapPin size={16} className="text-primary-400" />
        {t('Wo werden meine Backups gespeichert?', 'Where are my backups stored?')}
      </h3>
      <div className="space-y-3">
        {rows.map((r, i) => (
          <div key={i} className="flex gap-3 rounded-xl bg-ink-850/60 border border-ink-800 px-3.5 py-3">
            <div className="mt-0.5 shrink-0">{r.icon}</div>
            <div>
              <div className="text-sm font-semibold text-ink-100">{r.title}</div>
              <p className="text-xs text-ink-400 mt-0.5 leading-relaxed">{r.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

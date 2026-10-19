import { useState } from 'react';
import { Save, CheckCircle2, AlertTriangle, MapPin } from 'lucide-react';
import type { AppData } from '@/types';
import { saveBackupAs, exportCapability } from '@/lib/backupExport';
import { t } from '@/lib/i18n';

interface Props {
  data: AppData;
  onDone?: () => void;
}

/** "Speichern unter …": Backup-Datei an einem frei gewählten Ort speichern. */
export default function BackupExportCard({ data, onDone }: Props) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const cap = exportCapability();

  const handleSave = async () => {
    setBusy(true);
    const r = await saveBackupAs(data);
    setBusy(false);
    if (r.ok) {
      setStatus({
        ok: true,
        message: r.location
          ? t(`Backup gespeichert unter: ${r.location}`, `Backup saved to: ${r.location}`)
          : r.method === 'download'
            ? t(
                `Backup „${r.filename}“ wurde heruntergeladen – du findest die Datei im Download-Ordner deines Systems/Browsers.`,
                `Backup “${r.filename}” was downloaded – you will find the file in your system/browser download folder.`
              )
            : t(
                `Backup „${r.filename}“ wurde in dem Ordner gespeichert, den du im Dialog gewählt hast.`,
                `Backup “${r.filename}” was saved in the folder you chose in the dialog.`
              ),
      });
    } else if (!r.cancelled) {
      setStatus({ ok: false, message: r.message });
    } else {
      setStatus(null);
    }
    onDone?.();
  };

  return (
    <div className="rounded-2xl border border-ink-800 bg-ink-900/60 p-5" data-testid="backup-export-card">
      <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
        <Save size={16} className="text-primary-400" />
        {t('Backup speichern unter …', 'Save backup as …')}
      </h3>
      <p className="text-xs text-ink-500 mb-4 leading-relaxed">
        {t(
          'Wähle selbst, wo die Backup-Datei gespeichert wird. Nach dem Speichern wird der Speicherort hier angezeigt.',
          'Choose where the backup file is saved. After saving, the location is shown here.'
        )}
      </p>

      <button
        data-testid="save-as"
        onClick={handleSave}
        disabled={busy}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-ink-950 bg-primary-500 hover:bg-primary-400 disabled:opacity-60 transition-colors shadow-glow"
      >
        <Save size={16} />
        {cap === 'download'
          ? t('Backup herunterladen', 'Download backup')
          : t('Speichern unter … (Pfad wählen)', 'Save as … (choose path)')}
      </button>

      {cap === 'picker' && (
        <div className="mt-3 flex gap-2.5 text-xs text-ink-500 leading-relaxed">
          <MapPin size={14} className="shrink-0 mt-0.5" />
          <span>
            {t(
              'Aus Sicherheitsgründen zeigt der Browser nur den Dateinamen an – der Ordner ist der, den du im Dialog ausgewählt hast.',
              'For security reasons the browser only shows the file name – the folder is the one you selected in the dialog.'
            )}
          </span>
        </div>
      )}

      {status && (
        <div
          data-testid="export-status"
          className={`mt-4 flex items-start gap-2 rounded-xl px-3.5 py-3 animate-fade-in ${
            status.ok ? 'bg-accent-500/10 border border-accent-500/30' : 'bg-error-500/10 border border-error-500/30'
          }`}
        >
          {status.ok ? (
            <CheckCircle2 size={15} className="text-accent-400 mt-0.5 shrink-0" />
          ) : (
            <AlertTriangle size={15} className="text-error-400 mt-0.5 shrink-0" />
          )}
          <p className={`text-sm break-all ${status.ok ? 'text-accent-300' : 'text-error-300'}`}>{status.message}</p>
        </div>
      )}
    </div>
  );
}

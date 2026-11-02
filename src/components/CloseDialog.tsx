import { useState } from 'react';
import { Save, LogOut, X } from 'lucide-react';
import { t } from '@/lib/i18n';

interface Props {
  open: boolean;
  folder?: string; // zuletzt gewählter Backup-Ordner (Desktop)
  onSaveAndClose: () => Promise<void>;
  onCloseWithoutSaving: () => void;
  onCancel: () => void;
}

/** Abfrage beim Schließen, wenn es Änderungen seit dem letzten Backup gibt. */
export default function CloseDialog({ open, folder, onSaveAndClose, onCloseWithoutSaving, onCancel }: Props) {
  const [busy, setBusy] = useState(false);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/70" data-testid="close-dialog">
      <div className="w-full max-w-md rounded-2xl border border-ink-700 bg-ink-900 shadow-2xl p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold text-white">{t('Änderungen sichern?', 'Back up changes?')}</h3>
          <button type="button" onClick={onCancel} className="text-ink-500 hover:text-white" aria-label={t('Abbrechen', 'Cancel')}>
            <X size={18} />
          </button>
        </div>
        <p className="text-sm text-ink-400 mt-2 leading-relaxed">
          {t(
            'Seit dem letzten Backup hast du etwas geändert. Deine Daten bleiben auch ohne Backup in der App gespeichert – ein Backup schützt zusätzlich vor Datenverlust.',
            'You changed something since the last backup. Your data stays saved in the app even without a backup – a backup additionally protects against data loss.'
          )}
        </p>
        <p className="text-xs text-ink-500 mt-2 break-all">
          {folder
            ? t(`Das Backup wird in der App und als Datei in „${folder}“ gespeichert.`, `The backup is saved in the app and as a file in “${folder}”.`)
            : t('Das Backup wird im Backup-Verlauf der App gespeichert.', 'The backup is saved in the app’s backup history.')}
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            data-testid="close-save"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onSaveAndClose();
              } finally {
                setBusy(false);
              }
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-ink-950 bg-primary-500 hover:bg-primary-400 disabled:opacity-60 transition-colors"
          >
            <Save size={16} />
            {busy ? t('Wird gesichert …', 'Backing up …') : t('Backup erstellen & schließen', 'Back up & close')}
          </button>
          <button
            type="button"
            data-testid="close-discard"
            disabled={busy}
            onClick={onCloseWithoutSaving}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-ink-200 bg-ink-850 hover:bg-ink-800 border border-ink-700/60 transition-colors"
          >
            <LogOut size={16} />
            {t('Ohne Backup schließen', 'Close without backup')}
          </button>
          <button type="button" data-testid="close-cancel" disabled={busy} onClick={onCancel} className="px-4 py-2 rounded-xl text-sm text-ink-400 hover:text-white">
            {t('Abbrechen', 'Cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}

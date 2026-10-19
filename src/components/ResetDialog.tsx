import { useEffect, useState } from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import Modal from './Modal';
import { t } from '@/lib/i18n';

interface Props {
  open: boolean;
  counts: { grows: number; logs: number; batches: number };
  onConfirm: (opts: { deleteBackups: boolean }) => void;
  onCancel: () => void;
}

const WORD = 'RESET';

/** Sicherheitsabfrage zum Zurücksetzen der gesamten App. */
export default function ResetDialog({ open, counts, onConfirm, onCancel }: Props) {
  const [text, setText] = useState('');
  const [deleteBackups, setDeleteBackups] = useState(false);

  useEffect(() => {
    if (open) {
      setText('');
      setDeleteBackups(false);
    }
  }, [open]);

  const ok = text.trim().toUpperCase() === WORD;

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={t('Alles zurücksetzen?', 'Reset everything?')}
      subtitle={t('Die App wird wie frisch installiert.', 'The app will be like newly installed.')}
      icon={<AlertTriangle size={18} />}
      maxWidth="max-w-md"
    >
      <div className="space-y-4" data-testid="reset-dialog">
        <div className="rounded-xl border border-error-500/30 bg-error-500/5 px-4 py-3 text-sm text-error-200 leading-relaxed">
          {t(
            `Es werden alle Grows (${counts.grows}), Tagebucheinträge (${counts.logs}), Kosten und Nährlösungs-Ansätze (${counts.batches}) gelöscht. Hinweise und Einführung erscheinen wieder.`,
            `All grows (${counts.grows}), journal entries (${counts.logs}), costs and nutrient batches (${counts.batches}) will be deleted. Hints and the tour will appear again.`
          )}
        </div>

        {deleteBackups ? (
          <div className="flex gap-2.5 rounded-xl border border-error-500/30 bg-error-500/5 px-4 py-3 text-xs text-error-200 leading-relaxed" data-testid="reset-no-undo">
            <AlertTriangle size={15} className="shrink-0 mt-0.5" />
            {t('Es bleibt keine Sicherung übrig – das Zurücksetzen kann danach nicht mehr rückgängig gemacht werden.', 'No backup will remain – the reset cannot be undone afterwards.')}
          </div>
        ) : (
          <div className="flex gap-2.5 rounded-xl border border-accent-500/25 bg-accent-500/5 px-4 py-3 text-xs text-accent-200 leading-relaxed" data-testid="reset-safe">
            <ShieldCheck size={15} className="shrink-0 mt-0.5" />
            {t(
              'Vorher wird automatisch ein Backup deiner Daten angelegt (Reiter „Backup“ → „Gespeicherte Backups“). Damit kannst du alles wiederherstellen.',
              'A backup of your data is created automatically first (“Backup” tab → “Saved backups”). You can use it to restore everything.'
            )}
          </div>
        )}

        <label className="flex items-start gap-2.5 text-sm text-ink-300 cursor-pointer select-none">
          <input
            data-testid="reset-delete-backups"
            type="checkbox"
            checked={deleteBackups}
            onChange={(e) => setDeleteBackups(e.target.checked)}
            className="accent-red-500 h-4 w-4 mt-0.5"
          />
          <span>{t('Auch alle gespeicherten Backups löschen', 'Also delete all saved backups')}</span>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-ink-200 mb-1.5 block">
            {t('Tippe zur Bestätigung', 'Type to confirm')} <span className="font-bold text-white tracking-wider">{WORD}</span>
          </span>
          <input
            data-testid="reset-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && ok && onConfirm({ deleteBackups })}
            placeholder={WORD}
            autoComplete="off"
            className="w-full bg-ink-850 border border-ink-700/70 rounded-xl px-3.5 py-2.5 text-sm text-ink-100 placeholder-ink-600 focus:outline-none focus:border-error-500/60 focus:ring-2 focus:ring-error-500/20 transition-all tracking-wider"
          />
        </label>

        <div className="flex gap-3 pt-1">
          <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-ink-300 bg-ink-800 hover:bg-ink-700 transition-colors">
            {t('Abbrechen', 'Cancel')}
          </button>
          <button
            data-testid="reset-confirm"
            disabled={!ok}
            onClick={() => onConfirm({ deleteBackups })}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-error-500 hover:bg-error-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {t('Alles zurücksetzen', 'Reset everything')}
          </button>
        </div>
      </div>
    </Modal>
  );
}

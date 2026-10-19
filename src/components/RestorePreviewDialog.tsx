import { useMemo } from 'react';
import { AlertTriangle, ShieldCheck, Plus, Pencil, Trash2, Info } from 'lucide-react';
import Modal from './Modal';
import type { AppData } from '@/types';
import { normalizeAppData, type AutoBackup } from '@/lib/storage';
import { diffData } from '@/lib/importDiff';
import { locale, t } from '@/lib/i18n';

interface Props {
  backup: AutoBackup;
  current: AppData;
  onConfirm: () => void;
  onCancel: () => void;
}

const MAX_NAMES = 4;
const names = (list: string[]) => {
  const shown = list.slice(0, MAX_NAMES).join(', ');
  return list.length > MAX_NAMES ? `${shown} +${list.length - MAX_NAMES}` : shown;
};

/** Bestätigung beim Zurückspringen auf ein Backup – mit Vorschau, was dabei verloren geht oder zurückkommt. */
export default function RestorePreviewDialog({ backup, current, onConfirm, onCancel }: Props) {
  const diff = useMemo(() => diffData(current, normalizeAppData(backup.data)), [current, backup]);
  const when = new Date(backup.timestamp).toLocaleString(locale(), { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const lost = diff.removedGrows.length > 0 || diff.removedBatches > 0;

  return (
    <Modal
      open
      onClose={onCancel}
      title={t('Zu diesem Backup zurückspringen?', 'Go back to this backup?')}
      subtitle={`${when} · ${backup.growCount} Grows · ${backup.logCount} ${t('Einträge', 'entries')}`}
      icon={<AlertTriangle size={18} />}
      maxWidth="max-w-md"
    >
      <div className="space-y-3" data-testid="restore-preview">
        <div className="rounded-xl border border-warning-500/30 bg-warning-500/5 px-4 py-3 text-sm text-warning-200 leading-relaxed">
          {t(
            'Alle aktuellen Daten werden durch den Stand dieses Backups ersetzt. Alles, was danach entstanden ist, geht dabei verloren.',
            'All current data will be replaced by the state of this backup. Anything created after it will be lost.'
          )}
        </div>

        {diff.identical ? (
          <div className="flex items-start gap-3 rounded-xl border border-ink-800 bg-ink-850/60 px-4 py-3" data-testid="restore-identical">
            <Info size={16} className="text-primary-400 mt-0.5 shrink-0" />
            <p className="text-sm text-ink-200">{t('Keine Unterschiede – deine aktuellen Daten entsprechen schon diesem Backup.', 'No differences – your current data already matches this backup.')}</p>
          </div>
        ) : (
          <>
            {lost && (
              <Block tone="remove" icon={<Trash2 size={15} />} label={t('Geht verloren (nicht im Backup)', 'Will be lost (not in the backup)')} testid="restore-lost">
                {diff.removedGrows.length > 0 && (
                  <li>
                    {diff.removedGrows.length} {diff.removedGrows.length === 1 ? 'Grow' : 'Grows'}: {names(diff.removedGrows)}
                  </li>
                )}
                {diff.removedBatches > 0 && (
                  <li>
                    {diff.removedBatches} {diff.removedBatches === 1 ? t('Nährlösungs-Ansatz', 'nutrient batch') : t('Nährlösungs-Ansätze', 'nutrient batches')}
                  </li>
                )}
              </Block>
            )}
            {(diff.changedGrows.length > 0 || diff.changedBatches > 0) && (
              <Block tone="change" icon={<Pencil size={15} />} label={t('Wird auf den Stand des Backups gesetzt', 'Will be set to the backup’s state')} testid="restore-changed">
                {diff.changedGrows.slice(0, 5).map((g) => (
                  <li key={g.name}>
                    {g.name}: <span className="text-ink-400">{g.details.join(', ')}</span>
                  </li>
                ))}
                {diff.changedGrows.length > 5 && <li className="text-ink-500">+{diff.changedGrows.length - 5} {t('weitere Grows', 'more grows')}</li>}
                {diff.changedBatches > 0 && (
                  <li>
                    {diff.changedBatches} {diff.changedBatches === 1 ? t('Ansatz', 'batch') : t('Ansätze', 'batches')}
                  </li>
                )}
              </Block>
            )}
            {(diff.addedGrows.length > 0 || diff.addedBatches > 0) && (
              <Block tone="add" icon={<Plus size={15} />} label={t('Kommt zurück', 'Comes back')} testid="restore-added">
                {diff.addedGrows.length > 0 && (
                  <li>
                    {diff.addedGrows.length} {diff.addedGrows.length === 1 ? 'Grow' : 'Grows'}: {names(diff.addedGrows)}
                  </li>
                )}
                {diff.addedBatches > 0 && (
                  <li>
                    {diff.addedBatches} {diff.addedBatches === 1 ? t('Nährlösungs-Ansatz', 'nutrient batch') : t('Nährlösungs-Ansätze', 'nutrient batches')}
                  </li>
                )}
              </Block>
            )}
            <p className="text-[11px] text-ink-500">
              {t('„−2“ beim Tagebuch heißt: 2 aktuelle Einträge sind im Backup nicht enthalten und gehen verloren.', '“−2” for the journal means: 2 current entries are not in the backup and will be lost.')}
            </p>
          </>
        )}

        <div className="flex gap-2.5 rounded-xl border border-accent-500/25 bg-accent-500/5 px-4 py-3 text-xs text-accent-200 leading-relaxed">
          <ShieldCheck size={15} className="shrink-0 mt-0.5" />
          {t(
            'Deine aktuellen Daten werden vorher automatisch als Backup gesichert – du kannst dann jederzeit wieder zurückspringen.',
            'Your current data is backed up automatically first – so you can jump back again at any time.'
          )}
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={onCancel} data-testid="restore-cancel" className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-ink-300 bg-ink-800 hover:bg-ink-700 transition-colors">
            {t('Abbrechen', 'Cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={diff.identical}
            data-testid="restore-confirm"
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-error-500 hover:bg-error-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {t('Ja, zurückspringen', 'Yes, go back')}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function Block({ tone, icon, label, testid, children }: { tone: 'add' | 'change' | 'remove'; icon: React.ReactNode; label: string; testid: string; children: React.ReactNode }) {
  const cls = {
    add: 'text-accent-300 bg-accent-500/10 border-accent-500/25',
    change: 'text-warning-300 bg-warning-500/10 border-warning-500/25',
    remove: 'text-error-300 bg-error-500/10 border-error-500/25',
  }[tone];
  return (
    <div className="rounded-xl border border-ink-800 bg-ink-850/50 px-4 py-3" data-testid={testid}>
      <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-md border ${cls}`}>
        {icon}
        {label}
      </div>
      <ul className="mt-2 space-y-1 text-sm text-ink-200">{children}</ul>
    </div>
  );
}

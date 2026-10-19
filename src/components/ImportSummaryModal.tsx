import { CheckCircle2, Plus, Pencil, Trash2, Info } from 'lucide-react';
import Modal from './Modal';
import type { ImportSummary } from '@/lib/importDiff';
import { t } from '@/lib/i18n';

interface Props {
  summary: ImportSummary;
  kind: 'import' | 'restore';
  safetyBackup?: boolean;
  onClose: () => void;
}

const MAX_NAMES = 4;

function names(list: string[]): string {
  const shown = list.slice(0, MAX_NAMES).join(', ');
  return list.length > MAX_NAMES ? `${shown} +${list.length - MAX_NAMES}` : shown;
}

/** Kurzes Pop-up nach Import/Wiederherstellung: was ist neu, geändert oder entfernt – oder unverändert. */
export default function ImportSummaryModal({ summary: s, kind, safetyBackup, onClose }: Props) {
  const title = kind === 'import' ? t('Import abgeschlossen', 'Import complete') : t('Wiederherstellung abgeschlossen', 'Restore complete');

  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      subtitle={
        s.identical
          ? t('Die Daten sind gleich geblieben.', 'Your data stayed the same.')
          : t('Das hat sich an deinen Daten geändert:', 'This is what changed in your data:')
      }
      icon={<CheckCircle2 size={18} />}
      maxWidth="max-w-md"
    >
      <div className="space-y-3" data-testid="import-summary">
        {s.identical ? (
          <div className="flex items-start gap-3 rounded-xl border border-ink-800 bg-ink-850/60 px-4 py-3.5" data-testid="import-identical">
            <Info size={16} className="text-primary-400 mt-0.5 shrink-0" />
            <p className="text-sm text-ink-200">
              {t('Keine Änderungen – die Importdatei enthält genau deine aktuellen Daten.', 'No changes – the file contains exactly your current data.')}
            </p>
          </div>
        ) : (
          <>
            {(s.addedGrows.length > 0 || s.addedLogs > 0 || s.addedBatches > 0) && (
              <Row icon={<Plus size={15} />} tone="add" label={t('Neu hinzugefügt', 'Added')} testid="import-added">
                {s.addedGrows.length > 0 && (
                  <li>
                    {s.addedGrows.length} {s.addedGrows.length === 1 ? 'Grow' : 'Grows'}: {names(s.addedGrows)}
                  </li>
                )}
                {s.addedLogs > 0 && (
                  <li>
                    {s.addedLogs} {s.addedLogs === 1 ? t('Tagebucheintrag', 'journal entry') : t('Tagebucheinträge', 'journal entries')}
                  </li>
                )}
                {s.addedBatches > 0 && (
                  <li>
                    {s.addedBatches} {s.addedBatches === 1 ? t('Nährlösungs-Ansatz', 'nutrient batch') : t('Nährlösungs-Ansätze', 'nutrient batches')}
                  </li>
                )}
              </Row>
            )}

            {(s.changedGrows.length > 0 || s.changedBatches > 0) && (
              <Row icon={<Pencil size={15} />} tone="change" label={t('Geändert', 'Changed')} testid="import-changed">
                {s.changedGrows.slice(0, 5).map((g) => (
                  <li key={g.name}>
                    {g.name}: <span className="text-ink-400">{g.details.join(', ')}</span>
                  </li>
                ))}
                {s.changedGrows.length > 5 && <li className="text-ink-500">+{s.changedGrows.length - 5} {t('weitere Grows', 'more grows')}</li>}
                {s.changedBatches > 0 && (
                  <li>
                    {s.changedBatches} {s.changedBatches === 1 ? t('Ansatz', 'batch') : t('Ansätze', 'batches')}
                  </li>
                )}
              </Row>
            )}

            {(s.removedGrows.length > 0 || s.removedBatches > 0) && (
              <Row icon={<Trash2 size={15} />} tone="remove" label={t('Entfernt (nicht in der Datei)', 'Removed (not in the file)')} testid="import-removed">
                {s.removedGrows.length > 0 && (
                  <li>
                    {s.removedGrows.length} {s.removedGrows.length === 1 ? 'Grow' : 'Grows'}: {names(s.removedGrows)}
                  </li>
                )}
                {s.removedBatches > 0 && (
                  <li>
                    {s.removedBatches} {s.removedBatches === 1 ? t('Ansatz', 'batch') : t('Ansätze', 'batches')}
                  </li>
                )}
              </Row>
            )}
          </>
        )}

        <p className="text-xs text-ink-500 pt-1" data-testid="import-totals">
          {t('Jetzt vorhanden', 'Now in the app')}: {s.totals.grows} {s.totals.grows === 1 ? 'Grow' : 'Grows'} · {s.totals.logs}{' '}
          {s.totals.logs === 1 ? t('Tagebucheintrag', 'journal entry') : t('Tagebucheinträge', 'journal entries')} · {s.totals.batches}{' '}
          {s.totals.batches === 1 ? t('Ansatz', 'batch') : t('Ansätze', 'batches')}
        </p>

        {safetyBackup && !s.identical && (
          <p className="text-xs text-accent-300" data-testid="import-safety">
            {t('Deine vorherigen Daten wurden automatisch gesichert (Reiter „Backup“ → „Gespeicherte Backups“).', 'Your previous data was backed up automatically (“Backup” tab → “Saved backups”).')}
          </p>
        )}

        <div className="flex justify-end pt-1">
          <button
            data-testid="import-ok"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-ink-950 bg-primary-500 hover:bg-primary-400 transition-colors shadow-glow"
          >
            OK
          </button>
        </div>
      </div>
    </Modal>
  );
}

function Row({ icon, tone, label, testid, children }: { icon: React.ReactNode; tone: 'add' | 'change' | 'remove'; label: string; testid: string; children: React.ReactNode }) {
  const toneCls = {
    add: 'text-accent-300 bg-accent-500/10 border-accent-500/25',
    change: 'text-warning-300 bg-warning-500/10 border-warning-500/25',
    remove: 'text-error-300 bg-error-500/10 border-error-500/25',
  }[tone];
  return (
    <div className="rounded-xl border border-ink-800 bg-ink-850/50 px-4 py-3" data-testid={testid}>
      <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-md border ${toneCls}`}>
        {icon}
        {label}
      </div>
      <ul className="mt-2 space-y-1 text-sm text-ink-200">{children}</ul>
    </div>
  );
}

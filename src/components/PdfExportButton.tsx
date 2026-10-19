import { useState } from 'react';
import { FileText, AlertTriangle, X } from 'lucide-react';
import type { ReportResult } from '@/lib/pdfReport';
import PdfPreviewModal from './PdfPreviewModal';
import { t } from '@/lib/i18n';

interface Props {
  build: () => Promise<ReportResult>;
  label: string;
  title?: string;
  testid?: string;
  variant?: 'ghost' | 'primary';
}

/** Erzeugt den PDF-Bericht und zeigt ihn zuerst im Vorschau-Fenster an. Gespeichert wird von dort aus. */
export default function PdfExportButton({ build, label, title, testid = 'pdf-export', variant = 'ghost' }: Props) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ReportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      setResult(await build());
    } catch (e) {
      setError(e instanceof Error ? e.message : t('PDF konnte nicht erstellt werden.', 'PDF could not be created.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        data-testid={testid}
        onClick={run}
        disabled={busy}
        title={title}
        className={
          variant === 'primary'
            ? 'flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold text-ink-950 bg-primary-500 hover:bg-primary-400 disabled:opacity-60 transition-colors shadow-glow'
            : 'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-ink-300 bg-ink-800 hover:bg-ink-700 disabled:opacity-60 transition-colors'
        }
      >
        <FileText size={14} />
        <span className={variant === 'ghost' ? 'hidden sm:inline' : ''}>{busy ? t('Erstelle …', 'Creating …') : label}</span>
      </button>

      {result && <PdfPreviewModal result={result} title={t('PDF-Vorschau', 'PDF preview')} onClose={() => setResult(null)} />}

      {error && (
        <div
          data-testid="pdf-error"
          className="fixed bottom-14 left-1/2 -translate-x-1/2 z-50 w-[min(92vw,34rem)] flex items-start gap-2 rounded-xl px-3.5 py-3 shadow-2xl border bg-ink-900 border-error-500/40"
        >
          <AlertTriangle size={15} className="text-error-400 mt-0.5 shrink-0" />
          <p className="text-sm break-all flex-1 text-error-300">{error}</p>
          <button onClick={() => setError(null)} className="text-ink-500 hover:text-white shrink-0" aria-label="close">
            <X size={14} />
          </button>
        </div>
      )}
    </>
  );
}

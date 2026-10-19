import { useEffect, useRef, useState } from 'react';
import { FileText, X, Save, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { ReportResult } from '@/lib/pdfReport';
import { drawPreviewPage } from '@/lib/pdfPreview';
import { saveBinaryAs } from '@/lib/backupExport';
import { t } from '@/lib/i18n';

interface Props {
  result: ReportResult;
  title: string;
  onClose: () => void;
}

const PAGE_CSS_WIDTH = 794; // A4 bei 96 dpi
const ZOOMS = [0.6, 0.8, 1, 1.25, 1.5];

/** Pop-up mit Seitenvorschau des PDFs. Gespeichert wird erst per Klick auf "Speichern unter …". */
export default function PdfPreviewModal({ result, title, onClose }: Props) {
  const [zoom, setZoom] = useState(1);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [renderError, setRenderError] = useState(false);
  const canvases = useRef<(HTMLCanvasElement | null)[]>([]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  useEffect(() => {
    try {
      const scale = Math.min(2.5, Math.max(1.6, (window.devicePixelRatio || 1) * 1.3));
      result.preview.forEach((p, i) => {
        const c = canvases.current[i];
        if (c) drawPreviewPage(c, p, scale);
      });
      setRenderError(false);
    } catch {
      setRenderError(true);
    }
  }, [result]);

  const save = async () => {
    setSaving(true);
    setStatus(null);
    const r = await saveBinaryAs(result.filename, result.bytes, 'application/pdf', 'pdf');
    setSaving(false);
    if (r.ok) {
      setStatus({
        ok: true,
        message: r.location
          ? t(`PDF gespeichert unter: ${r.location}`, `PDF saved to: ${r.location}`)
          : r.method === 'download'
            ? t(`PDF „${r.filename}“ wurde heruntergeladen (Download-Ordner).`, `PDF “${r.filename}” was downloaded (download folder).`)
            : t(`PDF „${r.filename}“ wurde gespeichert (im gewählten Ordner).`, `PDF “${r.filename}” was saved (in the chosen folder).`),
      });
    } else if (!r.cancelled) {
      setStatus({ ok: false, message: r.message });
    }
  };

  const zi = ZOOMS.indexOf(zoom);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4" data-testid="pdf-preview">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-5xl h-full sm:h-[94vh] bg-ink-900 border border-ink-700/60 shadow-2xl sm:rounded-3xl flex flex-col overflow-hidden animate-slide-up">
        {/* Kopf */}
        <div className="flex items-center gap-3 px-4 sm:px-6 py-3.5 border-b border-ink-800">
          <div className="h-9 w-9 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center shrink-0">
            <FileText size={17} className="text-primary-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm sm:text-base font-semibold text-white truncate">{title}</h2>
            <p className="text-[11px] text-ink-500 truncate" data-testid="pdf-preview-meta">
              {result.filename} · {result.preview.length} {result.preview.length === 1 ? t('Seite', 'page') : t('Seiten', 'pages')}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-1" data-testid="pdf-zoom">
            <button
              onClick={() => zi > 0 && setZoom(ZOOMS[zi - 1])}
              disabled={zi <= 0}
              className="h-8 w-8 rounded-lg text-ink-300 bg-ink-850 hover:bg-ink-800 disabled:opacity-40 border border-ink-700/60 text-base leading-none"
              aria-label="zoom out"
            >
              −
            </button>
            <span className="w-12 text-center text-xs text-ink-400 tabular-nums">{Math.round(zoom * 100)} %</span>
            <button
              onClick={() => zi < ZOOMS.length - 1 && setZoom(ZOOMS[zi + 1])}
              disabled={zi >= ZOOMS.length - 1}
              className="h-8 w-8 rounded-lg text-ink-300 bg-ink-850 hover:bg-ink-800 disabled:opacity-40 border border-ink-700/60 text-base leading-none"
              aria-label="zoom in"
            >
              +
            </button>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-lg flex items-center justify-center text-ink-400 hover:text-white hover:bg-ink-800" aria-label="close" data-testid="pdf-preview-close">
            <X size={17} />
          </button>
        </div>

        {/* Seiten */}
        <div className="flex-1 overflow-auto bg-ink-950/70 px-3 sm:px-6 py-5" data-testid="pdf-preview-scroll">
          {renderError && (
            <p className="text-sm text-warning-300 text-center mb-4">
              {t('Die Vorschau konnte nicht angezeigt werden – du kannst die PDF trotzdem speichern.', 'The preview could not be shown – you can still save the PDF.')}
            </p>
          )}
          <div className="flex flex-col items-center gap-5">
            {result.preview.map((_, i) => (
              <div key={i} className="shadow-xl shadow-black/50" style={{ width: PAGE_CSS_WIDTH * zoom, maxWidth: zoom <= 1 ? '100%' : 'none' }}>
                <canvas
                  ref={(el) => {
                    canvases.current[i] = el;
                  }}
                  data-testid="pdf-page"
                  style={{ width: '100%', height: 'auto', display: 'block', background: '#fff' }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Fuß */}
        <div className="px-4 sm:px-6 py-3.5 border-t border-ink-800 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 min-w-0">
            {status ? (
              <div className="flex items-start gap-2" data-testid="pdf-preview-status">
                {status.ok ? <CheckCircle2 size={15} className="text-accent-400 mt-0.5 shrink-0" /> : <AlertTriangle size={15} className="text-error-400 mt-0.5 shrink-0" />}
                <p className={`text-xs sm:text-sm break-all ${status.ok ? 'text-accent-300' : 'text-error-300'}`}>{status.message}</p>
              </div>
            ) : (
              <p className="text-xs text-ink-500">
                {t('Prüfe den Bericht und speichere ihn danach über „Speichern unter …“.', 'Check the report, then save it via “Save as …”.')}
              </p>
            )}
          </div>
          <div className="flex gap-2.5 justify-end">
            <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-medium text-ink-300 bg-ink-850 hover:bg-ink-800 border border-ink-700/60 transition-colors">
              {t('Schließen', 'Close')}
            </button>
            <button
              data-testid="pdf-preview-save"
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-ink-950 bg-primary-500 hover:bg-primary-400 disabled:opacity-60 transition-colors shadow-glow"
            >
              <Save size={16} />
              {saving ? t('Speichere …', 'Saving …') : t('Speichern unter …', 'Save as …')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

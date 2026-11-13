import { useEffect, useState } from 'react';
import { ChevronDown, Download, Leaf, X } from 'lucide-react';
import { LinkFeedback } from '@/components/UpdateCard';
import { APP_VERSION } from '@/lib/appInfo';
import { t } from '@/lib/i18n';
import { openExternal } from '@/lib/openExternal';
import { closeUpdateDialog, skipVersion, useUpdateState } from '@/lib/updateCheck';

/** Patchnotes aus dem Release (Markdown) als einfache Liste anzeigen. */
function notesToLines(md: string): string[] {
  return md
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !/^#{1,6}\s/.test(l) && !/^>/.test(l) && !/^---+$/.test(l) && !/^\*\*?full changelog/i.test(l))
    .map((l) => l.replace(/^[-*+]\s+/, '').replace(/\*\*(.+?)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1'))
    .slice(0, 14);
}

/** Erster Teil eines Patchnote-Punkts bis zum Doppelpunkt („Neues Design: …“ → „Neues Design“). */
const headline = (l: string) => (l.includes(':') && l.indexOf(':') < 48 ? l.slice(0, l.indexOf(':')) : l.length > 70 ? `${l.slice(0, 68)}…` : l);

/**
 * Hinweis „Neue Version verfügbar“ – erscheint beim Start oben mittig wie eine Nachricht
 * (kurz „tippt …“, dann die Sprechblase). Blockiert die App nicht.
 */
export default function UpdateDialog() {
  const { status, dialogOpen } = useUpdateState();
  const [failed, setFailed] = useState(false);
  const [typing, setTyping] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const visible = dialogOpen && status.state === 'available';
  useEffect(() => {
    if (!visible) return;
    setTyping(true);
    setExpanded(false);
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const timer = setTimeout(() => setTyping(false), reduce ? 0 : 900);
    return () => clearTimeout(timer);
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeUpdateDialog();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible]);

  if (!visible || status.state !== 'available') return null;
  const rel = status.release;
  const lines = notesToLines(rel.notes);
  const highlights = lines.slice(0, 3).map(headline);

  return (
    <div
      className="fixed left-1/2 top-3 sm:top-5 z-[85] w-[min(94vw,25rem)] animate-drop-in"
      style={{ transform: 'translateX(-50%)' }}
      data-testid="update-dialog"
      role="dialog"
      aria-live="polite"
      aria-label={t('Update verfügbar', 'Update available')}
    >
      <div className="rounded-[1.6rem] border border-ink-700/80 bg-ink-900/95 shadow-2xl p-3.5 pb-3">
        {/* Kopf wie eine Mitteilung */}
        <div className="flex items-center gap-2.5 px-1">
          <div className="relative h-7 w-7 shrink-0 rounded-lg bg-ink-850 border border-ink-700 flex items-center justify-center overflow-hidden">
            <span className="absolute inset-x-0 top-0 h-[2px] gm-spectrum" aria-hidden="true" />
            <Leaf size={14} className="text-primary-300" />
          </div>
          <div className="flex-1 min-w-0 leading-tight">
            <div className="text-[13px] font-semibold text-white">growmanager</div>
            <div className="text-[11px] text-ink-400 tabular-nums" data-testid="update-versions">
              v{APP_VERSION} → <span className="text-primary-300 font-semibold">v{rel.version}</span>
            </div>
          </div>
          <span className="text-[11px] text-ink-500">{t('jetzt', 'now')}</span>
          <button type="button" onClick={closeUpdateDialog} className="h-7 w-7 -mr-1 rounded-full flex items-center justify-center text-ink-500 hover:text-white hover:bg-ink-800" aria-label={t('Schließen', 'Close')}>
            <X size={15} />
          </button>
        </div>

        {/* Nachricht */}
        <div className="mt-3 px-1 space-y-1.5">
          {typing ? (
            <div className="inline-flex items-center gap-1 rounded-[1.2rem] rounded-bl-md bg-ink-800 px-4 py-3" data-testid="update-typing" aria-label={t('schreibt …', 'typing …')}>
              {[0, 1, 2].map((k) => (
                <span key={k} className="h-2 w-2 rounded-full bg-ink-300 animate-typing" style={{ animationDelay: `${k * 0.15}s` }} />
              ))}
            </div>
          ) : (
            <>
              <div className="max-w-[92%] rounded-[1.2rem] rounded-bl-md bg-gradient-to-br from-led-500 to-led-600 px-3.5 py-2.5 text-white shadow-glow-led animate-bubble-in">
                <p className="text-[15px] font-semibold leading-snug">{t(`Version ${rel.version} ist da 🌱`, `Version ${rel.version} is here 🌱`)}</p>
                {highlights.length > 0 && (
                  <ul className="mt-1 space-y-0.5 text-[13px] leading-snug text-white/90">
                    {highlights.map((h, i) => (
                      <li key={i}>• {h}</li>
                    ))}
                  </ul>
                )}
              </div>
              {lines.length > 0 && (
                <div className="animate-bubble-in" style={{ animationDelay: '120ms' }}>
                  {expanded ? (
                    <ul className="max-w-[92%] max-h-56 overflow-y-auto scrollbar-thin rounded-[1.2rem] rounded-bl-md bg-ink-800 px-3.5 py-2.5 space-y-1.5" data-testid="update-notes">
                      {lines.map((l, i) => (
                        <li key={i} className="text-[13px] text-ink-200 leading-snug">
                          {l}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <button
                      type="button"
                      data-testid="update-show-notes"
                      onClick={() => setExpanded(true)}
                      className="inline-flex items-center gap-1 rounded-[1.2rem] rounded-bl-md bg-ink-800 hover:bg-ink-700 px-3.5 py-2 text-[13px] text-ink-200"
                    >
                      {t('Alle Neuerungen ansehen', 'See everything new')}
                      <ChevronDown size={14} />
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Antworten */}
        <div className="mt-3.5 flex flex-wrap items-center gap-2 px-1">
          <button
            type="button"
            data-testid="update-download"
            onClick={async () => {
              if (await openExternal(rel.url)) {
                setFailed(false);
                closeUpdateDialog();
              } else setFailed(true);
            }}
            className="flex items-center gap-1.5 h-9 px-4 rounded-full text-sm font-semibold text-ink-950 bg-primary-400 hover:bg-primary-300"
          >
            <Download size={15} />
            {t('Herunterladen', 'Download')}
          </button>
          <button type="button" data-testid="update-later" onClick={closeUpdateDialog} className="h-9 px-4 rounded-full text-sm font-medium text-ink-200 bg-ink-850 hover:bg-ink-800 border border-ink-700">
            {t('Später', 'Later')}
          </button>
          <button
            type="button"
            data-testid="update-skip"
            onClick={() => {
              skipVersion(rel.version);
              closeUpdateDialog();
            }}
            className="h-9 px-2 text-sm text-ink-400 hover:text-white ml-auto"
          >
            {t('Überspringen', 'Skip')}
          </button>
        </div>
        {failed && (
          <div className="mt-2 px-1">
            <LinkFeedback ok={false} url={rel.url} />
          </div>
        )}
        <p className="mt-2.5 px-1 text-[11px] text-ink-500 leading-relaxed">
          {t('Neue Datei laden und die alte ersetzen – deine Daten bleiben erhalten.', 'Download the new file and replace the old one – your data is kept.')}
        </p>
      </div>
    </div>
  );
}

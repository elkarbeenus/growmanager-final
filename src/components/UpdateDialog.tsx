import { useState } from 'react';
import { Download, Sparkles, X } from 'lucide-react';
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
    .filter((l) => l && !/^#{1,6}\s/.test(l) && !/^\*\*?full changelog/i.test(l))
    .map((l) => l.replace(/^[-*+]\s+/, '').replace(/\*\*(.+?)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1'))
    .slice(0, 12);
}

/** Hinweis „Neue Version verfügbar“ – erscheint beim Start, wenn es ein neueres Release gibt. */
export default function UpdateDialog() {
  const { status, dialogOpen } = useUpdateState();
  const [failed, setFailed] = useState(false);
  if (!dialogOpen || status.state !== 'available') return null;
  const rel = status.release;
  const lines = notesToLines(rel.notes);

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center p-4 bg-black/70" data-testid="update-dialog" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl border border-ink-700 bg-ink-900 shadow-2xl p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary-500/10 border border-primary-500/30 text-primary-400 flex items-center justify-center shrink-0">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">{t('Update verfügbar', 'Update available')}</h3>
              <p className="text-xs text-ink-400 tabular-nums mt-0.5" data-testid="update-versions">
                v{APP_VERSION} → <span className="text-primary-300 font-semibold">v{rel.version}</span>
              </p>
            </div>
          </div>
          <button type="button" onClick={closeUpdateDialog} className="text-ink-500 hover:text-white" aria-label={t('Schließen', 'Close')}>
            <X size={18} />
          </button>
        </div>

        {lines.length > 0 && (
          <div className="mt-4">
            <div className="text-[11px] font-semibold text-ink-500 mb-2">{t('Neu in dieser Version', 'New in this version')}</div>
            <ul className="max-h-48 overflow-y-auto scrollbar-thin space-y-1.5 pr-1" data-testid="update-notes">
              {lines.map((l, i) => (
                <li key={i} className="text-sm text-ink-300 flex gap-2">
                  <span className="text-ink-600">•</span>
                  <span>{l}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-xs text-ink-500 mt-4 leading-relaxed">
          {t(
            'Lade die neue Version herunter und ersetze die alte Datei (AppImage bzw. Setup ausführen). Deine Daten bleiben erhalten – zur Sicherheit vorher ein Backup machen.',
            'Download the new version and replace the old file (AppImage, or run the setup). Your data is kept – make a backup first to be safe.'
          )}
        </p>

        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            data-testid="update-download"
            onClick={async () => {
              if (await openExternal(rel.url)) {
                setFailed(false);
                closeUpdateDialog();
              } else setFailed(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-ink-950 bg-primary-500 hover:bg-primary-400 transition-colors"
          >
            <Download size={16} />
            {t('Zur Download-Seite', 'Go to download page')}
          </button>
          {failed && <LinkFeedback ok={false} url={rel.url} />}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              data-testid="update-later"
              onClick={closeUpdateDialog}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-ink-200 bg-ink-850 hover:bg-ink-800 border border-ink-700/60 transition-colors"
            >
              {t('Später', 'Later')}
            </button>
            <button
              type="button"
              data-testid="update-skip"
              onClick={() => {
                skipVersion(rel.version);
                closeUpdateDialog();
              }}
              className="px-4 py-2.5 rounded-xl text-sm text-ink-400 hover:text-white"
            >
              {t('Version überspringen', 'Skip this version')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

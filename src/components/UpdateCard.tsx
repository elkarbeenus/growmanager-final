import { RefreshCw, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { APP_VERSION } from '@/lib/appInfo';
import { t, getLang } from '@/lib/i18n';
import { openExternal } from '@/lib/openExternal';
import { RELEASES_PAGE, checkForUpdates, openUpdateDialog, setAutoCheck, useUpdateState } from '@/lib/updateCheck';

const timeOf = (ms: number) =>
  new Date(ms).toLocaleTimeString(getLang() === 'en' ? 'en-US' : 'de-DE', { hour: '2-digit', minute: '2-digit' });

/** „Über“-Reiter: Update-Status, manuelle Prüfung und Schalter für die automatische Prüfung beim Start. */
export default function UpdateCard() {
  const { status, settings } = useUpdateState();
  const checking = status.state === 'checking';

  let line: React.ReactNode;
  switch (status.state) {
    case 'available':
      line = (
        <span className="flex items-center gap-1.5 text-primary-300">
          <Sparkles size={14} /> {t(`Neue Version v${status.release.version} verfügbar`, `New version v${status.release.version} available`)}
        </span>
      );
      break;
    case 'current':
      line = (
        <span className="flex items-center gap-1.5 text-primary-400">
          <CheckCircle2 size={14} /> {t('Du hast die neueste Version', 'You have the latest version')}
          <span className="text-ink-600">· {t('geprüft um', 'checked at')} {timeOf(status.checkedAt)}</span>
        </span>
      );
      break;
    case 'error':
      line = (
        <span className="flex items-center gap-1.5 text-warning-300">
          <AlertCircle size={14} />
          {status.message === 'offline'
            ? t('Keine Internetverbindung – Prüfung nicht möglich', 'No internet connection – could not check')
            : t('Prüfung fehlgeschlagen – später erneut versuchen', 'Check failed – try again later')}
        </span>
      );
      break;
    case 'checking':
      line = <span className="text-ink-400">{t('Suche nach Updates …', 'Checking for updates …')}</span>;
      break;
    default:
      line = <span className="text-ink-500">{t('Noch nicht geprüft', 'Not checked yet')}</span>;
  }

  return (
    <div className="rounded-2xl border border-ink-800 bg-ink-900/60 p-5 flex flex-wrap items-center justify-between gap-3" data-testid="update-card">
      <div className="min-w-0">
        <div className="text-sm font-semibold text-white">
          {t('Updates', 'Updates')} <span className="text-ink-500 font-normal tabular-nums">· v{APP_VERSION}</span>
        </div>
        <div className="text-xs mt-1" data-testid="update-status">
          {line}
        </div>
        <label className="flex items-center gap-2 mt-3 text-xs text-ink-400 cursor-pointer select-none">
          <input
            type="checkbox"
            data-testid="update-auto"
            checked={settings.auto}
            onChange={(e) => setAutoCheck(e.target.checked)}
            className="accent-primary-500"
          />
          {t('Beim Start automatisch nach Updates suchen', 'Check for updates automatically on start')}
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        {status.state === 'available' ? (
          <button
            data-testid="update-show"
            onClick={openUpdateDialog}
            className="px-3.5 py-2 rounded-lg text-sm font-semibold text-ink-950 bg-primary-500 hover:bg-primary-400 transition-colors shadow-glow"
          >
            {t('Update ansehen', 'View update')}
          </button>
        ) : (
          <button
            data-testid="update-check"
            disabled={checking}
            onClick={() => void checkForUpdates({ manual: true })}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold text-ink-950 bg-primary-500 hover:bg-primary-400 disabled:opacity-60 transition-colors shadow-glow"
          >
            <RefreshCw size={14} className={checking ? 'animate-spin' : ''} />
            {t('Jetzt prüfen', 'Check now')}
          </button>
        )}
        <button
          onClick={() => void openExternal(RELEASES_PAGE)}
          className="px-3.5 py-2 rounded-lg text-sm font-medium text-ink-300 bg-ink-850 hover:bg-ink-800 border border-ink-700/60 transition-colors"
        >
          {t('Alle Versionen', 'All releases')}
        </button>
      </div>
    </div>
  );
}

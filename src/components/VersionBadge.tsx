import { useEffect, useState } from 'react';
import { APP_VERSION } from '@/lib/appInfo';
import { t } from '@/lib/i18n';
import { openUpdateDialog, useUpdateState } from '@/lib/updateCheck';

/**
 * Versionsanzeige unten links mit Update-Status:
 * - Update verfügbar → grüner Hinweis, Klick öffnet den Update-Dialog
 * - aktuell → für einige Sekunden „aktuell ✓“, danach nur die Version
 */
export default function VersionBadge() {
  const { status } = useUpdateState();
  const [showCurrent, setShowCurrent] = useState(false);

  useEffect(() => {
    if (status.state !== 'current') return;
    setShowCurrent(true);
    const timer = setTimeout(() => setShowCurrent(false), 6000);
    return () => clearTimeout(timer);
  }, [status]);

  if (status.state === 'available') {
    return (
      <button
        type="button"
        data-testid="version-badge"
        data-update="available"
        onClick={openUpdateDialog}
        title={t('Neue Version anzeigen', 'Show new version')}
        className="fixed bottom-3 left-3 z-40 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tabular-nums text-primary-200 bg-primary-500/15 border border-primary-500/40 hover:bg-primary-500/25 transition-colors"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-primary-400 animate-pulse" />
        v{APP_VERSION} · {t('Update', 'Update')} v{status.release.version}
      </button>
    );
  }

  return (
    <div
      data-testid="version-badge"
      data-update={status.state}
      className="fixed bottom-3 left-3 z-40 px-2.5 py-1 rounded-full text-[11px] font-medium tabular-nums text-ink-500 bg-ink-900/80 border border-ink-800 pointer-events-none select-none"
    >
      v{APP_VERSION}
      {status.state === 'checking' && <span className="text-ink-600"> · {t('suche Updates …', 'checking …')}</span>}
      {status.state === 'current' && showCurrent && <span className="text-primary-400"> · {t('aktuell', 'up to date')} ✓</span>}
    </div>
  );
}

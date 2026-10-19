import { APP_VERSION } from '@/lib/appInfo';

/** Reine Versionsanzeige unten links. */
export default function VersionBadge() {
  return (
    <div
      data-testid="version-badge"
      className="fixed bottom-3 left-3 z-40 px-2.5 py-1 rounded-full text-[11px] font-medium tabular-nums text-ink-500 bg-ink-900/80 border border-ink-800 backdrop-blur pointer-events-none select-none"
    >
      v{APP_VERSION}
    </div>
  );
}

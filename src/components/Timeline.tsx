import type { PhaseKey } from '@/types';
import { phaseTimeline, formatDate } from '@/lib/growLogic';
import { t } from '@/lib/i18n';


interface TimelineProps {
  grow: import('@/types').Grow;
}

const PHASE_BAR_COLOR: Record<PhaseKey, string> = {
  planning: 'bg-ink-600',
  germination: 'bg-primary-500',
  veg: 'bg-accent-500',
  stretch: 'bg-warning-500',
  bloom: 'bg-warning-400',
  ready: 'bg-error-500',
  harvested: 'bg-ink-500',
};

export default function Timeline({ grow }: TimelineProps) {
  const segments = phaseTimeline(grow);

  if (segments.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-ink-700/60 bg-ink-900/40 px-5 py-6 text-center text-sm text-ink-500">
        {t('Füge Meilenstein-Daten hinzu, um die Zeitleiste des Grows anzuzeigen.', 'Add milestone dates to visualize the grow timeline.')}
      </div>
    );
  }

  // Compute proportions
  const totalDays = segments.reduce((sum, s) => sum + (s.days ?? 0), 0) || 1;

  return (
    <div className="space-y-3">
      <div className="flex h-3 w-full rounded-full overflow-hidden bg-ink-850 border border-ink-800">
        {segments.map((s) => {
          const pct = ((s.days ?? 0) / totalDays) * 100;
          if (pct === 0) return null;
          return (
            <div
              key={s.key}
              className={`${PHASE_BAR_COLOR[s.key]} transition-all`}
              style={{ width: `${pct}%` }}
              title={`${s.label}: ${s.days} ${t('Tage', 'days')}`}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {segments.map((s) => (
          <div key={s.key} className="flex items-center gap-2 text-xs">
            <span className={`h-2.5 w-2.5 rounded-full ${PHASE_BAR_COLOR[s.key]}`} />
            <span className="text-ink-300 font-medium">{s.label}</span>
            <span className="text-ink-500">
              {s.days}{t('T', 'd')} · {formatDate(s.start)} → {formatDate(s.end)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}


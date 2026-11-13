import { FlaskConical, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { Grow, NutrientBatch } from '@/types';
import { timerGroups, RENEW_AFTER_DAYS, type TimerGroup } from '@/lib/nutrientLogic';
import { t } from '@/lib/i18n';

interface Props {
  batches: NutrientBatch[] | undefined;
  grows?: Grow[];
  onClick: () => void;
}

const MAX_ROWS = 3;

// Kleiner Timer oben: "Tag x – noch y Tage bis neu anmischen" bzw. "Nährlösung erneuern" – je Grow eine Zeile
export default function NutrientBanner({ batches, grows = [], onClick }: Props) {
  const groups = timerGroups(batches, grows).filter((g) => g.state.status !== 'none');
  if (groups.length === 0) return null;
  const showNames = groups.length > 1 || !!groups[0].name;
  const visible = groups.slice(0, MAX_ROWS);
  const more = groups.length - visible.length;

  return (
    <div className="px-4 sm:px-6 lg:px-8 space-y-1.5" data-testid="nutrient-banners">
      {visible.map((g) => (
        <BannerRow key={g.key} group={g} showName={showNames} onClick={onClick} />
      ))}
      {more > 0 && (
        <button type="button" onClick={onClick} className="text-xs text-ink-500 hover:text-ink-300 px-1">
          {t(`+ ${more} weitere Erinnerung(en) – im Reiter „Nährlösung“`, `+ ${more} more reminder(s) – in the “Nutrient mix” tab`)}
        </button>
      )}
    </div>
  );
}

function BannerRow({ group, showName, onClick }: { group: TimerGroup; showName: boolean; onClick: () => void }) {
  const s = group.state;
  const needsRenew = s.status === 'renew' || s.status === 'expired';
  const tone = needsRenew
    ? 'text-error-300 bg-error-500/10 border-error-500/30'
    : s.status === 'soon'
      ? 'text-warning-400 bg-warning-500/10 border-warning-500/30'
      : 'text-primary-300 bg-primary-500/10 border-primary-500/20';

  const text = needsRenew
    ? t('Nährlösung erneuern!', 'Renew nutrient solution!')
    : t(`Tag ${s.day} von ${RENEW_AFTER_DAYS} bis neu anmischen`, `Day ${s.day} of ${RENEW_AFTER_DAYS} until remix`);
  const sub = needsRenew
    ? s.status === 'expired'
      ? t('Älter als 14 Tage', 'Older than 14 days')
      : t(`Tag ${s.day} – spätestens jetzt wechseln`, `Day ${s.day} – replace now`)
    : t(`noch ${s.daysLeft} ${s.daysLeft === 1 ? 'Tag' : 'Tage'}`, `${s.daysLeft} ${s.daysLeft === 1 ? 'day' : 'days'} left`);

  return (
    <button
      type="button"
      data-testid="nutrient-banner"
      data-group={group.key}
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-colors hover:brightness-110 ${tone}`}
    >
      {needsRenew ? <AlertTriangle size={16} className="shrink-0" /> : s.status === 'soon' ? <FlaskConical size={16} className="shrink-0" /> : <CheckCircle2 size={16} className="shrink-0" />}
      {showName && (
        <span className="flex items-center gap-1.5 text-xs font-semibold text-ink-100 bg-ink-900/60 border border-ink-700/60 rounded-md px-1.5 py-0.5 max-w-[40%] truncate" data-testid="banner-grow">
          {group.color && <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: group.color }} />}
          <span className="truncate">{group.name ?? t('Allgemein', 'General')}</span>
        </span>
      )}
      <span className="text-sm font-semibold truncate">{text}</span>
      <span className="text-xs opacity-80 ml-auto whitespace-nowrap">{sub}</span>
    </button>
  );
}

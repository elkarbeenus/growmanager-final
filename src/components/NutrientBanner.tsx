import { FlaskConical, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { NutrientBatch } from '@/types';
import { batchState, RENEW_AFTER_DAYS } from '@/lib/nutrientLogic';
import { t } from '@/lib/i18n';

interface Props {
  batches: NutrientBatch[] | undefined;
  onClick: () => void;
}

// Kleiner Timer oben: "Tag x – noch y Tage bis neu anmischen" bzw. "Nährlösung erneuern"
export default function NutrientBanner({ batches, onClick }: Props) {
  const s = batchState(batches);
  if (s.status === 'none') return null;

  const needsRenew = s.status === 'renew' || s.status === 'expired';
  const tone = needsRenew
    ? 'text-error-300 bg-error-500/10 border-error-500/30'
    : s.status === 'soon'
      ? 'text-warning-400 bg-warning-500/10 border-warning-500/30'
      : 'text-primary-300 bg-primary-500/10 border-primary-500/20';

  const text = needsRenew
    ? t('Nährlösung erneuern!', 'Renew nutrient solution!')
    : t(
        `Tag ${s.day} von ${RENEW_AFTER_DAYS} bis neu anmischen`,
        `Day ${s.day} of ${RENEW_AFTER_DAYS} until remix`
      );
  const sub = needsRenew
    ? s.status === 'expired'
      ? t('Älter als 14 Tage', 'Older than 14 days')
      : t(`Tag ${s.day} – spätestens jetzt wechseln`, `Day ${s.day} – replace now`)
    : t(`noch ${s.daysLeft} ${s.daysLeft === 1 ? 'Tag' : 'Tage'}`, `${s.daysLeft} ${s.daysLeft === 1 ? 'day' : 'days'} left`);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-2.5">
      <button
        type="button"
        data-testid="nutrient-banner"
        onClick={onClick}
        className={`w-full flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-colors hover:brightness-110 ${tone}`}
      >
        {needsRenew ? <AlertTriangle size={16} className="shrink-0" /> : s.status === 'soon' ? <FlaskConical size={16} className="shrink-0" /> : <CheckCircle2 size={16} className="shrink-0" />}
        <span className="text-sm font-semibold">{text}</span>
        <span className="text-xs opacity-80 ml-auto whitespace-nowrap">{sub}</span>
      </button>
    </div>
  );
}

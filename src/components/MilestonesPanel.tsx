import { CalendarClock, Sparkles, Info, Wand2, Flower2 } from 'lucide-react';
import DateField from './DateField';
import type { Grow, MilestoneKey, Milestones } from '@/types';
import {
  milestoneLabels,
  describePhaseDuration,
  daysSince,
  daysUntil,
  currentPhase,
  growStartDate,
  formatDate,
  addDays,
} from '@/lib/growLogic';
import { t, isEn } from '@/lib/i18n';
import { plantsOf, MAX_PLANTS } from '@/lib/growStats';

interface MilestonesPanelProps {
  grow: Grow;
  onChange: (milestones: Milestones) => void;
  onPlantCountChange?: (count: number) => void;
}

const ORDER: MilestoneKey[] = [
  'cloneStart',
  'vegStart',
  'flowerStart',
  'stretchEnd',
  'expectedHarvest',
  'actualHarvest',
];

// Blüte-Dauer Optionen: Fast Flower (45 Tage) + 7/8/9 Wochen
const FLOWER_OPTIONS = [
  { label: 'Fast Flower', days: 45 },
  { label: '7', days: 49 },
  { label: '8', days: 56 },
  { label: '9', days: 63 },
] as const;

const flowerOptionLabel = (label: string) =>
  label === 'Fast Flower' ? label : `${label} ${t('Wochen', 'weeks')}`;

export default function MilestonesPanel({ grow, onChange, onPlantCountChange }: MilestonesPanelProps) {
  const labels = milestoneLabels();
  const setOne = (key: MilestoneKey, value: string | undefined) => {
    onChange({ ...grow.milestones, [key]: value });
  };

  const phase = currentPhase(grow);
  const elapsed = daysSince(growStartDate(grow));
  const remaining = daysUntil(grow.milestones.expectedHarvest);
  const durations = describePhaseDuration(grow);

  // Wenn Beginn Blütephase gesetzt wird, automatisch Stretch-Ende (+3 Wochen) berechnen
  const handleFlowerStartChange = (value: string | undefined) => {
    const updated: Milestones = { ...grow.milestones, flowerStart: value };
    if (value) {
      // Stretch-Ende = Blütebeginn + 21 Tage (3 Wochen), falls noch nicht manuell überschrieben
      const newStretchEnd = addDays(value, 21);
      updated.stretchEnd = newStretchEnd;
    }
    onChange(updated);
  };

  // Blüte-Dauer Buttons: Erntefenster = Blütebeginn + Anzahl Tage
  const applyFlowerDuration = (days: number) => {
    if (!grow.milestones.flowerStart) return;
    const harvestDate = addDays(grow.milestones.flowerStart, days);
    onChange({
      ...grow.milestones,
      expectedHarvest: harvestDate,
      stretchEnd: grow.milestones.stretchEnd ?? addDays(grow.milestones.flowerStart, 21),
    });
  };

  // Aktuell gewählte Blütedauer erkennen (anhand expectedHarvest vs flowerStart)
  const currentFlowerDays = (() => {
    if (!grow.milestones.flowerStart || !grow.milestones.expectedHarvest) return null;
    const days = Math.round(
      (new Date(grow.milestones.expectedHarvest + 'T00:00:00').getTime() -
        new Date(grow.milestones.flowerStart + 'T00:00:00').getTime()) /
        86400000
    );
    return FLOWER_OPTIONS.some((o) => o.days === days) ? days : null;
  })();

  const hasFlowerStart = !!grow.milestones.flowerStart;

  return (
    <div className="grid lg:grid-cols-5 gap-5">
      <div className="lg:col-span-3 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <CalendarClock size={16} className="text-primary-400" />
          <h3 className="text-base font-semibold text-white">{t('Meilensteine', 'Milestones')}</h3>
        </div>
        {onPlantCountChange && (
          <div className="rounded-2xl border border-ink-800 bg-ink-850/40 px-4 py-3 mb-1" data-testid="plant-count-inline">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="text-sm font-medium text-ink-200">{t('Anzahl Pflanzen im Grow', 'Number of plants in this grow')}</div>
                <div className="text-[11px] text-ink-500 mt-0.5">
                  {t('Die Daten unten gelten für alle Pflanzen gleich.', 'The dates below apply to all plants equally.')}
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: MAX_PLANTS }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => onPlantCountChange(n)}
                    data-testid={`inline-plants-${n}`}
                    className={`h-8 w-8 rounded-lg text-sm font-semibold tabular-nums border transition-colors ${
                      plantsOf(grow) === n
                        ? 'text-ink-950 bg-primary-500 border-primary-500'
                        : 'text-ink-300 bg-ink-850 border-ink-700/70 hover:bg-ink-800'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        <div className="grid sm:grid-cols-2 gap-3">
          {ORDER.map((key) => (
            <DateField
              key={key}
              label={isEn() ? labels[key].en : labels[key].de}
              hint={isEn() ? undefined : labels[key].en}
              value={grow.milestones[key]}
              onChange={
                key === 'flowerStart' ? handleFlowerStartChange : (v) => setOne(key, v)
              }
              accentColor={grow.color}
            />
          ))}
        </div>

        {/* Auto-Berechnung Hinweis */}
        {hasFlowerStart && (
          <div className="flex items-start gap-2 rounded-lg bg-primary-500/5 border border-primary-500/20 px-3 py-2.5 animate-fade-in">
            <Wand2 size={14} className="text-primary-400 mt-0.5 shrink-0" />
            <p className="text-xs text-ink-400 leading-relaxed">
              <span className="text-primary-300 font-medium">{t('Automatisch berechnet:', 'Calculated automatically:')}</span>{' '}
              {t('Ende des Stretch = Beginn Blütephase + 3 Wochen', 'End of stretch = flower start + 3 weeks')}
              {grow.milestones.stretchEnd && (
                <> ({formatDate(grow.milestones.stretchEnd)})</>
              )}
              . {t('Du kannst das Datum jederzeit manuell überschreiben.', 'You can override the date manually at any time.')}
            </p>
          </div>
        )}

        {/* Blüte-Dauer Buttons */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Flower2 size={14} className="text-warning-400" />
            <span className="text-sm font-medium text-ink-200">{t('Blüte-Dauer', 'Flower duration')}</span>
            {!hasFlowerStart && (
              <span className="text-xs text-ink-600">{t('(zuerst Blütebeginn setzen)', '(set flower start first)')}</span>
            )}
          </div>
          <div className="flex gap-2">
            {FLOWER_OPTIONS.map((opt) => {
              const isActive = currentFlowerDays === opt.days;
              const disabled = !hasFlowerStart;
              return (
                <button
                  key={opt.label}
                  onClick={() => applyFlowerDuration(opt.days)}
                  disabled={disabled}
                  className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                    isActive
                      ? 'bg-warning-500/20 text-warning-200 border-warning-500/40 shadow-glow'
                      : disabled
                      ? 'text-ink-700 bg-ink-900 border-ink-800 cursor-not-allowed'
                      : 'text-warning-300 bg-warning-500/5 border-warning-500/20 hover:bg-warning-500/10'
                  }`}
                >
                  {flowerOptionLabel(opt.label)}
                </button>
              );
            })}
          </div>
          {hasFlowerStart && grow.milestones.expectedHarvest && (
            <p className="text-xs text-ink-500 mt-2 flex items-center gap-1.5">
              <Wand2 size={12} className="text-primary-400" />
              {t('Erntefenster:', 'Harvest window:')}{' '}
              <span className="text-ink-200 font-medium">
                {formatDate(grow.milestones.expectedHarvest)}
              </span>
            </p>
          )}
        </div>
      </div>

      <div className="lg:col-span-2 space-y-4">
        <div className="rounded-2xl border border-ink-800 bg-ink-900/60 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={16} className="text-accent-400" />
            <h3 className="text-base font-semibold text-white">{t('Live-Berechnungen', 'Live calculations')}</h3>
          </div>

          <div className="space-y-3">
            <CalcRow
              label={t('Aktuelle Phase', 'Current phase')}
              value={phase.label}
              accent={phase.accent}
              highlight
            />
            <CalcRow
              label={t('Tage seit Start', 'Days since start')}
              value={elapsed !== null ? `${elapsed} ${t('Tage', 'days')}` : '—'}
            />
            <CalcRow
              label={t('Tage bis Ernte', 'Days to harvest')}
              value={remaining !== null ? `${remaining} ${t('Tage', 'days')}` : '—'}
              accent={remaining !== null && remaining <= 14 ? 'warning' : undefined}
            />
            <div className="pt-1.5 border-t border-ink-800 space-y-2">
              {durations.length === 0 ? (
                <p className="text-xs text-ink-500 flex items-start gap-1.5">
                  <Info size={13} className="mt-0.5 shrink-0" />
                  {t('Setze Meilenstein-Daten, um Phasendauer und aktuelle Blütewoche zu sehen.', 'Set milestone dates to see phase durations and the current flower week.')}
                </p>
              ) : (
                durations.map((d) => (
                  <div
                    key={d.label}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-ink-400">{d.label}</span>
                    <span className="text-ink-100 font-medium tabular-nums">
                      {d.value}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {(grow.milestones.expectedHarvest || grow.milestones.actualHarvest) && (
          <div className="rounded-2xl border border-ink-800 bg-ink-900/60 p-4">
            <div className="text-xs uppercase tracking-wide text-ink-500 mb-2">
              {t('Wichtige Daten', 'Key dates')}
            </div>
            <div className="space-y-1.5 text-sm">
              {grow.milestones.expectedHarvest && (
                <div className="flex justify-between">
                  <span className="text-ink-400">{t('Geplante Ernte', 'Expected harvest')}</span>
                  <span className="text-ink-100 font-medium">
                    {formatDate(grow.milestones.expectedHarvest)}
                  </span>
                </div>
              )}
              {grow.milestones.actualHarvest && (
                <div className="flex justify-between">
                  <span className="text-ink-400">{t('Tatsächliche Ernte', 'Actual harvest')}</span>
                  <span className="text-accent-300 font-medium">
                    {formatDate(grow.milestones.actualHarvest)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CalcRow({
  label,
  value,
  accent,
  highlight,
}: {
  label: string;
  value: string;
  accent?: 'primary' | 'accent' | 'warning' | 'error' | 'ink';
  highlight?: boolean;
}) {
  const colorMap = {
    primary: 'text-primary-300 bg-primary-500/10 border-primary-500/30',
    accent: 'text-accent-300 bg-accent-500/10 border-accent-500/30',
    warning: 'text-warning-300 bg-warning-500/10 border-warning-500/30',
    error: 'text-error-300 bg-error-500/10 border-error-500/30',
    ink: 'text-ink-300 bg-ink-800 border-ink-700',
  } as const;
  const cls = colorMap[accent ?? 'ink'];

  if (highlight) {
    return (
      <div className="flex items-center justify-between">
        <span className="text-ink-400 text-sm">{label}</span>
        <span className={`text-sm font-semibold px-2.5 py-1 rounded-full border ${cls}`}>
          {value}
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-ink-400">{label}</span>
      <span className="text-ink-100 font-medium tabular-nums">{value}</span>
    </div>
  );
}

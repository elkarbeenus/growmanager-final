import { FlaskConical, Droplets, Info } from 'lucide-react';
import type { Grow, NutrientBatch } from '@/types';
import FertPhaseTable from './FertPhaseTable';
import DarkSelect from './DarkSelect';
import { getFertilizers } from '@/lib/fertilizerData';
import { useSelectedFertilizer } from '@/lib/fertilizerSelection';
import { computeUsage, formatMl, scheduleById } from '@/lib/fertUsage';
import { plantsOf } from '@/lib/growStats';
import { formatDate } from '@/lib/growLogic';
import { t, fmtNum, litersToDisplay, volumeUnit } from '@/lib/i18n';

interface Props {
  grow: Grow;
  allGrows: Grow[];
  batches: NutrientBatch[];
  onFertilizerChange: (id: string | undefined) => void;
}

/** Düngerverbrauch & angemischte Nährlösung eines einzelnen Grows (Ende des Runs). */
export default function FertUsagePanel({ grow, allGrows, batches, onFertilizerChange }: Props) {
  const globalFert = useSelectedFertilizer();
  const schedules = getFertilizers();
  const usage = computeUsage(batches, allGrows, globalFert, grow.id, schedules);
  const plants = plantsOf(grow);
  const totalMl = usage.groups.reduce((s, g) => s + g.totalMl, 0);
  const globalName = scheduleById(globalFert, schedules)?.brand ?? '';

  return (
    <div data-testid="fert-usage-panel">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <FlaskConical size={16} className="text-primary-400" />
          {t('Nährlösung & Dünger-Verbrauch', 'Nutrient solution & fertilizer usage')}
        </h3>
        <p className="text-xs text-ink-500 mt-0.5">
          {t(
            'Verbrauch dieses Grows nach Phase – berechnet aus den Ansätzen im Reiter „Nährlösung“ (werden automatisch über das Datum zugeordnet) und dem Düngeschema.',
            'Usage of this grow by phase – calculated from the batches in the “Nutrient mix” tab (assigned automatically by date) and the fertilizer schedule.'
          )}
        </p>
      </div>

      <div className="block max-w-md mb-5">
        <span className="text-sm font-medium text-ink-200 mb-1.5 block">{t('Dünger für diesen Grow', 'Fertilizer for this grow')}</span>
        <DarkSelect
          testid="fert-select"
          value={grow.fertilizerId ?? ''}
          onChange={(v) => onFertilizerChange(v || undefined)}
          options={[
            { value: '', label: t(`Standard (${globalName} – aus Reiter „Dünger“)`, `Default (${globalName} – from “Nutrients” tab)`) },
            ...schedules.map((s) => ({ value: s.id, label: `${s.brand} · ${s.line}` })),
          ]}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
        <Tile label={t('Nährlösung gesamt', 'Solution total')} value={`${fmtNum(litersToDisplay(usage.liters) ?? 0, 1)} ${volumeUnit()}`} testid="fert-liters" icon={<Droplets size={13} />} />
        <Tile label={t('Ansätze', 'Batches')} value={String(usage.batchCount)} testid="fert-batches" />
        <Tile label={t('Dünger gesamt', 'Fertilizer total')} value={totalMl > 0 ? formatMl(totalMl) : '—'} testid="fert-total" tone />
        <Tile label={t('Nährlösung / Pflanze', 'Solution / plant')} value={`${fmtNum((litersToDisplay(usage.liters) ?? 0) / plants, 1)} ${volumeUnit()}`} testid="fert-liters-plant" />
      </div>

      {usage.batchCount === 0 && (
        <div className="rounded-xl border border-dashed border-ink-700/60 bg-ink-900/40 px-4 py-5 text-sm text-ink-500 mb-4" data-testid="fert-empty">
          {t(
            'Noch keine Ansätze für diesen Grow. Trage im Reiter „Nährlösung“ einen Ansatz ein – er wird automatisch diesem Grow zugeordnet, wenn das Datum in seinen Zeitraum fällt (oder wähle den Grow dort manuell).',
            'No batches for this grow yet. Log a batch in the “Nutrient mix” tab – it is assigned to this grow automatically if the date falls in its time span (or choose the grow there manually).'
          )}
        </div>
      )}

      <div className="space-y-4 mb-4">
        {usage.groups.map((g) => (
          <div key={g.schedule.id} className="space-y-2">
            {usage.groups.length > 1 && <div className="text-xs font-semibold uppercase tracking-widest text-ink-500">{g.schedule.brand} · {g.schedule.line}</div>}
            <FertPhaseTable usage={g} plants={plants} />
          </div>
        ))}
      </div>

      {usage.unresolved.length > 0 && (
        <div className="rounded-xl border border-warning-500/30 bg-warning-500/5 px-4 py-3 text-sm text-warning-300 mb-4">
          {t(
            `${usage.unresolved.length} Ansatz/Ansätze konnten keiner Phase zugeordnet werden (Meilenstein-Daten des Grows prüfen).`,
            `${usage.unresolved.length} batch(es) could not be assigned to a phase (check the grow’s milestone dates).`
          )}
        </div>
      )}

      {usage.batchCount > 0 && (
        <div className="space-y-1.5 mb-4" data-testid="fert-batch-list">
          {usage.all.map((u) => (
            <div key={u.batch.id} className="flex items-center gap-3 rounded-xl border border-ink-800 bg-ink-850/60 px-3.5 py-2 text-xs">
              <span className="text-ink-200 tabular-nums">{formatDate(u.batch.date)}</span>
              <span className="text-ink-400 tabular-nums">
                {fmtNum(litersToDisplay(u.batch.liters) ?? 0, 2)} {volumeUnit()}
              </span>
              <span className="ml-auto text-ink-500">
                {u.weekLabel}
                {u.weekIndex !== null && <span className="text-ink-600"> · {u.weekAuto ? t('automatisch', 'auto') : t('manuell', 'manual')}</span>}
                {u.growInferred && <span className="text-ink-600"> · {t('Grow über Datum erkannt', 'grow detected by date')}</span>}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2.5 text-[11px] text-ink-600 leading-relaxed">
        <Info size={13} className="shrink-0 mt-0.5" />
        <span>
          {t(
            'Richtwerte aus dem Düngeschema (Dosierung je Woche, mL pro 10 Liter). Bereiche (z. B. 8–13 mL) zählen mit dem Mittelwert (~), „nach Bedarf“-Produkte sind nicht eingerechnet. Dieselbe Übersicht für alle Grows findest du im Reiter „Nährlösung“.',
            'Guideline values from the fertilizer schedule (dose per week, mL per gallon). Ranges (e.g. 8–13 mL) use the average (~); “as needed” products are not included. The same overview for all grows is in the “Nutrient mix” tab.'
          )}
        </span>
      </div>
    </div>
  );
}

function Tile({ label, value, testid, icon, tone }: { label: string; value: string; testid: string; icon?: React.ReactNode; tone?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 ${tone ? 'bg-primary-500/10 border-primary-500/20' : 'bg-ink-850/60 border-ink-800'}`}>
      <div className="text-[10px] uppercase tracking-wide text-ink-500 flex items-center gap-1">
        {icon}
        {label}
      </div>
      <div className="text-lg font-bold text-white tabular-nums mt-0.5" data-testid={testid}>
        {value}
      </div>
    </div>
  );
}

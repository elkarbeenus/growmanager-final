import { FlaskConical, Info, Droplets } from 'lucide-react';
import { useState } from 'react';
import type { Grow, NutrientBatch } from '@/types';
import FertPhaseTable from './FertPhaseTable';
import DarkSelect from './DarkSelect';
import { getFertilizers } from '@/lib/fertilizerData';
import { setSelectedFertilizer, useSelectedFertilizer } from '@/lib/fertilizerSelection';
import { computeUsage, formatMl } from '@/lib/fertUsage';
import { fmtNum, litersToDisplay, t, volumeUnit } from '@/lib/i18n';

/** Übersicht im Reiter "Nährlösung": Liter angemischt und mL Dünger je Produkt und Phase. */
export default function FertOverviewCard({ batches, grows }: { batches: NutrientBatch[]; grows: Grow[] }) {
  const globalFert = useSelectedFertilizer();
  const [growFilter, setGrowFilter] = useState('');
  const schedules = getFertilizers();
  const usage = computeUsage(batches, grows, globalFert, growFilter || undefined, schedules);
  const totalMl = usage.groups.reduce((s, g) => s + g.totalMl, 0);
  const unresolvedLiters = usage.unresolved.reduce((s, r) => s + r.batch.liters, 0);

  return (
    <div className="rounded-2xl border border-ink-800 bg-ink-900/60 p-5 space-y-4" data-testid="fert-overview">
      <div>
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <FlaskConical size={16} className="text-primary-400" />
          {t('Dünger-Verbrauch nach Phase', 'Fertilizer usage by phase')}
        </h3>
        <p className="text-xs text-ink-500 mt-0.5">
          {t(
            'Berechnet aus den Litern, die du angemischt hast, und dem Düngeschema deines gewählten Düngers.',
            'Calculated from the liters you mixed and the schedule of your selected fertilizer.'
          )}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="block">
          <span className="text-sm font-medium text-ink-200 mb-1.5 block">{t('Dünger (aus Reiter „Dünger“)', 'Fertilizer (from “Nutrients” tab)')}</span>
          <DarkSelect
            testid="fert-overview-select"
            value={globalFert}
            onChange={setSelectedFertilizer}
            options={schedules.map((s) => ({ value: s.id, label: `${s.brand} · ${s.line}` }))}
          />
        </div>
        {grows.length > 0 && (
          <div className="block">
            <span className="text-sm font-medium text-ink-200 mb-1.5 block">{t('Anzeigen für', 'Show for')}</span>
            <DarkSelect
              testid="fert-overview-grow"
              value={growFilter}
              onChange={setGrowFilter}
              options={[{ value: '', label: t('Alle Grows', 'All grows') }, ...grows.map((g) => ({ value: g.id, label: g.name }))]}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <Tile label={t('Nährlösung angemischt', 'Solution mixed')} value={`${fmtNum(litersToDisplay(usage.liters) ?? 0, 1)} ${volumeUnit()}`} testid="ov-fert-liters" icon={<Droplets size={13} />} />
        <Tile label={t('Ansätze', 'Batches')} value={String(usage.batchCount)} testid="ov-fert-batches" />
        <Tile label={t('Dünger gesamt', 'Fertilizer total')} value={totalMl > 0 ? formatMl(totalMl) : '—'} testid="ov-fert-total" tone />
      </div>

      {usage.batchCount === 0 ? (
        <div className="rounded-xl border border-dashed border-ink-700/60 bg-ink-900/40 px-4 py-5 text-sm text-ink-500" data-testid="ov-fert-empty">
          {t(
            'Noch keine Ansätze. Trage unten deinen ersten Ansatz ein – danach erscheint hier der Verbrauch je Phase (Wachstum, Blüte …).',
            'No batches yet. Log your first batch below – the usage per phase (veg, flower …) then appears here.'
          )}
        </div>
      ) : (
        <>
          {usage.groups.map((g) => (
            <div key={g.schedule.id} className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-widest text-ink-500 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: g.schedule.accent }} />
                {g.schedule.brand} · {g.schedule.line}
              </div>
              <FertPhaseTable usage={g} />
            </div>
          ))}

          {usage.unresolved.length > 0 && (
            <div className="rounded-xl border border-warning-500/30 bg-warning-500/5 px-4 py-3 text-sm text-warning-300" data-testid="ov-fert-unresolved">
              {t(
                `${usage.unresolved.length} Ansatz/Ansätze (${fmtNum(litersToDisplay(unresolvedLiters) ?? 0, 1)} ${volumeUnit()}) konnten keiner Phase zugeordnet werden und sind nicht eingerechnet. Wähle beim Ansatz unten in der Verlaufsliste einen Grow oder eine Schema-Woche.`,
                `${usage.unresolved.length} batch(es) (${fmtNum(litersToDisplay(unresolvedLiters) ?? 0, 1)} ${volumeUnit()}) could not be assigned to a phase and are not included. In the history list below, choose a grow or a schedule week for the batch.`
              )}
            </div>
          )}
        </>
      )}

      <div className="flex gap-2.5 text-[11px] text-ink-600 leading-relaxed">
        <Info size={13} className="shrink-0 mt-0.5" />
        <span>
          {t(
            'Der Ansatz wird automatisch dem Grow zugeordnet, der an diesem Datum lief (sonst manuell wählbar). Die Schema-Woche ergibt sich aus Start, Wachstum und Blüte des Grows. Bereiche (z. B. 8–13 mL) zählen mit dem Mittelwert (~), „nach Bedarf“-Produkte sind nicht eingerechnet. Richtwerte – bitte mit deinem Hersteller-Chart abgleichen.',
            'A batch is automatically assigned to the grow that was running on that date (can be set manually). The schedule week comes from the grow’s start, veg and flower dates. Ranges (e.g. 8–13 mL) use the average (~); “as needed” products are not included. Guideline values – please compare with your manufacturer’s chart.'
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

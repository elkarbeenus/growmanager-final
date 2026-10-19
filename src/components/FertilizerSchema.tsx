import { useState } from 'react';
import { FlaskConical, Beaker, Info, AlertTriangle, ListOrdered, BadgeCheck } from 'lucide-react';
import { getFertilizers, stageLabel, type FertSchedule, type StageKind } from '@/lib/fertilizerData';
import { useSelectedFertilizer, setSelectedFertilizer } from '@/lib/fertilizerSelection';
import { t, doseFromPerLiterDisplay, doseUnitShort, AS_NEEDED } from '@/lib/i18n';
import AthenaSchema from '@/components/AthenaSchema';
import FertPriceEditor from '@/components/FertPriceEditor';

const STAGE_BADGE: Record<StageKind, string> = {
  start: 'text-ink-300 bg-ink-800 border-ink-700',
  veg: 'text-accent-300 bg-accent-500/10 border-accent-500/30',
  flower: 'text-warning-300 bg-warning-500/10 border-warning-500/30',
  flush: 'text-primary-300 bg-primary-500/10 border-primary-500/30',
};

export default function FertilizerSchema({
  prices,
  onPricesChange,
}: {
  prices?: Record<string, number>;
  onPricesChange?: (prices: Record<string, number> | undefined) => void;
}) {
  const selectedId = useSelectedFertilizer(); // gilt auch als aktiver Dünger für die Verbrauchsrechnung
  const [activeWeek, setActiveWeek] = useState<number | null>(null);
  const [athenaDetail, setAthenaDetail] = useState(false);
  const FERTILIZERS = getFertilizers(); // in aktueller Sprache

  const schedule = FERTILIZERS.find((f) => f.id === selectedId) ?? FERTILIZERS[0];

  const select = (id: string) => {
    setSelectedFertilizer(id);
    setActiveWeek(null);
    setAthenaDetail(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hersteller-Auswahl */}
      <div className="rounded-2xl border border-ink-800 bg-ink-900/60 p-5">
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <FlaskConical size={16} className="text-primary-400" />
          {t('Dünger auswählen', 'Select nutrients')}
        </h2>
        <p className="text-xs text-ink-500 -mt-1.5 mb-3">
          {t(
            'Der gewählte Dünger wird im Reiter „Nährlösung“ für die Verbrauchsrechnung (mL je Phase) verwendet. Die Dosierungen sind in mL pro 10 Liter angegeben.',
            'The selected fertilizer is used in the “Nutrient mix” tab to calculate usage (mL per phase). Doses are shown in mL per gallon.'
          )}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {FERTILIZERS.map((f) => {
            const active = f.id === selectedId;
            return (
              <button
                key={f.id}
                onClick={() => select(f.id)}
                className={`text-left rounded-xl border p-3 transition-all ${
                  active
                    ? 'bg-ink-850 shadow-glow'
                    : 'border-ink-800 bg-ink-900/60 hover:bg-ink-850/70'
                }`}
                style={active ? { borderColor: f.accent } : undefined}
              >
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: f.accent }} />
                  <span className="text-sm font-semibold text-ink-100">{f.brand}</span>
                </div>
                <div className="text-[11px] text-ink-500 mt-1 leading-snug">{f.line}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Athena: Umschalter auf Detailansicht */}
      {schedule.id === 'athena' && (
        <div className="flex gap-2">
          <ViewToggle active={!athenaDetail} onClick={() => setAthenaDetail(false)}>
            {t('Übersicht', 'Overview')}
          </ViewToggle>
          <ViewToggle active={athenaDetail} onClick={() => setAthenaDetail(true)}>
            {t('Athena Detailschema (PPM, pH, Mischreihenfolge)', 'Athena detailed schedule (PPM, pH, mixing order)')}
          </ViewToggle>
        </div>
      )}

      {schedule.id === 'athena' && athenaDetail ? (
        <AthenaSchema />
      ) : (
        <ScheduleView
          key={schedule.id}
          schedule={schedule}
          activeWeek={activeWeek}
          setActiveWeek={setActiveWeek}
        />
      )}

      {onPricesChange && (
        <div className="rounded-2xl border border-ink-800 bg-ink-900/60 p-5" data-testid="fert-prices-card">
          <h3 className="text-sm font-semibold text-white mb-1">{t('Preise für die Kostenrechnung', 'Prices for the cost calculation')}</h3>
          <p className="text-xs text-ink-500 mb-4 leading-relaxed">
            {t(
              'Aus deinem Dünger-Verbrauch werden die Dünger-Kosten im Grow automatisch berechnet. Als Grundlage dienen diese Preise pro Liter – passe sie an deine echten Preise an.',
              'The fertilizer costs in a grow are calculated automatically from your usage. These prices per liter are the basis – adjust them to your real prices.'
            )}
          </p>
          <FertPriceEditor schedule={schedule} prices={prices} onChange={onPricesChange} />
        </div>
      )}
    </div>
  );
}

function ViewToggle({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
        active
          ? 'bg-primary-500/15 text-primary-200 border-primary-500/40'
          : 'text-ink-300 bg-ink-850 border-ink-700/60 hover:bg-ink-800'
      }`}
    >
      {children}
    </button>
  );
}

function ScheduleView({
  schedule,
  activeWeek,
  setActiveWeek,
}: {
  schedule: FertSchedule;
  activeWeek: number | null;
  setActiveWeek: (n: number | null) => void;
}) {
  const usedProducts = schedule.products.filter((p) =>
    schedule.weeks.some((w) => w.doses[p.key])
  );
  const hasEc = schedule.weeks.some((w) => w.ec);
  const week = activeWeek !== null ? schedule.weeks[activeWeek] : null;

  return (
    <>
      {/* Intro */}
      <div className="rounded-2xl border border-ink-800 bg-ink-900/60 p-5">
        <div className="flex items-start gap-4">
          <div
            className="h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 border"
            style={{ backgroundColor: `${schedule.accent}1a`, borderColor: `${schedule.accent}55` }}
          >
            <FlaskConical size={24} style={{ color: schedule.accent }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {schedule.brand} <span className="text-ink-400 font-medium">· {schedule.line}</span>
              </h2>
              {schedule.verified && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary-300 bg-primary-500/10 border border-primary-500/30 rounded-full px-2 py-0.5">
                  <BadgeCheck size={12} /> {t('Herstellerwerte', 'Manufacturer values')}
                </span>
              )}
            </div>
            <p className="text-sm text-ink-400 mt-1 leading-relaxed">{schedule.tagline}</p>
            <p className="text-xs text-ink-500 mt-2">
              {t('Alle Werte in', 'All values in')} <span className="text-ink-200 font-medium" data-testid="fertilizer-unit-label">{schedule.unit}</span>.{' '}
              {t('Klicke auf eine Woche für die Detailansicht.', 'Click a week for the detailed view.')}
            </p>
          </div>
        </div>
      </div>

      {!schedule.verified && (
        <div className="rounded-xl border border-warning-500/30 bg-warning-500/5 p-4 flex items-start gap-3">
          <AlertTriangle size={16} className="text-warning-400 mt-0.5 shrink-0" />
          <p className="text-xs text-warning-200 leading-relaxed">
            {t(
              'Diese Werte sind vereinfachte Richtwerte und nicht 1:1 aus dem offiziellen Chart des Herstellers übernommen. Bitte vor der Nutzung mit dem aktuellen Düngechart auf der Herstellerseite oder der Flasche abgleichen.',
              "These values are simplified guidelines and not copied 1:1 from the manufacturer's official chart. Please compare them with the current feed chart on the manufacturer's website or the bottle before use."
            )}
          </p>
        </div>
      )}

      {/* Wochenwahl */}
      <div className="rounded-2xl border border-ink-800 bg-ink-900/60 p-5">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Beaker size={16} className="text-primary-400" />
          {t('Woche auswählen', 'Select week')}
        </h3>
        <div className="flex flex-wrap gap-2">
          {schedule.weeks.map((w, i) => {
            const isActive = activeWeek === i;
            return (
              <button
                key={w.label + i}
                onClick={() => setActiveWeek(isActive ? null : i)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                  isActive
                    ? 'bg-primary-500 text-ink-950 border-primary-400 shadow-glow'
                    : STAGE_BADGE[w.stage] + ' hover:brightness-125'
                }`}
              >
                {w.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Wochen-Detail */}
      {week && (
        <div className="rounded-2xl border border-primary-500/30 bg-primary-500/5 p-5 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white">{week.label}</h3>
              <p className="text-sm text-ink-400 mt-0.5">Phase: {stageLabel(week.stage)}</p>
            </div>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${STAGE_BADGE[week.stage]}`}>
              {stageLabel(week.stage)}
            </span>
          </div>
          {week.ec && (
            <div className="mb-4 rounded-xl border border-ink-800 bg-ink-850/60 p-3 text-center max-w-[10rem]">
              <div className="text-[10px] uppercase tracking-wide text-ink-500 mb-1">{t('Ziel-EC', 'Target EC')}</div>
              <div className="text-xl font-bold tabular-nums text-primary-300">{week.ec}</div>
            </div>
          )}
          <div className="text-xs font-semibold uppercase tracking-wide text-ink-500 mb-2">
            {t('Dünger diese Woche (in Mischreihenfolge)', 'Nutrients this week (in mixing order)')}
          </div>
          <div className="space-y-2">
            {schedule.products.filter((p) => week.doses[p.key]).length === 0 ? (
              <div className="text-sm text-ink-400">{t('Nur klares Wasser, kein Dünger.', 'Plain water only, no nutrients.')}</div>
            ) : (
              schedule.products
                .filter((p) => week.doses[p.key])
                .map((p) => (
                  <div
                    key={p.key}
                    className="flex items-center justify-between gap-3 rounded-lg bg-ink-850/60 border border-ink-800 px-3.5 py-2.5"
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-ink-100">{p.label}</span>
                        <span className="block text-[11px] text-ink-500 truncate">{p.role}</span>
                      </span>
                    </span>
                    <span className="text-sm font-bold text-ink-100 tabular-nums whitespace-nowrap">
                      {doseFromPerLiterDisplay(week.doses[p.key])}{' '}
                      <span className="text-xs text-ink-500 font-normal">
                        {week.doses[p.key] === AS_NEEDED ? '' : doseUnitShort()}
                      </span>
                    </span>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* Mischreihenfolge */}
      <div className="rounded-xl border border-ink-800 bg-ink-900/40 p-4 flex items-start gap-3">
        <ListOrdered size={16} className="text-primary-400 mt-0.5 shrink-0" />
        <div>
          <div className="text-xs font-semibold text-ink-200 mb-1">{t('Mischreihenfolge', 'Mixing order')}</div>
          <p className="text-xs text-ink-400 leading-relaxed">{schedule.mixOrder}</p>
        </div>
      </div>

      {/* Tabelle */}
      <div className="rounded-2xl border border-ink-800 bg-ink-900/60 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-800">
          <h3 className="text-sm font-semibold text-white">{t('Vollständiges Schema', 'Full schedule')}</h3>
          <span className="text-xs text-ink-500">{schedule.unit}</span>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-ink-800">
                <th className="sticky left-0 z-10 bg-ink-900 text-left px-4 py-3 text-xs font-semibold text-ink-400 uppercase tracking-wide whitespace-nowrap">
                  {t('Dünger', 'Nutrient')}
                </th>
                {schedule.weeks.map((w, i) => (
                  <th
                    key={w.label + i}
                    className="px-3 py-3 text-center text-xs font-semibold whitespace-nowrap cursor-pointer"
                    onClick={() => setActiveWeek(activeWeek === i ? null : i)}
                  >
                    <span
                      className={`px-2 py-1 rounded-md border ${
                        activeWeek === i
                          ? 'bg-primary-500/20 border-primary-500/40 text-primary-200'
                          : STAGE_BADGE[w.stage]
                      }`}
                    >
                      {w.label}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usedProducts.map((p) => (
                <tr key={p.key} className="border-b border-ink-850 hover:bg-ink-850/40">
                  <td className="sticky left-0 z-10 bg-ink-900 px-4 py-2.5 whitespace-nowrap">
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                      <span className="text-sm font-medium text-ink-200">{p.label}</span>
                    </span>
                  </td>
                  {schedule.weeks.map((w, i) => {
                    const val = w.doses[p.key];
                    return (
                      <td
                        key={i}
                        className={`px-3 py-2.5 text-center tabular-nums text-xs ${
                          val ? 'text-ink-100' : 'text-ink-700'
                        } ${activeWeek === i ? 'bg-primary-500/5' : ''}`}
                      >
                        {doseFromPerLiterDisplay(val) ?? '—'}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {hasEc && (
                <tr>
                  <td className="sticky left-0 z-10 bg-ink-900 px-4 py-2.5 text-xs font-semibold text-primary-300 uppercase tracking-wide whitespace-nowrap">
                    {t('Ziel-EC', 'Target EC')}
                  </td>
                  {schedule.weeks.map((w, i) => (
                    <td
                      key={i}
                      className={`px-3 py-2.5 text-center tabular-nums text-sm font-semibold text-primary-200 ${
                        activeWeek === i ? 'bg-primary-500/5' : ''
                      }`}
                    >
                      {w.ec ?? '—'}
                    </td>
                  ))}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hinweise */}
      <div className="rounded-xl border border-ink-800 bg-ink-900/40 p-4 flex items-start gap-3">
        <Info size={16} className="text-ink-500 mt-0.5 shrink-0" />
        <ul className="text-xs text-ink-500 leading-relaxed space-y-1 list-disc pl-4">
          {schedule.notes.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      </div>
    </>
  );
}

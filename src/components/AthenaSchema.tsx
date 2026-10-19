import { useState } from 'react';
import { FlaskConical, Droplets, Beaker, Info, BookOpen, ListOrdered } from 'lucide-react';
import {
  ATHENA_BLENDED,
  getAthenaPhTargets,
  getAthenaProducts,
  getMixingOrder,
  weekLabel,
  type AthenaColumn,
} from '@/lib/athenaData';
import { t, isEn, doseFromPer10L, AS_NEEDED } from '@/lib/i18n';

// Einheit der Athena-Detailtabelle: DE mL/10L, EN mL/gal (US)
const unitShort = () => (isEn() ? 'mL/gal' : 'mL/10L');

// Spalten in Mischreihenfolge: Balance → Basis A → Basis B → PK → CaMg → Fade → Cleanse
const PRODUCT_COLS: {
  key: keyof Pick<
    AthenaColumn,
    'balance' | 'growA' | 'growB' | 'bloomA' | 'bloomB' | 'pk' | 'caMg' | 'fade' | 'cleanse'
  >;
  label: string;
  color: string;
  order: number;
}[] = [
  { key: 'balance', label: 'Balance', color: '#a78bfa', order: 1 },
  { key: 'growA', label: 'Grow A', color: '#34d399', order: 2 },
  { key: 'growB', label: 'Grow B', color: '#10b981', order: 3 },
  { key: 'bloomA', label: 'Bloom A', color: '#fbbf24', order: 2 },
  { key: 'bloomB', label: 'Bloom B', color: '#f59e0b', order: 3 },
  { key: 'pk', label: 'PK', color: '#fb7185', order: 4 },
  { key: 'caMg', label: 'CaMg', color: '#60a5fa', order: 5 },
  { key: 'fade', label: 'Fade', color: '#34d399', order: 6 },
  { key: 'cleanse', label: 'Cleanse', color: '#22d3ee', order: 7 },
];

const STAGE_BADGE: Record<string, string> = {
  'Pre-Soak': 'text-ink-300 bg-ink-800 border-ink-700',
  Feed: 'text-ink-300 bg-ink-800 border-ink-700',
  Veg: 'text-accent-300 bg-accent-500/10 border-accent-500/30',
  Flower: 'text-warning-300 bg-warning-500/10 border-warning-500/30',
};

export default function AthenaSchema() {
  const [activeWeek, setActiveWeek] = useState<number | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showMixOrder, setShowMixOrder] = useState(false);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Intro */}
      <div className="rounded-2xl border border-ink-800 bg-ink-900/60 p-5">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 border border-primary-500/30 flex items-center justify-center shrink-0">
            <FlaskConical size={24} className="text-primary-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Athena Blended Line
            </h2>
            <p className="text-sm text-ink-400 mt-1 leading-relaxed">
              {t('Komplettes Düngeschema von Clone bis Blüte Woche 9. Alle Werte in', 'Complete feed schedule from clone to flower week 9. All values in')}{' '}
              <span className="text-ink-200 font-medium" data-testid="athena-unit-label">{t('mL pro 10 Liter', 'mL per US gallon')}</span>.{' '}
              {t('Klicke auf eine Woche für Details zu EC, PPM und pH-Werten.', 'Click a week for details on EC, PPM and pH values.')}
            </p>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <button
              onClick={() => setShowMixOrder((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-primary-300 bg-primary-500/10 hover:bg-primary-500/20 border border-primary-500/30 transition-colors"
            >
              <ListOrdered size={15} />
              <span className="hidden sm:inline">{showMixOrder ? t('Mischreihenfolge aus', 'Hide mixing order') : t('Mischreihenfolge', 'Mixing order')}</span>
            </button>
            <button
              onClick={() => setShowDetails((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-ink-300 bg-ink-850 hover:bg-ink-800 border border-ink-700/60 transition-colors"
            >
              <BookOpen size={15} />
              <span className="hidden sm:inline">{showDetails ? t('Produkte aus', 'Hide products') : t('Produkte', 'Products')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mischreihenfolge */}
      {showMixOrder && (
        <div className="rounded-2xl border border-primary-500/20 bg-primary-500/5 p-5 animate-slide-up">
          <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
            <ListOrdered size={16} className="text-primary-400" />
            {t('Mischreihenfolge', 'Mixing order')}
          </h3>
          <p className="text-xs text-ink-500 mb-4">
            {t(
              'Die Reihenfolge ist wichtig für eine ausgewogene Nährstoffversorgung. Balance immer als Erstes, Cleanse immer als Letztes.',
              'The order matters for a balanced nutrient supply. Always Balance first, always Cleanse last.'
            )}
          </p>
          <div className="space-y-2.5">
            {getMixingOrder().map((step) => (
              <div
                key={step.step}
                className="flex items-start gap-3 rounded-xl bg-ink-850/60 border border-ink-800 p-3.5"
              >
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
                  style={{
                    backgroundColor: `${step.color}1a`,
                    border: `1px solid ${step.color}44`,
                    color: step.color,
                  }}
                >
                  {step.step}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: step.color }}
                    />
                    <span className="text-sm font-semibold text-ink-100">{step.product}</span>
                  </div>
                  <p className="text-xs text-ink-500 mt-1 leading-relaxed">{step.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Produktübersicht (optional) */}
      {showDetails && (
        <div className="rounded-2xl border border-ink-800 bg-ink-900/60 p-5 animate-slide-up">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Droplets size={16} className="text-primary-400" />
            {t('Produktübersicht', 'Product overview')}
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {getAthenaProducts()
              .sort((a, b) => a.order - b.order)
              .map((p) => (
                <div
                  key={p.name}
                  className="rounded-xl border border-ink-800 bg-ink-850/60 p-3"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: p.color }}
                    />
                    <span className="text-sm font-semibold text-ink-100">{p.name}</span>
                    <span className="ml-auto text-[10px] font-bold text-ink-600">
                      #{p.order}
                    </span>
                  </div>
                  <p className="text-xs text-ink-500 leading-relaxed">{p.role}</p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Wochen-Selektor */}
      <div className="rounded-2xl border border-ink-800 bg-ink-900/60 p-5">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Beaker size={16} className="text-primary-400" />
          {t('Woche auswählen', 'Select week')}
        </h3>
        <div className="flex flex-wrap gap-2">
          {ATHENA_BLENDED.map((col) => {
            const isActive = activeWeek === col.week;
            const isVeg = col.stage === 'Veg';
            const isFlower = col.stage === 'Flower';
            return (
              <button
                key={col.week}
                onClick={() => setActiveWeek(isActive ? null : col.week)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                  isActive
                    ? 'bg-primary-500 text-ink-950 border-primary-400 shadow-glow'
                    : isVeg
                    ? 'text-accent-300 bg-accent-500/10 border-accent-500/30 hover:bg-accent-500/20'
                    : isFlower
                    ? 'text-warning-300 bg-warning-500/10 border-warning-500/30 hover:bg-warning-500/20'
                    : 'text-ink-300 bg-ink-850 border-ink-700/60 hover:bg-ink-800'
                }`}
              >
                {weekLabel(col.label)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Detail-Karte für gewählte Woche */}
      {activeWeek && <WeekDetail week={activeWeek} />}

      {/* Haupttabelle (horizontal scrollbar) */}
      <div className="rounded-2xl border border-ink-800 bg-ink-900/60 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-800">
          <h3 className="text-sm font-semibold text-white">{t('Vollständiges Schema', 'Full schedule')}</h3>
          <span className="text-xs text-ink-500">{t('mL / 10 Liter', 'mL / gallon')}</span>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-ink-800">
                <th className="sticky left-0 z-10 bg-ink-900 text-left px-4 py-3 text-xs font-semibold text-ink-400 uppercase tracking-wide whitespace-nowrap">
                  {t('Dünger', 'Nutrient')}
                </th>
                {ATHENA_BLENDED.map((col) => (
                  <th
                    key={col.week}
                    className="px-3 py-3 text-center text-xs font-semibold whitespace-nowrap"
                    onClick={() => setActiveWeek(activeWeek === col.week ? null : col.week)}
                    style={{ cursor: 'pointer' }}
                  >
                    <span
                      className={`px-2 py-1 rounded-md border ${
                        activeWeek === col.week
                          ? 'bg-primary-500/20 border-primary-500/40 text-primary-200'
                          : STAGE_BADGE[col.stage] ?? 'text-ink-400 border-ink-700 bg-ink-850'
                      }`}
                    >
                      {weekLabel(col.label)}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PRODUCT_COLS.map((pc) => (
                <tr key={pc.key} className="border-b border-ink-850 hover:bg-ink-850/40">
                  <td className="sticky left-0 z-10 bg-ink-900 px-4 py-2.5 whitespace-nowrap">
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: pc.color }}
                      />
                      <span className="text-sm font-medium text-ink-200">{pc.label}</span>
                      <span className="text-[10px] font-bold text-ink-600 ml-0.5">
                        #{pc.order}
                      </span>
                    </span>
                  </td>
                  {ATHENA_BLENDED.map((col) => {
                    const val = col[pc.key];
                    return (
                      <td
                        key={col.week}
                        className={`px-3 py-2.5 text-center tabular-nums text-xs ${
                          val ? 'text-ink-100' : 'text-ink-700'
                        } ${activeWeek === col.week ? 'bg-primary-500/5' : ''}`}
                      >
                        {doseFromPer10L(val) ?? '—'}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {/* EC / PPM Zeilen */}
              <tr className="border-b border-ink-850">
                <td className="sticky left-0 z-10 bg-ink-900 px-4 py-2.5 text-xs font-semibold text-primary-300 uppercase tracking-wide whitespace-nowrap">
                  EC
                </td>
                {ATHENA_BLENDED.map((col) => (
                  <td
                    key={col.week}
                    className={`px-3 py-2.5 text-center tabular-nums text-sm font-semibold text-primary-200 ${
                      activeWeek === col.week ? 'bg-primary-500/5' : ''
                    }`}
                  >
                    {col.ec.toFixed(1)}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-ink-850">
                <td className="sticky left-0 z-10 bg-ink-900 px-4 py-2.5 text-xs font-semibold text-ink-400 uppercase tracking-wide whitespace-nowrap">
                  PPM 500
                </td>
                {ATHENA_BLENDED.map((col) => (
                  <td
                    key={col.week}
                    className={`px-3 py-2.5 text-center tabular-nums text-ink-300 ${
                      activeWeek === col.week ? 'bg-primary-500/5' : ''
                    }`}
                  >
                    {col.ppm500}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="sticky left-0 z-10 bg-ink-900 px-4 py-2.5 text-xs font-semibold text-ink-400 uppercase tracking-wide whitespace-nowrap">
                  PPM 700
                </td>
                {ATHENA_BLENDED.map((col) => (
                  <td
                    key={col.week}
                    className={`px-3 py-2.5 text-center tabular-nums text-ink-300 ${
                      activeWeek === col.week ? 'bg-primary-500/5' : ''
                    }`}
                  >
                    {col.ppm700}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* pH-Wert Tabelle */}
      <div className="rounded-2xl border border-ink-800 bg-ink-900/60 p-5">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Beaker size={16} className="text-accent-400" />
          {t('Ziel-pH nach Phase & Substrat', 'Target pH by phase & medium')}
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {getAthenaPhTargets().map((row, i) => (
            <div
              key={i}
              className="rounded-xl border border-ink-800 bg-ink-850/60 p-3.5 flex items-center justify-between"
            >
              <div>
                <div className="text-sm font-semibold text-ink-100">{row.stage}</div>
                <div className="text-xs text-ink-500 mt-0.5">{row.media}</div>
              </div>
              <div className="text-lg font-bold text-primary-300 tabular-nums">
                {row.ph}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hinweis */}
      <div className="rounded-xl border border-ink-800 bg-ink-900/40 p-4 flex items-start gap-3">
        <Info size={16} className="text-ink-500 mt-0.5 shrink-0" />
        <p className="text-xs text-ink-500 leading-relaxed">
          {t('Werte gemäß Athena Ag, Inc. (Dokument', 'Values according to Athena Ag, Inc. (document')}{' '}
          <code className="text-ink-400">Blended_Feed_Schedule_Imperial</code>, {t('Referenz', 'reference')} A01.004),{' '}
          {t(
            'umgerechnet auf mL pro 10 Liter (1 US gal = 3,785 L). Düngeschemata sind Empfehlungen. Anpassungen können je nach Umwelt, Anbaumethode und Sorte nötig sein. Balance als pH-Heber jederzeit nach Bedarf einsetzen — nicht wöchentlich dosiert.',
            'shown in mL per US gallon (1 US gal = 3.785 L). Feed schedules are recommendations. Adjustments may be needed depending on environment, growing method and strain. Use Balance as pH up at any time as needed — not dosed weekly.'
          )}
        </p>
      </div>
    </div>
  );
}

function WeekDetail({ week }: { week: number }) {
  const col = ATHENA_BLENDED.find((c) => c.week === week);
  if (!col) return null;

  const activeProducts = PRODUCT_COLS.filter((pc) => col[pc.key]).sort(
    (a, b) => a.order - b.order
  );

  return (
    <div className="rounded-2xl border border-primary-500/30 bg-primary-500/5 p-5 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-white">{weekLabel(col.label)}</h3>
          <p className="text-sm text-ink-400 mt-0.5">Phase: {col.stage}</p>
        </div>
        <span
          className={`text-xs font-semibold px-3 py-1 rounded-full border ${
            STAGE_BADGE[col.stage] ?? 'text-ink-300 border-ink-700 bg-ink-850'
          }`}
        >
          {col.stage}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <DetailStat label="EC" value={col.ec.toFixed(1)} color="text-primary-300" />
        <DetailStat label="PPM 500" value={String(col.ppm500)} color="text-ink-100" />
        <DetailStat label="PPM 700" value={String(col.ppm700)} color="text-ink-100" />
      </div>

      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-ink-500 mb-2">
          {t('Düngemittel diese Woche (in Mischreihenfolge)', 'Nutrients this week (in mixing order)')}
        </div>
        {activeProducts.map((pc, idx) => (
          <div
            key={pc.key}
            className="flex items-center justify-between rounded-lg bg-ink-850/60 border border-ink-800 px-3.5 py-2.5"
          >
            <span className="flex items-center gap-2.5">
              <span
                className="h-6 w-6 rounded-md flex items-center justify-center text-[10px] font-bold"
                style={{
                  backgroundColor: `${pc.color}1a`,
                  border: `1px solid ${pc.color}44`,
                  color: pc.color,
                }}
              >
                {pc.order}
              </span>
              <span className="text-sm font-medium text-ink-100">{pc.label}</span>
            </span>
            <span className="text-sm font-bold text-ink-100 tabular-nums">
              {doseFromPer10L(col[pc.key])}{' '}
              <span className="text-xs text-ink-500 font-normal">
                {col[pc.key] === AS_NEEDED ? '' : unitShort()}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DetailStat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-ink-800 bg-ink-850/60 p-3 text-center">
      <div className="text-[10px] uppercase tracking-wide text-ink-500 mb-1">{label}</div>
      <div className={`text-xl font-bold tabular-nums ${color}`}>{value}</div>
    </div>
  );
}

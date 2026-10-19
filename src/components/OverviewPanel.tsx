import { useMemo, useState } from 'react';
import { Archive, Sprout, Leaf, Scale, Target } from 'lucide-react';
import type { AppData, Grow } from '@/types';
import PdfExportButton from './PdfExportButton';
import { buildOverviewReport } from '@/lib/pdfReport';
import { currentPhase } from '@/lib/growLogic';
import { withAutoCosts } from '@/lib/fertPrices';
import { useSelectedFertilizer } from '@/lib/fertilizerSelection';
import {
  aggregate,
  categoryColor,
  categoryLabel,
  costByCategory,
  formatGrams,
  formatMoney,
  growYear,
  plantsLabel,
  statsOf,
} from '@/lib/growStats';
import { t } from '@/lib/i18n';

interface Props {
  data: AppData;
  onOpenGrow: (id: string) => void;
}

export default function OverviewPanel({ data, onOpenGrow }: Props) {
  const [year, setYear] = useState<number | 'all'>('all');

  const years = useMemo(
    () => Array.from(new Set(data.grows.map(growYear))).sort((a, b) => b - a),
    [data.grows]
  );
  const globalFert = useSelectedFertilizer();
  // Grows inkl. automatisch berechneter Dünger-Kosten (aus Nährlösung × Preis)
  const grows: Grow[] = useMemo(() => {
    const filtered = data.grows
      .filter((g) => year === 'all' || growYear(g) === year)
      .sort((a, b) => ((a.milestones.cloneStart ?? a.createdAt) < (b.milestones.cloneStart ?? b.createdAt) ? 1 : -1));
    return withAutoCosts(filtered, data.grows, data.batches ?? [], globalFert, data.fertPrices, data.settings);
  }, [data.grows, data.batches, data.fertPrices, data.settings, globalFert, year]);

  const agg = aggregate(grows);
  const cats = costByCategory(grows);
  const maxCat = Math.max(1, ...cats.map((c) => c.amount));
  const yielded = grows.filter((g) => statsOf(g).yieldG !== undefined);
  const maxYield = Math.max(1, ...yielded.map((g) => statsOf(g).yieldG ?? 0));
  const yearLabel = year === 'all' ? t('Alle Jahre', 'All years') : String(year);

  return (
    <div className="space-y-6 animate-fade-in" data-testid="overview-panel">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Archive size={18} className="text-primary-400" />
            {t('Übersicht: Kosten & Ertrag', 'Overview: costs & yield')}
          </h2>
          <p className="text-sm text-ink-500 mt-0.5">
            {t(
              'Alle Grows im Vergleich – Pflanzen, Kosten, Ertrag und Kosten pro Gramm.',
              'All grows compared – plants, costs, yield and cost per gram.'
            )}
          </p>
        </div>
        {grows.length > 0 && (
          <PdfExportButton
            testid="overview-pdf"
            variant="primary"
            label={t('Übersicht als PDF', 'Overview as PDF')}
            build={() => buildOverviewReport(grows, yearLabel)}
          />
        )}
      </div>

      {/* Jahr-Filter */}
      {years.length > 0 && (
        <div className="flex flex-wrap gap-2" data-testid="year-filter">
          {(['all', ...years] as (number | 'all')[]).map((y) => (
            <button
              key={y}
              onClick={() => setYear(y)}
              data-testid={`year-${y}`}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                year === y
                  ? 'text-primary-300 bg-primary-500/10 border-primary-500/40'
                  : 'text-ink-400 bg-ink-900/60 border-ink-800 hover:text-ink-200'
              }`}
            >
              {y === 'all' ? t('Alle', 'All') : y}
            </button>
          ))}
        </div>
      )}

      {grows.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-ink-700/60 bg-ink-900/40 px-6 py-14 text-center text-sm text-ink-500">
          {t('Noch keine Grows vorhanden.', 'No grows yet.')}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat icon={<Sprout size={17} />} label={t('Grows / Pflanzen', 'Grows / plants')} value={`${agg.grows} / ${agg.plants}`} testid="ov-grows" />
            <Stat icon={<Leaf size={17} />} label={t('Ertrag gesamt', 'Total yield')} value={formatGrams(agg.yieldG || undefined, 1)} testid="ov-yield" />
            <Stat icon={<Scale size={17} />} label={t('Gesamtkosten', 'Total cost')} value={formatMoney(agg.cost)} testid="ov-cost" />
            <Stat icon={<Target size={17} />} label={t('Kosten / Gramm', 'Cost / gram')} value={formatMoney(agg.costPerGram)} testid="ov-cost-gram" tone />
          </div>
          <div className="text-xs text-ink-600 -mt-3">
            {t('Ø Ertrag pro Pflanze', 'Avg yield per plant')}: {formatGrams(agg.yieldPerPlant, 1)} ·{' '}
            {t('Kosten pro Gramm nur aus Grows mit eingetragener Erntemenge', 'Cost per gram only from grows with a harvest amount')}
          </div>

          {/* Tabelle */}
          <div className="rounded-2xl border border-ink-800 bg-ink-900/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="overview-table">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-ink-500 border-b border-ink-800">
                    <Th>{t('Grow', 'Grow')}</Th>
                    <Th right>{t('Pflanzen', 'Plants')}</Th>
                    <Th right>{t('Dauer', 'Days')}</Th>
                    <Th right>{t('Ertrag', 'Yield')}</Th>
                    <Th right>g / {t('Pfl.', 'pl.')}</Th>
                    <Th right>{t('Kosten', 'Cost')}</Th>
                    <Th right>€ / g</Th>
                  </tr>
                </thead>
                <tbody>
                  {grows.map((g) => {
                    const s = statsOf(g);
                    return (
                      <tr
                        key={g.id}
                        onClick={() => onOpenGrow(g.id)}
                        data-testid="overview-row"
                        className="border-b border-ink-850 last:border-0 hover:bg-ink-850/60 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: g.color }} />
                            <div className="min-w-0">
                              <div className="font-medium text-ink-100 truncate">{g.name}</div>
                              <div className="text-[11px] text-ink-500">
                                {growYear(g)} · {currentPhase(g).label}
                              </div>
                            </div>
                          </div>
                        </td>
                        <Td>{s.plants}</Td>
                        <Td>{s.days !== null ? `${s.days} ${t('T', 'd')}` : '—'}</Td>
                        <Td>{formatGrams(s.yieldG, 1)}</Td>
                        <Td>{formatGrams(s.yieldPerPlant, 1)}</Td>
                        <Td>{s.cost > 0 ? formatMoney(s.cost) : '—'}</Td>
                        <Td>{formatMoney(s.costPerGram)}</Td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="text-ink-100 font-semibold bg-ink-850/40">
                    <td className="px-4 py-3">{t('Summe', 'Total')}</td>
                    <Td>{agg.plants}</Td>
                    <Td>{''}</Td>
                    <Td>{formatGrams(agg.yieldG || undefined, 1)}</Td>
                    <Td>{formatGrams(agg.yieldPerPlant, 1)}</Td>
                    <Td>{formatMoney(agg.cost)}</Td>
                    <Td>{formatMoney(agg.costPerGram)}</Td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Ertrag pro Grow */}
            <div className="rounded-2xl border border-ink-800 bg-ink-900/60 p-5">
              <h3 className="text-sm font-semibold text-white mb-4">{t('Ertrag pro Grow', 'Yield per grow')}</h3>
              {yielded.length === 0 ? (
                <p className="text-xs text-ink-500">
                  {t('Noch keine Erntemengen eingetragen (Bereich „Trocknung“ im Grow).', 'No harvest amounts yet (“Drying” section in the grow).')}
                </p>
              ) : (
                <div className="space-y-2.5">
                  {yielded.map((g) => (
                    <BarRow key={g.id} label={g.name} sub={plantsLabel(statsOf(g).plants)} value={statsOf(g).yieldG ?? 0} max={maxYield} color={g.color} text={formatGrams(statsOf(g).yieldG, 1)} />
                  ))}
                </div>
              )}
            </div>

            {/* Kosten nach Kategorie */}
            <div className="rounded-2xl border border-ink-800 bg-ink-900/60 p-5">
              <h3 className="text-sm font-semibold text-white mb-4">{t('Kosten nach Kategorie', 'Costs by category')}</h3>
              {cats.length === 0 ? (
                <p className="text-xs text-ink-500">{t('Noch keine Kosten erfasst (Bereich „Kosten & Ertrag“ im Grow).', 'No costs yet (“Costs & yield” section in the grow).')}</p>
              ) : (
                <div className="space-y-2.5">
                  {cats.map((c) => (
                    <BarRow key={c.key} label={categoryLabel(c.key)} value={c.amount} max={maxCat} color={categoryColor(c.key)} text={formatMoney(c.amount)} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return <th className={`px-4 py-2.5 font-semibold ${right ? 'text-right' : 'text-left'}`}>{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 text-right tabular-nums text-ink-200 whitespace-nowrap">{children}</td>;
}

function Stat({ icon, label, value, testid, tone }: { icon: React.ReactNode; label: string; value: string; testid: string; tone?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 flex items-center gap-3.5 ${tone ? 'border-primary-500/20 bg-primary-500/10' : 'border-ink-800 bg-ink-900/60'}`}>
      <div className="h-10 w-10 rounded-xl flex items-center justify-center border text-primary-400 bg-primary-500/10 border-primary-500/20 shrink-0">{icon}</div>
      <div className="min-w-0">
        <div className="text-xl font-bold text-white tabular-nums leading-none truncate" data-testid={testid}>{value}</div>
        <div className="text-xs text-ink-500 mt-1">{label}</div>
      </div>
    </div>
  );
}

function BarRow({ label, sub, value, max, color, text }: { label: string; sub?: string; value: number; max: number; color: string; text: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-xs mb-1">
        <span className="text-ink-300 truncate">
          {label}
          {sub && <span className="text-ink-600"> · {sub}</span>}
        </span>
        <span className="tabular-nums text-ink-200 shrink-0">{text}</span>
      </div>
      <div className="h-2 rounded-full bg-ink-850 border border-ink-800 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${Math.max(2, (value / max) * 100)}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

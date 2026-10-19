import { useState } from 'react';
import { Scale, Leaf, Plus, Trash2, Sprout, FlaskConical, ChevronDown } from 'lucide-react';
import type { CostCategory, CostEntry, Grow, NutrientBatch } from '@/types';
import DateField from './DateField';
import DarkSelect from './DarkSelect';
import FertPriceEditor from './FertPriceEditor';
import { autoFertCost, withAutoCosts } from '@/lib/fertPrices';
import { useSelectedFertilizer } from '@/lib/fertilizerSelection';
import { formatMl } from '@/lib/fertUsage';
import { formatDate } from '@/lib/growLogic';
import {
  COST_CATEGORIES,
  categoryColor,
  categoryLabel,
  costByCategory,
  costsOf,
  formatGrams,
  formatMoney,
  plantsLabel,
  statsOf,
} from '@/lib/growStats';
import { t } from '@/lib/i18n';

interface Props {
  grow: Grow;
  allGrows: Grow[];
  batches: NutrientBatch[];
  fertPrices: Record<string, number> | undefined;
  onFertPricesChange: (prices: Record<string, number> | undefined) => void;
  onToggleAuto: (enabled: boolean) => void;
  onChange: (costs: CostEntry[] | undefined) => void;
}

const inputCls =
  'w-full bg-ink-850 border border-ink-700/70 rounded-xl px-3 py-2.5 text-sm text-ink-100 placeholder-ink-600 focus:outline-none focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/20 transition-all';

export default function CostsPanel({ grow, allGrows, batches, fertPrices, onFertPricesChange, onToggleAuto, onChange }: Props) {
  const [category, setCategory] = useState<CostCategory>('nutrients');
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState<string | undefined>(undefined);

  const globalFert = useSelectedFertilizer();
  const [showPrices, setShowPrices] = useState(false);
  const costs = costsOf(grow);
  // Dünger-Kosten automatisch aus der Nährlösung (Verbrauch × Preis) – fließen in Summen und Auswertungen ein
  const auto = autoFertCost(grow, allGrows, batches, globalFert, fertPrices);
  const eff = withAutoCosts([grow], allGrows, batches, globalFert, fertPrices)[0];
  const stats = statsOf(eff);
  const breakdown = costByCategory([eff]);
  const manualNutrients = costs.filter((c) => c.category === 'nutrients').reduce((sum, c) => sum + c.amount, 0);
  const maxCat = Math.max(1, ...breakdown.map((b) => b.amount));

  const amountNum = Number(amount.replace(',', '.'));
  const canAdd = amount.trim() !== '' && Number.isFinite(amountNum) && amountNum > 0;

  const add = () => {
    if (!canAdd) return;
    const entry: CostEntry = {
      id: crypto.randomUUID(),
      category,
      label: label.trim() || undefined,
      amount: Math.round(amountNum * 100) / 100,
      date,
    };
    onChange([...costs, entry]);
    setLabel('');
    setAmount('');
    setDate(undefined);
  };

  const remove = (id: string) => {
    const next = costs.filter((c) => c.id !== id);
    onChange(next.length ? next : undefined);
  };

  const sorted = [...costs].sort((a, b) => (a.date ?? '') < (b.date ?? '') ? 1 : -1);

  return (
    <div data-testid="costs-panel">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <Scale size={16} className="text-primary-400" />
          {t('Kosten & Ertrag', 'Costs & yield')}
        </h3>
        <p className="text-xs text-ink-500 mt-0.5">
          {t(
            'Erfasse die Kosten dieses Grows. Die Erntemenge trägst du im Bereich „Trocknung“ ein – daraus ergeben sich Ertrag pro Pflanze und Kosten pro Gramm.',
            'Log the costs of this grow. Enter the harvest amount in the “Drying” section – yield per plant and cost per gram are calculated from it.'
          )}
        </p>
      </div>

      {/* Kennzahlen */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-5">
        <Tile label={t('Gesamtkosten', 'Total cost')} value={formatMoney(stats.cost)} testid="tile-cost" />
        <Tile label={t('Kosten / Pflanze', 'Cost / plant')} value={formatMoney(stats.costPerPlant)} testid="tile-cost-plant" />
        <Tile label={t('Ertrag gesamt', 'Total yield')} value={formatGrams(stats.yieldG, 1)} testid="tile-yield" icon={<Leaf size={13} />} />
        <Tile label={t('Ertrag / Pflanze', 'Yield / plant')} value={formatGrams(stats.yieldPerPlant, 1)} testid="tile-yield-plant" icon={<Sprout size={13} />} />
        <Tile label={t('Kosten / Gramm', 'Cost / gram')} value={formatMoney(stats.costPerGram)} testid="tile-cost-gram" tone />
      </div>
      <div className="text-xs text-ink-600 -mt-3 mb-5">
        {plantsLabel(stats.plants)}
        {stats.yieldG === undefined && ` · ${t('noch keine Erntemenge eingetragen', 'no harvest amount entered yet')}`}
      </div>

      {/* Aufschlüsselung */}
      {breakdown.length > 0 && (
        <div className="mb-5 space-y-2" data-testid="cost-breakdown">
          {breakdown.map((b) => (
            <div key={b.key} className="flex items-center gap-3 text-xs">
              <span className="w-32 shrink-0 text-ink-400 truncate">{categoryLabel(b.key)}</span>
              <div className="flex-1 h-2 rounded-full bg-ink-850 border border-ink-800 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(b.amount / maxCat) * 100}%`, backgroundColor: categoryColor(b.key) }}
                />
              </div>
              <span className="w-24 text-right tabular-nums text-ink-200">{formatMoney(b.amount)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Dünger-Kosten automatisch aus der Nährlösung */}
      <div className="rounded-2xl border border-primary-500/25 bg-primary-500/5 p-4 mb-4" data-testid="auto-fert-cost">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-3 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-primary-500/10 border border-primary-500/20 flex items-center justify-center shrink-0 text-primary-300">
              <FlaskConical size={16} />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">{t('Dünger-Kosten automatisch', 'Fertilizer costs automatic')}</div>
              <p className="text-xs text-ink-400 mt-0.5 leading-relaxed">
                {t(
                  'Berechnet aus deinem Dünger-Verbrauch (aus den angemischten Ansätzen) × Preis pro Liter. Du musst Dünger nicht von Hand eintragen.',
                  'Calculated from your fertilizer usage (from the mixed batches) × price per liter. You do not have to enter fertilizer by hand.'
                )}
              </p>
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs text-ink-300 cursor-pointer select-none shrink-0">
            <input
              data-testid="auto-fert-toggle"
              type="checkbox"
              checked={auto.enabled}
              onChange={(e) => onToggleAuto(e.target.checked)}
              className="accent-emerald-500 h-4 w-4"
            />
            {t('einrechnen', 'include')}
          </label>
        </div>

        {!auto.hasUsage ? (
          <p className="text-xs text-ink-500 mt-3" data-testid="auto-fert-empty">
            {t(
              'Noch kein Verbrauch vorhanden – trage im Reiter „Nährlösung“ deine angemischten Ansätze ein, dann erscheinen die Kosten hier automatisch.',
              'No usage yet – log your mixed batches in the “Nutrient mix” tab and the costs appear here automatically.'
            )}
          </p>
        ) : (
          <>
            <div className="flex items-end justify-between gap-3 mt-3">
              <div>
                <div className="text-[10px] uppercase tracking-wide text-ink-500">{t('Dünger-Kosten (berechnet)', 'Fertilizer costs (calculated)')}</div>
                <div className={`text-2xl font-bold tabular-nums ${auto.enabled ? 'text-white' : 'text-ink-600 line-through'}`} data-testid="auto-fert-amount">
                  {formatMoney(auto.amount)}
                </div>
              </div>
              {!auto.enabled && <span className="text-xs text-warning-300">{t('wird nicht eingerechnet', 'not included')}</span>}
            </div>

            <div className="mt-3 rounded-xl border border-ink-800 bg-ink-900/50 overflow-x-auto">
              <table className="w-full text-xs" data-testid="auto-fert-table">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wide text-ink-500 border-b border-ink-800">
                    <th className="px-3 py-2 text-left font-semibold">{t('Produkt', 'Product')}</th>
                    <th className="px-3 py-2 text-right font-semibold">{t('Verbrauch', 'Used')}</th>
                    <th className="px-3 py-2 text-right font-semibold">{t('Preis / Liter', 'Price / liter')}</th>
                    <th className="px-3 py-2 text-right font-semibold">{t('Kosten', 'Cost')}</th>
                  </tr>
                </thead>
                <tbody>
                  {auto.lines.map((l) => (
                    <tr key={`${l.scheduleId}-${l.productKey}`} className="border-b border-ink-850 last:border-0" data-testid="auto-fert-row">
                      <td className="px-3 py-1.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: l.color }} />
                          <span className="text-ink-200">{l.label}</span>
                        </span>
                      </td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-ink-300 whitespace-nowrap">{formatMl(l.ml)}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-ink-300 whitespace-nowrap">
                        {formatMoney(l.pricePerL)}
                        {l.custom && <span className="ml-1 text-primary-400" title={t('eigener Preis', 'custom price')}>●</span>}
                      </td>
                      <td className="px-3 py-1.5 text-right tabular-nums font-semibold text-ink-100 whitespace-nowrap">{formatMoney(l.cost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {auto.enabled && manualNutrients > 0 && (
              <div className="mt-3 rounded-lg border border-warning-500/30 bg-warning-500/5 px-3 py-2 text-xs text-warning-300" data-testid="auto-fert-double">
                {t(
                  `Achtung: Du hast zusätzlich manuelle Einträge in der Kategorie „Dünger“ (${formatMoney(manualNutrients)}). Diese werden zusätzlich gezählt – lösche sie oder schalte „einrechnen“ aus, wenn derselbe Dünger doppelt erfasst ist.`,
                  `Note: you also have manual entries in the “Nutrients” category (${formatMoney(manualNutrients)}). They are counted in addition – delete them or switch “include” off if the same fertilizer is entered twice.`
                )}
              </div>
            )}

            <button
              type="button"
              data-testid="auto-fert-prices-toggle"
              onClick={() => setShowPrices((v) => !v)}
              className="mt-3 flex items-center gap-1.5 text-xs font-medium text-primary-300 hover:text-primary-200"
            >
              <ChevronDown size={13} className={`transition-transform ${showPrices ? 'rotate-180' : ''}`} />
              {t('Preise anpassen (Durchschnittspreise sind voreingestellt)', 'Adjust prices (average prices are preset)')}
            </button>
            {showPrices && (
              <div className="mt-3 space-y-4">
                {auto.schedules.map((sch) => (
                  <FertPriceEditor key={sch.id} schedule={sch} prices={fertPrices} onChange={onFertPricesChange} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Neuer Eintrag */}
      <div className="rounded-2xl border border-ink-800 bg-ink-850/40 p-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="block">
            <span className="text-sm font-medium text-ink-200 mb-1.5 block">{t('Kategorie', 'Category')}</span>
            <DarkSelect
              testid="cost-category"
              value={category}
              onChange={(v) => setCategory(v as CostCategory)}
              options={COST_CATEGORIES.map((c) => ({ value: c.key, label: categoryLabel(c.key) }))}
            />
          </div>
          <label className="block">
            <span className="text-sm font-medium text-ink-200 mb-1.5 block">
              {t('Betrag', 'Amount')} (€)
            </span>
            <input
              data-testid="cost-amount"
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && add()}
              placeholder="0,00"
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink-200 mb-1.5 block">
              {t('Beschreibung', 'Description')} <span className="text-ink-600 font-normal">(optional)</span>
            </span>
            <input
              data-testid="cost-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && add()}
              placeholder={t('z. B. Bloom-Dünger, Stromrechnung Mai', 'e.g. bloom nutrients, power bill May')}
              className={inputCls}
            />
          </label>
          <DateField label={`${t('Datum', 'Date')} (${t('optional', 'optional')})`} value={date} onChange={setDate} accentColor={grow.color} />
        </div>
        <button
          data-testid="cost-add"
          onClick={add}
          disabled={!canAdd}
          className="mt-4 flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold text-ink-950 bg-primary-500 hover:bg-primary-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-glow"
        >
          <Plus size={16} />
          {t('Kosten hinzufügen', 'Add cost')}
        </button>
      </div>

      {/* Liste */}
      {sorted.length > 0 && (
        <div className="mt-4 space-y-1.5" data-testid="cost-list">
          {sorted.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 rounded-xl border border-ink-800 bg-ink-850/60 px-3.5 py-2.5 text-sm"
            >
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: categoryColor(c.category) }} />
              <div className="flex-1 min-w-0">
                <div className="text-ink-100 truncate">
                  {categoryLabel(c.category)}
                  {c.label && <span className="text-ink-400"> · {c.label}</span>}
                </div>
                {c.date && <div className="text-[11px] text-ink-600">{formatDate(c.date)}</div>}
              </div>
              <span className="tabular-nums font-semibold text-ink-100">{formatMoney(c.amount)}</span>
              <button
                onClick={() => remove(c.id)}
                className="h-7 w-7 rounded-lg flex items-center justify-center text-ink-500 hover:text-error-400 hover:bg-error-500/10 transition-colors"
                title={t('Löschen', 'Delete')}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Tile({
  label,
  value,
  testid,
  icon,
  tone,
}: {
  label: string;
  value: string;
  testid: string;
  icon?: React.ReactNode;
  tone?: boolean;
}) {
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

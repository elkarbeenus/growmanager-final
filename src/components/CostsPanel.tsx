import { useState } from 'react';
import { Scale, Leaf, Plus, Trash2, Sprout } from 'lucide-react';
import type { CostCategory, CostEntry, Grow } from '@/types';
import DateField from './DateField';
import DarkSelect from './DarkSelect';
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
  onChange: (costs: CostEntry[] | undefined) => void;
}

const inputCls =
  'w-full bg-ink-850 border border-ink-700/70 rounded-xl px-3 py-2.5 text-sm text-ink-100 placeholder-ink-600 focus:outline-none focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/20 transition-all';

export default function CostsPanel({ grow, onChange }: Props) {
  const [category, setCategory] = useState<CostCategory>('nutrients');
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState<string | undefined>(undefined);

  const costs = costsOf(grow);
  const stats = statsOf(grow);
  const breakdown = costByCategory([grow]);
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

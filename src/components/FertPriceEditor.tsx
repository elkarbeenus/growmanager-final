import { useEffect, useState } from 'react';
import { RotateCcw, Info } from 'lucide-react';
import type { FertSchedule } from '@/lib/fertilizerData';
import { defaultPrice, isCustomPrice, priceKey } from '@/lib/fertPrices';
import { t } from '@/lib/i18n';

interface Props {
  schedule: FertSchedule;
  prices: Record<string, number> | undefined;
  onChange: (next: Record<string, number> | undefined) => void;
}

/** Preise (€ pro Liter) der Produkte eines Düngeschemas anpassen. Leer = Durchschnittspreis. */
export default function FertPriceEditor({ schedule, prices, onChange }: Props) {
  const set = (key: string, value: number | undefined) => {
    const next = { ...(prices ?? {}) };
    if (value === undefined) delete next[key];
    else next[key] = value;
    onChange(Object.keys(next).length ? next : undefined);
  };

  const anyCustom = schedule.products.some((p) => isCustomPrice(schedule.id, p.key, prices));
  const resetAll = () => {
    const next = { ...(prices ?? {}) };
    for (const p of schedule.products) delete next[priceKey(schedule.id, p.key)];
    onChange(Object.keys(next).length ? next : undefined);
  };

  return (
    <div data-testid="price-editor">
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div className="text-xs font-semibold uppercase tracking-widest text-ink-500">
          {schedule.brand} · {t('Preise in € pro Liter', 'prices in € per liter')}
        </div>
        {anyCustom && (
          <button
            data-testid="price-reset"
            onClick={resetAll}
            className="flex items-center gap-1.5 text-xs text-ink-400 hover:text-white transition-colors"
          >
            <RotateCcw size={12} />
            {t('Auf Durchschnittspreise zurücksetzen', 'Reset to average prices')}
          </button>
        )}
      </div>
      <div className="grid sm:grid-cols-2 gap-2">
        {schedule.products.map((p) => (
          <PriceRow
            key={p.key}
            label={p.label}
            color={p.color}
            testid={`price-${schedule.id}-${p.key}`}
            def={defaultPrice(schedule.id, p.key)}
            value={prices?.[priceKey(schedule.id, p.key)]}
            onCommit={(v) => set(priceKey(schedule.id, p.key), v)}
          />
        ))}
      </div>
      <div className="flex gap-2.5 text-[11px] text-ink-600 leading-relaxed mt-3">
        <Info size={13} className="shrink-0 mt-0.5" />
        <span>
          {t(
            'Die Vorgabewerte sind grobe Durchschnittspreise (Richtwerte, Stand 2026) pro Liter Produkt. Trage deine echten Preise ein (Flaschenpreis ÷ Flaschengröße in Litern), dann stimmt die Kostenrechnung genau. Leer lassen = Durchschnittspreis.',
            'The default values are rough average prices (guideline, 2026) per liter of product. Enter your real prices (bottle price ÷ bottle size in liters) for an exact cost calculation. Leave empty = average price.'
          )}
        </span>
      </div>
    </div>
  );
}

function PriceRow({
  label,
  color,
  def,
  value,
  testid,
  onCommit,
}: {
  label: string;
  color: string;
  def: number;
  value: number | undefined;
  testid: string;
  onCommit: (v: number | undefined) => void;
}) {
  const [text, setText] = useState(value !== undefined ? String(value) : '');
  useEffect(() => setText(value !== undefined ? String(value) : ''), [value]);

  const change = (raw: string) => {
    setText(raw);
    const trimmed = raw.trim().replace(',', '.');
    if (trimmed === '') return onCommit(undefined);
    const n = Number(trimmed);
    if (Number.isFinite(n) && n >= 0) onCommit(n);
  };

  return (
    <label className="flex items-center gap-3 rounded-xl border border-ink-800 bg-ink-850/50 px-3 py-2">
      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <span className="flex-1 min-w-0 text-sm text-ink-100 truncate">{label}</span>
      <span className="relative">
        <input
          data-testid={testid}
          type="text"
          inputMode="decimal"
          value={text}
          onChange={(e) => change(e.target.value)}
          placeholder={String(def)}
          className={`w-24 bg-ink-900 border rounded-lg pl-2.5 pr-7 py-1.5 text-sm text-right tabular-nums focus:outline-none focus:border-primary-500/60 ${
            value !== undefined ? 'border-primary-500/40 text-white' : 'border-ink-700/70 text-ink-300'
          }`}
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-ink-600 pointer-events-none">€</span>
      </span>
    </label>
  );
}

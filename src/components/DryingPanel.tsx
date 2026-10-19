import { Wind, Thermometer, Droplets, CalendarDays, StickyNote, Cloud, Scale } from 'lucide-react';
import type { DryingData, Grow } from '@/types';
import { t } from '@/lib/i18n';

interface DryingPanelProps {
  grow: Grow;
  onChange: (drying: DryingData | undefined) => void;
}

export default function DryingPanel({ grow, onChange }: DryingPanelProps) {
  const drying = grow.drying ?? {};
  const hasData =
    drying.daysDried !== undefined ||
    drying.tempMin !== undefined ||
    drying.tempMax !== undefined ||
    drying.humidity !== undefined ||
    drying.harvestAmount !== undefined ||
    !!drying.notes;

  const set = (patch: Partial<DryingData>) => {
    const next: DryingData = { ...drying, ...patch };
    const cleaned: DryingData = {};
    if (next.daysDried !== undefined) cleaned.daysDried = next.daysDried;
    if (next.tempMin !== undefined) cleaned.tempMin = next.tempMin;
    if (next.tempMax !== undefined) cleaned.tempMax = next.tempMax;
    if (next.humidity !== undefined) cleaned.humidity = next.humidity;
    if (next.harvestAmount !== undefined) cleaned.harvestAmount = next.harvestAmount;
    if (next.notes !== undefined) cleaned.notes = next.notes;
    if (Object.keys(cleaned).length === 0) {
      onChange(undefined);
    } else {
      onChange(cleaned);
    }
  };

  const num = (s: string): number | undefined => {
    if (s.trim() === '') return undefined;
    const n = Number(s);
    return Number.isFinite(n) ? n : undefined;
  };

  const tempDisplay = (() => {
    if (drying.tempMin !== undefined && drying.tempMax !== undefined)
      return `${drying.tempMin}–${drying.tempMax}°C`;
    if (drying.tempMin !== undefined) return `${drying.tempMin}°C`;
    if (drying.tempMax !== undefined) return `${drying.tempMax}°C`;
    return '—';
  })();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Cloud size={16} className="text-primary-400" />
            {t('Trocknung', 'Drying')}
          </h3>
          <p className="text-xs text-ink-500 mt-0.5">
            {t('Dauer, Temperatur (von–bis), relative Luftfeuchtigkeit (RLF) und Erntemenge protokollieren.', 'Log duration, temperature (min–max), relative humidity (RH) and harvest yield.')}
          </p>
        </div>
        {hasData && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="text-xs text-ink-500 hover:text-error-400 transition-colors"
          >
            {t('Trocknungsdaten löschen', 'Clear drying data')}
          </button>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Tage getrocknet */}
        <Field
          icon={<CalendarDays size={14} />}
          label={t('Tage getrocknet', 'Days dried')}
          suffix={t('Tage', 'days')}
        >
          <input
            type="number"
            min={0}
            step={1}
            value={drying.daysDried ?? ''}
            onChange={(e) => set({ daysDried: num(e.target.value) })}
            placeholder={t('z.B. 14', 'e.g. 14')}
            className="w-full bg-ink-850 border border-ink-700/70 rounded-xl px-3 py-2.5 text-sm text-ink-100 placeholder-ink-600 focus:outline-none focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/20 transition-all"
          />
        </Field>

        {/* Temperatur von–bis */}
        <div className="lg:col-span-2">
          <span className="text-xs font-medium text-ink-400 mb-1.5 flex items-center gap-1.5">
            <span className="text-primary-400"><Thermometer size={14} /></span>
            {t('Temperatur', 'Temperature')} <span className="text-ink-600 font-normal">· {t('von – bis', 'min – max')} · °C</span>
          </span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step={0.5}
              value={drying.tempMin ?? ''}
              onChange={(e) => set({ tempMin: num(e.target.value) })}
              placeholder={t('z.B. 16', 'e.g. 16')}
              className="w-full bg-ink-850 border border-ink-700/70 rounded-xl px-3 py-2.5 text-sm text-ink-100 placeholder-ink-600 focus:outline-none focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/20 transition-all"
            />
            <span className="text-ink-500 text-sm shrink-0">–</span>
            <input
              type="number"
              step={0.5}
              value={drying.tempMax ?? ''}
              onChange={(e) => set({ tempMax: num(e.target.value) })}
              placeholder={t('z.B. 20', 'e.g. 20')}
              className="w-full bg-ink-850 border border-ink-700/70 rounded-xl px-3 py-2.5 text-sm text-ink-100 placeholder-ink-600 focus:outline-none focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/20 transition-all"
            />
          </div>
        </div>

        {/* RLF */}
        <Field
          icon={<Droplets size={14} />}
          label={t('Luftfeuchtigkeit', 'Humidity')}
          suffix={t('% RLF', '% RH')}
        >
          <input
            type="number"
            min={0}
            max={100}
            step={1}
            value={drying.humidity ?? ''}
            onChange={(e) => set({ humidity: num(e.target.value) })}
            placeholder={t('z.B. 60', 'e.g. 60')}
            className="w-full bg-ink-850 border border-ink-700/70 rounded-xl px-3 py-2.5 text-sm text-ink-100 placeholder-ink-600 focus:outline-none focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/20 transition-all"
          />
        </Field>

        {/* Erntemenge */}
        <Field
          icon={<Scale size={14} />}
          label={t('Erntemenge', 'Harvest yield')}
          suffix={t('Gramm', 'grams')}
        >
          <input
            type="number"
            min={0}
            step={1}
            value={drying.harvestAmount ?? ''}
            onChange={(e) => set({ harvestAmount: num(e.target.value) })}
            placeholder={t('z.B. 450', 'e.g. 450')}
            className="w-full bg-ink-850 border border-ink-700/70 rounded-xl px-3 py-2.5 text-sm text-ink-100 placeholder-ink-600 focus:outline-none focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/20 transition-all"
          />
        </Field>
      </div>

      {/* Notiz — mit Enter für Leerzeilen */}
      <label className="block">
        <span className="text-xs font-medium text-ink-400 mb-1.5 flex items-center gap-1.5">
          <span className="text-primary-400"><StickyNote size={14} /></span>
          {t('Trocknungs-Notiz', 'Drying note')} <span className="text-ink-600 font-normal">(optional)</span>
        </span>
        <textarea
          value={drying.notes ?? ''}
          onChange={(e) => set({ notes: e.target.value || undefined })}
          rows={3}
          placeholder={t('Trim-Methode, Branch-Trocknung vs. ganze Pflanze, Beobachtungen zum Trocknungsverlauf…', 'Trim method, branch drying vs. whole plant, observations on the drying process…')}
          className="w-full bg-ink-850 border border-ink-700/70 rounded-xl px-3.5 py-2.5 text-sm text-ink-100 placeholder-ink-600 focus:outline-none focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/20 transition-all resize-y"
        />
      </label>

      {/* Zusammenfassung wenn Daten vorhanden */}
      {hasData && (
        <div className="rounded-xl border border-ink-800 bg-ink-850/40 p-4 animate-fade-in">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <SummaryItem label={t('Tage', 'Days')} value={drying.daysDried !== undefined ? `${drying.daysDried}` : '—'} />
            <SummaryItem label={t('Temp.', 'Temp.')} value={tempDisplay} />
            <SummaryItem label={t('RLF', 'RH')} value={drying.humidity !== undefined ? `${drying.humidity}%` : '—'} />
            <SummaryItem label={t('Ernte', 'Harvest')} value={drying.harvestAmount !== undefined ? `${drying.harvestAmount}g` : '—'} />
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  icon,
  label,
  suffix,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  suffix?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-ink-400 mb-1.5 flex items-center gap-1.5">
        <span className="text-primary-400">{icon}</span>
        {label}
        {suffix && <span className="text-ink-600 font-normal">· {suffix}</span>}
      </span>
      {children}
    </label>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-ink-500">{label}</div>
      <div className="text-base font-bold text-ink-100 tabular-nums mt-0.5">{value}</div>
    </div>
  );
}

import type { Device, DeviceUsage } from '@/types';
import { deviceTypeLabel, devicePhaseLabel, hasGrowUsage } from '@/lib/power';
import { t } from '@/lib/i18n';

interface Props {
  devices: Device[]; // alle Geräte aus den Einstellungen
  selectedIds: string[]; // im Grow genutzte Geräte
  usage: Record<string, DeviceUsage> | undefined;
  onChange: (usage: Record<string, DeviceUsage> | undefined) => void;
  testid?: string;
}

const inputCls =
  'w-full bg-ink-850 border border-ink-700/70 rounded-lg px-2.5 py-1.5 text-sm text-ink-100 placeholder-ink-600 focus:outline-none focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/20 tabular-nums';

const parse = (v: string, max: number): number | undefined => {
  if (v.trim() === '') return undefined;
  const n = Number(v.replace(',', '.'));
  return Number.isFinite(n) ? Math.min(max, Math.max(0, n)) : undefined;
};

/** Laufzeit von Ent-/Befeuchter pro Grow: Stunden pro Tag und Anzahl Wochen (für genauere Stromkosten). */
export default function DeviceUsageFields({ devices, selectedIds, usage, onChange, testid = 'device-usage' }: Props) {
  const list = devices.filter((d) => selectedIds.includes(d.id) && hasGrowUsage(d));
  if (list.length === 0) return null;

  const set = (id: string, patch: Partial<DeviceUsage>) => {
    const next: Record<string, DeviceUsage> = { ...(usage ?? {}) };
    const merged = { ...(next[id] ?? {}), ...patch };
    if (merged.hours === undefined && merged.weeks === undefined) delete next[id];
    else next[id] = merged;
    onChange(Object.keys(next).length ? next : undefined);
  };

  return (
    <div className="rounded-xl border border-ink-800 bg-ink-900/50 p-3 space-y-2.5" data-testid={testid}>
      <div className="text-xs font-semibold text-ink-200">{t('Laufzeit in diesem Grow', 'Run time in this grow')}</div>
      {list.map((d) => {
        const u = usage?.[d.id];
        return (
          <div key={d.id} className="grid grid-cols-[1fr_auto_auto] items-end gap-2" data-testid={`${testid}-${d.id}`}>
            <div className="min-w-0">
              <div className="text-sm text-ink-100 truncate">{d.name}</div>
              <div className="text-[11px] text-ink-500 truncate">
                {deviceTypeLabel(d.type)} · {d.watts} W · {devicePhaseLabel(d.phase)}
              </div>
            </div>
            <label className="block w-24">
              <span className="text-[11px] text-ink-500 mb-0.5 block">{t('Std./Tag', 'h/day')}</span>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                max={24}
                step={0.5}
                data-testid={`${testid}-${d.id}-hours`}
                value={u?.hours ?? ''}
                placeholder={String(d.hours)}
                onChange={(e) => set(d.id, { hours: parse(e.target.value, 24) })}
                className={inputCls}
              />
            </label>
            <label className="block w-24">
              <span className="text-[11px] text-ink-500 mb-0.5 block">{t('Wochen', 'Weeks')}</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={52}
                step={1}
                data-testid={`${testid}-${d.id}-weeks`}
                value={u?.weeks ?? ''}
                placeholder={t('alle', 'all')}
                onChange={(e) => set(d.id, { weeks: parse(e.target.value, 52) })}
                className={inputCls}
              />
            </label>
          </div>
        );
      })}
      <p className="text-[11px] text-ink-500 leading-relaxed">
        {t(
          'Leer = Vorgabe aus den Einstellungen (Stunden) bzw. die ganze Phase (Wochen). Mit Wochen läuft das Gerät nur so lange, ab dem ersten Tag seiner Phase.',
          'Empty = default from Settings (hours) or the whole phase (weeks). With weeks the device only runs that long, starting on the first day of its phase.'
        )}
      </p>
    </div>
  );
}

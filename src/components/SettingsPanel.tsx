import { useEffect, useState } from 'react';
import { Settings, Plus, Trash2, Zap, Info } from 'lucide-react';
import DarkSelect from './DarkSelect';
import type { AppSettings, Device, DevicePhase, DeviceType, Grow, Lamp } from '@/types';
import ConfirmDialog from './ConfirmDialog';
import { DEFAULT_DEVICE_HOURS, DEFAULT_HOURS_FLOWER, DEFAULT_HOURS_VEG, DEVICE_TYPES, devicePhaseLabel, deviceTypeLabel, kwhPerDay } from '@/lib/power';
import { formatMoney } from '@/lib/growStats';
import { t, fmtNum } from '@/lib/i18n';

interface Props {
  settings: AppSettings | undefined;
  grows: Grow[];
  onChange: (settings: AppSettings | undefined) => void;
}

const inputCls =
  'w-full bg-ink-850 border border-ink-700/70 rounded-xl px-3 py-2.5 text-sm text-ink-100 placeholder-ink-600 focus:outline-none focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/20 transition-all';

/** Zahleneingabe mit eigenem Textzustand (erlaubt "0," beim Tippen); leer = nicht gesetzt. */
function NumField({
  value,
  onCommit,
  placeholder,
  suffix,
  testid,
  min = 0,
  max = 100000,
  className = '',
}: {
  value: number | undefined;
  onCommit: (v: number | undefined) => void;
  placeholder?: string;
  suffix?: string;
  testid?: string;
  min?: number;
  max?: number;
  className?: string;
}) {
  const [text, setText] = useState(value !== undefined ? String(value) : '');
  useEffect(() => setText(value !== undefined ? String(value) : ''), [value]);
  return (
    <span className={`relative block ${className}`}>
      <input
        data-testid={testid}
        type="text"
        inputMode="decimal"
        value={text}
        placeholder={placeholder}
        onChange={(e) => {
          setText(e.target.value);
          const tr = e.target.value.trim().replace(',', '.');
          if (tr === '') return onCommit(undefined);
          const n = Number(tr);
          if (Number.isFinite(n) && n >= min && n <= max) onCommit(n);
        }}
        className={`${inputCls} ${suffix ? 'pr-12' : ''}`}
      />
      {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-500 pointer-events-none">{suffix}</span>}
    </span>
  );
}

export default function SettingsPanel({ settings, grows, onChange }: Props) {
  const s = settings ?? {};
  const lamps = s.lamps ?? [];
  const [name, setName] = useState('');
  const [watts, setWatts] = useState<number | undefined>(undefined);
  const [toDelete, setToDelete] = useState<Lamp | null>(null);
  const devices = s.devices ?? [];
  const [dType, setDType] = useState<DeviceType>('exhaust');
  const [dName, setDName] = useState('');
  const [dWatts, setDWatts] = useState<number | undefined>(undefined);
  const [dHours, setDHours] = useState<number | undefined>(undefined);
  const [dPhase, setDPhase] = useState<DevicePhase>('both');
  const [devToDelete, setDevToDelete] = useState<Device | null>(null);

  const set = (patch: Partial<AppSettings>) => {
    const next: AppSettings = { ...s, ...patch };
    const cleaned = Object.fromEntries(Object.entries(next).filter(([, v]) => v !== undefined)) as AppSettings;
    onChange(Object.keys(cleaned).length ? cleaned : undefined);
  };

  const setLamps = (list: Lamp[]) => set({ lamps: list.length ? list : undefined });
  const canAdd = name.trim().length > 0 && watts !== undefined && watts > 0;
  const addLamp = () => {
    if (!canAdd || watts === undefined) return;
    setLamps([...lamps, { id: crypto.randomUUID(), name: name.trim(), watts }]);
    setName('');
    setWatts(undefined);
  };
  const usedBy = (id: string) => grows.filter((g) => g.lampId === id).length;
  const setDevices = (list: Device[]) => set({ devices: list.length ? list : undefined });
  const updDevice = (id: string, patch: Partial<Device>) => setDevices(devices.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  const canAddDevice = dName.trim().length > 0 && dWatts !== undefined && dWatts > 0;
  const addDevice = () => {
    if (!canAddDevice || dWatts === undefined) return;
    setDevices([...devices, { id: crypto.randomUUID(), type: dType, name: dName.trim(), watts: dWatts, hours: dHours ?? DEFAULT_DEVICE_HOURS[dType], phase: dPhase }]);
    setDName('');
    setDWatts(undefined);
    setDHours(undefined);
    setDPhase('both');
  };
  const usedByDevice = (id: string) => grows.filter((g) => g.deviceIds?.includes(id)).length;
  const phaseOptions = (['both', 'veg', 'flower'] as DevicePhase[]).map((p) => ({ value: p, label: devicePhaseLabel(p) }));
  const typeOptions = DEVICE_TYPES.map((tp) => ({ value: tp, label: deviceTypeLabel(tp) }));
  const hv = s.hoursVeg ?? DEFAULT_HOURS_VEG;
  const hf = s.hoursFlower ?? DEFAULT_HOURS_FLOWER;

  return (
    <div className="space-y-6 animate-fade-in" data-testid="settings-panel">
      <div>
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Settings size={18} className="text-primary-400" />
          {t('Einstellungen', 'Settings')}
        </h2>
        <p className="text-sm text-ink-500 mt-0.5">
          {t(
            'Hinterlege Strompreis und deine LED-Lampen – daraus werden die Stromkosten jedes Grows automatisch berechnet.',
            'Enter your electricity price and your LED lamps – the electricity costs of every grow are calculated automatically from them.'
          )}
        </p>
      </div>

      {/* Strom */}
      <div className="rounded-2xl border border-ink-800 bg-ink-900/60 p-5">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Zap size={16} className="text-warning-400" />
          {t('Strom & Lichtzeiten', 'Electricity & light hours')}
        </h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <label className="block">
            <span className="text-sm font-medium text-ink-200 mb-1.5 block">{t('Strompreis', 'Electricity price')}</span>
            <NumField testid="kwh-price" value={s.kwhPrice} onCommit={(v) => set({ kwhPrice: v })} placeholder="0,35" suffix="€/kWh" max={10} />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink-200 mb-1.5 block">{t('Licht Wachstum', 'Light veg')}</span>
            <NumField testid="hours-veg" value={s.hoursVeg} onCommit={(v) => set({ hoursVeg: v })} placeholder={String(DEFAULT_HOURS_VEG)} suffix="h/Tag" max={24} />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink-200 mb-1.5 block">{t('Licht Blüte', 'Light flower')}</span>
            <NumField testid="hours-flower" value={s.hoursFlower} onCommit={(v) => set({ hoursFlower: v })} placeholder={String(DEFAULT_HOURS_FLOWER)} suffix="h/Tag" max={24} />
          </label>
        </div>
        <div className="flex gap-2.5 text-[11px] text-ink-600 leading-relaxed mt-3">
          <Info size={13} className="shrink-0 mt-0.5" />
          <span>
            {t(
              'Den Strompreis (Arbeitspreis in € pro kWh) findest du auf deiner Stromrechnung. Leer gelassene Lichtzeiten nutzen den Standard: 18 Stunden im Wachstum, 12 Stunden in der Blüte.',
              'You will find the electricity price (price per kWh) on your power bill. Empty light hours use the default: 18 hours in veg, 12 hours in flower.'
            )}
          </span>
        </div>
      </div>

      {/* Lampen */}
      <div className="rounded-2xl border border-ink-800 bg-ink-900/60 p-5">
        <h3 className="text-sm font-semibold text-white mb-1">{t('LED-Lampen', 'LED lamps')}</h3>
        <p className="text-xs text-ink-500 mb-4">
          {t(
            'Lege deine Lampen mit Modell und Leistung an. Beim Anlegen oder Bearbeiten eines Grows wählst du dann, welche Lampe genutzt wird.',
            'Add your lamps with model and power. When creating or editing a grow you then choose which lamp is used.'
          )}
        </p>

        {lamps.length === 0 ? (
          <div className="rounded-xl border border-dashed border-ink-700/60 bg-ink-900/40 px-4 py-5 text-sm text-ink-500 mb-4" data-testid="lamps-empty">
            {t('Noch keine Lampe angelegt.', 'No lamp added yet.')}
          </div>
        ) : (
          <div className="space-y-2.5 mb-4" data-testid="lamp-list">
            {lamps.map((l) => {
              const n = usedBy(l.id);
              return (
                <div key={l.id} className="rounded-xl border border-ink-800 bg-ink-850/60 p-3" data-testid="lamp-row">
                  <div className="grid grid-cols-[1fr_7rem_auto] gap-2.5 items-center">
                    <input
                      data-testid="lamp-name"
                      value={l.name}
                      onChange={(e) => setLamps(lamps.map((x) => (x.id === l.id ? { ...x, name: e.target.value } : x)))}
                      className={inputCls}
                    />
                    <NumField
                      testid="lamp-watts"
                      value={l.watts}
                      onCommit={(v) => v !== undefined && setLamps(lamps.map((x) => (x.id === l.id ? { ...x, watts: v } : x)))}
                      suffix="W"
                    />
                    <button
                      onClick={() => setToDelete(l)}
                      title={t('Löschen', 'Delete')}
                      data-testid="lamp-delete"
                      className="h-9 w-9 rounded-lg flex items-center justify-center text-ink-500 hover:text-error-400 hover:bg-error-500/10 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="text-[11px] text-ink-500 mt-2 tabular-nums">
                    {t('Blüte', 'Flower')} ({hf} h): {fmtNum(kwhPerDay(l.watts, hf), 2)} kWh/{t('Tag', 'day')}
                    {s.kwhPrice !== undefined && ` · ≈ ${formatMoney(kwhPerDay(l.watts, hf) * s.kwhPrice)}/${t('Tag', 'day')}`}
                    {' · '}
                    {t('Wachstum', 'Veg')} ({hv} h): {fmtNum(kwhPerDay(l.watts, hv), 2)} kWh/{t('Tag', 'day')}
                    {n > 0 && ` · ${t('genutzt von', 'used by')} ${n} ${n === 1 ? 'Grow' : 'Grows'}`}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-[1fr_7rem_auto] gap-2.5 items-end">
          <label className="block">
            <span className="text-xs font-medium text-ink-400 mb-1.5 block">{t('Modell / Name', 'Model / name')}</span>
            <input
              data-testid="new-lamp-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addLamp()}
              placeholder={t('z. B. Spider Farmer SF2000', 'e.g. Spider Farmer SF2000')}
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-ink-400 mb-1.5 block">{t('Leistung', 'Power')}</span>
            <NumField testid="new-lamp-watts" value={watts} onCommit={setWatts} placeholder="200" suffix="W" />
          </label>
          <button
            data-testid="lamp-add"
            onClick={addLamp}
            disabled={!canAdd}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-ink-950 bg-primary-500 hover:bg-primary-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-glow"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">{t('Hinzufügen', 'Add')}</span>
          </button>
        </div>
        <div className="flex gap-2.5 text-[11px] text-ink-600 leading-relaxed mt-3">
          <Info size={13} className="shrink-0 mt-0.5" />
          <span>
            {t(
              'Trage die tatsächliche Leistungsaufnahme in Watt ein (Steckdosen-Messgerät oder Herstellerangabe bei voller Helligkeit) – nicht die Angabe „entspricht x Watt HPS“.',
              'Enter the actual power draw in watts (plug meter or manufacturer value at full brightness) – not the “equals x W HPS” figure.'
            )}
          </span>
        </div>
      </div>

      {/* Weitere Geräte */}
      <div className="rounded-2xl border border-ink-800 bg-ink-900/60 p-5" data-testid="devices-card">
        <h3 className="text-sm font-semibold text-white mb-1">{t('Weitere Geräte', 'Other devices')}</h3>
        <p className="text-xs text-ink-500 mb-4">
          {t(
            'Abluft, Clip-Fan, Grow-Controller, Entfeuchter, Befeuchter … Lege Modell, Leistung und durchschnittliche Laufzeit pro Tag an. Beim Grow wählst du, welche Geräte genutzt werden.',
            'Exhaust fan, clip fan, grow controller, dehumidifier, humidifier … Add model, power and average run time per day. In the grow you choose which devices are used.'
          )}
        </p>

        {devices.length === 0 ? (
          <div className="rounded-xl border border-dashed border-ink-700/60 bg-ink-900/40 px-4 py-5 text-sm text-ink-500 mb-4" data-testid="devices-empty">
            {t('Noch kein Gerät angelegt.', 'No device added yet.')}
          </div>
        ) : (
          <div className="space-y-2.5 mb-4" data-testid="device-list">
            {devices.map((d) => {
              const n = usedByDevice(d.id);
              return (
                <div key={d.id} className="rounded-xl border border-ink-800 bg-ink-850/60 p-3" data-testid="device-row">
                  <div className="grid grid-cols-[1fr_auto] gap-2.5 items-center">
                    <input
                      data-testid="device-name"
                      value={d.name}
                      onChange={(e) => updDevice(d.id, { name: e.target.value })}
                      className={inputCls}
                    />
                    <button
                      onClick={() => setDevToDelete(d)}
                      title={t('Löschen', 'Delete')}
                      data-testid="device-delete"
                      className="h-9 w-9 rounded-lg flex items-center justify-center text-ink-500 hover:text-error-400 hover:bg-error-500/10 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-2.5">
                    <DarkSelect testid="device-type" value={d.type} onChange={(v) => updDevice(d.id, { type: v as DeviceType })} options={typeOptions} />
                    <NumField testid="device-watts" value={d.watts} onCommit={(v) => v !== undefined && updDevice(d.id, { watts: v })} suffix="W" />
                    <NumField testid="device-hours" value={d.hours} onCommit={(v) => v !== undefined && updDevice(d.id, { hours: v })} suffix="h/Tag" max={24} />
                    <DarkSelect testid="device-phase" value={d.phase} onChange={(v) => updDevice(d.id, { phase: v as DevicePhase })} options={phaseOptions} />
                  </div>
                  <div className="text-[11px] text-ink-500 mt-2 tabular-nums">
                    {fmtNum(kwhPerDay(d.watts, d.hours), 2)} kWh/{t('Tag', 'day')}
                    {s.kwhPrice !== undefined && ` · ≈ ${formatMoney(kwhPerDay(d.watts, d.hours) * s.kwhPrice)}/${t('Tag', 'day')}`}
                    {n > 0 && ` · ${t('genutzt von', 'used by')} ${n} ${n === 1 ? 'Grow' : 'Grows'}`}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="rounded-xl border border-ink-800 bg-ink-850/40 p-3" data-testid="new-device">
          <div className="text-xs font-medium text-ink-400 mb-2.5">{t('Neues Gerät', 'New device')}</div>
          <div className="grid sm:grid-cols-2 gap-2.5">
            <DarkSelect testid="new-device-type" value={dType} onChange={(v) => setDType(v as DeviceType)} options={typeOptions} />
            <input
              data-testid="new-device-name"
              value={dName}
              onChange={(e) => setDName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addDevice()}
              placeholder={t('Modell / Name, z. B. Prima Klima 125 mm', 'Model / name, e.g. Prima Klima 125 mm')}
              className={inputCls}
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-[7rem_7rem_1fr_auto] gap-2.5 mt-2.5 items-center">
            <NumField testid="new-device-watts" value={dWatts} onCommit={setDWatts} placeholder="40" suffix="W" />
            <NumField testid="new-device-hours" value={dHours} onCommit={setDHours} placeholder={String(DEFAULT_DEVICE_HOURS[dType])} suffix="h/Tag" max={24} />
            <DarkSelect testid="new-device-phase" value={dPhase} onChange={(v) => setDPhase(v as DevicePhase)} options={phaseOptions} />
            <button
              data-testid="device-add"
              onClick={addDevice}
              disabled={!canAddDevice}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-ink-950 bg-primary-500 hover:bg-primary-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-glow col-span-2 sm:col-span-1"
            >
              <Plus size={16} />
              {t('Hinzufügen', 'Add')}
            </button>
          </div>
        </div>
        <div className="flex gap-2.5 text-[11px] text-ink-600 leading-relaxed mt-3">
          <Info size={13} className="shrink-0 mt-0.5" />
          <span>
            {t(
              'Die Laufzeit ist ein Tagesdurchschnitt: Abluft, Clip-Fan und Controller laufen meist 24 Stunden, Ent- und Befeuchter nur zeitweise (Voreinstellung 8 Stunden). Bei „Phase“ legst du fest, ob das Gerät nur im Wachstum, nur in der Blüte oder immer läuft.',
              'Run time is a daily average: exhaust fans, clip fans and controllers usually run 24 hours, dehumidifiers and humidifiers only part of the time (default 8 hours). “Phase” defines whether the device runs only in veg, only in flower or always.'
            )}
          </span>
        </div>
      </div>

      <ConfirmDialog
        open={!!toDelete}
        title={t('Lampe löschen?', 'Delete lamp?')}
        message={
          toDelete
            ? usedBy(toDelete.id) > 0
              ? t(
                  `„${toDelete.name}“ wird von ${usedBy(toDelete.id)} Grow(s) genutzt. Diese verlieren die Lampen-Zuordnung, und ihre Stromkosten werden nicht mehr automatisch berechnet.`,
                  `“${toDelete.name}” is used by ${usedBy(toDelete.id)} grow(s). They lose the lamp assignment and their electricity costs are no longer calculated automatically.`
                )
              : t(`„${toDelete.name}“ wird entfernt.`, `“${toDelete.name}” will be removed.`)
            : ''
        }
        confirmLabel={t('Löschen', 'Delete')}
        cancelLabel={t('Abbrechen', 'Cancel')}
        destructive
        onConfirm={() => {
          if (toDelete) setLamps(lamps.filter((x) => x.id !== toDelete.id));
          setToDelete(null);
        }}
        onCancel={() => setToDelete(null)}
      />
      <ConfirmDialog
        open={!!devToDelete}
        title={t('Gerät löschen?', 'Delete device?')}
        message={
          devToDelete
            ? usedByDevice(devToDelete.id) > 0
              ? t(
                  `„${devToDelete.name}“ wird von ${usedByDevice(devToDelete.id)} Grow(s) genutzt. Das Gerät wird dort entfernt, und die Stromkosten ändern sich.`,
                  `“${devToDelete.name}” is used by ${usedByDevice(devToDelete.id)} grow(s). The device is removed there and the electricity costs change.`
                )
              : t(`„${devToDelete.name}“ wird entfernt.`, `“${devToDelete.name}” will be removed.`)
            : ''
        }
        confirmLabel={t('Löschen', 'Delete')}
        cancelLabel={t('Abbrechen', 'Cancel')}
        destructive
        onConfirm={() => {
          if (devToDelete) setDevices(devices.filter((x) => x.id !== devToDelete.id));
          setDevToDelete(null);
        }}
        onCancel={() => setDevToDelete(null)}
      />
    </div>
  );
}

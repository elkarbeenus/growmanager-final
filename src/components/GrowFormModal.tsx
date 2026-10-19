import { useEffect, useState } from 'react';
import { Sprout, Check } from 'lucide-react';
import Modal from './Modal';
import DarkSelect from './DarkSelect';
import type { Device, Lamp } from '@/types';
import { GROW_COLOR_PRESETS } from '@/lib/storage';
import { t } from '@/lib/i18n';


interface GrowFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; strain: string; color: string; plantCount: number; lampId?: string; lampCount?: number; deviceIds?: string[] }) => void;
  initial?: { name: string; strain: string; color: string; plantCount?: number; lampId?: string; lampCount?: number; deviceIds?: string[] };
  lamps?: Lamp[];
  devices?: Device[];
  mode?: 'create' | 'edit';
}

export default function GrowFormModal({
  open,
  onClose,
  onSubmit,
  initial,
  lamps = [],
  devices = [],
  mode = 'create',
}: GrowFormModalProps) {
  const [name, setName] = useState('');
  const [strain, setStrain] = useState('');
  const [color, setColor] = useState(GROW_COLOR_PRESETS[0]);
  const [plantCount, setPlantCount] = useState(1);
  const [lampId, setLampId] = useState('');
  const [lampCount, setLampCount] = useState(1);
  const [deviceIds, setDeviceIds] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? '');
      setStrain(initial?.strain ?? '');
      setColor(initial?.color ?? GROW_COLOR_PRESETS[0]);
      setPlantCount(initial?.plantCount ?? 1);
      setLampId(initial?.lampId ?? '');
      setLampCount(initial?.lampCount ?? 1);
      setDeviceIds(initial?.deviceIds ?? []);
    }
  }, [open, initial]);

  const canSubmit = name.trim().length > 0;

  const submit = () => {
    if (!canSubmit) return;
    onSubmit({ name: name.trim(), strain: strain.trim(), color, plantCount, lampId: lampId || undefined, lampCount: lampId ? lampCount : undefined, deviceIds: deviceIds.length ? deviceIds : undefined });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'create' ? t('Neuer Grow / Tent', 'New Grow / Tent') : t('Grow bearbeiten', 'Edit Grow')}
      subtitle={mode === 'create' ? t('Lege einen neuen Tent oder Grow-Durchgang an.', 'Set up a new tent or grow run.') : t('Name und Details aktualisieren.', 'Update the name and details.')}
      icon={<Sprout size={18} />}
      maxWidth="max-w-md"
    >
      <div className="space-y-5">
        <label className="block">
          <span className="text-sm font-medium text-ink-200 mb-1.5 block">Name</span>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder={t('z. B. Tent 1 — Amnesia Haze', 'e.g. Tent 1 — Amnesia Haze')}
            className="w-full bg-ink-850 border border-ink-700/70 rounded-xl px-3.5 py-2.5 text-sm text-ink-100 placeholder-ink-600 focus:outline-none focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/20 transition-all"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-ink-200 mb-1.5 block">
            {t('Sorte', 'Strain')} <span className="text-ink-600 font-normal">(optional)</span>
          </span>
          <input
            value={strain}
            onChange={(e) => setStrain(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder={t('z. B. Amnesia Haze, Northern Lights Auto', 'e.g. Amnesia Haze, Northern Lights Auto')}
            className="w-full bg-ink-850 border border-ink-700/70 rounded-xl px-3.5 py-2.5 text-sm text-ink-100 placeholder-ink-600 focus:outline-none focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/20 transition-all"
          />
        </label>

        <div>
          <span className="text-sm font-medium text-ink-200 mb-1.5 block">
            {t('Anzahl Pflanzen', 'Number of plants')}
          </span>
          <div className="flex flex-wrap gap-1.5" data-testid="plant-count">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPlantCount(n)}
                data-testid={`plants-${n}`}
                className={`h-9 w-9 rounded-lg text-sm font-semibold tabular-nums border transition-colors ${
                  plantCount === n
                    ? 'text-ink-950 bg-primary-500 border-primary-500'
                    : 'text-ink-300 bg-ink-850 border-ink-700/70 hover:bg-ink-800'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <span className="block text-xs text-ink-500 mt-1.5">
            {t(
              'Startdatum und Meilensteine gelten für alle Pflanzen des Grows gleich.',
              'Start date and milestones apply equally to all plants of the grow.'
            )}
          </span>
        </div>

        <div data-testid="lamp-select-block">
          <span className="text-sm font-medium text-ink-200 mb-1.5 block">
            {t('LED-Lampe', 'LED lamp')} <span className="text-ink-600 font-normal">(optional)</span>
          </span>
          {lamps.length === 0 ? (
            <p className="text-xs text-ink-500 leading-relaxed" data-testid="lamp-none-hint">
              {t(
                'Noch keine Lampe angelegt. Lege deine LED-Lampen im Reiter „Einstellungen“ an, dann kannst du sie hier auswählen – die Stromkosten werden dann automatisch berechnet.',
                'No lamp added yet. Add your LED lamps in the “Settings” tab, then you can choose one here – electricity costs are then calculated automatically.'
              )}
            </p>
          ) : (
            <>
              <DarkSelect
                testid="grow-lamp"
                value={lampId}
                onChange={setLampId}
                options={[{ value: '', label: t('Keine – Strom nicht berechnen', 'None – do not calculate electricity') }, ...lamps.map((l) => ({ value: l.id, label: `${l.name} (${l.watts} W)` }))]}
              />
              {lampId && (
                <div className="flex items-center gap-2 mt-2.5">
                  <span className="text-xs text-ink-400">{t('Anzahl Lampen', 'Number of lamps')}</span>
                  {[1, 2, 3, 4].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setLampCount(n)}
                      data-testid={`lamp-count-${n}`}
                      className={`h-8 w-8 rounded-lg text-sm font-semibold tabular-nums border transition-colors ${
                        lampCount === n ? 'text-ink-950 bg-primary-500 border-primary-500' : 'text-ink-300 bg-ink-850 border-ink-700/70 hover:bg-ink-800'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {devices.length > 0 && (
          <div data-testid="device-select-block">
            <span className="text-sm font-medium text-ink-200 mb-1.5 block">
              {t('Weitere Geräte', 'Other devices')} <span className="text-ink-600 font-normal">(optional)</span>
            </span>
            <div className="flex flex-wrap gap-2">
              {devices.map((d) => {
                const on = deviceIds.includes(d.id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    data-testid={`form-device-${d.id}`}
                    onClick={() => setDeviceIds(on ? deviceIds.filter((x) => x !== d.id) : [...deviceIds, d.id])}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      on ? 'text-primary-200 bg-primary-500/15 border-primary-500/50' : 'text-ink-300 bg-ink-850 border-ink-700/70 hover:bg-ink-800'
                    }`}
                  >
                    {on ? '✓ ' : ''}
                    {d.name} ({d.watts} W)
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <span className="text-sm font-medium text-ink-200 mb-2 block">{t('Akzentfarbe', 'Accent color')}</span>
          <div className="flex flex-wrap gap-2.5">
            {GROW_COLOR_PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="h-9 w-9 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                style={{
                  backgroundColor: `${c}22`,
                  border: `2px solid ${color === c ? c : 'transparent'}`,
                  boxShadow: color === c ? `0 0 12px ${c}55` : 'none',
                }}
                aria-label={`${t('Farbe wählen', 'Pick color')} ${c}`}
              >
                {color === c && (
                  <Check size={15} style={{ color: c }} />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-ink-300 bg-ink-800 hover:bg-ink-700 transition-colors"
          >
            {t('Abbrechen', 'Cancel')}
          </button>
          <button
            onClick={submit}
            disabled={!canSubmit}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-ink-950 bg-primary-500 hover:bg-primary-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-glow"
          >
            {mode === 'create' ? t('Grow anlegen', 'Create Grow') : t('Änderungen speichern', 'Save Changes')}
          </button>
        </div>
      </div>
    </Modal>
  );
}

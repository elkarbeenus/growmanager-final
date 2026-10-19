import { useEffect, useState } from 'react';
import { Droplets, Beaker, Thermometer, Wind, FlaskConical, StickyNote, Check } from 'lucide-react';
import Modal from './Modal';
import type { LogEntry } from '@/types';
import { todayStr } from '@/lib/growLogic';
import { t, isEn, volumeUnit, litersToDisplay, displayToLiters } from '@/lib/i18n';

interface LogEntryModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (entry: Omit<LogEntry, 'id'>) => void;
  initial?: LogEntry;
  defaultDate?: string;
}

interface NumField {
  key: keyof Pick<LogEntry, 'ph' | 'ec' | 'temp' | 'humidity' | 'watering'>;
  label: string;
  icon: React.ReactNode;
  placeholder: string;
  step: string;
  suffix?: string;
}

const getFields = (): NumField[] => [
  { key: 'ph', label: 'pH', icon: <Beaker size={15} />, placeholder: '6.2', step: '0.1' },
  { key: 'ec', label: 'EC', icon: <FlaskConical size={15} />, placeholder: '1.4', step: '0.1', suffix: 'mS' },
  { key: 'temp', label: t('Temperatur', 'Temperature'), icon: <Thermometer size={15} />, placeholder: '24', step: '0.1', suffix: '°C' },
  { key: 'humidity', label: t('Luftfeuchtigkeit (RF)', 'Humidity (RH)'), icon: <Wind size={15} />, placeholder: '60', step: '1', suffix: '%' },
  { key: 'watering', label: t('Gießmenge', 'Watering'), icon: <Droplets size={15} />, placeholder: isEn() ? '0.7' : '2.5', step: isEn() ? '0.01' : '0.1', suffix: volumeUnit() },
];

export default function LogEntryModal({
  open,
  onClose,
  onSubmit,
  initial,
  defaultDate,
}: LogEntryModalProps) {
  const [date, setDate] = useState(todayStr());
  const [ph, setPh] = useState('');
  const [ec, setEc] = useState('');
  const [temp, setTemp] = useState('');
  const [humidity, setHumidity] = useState('');
  const [watering, setWatering] = useState('');
  const [nutrientsAdded, setNutrientsAdded] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (open) {
      setDate(initial?.date ?? defaultDate ?? todayStr());
      setPh(initial?.ph?.toString() ?? '');
      setEc(initial?.ec?.toString() ?? '');
      setTemp(initial?.temp?.toString() ?? '');
      setHumidity(initial?.humidity?.toString() ?? '');
      setWatering(litersToDisplay(initial?.watering)?.toString() ?? '');
      setNutrientsAdded(initial?.nutrientsAdded ?? false);
      setNote(initial?.note ?? '');
    }
  }, [open, initial, defaultDate]);

  const submit = () => {
    const num = (s: string): number | undefined => {
      if (s.trim() === '') return undefined;
      const n = Number(s);
      return Number.isFinite(n) ? n : undefined;
    };
    onSubmit({
      date,
      ph: num(ph),
      ec: num(ec),
      temp: num(temp),
      humidity: num(humidity),
      watering: displayToLiters(num(watering)), // intern immer in Litern
      nutrientsAdded,
      note: note.trim() || undefined,
    });
  };

  const stateMap = { ph: [ph, setPh], ec: [ec, setEc], temp: [temp, setTemp], humidity: [humidity, setHumidity], watering: [watering, setWatering] } as const;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? t('Eintrag bearbeiten', 'Edit entry') : t('Neuer Tagebucheintrag', 'New journal entry')}
      subtitle={t('Heutige Werte und Notizen erfassen.', "Record today's values and notes.")}
      icon={<Droplets size={18} />}
      maxWidth="max-w-lg"
    >
      <div className="space-y-5">
        <label className="block">
          <span className="text-sm font-medium text-ink-200 mb-1.5 block">{t('Datum', 'Date')}</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-ink-850 border border-ink-700/70 rounded-xl px-3.5 py-2.5 text-sm text-ink-100 focus:outline-none focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/20 transition-all"
          />
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {getFields().map((f) => {
            const [val, setVal] = stateMap[f.key] as [string, (v: string) => void];
            return (
              <label key={f.key} className="block">
                <span className="text-xs font-medium text-ink-400 mb-1 flex items-center gap-1.5">
                  <span className="text-primary-400">{f.icon}</span>
                  {f.label}
                </span>
                <div className="relative">
                  <input
                    type="number"
                    step={f.step}
                    value={val}
                    onChange={(e) => setVal(e.target.value)}
                    placeholder={f.placeholder}
                    className="w-full bg-ink-850 border border-ink-700/70 rounded-xl px-3 py-2 text-sm text-ink-100 placeholder-ink-600 focus:outline-none focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/20 transition-all"
                  />
                  {f.suffix && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-ink-600 pointer-events-none">
                      {f.suffix}
                    </span>
                  )}
                </div>
              </label>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setNutrientsAdded((v) => !v)}
          className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-all ${
            nutrientsAdded
              ? 'bg-accent-500/10 border-accent-500/40 text-accent-300'
              : 'bg-ink-850 border-ink-700/70 text-ink-300 hover:border-ink-600'
          }`}
        >
          <span className="flex items-center gap-2.5 text-sm font-medium">
            <FlaskConical size={16} />
            {t('Dünger gegeben', 'Nutrients added')}
          </span>
          <span
            className={`h-5 w-5 rounded-md flex items-center justify-center transition-all ${
              nutrientsAdded ? 'bg-accent-500 text-ink-950' : 'border border-ink-600'
            }`}
          >
            {nutrientsAdded && <Check size={14} />}
          </span>
        </button>

        <label className="block">
          <span className="text-sm font-medium text-ink-200 mb-1.5 flex items-center gap-1.5">
            <StickyNote size={15} className="text-primary-400" />
            {t('Notiz', 'Note')} <span className="text-ink-600 font-normal">(optional)</span>
          </span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder={t('Beobachtungen, Defoliation, Training, Probleme…', 'Observations, defoliation, training, issues…')}
            className="w-full bg-ink-850 border border-ink-700/70 rounded-xl px-3.5 py-2.5 text-sm text-ink-100 placeholder-ink-600 focus:outline-none focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/20 transition-all resize-none"
          />
        </label>

        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-ink-300 bg-ink-800 hover:bg-ink-700 transition-colors"
          >
            {t('Abbrechen', 'Cancel')}
          </button>
          <button
            onClick={submit}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-ink-950 bg-primary-500 hover:bg-primary-400 transition-colors shadow-glow"
          >
            {initial ? t('Speichern', 'Save') : t('Eintrag hinzufügen', 'Add entry')}
          </button>
        </div>
      </div>
    </Modal>
  );
}

import { useMemo } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Beaker,
  FlaskConical,
  Thermometer,
  Wind,
  Droplets,
  StickyNote,
} from 'lucide-react';
import type { Grow, LogEntry } from '@/types';
import { formatDate } from '@/lib/growLogic';
import { t, locale, litersToDisplay, volumeUnit } from '@/lib/i18n';

interface JournalProps {
  grow: Grow;
  onAdd: () => void;
  onEdit: (entry: LogEntry) => void;
  onDelete: (id: string) => void;
}

export default function Journal({ grow, onAdd, onEdit, onDelete }: JournalProps) {
  const sorted = useMemo(
    () => [...grow.logs].sort((a, b) => (a.date < b.date ? 1 : -1)),
    [grow.logs]
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-white">{t('Tagebuch', 'Journal')}</h3>
          <p className="text-xs text-ink-500 mt-0.5">
            {grow.logs.length} {grow.logs.length === 1 ? t('Eintrag', 'entry') : t('Einträge', 'entries')}
          </p>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold text-ink-950 bg-primary-500 hover:bg-primary-400 transition-colors shadow-glow"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">{t('Neuer Eintrag', 'New entry')}</span>
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-700/60 bg-ink-900/40 px-5 py-10 text-center">
          <Droplets size={28} className="mx-auto text-ink-700 mb-3" />
          <p className="text-sm text-ink-400 font-medium">{t('Noch keine Tagebucheinträge', 'No journal entries yet')}</p>
          <p className="text-xs text-ink-600 mt-1">
            {t('Erfasse täglich pH, EC, Temperatur, Luftfeuchtigkeit, Gießmenge und Notizen.', 'Log pH, EC, temperature, humidity, watering and notes every day.')}
          </p>
          <button
            onClick={onAdd}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-primary-300 bg-primary-500/10 hover:bg-primary-500/20 border border-primary-500/30 transition-colors"
          >
            <Plus size={15} />
            {t('Ersten Eintrag anlegen', 'Create first entry')}
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {sorted.map((entry) => (
            <div
              key={entry.id}
              className="group rounded-2xl border border-ink-800 bg-ink-900/60 hover:border-ink-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-3 px-4 py-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-9 w-9 rounded-lg bg-ink-850 border border-ink-700/60 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[9px] uppercase tracking-wide text-ink-500 leading-none">
                      {new Date(entry.date + 'T00:00:00').toLocaleDateString(locale(), { month: 'short' })}
                    </span>
                    <span className="text-sm font-bold text-white leading-none mt-0.5">
                      {new Date(entry.date + 'T00:00:00').getDate()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-ink-100">
                      {formatDate(entry.date)}
                    </div>
                    {entry.nutrientsAdded && (
                      <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-accent-300 bg-accent-500/10 border border-accent-500/30 rounded-full px-2 py-0.5">
                        <FlaskConical size={11} />
                        {t('Dünger gegeben', 'Nutrients added')}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onEdit(entry)}
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-ink-400 hover:text-primary-300 hover:bg-ink-800 transition-colors"
                    aria-label={t('Eintrag bearbeiten', 'Edit entry')}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => onDelete(entry.id)}
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-ink-400 hover:text-error-400 hover:bg-ink-800 transition-colors"
                    aria-label={t('Eintrag löschen', 'Delete entry')}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="px-4 pb-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  <Metric icon={<Beaker size={13} />} label="pH" value={entry.ph} />
                  <Metric icon={<FlaskConical size={13} />} label="EC" value={entry.ec} suffix="mS" />
                  <Metric icon={<Thermometer size={13} />} label="Temp" value={entry.temp} suffix="°C" />
                  <Metric icon={<Wind size={13} />} label={t('RF', 'RH')} value={entry.humidity} suffix="%" />
                  <Metric icon={<Droplets size={13} />} label={t('Gießmenge', 'Watering')} value={litersToDisplay(entry.watering)} suffix={volumeUnit()} />
                </div>
                {entry.note && (
                  <div className="mt-2.5 flex gap-2 text-sm text-ink-300 bg-ink-850/60 rounded-lg px-3 py-2">
                    <StickyNote size={14} className="text-ink-500 mt-0.5 shrink-0" />
                    <span className="leading-relaxed">{entry.note}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  suffix,
}: {
  icon: React.ReactNode;
  label: string;
  value?: number;
  suffix?: string;
}) {
  return (
    <div className="rounded-lg bg-ink-850/60 border border-ink-800 px-2.5 py-1.5">
      <div className="text-[10px] uppercase tracking-wide text-ink-500 flex items-center gap-1">
        <span className="text-ink-600">{icon}</span>
        {label}
      </div>
      <div className="text-sm font-semibold text-ink-100 tabular-nums">
        {value !== undefined ? (
          <>
            {value}
            {suffix && <span className="text-[10px] text-ink-500 ml-0.5 font-normal">{suffix}</span>}
          </>
        ) : (
          <span className="text-ink-700 font-normal">—</span>
        )}
      </div>
    </div>
  );
}


import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { t, isEn, locale, useLang } from '@/lib/i18n';

interface DatePickerProps {
  value?: string; // YYYY-MM-DD
  onChange: (value: string | undefined) => void;
  accentColor?: string;
}

const WEEKDAY_LABELS_EN = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTH_LABELS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAY_LABELS_DE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const MONTH_LABELS_DE = [
  'Januar',
  'Februar',
  'März',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember',
];

function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function fromYMD(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export default function DatePicker({
  value,
  onChange,
  accentColor = '#10b981',
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<Date>(() => {
    if (value) return fromYMD(value);
    return new Date();
  });
  const wrapRef = useRef<HTMLDivElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number; up: boolean } | null>(null);

  // Position des Popups (fixed, per Portal an <body>) – so kann es weder abgeschnitten
  // noch von nachfolgenden Bereichen überdeckt werden (wichtig für WebKitGTK/AppImage).
  const place = () => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const W = 288; // w-72
    const H = 400;
    const left = Math.max(8, Math.min(r.left, window.innerWidth - W - 8));
    const up = r.bottom + H > window.innerHeight && r.top > H;
    setPos({ left, top: up ? r.top - 8 : r.bottom + 8, up });
  };
  useLayoutEffect(() => {
    if (!open) return;
    place();
    const onMove = () => place();
    window.addEventListener('resize', onMove);
    window.addEventListener('scroll', onMove, true);
    return () => {
      window.removeEventListener('resize', onMove);
      window.removeEventListener('scroll', onMove, true);
    };
  }, [open]);
  const lang = useLang();
  const WEEKDAY_LABELS = isEn() ? WEEKDAY_LABELS_EN : WEEKDAY_LABELS_DE;

  useEffect(() => {
    if (value) setView(fromYMD(value));
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: Event) => {
      const path = typeof e.composedPath === 'function' ? e.composedPath() : [];
      const inside = (el: HTMLElement | null) => !!el && (path.includes(el) || el.contains(e.target as Node));
      if (!inside(wrapRef.current) && !inside(popRef.current)) setOpen(false);
    };
    // Esc schließt nur den Kalender (nicht zusätzlich einen umgebenden Dialog)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
      }
    };
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey, true);
    };
  }, [open]);

  const { days, monthLabel, yearLabel } = useMemo(() => {
    const year = view.getFullYear();
    const month = view.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const lastOfMonth = new Date(year, month + 1, 0);
    // Make Monday the first column
    const startOffset = (firstOfMonth.getDay() + 6) % 7;
    const totalDays = lastOfMonth.getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= totalDays; d++) cells.push(new Date(year, month, d));
    while (cells.length % 7 !== 0) cells.push(null);
    return {
      days: cells,
      monthLabel: (lang === 'en' ? MONTH_LABELS_EN : MONTH_LABELS_DE)[month],
      yearLabel: String(year),
    };
  }, [view, lang]);

  const today = toYMD(new Date());
  const prevMonth = () => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1));
  const nextMonth = () => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1));
  const prevYear = () => setView(new Date(view.getFullYear() - 1, view.getMonth(), 1));
  const nextYear = () => setView(new Date(view.getFullYear() + 1, view.getMonth(), 1));

  const selectDay = (d: Date) => {
    onChange(toYMD(d));
    setOpen(false);
  };

  const clearValue = () => {
    onChange(undefined);
    setOpen(false);
  };

  return (
    <div className="relative" ref={wrapRef}>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500 hover:text-primary-400 transition-colors"
          style={value ? { color: accentColor } : undefined}
          aria-label={t('Kalender öffnen', 'Open calendar')}
        >
          <Calendar size={15} />
        </button>
        <input
          type="date"
          value={value ?? ''}
          onChange={(e) => {
            const v = e.target.value;
            // Halb getippte Eingabe (badInput) nicht als "leer" übernehmen
            if (!v && e.target.validity.badInput) return;
            onChange(v || undefined);
          }}
          className="w-full bg-ink-850 border border-ink-700/70 rounded-xl pl-9 pr-3 py-2.5 text-sm text-ink-100 placeholder-ink-500 focus:outline-none focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/20 transition-all"
        />
      </div>

      {open && pos && createPortal(
        <div
          ref={popRef}
          data-testid="datepicker-popup"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          style={{ position: 'fixed', left: pos.left, top: pos.top, transform: pos.up ? 'translateY(-100%)' : undefined, zIndex: 1000 }}
          className="w-72 rounded-2xl border border-ink-700 bg-ink-900 shadow-2xl p-3 ">
          {/* Header: month + year nav */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold text-white px-1">{monthLabel}</span>
              <span className="text-sm text-ink-500">{yearLabel}</span>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={prevYear}
                className="h-7 w-7 rounded-lg flex items-center justify-center text-ink-500 hover:text-white hover:bg-ink-800 transition-colors"
                aria-label={t('Vorheriges Jahr', 'Previous year')}
              >
                <ChevronLeft size={14} className="opacity-50" />
                <ChevronLeft size={14} className="-ml-2.5" />
              </button>
              <button
                type="button"
                onClick={prevMonth}
                className="h-7 w-7 rounded-lg flex items-center justify-center text-ink-400 hover:text-white hover:bg-ink-800 transition-colors"
                aria-label={t('Vorheriger Monat', 'Previous month')}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="h-7 w-7 rounded-lg flex items-center justify-center text-ink-400 hover:text-white hover:bg-ink-800 transition-colors"
                aria-label={t('Nächster Monat', 'Next month')}
              >
                <ChevronRight size={16} />
              </button>
              <button
                type="button"
                onClick={nextYear}
                className="h-7 w-7 rounded-lg flex items-center justify-center text-ink-500 hover:text-white hover:bg-ink-800 transition-colors"
                aria-label={t('Nächstes Jahr', 'Next year')}
              >
                <ChevronRight size={14} className="opacity-50" />
                <ChevronRight size={14} className="-ml-2.5" />
              </button>
            </div>
          </div>

          {/* Weekday labels */}
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {WEEKDAY_LABELS.map((w) => (
              <div
                key={w}
                className="text-center text-[10px] font-semibold uppercase tracking-wide text-ink-600 py-1"
              >
                {w}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {days.map((d, i) => {
              if (!d) return <div key={i} />;
              const ymd = toYMD(d);
              const isSelected = ymd === value;
              const isToday = ymd === today;
              const isWeekend = d.getDay() === 0 || d.getDay() === 6;
              return (
                <button
                  key={i}
                  type="button"
                  data-day={ymd}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    selectDay(d);
                  }}
                  onClick={(e) => {
                    // Fallback (z. B. Tastatur): pointerdown hat bereits ausgewählt und geschlossen
                    e.stopPropagation();
                    selectDay(d);
                  }}
                  className={`h-9 w-9 rounded-lg text-sm font-medium tabular-nums transition-all ${
                    isSelected
                      ? 'text-ink-950 font-bold'
                      : isToday
                      ? 'text-primary-300 ring-1 ring-inset ring-primary-500/40'
                      : isWeekend
                      ? 'text-ink-400 hover:bg-ink-800'
                      : 'text-ink-200 hover:bg-ink-800'
                  }`}
                  style={
                    isSelected
                      ? { backgroundColor: accentColor, boxShadow: `0 0 10px ${accentColor}66` }
                      : undefined
                  }
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-ink-800">
            <span className="text-xs text-ink-500">
              {value
                ? new Date(value + 'T00:00:00').toLocaleDateString(locale(), {
                    weekday: 'short',
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
                : t('Kein Datum', 'No date')}
            </span>
            <div className="flex items-center gap-2">
              {value && (
                <button
                  type="button"
                  onClick={clearValue}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-ink-400 hover:text-error-400 hover:bg-error-500/10 transition-colors"
                >
                  {t('Löschen', 'Clear')}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  onChange(today);
                  setOpen(false);
                }}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-primary-300 bg-primary-500/10 hover:bg-primary-500/20 border border-primary-500/30 transition-colors"
              >
                {t('Heute', 'Today')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

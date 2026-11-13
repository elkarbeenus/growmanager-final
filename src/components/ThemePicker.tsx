import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Palette } from 'lucide-react';
import { THEMES, setTheme, themeInfo, useTheme, type ThemeInfo } from '@/lib/theme';
import { t } from '@/lib/i18n';

/** Kleine Farbvorschau eines Themes (feste Farben, unabhängig vom aktiven Theme). */
function Swatch({ info, size = 'md' }: { info: ThemeInfo; size?: 'sm' | 'md' }) {
  const p = info.preview;
  if (size === 'sm') {
    return (
      <span className="relative h-5 w-5 shrink-0 rounded-md overflow-hidden ring-1 ring-black/40" style={{ backgroundColor: p.bg }} aria-hidden="true">
        <span className="absolute left-1 top-1 h-2 w-2 rounded-full" style={{ backgroundColor: p.primary }} />
        <span className="absolute right-1 bottom-1 h-2 w-2 rounded-full" style={{ backgroundColor: p.led }} />
      </span>
    );
  }
  return (
    <div className="relative h-20 rounded-lg overflow-hidden" style={{ backgroundColor: p.bg }} aria-hidden="true">
      <span className="absolute inset-x-0 top-0 h-[3px]" style={{ backgroundImage: `linear-gradient(90deg, ${p.spectrum.join(', ')})` }} />
      {/* Mini-Oberfläche: Seitenleiste + Karte */}
      <span className="absolute left-2 top-3 bottom-2 w-6 rounded" style={{ backgroundColor: p.surface }}>
        <span className="block mx-1 mt-1.5 h-1 rounded-full" style={{ backgroundColor: p.primary }} />
        <span className="block mx-1 mt-1 h-1 rounded-full opacity-50" style={{ backgroundColor: p.text }} />
        <span className="block mx-1 mt-1 h-1 rounded-full opacity-50" style={{ backgroundColor: p.text }} />
      </span>
      <span className="absolute left-10 right-2 top-3 bottom-2 rounded" style={{ backgroundColor: p.surface }}>
        <span className="absolute left-0 inset-y-0 w-[3px] rounded-l" style={{ backgroundColor: p.accent }} />
        <span className="block ml-2.5 mt-1.5 h-1.5 w-10 rounded-full" style={{ backgroundColor: p.text }} />
        <span className="block ml-2.5 mt-1.5 h-1 w-14 rounded-full opacity-50" style={{ backgroundColor: p.text }} />
        <span className="absolute right-1.5 bottom-1.5 h-3 w-7 rounded" style={{ backgroundColor: p.primary }} />
        <span className="absolute left-2.5 bottom-1.5 h-1 w-8 rounded-full" style={{ backgroundImage: `linear-gradient(90deg, ${p.spectrum.join(', ')})` }} />
      </span>
    </div>
  );
}

/** Große Auswahl mit Vorschau-Karten (Einstellungen → Erscheinungsbild). */
export function ThemeGrid() {
  const active = useTheme();
  const groups: { key: ThemeInfo['group']; label: string }[] = [
    { key: 'grow', label: t('Grow-Themes', 'Grow themes') },
    { key: 'classic', label: t('Klassiker', 'Classics') },
  ];
  return (
    <div className="space-y-5" data-testid="theme-grid">
      {groups.map((g) => (
        <div key={g.key}>
          <div className="text-xs font-medium text-ink-400 mb-2">{g.label}</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3" role="radiogroup" aria-label={g.label}>
            {THEMES.filter((x) => x.group === g.key).map((info) => {
              const on = info.id === active;
              return (
                <button
                  key={info.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  data-testid={`theme-${info.id}`}
                  onClick={() => setTheme(info.id)}
                  className={`text-left rounded-xl border p-2 ${on ? 'border-primary-400 bg-ink-850 shadow-glow' : 'border-ink-800 bg-ink-900 hover:border-ink-700 hover:bg-ink-850'}`}
                >
                  <Swatch info={info} />
                  <div className="flex items-center gap-1.5 mt-2 px-0.5">
                    <span className="text-sm font-semibold text-white truncate">{info.name()}</span>
                    {on && <Check size={14} className="text-primary-300 shrink-0 ml-auto" />}
                  </div>
                  <p className="text-[11px] text-ink-400 leading-snug px-0.5 mt-0.5 line-clamp-2">{info.description()}</p>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Kompakter Umschalter (Seitenleiste / Kopfzeile). */
export function ThemeSwitcher({ up = false, full = false }: { up?: boolean; full?: boolean }) {
  const active = useTheme();
  const info = themeInfo(active);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        data-testid="theme-switcher-button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        title={t('Theme wechseln', 'Change theme')}
        className={`flex items-center gap-2 h-9 rounded-lg text-sm font-medium border ${full ? 'w-full pl-2 pr-2' : 'px-2'} ${
          open ? 'text-white bg-ink-850 border-primary-400/50' : 'text-ink-200 bg-ink-900 hover:bg-ink-850 border-ink-800 hover:border-ink-700'
        }`}
      >
        {full ? <Swatch info={info} size="sm" /> : <Palette size={16} className="text-ink-300" />}
        {full && <span className="truncate">{info.name()}</span>}
        {full && <ChevronDown size={14} className={`text-ink-500 ml-auto transition-transform ${open ? (up ? '' : 'rotate-180') : up ? 'rotate-180' : ''}`} />}
      </button>

      {open && (
        <div
          role="listbox"
          data-testid="theme-switcher-menu"
          className={`absolute z-40 w-60 max-h-[70vh] overflow-y-auto scrollbar-thin rounded-xl border border-ink-700 bg-ink-850 shadow-xl py-1 animate-fade-in ${
            up ? 'bottom-11 left-0' : 'top-11 right-0'
          }`}
        >
          {(['grow', 'classic'] as const).map((grp) => (
            <div key={grp} className="py-1">
              <div className="px-3 pt-1 pb-1 text-[11px] font-medium text-ink-500">{grp === 'grow' ? t('Grow-Themes', 'Grow themes') : t('Klassiker', 'Classics')}</div>
              {THEMES.filter((x) => x.group === grp).map((x) => {
                const on = x.id === active;
                return (
                  <button
                    key={x.id}
                    type="button"
                    role="option"
                    aria-selected={on}
                    data-testid={`theme-option-${x.id}`}
                    onClick={() => {
                      setTheme(x.id);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-sm ${on ? 'text-primary-300 bg-primary-500/10' : 'text-ink-200 hover:bg-ink-800 hover:text-white'}`}
                  >
                    <Swatch info={x} size="sm" />
                    <span className="flex-1 text-left truncate">{x.name()}</span>
                    {on && <Check size={14} />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { setLang, useLang, type Lang } from '@/lib/i18n';

// Flaggen als SVG, damit sie auch ohne Emoji-Schrift (z. B. SteamOS) angezeigt werden
function FlagDE({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 5 3" className={className} aria-hidden="true">
      <rect width="5" height="1" y="0" fill="#000" />
      <rect width="5" height="1" y="1" fill="#DD0000" />
      <rect width="5" height="1" y="2" fill="#FFCE00" />
    </svg>
  );
}

function FlagUS({ className = '' }: { className?: string }) {
  const stripes = Array.from({ length: 13 }, (_, i) => i);
  return (
    <svg viewBox="0 0 19 10" className={className} aria-hidden="true">
      {stripes.map((i) => (
        <rect key={i} y={(i * 10) / 13} width="19" height={10 / 13 + 0.02} fill={i % 2 === 0 ? '#B22234' : '#fff'} />
      ))}
      <rect width="7.6" height={(10 / 13) * 7} fill="#3C3B6E" />
      {[1, 2, 3, 4].map((r) =>
        [1, 2, 3, 4, 5].map((c) => (
          <circle key={`${r}-${c}`} cx={c * 1.27} cy={r * 1.08} r="0.28" fill="#fff" />
        ))
      )}
    </svg>
  );
}

const OPTIONS: { lang: Lang; label: string; short: string; Flag: typeof FlagDE }[] = [
  { lang: 'de', label: 'Deutsch', short: 'DE', Flag: FlagDE },
  { lang: 'en', label: 'English', short: 'EN', Flag: FlagUS },
];

export default function LanguageSwitcher() {
  const lang = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = OPTIONS.find((o) => o.lang === lang) ?? OPTIONS[0];

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
        data-testid="language-switcher-button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        title={lang === 'en' ? 'Language' : 'Sprache'}
        className={`flex items-center gap-2 pl-2.5 pr-2 py-2 rounded-lg text-sm font-medium border transition-colors ${
          open
            ? 'text-white bg-ink-800 border-primary-500/50'
            : 'text-ink-200 bg-ink-850 hover:bg-ink-800 border-ink-700/60'
        }`}
      >
        <active.Flag className="h-3.5 w-5 rounded-[2px] ring-1 ring-black/30 shrink-0" />
        <span className="hidden sm:inline">{active.label}</span>
        <span className="sm:hidden">{active.short}</span>
        <ChevronDown size={14} className={`text-ink-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="listbox"
          data-testid="language-switcher-menu"
          className="absolute left-1/2 -translate-x-1/2 top-11 z-40 w-40 rounded-xl border border-ink-700 bg-ink-850 shadow-xl py-1 animate-fade-in"
        >
          {OPTIONS.map((o) => {
            const selected = o.lang === lang;
            return (
              <button
                key={o.lang}
                type="button"
                role="option"
                aria-selected={selected}
                data-testid={`language-option-${o.lang}`}
                onClick={() => {
                  setLang(o.lang);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                  selected ? 'text-primary-300 bg-primary-500/10' : 'text-ink-300 hover:bg-ink-800 hover:text-white'
                }`}
              >
                <o.Flag className="h-3.5 w-5 rounded-[2px] ring-1 ring-black/30 shrink-0" />
                <span className="flex-1 text-left">{o.label}</span>
                {selected && <Check size={14} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export interface DarkSelectOption {
  value: string;
  label: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: DarkSelectOption[];
  testid?: string;
  size?: 'md' | 'sm';
  className?: string;
  title?: string;
  ariaLabel?: string;
}

/**
 * Dunkles Auswahlfeld. Ersetzt das native <select>, dessen Liste je nach Betriebssystem
 * weiß (und schlecht lesbar) dargestellt wird. Aussehen und Bedienung sind überall gleich.
 */
export default function DarkSelect({ value, onChange, options, testid, size = 'md', className = '', title, ariaLabel }: Props) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [up, setUp] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);

  const selectedIdx = Math.max(0, options.findIndex((o) => o.value === value));
  const selected = options[selectedIdx];

  const toggle = () => {
    if (!open && wrap.current) {
      // Nach oben öffnen, wenn unten zu wenig Platz ist
      const r = wrap.current.getBoundingClientRect();
      setUp(window.innerHeight - r.bottom < 260 && r.top > 260);
      setActive(selectedIdx);
    }
    setOpen((v) => !v);
  };

  const pick = (v: string) => {
    setOpen(false);
    if (v !== value) onChange(v);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
    };
  }, [open]);

  // Aktiven Eintrag sichtbar halten
  useEffect(() => {
    if (!open) return;
    const el = list.current?.children[active] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (open) {
        e.stopPropagation();
        setOpen(false);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) toggle();
      else setActive((a) => Math.min(options.length - 1, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) toggle();
      else setActive((a) => Math.max(0, a - 1));
    } else if (e.key === 'Enter' && open) {
      e.preventDefault();
      pick(options[active].value);
    }
  };

  const btn =
    size === 'sm'
      ? 'px-2.5 py-1 text-xs rounded-lg text-ink-300 max-w-[220px]'
      : 'w-full px-3.5 py-2.5 text-sm rounded-xl text-ink-100';

  return (
    <div ref={wrap} className={`relative ${size === 'sm' ? 'inline-block' : 'block'} ${className}`} onKeyDown={onKey}>
      <button
        type="button"
        data-testid={testid}
        data-value={value}
        title={title}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={toggle}
        className={`flex items-center justify-between gap-2 text-left bg-ink-850 border border-ink-700/70 hover:border-ink-600 focus:outline-none focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/20 transition-all ${btn}`}
      >
        <span className="truncate">{selected?.label ?? ''}</span>
        <ChevronDown size={size === 'sm' ? 12 : 15} className={`shrink-0 text-ink-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <ul
          ref={list}
          role="listbox"
          data-testid={testid ? `${testid}-list` : undefined}
          className={`absolute z-50 left-0 min-w-full w-max max-w-[min(90vw,26rem)] max-h-64 overflow-auto rounded-xl border border-ink-700 bg-ink-900 shadow-2xl shadow-black/60 py-1 animate-fade-in ${
            up ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          }`}
        >
          {options.map((o, i) => {
            const isSel = o.value === value;
            return (
              <li
                key={`${o.value}-${i}`}
                role="option"
                aria-selected={isSel}
                data-testid={testid ? `${testid}-opt-${o.value}` : undefined}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(o.value)}
                className={`flex items-center justify-between gap-3 px-3.5 py-2 text-sm cursor-pointer ${
                  i === active ? 'bg-primary-500/15 text-white' : 'text-ink-200'
                } ${isSel ? 'font-semibold' : ''}`}
              >
                <span className="whitespace-nowrap">{o.label}</span>
                {isSel && <Check size={14} className="text-primary-400 shrink-0" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

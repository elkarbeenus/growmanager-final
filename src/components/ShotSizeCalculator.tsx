import { useEffect, useRef, useState } from 'react';
import { Calculator, Leaf, Flower2, Info } from 'lucide-react';
import { t, displayToLiters, litersToDisplay, volumeUnit, fmtNum, isEn, useLang } from '@/lib/i18n';

const inputCls =
  'w-full bg-ink-850 border border-ink-700/70 rounded-xl px-3 py-2.5 text-sm text-ink-100 placeholder-ink-600 focus:outline-none focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/20 transition-all';

// Richtwerte für Shotgrößen beim Crop Steering (Anteil am Mediumvolumen pro Shot).
// Vegetativ: größere Shots, hoher Wassergehalt, geringer Dryback.
// Generativ: kleinere Shots, stärkerer Dryback zwischen den Bewässerungen.
const PRESETS = {
  veg: { min: 4, def: 5, max: 6 },
  gen: { min: 2, def: 3, max: 4 },
} as const;

type Mode = keyof typeof PRESETS;

// Eingaben werden (in Litern) lokal gemerkt, damit sie beim Tab-Wechsel nicht verloren gehen.
const STORAGE_KEY = 'growhub:shotsize';

function loadSaved(): { liters?: number; veg?: number; gen?: number } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function litersToText(liters: number | undefined): string {
  const v = litersToDisplay(liters);
  return v === undefined ? '' : String(Number(v.toFixed(2)));
}

export default function ShotSizeCalculator() {
  const lang = useLang();
  const saved = useRef(loadSaved()).current;
  const [size, setSize] = useState(() => litersToText(saved.liters));
  // Zuletzt eingegebenes Volumen in Litern (unabhängig von der Anzeigeeinheit)
  const litersRef = useRef(saved.liters ?? 0);
  const onSizeChange = (text: string) => {
    setSize(text);
    const n = Number(text.replace(',', '.'));
    litersRef.current = text.trim() !== '' && Number.isFinite(n) && n > 0 ? displayToLiters(n) ?? n : 0;
  };
  const [pct, setPct] = useState<Record<Mode, number>>({
    veg: saved.veg ?? PRESETS.veg.def,
    gen: saved.gen ?? PRESETS.gen.def,
  });

  const sizeNum = Number(size.replace(',', '.'));
  const valid = size.trim() !== '' && Number.isFinite(sizeNum) && sizeNum > 0;
  const liters = valid ? displayToLiters(sizeNum) ?? sizeNum : 0;
  const mediumMl = liters * 1000;
  const ml = (p: number) => (mediumMl * p) / 100;

  // Bei Sprachwechsel (L ↔ gal) den Anzeigewert aus dem gemerkten Litervolumen neu bilden
  useEffect(() => {
    if (litersRef.current > 0) setSize(litersToText(litersRef.current));
  }, [lang]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ liters: valid ? liters : undefined, veg: pct.veg, gen: pct.gen })
      );
    } catch {
      /* ignore */
    }
  }, [valid, liters, pct]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Calculator size={18} className="text-primary-400" />
          {t('Crop Steering Shot Size Rechner', 'Crop Steering Shot Size Calculator')}
        </h2>
        <p className="text-sm text-ink-500 mt-0.5">
          {t(
            'Gib die Größe deines Mediums ein – der Rechner ermittelt die Shotgröße für die vegetative und die generative Steuerung in % und mL.',
            'Enter the size of your growing medium – the calculator returns the shot size for vegetative and generative steering in % and mL.'
          )}
        </p>
      </div>

      <div className="rounded-2xl border border-ink-800 bg-ink-900/60 p-5">
        <label className="block text-xs font-semibold uppercase tracking-widest text-ink-500 mb-2">
          {t('Mediumgröße', 'Medium size')} ({volumeUnit()})
        </label>
        <input
          data-testid="medium-size"
          type="text"
          inputMode="decimal"
          value={size}
          onChange={(e) => onSizeChange(e.target.value)}
          placeholder={isEn() ? 'e.g. 3' : 'z. B. 11'}
          className={`${inputCls} max-w-xs`}
        />
        {valid && isEn() && (
          <div className="text-xs text-ink-500 mt-2">≈ {fmtNum(liters, 2)} L</div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <ResultCard
          mode="veg"
          icon={<Leaf size={18} />}
          title={t('Vegetativ', 'Vegetative')}
          hint={t('Größere Shots, geringer Dryback', 'Larger shots, low dryback')}
          tone="primary"
          valid={valid}
          pct={pct.veg}
          onPct={(v) => setPct((p) => ({ ...p, veg: v }))}
          ml={ml}
        />
        <ResultCard
          mode="gen"
          icon={<Flower2 size={18} />}
          title={t('Generativ', 'Generative')}
          hint={t('Kleinere Shots, stärkerer Dryback', 'Smaller shots, stronger dryback')}
          tone="warning"
          valid={valid}
          pct={pct.gen}
          onPct={(v) => setPct((p) => ({ ...p, gen: v }))}
          ml={ml}
        />
      </div>

      <div className="rounded-xl border border-ink-800 bg-ink-900/40 p-4 flex gap-3 text-xs text-ink-400 leading-relaxed">
        <Info size={15} className="text-ink-500 shrink-0 mt-0.5" />
        <p>
          {t(
            'Richtwerte: vegetativ ca. 4–6 %, generativ ca. 2–4 % des Mediumvolumens pro Shot. Mit dem Regler kannst du den Wert an Substrat, Pflanzengröße und Dryback anpassen. Das Ergebnis ist eine Orientierung, keine feste Regel.',
            'Guideline: vegetative approx. 4–6 %, generative approx. 2–4 % of the medium volume per shot. Use the slider to adapt the value to substrate, plant size and dryback. The result is a guide, not a fixed rule.'
          )}
        </p>
      </div>
    </div>
  );
}

function ResultCard({
  mode,
  icon,
  title,
  hint,
  tone,
  valid,
  pct,
  onPct,
  ml,
}: {
  mode: Mode;
  icon: React.ReactNode;
  title: string;
  hint: string;
  tone: 'primary' | 'warning';
  valid: boolean;
  pct: number;
  onPct: (v: number) => void;
  ml: (p: number) => number;
}) {
  const { min, max } = PRESETS[mode];
  const toneCls =
    tone === 'primary'
      ? 'text-primary-400 bg-primary-500/10 border-primary-500/20'
      : 'text-warning-400 bg-warning-500/10 border-warning-500/20';
  const accent = tone === 'primary' ? 'accent-emerald-500' : 'accent-amber-500';

  return (
    <div className="rounded-2xl border border-ink-800 bg-ink-900/60 p-5" data-testid={`card-${mode}`}>
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${toneCls}`}>{icon}</div>
        <div>
          <div className="font-semibold text-white leading-tight">{title}</div>
          <div className="text-xs text-ink-500 mt-0.5">{hint}</div>
        </div>
      </div>

      <div className="mt-5 flex items-end gap-6">
        <div>
          <div className="text-xs uppercase tracking-widest text-ink-500">{t('Shotgröße', 'Shot size')}</div>
          <div className="text-3xl font-bold text-white tabular-nums" data-testid={`pct-${mode}`}>
            {fmtNum(pct, 1)} %
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-ink-500">mL</div>
          <div className="text-3xl font-bold text-white tabular-nums" data-testid={`ml-${mode}`}>
            {valid ? fmtNum(ml(pct), 0) : '–'}
          </div>
        </div>
      </div>

      <div className="mt-5">
        <input
          data-testid={`slider-${mode}`}
          type="range"
          min={min - 1}
          max={max + 1}
          step={0.5}
          value={pct}
          onChange={(e) => onPct(Number(e.target.value))}
          className={`w-full ${accent}`}
        />
        <div className="flex justify-between text-[11px] text-ink-600 tabular-nums mt-1">
          <span>{min - 1} %</span>
          <span>
            {t('Richtwert', 'Guideline')} {min}–{max} %
          </span>
          <span>{max + 1} %</span>
        </div>
      </div>

      <div className="mt-4 text-xs text-ink-400 tabular-nums">
        {t('Bereich', 'Range')}: {valid ? `${fmtNum(ml(min), 0)} – ${fmtNum(ml(max), 0)} mL` : '–'} ({min}–{max} %)
      </div>
    </div>
  );
}

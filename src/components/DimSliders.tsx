import type { DimProfile } from '@/types';
import { DEFAULT_DIM } from '@/lib/power';
import { t } from '@/lib/i18n';

interface DimSlidersProps {
  value: DimProfile; // aktuell wirksames Profil
  base: DimProfile; // Vorgabe der Lampe (für „Zurücksetzen“)
  custom: boolean; // true = eigenes Profil dieses Grows
  onChange: (v: DimProfile) => void;
  onReset: () => void;
  testid?: string;
}

function Row({ label, value, min, max, unit, onChange, id }: { label: string; value: number; min: number; max: number; unit: string; onChange: (n: number) => void; id: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-ink-400 w-36 shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        data-testid={id}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-emerald-500 h-1.5"
      />
      <span className="text-xs font-semibold text-ink-100 tabular-nums w-14 text-right">
        {value} {unit}
      </span>
    </div>
  );
}

/** Schieberegler für das Dimm-Profil einer LED (pro Grow anpassbar). */
export default function DimSliders({ value, base, custom, onChange, onReset, testid = 'dim-sliders' }: DimSlidersProps) {
  const set = (patch: Partial<DimProfile>) => onChange({ ...value, ...patch });
  return (
    <div className="rounded-xl border border-ink-800 bg-ink-900/50 p-3 space-y-2.5" data-testid={testid}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-ink-200">{t('Helligkeit (Dimmen)', 'Brightness (dimming)')}</span>
        {custom ? (
          <button type="button" onClick={onReset} data-testid={`${testid}-reset`} className="text-[11px] text-warning-300 hover:text-warning-200 underline underline-offset-2">
            {t('Auf Lampen-Vorgabe zurücksetzen', 'Reset to lamp default')}
          </button>
        ) : (
          <span className="text-[11px] text-ink-500">{t('Vorgabe der Lampe', 'Lamp default')}</span>
        )}
      </div>
      <Row id={`${testid}-veg`} label={t('Wachstum', 'Veg')} value={value.veg} min={0} max={100} unit="%" onChange={(n) => set({ veg: n })} />
      <Row id={`${testid}-fs`} label={t('Stretch-Start', 'Stretch start')} value={value.flowerStart} min={0} max={100} unit="%" onChange={(n) => set({ flowerStart: n })} />
      <Row id={`${testid}-fe`} label={t('Blüte (nach Stretch)', 'Flower (after stretch)')} value={value.flowerEnd} min={0} max={100} unit="%" onChange={(n) => set({ flowerEnd: n })} />
      <p className="text-[11px] text-ink-500 leading-relaxed">
        {t(
          `Ab Stretch-Start wird die Helligkeit langsam bis zum Ende des Stretch auf den Blüte-Wert erhöht, danach bleibt sie dort. Das Ende des Stretch stammt aus den Meilensteinen („Ende Stretch“), ohne Eintrag gelten ${value.rampWeeks} Wochen. Standard: Wachstum ${DEFAULT_DIM.veg} %, Stretch ${DEFAULT_DIM.flowerStart} %, Blüte ${DEFAULT_DIM.flowerEnd} %. Gilt nur für diesen Grow.`,
          `From stretch start the brightness is raised gradually until the end of the stretch to the flower value, then it stays there. The end of the stretch comes from the milestones (“End of stretch”); without one, ${value.rampWeeks} weeks are used. Default: veg ${DEFAULT_DIM.veg} %, stretch ${DEFAULT_DIM.flowerStart} %, flower ${DEFAULT_DIM.flowerEnd} %. Applies to this grow only.`
        )}
      </p>
    </div>
  );
}

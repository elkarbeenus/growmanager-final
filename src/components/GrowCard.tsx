import {
  Sprout,
  CalendarDays,
  Hourglass,
  MoreVertical,
  Pencil,
  Trash2,
  CheckCircle2,
  Timer,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Grow } from '@/types';
import {
  currentPhase,
  phaseProgress,
  daysSince,
  daysUntil,
  growStartDate,
  earliestDate,
  totalGrowDuration,
} from '@/lib/growLogic';
import { t } from '@/lib/i18n';
import { plantsOf, plantsLabel } from '@/lib/growStats';

interface GrowCardProps {
  grow: Grow;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function GrowCard({ grow, onOpen, onEdit, onDelete }: GrowCardProps) {
  const phase = currentPhase(grow);
  const progress = phaseProgress(grow);
  const elapsed = daysSince(growStartDate(grow));
  const remaining = daysUntil(grow.milestones.expectedHarvest);
  const totalDuration = totalGrowDuration(grow);
  const isHarvested = phase.key === 'harvested';
  const dayUnit = t('T', 'd'); // Tage: DE "T", EN "d"
  const isPlannedGrow = phase.key === 'planning';
  const startsIn = daysUntil(growStartDate(grow) ?? earliestDate(grow));

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  const tint = isHarvested ? '#f5b544' : grow.color;
  const bigValue = isHarvested
    ? totalDuration !== null ? totalDuration : null
    : isPlannedGrow
      ? startsIn !== null && startsIn > 0 && startsIn < 36500 ? startsIn : null
      : elapsed;
  const bigLabel = isHarvested
    ? t('Tage gesamt', 'days total')
    : isPlannedGrow
      ? t('Tage bis Start', 'days to start')
      : t('Tage seit Start', 'days since start');

  return (
    <div
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && e.currentTarget === e.target) onOpen();
      }}
      data-testid="grow-card"
      className="group relative rounded-2xl border border-ink-800 bg-ink-900 hover:border-ink-700 hover:bg-ink-850 transition-colors cursor-pointer overflow-hidden shadow-card"
    >
      {/* Farbkante des Grows */}
      <span className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: tint }} aria-hidden="true" />

      <div className="pl-5 pr-4 pt-4 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-md"
                style={{ color: tint, backgroundColor: `${tint}17` }}
              >
                {isHarvested ? <CheckCircle2 size={12} /> : <Sprout size={12} />}
                {phase.label}
              </span>
            </div>
            <h3 className="mt-2 font-display text-xl font-bold text-white truncate leading-tight">{grow.name}</h3>
            <p className="text-xs text-ink-400 truncate mt-0.5">
              {grow.strain && <>{grow.strain} · </>}
              <span data-testid="card-plants">{plantsLabel(plantsOf(grow))}</span>
            </p>
          </div>

          <div className="relative" ref={menuRef} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-ink-500 hover:text-white hover:bg-ink-800"
              aria-label={t('Weitere Optionen', 'More options')}
            >
              <MoreVertical size={16} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-9 z-20 w-40 rounded-xl border border-ink-700 bg-ink-850 shadow-xl py-1 animate-fade-in">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-ink-200 hover:bg-ink-800 hover:text-white"
                >
                  <Pencil size={14} /> {t('Bearbeiten', 'Edit')}
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-error-300 hover:bg-error-500/10"
                >
                  <Trash2 size={14} /> {t('Löschen', 'Delete')}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-end justify-between gap-4">
          <div>
            <div className="font-display text-[2.6rem] leading-none font-extrabold text-white tabular-nums tracking-tight">
              {bigValue !== null ? bigValue : '—'}
            </div>
            <div className="text-xs text-ink-400 mt-1.5 flex items-center gap-1">
              {isHarvested ? <Timer size={12} /> : <CalendarDays size={12} />}
              {bigLabel}
            </div>
          </div>
          {isHarvested && grow.drying?.harvestAmount !== undefined ? (
            <div className="text-right">
              <div className="font-display text-2xl font-bold text-warning-300 tabular-nums leading-none">{grow.drying.harvestAmount} g</div>
              <div className="text-xs text-ink-400 mt-1.5">{t('Erntemenge', 'Harvest yield')}</div>
            </div>
          ) : (
            <div className="text-right">
              <div className="font-display text-2xl font-bold text-ink-100 tabular-nums leading-none">
                {remaining !== null ? `${remaining}${dayUnit}` : '—'}
              </div>
              <div className="text-xs text-ink-400 mt-1.5 flex items-center gap-1 justify-end">
                <Hourglass size={12} /> {t('bis Ernte', 'to harvest')}
              </div>
            </div>
          )}
        </div>

        {/* Lichtspektrum als Fortschritt: je erreichtem Meilenstein leuchtet ein Abschnitt */}
        <div className="mt-4" title={`${progress.completed} / ${progress.total} ${t('Meilensteine', 'milestones')}`}>
          <div className="relative h-1.5 rounded-full overflow-hidden bg-ink-800">
            <div className="absolute inset-0 gm-spectrum opacity-[0.18]" />
            <div
              className="absolute inset-y-0 left-0 gm-spectrum transition-[width] duration-500"
              style={{ width: `${progress.percent}%`, backgroundSize: `${progress.percent > 0 ? (100 / progress.percent) * 100 : 100}% 100%` }}
            />
            {Array.from({ length: progress.total - 1 }, (_, k) => (
              <span key={k} className="absolute inset-y-0 w-[2px] bg-ink-900" style={{ left: `${((k + 1) / progress.total) * 100}%` }} />
            ))}
          </div>
          <div className="flex justify-between mt-1.5 text-[11px] text-ink-500 tabular-nums">
            <span>{progress.completed}/{progress.total} {t('Meilensteine', 'milestones')}</span>
            <span>{progress.percent}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

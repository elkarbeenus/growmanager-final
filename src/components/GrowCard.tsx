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

  return (
    <div
      onClick={onOpen}
      className={`group relative rounded-3xl border transition-all p-5 cursor-pointer overflow-hidden ${
        isHarvested
          ? 'border-error-500/20 bg-error-500/[0.06] hover:bg-error-500/[0.1] hover:border-error-500/30'
          : 'border-ink-800 bg-ink-900/60 hover:bg-ink-900 hover:border-ink-700'
      }`}
    >
      {/* glow accent */}
      <div
        className={`absolute -top-16 -right-16 h-40 w-40 rounded-full blur-3xl transition-opacity ${
          isHarvested ? 'opacity-25 group-hover:opacity-40' : 'opacity-20 group-hover:opacity-40'
        }`}
        style={{ backgroundColor: isHarvested ? '#ef4444' : grow.color }}
      />

      <div className="relative flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 border"
            style={{
              backgroundColor: isHarvested ? '#ef44441a' : `${grow.color}1a`,
              borderColor: isHarvested ? '#ef444444' : `${grow.color}44`,
              color: isHarvested ? '#f87171' : grow.color,
            }}
          >
            {isHarvested ? <CheckCircle2 size={20} /> : <Sprout size={20} />}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-white truncate">{grow.name}</h3>
            <p className="text-xs text-ink-500 truncate">
              {grow.strain && <>{grow.strain} · </>}
              <span data-testid="card-plants">{plantsLabel(plantsOf(grow))}</span>
            </p>
          </div>
        </div>

        <div className="relative" ref={menuRef} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-ink-500 hover:text-white hover:bg-ink-800 transition-colors"
            aria-label={t('Weitere Optionen', 'More options')}
          >
            <MoreVertical size={16} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-9 z-20 w-36 rounded-xl border border-ink-700 bg-ink-850 shadow-xl py-1 animate-fade-in">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onEdit();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-ink-300 hover:bg-ink-800 hover:text-white transition-colors"
              >
                <Pencil size={14} /> {t('Bearbeiten', 'Edit')}
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDelete();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-error-300 hover:bg-error-500/10 transition-colors"
              >
                <Trash2 size={14} /> {t('Löschen', 'Delete')}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="relative mb-4">
        <div className="flex items-center justify-between mb-2">
          <span
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border"
            style={{
              color: isHarvested ? '#f87171' : grow.color,
              backgroundColor: isHarvested ? '#ef444414' : `${grow.color}14`,
              borderColor: isHarvested ? '#ef444433' : `${grow.color}33`,
            }}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${isHarvested ? '' : 'animate-pulse-soft'}`}
              style={{ backgroundColor: isHarvested ? '#ef4444' : grow.color }}
            />
            {phase.label}
          </span>
          <span className="text-xs text-ink-500 tabular-nums">
            {progress.percent}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-ink-850 border border-ink-800 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress.percent}%`,
              background: isHarvested
                ? 'linear-gradient(90deg, #ef4444, #ef4444cc)'
                : `linear-gradient(90deg, ${grow.color}, ${grow.color}cc)`,
            }}
          />
        </div>
      </div>

      <div className="relative grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-xl bg-ink-850/60 border border-ink-800 px-3 py-2">
          <div className="text-[10px] uppercase tracking-wide text-ink-500 flex items-center gap-1">
            {isHarvested ? <Timer size={11} /> : <CalendarDays size={11} />}{' '}
            {isHarvested
              ? t('Gesamtdauer', 'Total duration')
              : isPlannedGrow
                ? t('Start in', 'Starts in')
                : t('Seit Start', 'Since start')}
          </div>
          <div className="text-ink-100 font-semibold tabular-nums">
            {isHarvested
              ? totalDuration !== null ? `${totalDuration}${dayUnit}` : '—'
              : isPlannedGrow
                ? startsIn !== null && startsIn > 0 && startsIn < 36500 ? `${startsIn}${dayUnit}` : '—'
                : elapsed !== null ? `${elapsed}${dayUnit}` : '—'}
          </div>
        </div>
        {isHarvested && grow.drying?.harvestAmount !== undefined ? (
          <div className="rounded-xl bg-error-500/10 border border-error-500/20 px-3 py-2">
            <div className="text-[10px] uppercase tracking-wide text-error-400 flex items-center gap-1">
              <CheckCircle2 size={11} /> {t('Erntemenge', 'Harvest yield')}
            </div>
            <div className="text-error-200 font-semibold tabular-nums">
              {grow.drying.harvestAmount}g
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-ink-850/60 border border-ink-800 px-3 py-2">
            <div className="text-[10px] uppercase tracking-wide text-ink-500 flex items-center gap-1">
              <Hourglass size={11} /> {t('Bis Ernte', 'To harvest')}
            </div>
            <div className="text-ink-100 font-semibold tabular-nums">
              {remaining !== null ? `${remaining}${dayUnit}` : '—'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

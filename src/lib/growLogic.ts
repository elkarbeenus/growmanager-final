import type {
  Grow,
  MilestoneKey,
  Milestones,
  PhaseInfo,
  PhaseKey,
} from '@/types';
import { t, locale } from '@/lib/i18n';

// Als Funktion, damit Labels in der aktuellen Sprache erzeugt werden
function phases(): Record<PhaseKey, PhaseInfo> {
  return {
  planning: {
    key: 'planning',
    label: t('Geplant', 'Planned'),
    description: t('Wartet auf Startdatum (Steckling)', 'Waiting for start date (clone)'),
    accent: 'ink',
  },
  germination: {
    key: 'germination',
    label: t('Steckling', 'Clone'),
    description: t('Steckling gesetzt', 'Clone planted'),
    accent: 'primary',
  },
  veg: {
    key: 'veg',
    label: t('Wachstum', 'Veg'),
    description: t('Wachstumsphase — Struktur aufbauen', 'Vegetative phase — building structure'),
    accent: 'accent',
  },
  stretch: {
    key: 'stretch',
    label: 'Stretch',
    description: t('Frühe Blüte — Streckung', 'Early flower — stretch'),
    accent: 'warning',
  },
  bloom: {
    key: 'bloom',
    label: t('Blüte', 'Flower'),
    description: t('Aktive Blüte — Blüten bilden sich', 'Active flower — buds are forming'),
    accent: 'warning',
  },
  ready: {
    key: 'ready',
    label: t('Ernte bereit', 'Ready to harvest'),
    description: t('Im Erntefenster', 'In harvest window'),
    accent: 'error',
  },
  harvested: {
    key: 'harvested',
    label: t('Geerntet', 'Harvested'),
    description: t('Grow abgeschlossen', 'Grow completed'),
    accent: 'ink',
  },
  };
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function daysBetween(from: string | undefined, to: string | undefined): number | null {
  if (!from || !to) return null;
  const a = new Date(from + 'T00:00:00');
  const b = new Date(to + 'T00:00:00');
  const diff = Math.round((b.getTime() - a.getTime()) / 86400000);
  return Number.isFinite(diff) ? diff : null;
}

export function daysSince(date: string | undefined): number | null {
  if (!date) return null;
  return daysBetween(date, todayStr());
}

export function daysUntil(date: string | undefined): number | null {
  if (!date) return null;
  return daysBetween(todayStr(), date);
}

export function addDays(date: string, days: number): string {
  const d = new Date(date + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function describePhaseDuration(
  grow: Grow
): { label: string; value: string | null }[] {
  const m = grow.milestones;
  const entries: { label: string; value: string | null }[] = [];

  const veg = daysBetween(m.vegStart, m.flowerStart);
  const stretch = daysBetween(m.flowerStart, m.stretchEnd);
  const bloom = daysBetween(m.stretchEnd, m.expectedHarvest);

  const d = t('Tage', 'days');
  entries.push({ label: t('Wachstumsphase', 'Veg phase'), value: veg !== null ? `${veg} ${d}` : null });
  entries.push({ label: 'Stretch', value: stretch !== null ? `${stretch} ${d}` : null });
  entries.push({ label: t('Blüte (gesch.)', 'Flower (est.)'), value: bloom !== null ? `${bloom} ${d}` : null });

  if (m.flowerStart) {
    const sinceFlip = daysSince(m.flowerStart);
    if (sinceFlip !== null && sinceFlip >= 0) {
      const week = Math.floor(sinceFlip / 7) + 1;
      entries.push({ label: t('Aktuelle Blütewoche', 'Current flower week'), value: `${t('Woche', 'Week')} ${week}` });
    }
  }

  return entries.filter((e) => e.value !== null);
}

/**
 * Ein Grow gilt als "geplant", wenn er noch nicht geerntet ist und sein frühester
 * Meilenstein in der Zukunft liegt – oder wenn noch gar kein Datum gesetzt ist.
 */
export function isPlanned(grow: Grow): boolean {
  const m = grow.milestones;
  const today = todayStr();
  if (m.actualHarvest && today >= m.actualHarvest) return false;
  const dates = [m.cloneStart, m.vegStart, m.flowerStart, m.stretchEnd, m.expectedHarvest].filter(
    (d): d is string => !!d
  );
  if (dates.length === 0) return true;
  return dates.reduce((a, b) => (a < b ? a : b)) > today;
}

/** Frühester gesetzter Meilenstein (zum Sortieren geplanter Grows). */
export function earliestDate(grow: Grow): string {
  const m = grow.milestones;
  const dates = [m.cloneStart, m.vegStart, m.flowerStart, m.stretchEnd, m.expectedHarvest].filter(
    (d): d is string => !!d
  );
  return dates.length ? dates.reduce((a, b) => (a < b ? a : b)) : '9999-12-31';
}

export function currentPhase(grow: Grow): PhaseInfo {
  const m = grow.milestones;
  const today = todayStr();
  const start = growStartDate(grow);
  const PHASES = phases();

  if (m.actualHarvest && today >= m.actualHarvest) return PHASES.harvested;
  if (isPlanned(grow)) return PHASES.planning;
  if (m.expectedHarvest && today > m.expectedHarvest) return PHASES.ready;
  if (m.expectedHarvest && today === m.expectedHarvest) return PHASES.ready;
  if (m.stretchEnd && today >= m.stretchEnd) return PHASES.bloom;
  if (m.flowerStart && today < (m.stretchEnd ?? today)) return PHASES.stretch;
  if (m.flowerStart && today >= m.flowerStart) return PHASES.stretch;
  if (m.vegStart && today < (m.flowerStart ?? today)) return PHASES.veg;
  if (m.vegStart && today >= m.vegStart) return PHASES.veg;
  if (start && today < (m.vegStart ?? today)) return PHASES.germination;
  if (start && today >= start) return PHASES.germination;

  return PHASES.planning;
}

// Startdatum: nur Steckling-Start (Keimung-Feld wurde entfernt)
export function growStartDate(grow: Grow): string | undefined {
  return grow.milestones.cloneStart;
}

export function phaseProgress(grow: Grow): {
  completed: number;
  total: number;
  percent: number;
  reachedIndex: number;
} {
  const order: MilestoneKey[] = [
    'cloneStart',
    'vegStart',
    'flowerStart',
    'stretchEnd',
    'expectedHarvest',
    'actualHarvest',
  ];
  const today = todayStr();
  let completed = 0;
  order.forEach((key) => {
    const d = grow.milestones[key];
    if (d && today >= d) completed++;
  });
  const total = order.length;
  const percent = Math.min(100, Math.round((completed / total) * 100));
  return { completed, total, percent, reachedIndex: completed };
}

export function milestoneProgressList(grow: Grow) {
  const items: { key: MilestoneKey; label: string }[] = [
    { key: 'cloneStart', label: t('Steckling Start', 'Clone start') },
    { key: 'vegStart', label: t('Wachstum', 'Veg') },
    { key: 'flowerStart', label: t('Beginn Blüte', 'Flower start') },
    { key: 'stretchEnd', label: t('Ende Stretch', 'End of stretch') },
    { key: 'expectedHarvest', label: t('Geplante Ernte', 'Expected harvest') },
    { key: 'actualHarvest', label: t('Tatsächliche Ernte', 'Actual harvest') },
  ];
  const today = todayStr();
  return items.map((i) => {
    const date = grow.milestones[i.key];
    return {
      ...i,
      date,
      done: !!date && today >= date,
      inFuture: !!date && today < date,
    };
  });
}

export function phaseTimeline(grow: Grow) {
  const segments: {
    key: PhaseKey;
    label: string;
    start?: string;
    end?: string;
    days: number | null;
  }[] = [];
  const m = grow.milestones;
  const start = growStartDate(grow);
  segments.push({
    key: 'germination',
    label: t('Steckling', 'Clone'),
    start,
    end: m.vegStart,
    days: daysBetween(start, m.vegStart),
  });
  segments.push({
    key: 'veg',
    label: t('Wachstum', 'Veg'),
    start: m.vegStart,
    end: m.flowerStart,
    days: daysBetween(m.vegStart, m.flowerStart),
  });
  segments.push({
    key: 'stretch',
    label: 'Stretch',
    start: m.flowerStart,
    end: m.stretchEnd,
    days: daysBetween(m.flowerStart, m.stretchEnd),
  });
  segments.push({
    key: 'bloom',
    label: t('Blüte', 'Flower'),
    start: m.stretchEnd,
    end: m.expectedHarvest,
    days: daysBetween(m.stretchEnd, m.expectedHarvest),
  });
  return segments.filter((s) => s.start && s.end);
}

// Gesamtdauer von Steckling Start bis Ernte + Trocknungstage
export function totalGrowDuration(grow: Grow): number | null {
  const start = grow.milestones.cloneStart;
  // Ernte-Ende: tatsächliche Ernte, sonst geplante Ernte
  const harvest = grow.milestones.actualHarvest ?? grow.milestones.expectedHarvest;
  if (!start || !harvest) return null;
  const growDays = daysBetween(start, harvest);
  if (growDays === null) return null;
  const dryingDays = grow.drying?.daysDried ?? 0;
  return growDays + dryingDays;
}

export function formatDate(d?: string): string {
  if (!d) return '—';
  const date = new Date(d + 'T00:00:00');
  return date.toLocaleDateString(locale(), {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function milestoneLabels(): Record<MilestoneKey, { en: string; de: string }> {
  return {
    cloneStart: { en: 'Clone Start', de: 'Steckling Start' },
    vegStart: { en: 'Transition to Veg', de: 'Beginn Wachstumsphase' },
    flowerStart: { en: 'Flip to Flower (12/12)', de: 'Beginn Blütephase' },
    stretchEnd: { en: 'End of Stretch', de: 'Ende des Stretch' },
    expectedHarvest: { en: 'Expected Harvest', de: 'Geplantes Erntefenster' },
    actualHarvest: { en: 'Actual Harvest', de: 'Tatsächliches Ernteende' },
  };
}

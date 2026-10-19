// Dünger-Verbrauch: Aus den angemischten Nährlösungs-Ansätzen (Liter) und den Dosierungen des
// gewählten Düngeschemas (mL pro Liter, je Woche) wird berechnet, wie viel mL jedes Produkts
// in welcher Phase (Start, Wachstum, Blüte, Flush) verbraucht wurden.
import type { Grow, NutrientBatch } from '@/types';
import { getFertilizers, type FertProduct, type FertSchedule, type StageKind } from '@/lib/fertilizerData';
import { AS_NEEDED, fmtNum, t } from '@/lib/i18n';
import { daysBetweenLocal } from '@/lib/nutrientLogic';

export interface ParsedDose {
  value: number; // mL pro Liter
  kind: 'none' | 'fixed' | 'range' | 'asNeeded';
}

/** "2.5" → 2.5, "8–13" → Mittelwert 10.5 (Bereich), "nach Bedarf" → nicht berechenbar. */
export function parseDose(v: string | undefined): ParsedDose {
  if (!v) return { value: 0, kind: 'none' };
  if (v === AS_NEEDED) return { value: 0, kind: 'asNeeded' };
  if (v.includes('–')) {
    const parts = v.split('–').map((p) => parseFloat(p));
    if (parts.every((n) => Number.isFinite(n))) {
      return { value: parts.reduce((a, b) => a + b, 0) / parts.length, kind: 'range' };
    }
    return { value: 0, kind: 'none' };
  }
  const n = parseFloat(v);
  return Number.isFinite(n) ? { value: n, kind: 'fixed' } : { value: 0, kind: 'none' };
}

export function formatMl(ml: number): string {
  if (ml >= 1000) return `${fmtNum(ml / 1000, 2)} L`;
  return `${fmtNum(ml, ml < 10 ? 1 : 0)} mL`;
}

export const STAGE_ORDER: StageKind[] = ['start', 'veg', 'flower', 'flush'];

export function phaseLabel(s: StageKind): string {
  return {
    start: t('Start / Steckling', 'Start / clone'),
    veg: t('Wachstum', 'Veg'),
    flower: t('Blüte', 'Flower'),
    flush: 'Flush',
  }[s];
}

/** Passende Schema-Woche (Index) für ein Datum anhand der Meilensteine eines Grows. */
export function autoWeekIndex(grow: Grow, schedule: FertSchedule, date: string): number | null {
  const m = grow.milestones;
  let stage: StageKind;
  let n: number;
  if (m.flowerStart && date >= m.flowerStart) {
    stage = 'flower';
    n = Math.floor(daysBetweenLocal(m.flowerStart, date) / 7) + 1;
  } else if (m.vegStart && date >= m.vegStart) {
    stage = 'veg';
    n = Math.floor(daysBetweenLocal(m.vegStart, date) / 7) + 1;
  } else if (m.cloneStart) {
    stage = 'start';
    n = Math.max(0, Math.floor(daysBetweenLocal(m.cloneStart, date) / 7)) + 1;
  } else {
    return null;
  }
  const pick = (st: StageKind) => schedule.weeks.map((w, i) => (w.stage === st ? i : -1)).filter((i) => i >= 0);
  let idxs = pick(stage);
  if (!idxs.length) idxs = stage === 'start' ? pick('veg') : pick(stage === 'veg' ? 'start' : 'flower');
  if (!idxs.length) return null;
  return idxs[Math.min(n, idxs.length) - 1];
}

/** Welcher Grow lief an diesem Datum? Nur eindeutig (genau ein Grow), sonst null. */
export function inferGrowForDate(date: string, grows: Grow[]): Grow | null {
  const hits = grows.filter((g) => {
    const m = g.milestones;
    const start = m.cloneStart ?? m.vegStart ?? m.flowerStart;
    if (!start || date < start) return false;
    const end = m.actualHarvest ?? m.expectedHarvest;
    return !end || date <= end;
  });
  return hits.length === 1 ? hits[0] : null;
}

export function scheduleById(id: string | undefined, list: FertSchedule[] = getFertilizers()): FertSchedule | null {
  return list.find((s) => s.id === id) ?? null;
}

export interface ResolvedBatch {
  batch: NutrientBatch;
  grow: Grow | null;
  growInferred: boolean; // Grow wurde automatisch über das Datum erkannt
  schedule: FertSchedule | null;
  weekIndex: number | null;
  weekLabel: string;
  weekAuto: boolean;
  stage: StageKind | null;
  ml: Record<string, number>;
}

export interface PhaseCol {
  stage: StageKind;
  liters: number;
  batches: number;
}

export interface UsageRow {
  product: FertProduct;
  byStage: Partial<Record<StageKind, number>>;
  total: number;
  estimated: boolean; // enthält Bereichswerte (Mittelwert)
  asNeeded: boolean; // "nach Bedarf" in mindestens einem Ansatz (nicht eingerechnet)
}

export interface ScheduleUsage {
  schedule: FertSchedule;
  liters: number;
  phases: PhaseCol[];
  rows: UsageRow[];
  stageTotals: Partial<Record<StageKind, number>>;
  totalMl: number;
  batches: ResolvedBatch[];
}

export interface UsageResult {
  groups: ScheduleUsage[];
  unresolved: ResolvedBatch[]; // kein Dünger oder keine Phase ermittelbar
  all: ResolvedBatch[];
  liters: number;
  batchCount: number;
}

/** Löst einen Ansatz auf: Grow (explizit/automatisch), Dünger, Schema-Woche, Phase und mL je Produkt. */
export function resolveBatch(b: NutrientBatch, grows: Grow[], globalFertId: string | undefined, list: FertSchedule[]): ResolvedBatch {
  let grow = b.growId ? grows.find((g) => g.id === b.growId) ?? null : null;
  let growInferred = false;
  if (!grow && !b.growId) {
    grow = inferGrowForDate(b.date, grows);
    growInferred = !!grow;
  }
  const schedule = scheduleById(grow?.fertilizerId ?? globalFertId, list);
  let weekIndex: number | null = null;
  let weekAuto = true;
  if (schedule) {
    if (b.weekIndex !== undefined && b.weekIndex >= 0 && b.weekIndex < schedule.weeks.length) {
      weekIndex = b.weekIndex;
      weekAuto = false;
    } else if (grow) {
      weekIndex = autoWeekIndex(grow, schedule, b.date);
    }
  }
  const week = schedule && weekIndex !== null ? schedule.weeks[weekIndex] : null;
  return {
    batch: b,
    grow,
    growInferred,
    schedule,
    weekIndex,
    weekLabel: week ? week.label : '—',
    weekAuto,
    stage: week ? week.stage : null,
    ml: {},
  };
}

/**
 * Verbrauch für alle Ansätze (oder nur die eines Grows) berechnen.
 * growId = undefined → alle Ansätze; sonst nur Ansätze, die zu diesem Grow gehören.
 */
export function computeUsage(
  batches: NutrientBatch[],
  grows: Grow[],
  globalFertId: string | undefined,
  growId?: string,
  list: FertSchedule[] = getFertilizers()
): UsageResult {
  const sorted = [...batches].sort((a, b) => (a.date === b.date ? a.createdAt.localeCompare(b.createdAt) : a.date.localeCompare(b.date)));
  let resolved = sorted.map((b) => resolveBatch(b, grows, globalFertId, list));
  if (growId) resolved = resolved.filter((r) => r.grow?.id === growId);

  const unresolved: ResolvedBatch[] = [];
  const bySchedule = new Map<string, ResolvedBatch[]>();
  for (const r of resolved) {
    if (!r.schedule || !r.stage) {
      unresolved.push(r);
      continue;
    }
    bySchedule.set(r.schedule.id, [...(bySchedule.get(r.schedule.id) ?? []), r]);
  }

  const groups: ScheduleUsage[] = [];
  for (const [id, items] of bySchedule) {
    const schedule = items[0].schedule as FertSchedule;
    const rowMap = new Map<string, UsageRow>(
      schedule.products.map((product) => [product.key, { product, byStage: {}, total: 0, estimated: false, asNeeded: false }])
    );
    const phaseMap = new Map<StageKind, PhaseCol>();
    for (const r of items) {
      const stage = r.stage as StageKind;
      const week = schedule.weeks[r.weekIndex as number];
      const ph = phaseMap.get(stage) ?? { stage, liters: 0, batches: 0 };
      ph.liters += r.batch.liters;
      ph.batches += 1;
      phaseMap.set(stage, ph);
      for (const p of schedule.products) {
        const d = parseDose(week.doses[p.key]);
        const row = rowMap.get(p.key) as UsageRow;
        if (d.kind === 'fixed' || d.kind === 'range') {
          const amount = d.value * r.batch.liters;
          r.ml[p.key] = amount;
          row.byStage[stage] = (row.byStage[stage] ?? 0) + amount;
          row.total += amount;
          if (d.kind === 'range') row.estimated = true;
        } else if (d.kind === 'asNeeded') {
          row.asNeeded = true;
        }
      }
    }
    const rows = [...rowMap.values()].filter((r) => r.total > 0 || r.asNeeded);
    const stageTotals: Partial<Record<StageKind, number>> = {};
    rows.forEach((r) => {
      for (const s of STAGE_ORDER) if (r.byStage[s]) stageTotals[s] = (stageTotals[s] ?? 0) + (r.byStage[s] as number);
    });
    groups.push({
      schedule,
      liters: items.reduce((s, r) => s + r.batch.liters, 0),
      phases: STAGE_ORDER.filter((s) => phaseMap.has(s)).map((s) => phaseMap.get(s) as PhaseCol),
      rows,
      stageTotals,
      totalMl: rows.reduce((s, r) => s + r.total, 0),
      batches: items,
    });
    void id;
  }

  return {
    groups,
    unresolved,
    all: resolved,
    liters: resolved.reduce((s, r) => s + r.batch.liters, 0),
    batchCount: resolved.length,
  };
}

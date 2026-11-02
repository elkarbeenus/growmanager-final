import type { Grow, NutrientBatch } from '@/types';

// Mineralische Nährlösung: spätestens nach 12 Tagen erneuern (max. 14 Tage haltbar)
export const RENEW_AFTER_DAYS = 12;
export const MAX_AGE_DAYS = 14;

/** Lokales Datum als YYYY-MM-DD (nicht UTC, damit der Tageswechsel stimmt). */
export function localToday(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function daysBetweenLocal(from: string, to: string): number {
  const [fy, fm, fd] = from.split('-').map(Number);
  const [ty, tm, td] = to.split('-').map(Number);
  const a = Date.UTC(fy, fm - 1, fd);
  const b = Date.UTC(ty, tm - 1, td);
  return Math.round((b - a) / 86400000);
}

export function latestBatch(batches: NutrientBatch[] | undefined): NutrientBatch | null {
  if (!batches || batches.length === 0) return null;
  return [...batches].sort((a, b) =>
    a.date === b.date ? b.createdAt.localeCompare(a.createdAt) : b.date.localeCompare(a.date)
  )[0];
}

export type BatchStatus = 'none' | 'fresh' | 'soon' | 'renew' | 'expired';

export interface BatchState {
  status: BatchStatus;
  day: number; // Tag 1 = Tag des Anmischens
  daysLeft: number; // Tage bis zur Erneuerung (>= 0)
  batch: NutrientBatch | null;
}

export function batchState(batches: NutrientBatch[] | undefined, today = localToday()): BatchState {
  const batch = latestBatch(batches);
  if (!batch) return { status: 'none', day: 0, daysLeft: 0, batch: null };
  const age = Math.max(0, daysBetweenLocal(batch.date, today));
  const day = age + 1;
  const daysLeft = Math.max(0, RENEW_AFTER_DAYS - age);
  let status: BatchStatus = 'fresh';
  if (age >= MAX_AGE_DAYS) status = 'expired';
  else if (age >= RENEW_AFTER_DAYS) status = 'renew';
  else if (RENEW_AFTER_DAYS - age <= 2) status = 'soon';
  return { status, day, daysLeft, batch };
}

/** Zählt dieser Ansatz für den Countdown? Tränk-Ansätze (zum Durchtränken des Substrats) nicht. */
export const countsForTimer = (b: NutrientBatch) => b.purpose !== 'soak';

export interface TimerGroup {
  key: string; // Grow-ID oder 'general'
  growId?: string;
  name?: string; // Name des Grows (undefined = allgemein, keinem Grow zugeordnet)
  color?: string;
  state: BatchState;
}

/**
 * Countdown je Grow: Ansätze, die ausdrücklich für einen Grow angelegt wurden, laufen getrennt.
 * Ansätze ohne Grow-Zuordnung bilden den allgemeinen Countdown. Tränk-Ansätze zählen nicht.
 * Geerntete oder gelöschte Grows erzeugen keine Erinnerung mehr.
 */
export function timerGroups(batches: NutrientBatch[] | undefined, grows: Grow[] = [], today = localToday()): TimerGroup[] {
  const use = (batches ?? []).filter(countsForTimer);
  const byGrow = new Map<string, NutrientBatch[]>();
  const general: NutrientBatch[] = [];
  for (const b of use) {
    const g = b.growId ? grows.find((x) => x.id === b.growId) : undefined;
    if (b.growId && g) {
      if (g.milestones.actualHarvest && g.milestones.actualHarvest <= today) continue; // geerntet → keine Erinnerung
      const arr = byGrow.get(g.id) ?? [];
      arr.push(b);
      byGrow.set(g.id, arr);
    } else {
      general.push(b);
    }
  }
  const out: TimerGroup[] = [];
  for (const g of grows) {
    const list = byGrow.get(g.id);
    if (list) out.push({ key: g.id, growId: g.id, name: g.name, color: g.color, state: batchState(list, today) });
  }
  if (general.length) out.push({ key: 'general', state: batchState(general, today) });
  // dringendste zuerst
  const rank: Record<BatchStatus, number> = { expired: 0, renew: 1, soon: 2, fresh: 3, none: 4 };
  return out.sort((a, b) => rank[a.state.status] - rank[b.state.status] || a.state.daysLeft - b.state.daysLeft);
}

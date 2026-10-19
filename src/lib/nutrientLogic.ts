import type { NutrientBatch } from '@/types';

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

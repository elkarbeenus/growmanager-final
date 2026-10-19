// Vergleicht die aktuellen Daten mit den importierten/wiederhergestellten Daten und
// fasst kurz zusammen, was neu, geändert oder entfernt wurde.
import type { AppData, Grow } from '@/types';
import { t } from '@/lib/i18n';

function sortKeys(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    return Object.keys(o)
      .sort()
      .reduce<Record<string, unknown>>((acc, k) => {
        if (o[k] !== undefined) acc[k] = sortKeys(o[k]);
        return acc;
      }, {});
  }
  return v;
}

const same = (a: unknown, b: unknown) => JSON.stringify(sortKeys(a)) === JSON.stringify(sortKeys(b));

interface ById {
  id: string;
}

function diffById<T extends ById>(before: T[] = [], after: T[] = []) {
  const bm = new Map(before.map((x) => [x.id, x]));
  const am = new Map(after.map((x) => [x.id, x]));
  const added = after.filter((x) => !bm.has(x.id));
  const removed = before.filter((x) => !am.has(x.id));
  const changed = after.filter((x) => bm.has(x.id) && !same(bm.get(x.id), x));
  return { added, removed, changed };
}

export interface GrowChange {
  name: string;
  details: string[];
}

export interface ImportSummary {
  identical: boolean;
  addedGrows: string[];
  removedGrows: string[];
  changedGrows: GrowChange[];
  addedLogs: number;
  addedBatches: number;
  removedBatches: number;
  changedBatches: number;
  totals: { grows: number; logs: number; batches: number };
}

function growDetails(a: Grow, b: Grow): string[] {
  const d: string[] = [];
  if (a.name !== b.name) d.push(t('Name', 'Name'));
  if ((a.strain ?? '') !== (b.strain ?? '')) d.push(t('Sorte', 'Strain'));
  if (a.color !== b.color) d.push(t('Farbe', 'Color'));
  if ((a.plantCount ?? 1) !== (b.plantCount ?? 1)) d.push(t('Pflanzenanzahl', 'Plant count'));
  if ((a.fertilizerId ?? '') !== (b.fertilizerId ?? '')) d.push(t('Dünger', 'Fertilizer'));
  if (!same(a.milestones, b.milestones)) d.push(t('Meilensteine', 'Milestones'));
  if (!same(a.drying, b.drying)) d.push(t('Trocknung/Ernte', 'Drying/harvest'));

  const logs = diffById(a.logs, b.logs);
  if (logs.added.length || logs.removed.length || logs.changed.length) {
    const parts: string[] = [];
    if (logs.added.length) parts.push(`+${logs.added.length}`);
    if (logs.removed.length) parts.push(`−${logs.removed.length}`);
    if (logs.changed.length) parts.push(`~${logs.changed.length}`);
    d.push(`${t('Tagebuch', 'Journal')} ${parts.join(' ')}`);
  }
  const costs = diffById(a.costs, b.costs);
  if (costs.added.length || costs.removed.length || costs.changed.length) {
    const parts: string[] = [];
    if (costs.added.length) parts.push(`+${costs.added.length}`);
    if (costs.removed.length) parts.push(`−${costs.removed.length}`);
    if (costs.changed.length) parts.push(`~${costs.changed.length}`);
    d.push(`${t('Kosten', 'Costs')} ${parts.join(' ')}`);
  }
  return d;
}

export function diffData(before: AppData, after: AppData): ImportSummary {
  const grows = diffById(before.grows, after.grows);
  const batches = diffById(before.batches ?? [], after.batches ?? []);
  const bm = new Map(before.grows.map((g) => [g.id, g]));

  const changedGrows: GrowChange[] = [];
  let addedLogs = grows.added.reduce((s, g) => s + (g.logs?.length ?? 0), 0);
  for (const g of grows.changed) {
    const old = bm.get(g.id) as Grow;
    const details = growDetails(old, g);
    if (details.length) changedGrows.push({ name: g.name, details });
    addedLogs += Math.max(0, diffById(old.logs, g.logs).added.length);
  }

  const identical =
    grows.added.length === 0 &&
    grows.removed.length === 0 &&
    changedGrows.length === 0 &&
    batches.added.length === 0 &&
    batches.removed.length === 0 &&
    batches.changed.length === 0;

  return {
    identical,
    addedGrows: grows.added.map((g) => g.name),
    removedGrows: grows.removed.map((g) => g.name),
    changedGrows,
    addedLogs,
    addedBatches: batches.added.length,
    removedBatches: batches.removed.length,
    changedBatches: batches.changed.length,
    totals: {
      grows: after.grows.length,
      logs: after.grows.reduce((s, g) => s + (g.logs?.length ?? 0), 0),
      batches: (after.batches ?? []).length,
    },
  };
}

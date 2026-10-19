// Kennzahlen pro Grow: Pflanzen, Kosten, Ertrag. Alle Auswertungen (Detailansicht,
// Übersicht, PDF) nutzen diese Funktionen, damit überall dieselben Werte erscheinen.
import type { CostCategory, CostEntry, Grow } from '@/types';
import { t, locale } from '@/lib/i18n';
import { totalGrowDuration } from '@/lib/growLogic';

export const MAX_PLANTS = 10;

export const COST_CATEGORIES: { key: CostCategory; color: string }[] = [
  { key: 'nutrients', color: '#10b981' },
  { key: 'electricity', color: '#f59e0b' },
  { key: 'equipment', color: '#60a5fa' },
  { key: 'substrate', color: '#a78bfa' },
  { key: 'genetics', color: '#f472b6' },
  { key: 'other', color: '#94a3b8' },
];

export function categoryLabel(key: CostCategory): string {
  return {
    nutrients: t('Dünger', 'Nutrients'),
    electricity: t('Strom', 'Electricity'),
    equipment: t('Equipment', 'Equipment'),
    substrate: t('Substrat / Erde', 'Substrate / soil'),
    genetics: t('Samen / Stecklinge', 'Seeds / clones'),
    other: t('Sonstiges', 'Other'),
  }[key];
}

export function categoryColor(key: CostCategory): string {
  return COST_CATEGORIES.find((c) => c.key === key)?.color ?? '#94a3b8';
}

export function plantsOf(grow: Grow): number {
  const n = Math.round(Number(grow.plantCount ?? 1));
  return Number.isFinite(n) ? Math.min(MAX_PLANTS, Math.max(1, n)) : 1;
}

export function plantsLabel(n: number): string {
  return `${n} ${n === 1 ? t('Pflanze', 'plant') : t('Pflanzen', 'plants')}`;
}

export function costsOf(grow: Grow): CostEntry[] {
  return Array.isArray(grow.costs) ? grow.costs : [];
}

export function totalCost(grow: Grow): number {
  return costsOf(grow).reduce((sum, c) => sum + (Number.isFinite(c.amount) ? c.amount : 0), 0);
}

export function costByCategory(grows: Grow[]): { key: CostCategory; amount: number }[] {
  const map = new Map<CostCategory, number>();
  grows.forEach((g) => costsOf(g).forEach((c) => map.set(c.category, (map.get(c.category) ?? 0) + c.amount)));
  return COST_CATEGORIES.map((c) => ({ key: c.key, amount: map.get(c.key) ?? 0 })).filter((x) => x.amount > 0);
}

export function yieldOf(grow: Grow): number | undefined {
  const y = grow.drying?.harvestAmount;
  return y !== undefined && Number.isFinite(y) && y > 0 ? y : undefined;
}

export interface GrowStats {
  plants: number;
  cost: number;
  yieldG?: number;
  yieldPerPlant?: number;
  costPerPlant?: number;
  costPerGram?: number;
  days: number | null;
}

export function statsOf(grow: Grow): GrowStats {
  const plants = plantsOf(grow);
  const cost = totalCost(grow);
  const y = yieldOf(grow);
  return {
    plants,
    cost,
    yieldG: y,
    yieldPerPlant: y !== undefined ? y / plants : undefined,
    costPerPlant: cost > 0 ? cost / plants : undefined,
    costPerGram: y !== undefined && cost > 0 ? cost / y : undefined,
    days: totalGrowDuration(grow),
  };
}

export function growYear(grow: Grow): number {
  const d = grow.milestones.actualHarvest ?? grow.milestones.expectedHarvest ?? grow.milestones.cloneStart ?? grow.createdAt;
  return new Date(d).getFullYear();
}

export function formatMoney(n: number | undefined): string {
  if (n === undefined || !Number.isFinite(n)) return '—';
  return n.toLocaleString(locale(), { style: 'currency', currency: 'EUR' });
}

export function formatGrams(n: number | undefined, digits = 0): string {
  if (n === undefined || !Number.isFinite(n)) return '—';
  return `${n.toLocaleString(locale(), { maximumFractionDigits: digits })} g`;
}

/** Summe über mehrere Grows (für die Übersicht). €/g nur aus Grows mit Ertrag. */
export function aggregate(grows: Grow[]) {
  let plants = 0;
  let cost = 0;
  let yieldG = 0;
  let yieldPlants = 0;
  let costWithYield = 0;
  grows.forEach((g) => {
    const s = statsOf(g);
    plants += s.plants;
    cost += s.cost;
    if (s.yieldG !== undefined) {
      yieldG += s.yieldG;
      yieldPlants += s.plants;
      costWithYield += s.cost;
    }
  });
  return {
    grows: grows.length,
    plants,
    cost,
    yieldG,
    yieldPerPlant: yieldPlants > 0 ? yieldG / yieldPlants : undefined,
    costPerGram: yieldG > 0 && costWithYield > 0 ? costWithYield / yieldG : undefined,
    harvested: grows.filter((g) => yieldOf(g) !== undefined).length,
  };
}

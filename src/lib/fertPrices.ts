// Durchschnittliche Düngerpreise (€ pro Liter Produkt) als Grundlage für die automatische
// Kostenrechnung aus dem Dünger-Verbrauch. Es sind grobe Richtwerte für den deutschen/europäischen
// Markt (Stand 2026, gerundet, Preise je nach Shop und Flaschengröße unterschiedlich) – sie lassen
// sich in der App pro Produkt an die eigenen Preise anpassen.
import type { AppSettings, Grow, NutrientBatch } from '@/types';
import { type FertSchedule } from '@/lib/fertilizerData';
import { computeUsage } from '@/lib/fertUsage';
import { autoPowerCost } from '@/lib/power';
import { t } from '@/lib/i18n';

export const DEFAULT_FERT_PRICES: Record<string, number> = {
  // Athena Blended Line
  'athena:balance': 10,
  'athena:growA': 12,
  'athena:growB': 12,
  'athena:bloomA': 12,
  'athena:bloomB': 12,
  'athena:pk': 13,
  'athena:caMg': 15,
  'athena:fade': 22,
  'athena:cleanse': 14,
  // Hesi Erde
  'hesi:root': 25,
  'hesi:tnt': 11,
  'hesi:bloom': 11,
  'hesi:boost': 14,
  'hesi:pp': 10,
  'hesi:pz': 18,
  // Plagron Terra
  'plagron:roots': 16,
  'plagron:grow': 9,
  'plagron:bloom': 9,
  'plagron:pk': 13,
  'plagron:sugar': 17,
  'plagron:zym': 17,
  // Biobizz
  'biobizz:root': 16,
  'biobizz:grow': 10,
  'biobizz:bloom': 10,
  'biobizz:topmax': 24,
  'biobizz:heaven': 33,
  'biobizz:alga': 15,
  // Advanced Nutrients pH Perfect Sensi
  'advanced:gA': 25,
  'advanced:gB': 25,
  'advanced:bA': 25,
  'advanced:bB': 25,
  'advanced:voodoo': 60,
  'advanced:bigbud': 70,
  'advanced:overdrive': 90,
  'advanced:b52': 55,
  'advanced:candy': 50,
};

export const priceKey = (scheduleId: string, productKey: string) => `${scheduleId}:${productKey}`;

export function defaultPrice(scheduleId: string, productKey: string): number {
  return DEFAULT_FERT_PRICES[priceKey(scheduleId, productKey)] ?? 0;
}

export function isCustomPrice(scheduleId: string, productKey: string, overrides?: Record<string, number>): boolean {
  const v = overrides?.[priceKey(scheduleId, productKey)];
  return v !== undefined && Number.isFinite(v) && v >= 0;
}

/** Preis in € pro Liter: eigener Preis, sonst Durchschnittspreis. */
export function pricePerLiter(scheduleId: string, productKey: string, overrides?: Record<string, number>): number {
  const v = overrides?.[priceKey(scheduleId, productKey)];
  return v !== undefined && Number.isFinite(v) && v >= 0 ? v : defaultPrice(scheduleId, productKey);
}

export interface AutoCostLine {
  scheduleId: string;
  productKey: string;
  label: string;
  color: string;
  ml: number;
  pricePerL: number;
  cost: number;
  custom: boolean;
}

export interface AutoFertCost {
  enabled: boolean; // pro Grow abschaltbar
  amount: number; // € gesamt (auf Cent gerundet)
  lines: AutoCostLine[];
  schedules: FertSchedule[]; // verwendete Düngeschemata (für den Preis-Editor)
  hasUsage: boolean;
}

/** Dünger-Kosten eines Grows aus Verbrauch (mL je Produkt) × Preis pro Liter. */
export function autoFertCost(
  grow: Grow,
  allGrows: Grow[],
  batches: NutrientBatch[],
  globalFertId: string | undefined,
  prices?: Record<string, number>
): AutoFertCost {
  const usage = computeUsage(batches, allGrows, globalFertId, grow.id);
  const lines: AutoCostLine[] = [];
  for (const g of usage.groups) {
    for (const row of g.rows) {
      if (row.total <= 0) continue;
      const ppl = pricePerLiter(g.schedule.id, row.product.key, prices);
      lines.push({
        scheduleId: g.schedule.id,
        productKey: row.product.key,
        label: usage.groups.length > 1 ? `${g.schedule.brand} ${row.product.label}` : row.product.label,
        color: row.product.color,
        ml: row.total,
        pricePerL: ppl,
        cost: (row.total / 1000) * ppl,
        custom: isCustomPrice(g.schedule.id, row.product.key, prices),
      });
    }
  }
  const amount = Math.round(lines.reduce((s, l) => s + l.cost, 0) * 100) / 100;
  return {
    enabled: grow.fertCostAuto !== false,
    amount,
    lines,
    schedules: usage.groups.map((g) => g.schedule),
    hasUsage: usage.groups.length > 0,
  };
}

export const AUTO_COST_ID = 'auto-fert';
export const AUTO_POWER_ID = 'auto-power';

/**
 * Liefert Kopien der Grows, in denen die automatisch berechneten Dünger-Kosten als zusätzlicher
 * Kosteneintrag (Kategorie Dünger) enthalten sind. So rechnen Detail, Übersicht und PDF überall gleich.
 */
export function withAutoCosts(
  targets: Grow[],
  allGrows: Grow[],
  batches: NutrientBatch[],
  globalFertId: string | undefined,
  prices?: Record<string, number>,
  settings?: AppSettings
): Grow[] {
  return targets.map((g) => {
    const extra: NonNullable<Grow['costs']> = [];
    const a = autoFertCost(g, allGrows, batches, globalFertId, prices);
    if (a.enabled && a.amount > 0) {
      extra.push({
        id: AUTO_COST_ID,
        category: 'nutrients' as const,
        label: t('Dünger (automatisch aus Nährlösung)', 'Fertilizer (automatic from nutrient solution)'),
        amount: a.amount,
        auto: true,
      });
    }
    const pw = autoPowerCost(g, settings);
    if (pw.enabled && pw.reason === 'ok' && pw.amount > 0) {
      extra.push({
        id: AUTO_POWER_ID,
        category: 'electricity' as const,
        label: t('Strom (automatisch aus Lampe × Zeit)', 'Electricity (automatic from lamp × time)'),
        amount: pw.amount,
        auto: true,
      });
    }
    return extra.length ? { ...g, costs: [...(g.costs ?? []), ...extra] } : g;
  });
}

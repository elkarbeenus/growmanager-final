// Athena Blended Line Düngeschema
// Quelle: Athena Ag, Inc. — Blended_Feed_Schedule_Imperial (A01.004)
// Umgerechnet auf mL pro 10 Liter (1 US gal = 3,785 L → mL/10L = mL/L × 10)

import { t, isEn } from '@/lib/i18n';

/** 'Blüte 3' → 'Flower 3' bei Englisch */
export function weekLabel(label: string): string {
  return isEn() ? label.replace(/^Blüte/, 'Flower') : label;
}

export interface AthenaColumn {
  week: number;
  label: string;
  stage: string;
  growA?: string;
  growB?: string;
  bloomA?: string;
  bloomB?: string;
  pk?: string;
  caMg?: string;
  fade?: string;
  cleanse: string;
  balance?: string;
  ec: number;
  ppm500: number;
  ppm700: number;
}

export const ATHENA_BLENDED: AthenaColumn[] = [
  {
    week: 1, label: 'Clone 1', stage: 'Pre-Soak',
    bloomA: '13', bloomB: '13', cleanse: '3', balance: 'nach Bedarf', ec: 1.0, ppm500: 500, ppm700: 700,
  },
  {
    week: 2, label: 'Clone 2', stage: 'Feed',
    bloomA: '26', bloomB: '26', cleanse: '3', balance: 'nach Bedarf', ec: 2.0, ppm500: 1000, ppm700: 1400,
  },
  {
    week: 3, label: 'Veg 1', stage: 'Veg',
    growA: '29', growB: '29', caMg: '8–13', cleanse: '5–13', balance: 'nach Bedarf', ec: 2.1, ppm500: 1050, ppm700: 1470,
  },
  {
    week: 4, label: 'Veg 2', stage: 'Veg',
    growA: '29', growB: '29', caMg: '8–13', cleanse: '5–13', balance: 'nach Bedarf', ec: 2.1, ppm500: 1050, ppm700: 1470,
  },
  {
    week: 5, label: 'Veg 3', stage: 'Veg',
    growA: '29', growB: '29', caMg: '8–13', cleanse: '5–13', balance: 'nach Bedarf', ec: 2.1, ppm500: 1050, ppm700: 1470,
  },
  {
    week: 6, label: 'Veg 4', stage: 'Veg',
    growA: '29', growB: '29', caMg: '8–13', cleanse: '5–13', balance: 'nach Bedarf', ec: 2.1, ppm500: 1050, ppm700: 1470,
  },
  {
    week: 7, label: 'Blüte 1', stage: 'Flower',
    bloomA: '32', bloomB: '32', caMg: '8–13', cleanse: '5–13', balance: 'nach Bedarf', ec: 2.3, ppm500: 1150, ppm700: 1610,
  },
  {
    week: 8, label: 'Blüte 2', stage: 'Flower',
    bloomA: '32', bloomB: '32', caMg: '8–13', cleanse: '5–13', balance: 'nach Bedarf', ec: 2.3, ppm500: 1150, ppm700: 1610,
  },
  {
    week: 9, label: 'Blüte 3', stage: 'Flower',
    bloomA: '32', bloomB: '32', pk: '11', caMg: '8–13', cleanse: '5–13', balance: 'nach Bedarf', ec: 2.5, ppm500: 1250, ppm700: 1750,
  },
  {
    week: 10, label: 'Blüte 4', stage: 'Flower',
    bloomA: '32', bloomB: '32', pk: '16', caMg: '8–13', cleanse: '5–13', balance: 'nach Bedarf', ec: 2.6, ppm500: 1300, ppm700: 1820,
  },
  {
    week: 11, label: 'Blüte 5', stage: 'Flower',
    bloomA: '26', bloomB: '26', pk: '24', caMg: '8–13', cleanse: '5–13', balance: 'nach Bedarf', ec: 2.4, ppm500: 1200, ppm700: 1680,
  },
  {
    week: 12, label: 'Blüte 6', stage: 'Flower',
    bloomA: '24', bloomB: '24', pk: '26', caMg: '8–13', cleanse: '5–13', balance: 'nach Bedarf', ec: 2.3, ppm500: 1150, ppm700: 1610,
  },
  {
    week: 13, label: 'Blüte 7', stage: 'Flower',
    bloomA: '13', bloomB: '13', pk: '32', cleanse: '5–13', fade: '8', balance: 'nach Bedarf', ec: 1.7, ppm500: 850, ppm700: 1190,
  },
  {
    week: 14, label: 'Blüte 8', stage: 'Flower',
    bloomA: '11', bloomB: '11', pk: '26', cleanse: '5–13', fade: '16', balance: 'nach Bedarf', ec: 1.5, ppm500: 750, ppm700: 1050,
  },
  {
    week: 15, label: 'Blüte 9', stage: 'Flower',
    bloomA: '11', bloomB: '11', pk: '26', cleanse: '5–13', fade: '16', balance: 'nach Bedarf', ec: 1.5, ppm500: 750, ppm700: 1050,
  },
];

export interface AthenaPhTarget {
  stage: string;
  media: string;
  ph: string;
}

export const getAthenaPhTargets = (): AthenaPhTarget[] => [
  { stage: 'Clone', media: t('alle Substrate', 'all media'), ph: '5.6' },
  { stage: 'Veg', media: t('Kokos/Steinwolle', 'Coco/rockwool'), ph: '5.8 – 6.2' },
  { stage: 'Veg', media: t('Torfbasiert', 'Peat-based'), ph: '6.0 – 6.4' },
  { stage: t('Blüte', 'Flower'), media: t('Kokos/Steinwolle', 'Coco/rockwool'), ph: '5.8 – 6.2' },
  { stage: t('Blüte', 'Flower'), media: t('Torfbasiert', 'Peat-based'), ph: '6.0 – 6.4' },
  { stage: 'Flush', media: t('alle Substrate', 'all media'), ph: '6.0 – 6.4' },
];

export const getAthenaProducts = () => [
  { name: 'Balance', role: t('pH-Heber — als Erstes einmischen, bei jeder Phase nach Bedarf', 'pH up — mix in first, as needed in every phase'), color: '#a78bfa', order: 1 },
  { name: 'Grow A', role: t('Wachstumsphase — Basis-Dünger Teil A', 'Veg phase — base nutrient part A'), color: '#34d399', order: 2 },
  { name: 'Grow B', role: t('Wachstumsphase — Basis-Dünger Teil B', 'Veg phase — base nutrient part B'), color: '#10b981', order: 3 },
  { name: 'Bloom A', role: t('Blütephase — Basis-Dünger Teil A', 'Flower phase — base nutrient part A'), color: '#fbbf24', order: 2 },
  { name: 'Bloom B', role: t('Blütephase — Basis-Dünger Teil B', 'Flower phase — base nutrient part B'), color: '#f59e0b', order: 3 },
  { name: 'PK', role: t('Blüteboost — Phosphor/Kalium, nach Basis-Düngern', 'Bloom boost — phosphorus/potassium, after base nutrients'), color: '#fb7185', order: 4 },
  { name: 'CaMg', role: t('Calcium/Magnesium-Ergänzung — nach PK', 'Calcium/magnesium supplement — after PK'), color: '#60a5fa', order: 5 },
  { name: 'Fade', role: t('Finisher — vor dem Flush, nach CaMg. Fördert Abbau von Chlorophyll', 'Finisher — before the flush, after CaMg. Promotes chlorophyll breakdown'), color: '#34d399', order: 6 },
  { name: 'Cleanse', role: t('Wasser-Conditioner / Biofilm-Schutz — als Letztes', 'Water conditioner / biofilm protection — last'), color: '#22d3ee', order: 7 },
];

export const getMixingOrder = (): { step: number; product: string; color: string; note: string }[] => [
  { step: 1, product: 'Balance', color: '#a78bfa', note: t('pH-Heber — als Erstes zugeben, falls pH angehoben werden muss. Bei jeder Phase nach Bedarf.', 'pH up — add first if the pH needs to be raised. As needed in every phase.') },
  { step: 2, product: t('Grow A oder Bloom A', 'Grow A or Bloom A'), color: '#34d399', note: t('Basis-Dünger Teil A — Grow A in der Veg, Bloom A in der Blüte.', 'Base nutrient part A — Grow A in veg, Bloom A in flower.') },
  { step: 3, product: t('Grow B oder Bloom B', 'Grow B or Bloom B'), color: '#10b981', note: t('Basis-Dünger Teil B — erst nach Teil A vollständig gelöst zugeben.', 'Base nutrient part B — add only after part A has fully dissolved.') },
  { step: 4, product: 'PK', color: '#fb7185', note: t('Phosphor/Kalium-Boost — ab Blüte Woche 3, nach Basis-Düngern zugeben.', 'Phosphorus/potassium boost — from flower week 3, add after base nutrients.') },
  { step: 5, product: 'CaMg', color: '#60a5fa', note: t('Calcium/Magnesium-Ergänzung — nach PK zugeben (besonders in Kokos).', 'Calcium/magnesium supplement — add after PK (especially in coco).') },
  { step: 6, product: 'Fade', color: '#34d399', note: t('Finisher — ab Blüte Woche 7, nach CaMg. Fördert den Abbau von Chlorophyll für eine saubere Ernte.', 'Finisher — from flower week 7, after CaMg. Promotes chlorophyll breakdown for a clean harvest.') },
  { step: 7, product: 'Cleanse', color: '#22d3ee', note: t('Wasser-Conditioner — als Letztes einmischen, wöchentlich.', 'Water conditioner — mix in last, weekly.') },
];

// Düngeschemata verschiedener Hersteller (Richtwerte).
// WICHTIG: Die Werte für Hesi, Plagron, Biobizz und Advanced Nutrients sind
// vereinfachte Richtwerte (mL pro Liter). Bitte immer mit dem aktuellen
// Original-Düngechart des Herstellers abgleichen, bevor sie genutzt werden.
// Athena kommt aus athenaData.ts (Original in mL pro 10 L, hier auf mL/L umgerechnet).

import { ATHENA_BLENDED, weekLabel } from '@/lib/athenaData';
import { t, AS_NEEDED } from '@/lib/i18n';

export type StageKind = 'start' | 'veg' | 'flower' | 'flush';

export interface FertProduct {
  key: string;
  label: string;
  color: string;
  role: string;
}

export interface FertWeek {
  label: string;
  stage: StageKind;
  doses: Record<string, string | undefined>;
  ec?: string;
}

export interface FertSchedule {
  id: string;
  brand: string;
  line: string;
  unit: string; // Anzeige-Einheit: DE mL / 10 Liter, EN mL / gallon (Werte intern immer mL pro Liter)
  tagline: string;
  accent: string;
  products: FertProduct[]; // in Mischreihenfolge
  weeks: FertWeek[];
  mixOrder: string;
  notes: string[];
  verified: boolean; // true = aus Herstellerdokument übernommen
}

// Baut Wochen aus Spaltenlisten pro Produkt
function build(
  labels: { label: string; stage: StageKind; ec?: string }[],
  cols: Record<string, (string | undefined)[]>
): FertWeek[] {
  return labels.map((l, i) => {
    const doses: Record<string, string | undefined> = {};
    for (const k of Object.keys(cols)) doses[k] = cols[k][i];
    return { ...l, doses };
  });
}

const u = undefined;

// Wochenbezeichnungen
const bl = (n: number) => `${t('Blüte', 'Flower')} ${n}`;
const UNIT = () => t('mL / 10 Liter', 'mL / gallon');

// ---------- HESI (Erde) ----------
const HESI = (): FertSchedule => ({
  id: 'hesi',
  brand: 'Hesi',
  line: t('Erde (Soil)', 'Soil'),
  unit: UNIT(),
  tagline: t('Complex-Linie für Erde: TNT-Complex in der Wuchs-, Blüh-Complex in der Blütephase.', 'Complex line for soil: TNT-Complex in veg, Bloom-Complex in flower.'),
  accent: '#34d399',
  verified: false,
  mixOrder: t('Wurzel-Complex → TNT-/Blüh-Complex → Boost → Phosphor Plus → PowerZyme', 'Root Complex → TNT/Bloom Complex → Boost → Phosphorus Plus → PowerZyme'),
  products: [
    { key: 'root', label: t('Wurzel-Complex', 'Root Complex'), color: '#a78bfa', role: t('Wurzelstimulator für Stecklinge & Jungpflanzen', 'Root stimulator for clones & seedlings') },
    { key: 'tnt', label: 'TNT-Complex', color: '#34d399', role: t('Wuchsdünger', 'Grow nutrient') },
    { key: 'bloom', label: t('Blüh-Complex', 'Bloom Complex'), color: '#fbbf24', role: t('Blütedünger', 'Bloom nutrient') },
    { key: 'boost', label: 'Boost', color: '#fb7185', role: t('Blütebooster (ab Blütewoche 2)', 'Bloom booster (from flower week 2)') },
    { key: 'pp', label: t('Phosphor Plus', 'Phosphorus Plus'), color: '#f472b6', role: t('Zusätzliches Phosphor in der Hauptblüte', 'Extra phosphorus during main flower') },
    { key: 'pz', label: 'PowerZyme', color: '#22d3ee', role: t('Enzyme, hält das Substrat sauber', 'Enzymes, keeps the substrate clean') },
  ],
  weeks: build(
    [
      { label: 'Start', stage: 'start', ec: '0.8' },
      { label: 'Veg 1', stage: 'veg', ec: '1.2' },
      { label: 'Veg 2', stage: 'veg', ec: '1.4' },
      { label: 'Veg 3', stage: 'veg', ec: '1.6' },
      { label: bl(1), stage: 'flower', ec: '1.6' },
      { label: bl(2), stage: 'flower', ec: '1.8' },
      { label: bl(3), stage: 'flower', ec: '2.0' },
      { label: bl(4), stage: 'flower', ec: '2.0' },
      { label: bl(5), stage: 'flower', ec: '2.0' },
      { label: bl(6), stage: 'flower', ec: '1.8' },
      { label: bl(7), stage: 'flower', ec: '1.6' },
      { label: bl(8), stage: 'flower', ec: '1.4' },
      { label: 'Flush', stage: 'flush', ec: '0.0' },
    ],
    {
      root:  ['2.5', '2.5', '2.5', u, u, u, u, u, u, u, u, u, u],
      tnt:   ['1.5', '2.5', '3.5', '4.0', '2.0', u, u, u, u, u, u, u, u],
      bloom: [u, u, u, u, '2.0', '3.0', '4.0', '4.0', '4.0', '3.5', '3.0', '2.0', u],
      boost: [u, u, u, u, u, '1.5', '2.5', '2.5', '2.5', '2.5', '1.5', u, u],
      pp:    [u, u, u, u, u, u, u, '1.5', '2.0', '2.0', u, u, u],
      pz:    [u, '2.5', '2.5', '2.5', '2.5', '2.5', '2.5', '2.5', '2.5', '2.5', '2.5', '2.5', u],
    }
  ),
  notes: [
    t('Richtwerte für Erde bei ca. pH 6,0–6,5. Pflanzen reagieren unterschiedlich, im Zweifel unter der Empfehlung beginnen.', 'Guideline values for soil at approx. pH 6.0–6.5. Plants react differently; if in doubt, start below the recommendation.'),
    t('Hesi empfiehlt, in der Erde immer zuerst zu wässern und die Düngerlösung vor dem Gießen gut zu rühren.', 'Hesi recommends always watering the soil first and stirring the nutrient solution well before feeding.'),
    t('Flush in den letzten ein bis zwei Wochen mit klarem Wasser.', 'Flush with plain water during the last one to two weeks.'),
  ],
});

// ---------- PLAGRON (Terra) ----------
const PLAGRON = (): FertSchedule => ({
  id: 'plagron',
  brand: 'Plagron',
  line: t('Terra (Erde)', 'Terra (soil)'),
  unit: UNIT(),
  tagline: t('Alga Grow und Alga Bloom als Basis, dazu Booster wie PK 13-14 und Sugar Royal.', 'Alga Grow and Alga Bloom as the base, plus boosters such as PK 13-14 and Sugar Royal.'),
  accent: '#60a5fa',
  verified: false,
  mixOrder: 'Power Roots → Alga Grow/Bloom → PK 13-14 → Sugar Royal → Pure Zym',
  products: [
    { key: 'roots', label: 'Power Roots', color: '#a78bfa', role: t('Wurzelbooster', 'Root booster') },
    { key: 'grow', label: 'Alga Grow', color: '#34d399', role: t('Basisdünger Wuchs (organisch)', 'Base nutrient grow (organic)') },
    { key: 'bloom', label: 'Alga Bloom', color: '#fbbf24', role: t('Basisdünger Blüte (organisch)', 'Base nutrient bloom (organic)') },
    { key: 'pk', label: 'PK 13-14', color: '#fb7185', role: t('Phosphor/Kalium-Booster', 'Phosphorus/potassium booster') },
    { key: 'sugar', label: 'Sugar Royal', color: '#f472b6', role: t('Blütestimulator, Aroma und Harz', 'Bloom stimulator, aroma and resin') },
    { key: 'zym', label: 'Pure Zym', color: '#22d3ee', role: t('Enzyme, Substrat-Pflege', 'Enzymes, substrate care') },
  ],
  weeks: build(
    [
      { label: 'Start', stage: 'start' },
      { label: 'Veg 1', stage: 'veg' },
      { label: 'Veg 2', stage: 'veg' },
      { label: 'Veg 3', stage: 'veg' },
      { label: bl(1), stage: 'flower' },
      { label: bl(2), stage: 'flower' },
      { label: bl(3), stage: 'flower' },
      { label: bl(4), stage: 'flower' },
      { label: bl(5), stage: 'flower' },
      { label: bl(6), stage: 'flower' },
      { label: bl(7), stage: 'flower' },
      { label: bl(8), stage: 'flower' },
      { label: 'Flush', stage: 'flush' },
    ],
    {
      roots: ['2.0', '2.0', '2.0', u, u, u, u, u, u, u, u, u, u],
      grow:  ['1.0', '2.0', '3.0', '4.0', '2.0', u, u, u, u, u, u, u, u],
      bloom: [u, u, u, u, '2.0', '3.0', '4.0', '4.0', '4.0', '3.0', '3.0', '2.0', u],
      pk:    [u, u, u, u, u, u, '1.0', '1.5', '2.0', '2.0', '1.5', u, u],
      sugar: [u, u, u, u, u, u, u, '1.0', '1.5', '2.0', '2.0', '1.0', u],
      zym:   [u, '2.5', '2.5', '2.5', '2.5', '2.5', '2.5', '2.5', '2.5', '2.5', '2.5', '2.5', u],
    }
  ),
  notes: [
    t('Richtwerte für Terra-Erde, pH ca. 6,0–6,5.', 'Guideline values for Terra soil, pH approx. 6.0–6.5.'),
    t('Plagron-Produkte nacheinander einrühren, nie unverdünnt mischen.', 'Stir in Plagron products one after another, never mix them undiluted.'),
    t('In den letzten 1–2 Wochen nur noch klares Wasser (Flush).', 'Only plain water during the last 1–2 weeks (flush).'),
  ],
});

// ---------- BIOBIZZ (Erde) ----------
const BIOBIZZ = (): FertSchedule => ({
  id: 'biobizz',
  brand: 'Biobizz',
  line: t('Light-Mix / Erde (organisch)', 'Light-Mix / soil (organic)'),
  unit: UNIT(),
  tagline: t('Rein organische Linie: Bio·Grow, Bio·Bloom und Top·Max, ergänzt durch Bio·Heaven.', 'Fully organic line: Bio·Grow, Bio·Bloom and Top·Max, complemented by Bio·Heaven.'),
  accent: '#a3e635',
  verified: false,
  mixOrder: 'Root·Juice → Bio·Grow/Bloom → Top·Max → Bio·Heaven → Alg·A·Mic',
  products: [
    { key: 'root', label: 'Root·Juice', color: '#a78bfa', role: t('Wurzelstimulator', 'Root stimulator') },
    { key: 'grow', label: 'Bio·Grow', color: '#34d399', role: t('Wuchsdünger', 'Grow nutrient') },
    { key: 'bloom', label: 'Bio·Bloom', color: '#fbbf24', role: t('Blütedünger', 'Bloom nutrient') },
    { key: 'topmax', label: 'Top·Max', color: '#fb7185', role: t('Blütebooster, fördert Fruchtansatz', 'Bloom booster, promotes bud set') },
    { key: 'heaven', label: 'Bio·Heaven', color: '#f472b6', role: t('Energie-Booster, Aminosäuren', 'Energy booster, amino acids') },
    { key: 'alga', label: 'Alg·A·Mic', color: '#22d3ee', role: t('Algenextrakt, Stressschutz', 'Seaweed extract, stress protection') },
  ],
  weeks: build(
    [
      { label: 'Start', stage: 'start' },
      { label: 'Veg 1', stage: 'veg' },
      { label: 'Veg 2', stage: 'veg' },
      { label: 'Veg 3', stage: 'veg' },
      { label: bl(1), stage: 'flower' },
      { label: bl(2), stage: 'flower' },
      { label: bl(3), stage: 'flower' },
      { label: bl(4), stage: 'flower' },
      { label: bl(5), stage: 'flower' },
      { label: bl(6), stage: 'flower' },
      { label: bl(7), stage: 'flower' },
      { label: bl(8), stage: 'flower' },
      { label: 'Flush', stage: 'flush' },
    ],
    {
      root:   ['4.0', '4.0', u, u, u, u, u, u, u, u, u, u, u],
      grow:   [u, '2.0', '3.0', '4.0', '2.0', u, u, u, u, u, u, u, u],
      bloom:  [u, u, u, u, '2.0', '3.0', '4.0', '4.0', '4.0', '4.0', '3.0', '2.0', u],
      topmax: [u, u, u, u, u, '1.0', '2.0', '3.0', '4.0', '4.0', '3.0', u, u],
      heaven: [u, u, '2.0', '2.0', '2.0', '3.0', '3.0', '4.0', '4.0', '4.0', '2.0', u, u],
      alga:   [u, u, '2.0', '2.0', '2.0', '2.0', '3.0', '3.0', '3.0', '3.0', u, u, u],
    }
  ),
  notes: [
    t('Biobizz-Mixe enthalten bereits Nährstoffe, in den ersten 2–3 Wochen nach dem Umtopfen kaum düngen.', 'Biobizz mixes already contain nutrients; feed very little during the first 2–3 weeks after transplanting.'),
    t('Organisch: Der pH-Wert im Gießwasser sollte bei ca. 6,3–6,8 liegen (Erde).', 'Organic: the pH of the water should be around 6.3–6.8 (soil).'),
    t('In den letzten 1–2 Wochen nur noch klares Wasser.', 'Only plain water during the last 1–2 weeks.'),
  ],
});

// ---------- ADVANCED NUTRIENTS (pH Perfect) ----------
const ADVANCED = (): FertSchedule => ({
  id: 'advanced',
  brand: 'Advanced Nutrients',
  line: 'pH Perfect Sensi Grow / Bloom',
  unit: UNIT(),
  tagline: t('Dreiteilige pH-Perfect-Basis (Micro, Grow, Bloom) mit vielen Zusätzen. Meist Hydro oder Coco.', 'Three-part pH Perfect base (Micro, Grow, Bloom) with many additives. Mostly hydro or coco.'),
  accent: '#fbbf24',
  verified: false,
  mixOrder: 'Sensi Grow/Bloom A+B → Voodoo Juice → Big Bud → Overdrive → B-52 → Bud Candy → Flawless Finish',
  products: [
    { key: 'gA', label: 'Sensi Grow A', color: '#34d399', role: t('Basis Wuchs, Teil A', 'Base grow, part A') },
    { key: 'gB', label: 'Sensi Grow B', color: '#10b981', role: t('Basis Wuchs, Teil B', 'Base grow, part B') },
    { key: 'bA', label: 'Sensi Bloom A', color: '#fbbf24', role: t('Basis Blüte, Teil A', 'Base bloom, part A') },
    { key: 'bB', label: 'Sensi Bloom B', color: '#f59e0b', role: t('Basis Blüte, Teil B', 'Base bloom, part B') },
    { key: 'voodoo', label: 'Voodoo Juice', color: '#a78bfa', role: t('Nützliche Bakterien für Wurzeln', 'Beneficial bacteria for roots') },
    { key: 'bigbud', label: 'Big Bud', color: '#fb7185', role: t('Blütebooster, mehr Blütenmasse', 'Bloom booster, more bud mass') },
    { key: 'overdrive', label: 'Overdrive', color: '#f472b6', role: t('Späte Blüte, Dichte und Gewicht', 'Late flower, density and weight') },
    { key: 'b52', label: 'B-52', color: '#22d3ee', role: t('B-Vitamine, gegen Stress', 'B vitamins, against stress') },
    { key: 'candy', label: 'Bud Candy', color: '#fcd34d', role: t('Kohlenhydrate, Aroma', 'Carbohydrates, aroma') },
  ],
  weeks: build(
    [
      { label: 'Start', stage: 'start', ec: '0.8' },
      { label: 'Veg 1', stage: 'veg', ec: '1.2' },
      { label: 'Veg 2', stage: 'veg', ec: '1.4' },
      { label: 'Veg 3', stage: 'veg', ec: '1.6' },
      { label: bl(1), stage: 'flower', ec: '1.6' },
      { label: bl(2), stage: 'flower', ec: '1.8' },
      { label: bl(3), stage: 'flower', ec: '2.0' },
      { label: bl(4), stage: 'flower', ec: '2.0' },
      { label: bl(5), stage: 'flower', ec: '2.0' },
      { label: bl(6), stage: 'flower', ec: '1.8' },
      { label: bl(7), stage: 'flower', ec: '1.6' },
      { label: bl(8), stage: 'flower', ec: '1.4' },
      { label: 'Flush', stage: 'flush', ec: '0.0' },
    ],
    {
      gA:        ['1.0', '2.0', '3.0', '4.0', '2.0', u, u, u, u, u, u, u, u],
      gB:        ['1.0', '2.0', '3.0', '4.0', '2.0', u, u, u, u, u, u, u, u],
      bA:        [u, u, u, u, '2.0', '3.0', '4.0', '4.0', '4.0', '3.0', '2.0', '2.0', u],
      bB:        [u, u, u, u, '2.0', '3.0', '4.0', '4.0', '4.0', '3.0', '2.0', '2.0', u],
      voodoo:    ['2.0', '2.0', '2.0', '2.0', '2.0', '2.0', '2.0', u, u, u, u, u, u],
      bigbud:    [u, u, u, u, u, '1.0', '2.0', '2.0', '2.0', '1.0', u, u, u],
      overdrive: [u, u, u, u, u, u, u, u, u, '1.0', '1.0', '1.0', u],
      b52:       [u, '2.0', '2.0', '2.0', '2.0', '2.0', '2.0', '2.0', '2.0', '2.0', u, u, u],
      candy:     [u, u, u, u, u, '2.0', '3.0', '4.0', '4.0', '4.0', '2.0', u, u],
    }
  ),
  notes: [
    t('pH Perfect puffert den pH-Wert selbst, in der Regel ist kein pH-Anpassen nötig (Ziel ca. 5,5–6,3).', 'pH Perfect buffers the pH itself; usually no pH adjustment is needed (target approx. 5.5–6.3).'),
    t('Immer erst A, dann B einrühren, nie A und B unverdünnt zusammenbringen.', 'Always stir in A first, then B; never combine A and B undiluted.'),
    t('Vor der Ernte 1–2 Wochen nur klares Wasser, optional Flawless Finish.', 'Only plain water for 1–2 weeks before harvest, optionally Flawless Finish.'),
  ],
});

// ---------- ATHENA (aus athenaData, mL/10L → mL/L) ----------
function perLiter(v?: string): string | undefined {
  if (!v) return undefined;
  if (v === AS_NEEDED) return v;
  const conv = (s: string) => {
    const n = parseFloat(s) / 10;
    return Number.isInteger(n) ? String(n) : n.toFixed(1);
  };
  return v.includes('–') ? v.split('–').map(conv).join('–') : conv(v);
}

const ATHENA = (): FertSchedule => ({
  id: 'athena',
  brand: 'Athena',
  line: 'Blended Line',
  unit: UNIT(),
  tagline: t('Offizielles Blended-Schema von Clone bis Blüte Woche 9. Werte aus dem Hersteller-Dokument.', 'Official Blended schedule from clone to flower week 9. Values from the manufacturer document.'),
  accent: '#22d3ee',
  verified: true,
  mixOrder: 'Balance → Grow/Bloom A → Grow/Bloom B → PK → CaMg → Fade → Cleanse',
  products: [
    { key: 'balance', label: 'Balance', color: '#a78bfa', role: t('pH-Heber, als Erstes, nach Bedarf', 'pH up, first, as needed') },
    { key: 'growA', label: 'Grow A', color: '#34d399', role: t('Basis Wuchs, Teil A', 'Base grow, part A') },
    { key: 'growB', label: 'Grow B', color: '#10b981', role: t('Basis Wuchs, Teil B', 'Base grow, part B') },
    { key: 'bloomA', label: 'Bloom A', color: '#fbbf24', role: t('Basis Blüte, Teil A', 'Base bloom, part A') },
    { key: 'bloomB', label: 'Bloom B', color: '#f59e0b', role: t('Basis Blüte, Teil B', 'Base bloom, part B') },
    { key: 'pk', label: 'PK', color: '#fb7185', role: t('Phosphor/Kalium-Booster', 'Phosphorus/potassium booster') },
    { key: 'caMg', label: 'CaMg', color: '#60a5fa', role: t('Calcium/Magnesium-Ergänzung', 'Calcium/magnesium supplement') },
    { key: 'fade', label: 'Fade', color: '#2dd4bf', role: t('Finisher vor dem Flush', 'Finisher before the flush') },
    { key: 'cleanse', label: 'Cleanse', color: '#22d3ee', role: t('Wasser-Conditioner, als Letztes', 'Water conditioner, last') },
  ],
  weeks: ATHENA_BLENDED.map((c) => ({
    label: weekLabel(c.label),
    stage: c.stage === 'Flower' ? 'flower' : c.stage === 'Veg' ? 'veg' : 'start',
    ec: c.ec.toFixed(1),
    doses: {
      balance: c.balance,
      growA: perLiter(c.growA),
      growB: perLiter(c.growB),
      bloomA: perLiter(c.bloomA),
      bloomB: perLiter(c.bloomB),
      pk: perLiter(c.pk),
      caMg: perLiter(c.caMg),
      fade: perLiter(c.fade),
      cleanse: perLiter(c.cleanse),
    },
  })),
  notes: [
    t('Quelle: Athena Ag, Inc. (Blended_Feed_Schedule_Imperial, A01.004). Original in US-Gallonen, hier auf mL pro 10 Liter umgerechnet.', 'Source: Athena Ag, Inc. (Blended_Feed_Schedule_Imperial, A01.004). Shown in mL per US gallon.'),
    t('Balance wird nur nach Bedarf zum Anheben des pH eingesetzt, nicht wöchentlich.', 'Balance is only used as needed to raise the pH, not weekly.'),
    t('Das ausführliche Athena-Schema mit PPM-Werten und Ziel-pH findest du unter „Athena Detailschema“.', 'The detailed Athena schedule with PPM values and target pH can be found under “Athena detailed schedule”.'),
  ],
});

export const FERTILIZER_IDS = ['athena', 'hesi', 'plagron', 'biobizz', 'advanced'];

/** Alle Schemata in der aktuellen Sprache */
export function getFertilizers(): FertSchedule[] {
  return [ATHENA(), HESI(), PLAGRON(), BIOBIZZ(), ADVANCED()];
}

export function stageLabel(s: StageKind): string {
  return {
    start: 'Start',
    veg: t('Wuchs', 'Veg'),
    flower: t('Blüte', 'Flower'),
    flush: 'Flush',
  }[s];
}

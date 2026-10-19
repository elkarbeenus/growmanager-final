// Stromkosten eines Grows: LED-Lampe (Lichtstunden) plus weitere Geräte (Abluft, Clip-Fan, Controller,
// Ent-/Befeuchter) jeweils Leistung × Laufzeit × Tage × Strompreis.
// Wachstum/Steckling: Standard 18 h Licht pro Tag, Blüte: 12 h (in den Einstellungen änderbar).
import type { AppSettings, Device, DevicePhase, DeviceType, Grow, Lamp } from '@/types';
import { daysBetweenLocal, localToday } from '@/lib/nutrientLogic';
import { t } from '@/lib/i18n';

export const DEFAULT_HOURS_VEG = 18;
export const DEFAULT_HOURS_FLOWER = 12;
export const MAX_LAMPS_PER_GROW = 4;

export const hoursVeg = (s?: AppSettings) => s?.hoursVeg ?? DEFAULT_HOURS_VEG;
export const hoursFlower = (s?: AppSettings) => s?.hoursFlower ?? DEFAULT_HOURS_FLOWER;

/** Standard-Dimmprofil einer LED-Lampe: Wachstum 60 %, Blüte 60 % → 100 % innerhalb von 3 Wochen, danach 100 %. */
export const DEFAULT_DIM = { veg: 60, flowerStart: 60, flowerEnd: 100, rampWeeks: 3 };

export function lampDim(l: Lamp) {
  return {
    veg: l.dimVeg ?? DEFAULT_DIM.veg,
    flowerStart: l.dimFlowerStart ?? DEFAULT_DIM.flowerStart,
    flowerEnd: l.dimFlowerEnd ?? DEFAULT_DIM.flowerEnd,
    rampWeeks: l.rampWeeks ?? DEFAULT_DIM.rampWeeks,
  };
}

/** Helligkeit in % am n-ten Blütetag (0 = erster Tag): linear von Start- auf Endwert, danach Endwert. */
export function flowerDimAt(l: Lamp, day: number): number {
  const d = lampDim(l);
  const rampDays = d.rampWeeks * 7;
  if (rampDays <= 0 || day >= rampDays) return d.flowerEnd;
  return d.flowerStart + ((d.flowerEnd - d.flowerStart) * day) / rampDays;
}

/** Summe der Helligkeit (als Anteil, 1 = 100 %) über die ersten n Blütetage. */
export function flowerDimDays(l: Lamp, n: number): number {
  let sum = 0;
  for (let i = 0; i < n; i++) sum += flowerDimAt(l, i) / 100;
  return sum;
}

/** kWh einer LED-Lampe für gegebene Tage (berücksichtigt das Dimmprofil). */
export function ledKwh(l: Lamp, count: number, vegDays: number, flowerDays: number, hv: number, hf: number): number {
  const d = lampDim(l);
  return ((vegDays * hv * (d.veg / 100) + hf * flowerDimDays(l, flowerDays)) * l.watts * count) / 1000;
}

export const DEVICE_TYPES: DeviceType[] = ['exhaust', 'clipfan', 'controller', 'dehumidifier', 'humidifier', 'other'];

/** Voreingestellte Laufzeit pro Tag je Gerätetyp (anpassbar). */
export const DEFAULT_DEVICE_HOURS: Record<DeviceType, number> = {
  exhaust: 24,
  clipfan: 24,
  controller: 24,
  dehumidifier: 8,
  humidifier: 8,
  other: 24,
};

export function deviceTypeLabel(type: DeviceType): string {
  return {
    exhaust: t('Abluft', 'Exhaust fan'),
    clipfan: t('Clip-Fan / Umluft', 'Clip fan / circulation'),
    controller: t('Grow-Controller', 'Grow controller'),
    dehumidifier: t('Entfeuchter', 'Dehumidifier'),
    humidifier: t('Befeuchter', 'Humidifier'),
    other: t('Sonstiges', 'Other'),
  }[type];
}

export function devicePhaseLabel(p: DevicePhase): string {
  return { both: t('Wachstum + Blüte', 'Veg + flower'), veg: t('nur Wachstum', 'veg only'), flower: t('nur Blüte', 'flower only') }[p];
}

export type PowerReason = 'ok' | 'noLamp' | 'noPrice' | 'noDates';

export interface PowerLine {
  id: string;
  kind: 'led' | DeviceType;
  name: string;
  count: number;
  watts: number; // Gesamtleistung dieser Zeile
  hoursLabel: string;
  kwh: number;
  cost: number;
  plannedKwh?: number;
  plannedCost?: number;
}

export interface AutoPowerCost {
  enabled: boolean;
  reason: PowerReason; // noLamp = weder Lampe noch Gerät gewählt
  lamp?: Lamp;
  count: number;
  watts: number; // Gesamtleistung der LED-Lampen
  priceKwh: number;
  hoursVeg: number;
  hoursFlower: number;
  vegDays: number; // bisher gezählte Tage (bis heute bzw. Ernte)
  flowerDays: number;
  kwh: number; // gesamt bisher (LED + Geräte)
  amount: number; // € gesamt bisher (auf Cent gerundet)
  plannedAmount?: number; // € bis zur geplanten Ernte
  plannedKwh?: number;
  lines: PowerLine[];
}

const diff = (a: string, b: string) => Math.max(0, daysBetweenLocal(a, b));
const minDate = (a: string, b: string) => (a < b ? a : b);
const round2 = (n: number) => Math.round(n * 100) / 100;

function lightDays(grow: Grow, cap: string) {
  const m = grow.milestones;
  const start = m.cloneStart ?? m.vegStart ?? m.flowerStart;
  if (!start || start >= cap) return { vegDays: 0, flowerDays: 0, hasStart: !!start };
  const flowerAt = m.flowerStart && m.flowerStart > start ? m.flowerStart : m.flowerStart ? start : undefined;
  const vegEnd = flowerAt ? minDate(flowerAt, cap) : cap;
  const vegDays = diff(start, vegEnd);
  const flowerDays = flowerAt && flowerAt < cap ? diff(flowerAt, cap) : 0;
  return { vegDays, flowerDays, hasStart: true };
}

/** kWh eines Geräts für gegebene Tage (berücksichtigt die Phase, in der es läuft). */
function deviceKwh(d: Device, vegDays: number, flowerDays: number): number {
  const days = (d.phase !== 'flower' ? vegDays : 0) + (d.phase !== 'veg' ? flowerDays : 0);
  return (days * d.hours * d.watts) / 1000;
}

/** Stromkosten bis heute (bzw. bis zur Ernte) und – falls ein Erntedatum feststeht – bis zur geplanten Ernte. */
export function autoPowerCost(grow: Grow, settings: AppSettings | undefined, today = localToday()): AutoPowerCost {
  const lamp = grow.lampId ? settings?.lamps?.find((l) => l.id === grow.lampId) : undefined;
  const devices = (grow.deviceIds ?? []).map((id) => settings?.devices?.find((d) => d.id === id)).filter((d): d is Device => !!d);
  const count = Math.min(MAX_LAMPS_PER_GROW, Math.max(1, Math.round(grow.lampCount ?? 1)));
  const price = settings?.kwhPrice;
  const hv = hoursVeg(settings);
  const hf = hoursFlower(settings);
  const base: AutoPowerCost = {
    enabled: grow.powerCostAuto !== false,
    reason: 'ok',
    lamp,
    count,
    watts: (lamp?.watts ?? 0) * count,
    priceKwh: price ?? 0,
    hoursVeg: hv,
    hoursFlower: hf,
    vegDays: 0,
    flowerDays: 0,
    kwh: 0,
    amount: 0,
    lines: [],
  };
  if (!lamp && devices.length === 0) return { ...base, reason: 'noLamp' };
  if (price === undefined) return { ...base, reason: 'noPrice' };

  const m = grow.milestones;
  const harvest = m.actualHarvest ?? m.expectedHarvest;
  const cap = harvest ? minDate(harvest, today) : today;
  const d = lightDays(grow, cap);
  if (!d.hasStart) return { ...base, reason: 'noDates' };
  const planned = harvest && !m.actualHarvest ? lightDays(grow, harvest) : undefined;

  const lines: PowerLine[] = [];
  if (lamp) {
    const w = lamp.watts * count;
    const dim = lampDim(lamp);
    const kwh = ledKwh(lamp, count, d.vegDays, d.flowerDays, hv, hf);
    const pk = planned ? ledKwh(lamp, count, planned.vegDays, planned.flowerDays, hv, hf) : undefined;
    lines.push({
      id: lamp.id,
      kind: 'led',
      name: lamp.name,
      count,
      watts: w,
      hoursLabel: `${hv} h @ ${dim.veg} % · ${hf} h @ ${dim.flowerStart === dim.flowerEnd ? `${dim.flowerEnd} %` : `${dim.flowerStart}→${dim.flowerEnd} %`}`,
      kwh,
      cost: kwh * price,
      plannedKwh: pk,
      plannedCost: pk !== undefined ? pk * price : undefined,
    });
  }
  for (const dev of devices) {
    const kwh = deviceKwh(dev, d.vegDays, d.flowerDays);
    const pk = planned ? deviceKwh(dev, planned.vegDays, planned.flowerDays) : undefined;
    lines.push({
      id: dev.id,
      kind: dev.type,
      name: dev.name,
      count: 1,
      watts: dev.watts,
      hoursLabel: `${dev.hours} h`,
      kwh,
      cost: kwh * price,
      plannedKwh: pk,
      plannedCost: pk !== undefined ? pk * price : undefined,
    });
  }

  const kwh = lines.reduce((s, l) => s + l.kwh, 0);
  const result: AutoPowerCost = { ...base, vegDays: d.vegDays, flowerDays: d.flowerDays, kwh, amount: round2(kwh * price), lines };
  if (planned) {
    const pk = lines.reduce((s, l) => s + (l.plannedKwh ?? 0), 0);
    result.plannedKwh = pk;
    result.plannedAmount = round2(pk * price);
  }
  return result;
}

/** kWh pro Tag bei x Stunden. */
export const kwhPerDay = (watts: number, hours: number) => (watts * hours) / 1000;

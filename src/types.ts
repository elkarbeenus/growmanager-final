export type MilestoneKey =
  | 'cloneStart'
  | 'vegStart'
  | 'flowerStart'
  | 'stretchEnd'
  | 'expectedHarvest'
  | 'actualHarvest';

export type Milestones = Partial<Record<MilestoneKey, string>>;

export interface LogEntry {
  id: string;
  date: string; // YYYY-MM-DD
  ph?: number;
  ec?: number;
  temp?: number; // °C
  humidity?: number; // % RH
  watering?: number; // liters
  nutrientsAdded: boolean;
  note?: string;
}

export interface DryingData {
  daysDried?: number;
  tempMin?: number; // °C minimale Trocknungstemperatur
  tempMax?: number; // °C maximale Trocknungstemperatur
  humidity?: number; // % RLF beim Trocknen
  harvestAmount?: number; // Erntemenge in Gramm
  notes?: string;
}

export type CostCategory = 'nutrients' | 'electricity' | 'equipment' | 'substrate' | 'genetics' | 'other';

export interface CostEntry {
  id: string;
  category: CostCategory;
  label?: string;
  amount: number; // in EUR
  date?: string; // YYYY-MM-DD (optional)
  auto?: boolean; // nur zur Laufzeit: automatisch aus der Nährlösung berechnet (wird nicht gespeichert)
}

export interface Lamp {
  id: string;
  name: string; // Modell / Bezeichnung
  watts: number; // tatsächliche Leistungsaufnahme in Watt
}

export type DeviceType = 'exhaust' | 'clipfan' | 'controller' | 'dehumidifier' | 'humidifier' | 'other';
export type DevicePhase = 'both' | 'veg' | 'flower';

export interface Device {
  id: string;
  type: DeviceType;
  name: string; // Modell / Bezeichnung
  watts: number; // Leistungsaufnahme in Watt
  hours: number; // Laufzeit pro Tag (Durchschnitt)
  phase: DevicePhase; // in welcher Phase das Gerät läuft
}

export interface AppSettings {
  kwhPrice?: number; // Strompreis in € pro kWh
  hoursVeg?: number; // Lichtstunden pro Tag (Steckling/Wachstum), Standard 18
  hoursFlower?: number; // Lichtstunden pro Tag (Blüte), Standard 12
  lamps?: Lamp[]; // angelegte LED-Lampen
  devices?: Device[]; // weitere Geräte: Abluft, Clip-Fan, Controller, Ent-/Befeuchter
}

export interface Grow {
  id: string;
  name: string;
  strain?: string;
  color: string; // tailwind-friendly accent hex used for the grow card
  milestones: Milestones;
  logs: LogEntry[];
  drying?: DryingData;
  lampId?: string; // genutzte LED-Lampe (aus den Einstellungen)
  lampCount?: number; // Anzahl dieser Lampen (1–4)
  deviceIds?: string[]; // genutzte weitere Geräte (aus den Einstellungen)
  powerCostAuto?: boolean; // false = Stromkosten NICHT automatisch berechnen (Standard: an)
  fertCostAuto?: boolean; // false = Dünger-Kosten NICHT automatisch aus der Nährlösung berechnen (Standard: an)
  fertilizerId?: string; // gewähltes Düngeschema (z. B. 'athena') für die Verbrauchsauswertung
  plantCount?: number; // 1–10 Pflanzen pro Grow (Daten wie Start etc. gelten für alle gleich)
  costs?: CostEntry[]; // Kosten dieses Grows
  createdAt: string;
}

export interface NutrientBatch {
  id: string;
  date: string; // YYYY-MM-DD (Tag des Anmischens)
  liters: number; // immer in Litern gespeichert
  note?: string;
  growId?: string; // für welchen Grow wurde angemischt (optional)
  weekIndex?: number; // manuell gewählte Schema-Woche (Index in den Wochen des Düngeschemas); sonst automatisch
  createdAt: string;
}

export interface AppData {
  version: number;
  grows: Grow[];
  batches?: NutrientBatch[]; // Nährlösungs-Ansätze
  settings?: AppSettings; // Strompreis, Lichtstunden, LED-Lampen
  fertPrices?: Record<string, number>; // eigene Düngerpreise (€ pro Liter), Schlüssel "schemaId:produktKey"
}

export type PhaseKey =
  | 'planning'
  | 'germination'
  | 'veg'
  | 'stretch'
  | 'bloom'
  | 'ready'
  | 'harvested';

export interface PhaseInfo {
  key: PhaseKey;
  label: string;
  description: string;
  accent: 'ink' | 'primary' | 'accent' | 'warning' | 'error';
}

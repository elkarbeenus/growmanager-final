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
}

export interface Grow {
  id: string;
  name: string;
  strain?: string;
  color: string; // tailwind-friendly accent hex used for the grow card
  milestones: Milestones;
  logs: LogEntry[];
  drying?: DryingData;
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

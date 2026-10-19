// Einfache Zweisprachigkeit (Deutsch / Englisch) ohne externe Bibliothek.
// Die gewählte Sprache wird im localStorage gespeichert. Bei Englisch werden
// Volumen (Liter) in US-Gallonen angezeigt.
import { useSyncExternalStore } from 'react';

export type Lang = 'de' | 'en';

const LANG_KEY = 'growhub:lang';
export const LITERS_PER_GALLON = 3.785411784; // US-Gallone

function loadLang(): Lang {
  try {
    const v = localStorage.getItem(LANG_KEY);
    if (v === 'de' || v === 'en') return v;
  } catch {
    /* ignore */
  }
  return 'de';
}

let current: Lang = loadLang();
const listeners = new Set<() => void>();

if (typeof document !== 'undefined') document.documentElement.lang = current;

export function getLang(): Lang {
  return current;
}

export function setLang(lang: Lang): void {
  if (lang === current) return;
  current = lang;
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    /* ignore */
  }
  if (typeof document !== 'undefined') document.documentElement.lang = lang;
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** React-Hook: liefert die aktuelle Sprache und rendert bei Wechsel neu. */
export function useLang(): Lang {
  return useSyncExternalStore(subscribe, getLang, getLang);
}

/** Übersetzung inline: t('Deutsch', 'English') */
export function t(de: string, en: string): string {
  return current === 'en' ? en : de;
}

export function isEn(): boolean {
  return current === 'en';
}

export function locale(): string {
  return current === 'en' ? 'en-US' : 'de-DE';
}

// ---------- Zahlen & Einheiten ----------

/** Rundet auf max. `digits` Nachkommastellen und entfernt überflüssige Nullen. */
export function fmtNum(n: number, digits = 1): string {
  const f = Number(n.toFixed(digits));
  return String(f);
}

export const AS_NEEDED = 'nach Bedarf'; // interner Wert in den Düngerdaten

/**
 * Rechnet einen Dosis-String (z. B. "2.5", "8–13" oder "nach Bedarf") mit einem
 * Faktor um. Ranges werden pro Teil umgerechnet.
 */
export function scaleDose(v: string | undefined, factor: number): string | undefined {
  if (!v) return undefined;
  if (v === AS_NEEDED) return t('nach Bedarf', 'as needed');
  if (factor === 1) return v;
  const conv = (s: string) => {
    const n = parseFloat(s);
    return Number.isFinite(n) ? fmtNum(n * factor, 1) : s;
  };
  return v.includes('–') ? v.split('–').map(conv).join('–') : conv(v);
}

/** Dosis in mL/L → Anzeige (DE: mL/L, EN: mL/gal) */
export function doseFromPerLiter(v: string | undefined): string | undefined {
  return scaleDose(v, isEn() ? LITERS_PER_GALLON : 1);
}

/** Dosis in mL/L (interne Schema-Werte) → Anzeige im Reiter "Dünger" (DE: mL/10L, EN: mL/gal) */
export function doseFromPerLiterDisplay(v: string | undefined): string | undefined {
  return scaleDose(v, isEn() ? LITERS_PER_GALLON : 10);
}

/** Kurze Einheit für Dosierungen: DE mL/10L, EN mL/gal */
export function doseUnitShort(): string {
  return isEn() ? 'mL/gal' : 'mL/10L';
}

/** Lange Einheit für Dosierungen: DE "mL / 10 Liter", EN "mL / gallon" */
export function doseUnitLong(): string {
  return isEn() ? 'mL / gallon' : 'mL / 10 Liter';
}

/** Dosis in mL/10L → Anzeige (DE: mL/10L, EN: mL/gal) */
export function doseFromPer10L(v: string | undefined): string | undefined {
  return scaleDose(v, isEn() ? LITERS_PER_GALLON / 10 : 1);
}

/** Einheit der Gießmenge */
export function volumeUnit(): string {
  return isEn() ? 'gal' : 'L';
}

/** Liter → Anzeige-Volumen (L oder gal) */
export function litersToDisplay(liters: number | undefined): number | undefined {
  if (liters === undefined) return undefined;
  return isEn() ? Number((liters / LITERS_PER_GALLON).toFixed(2)) : liters;
}

/** Anzeige-Volumen (L oder gal) → Liter für die Speicherung */
export function displayToLiters(v: number | undefined): number | undefined {
  if (v === undefined) return undefined;
  return isEn() ? Number((v * LITERS_PER_GALLON).toFixed(3)) : v;
}

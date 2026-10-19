// Zentrale App-Informationen für den "Über"-Reiter und die Versionsanzeige.
// Hier die eigenen Angaben (Entwickler) eintragen.
// Die Version wird beim Build aus package.json übernommen (siehe vite.config.ts).
import { t } from '@/lib/i18n';

export const APP_VERSION: string = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.2.1';

export const APP_NAME = 'growmanager';

export const DEVELOPER = {
  name: 'Dominic Lesina',
  role: () => t('Entwicklung & Design', 'Development & design'),
  github: '', // z. B. 'https://github.com/DEIN-NAME' (leer = nicht anzeigen)
  contact: '', // z. B. 'mail@example.com' (leer = nicht anzeigen)
};

export interface ChangelogEntry {
  version: string;
  items: { de: string; en: string }[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.2.1',
    items: [
      { de: 'Backup-Verlauf: „Schnell zurückspringen“ auf eines der letzten 2 Backups', en: 'Backup history: “Quick rollback” to one of the last 2 backups' },
      { de: 'Zurückspringen und Wiederherstellen fragen nach und zeigen vorher, was verloren geht, zurückkommt oder geändert wird', en: 'Rolling back and restoring ask for confirmation and first show what will be lost, come back or change' },
    ],
  },
  {
    version: '1.2.0',
    items: [
      { de: 'Import oben rechts fragt jetzt nach, bevor alle aktuellen Daten überschrieben werden (mit Anzahl aktuell vs. Datei)', en: 'Import at the top right now asks before all current data is overwritten (showing current vs. file counts)' },
      { de: 'Vor Import, Wiederherstellung und Zurücksetzen wird automatisch ein Sicherungs-Backup angelegt', en: 'A safety backup is created automatically before import, restore and reset' },
      { de: 'Neu im Reiter „Über“: „Alles zurücksetzen“ (mit Bestätigung durch Eintippen von RESET); in der Einführungstour erklärt', en: 'New in the “About” tab: “Reset everything” (confirmed by typing RESET); explained in the tour' },
    ],
  },
  {
    version: '1.1.3',
    items: [
      { de: 'Fix: Der Export-Button oben rechts funktioniert jetzt auch in der Desktop-App (Speichern unter … mit Pfadanzeige)', en: 'Fix: the Export button at the top right now also works in the desktop app (Save as … with path shown)' },
      { de: 'Neu: Nach Import oder Wiederherstellung zeigt ein kurzes Pop-up, was hinzugefügt, geändert oder entfernt wurde – oder dass die Daten gleich geblieben sind', en: 'New: after an import or restore, a short pop-up shows what was added, changed or removed – or that your data stayed the same' },
    ],
  },
  {
    version: '1.1.2',
    items: [
      { de: 'Auswahlfelder (z. B. in „Nährlösung“, Kosten, Dünger-Verbrauch) sind jetzt dunkel und funktionieren auf allen Systemen gleich', en: 'Dropdowns (e.g. in “Nutrient mix”, costs, fertilizer usage) are now dark and work the same on every system' },
    ],
  },
  {
    version: '1.1.1',
    items: [
      { de: 'Reiter „Dünger“: Dosierungen jetzt in mL pro 10 Liter (Englisch: mL pro Gallone) – auch in den Schema-Tabellen', en: '“Nutrients” tab: doses now shown in mL per gallon (German: mL per 10 liters) – including the schedule tables' },
    ],
  },
  {
    version: '1.1.0',
    items: [
      { de: 'Neu: Einführungstour beim ersten Start (einmalig, mit „nicht mehr anzeigen“) – erneut startbar über „?“ oder im Reiter „Über“', en: 'New: introductory tour on first start (one-time, with “don’t show again”) – restartable via “?” or in the “About” tab' },
      { de: 'Neu: Hinweis-Karten (dauerhaft ausblendbar) und Schnellsprung-Chips im Grow', en: 'New: hint cards (permanently dismissible) and quick-jump chips inside a grow' },
      { de: 'Pflanzenanzahl jetzt direkt im Bereich „Meilensteine“ ganz oben im Grow einstellbar', en: 'Number of plants can now be set directly in the “Milestones” section at the top of a grow' },
      { de: 'Dünger-Verbrauch nach Phase (Wachstum / Blüte) – im Grow, im Reiter „Nährlösung“ und im PDF; Ansätze werden automatisch dem Grow zugeordnet', en: 'Fertilizer usage by phase (veg / flower) – in the grow, in the “Nutrient mix” tab and in the PDF; batches are assigned to the grow automatically' },
      { de: 'Der im Reiter „Dünger“ gewählte Dünger gilt für die Verbrauchsrechnung', en: 'The fertilizer selected in the “Nutrients” tab is used for the usage calculation' },
    ],
  },
  {
    version: '1.0.9',
    items: [
      { de: 'Neu: PDF-Vorschau – der Bericht öffnet zuerst in einem Pop-up zum Ansehen und wird von dort aus gespeichert', en: 'New: PDF preview – the report opens in a pop-up first and is saved from there' },
      { de: 'Neu: Nährlösung & Dünger-Verbrauch pro Grow – verbrauchte mL je Produkt und angemischte Liter Nährlösung', en: 'New: nutrient solution & fertilizer usage per grow – mL used per product and liters of solution mixed' },
      { de: 'Nährlösungs-Ansätze lassen sich einem Grow und einer Schema-Woche zuordnen (automatisch oder manuell)', en: 'Nutrient batches can be assigned to a grow and a schedule week (automatic or manual)' },
      { de: 'Der Verbrauch erscheint auch im PDF-Bericht', en: 'The usage also appears in the PDF report' },
    ],
  },
  {
    version: '1.0.8',
    items: [
      { de: 'Neu: PDF-Bericht pro Grow (Überblick, Meilensteine, Kosten, Ertrag, Tagebuch mit Diagrammen)', en: 'New: PDF report per grow (overview, milestones, costs, yield, journal with charts)' },
      { de: 'Neu: Anzahl Pflanzen pro Grow (1–10); Startdatum und Meilensteine gelten für alle Pflanzen gleich', en: 'New: number of plants per grow (1–10); start date and milestones apply to all plants equally' },
      { de: 'Neu: Kosten pro Grow (Dünger, Strom, Equipment, Substrat, Genetik, Sonstiges) mit Kosten pro Pflanze und pro Gramm', en: 'New: costs per grow (nutrients, electricity, equipment, substrate, genetics, other) with cost per plant and per gram' },
      { de: 'Neu: Reiter „Übersicht“ mit Kosten, Ertrag und Vergleich aller Grows (Jahresfilter, PDF-Export)', en: 'New: “Overview” tab with costs, yield and comparison of all grows (year filter, PDF export)' },
    ],
  },
  {
    version: '1.0.7',
    items: [
      { de: 'Backup: „Speichern unter …“ mit frei wählbarem Pfad bleibt; Versand per E-Mail wurde entfernt', en: 'Backup: “Save as …” with a freely chosen path stays; sending by email was removed' },
      { de: 'Backup: Neue Übersicht „Wo werden meine Backups gespeichert?“; Export und „Speichern unter …“ zeigen den Speicherort an', en: 'Backup: new overview “Where are my backups stored?”; export and “Save as …” show the storage location' },
      { de: 'Neu: Windows-Version (Setup .exe) zusätzlich zum Linux-AppImage', en: 'New: Windows version (setup .exe) in addition to the Linux AppImage' },
      { de: 'Versionsanzeige nur noch als Hinweis unten links; Versionswechsel entfernt', en: 'Version shown only as a note at the bottom left; version switching removed' },
    ],
  },
  {
    version: '1.0.6',
    items: [
      { de: 'Neuer Reiter „Über“ mit Infos zur App und zum Entwickler', en: 'New “About” tab with app and developer info' },
      { de: 'Versionsanzeige unten rechts', en: 'Version badge at the bottom right' },
      { de: 'Backup: „Speichern unter …“ mit frei wählbarem Dateipfad', en: 'Backup: “Save as …” with a freely chosen file path' },
      { de: 'Fix: Auf den Grow-Karten wird bei „Seit Start“ / „Bis Ernte“ im Deutschen jetzt „T“ statt „d“ angezeigt', en: 'Fix: grow cards now show “T” instead of “d” for days in German' },
    ],
  },
  {
    version: '1.0.5',
    items: [
      { de: 'Neuer Reiter „Shot Size“: Crop-Steering-Shotgröße (vegetativ / generativ) in % und mL', en: 'New “Shot size” tab: crop steering shot size (vegetative / generative) in % and mL' },
      { de: 'Geplante Grows werden separat geführt; neuer Zähler „Ausstehend“', en: 'Planned grows are listed separately; new “Pending” counter' },
    ],
  },
];

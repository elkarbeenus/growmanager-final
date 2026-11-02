// Zentrale App-Informationen für den "Über"-Reiter und die Versionsanzeige.
// Hier die eigenen Angaben (Entwickler) eintragen.
// Die Version wird beim Build aus package.json übernommen (siehe vite.config.ts).
import { t } from '@/lib/i18n';

export const APP_VERSION: string = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.8.0';

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
    version: '1.8.0',
    items: [
      { de: 'Nährlösung: Verwendung wählbar – „Gebrauch“ (startet den Countdown) oder „Tränken“ (zählt nicht für den Countdown); auch nachträglich im Verlauf änderbar', en: 'Nutrient solution: choose the purpose – “Use” (starts the countdown) or “Soaking” (does not count for the countdown); can also be changed later in the history' },
      { de: 'Countdown je Grow: Ansätze, die einem Grow zugeordnet sind, haben einen eigenen Countdown – oben und im Reiter „Nährlösung“ wird jeder Grow getrennt erinnert', en: 'Countdown per grow: batches assigned to a grow have their own countdown – each grow is reminded separately at the top and in the “Nutrient mix” tab' },
      { de: 'Ent-/Befeuchter: pro Grow Stunden pro Tag und Anzahl Wochen einstellbar – die Stromkosten rechnen nur diese Laufzeit', en: 'Dehumidifier/humidifier: hours per day and number of weeks can be set per grow – electricity costs only count this run time' },
      { de: 'Bilder am Grow: Fotos hinzufügen, beschriften und groß ansehen; sie werden als Kopie in der App gespeichert und in Backup-Dateien mitgesichert', en: 'Photos on a grow: add, caption and view photos; they are stored as a copy in the app and included in backup files' },
      { de: 'Neuer Reiter „Steckling bestellen“: Links zu Flowery Field und Growroom21 öffnen im Standardbrowser', en: 'New “Order clones” tab: links to Flowery Field and Growroom21 open in the default browser' },
      { de: 'Beim Schließen der App: Abfrage, ob ein Backup erstellt werden soll, wenn es Änderungen seit dem letzten Backup gibt', en: 'When closing the app: asks whether to create a backup if there are changes since the last backup' },
      { de: 'Layout wird gemerkt: Reiter, geöffneter Grow, eingeklappte Bereiche, Scroll-Position und Fenstergröße sind beim nächsten Start wieder da; „Aktiv“, „Geplant“ und „Bisherige Grows“ sind einklappbar', en: 'Layout is remembered: tab, open grow, collapsed sections, scroll position and window size are restored on the next start; “Active”, “Planned” and “Past grows” can be collapsed' },
      { de: 'Flüssigeres Scrollen: teure Unschärfe-Effekte entfernt; neue Einstellung „Grafikbeschleunigung“ (Linux) mit automatischer Rückkehr in den sicheren Modus, falls das Fenster grau bleibt', en: 'Smoother scrolling: expensive blur effects removed; new “Hardware acceleration” setting (Linux) that switches back to safe mode automatically if the window stays grey' },
      { de: 'Fix: Die Phase vor dem Blütebeginn wird als „Wachstum“ angezeigt (vorher fälschlich „Stretch“, sobald ein Stretch-Ende eingetragen war)', en: 'Fix: the phase before flower start is shown as “Veg” (before it was wrongly “Stretch” as soon as an end of stretch was set)' },
      { de: 'Fix: Kalender über das Symbol links übernimmt das Datum zuverlässig (Popup liegt jetzt über allen Bereichen; Esc schließt nur den Kalender)', en: 'Fix: the calendar opened via the icon on the left reliably accepts the date (popup now lies above all sections; Esc only closes the calendar)' },
      { de: 'Fix: Der bei „Speichern unter …“ gewählte Speicherort wird angezeigt, der nächste Dialog öffnet dort, und Backups lassen sich direkt in diesen Ordner speichern', en: 'Fix: the location chosen with “Save as …” is shown, the next dialog opens there, and backups can be saved straight to that folder' },
    ],
  },
  {
    version: '1.7.1',
    items: [
      { de: 'Dimm-Profil nach Phasen: Wachstum, Stretch-Start und Blüte (nach dem Stretch) statt „Rampe“. Die Helligkeit steigt vom Stretch-Start bis zum Ende des Stretch (Meilenstein „Ende Stretch“) auf den Blüte-Wert', en: 'Dimming profile by phase: veg, stretch start and flower (after the stretch) instead of “ramp”. Brightness rises from stretch start to the end of the stretch (milestone “End of stretch”) up to the flower value' },
      { de: 'Ohne „Ende Stretch“ im Grow gilt die Ersatzdauer der Lampe (Standard 3 Wochen)', en: 'Without an “End of stretch” in the grow, the lamp’s fallback duration is used (default 3 weeks)' },
    ],
  },
  {
    version: '1.7.0',
    items: [
      { de: 'Neues Standard-Dimmprofil: Wachstum 40 %, Blüte 60 % → 100 % in den ersten 3 Wochen (in den Einstellungen je Lampe änderbar)', en: 'New default dimming profile: veg 40 %, flower 60 % → 100 % over the first 3 weeks (adjustable per lamp in Settings)' },
      { de: 'Schieberegler pro Grow: Helligkeit in Wachstum, Blüte-Start, Blüte danach und Rampenlänge lassen sich beim Anlegen/Bearbeiten und im Bereich „Kosten & Ertrag“ einstellen; „Zurücksetzen“ übernimmt wieder die Lampen-Vorgabe', en: 'Sliders per grow: brightness in veg, flower start, flower after and ramp length can be set when creating/editing and in “Costs & yield”; “Reset” goes back to the lamp default' },
      { de: 'Die Stromkosten nutzen das Profil des Grows; Lampen ohne eigene Werte verwenden jetzt 40 % im Wachstum (vorher 60 %)', en: 'Electricity costs use the grow’s own profile; lamps without custom values now use 40 % in veg (before: 60 %)' },
    ],
  },
  {
    version: '1.7.0',
    items: [
      { de: 'Fix: Die Datumsauswahl (Kalender-Symbol) übernimmt das gewählte Datum jetzt zuverlässig, auch in den Meilensteinen', en: 'Fix: the date picker (calendar icon) now reliably accepts the selected date, including in the milestones' },
      { de: 'Fix: Halb getippte Datumseingaben löschen das Datum nicht mehr; Esc schließt den Kalender', en: 'Fix: partially typed dates no longer clear the date; Esc closes the calendar' },
    ],
  },
  {
    version: '1.6.0',
    items: [
      { de: 'LED-Lampen mit Dimm-Profil: Helligkeit im Wachstum (Standard 60 %), in der Blüte von Startwert (60 %) auf Endwert (100 %) innerhalb einer einstellbaren Rampe (Standard 3 Wochen)', en: 'LED lamps with a dimming profile: brightness in veg (default 60 %), in flower from a start value (60 %) to an end value (100 %) within an adjustable ramp (default 3 weeks)' },
      { de: 'Die Stromkosten berücksichtigen das Dimm-Profil tagesgenau; in der Aufstellung steht die Helligkeit je Phase', en: 'Electricity costs take the dimming profile into account day by day; the breakdown shows the brightness per phase' },
    ],
  },
  {
    version: '1.5.0',
    items: [
      { de: 'Einstellungen: weitere Geräte anlegen – Abluft, Clip-Fan, Grow-Controller, Entfeuchter, Befeuchter – mit Watt, Laufzeit pro Tag und Phase', en: 'Settings: add other devices – exhaust fan, clip fan, grow controller, dehumidifier, humidifier – with watts, run time per day and phase' },
      { de: 'Beim Grow wählbar, welche Geräte genutzt werden; die Stromkosten umfassen jetzt LED-Lampe und alle gewählten Geräte (mit Aufstellung)', en: 'Choose per grow which devices are used; electricity costs now cover the LED lamp and all selected devices (with breakdown)' },
    ],
  },
  {
    version: '1.4.0',
    items: [
      { de: 'Neuer Reiter „Einstellungen“: Strompreis (€/kWh), Lichtstunden und LED-Lampen mit Watt anlegen', en: 'New “Settings” tab: enter electricity price (€/kWh), light hours and LED lamps with wattage' },
      { de: 'Beim Anlegen/Bearbeiten eines Grows lässt sich die genutzte LED-Lampe (und Anzahl) wählen', en: 'When creating/editing a grow you can choose the LED lamp used (and the number)' },
      { de: 'Stromkosten werden automatisch berechnet (Lampenleistung × Lichtstunden × Tage × Strompreis) und in Kosten, Übersicht und PDF eingerechnet', en: 'Electricity costs are calculated automatically (lamp power × light hours × days × price) and included in costs, overview and PDF' },
    ],
  },
  {
    version: '1.3.0',
    items: [
      { de: 'Dünger-Kosten werden jetzt automatisch aus der angemischten Nährlösung berechnet (Verbrauch × Preis) – kein manuelles Eintragen mehr nötig', en: 'Fertilizer costs are now calculated automatically from the mixed nutrient solution (usage × price) – no manual entry needed' },
      { de: 'Durchschnittspreise (€ pro Liter) für alle Produkte hinterlegt; im Reiter „Dünger“ und im Grow an die eigenen Preise anpassbar', en: 'Average prices (€ per liter) stored for all products; adjustable to your own prices in the “Nutrients” tab and in the grow' },
      { de: 'Die automatischen Kosten fließen in Kosten pro Pflanze/Gramm, Übersicht und PDF-Bericht ein; pro Grow abschaltbar', en: 'The automatic costs feed into cost per plant/gram, the overview and the PDF report; can be switched off per grow' },
    ],
  },
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

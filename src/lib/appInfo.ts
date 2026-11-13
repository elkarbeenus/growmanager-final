// Zentrale App-Informationen für den "Über"-Reiter und die Versionsanzeige.
// Hier die eigenen Angaben (Entwickler) eintragen.
// Die Version wird beim Build aus package.json übernommen (siehe vite.config.ts).
import { t } from '@/lib/i18n';

export const APP_VERSION: string = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.5.0';

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
    version: '0.5.0',
    items: [
      { de: 'Komplett neues Design „Grow-Zelt bei Nacht“: dunkle Pflaumentöne, Blattgrün für Aktionen, LED-Violett als Zweitfarbe und eine kräftigere Überschriften-Schrift', en: 'All-new “grow tent at night” design: dark plum tones, leaf green for actions, LED violet as second colour and a bolder heading font' },
      { de: 'Navigation in einer Seitenleiste links, gruppiert nach Garten, Werkzeuge und System; in kleinen Fenstern als Leiste oben', en: 'Navigation in a sidebar on the left, grouped into Garden, Tools and System; in small windows as a bar at the top' },
      { de: 'Grow-Karten neu: große Tageszahl, Farbkante je Grow und ein Lichtspektrum-Streifen, der pro erreichtem Meilenstein weiter leuchtet', en: 'Redesigned grow cards: large day count, colour edge per grow and a light-spectrum strip that lights up further with every milestone reached' },
      { de: 'Einführungstour überarbeitet: neuer Schritt zur Kopfzeile (Tour, Export, Import), Hinweise zur Seitenleiste und zum Spektrum-Streifen, Fortschrittspunkte', en: 'Guided tour reworked: new step for the header (Tour, Export, Import), notes on the sidebar and the spectrum strip, progress dots' },
      { de: 'Athena-Düngeschema: In Blüte 8 und 9 gibt es kein Bloom A/B mehr (nur PK, Fade, Cleanse) – Verbrauch und Kosten rechnen entsprechend', en: 'Athena feed schedule: no more Bloom A/B in flower weeks 8 and 9 (only PK, Fade, Cleanse) – usage and costs are calculated accordingly' },
      { de: 'Schriften werden mitgeliefert – die App sieht auch offline überall gleich aus; sichtbarer Tastatur-Fokus und weniger Animation bei „Bewegung reduzieren“', en: 'Fonts are bundled – the app looks the same everywhere, even offline; visible keyboard focus and less motion with “reduce motion”' },
      { de: 'Neue Versionsnummerierung ab 0.5.0 bis zur Version 1.0; frühere Entwicklungsstände (1.0–1.9) stehen in CHANGELOG.md', en: 'New version numbering from 0.5.0 up to version 1.0; earlier development builds (1.0–1.9) are listed in CHANGELOG.md' },
    ],
  },
];


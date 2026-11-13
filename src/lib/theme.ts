// Themes: alle Farben liegen als CSS-Variablen in src/themes.css. Ein Wechsel setzt nur
// data-theme am <html>-Element – die Oberfläche färbt sich sofort um, ohne Neustart.
// Die Auswahl wird pro Gerät gespeichert (nicht im Backup).
import { useSyncExternalStore } from 'react';
import { t } from '@/lib/i18n';

export type ThemeId =
  | 'nachtzelt' | 'gruenlicht' | 'natrium' | 'blurple' | 'oled'
  | 'catppuccin' | 'dracula' | 'tokyonight' | 'nord' | 'gruvbox' | 'rosepine';

export interface ThemeInfo {
  id: ThemeId;
  name: () => string;
  description: () => string;
  group: 'grow' | 'classic';
  preview: { bg: string; surface: string; raised: string; text: string; primary: string; accent: string; led: string; warning: string; spectrum: string[] };
}

export const THEMES: ThemeInfo[] = [
  {
    id: 'nachtzelt',
    name: () => t('Nachtzelt', 'Night tent'),
    description: () => t('Pflaumentöne und Blattgrün – der Standard', 'Plum tones and leaf green – the default'),
    group: 'grow',
    preview: { bg: '#0e0c12', surface: '#18151e', raised: '#2a2532', text: '#ddd8e4', primary: '#93dd53', accent: '#47d9ab', led: '#ad8cff', warning: '#fbbf24', spectrum: ['#7a4fe0', '#4f7dff', '#47d9ab', '#93dd53', '#f5b544', '#ff5d6c'] },
  },
  {
    id: 'gruenlicht',
    name: () => t('Grünlicht', 'Green light'),
    description: () => t('Sehr gedämpft, nur Grün – für die Dunkelphase am Zelt', 'Very dim, green only – for the dark period at the tent'),
    group: 'grow',
    preview: { bg: '#050806', surface: '#0b110c', raised: '#162018', text: '#9cbea1', primary: '#5fae5a', accent: '#4f9e86', led: '#7fb069', warning: '#b5a24a', spectrum: ['#1f5f2c', '#2f7a3a', '#3f9448', '#5fae5a', '#7fc06d', '#9fd282'] },
  },
  {
    id: 'natrium',
    name: () => t('Natriumdampf', 'Sodium (HPS)'),
    description: () => t('Warmes Bernstein wie eine NDL-Lampe', 'Warm amber like an HPS lamp'),
    group: 'grow',
    preview: { bg: '#0f0905', surface: '#181009', raised: '#2a1d12', text: '#e0c9a6', primary: '#ffa53a', accent: '#e8c55d', led: '#ff7a3d', warning: '#ffd166', spectrum: ['#7a2e0e', '#c24a14', '#ff7a3d', '#ffa53a', '#ffc95c', '#ffe7a3'] },
  },
  {
    id: 'blurple',
    name: () => t('Blurple', 'Blurple'),
    description: () => t('Violett und Magenta wie unter Rot-Blau-LEDs', 'Violet and magenta like under red/blue LEDs'),
    group: 'grow',
    preview: { bg: '#0b0712', surface: '#130c1e', raised: '#231734', text: '#d7c8ee', primary: '#f472d0', accent: '#7aa2ff', led: '#a77bff', warning: '#ffb86b', spectrum: ['#3b2bff', '#6a4dff', '#a77bff', '#d46cff', '#f472d0', '#ff4f8a'] },
  },
  {
    id: 'oled',
    name: () => t('OLED-Schwarz', 'OLED black'),
    description: () => t('Echtes Schwarz, hoher Kontrast, spart Akku', 'True black, high contrast, saves battery'),
    group: 'grow',
    preview: { bg: '#000000', surface: '#080808', raised: '#1a1a1a', text: '#d9d9d9', primary: '#93dd53', accent: '#47d9ab', led: '#ad8cff', warning: '#fbbf24', spectrum: ['#7a4fe0', '#4f7dff', '#47d9ab', '#93dd53', '#f5b544', '#ff5d6c'] },
  },
  {
    id: 'catppuccin',
    name: () => t('Catppuccin Mocha', 'Catppuccin Mocha'),
    description: () => t('Weiche Pastelltöne', 'Soft pastel tones'),
    group: 'classic',
    preview: { bg: '#11111b', surface: '#181825', raised: '#313244', text: '#bac2de', primary: '#a6e3a1', accent: '#94e2d5', led: '#cba6f7', warning: '#f9e2af', spectrum: ['#cba6f7', '#89b4fa', '#94e2d5', '#a6e3a1', '#f9e2af', '#f38ba8'] },
  },
  {
    id: 'dracula',
    name: () => t('Dracula', 'Dracula'),
    description: () => t('Violett, Pink und Cyan', 'Purple, pink and cyan'),
    group: 'classic',
    preview: { bg: '#191a21', surface: '#21222c', raised: '#343746', text: '#d6d9e6', primary: '#50fa7b', accent: '#8be9fd', led: '#bd93f9', warning: '#ffb86c', spectrum: ['#bd93f9', '#ff79c6', '#8be9fd', '#50fa7b', '#f1fa8c', '#ffb86c'] },
  },
  {
    id: 'tokyonight',
    name: () => t('Tokyo Night', 'Tokyo Night'),
    description: () => t('Nachtblau mit Neon-Akzenten', 'Night blue with neon accents'),
    group: 'classic',
    preview: { bg: '#13131a', surface: '#16161e', raised: '#24283b', text: '#b9c2ec', primary: '#7aa2f7', accent: '#9ece6a', led: '#bb9af7', warning: '#e0af68', spectrum: ['#bb9af7', '#7aa2f7', '#7dcfff', '#9ece6a', '#e0af68', '#f7768e'] },
  },
  {
    id: 'nord',
    name: () => t('Nord', 'Nord'),
    description: () => t('Kühles Polarblau, ruhig', 'Cool polar blue, calm'),
    group: 'classic',
    preview: { bg: '#20242c', surface: '#2a303b', raised: '#3b4252', text: '#d8dee9', primary: '#88c0d0', accent: '#a3be8c', led: '#b48ead', warning: '#ebcb8b', spectrum: ['#5e81ac', '#81a1c1', '#88c0d0', '#8fbcbb', '#a3be8c', '#ebcb8b'] },
  },
  {
    id: 'gruvbox',
    name: () => t('Gruvbox', 'Gruvbox'),
    description: () => t('Warm und retro, Ocker und Olive', 'Warm and retro, ochre and olive'),
    group: 'classic',
    preview: { bg: '#1d2021', surface: '#282828', raised: '#3c3836', text: '#d5c4a1', primary: '#b8bb26', accent: '#8ec07c', led: '#d3869b', warning: '#fabd2f', spectrum: ['#83a598', '#8ec07c', '#b8bb26', '#fabd2f', '#fe8019', '#fb4934'] },
  },
  {
    id: 'rosepine',
    name: () => t('Rosé Pine', 'Rosé Pine'),
    description: () => t('Gedämpftes Rosé und Gold', 'Muted rosé and gold'),
    group: 'classic',
    preview: { bg: '#12101b', surface: '#191724', raised: '#26233a', text: '#cfcce8', primary: '#ebbcba', accent: '#9ccfd8', led: '#c4a7e7', warning: '#f6c177', spectrum: ['#31748f', '#9ccfd8', '#c4a7e7', '#ebbcba', '#f6c177', '#eb6f92'] },
  },
];

const KEY = 'growhub:theme:v1';
const DEFAULT: ThemeId = 'nachtzelt';
const listeners = new Set<() => void>();

const isTheme = (v: unknown): v is ThemeId => typeof v === 'string' && THEMES.some((x) => x.id === v);

function read(): ThemeId {
  try {
    const v = localStorage.getItem(KEY);
    return isTheme(v) ? v : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

let current: ThemeId = read();

function apply(id: ThemeId) {
  const root = document.documentElement;
  root.setAttribute('data-theme', id);
  const info = THEMES.find((x) => x.id === id);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta && info) meta.setAttribute('content', info.preview.bg);
}

/** Beim Start vor dem ersten Rendern aufrufen (kein Aufblitzen des Standard-Themes). */
export function initTheme() {
  apply(current);
}

export function getTheme(): ThemeId {
  return current;
}

export function setTheme(id: ThemeId) {
  if (!isTheme(id)) return;
  current = id;
  try {
    localStorage.setItem(KEY, id);
  } catch {
    /* Speichern nicht möglich – Theme gilt trotzdem für diese Sitzung */
  }
  apply(id);
  listeners.forEach((l) => l());
}

export function useTheme(): ThemeId {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => current
  );
}

export function themeInfo(id: ThemeId): ThemeInfo {
  return THEMES.find((x) => x.id === id) ?? THEMES[0];
}

// PDF-Berichte (pro Grow und Gesamtübersicht) – rein clientseitig mit pdf-lib.
// Es werden nur Standard-Schriften verwendet; Sonderzeichen außerhalb von
// WinAnsi (Latin-1) werden ersetzt, damit nie ein Fehler beim Erzeugen auftritt.
import type { PDFDocument, PDFFont, PDFPage, RGB } from 'pdf-lib';
import type { NutrientBatch } from '@/types';
import type { Grow } from '@/types';
import { APP_VERSION } from '@/lib/appInfo';
import {
  currentPhase,
  describePhaseDuration,
  formatDate,
  milestoneProgressList,
  phaseProgress,
} from '@/lib/growLogic';
import {
  aggregate,
  categoryColor,
  categoryLabel,
  costByCategory,
  costsOf,
  formatGrams,
  formatMoney,
  growYear,
  plantsLabel,
  statsOf,
} from '@/lib/growStats';
import { computeUsage, formatMl, phaseLabel } from '@/lib/fertUsage';
import { t, locale, litersToDisplay, volumeUnit, fmtNum } from '@/lib/i18n';

type PdfLib = typeof import('pdf-lib');

/** Zeichenbefehle einer Seite – daraus entsteht neben dem PDF auch die Seitenvorschau. */
export type PreviewColor = [number, number, number];
export type PreviewOp =
  | { k: 'text'; text: string; x: number; y: number; size: number; bold: boolean; color: PreviewColor; width: number }
  | { k: 'rect'; x: number; y: number; w: number; h: number; fill?: PreviewColor; stroke?: PreviewColor; sw?: number }
  | { k: 'line'; x1: number; y1: number; x2: number; y2: number; th: number; color: PreviewColor }
  | { k: 'circle'; x: number; y: number; r: number; color: PreviewColor };
export interface PreviewPage {
  width: number;
  height: number;
  ops: PreviewOp[];
}

const rgbArr = (c: RGB | undefined): PreviewColor | undefined => (c ? [c.red, c.green, c.blue] : undefined);

/** Schreibt in die echte PDF-Seite und merkt sich jeden Befehl für die Vorschau. */
class PageRec {
  ops: PreviewOp[] = [];
  constructor(
    private real: PDFPage,
    private boldFont: PDFFont
  ) {}

  drawText(text: string, o: { x: number; y: number; size: number; font: PDFFont; color: RGB }) {
    this.real.drawText(text, o);
    this.ops.push({
      k: 'text',
      text,
      x: o.x,
      y: o.y,
      size: o.size,
      bold: o.font === this.boldFont,
      color: rgbArr(o.color) ?? [0, 0, 0],
      width: o.font.widthOfTextAtSize(text, o.size),
    });
  }

  drawRectangle(o: { x: number; y: number; width: number; height: number; color?: RGB; borderColor?: RGB; borderWidth?: number }) {
    this.real.drawRectangle(o);
    this.ops.push({ k: 'rect', x: o.x, y: o.y, w: o.width, h: o.height, fill: rgbArr(o.color), stroke: rgbArr(o.borderColor), sw: o.borderWidth });
  }

  drawLine(o: { start: { x: number; y: number }; end: { x: number; y: number }; thickness: number; color: RGB }) {
    this.real.drawLine(o);
    this.ops.push({ k: 'line', x1: o.start.x, y1: o.start.y, x2: o.end.x, y2: o.end.y, th: o.thickness, color: rgbArr(o.color) ?? [0, 0, 0] });
  }

  drawCircle(o: { x: number; y: number; size: number; color: RGB }) {
    this.real.drawCircle(o);
    this.ops.push({ k: 'circle', x: o.x, y: o.y, r: o.size, color: rgbArr(o.color) ?? [0, 0, 0] });
  }
}

export interface ReportResult {
  bytes: Uint8Array;
  filename: string;
  preview: PreviewPage[];
}

const A4_W = 595.28;
const A4_H = 841.89;
const MARGIN = 42;

const EXTRA_OK = new Set('€–—‘’‚“”„•…™‹›'.split(''));

/** Ersetzt Zeichen, die die Standard-Schrift nicht darstellen kann. */
export function safe(input: unknown): string {
  return String(input ?? '')
    .replace(/[\u202f\u2009\u2007]/g, ' ')
    .replace(/→/g, '->')
    .replace(/≈/g, '~')
    .replace(/[\r\n\t]+/g, ' ')
    .normalize('NFC')
    .split(/(?:)/u)
    .map((ch) => {
      const c = ch.codePointAt(0) ?? 63;
      if ((c >= 32 && c <= 126) || (c >= 160 && c <= 255) || EXTRA_OK.has(ch)) return ch;
      return '?';
    })
    .join('');
}

function hexToRgb(lib: PdfLib, hex: string): RGB {
  const h = /^#[0-9a-f]{6}$/i.test(hex) ? hex.slice(1) : '10b981';
  return lib.rgb(parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255);
}

interface TextOpts {
  size?: number;
  bold?: boolean;
  color?: RGB;
  x?: number;
  maxWidth?: number;
  gap?: number;
}

class Report {
  pdf!: PDFDocument;
  page!: PageRec;
  recs: PageRec[] = [];
  font!: PDFFont;
  bold!: PDFFont;
  y = 0;
  readonly contentW = A4_W - MARGIN * 2;
  private ink!: RGB;
  private muted!: RGB;
  private line!: RGB;
  private soft!: RGB;

  constructor(public lib: PdfLib, public title: string, public accent: string) {}

  async init() {
    const { PDFDocument, StandardFonts, rgb } = this.lib;
    this.pdf = await PDFDocument.create();
    this.font = await this.pdf.embedFont(StandardFonts.Helvetica);
    this.bold = await this.pdf.embedFont(StandardFonts.HelveticaBold);
    this.ink = rgb(0.1, 0.12, 0.16);
    this.muted = rgb(0.45, 0.5, 0.56);
    this.line = rgb(0.85, 0.87, 0.9);
    this.soft = rgb(0.95, 0.96, 0.97);
    this.pdf.setTitle(safe(this.title));
    this.pdf.setCreator('growmanager');
    this.pdf.setProducer(`growmanager ${APP_VERSION}`);
    this.newPage();
  }

  newPage() {
    this.page = new PageRec(this.pdf.addPage([A4_W, A4_H]), this.bold);
    this.recs.push(this.page);
    this.y = A4_H - MARGIN;
  }

  ensure(h: number) {
    if (this.y - h < MARGIN + 14) this.newPage();
  }

  wrap(text: string, size: number, bold: boolean, maxWidth: number): string[] {
    const f = bold ? this.bold : this.font;
    const out: string[] = [];
    for (const para of safe(text).split('\n')) {
      let cur = '';
      for (let word of para.split(' ')) {
        // sehr lange Wörter hart trennen
        while (f.widthOfTextAtSize(word, size) > maxWidth) {
          let cut = word.length - 1;
          while (cut > 1 && f.widthOfTextAtSize(word.slice(0, cut), size) > maxWidth) cut--;
          if (cur) {
            out.push(cur);
            cur = '';
          }
          out.push(word.slice(0, cut));
          word = word.slice(cut);
        }
        const test = cur ? `${cur} ${word}` : word;
        if (f.widthOfTextAtSize(test, size) <= maxWidth) cur = test;
        else {
          if (cur) out.push(cur);
          cur = word;
        }
      }
      out.push(cur);
    }
    return out.length ? out : [''];
  }

  /** Kürzt Text mit "..." auf eine maximale Breite. */
  fit(str: string, size: number, maxWidth: number): string {
    let v = safe(str);
    if (this.font.widthOfTextAtSize(v, size) <= maxWidth) return v;
    while (v.length > 1 && this.font.widthOfTextAtSize(v + '...', size) > maxWidth) v = v.slice(0, -1);
    return v + '...';
  }

  text(str: string, o: TextOpts = {}) {
    const size = o.size ?? 10;
    const lh = size * 1.3;
    const x = o.x ?? MARGIN;
    const lines = this.wrap(str, size, !!o.bold, o.maxWidth ?? this.contentW - (x - MARGIN));
    for (const ln of lines) {
      this.ensure(lh);
      this.page.drawText(ln, { x, y: this.y - size, size, font: o.bold ? this.bold : this.font, color: o.color ?? this.ink });
      this.y -= lh;
    }
    this.y -= o.gap ?? 0;
  }

  banner(title: string, subtitle: string, right: string) {
    const { rgb } = this.lib;
    const h = 78;
    this.page.drawRectangle({ x: 0, y: A4_H - h, width: A4_W, height: h, color: hexToRgb(this.lib, this.accent) });
    this.page.drawText(safe(title).slice(0, 60), { x: MARGIN, y: A4_H - 38, size: 22, font: this.bold, color: rgb(1, 1, 1) });
    this.page.drawText(safe(subtitle).slice(0, 90), { x: MARGIN, y: A4_H - 58, size: 10.5, font: this.font, color: rgb(1, 1, 1) });
    const rw = this.font.widthOfTextAtSize(safe(right), 9);
    this.page.drawText(safe(right), { x: A4_W - MARGIN - rw, y: A4_H - 30, size: 9, font: this.font, color: rgb(1, 1, 1) });
    this.y = A4_H - h - 22;
  }

  h2(title: string) {
    this.ensure(40);
    this.y -= 8;
    this.page.drawText(safe(title), { x: MARGIN, y: this.y - 12, size: 12.5, font: this.bold, color: this.ink });
    this.y -= 18;
    this.page.drawLine({
      start: { x: MARGIN, y: this.y },
      end: { x: A4_W - MARGIN, y: this.y },
      thickness: 1.2,
      color: hexToRgb(this.lib, this.accent),
    });
    this.y -= 10;
  }

  kvGrid(items: [string, string][], cols = 3) {
    const gap = 8;
    const w = (this.contentW - gap * (cols - 1)) / cols;
    const h = 38;
    for (let i = 0; i < items.length; i += cols) {
      this.ensure(h + gap);
      items.slice(i, i + cols).forEach(([label, value], j) => {
        const x = MARGIN + j * (w + gap);
        this.page.drawRectangle({ x, y: this.y - h, width: w, height: h, color: this.soft, borderColor: this.line, borderWidth: 0.6 });
        this.page.drawText(safe(label).slice(0, 34), { x: x + 8, y: this.y - 13, size: 7.5, font: this.font, color: this.muted });
        let v = safe(value);
        while (v.length > 1 && this.bold.widthOfTextAtSize(v, 12) > w - 16) v = v.slice(0, -1);
        this.page.drawText(v, { x: x + 8, y: this.y - 29, size: 12, font: this.bold, color: this.ink });
      });
      this.y -= h + gap;
    }
  }

  table(headers: string[], rows: string[][], widths: number[], align: ('l' | 'r' | 'c')[] = [], total?: string[]) {
    const size = 8.5;
    const pad = 4;
    const sum = widths.reduce((a, b) => a + b, 0);
    const colW = widths.map((w) => (w / sum) * this.contentW);
    const lh = size * 1.25;

    const drawRow = (cells: string[], opts: { head?: boolean; zebra?: boolean; bold?: boolean }) => {
      const wrapped = cells.map((c, i) => this.wrap(c, size, !!(opts.head || opts.bold), colW[i] - pad * 2));
      const h = Math.max(...wrapped.map((l) => l.length)) * lh + pad * 2 - 1;
      this.ensure(h);
      if (opts.head || opts.zebra) {
        this.page.drawRectangle({
          x: MARGIN,
          y: this.y - h,
          width: this.contentW,
          height: h,
          color: opts.head ? hexToRgb(this.lib, this.accent) : this.soft,
        });
      }
      let x = MARGIN;
      wrapped.forEach((lines, i) => {
        lines.forEach((ln, k) => {
          const f = opts.head || opts.bold ? this.bold : this.font;
          const tw = f.widthOfTextAtSize(ln, size);
          const a = align[i] ?? 'l';
          const tx = a === 'r' ? x + colW[i] - pad - tw : a === 'c' ? x + (colW[i] - tw) / 2 : x + pad;
          this.page.drawText(ln, {
            x: tx,
            y: this.y - pad - size - k * lh + 1.5,
            size,
            font: f,
            color: opts.head ? this.lib.rgb(1, 1, 1) : this.ink,
          });
        });
        x += colW[i];
      });
      this.y -= h;
    };

    const head = () => drawRow(headers, { head: true });
    this.ensure(40);
    head();
    rows.forEach((r, i) => {
      // Kopfzeile auf neuer Seite wiederholen
      if (this.y - 16 < MARGIN + 14) {
        this.newPage();
        head();
      }
      drawRow(r, { zebra: i % 2 === 1 });
    });
    if (total) drawRow(total, { bold: true });
    this.y -= 8;
  }

  bars(items: { label: string; value: number; color: string; text: string }[]) {
    const max = Math.max(1, ...items.map((i) => i.value));
    const labelW = 120;
    const valW = 80;
    const barW = this.contentW - labelW - valW;
    items.forEach((it) => {
      this.ensure(16);
      this.page.drawText(this.fit(it.label, 9, labelW - 8), { x: MARGIN, y: this.y - 10, size: 9, font: this.font, color: this.ink });
      this.page.drawRectangle({ x: MARGIN + labelW, y: this.y - 11, width: barW, height: 9, color: this.soft });
      this.page.drawRectangle({
        x: MARGIN + labelW,
        y: this.y - 11,
        width: Math.max(1, (it.value / max) * barW),
        height: 9,
        color: hexToRgb(this.lib, it.color),
      });
      const tw = this.font.widthOfTextAtSize(safe(it.text), 9);
      this.page.drawText(safe(it.text), { x: A4_W - MARGIN - tw, y: this.y - 10, size: 9, font: this.font, color: this.ink });
      this.y -= 16;
    });
    this.y -= 6;
  }

  /** Zwei Liniendiagramme nebeneinander. */
  chartRow(charts: { title: string; unit: string; points: { x: number; y: number }[]; color: string }[]) {
    const gap = 12;
    const w = (this.contentW - gap) / 2;
    const h = 96;
    this.ensure(h + 14);
    charts.forEach((c, idx) => {
      const x0 = MARGIN + idx * (w + gap);
      const top = this.y;
      this.page.drawRectangle({ x: x0, y: top - h, width: w, height: h, borderColor: this.line, borderWidth: 0.8, color: this.lib.rgb(1, 1, 1) });
      this.page.drawText(safe(`${c.title}${c.unit ? ` (${c.unit})` : ''}`), { x: x0 + 8, y: top - 13, size: 8.5, font: this.bold, color: this.ink });
      if (c.points.length < 2) {
        this.page.drawText(safe(t('zu wenig Daten', 'not enough data')), { x: x0 + 8, y: top - 48, size: 8, font: this.font, color: this.muted });
        return;
      }
      const xs = c.points.map((p) => p.x);
      const ys = c.points.map((p) => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      let minY = Math.min(...ys);
      let maxY = Math.max(...ys);
      if (maxY - minY < 1e-9) {
        minY -= 1;
        maxY += 1;
      }
      const padY = (maxY - minY) * 0.1;
      minY -= padY;
      maxY += padY;
      const px = x0 + 30;
      const pw = w - 40;
      const py = top - h + 20;
      const ph = h - 40;
      const X = (v: number) => px + (maxX === minX ? 0 : ((v - minX) / (maxX - minX)) * pw);
      const Y = (v: number) => py + ((v - minY) / (maxY - minY)) * ph;
      // Gitter + Achsenbeschriftung
      [minY, (minY + maxY) / 2, maxY].forEach((v) => {
        this.page.drawLine({ start: { x: px, y: Y(v) }, end: { x: px + pw, y: Y(v) }, thickness: 0.4, color: this.line });
        this.page.drawText(safe(fmtNum(v, 1)), { x: x0 + 4, y: Y(v) - 2.5, size: 6.5, font: this.font, color: this.muted });
      });
      const col = hexToRgb(this.lib, c.color);
      for (let i = 1; i < c.points.length; i++) {
        this.page.drawLine({
          start: { x: X(c.points[i - 1].x), y: Y(c.points[i - 1].y) },
          end: { x: X(c.points[i].x), y: Y(c.points[i].y) },
          thickness: 1.2,
          color: col,
        });
      }
      c.points.forEach((p) => this.page.drawCircle({ x: X(p.x), y: Y(p.y), size: 1.6, color: col }));
      const d1 = safe(new Date(minX).toLocaleDateString(locale(), { day: '2-digit', month: '2-digit' }));
      const d2 = safe(new Date(maxX).toLocaleDateString(locale(), { day: '2-digit', month: '2-digit' }));
      this.page.drawText(d1, { x: px, y: top - h + 7, size: 6.5, font: this.font, color: this.muted });
      this.page.drawText(d2, { x: px + pw - this.font.widthOfTextAtSize(d2, 6.5), y: top - h + 7, size: 6.5, font: this.font, color: this.muted });
    });
    this.y -= h + 12;
  }

  async finish(): Promise<{ bytes: Uint8Array; preview: PreviewPage[] }> {
    const total = this.recs.length;
    this.recs.forEach((p, i) => {
      p.drawLine({ start: { x: MARGIN, y: 30 }, end: { x: A4_W - MARGIN, y: 30 }, thickness: 0.5, color: this.line });
      p.drawText(safe(`growmanager v${APP_VERSION}  ·  ${this.title}`), { x: MARGIN, y: 18, size: 7.5, font: this.font, color: this.muted });
      const label = safe(`${t('Seite', 'Page')} ${i + 1} / ${total}`);
      p.drawText(label, { x: A4_W - MARGIN - this.font.widthOfTextAtSize(label, 7.5), y: 18, size: 7.5, font: this.font, color: this.muted });
    });
    const bytes = await this.pdf.save();
    return { bytes, preview: this.recs.map((p) => ({ width: A4_W, height: A4_H, ops: p.ops })) };
  }
}

function slug(s: string): string {
  const base = s
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return base || 'grow';
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function genLabel(): string {
  return `${t('Erstellt am', 'Created on')} ${formatDate(today())}`;
}

const days = (n: number | null | undefined) => (n === null || n === undefined ? '—' : `${n} ${t('T', 'd')}`);

function avg(values: (number | undefined)[]): number | undefined {
  const v = values.filter((x): x is number => typeof x === 'number' && Number.isFinite(x));
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : undefined;
}

// ---------------------------------------------------------------------------
// Bericht für einen einzelnen Grow
// ---------------------------------------------------------------------------
export async function buildGrowReport(
  grow: Grow,
  batches: NutrientBatch[] = [],
  allGrows: Grow[] = [grow],
  globalFertId?: string
): Promise<ReportResult> {
  const lib = await import('pdf-lib');
  const title = `${t('Grow-Bericht', 'Grow report')}: ${grow.name}`;
  const r = new Report(lib, title, grow.color);
  await r.init();

  const stats = statsOf(grow);
  const phase = currentPhase(grow);
  const progress = phaseProgress(grow);
  const m = grow.milestones;

  r.banner(grow.name, [grow.strain, plantsLabel(stats.plants), phase.label].filter(Boolean).join('  ·  '), genLabel());

  // Überblick
  r.h2(t('Überblick', 'Overview'));
  r.kvGrid([
    [t('Pflanzen', 'Plants'), String(stats.plants)],
    [t('Phase', 'Phase'), phase.label],
    [t('Fortschritt', 'Progress'), `${progress.percent} %`],
    [t('Start (Steckling)', 'Start (clone)'), formatDate(m.cloneStart)],
    [m.actualHarvest ? t('Tatsächliche Ernte', 'Actual harvest') : t('Geplante Ernte', 'Expected harvest'), formatDate(m.actualHarvest ?? m.expectedHarvest)],
    [t('Gesamtdauer', 'Total duration'), days(stats.days)],
    [t('Ertrag gesamt', 'Total yield'), formatGrams(stats.yieldG, 1)],
    [t('Ertrag / Pflanze', 'Yield / plant'), formatGrams(stats.yieldPerPlant, 1)],
    [t('Gesamtkosten', 'Total cost'), formatMoney(stats.cost)],
    [t('Kosten / Pflanze', 'Cost / plant'), formatMoney(stats.costPerPlant)],
    [t('Kosten / Gramm', 'Cost / gram'), formatMoney(stats.costPerGram)],
    [t('Journal-Einträge', 'Journal entries'), String(grow.logs.length)],
  ]);

  // Meilensteine
  r.h2(t('Meilensteine', 'Milestones'));
  r.table(
    [t('Meilenstein', 'Milestone'), t('Datum', 'Date'), t('Status', 'Status')],
    milestoneProgressList(grow).map((x) => [
      x.label,
      formatDate(x.date),
      !x.date ? t('nicht gesetzt', 'not set') : x.done ? t('erreicht', 'reached') : t('geplant', 'planned'),
    ]),
    [3, 2, 2]
  );
  const durations = describePhaseDuration(grow);
  if (durations.length) {
    r.text(durations.map((d) => `${d.label}: ${d.value}`).join('   |   '), { size: 8.5, color: r.lib.rgb(0.45, 0.5, 0.56), gap: 4 });
  }

  // Trocknung
  const dr = grow.drying;
  if (dr && Object.keys(dr).length) {
    r.h2(t('Trocknung & Ernte', 'Drying & harvest'));
    const items: [string, string][] = [];
    if (dr.harvestAmount !== undefined) items.push([t('Erntemenge', 'Harvest amount'), formatGrams(dr.harvestAmount, 1)]);
    if (dr.daysDried !== undefined) items.push([t('Trocknungsdauer', 'Drying time'), days(dr.daysDried)]);
    if (dr.tempMin !== undefined || dr.tempMax !== undefined) {
      items.push([t('Temperatur', 'Temperature'), `${dr.tempMin ?? '?'} - ${dr.tempMax ?? '?'} °C`]);
    }
    if (dr.humidity !== undefined) items.push([t('Luftfeuchtigkeit', 'Humidity'), `${dr.humidity} %`]);
    if (items.length) r.kvGrid(items);
    if (dr.notes) r.text(`${t('Notizen', 'Notes')}: ${dr.notes}`, { size: 9, gap: 4 });
  }

  // Kosten
  const costs = costsOf(grow);
  r.h2(t('Kosten', 'Costs'));
  if (!costs.length) {
    r.text(t('Keine Kosten erfasst.', 'No costs recorded.'), { size: 9, color: r.lib.rgb(0.45, 0.5, 0.56), gap: 4 });
  } else {
    r.bars(costByCategory([grow]).map((b) => ({ label: categoryLabel(b.key), value: b.amount, color: categoryColor(b.key), text: formatMoney(b.amount) })));
    const sorted = [...costs].sort((a, b) => ((a.date ?? '') < (b.date ?? '') ? -1 : 1));
    r.table(
      [t('Datum', 'Date'), t('Kategorie', 'Category'), t('Beschreibung', 'Description'), t('Betrag', 'Amount')],
      sorted.map((c) => [c.date ? formatDate(c.date) : '—', categoryLabel(c.category), c.label ?? '', formatMoney(c.amount)]),
      [2, 2.5, 4, 2],
      ['l', 'l', 'l', 'r'],
      ['', '', t('Summe', 'Total'), formatMoney(stats.cost)]
    );
  }

  // Nährlösung & Düngerverbrauch (nach Phase)
  const usage = computeUsage(batches, allGrows, globalFertId, grow.id);
  if (usage.batchCount > 0) {
    r.h2(t('Nährlösung & Düngerverbrauch', 'Nutrient solution & fertilizer usage'));
    const totalMl = usage.groups.reduce((s2, g) => s2 + g.totalMl, 0);
    const lit = (l: number) => `${fmtNum(litersToDisplay(l) ?? 0, 1)} ${volumeUnit()}`;
    r.kvGrid(
      [
        [t('Nährlösung gesamt', 'Solution total'), lit(usage.liters)],
        [t('Ansätze', 'Batches'), String(usage.batchCount)],
        [t('Dünger gesamt', 'Fertilizer total'), totalMl > 0 ? formatMl(totalMl) : '—'],
        [t('Dünger / Schema', 'Fertilizer / schedule'), usage.groups.map((g) => g.schedule.brand).join(', ') || '—'],
        [t('Nährlösung / Pflanze', 'Solution / plant'), `${fmtNum((litersToDisplay(usage.liters) ?? 0) / stats.plants, 1)} ${volumeUnit()}`],
      ],
      3
    );
    for (const g of usage.groups) {
      const stages = g.phases.map((p) => p.stage);
      r.table(
        [t('Produkt', 'Product'), ...g.phases.map((p) => `${phaseLabel(p.stage)} (${lit(p.liters)})`), t('Gesamt', 'Total')],
        [
          ...g.rows.map((row) => [
            row.product.label,
            ...stages.map((st) => (row.byStage[st] ? `${row.estimated ? '~ ' : ''}${formatMl(row.byStage[st] as number)}` : '—')),
            row.total > 0 ? `${row.estimated ? '~ ' : ''}${formatMl(row.total)}` : t('nach Bedarf', 'as needed'),
          ]),
        ],
        [2.2, ...stages.map(() => 2), 1.8],
        ['l', ...stages.map(() => 'r' as const), 'r'],
        [t('Summe', 'Total'), ...stages.map((st) => (g.stageTotals[st] ? formatMl(g.stageTotals[st] as number) : '—')), formatMl(g.totalMl)]
      );
    }
    r.text(
      t(
        'Berechnet aus den Richtwerten des Düngeschemas. ~ = Bereichswerte (Mittelwert); „nach Bedarf“-Produkte sind nicht eingerechnet.',
        'Calculated from the schedule’s guideline values. ~ = ranges (average); “as needed” products are not included.'
      ),
      { size: 8, color: r.lib.rgb(0.45, 0.5, 0.56), gap: 4 }
    );
    r.table(
      [t('Datum', 'Date'), t('Menge', 'Amount'), t('Schema-Woche', 'Schedule week')],
      usage.all.map((u) => [
        formatDate(u.batch.date),
        lit(u.batch.liters),
        u.weekIndex !== null ? `${u.weekLabel} (${u.weekAuto ? t('automatisch', 'auto') : t('manuell', 'manual')})` : '—',
      ]),
      [2, 2, 3]
    );
  }

  // Tagebuch
  const logs = [...grow.logs].sort((a, b) => (a.date < b.date ? -1 : 1));
  r.h2(t('Tagebuch', 'Journal'));
  if (!logs.length) {
    r.text(t('Keine Tagebucheinträge vorhanden.', 'No journal entries.'), { size: 9, color: r.lib.rgb(0.45, 0.5, 0.56), gap: 4 });
  } else {
    const water = logs.reduce((s, l) => s + (l.watering ?? 0), 0);
    const f = (n: number | undefined, d = 1) => (n === undefined ? '—' : fmtNum(n, d));
    r.kvGrid(
      [
        [t('Ø pH', 'Avg pH'), f(avg(logs.map((l) => l.ph)), 2)],
        [t('Ø EC', 'Avg EC'), f(avg(logs.map((l) => l.ec)), 2)],
        [t('Ø Temperatur', 'Avg temperature'), `${f(avg(logs.map((l) => l.temp)))} °C`],
        [t('Ø Luftfeuchtigkeit', 'Avg humidity'), `${f(avg(logs.map((l) => l.humidity)), 0)} %`],
        [t('Gießmenge gesamt', 'Total watering'), `${fmtNum(litersToDisplay(water) ?? 0, 1)} ${volumeUnit()}`],
        [t('Einträge mit Dünger', 'Entries with nutrients'), String(logs.filter((l) => l.nutrientsAdded).length)],
      ],
      3
    );
    const series = (pick: (l: (typeof logs)[number]) => number | undefined) =>
      logs.filter((l) => typeof pick(l) === 'number').map((l) => ({ x: new Date(l.date + 'T00:00:00').getTime(), y: pick(l) as number }));
    r.chartRow([
      { title: 'pH', unit: '', points: series((l) => l.ph), color: '#10b981' },
      { title: 'EC', unit: 'mS/cm', points: series((l) => l.ec), color: '#f59e0b' },
    ]);
    r.chartRow([
      { title: t('Temperatur', 'Temperature'), unit: '°C', points: series((l) => l.temp), color: '#ef4444' },
      { title: t('Luftfeuchtigkeit', 'Humidity'), unit: '%', points: series((l) => l.humidity), color: '#3b82f6' },
    ]);
    r.table(
      [t('Datum', 'Date'), 'pH', 'EC', '°C', '% RH', volumeUnit(), t('Dünger', 'Nutr.'), t('Notiz', 'Note')],
      logs.map((l) => [
        formatDate(l.date),
        l.ph !== undefined ? fmtNum(l.ph, 2) : '',
        l.ec !== undefined ? fmtNum(l.ec, 2) : '',
        l.temp !== undefined ? fmtNum(l.temp, 1) : '',
        l.humidity !== undefined ? fmtNum(l.humidity, 0) : '',
        l.watering !== undefined ? fmtNum(litersToDisplay(l.watering) ?? 0, 1) : '',
        l.nutrientsAdded ? t('ja', 'yes') : '',
        l.note ?? '',
      ]),
      [2.4, 1, 1, 1, 1, 1.1, 1.2, 5],
      ['l', 'r', 'r', 'r', 'r', 'r', 'c', 'l']
    );
  }

  const out = await r.finish();
  return { ...out, filename: `growmanager-${t('bericht', 'report')}-${slug(grow.name)}-${today()}.pdf` };
}

// ---------------------------------------------------------------------------
// Gesamtübersicht (alle Grows bzw. ein Jahr)
// ---------------------------------------------------------------------------
export async function buildOverviewReport(grows: Grow[], yearLabel: string): Promise<ReportResult> {
  const lib = await import('pdf-lib');
  const title = `${t('Übersicht', 'Overview')} ${yearLabel}`;
  const r = new Report(lib, title, '#10b981');
  await r.init();

  const agg = aggregate(grows);
  r.banner(t('Übersicht: Kosten & Ertrag', 'Overview: costs & yield'), `${yearLabel}  ·  ${agg.grows} Grows`, genLabel());

  r.h2(t('Zusammenfassung', 'Summary'));
  r.kvGrid([
    ['Grows', String(agg.grows)],
    [t('Pflanzen gesamt', 'Total plants'), String(agg.plants)],
    [t('Grows mit Ertrag', 'Grows with yield'), String(agg.harvested)],
    [t('Ertrag gesamt', 'Total yield'), formatGrams(agg.yieldG, 1)],
    [t('Ø Ertrag / Pflanze', 'Avg yield / plant'), formatGrams(agg.yieldPerPlant, 1)],
    [t('Gesamtkosten', 'Total cost'), formatMoney(agg.cost)],
    [t('Kosten / Gramm', 'Cost / gram'), formatMoney(agg.costPerGram)],
  ]);

  r.h2(t('Grows im Vergleich', 'Grows compared'));
  const sorted = [...grows].sort((a, b) => (a.milestones.cloneStart ?? a.createdAt) < (b.milestones.cloneStart ?? b.createdAt) ? 1 : -1);
  r.table(
    [t('Grow', 'Grow'), t('Jahr', 'Year'), t('Pfl.', 'Pl.'), t('Dauer', 'Days'), t('Ertrag', 'Yield'), 'g / ' + t('Pfl.', 'pl.'), t('Kosten', 'Cost'), '€ / g'],
    sorted.map((g) => {
      const s = statsOf(g);
      return [
        g.name,
        String(growYear(g)),
        String(s.plants),
        s.days !== null ? String(s.days) : '—',
        formatGrams(s.yieldG, 1),
        formatGrams(s.yieldPerPlant, 1),
        formatMoney(s.cost || undefined),
        formatMoney(s.costPerGram),
      ];
    }),
    [4, 1.1, 0.9, 1.1, 1.8, 1.8, 2, 1.6],
    ['l', 'l', 'r', 'r', 'r', 'r', 'r', 'r'],
    [t('Summe', 'Total'), '', String(agg.plants), '', formatGrams(agg.yieldG, 1), formatGrams(agg.yieldPerPlant, 1), formatMoney(agg.cost), formatMoney(agg.costPerGram)]
  );

  const yielded = sorted.filter((g) => statsOf(g).yieldG !== undefined);
  if (yielded.length) {
    r.h2(t('Ertrag pro Grow', 'Yield per grow'));
    r.bars(yielded.map((g) => ({ label: g.name, value: statsOf(g).yieldG ?? 0, color: g.color, text: formatGrams(statsOf(g).yieldG, 1) })));
  }

  const cats = costByCategory(grows);
  if (cats.length) {
    r.h2(t('Kosten nach Kategorie', 'Costs by category'));
    r.bars(cats.map((c) => ({ label: categoryLabel(c.key), value: c.amount, color: categoryColor(c.key), text: formatMoney(c.amount) })));
  }

  const out = await r.finish();
  return { ...out, filename: `growmanager-${t('uebersicht', 'overview')}-${slug(yearLabel)}-${today()}.pdf` };
}

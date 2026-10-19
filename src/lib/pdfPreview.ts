// Zeichnet die Zeichenbefehle einer PDF-Seite auf ein Canvas (Seitenvorschau).
// Funktioniert in jedem Browser/WebView, auch dort, wo kein PDF-Viewer eingebaut ist.
import type { PreviewColor, PreviewPage } from '@/lib/pdfReport';

const css = (c: PreviewColor) => `rgb(${Math.round(c[0] * 255)}, ${Math.round(c[1] * 255)}, ${Math.round(c[2] * 255)})`;
const FONT = 'Helvetica, Arial, "Liberation Sans", "Nimbus Sans", sans-serif';

export function drawPreviewPage(canvas: HTMLCanvasElement, page: PreviewPage, scale: number): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  canvas.width = Math.round(page.width * scale);
  canvas.height = Math.round(page.height * scale);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const H = page.height;

  for (const op of page.ops) {
    switch (op.k) {
      case 'rect': {
        const x = op.x * scale;
        const y = (H - op.y - op.h) * scale;
        if (op.fill) {
          ctx.fillStyle = css(op.fill);
          ctx.fillRect(x, y, op.w * scale, op.h * scale);
        }
        if (op.stroke) {
          ctx.strokeStyle = css(op.stroke);
          ctx.lineWidth = Math.max(0.5, (op.sw ?? 1) * scale);
          ctx.strokeRect(x, y, op.w * scale, op.h * scale);
        }
        break;
      }
      case 'line':
        ctx.strokeStyle = css(op.color);
        ctx.lineWidth = Math.max(0.5, op.th * scale);
        ctx.beginPath();
        ctx.moveTo(op.x1 * scale, (H - op.y1) * scale);
        ctx.lineTo(op.x2 * scale, (H - op.y2) * scale);
        ctx.stroke();
        break;
      case 'circle':
        ctx.fillStyle = css(op.color);
        ctx.beginPath();
        ctx.arc(op.x * scale, (H - op.y) * scale, op.r * scale, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'text': {
        ctx.font = `${op.bold ? 'bold ' : ''}${op.size * scale}px ${FONT}`;
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = css(op.color);
        // Breite an die PDF-Schrift (Helvetica) angleichen, damit Umbrüche exakt passen
        const w = ctx.measureText(op.text).width;
        const sx = w > 0 ? Math.min(1.4, Math.max(0.6, (op.width * scale) / w)) : 1;
        ctx.save();
        ctx.translate(op.x * scale, (H - op.y) * scale);
        ctx.scale(sx, 1);
        ctx.fillText(op.text, 0, 0);
        ctx.restore();
        break;
      }
    }
  }
}

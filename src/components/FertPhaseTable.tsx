import type { ScheduleUsage } from '@/lib/fertUsage';
import { formatMl, phaseLabel } from '@/lib/fertUsage';
import { fmtNum, litersToDisplay, t, volumeUnit } from '@/lib/i18n';

interface Props {
  usage: ScheduleUsage;
  plants?: number;
}

const liters = (l: number) => `${fmtNum(litersToDisplay(l) ?? 0, 1)} ${volumeUnit()}`;

/** Verbrauch je Produkt, aufgeteilt nach Phase (Wachstum / Blüte / …). */
export default function FertPhaseTable({ usage, plants }: Props) {
  const stages = usage.phases.map((p) => p.stage);
  return (
    <div className="rounded-2xl border border-ink-800 bg-ink-850/40 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" data-testid="fert-table">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-ink-500 border-b border-ink-800 align-bottom">
              <th className="px-4 py-2.5 text-left font-semibold">{t('Produkt', 'Product')}</th>
              {usage.phases.map((p) => (
                <th key={p.stage} className="px-3 py-2.5 text-right font-semibold whitespace-nowrap" data-testid={`fert-head-${p.stage}`}>
                  {phaseLabel(p.stage)}
                  <div className="text-[10px] font-normal normal-case text-ink-600 tabular-nums">
                    {liters(p.liters)} · {p.batches} {p.batches === 1 ? t('Ansatz', 'batch') : t('Ansätze', 'batches')}
                  </div>
                </th>
              ))}
              <th className="px-4 py-2.5 text-right font-semibold">{t('Gesamt', 'Total')}</th>
              {plants !== undefined && <th className="px-4 py-2.5 text-right font-semibold hidden sm:table-cell">{t('pro Pflanze', 'per plant')}</th>}
            </tr>
          </thead>
          <tbody>
            {usage.rows.map((r) => (
              <tr key={r.product.key} className="border-b border-ink-850 last:border-0" data-testid="fert-row">
                <td className="px-4 py-2.5 whitespace-nowrap">
                  <span className="inline-flex items-center gap-2.5">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: r.product.color }} />
                    <span className="text-ink-100">{r.product.label}</span>
                  </span>
                </td>
                {stages.map((s) => (
                  <td key={s} className="px-3 py-2.5 text-right tabular-nums text-ink-200 whitespace-nowrap" data-testid={`fert-cell-${r.product.key}-${s}`}>
                    {r.byStage[s] ? `${r.estimated ? '~ ' : ''}${formatMl(r.byStage[s] as number)}` : <span className="text-ink-700">—</span>}
                  </td>
                ))}
                <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-ink-100 whitespace-nowrap" data-testid={`fert-ml-${r.product.key}`}>
                  {r.total > 0 ? (
                    <>
                      {r.estimated && <span className="text-ink-500 font-normal">~ </span>}
                      {formatMl(r.total)}
                    </>
                  ) : (
                    <span className="text-ink-500 font-normal text-xs">{t('nach Bedarf', 'as needed')}</span>
                  )}
                </td>
                {plants !== undefined && (
                  <td className="px-4 py-2.5 text-right tabular-nums text-ink-300 hidden sm:table-cell whitespace-nowrap">
                    {r.total > 0 ? formatMl(r.total / plants) : '—'}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-ink-850/60 text-ink-100 font-semibold">
              <td className="px-4 py-2.5">{t('Summe', 'Total')}</td>
              {stages.map((s) => (
                <td key={s} className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap" data-testid={`fert-sum-${s}`}>
                  {usage.stageTotals[s] ? formatMl(usage.stageTotals[s] as number) : '—'}
                </td>
              ))}
              <td className="px-4 py-2.5 text-right tabular-nums whitespace-nowrap" data-testid="fert-sum-total">{formatMl(usage.totalMl)}</td>
              {plants !== undefined && <td className="px-4 py-2.5 text-right tabular-nums hidden sm:table-cell whitespace-nowrap">{formatMl(usage.totalMl / plants)}</td>}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { ShoppingCart, ExternalLink, Sprout, Info } from 'lucide-react';
import { openExternal } from '@/lib/openExternal';
import { t } from '@/lib/i18n';

export const CLONE_SHOPS = [
  {
    id: 'floweryfield',
    name: 'Flowery Field',
    url: 'https://www.floweryfield.com/shop/',
    text: () => t('Online-Shop von Flowery Field – Stecklinge und Zubehör.', 'Flowery Field online shop – clones and supplies.'),
  },
  {
    id: 'growroom21',
    name: 'Growroom21',
    url: 'https://www.growroom21.com/webshop/de/premium-us-stecklinge-cali-genetik',
    text: () => t('Growroom21 – Premium US-Stecklinge (Cali-Genetik).', 'Growroom21 – premium US clones (Cali genetics).'),
  },
] as const;

/** Reiter „Steckling bestellen“: Links öffnen im Standardbrowser des Rechners. */
export default function OrderClonesPanel() {
  const [opened, setOpened] = useState<string | null>(null);
  return (
    <div className="space-y-6" data-testid="order-panel">
      <div>
        <h2 className="gm-title flex items-center gap-2">
          <ShoppingCart size={18} className="text-primary-400" />
          {t('Steckling bestellen', 'Order clones')}
        </h2>
        <p className="text-sm text-ink-500 mt-0.5">
          {t(
            'Ein Klick öffnet den Shop in deinem Standardbrowser. Die Bestellung läuft direkt beim Shop – der Grow Manager speichert oder überträgt dabei nichts.',
            'One click opens the shop in your default browser. You order directly from the shop – Grow Manager does not store or send anything.'
          )}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {CLONE_SHOPS.map((s) => (
          <button
            key={s.id}
            type="button"
            data-testid={`shop-${s.id}`}
            onClick={async () => {
              await openExternal(s.url);
              setOpened(s.id);
            }}
            className="group text-left rounded-2xl border border-ink-800 bg-ink-900/60 p-5 hover:border-primary-500/50 hover:bg-ink-900 transition-colors"
          >
            <div className="flex items-start gap-3.5">
              <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-primary-500/10 border border-primary-500/25 text-primary-400 shrink-0">
                <Sprout size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold text-white">{s.name}</span>
                  <ExternalLink size={14} className="text-ink-500 group-hover:text-primary-300" />
                </div>
                <p className="text-sm text-ink-400 mt-1">{s.text()}</p>
                <p className="text-[11px] text-ink-600 mt-2 break-all">{s.url}</p>
                {opened === s.id && (
                  <p className="text-xs text-accent-300 mt-2">{t('Im Browser geöffnet.', 'Opened in your browser.')}</p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="rounded-xl bg-ink-850/60 border border-ink-800 px-4 py-3.5 flex items-start gap-2.5">
        <Info size={15} className="text-ink-500 mt-0.5 shrink-0" />
        <p className="text-xs text-ink-400 leading-relaxed">
          {t(
            'Bitte beachte die in deinem Land geltenden Gesetze zum Anbau und Kauf. Preise, Verfügbarkeit und Versand regelt der jeweilige Shop.',
            'Please follow the laws that apply in your country for growing and buying. Prices, availability and shipping are handled by each shop.'
          )}
        </p>
      </div>
    </div>
  );
}

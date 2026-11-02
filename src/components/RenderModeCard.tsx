import { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';
import { getRenderMode, isLinuxDesktop, setRenderMode, type RenderMode } from '@/lib/desktop';
import { t } from '@/lib/i18n';

/**
 * Darstellung (nur Desktop-App unter Linux): Grafikbeschleunigung für flüssigeres Scrollen.
 * Startet die App danach nicht richtig (z. B. graues Fenster), schaltet sie beim nächsten Start
 * automatisch in den sicheren Modus zurück.
 */
export default function RenderModeCard() {
  const [mode, setMode] = useState<RenderMode | null>(null);
  const [pending, setPending] = useState<'gpu' | 'safe' | null>(null);
  const linux = isLinuxDesktop();

  useEffect(() => {
    if (!linux) return;
    void getRenderMode().then(setMode);
  }, [linux]);

  if (!linux || mode === null) return null;
  const wanted = pending ?? (mode === 'gpu' ? 'gpu' : 'safe');

  const choose = async (m: 'gpu' | 'safe') => {
    if (await setRenderMode(m)) setPending(m);
  };

  return (
    <div className="rounded-2xl border border-ink-800 bg-ink-900/60 p-5" data-testid="render-mode-card">
      <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
        <Zap size={16} className="text-warning-400" />
        {t('Darstellung (flüssiges Scrollen)', 'Display (smooth scrolling)')}
      </h3>
      <p className="text-xs text-ink-500 mb-4 leading-relaxed">
        {t(
          'Mit Grafikbeschleunigung scrollt die App deutlich flüssiger. Auf manchen Linux-Systemen bleibt das Fenster damit grau – dann schaltet die App beim nächsten Start automatisch zurück in den sicheren Modus. Die Änderung wirkt nach einem Neustart der App.',
          'With hardware acceleration the app scrolls much more smoothly. On some Linux systems the window stays grey with it – the app then switches back to safe mode automatically on the next start. The change takes effect after restarting the app.'
        )}
      </p>
      <div className="grid sm:grid-cols-2 gap-2">
        {(['gpu', 'safe'] as const).map((m) => (
          <button
            key={m}
            type="button"
            data-testid={`render-${m}`}
            onClick={() => void choose(m)}
            className={`text-left rounded-xl border px-3 py-2.5 transition-colors ${
              wanted === m ? 'border-primary-500/60 bg-primary-500/10' : 'border-ink-700/70 bg-ink-850 hover:bg-ink-800'
            }`}
          >
            <div className={`text-sm font-semibold ${wanted === m ? 'text-primary-300' : 'text-ink-200'}`}>
              {m === 'gpu' ? t('Grafikbeschleunigung (empfohlen)', 'Hardware acceleration (recommended)') : t('Sicherer Modus', 'Safe mode')}
            </div>
            <div className="text-[11px] text-ink-500 mt-0.5">
              {m === 'gpu' ? t('Flüssiges Scrollen', 'Smooth scrolling') : t('Ohne Beschleunigung – falls das Fenster grau bleibt', 'Without acceleration – if the window stays grey')}
            </div>
          </button>
        ))}
      </div>
      <p className="text-xs mt-3 text-ink-400">
        {t('Aktuell aktiv', 'Currently active')}:{' '}
        <span className="font-semibold text-ink-200">
          {mode === 'gpu' ? t('Grafikbeschleunigung', 'Hardware acceleration') : t('Sicherer Modus', 'Safe mode')}
        </span>
        {mode === 'fallback' && (
          <span className="block text-warning-300 mt-1">
            {t('Die Grafikbeschleunigung hat beim letzten Start nicht funktioniert – die App läuft wieder im sicheren Modus.', 'Hardware acceleration did not work at the last start – the app is running in safe mode again.')}
          </span>
        )}
        {pending && pending !== (mode === 'gpu' ? 'gpu' : 'safe') && (
          <span className="block text-accent-300 mt-1">{t('Wird beim nächsten Start der App übernommen.', 'Will be applied the next time the app starts.')}</span>
        )}
      </p>
    </div>
  );
}

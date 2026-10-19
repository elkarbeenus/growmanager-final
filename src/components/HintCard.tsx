import { Lightbulb, X } from 'lucide-react';
import { dismissHint, useHintDismissed } from '@/lib/hints';
import { t } from '@/lib/i18n';

interface Props {
  id: string;
  title: string;
  children: React.ReactNode;
}

/** Kleine Hinweis-Karte, die der Nutzer dauerhaft ausblenden kann. */
export default function HintCard({ id, title, children }: Props) {
  const dismissed = useHintDismissed(id);
  if (dismissed) return null;
  return (
    <div className="rounded-2xl border border-primary-500/25 bg-primary-500/5 px-4 py-3.5 flex gap-3 animate-fade-in" data-testid={`hint-${id}`}>
      <div className="h-8 w-8 rounded-lg bg-primary-500/10 border border-primary-500/20 flex items-center justify-center shrink-0 text-primary-300">
        <Lightbulb size={15} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-primary-200">{title}</div>
        <div className="text-xs text-ink-300 mt-1 leading-relaxed">{children}</div>
        <button
          type="button"
          data-testid={`hint-dismiss-${id}`}
          onClick={() => dismissHint(id)}
          className="mt-2.5 text-xs font-medium text-primary-300 hover:text-primary-200 underline underline-offset-2"
        >
          {t('Verstanden – nicht mehr anzeigen', 'Got it – don’t show again')}
        </button>
      </div>
      <button
        type="button"
        onClick={() => dismissHint(id)}
        className="h-7 w-7 rounded-lg flex items-center justify-center text-ink-500 hover:text-white hover:bg-ink-800 shrink-0"
        aria-label={t('Ausblenden', 'Hide')}
      >
        <X size={14} />
      </button>
    </div>
  );
}

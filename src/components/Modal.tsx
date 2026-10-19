import { useEffect } from 'react';
import { X } from 'lucide-react';
import { t } from '@/lib/i18n';


interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
}

export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  icon,
  children,
  maxWidth = 'max-w-lg',
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div
        className={`relative w-full ${maxWidth} bg-ink-900 border border-ink-700/60 shadow-2xl rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-hidden flex flex-col animate-slide-up`}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-ink-800">
          <div className="flex items-start gap-3">
            {icon && (
              <div className="mt-0.5 h-10 w-10 rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-400 flex items-center justify-center shrink-0">
                {icon}
              </div>
            )}
            <div>
              <h2 className="text-lg font-semibold text-white tracking-tight">{title}</h2>
              {subtitle && (
                <p className="text-sm text-ink-400 mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-lg flex items-center justify-center text-ink-400 hover:text-white hover:bg-ink-800 transition-colors"
            aria-label={t('Schließen', 'Close')}
          >
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto scrollbar-thin px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

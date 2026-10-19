import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import { t } from '@/lib/i18n';


interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = t('Bestätigen', 'Confirm'),
  cancelLabel = t('Abbrechen', 'Cancel'),
  destructive,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      icon={<AlertTriangle size={18} />}
      maxWidth="max-w-sm"
    >
      <p className="text-sm text-ink-300 leading-relaxed">{message}</p>
      <div className="flex gap-3 mt-5">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-ink-300 bg-ink-800 hover:bg-ink-700 transition-colors"
        >
          {cancelLabel}
        </button>
        <button
          onClick={onConfirm}
          className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            destructive
              ? 'text-white bg-error-500 hover:bg-error-400'
              : 'text-ink-950 bg-primary-500 hover:bg-primary-400'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

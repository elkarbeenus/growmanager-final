import DatePicker from './DatePicker';
import { t } from '@/lib/i18n';


interface DateFieldProps {
  label: string;
  hint?: string;
  value?: string;
  onChange: (value: string | undefined) => void;
  accentColor?: string;
}

export default function DateField({
  label,
  hint,
  value,
  onChange,
  accentColor = '#10b981',
}: DateFieldProps) {
  return (
    <label className="block">
      <span className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-sm font-medium text-ink-200">{label}</span>
        {value && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="text-[11px] text-ink-500 hover:text-error-400 transition-colors"
          >
            {t('löschen', 'clear')}
          </button>
        )}
      </span>
      <DatePicker value={value} onChange={onChange} accentColor={accentColor} />
      {hint && <span className="block text-xs text-ink-500 mt-1">{hint}</span>}
    </label>
  );
}

import { useState } from 'react';
import { FlaskConical, Plus, Trash2, Droplets, StickyNote } from 'lucide-react';
import type { Grow, NutrientBatch } from '@/types';
import DateField from './DateField';
import ConfirmDialog from './ConfirmDialog';
import { batchState, daysBetweenLocal, localToday, RENEW_AFTER_DAYS, MAX_AGE_DAYS } from '@/lib/nutrientLogic';
import { formatDate } from '@/lib/growLogic';
import { getFertilizers } from '@/lib/fertilizerData';
import { useSelectedFertilizer } from '@/lib/fertilizerSelection';
import { autoWeekIndex, inferGrowForDate, scheduleById } from '@/lib/fertUsage';
import FertOverviewCard from './FertOverviewCard';
import HintCard from './HintCard';
import DarkSelect from './DarkSelect';
import { t, displayToLiters, litersToDisplay, volumeUnit, fmtNum } from '@/lib/i18n';

interface Props {
  batches: NutrientBatch[];
  grows?: Grow[];
  onChange: (batches: NutrientBatch[]) => void;
}

const inputCls =
  'w-full bg-ink-850 border border-ink-700/70 rounded-xl px-3 py-2.5 text-sm text-ink-100 placeholder-ink-600 focus:outline-none focus:border-primary-500/60 focus:ring-2 focus:ring-primary-500/20 transition-all';

export default function NutrientPanel({ batches, grows = [], onChange }: Props) {
  const [date, setDate] = useState<string | undefined>(localToday());
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [toDelete, setToDelete] = useState<NutrientBatch | null>(null);

  // Zuordnung zu einem Grow (optional – sonst automatisch über das Datum) und Schema-Woche
  const globalFert = useSelectedFertilizer();
  const [growId, setGrowId] = useState<string>('');
  const [weekChoice, setWeekChoice] = useState<string>('auto');
  const schedules = getFertilizers();
  const selectedGrow = growId ? grows.find((g) => g.id === growId) ?? null : date ? inferGrowForDate(date, grows) : null;
  const selectedSchedule = scheduleById(selectedGrow?.fertilizerId ?? globalFert, schedules);
  const autoIdx = selectedGrow && selectedSchedule && date ? autoWeekIndex(selectedGrow, selectedSchedule, date) : null;

  const state = batchState(batches);
  const sorted = [...batches].sort((a, b) =>
    a.date === b.date ? b.createdAt.localeCompare(a.createdAt) : b.date.localeCompare(a.date)
  );

  const amountNum = Number(amount.replace(',', '.'));
  const canSave = !!date && amount.trim() !== '' && Number.isFinite(amountNum) && amountNum > 0;

  const add = () => {
    if (!canSave || !date) return;
    const liters = displayToLiters(amountNum) ?? amountNum;
    const entry: NutrientBatch = {
      id: crypto.randomUUID(),
      date,
      liters,
      note: note.trim() || undefined,
      growId: growId || undefined,
      weekIndex: selectedSchedule && weekChoice !== 'auto' ? Number(weekChoice) : undefined,
      createdAt: new Date().toISOString(),
    };
    onChange([entry, ...batches]);
    setAmount('');
    setNote('');
    setWeekChoice('auto');
    setDate(localToday());
  };

  const assignGrow = (id: string, newGrowId: string) => {
    onChange(batches.map((b) => (b.id === id ? { ...b, growId: newGrowId || undefined, weekIndex: undefined } : b)));
  };

  const assignWeek = (id: string, value: string) => {
    onChange(batches.map((b) => (b.id === id ? { ...b, weekIndex: value === '' ? undefined : Number(value) } : b)));
  };

  const pct = state.batch ? Math.min(100, ((state.day - 1) / RENEW_AFTER_DAYS) * 100) : 0;
  const needsRenew = state.status === 'renew' || state.status === 'expired';
  const barColor = needsRenew ? 'bg-error-500' : state.status === 'soon' ? 'bg-warning-500' : 'bg-primary-500';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <FlaskConical size={18} className="text-primary-400" />
          {t('Nährlösung', 'Nutrient solution')}
        </h2>
        <p className="text-sm text-ink-500 mt-0.5">
          {t(
            `Trage ein, wann und wie viel Nährlösung du angemischt hast. Mineralische Nährlösung ist max. ${MAX_AGE_DAYS} Tage verwendbar – nach ${RENEW_AFTER_DAYS} Tagen erscheint die Erinnerung zum Erneuern.`,
            `Log when and how much nutrient solution you mixed. Mineral solution lasts max. ${MAX_AGE_DAYS} days – after ${RENEW_AFTER_DAYS} days you get a reminder to renew it.`
          )}
        </p>
      </div>

      {/* Status */}
      <div className="rounded-2xl border border-ink-800 bg-ink-900/60 p-5">
        {state.batch ? (
          <>
            <div className="flex items-end justify-between gap-3 flex-wrap">
              <div>
                <div className="text-xs uppercase tracking-widest text-ink-500">{t('Aktueller Ansatz', 'Current batch')}</div>
                <div className={`text-2xl font-bold mt-1 ${needsRenew ? 'text-error-300' : 'text-white'}`} data-testid="nutrient-status">
                  {needsRenew
                    ? t('Nährlösung erneuern!', 'Renew nutrient solution!')
                    : t(`Tag ${state.day} von ${RENEW_AFTER_DAYS}`, `Day ${state.day} of ${RENEW_AFTER_DAYS}`)}
                </div>
                <div className="text-sm text-ink-400 mt-1">
                  {formatDate(state.batch.date)} · {fmtNum(litersToDisplay(state.batch.liters) ?? 0, 2)} {volumeUnit()}
                  {!needsRenew && (
                    <> · {t(`noch ${state.daysLeft} ${state.daysLeft === 1 ? 'Tag' : 'Tage'} bis neu anmischen`, `${state.daysLeft} ${state.daysLeft === 1 ? 'day' : 'days'} until remix`)}</>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-4 h-2 rounded-full bg-ink-800 overflow-hidden">
              <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${needsRenew ? 100 : pct}%` }} />
            </div>
          </>
        ) : (
          <p className="text-sm text-ink-400">
            {t('Noch kein Ansatz eingetragen. Lege unten deinen ersten an – dann startet der Timer.', 'No batch logged yet. Add your first one below – the timer starts then.')}
          </p>
        )}
      </div>

      <HintCard id="nutrient-v1" title={t('So funktioniert der Dünger-Verbrauch', 'How the fertilizer usage works')}>
        {t(
          '1) Im Reiter „Dünger“ deinen Dünger wählen (z. B. Athena). 2) Unten jeden angemischten Ansatz mit Datum und Liter eintragen – er wird automatisch dem Grow zugeordnet, der an diesem Datum lief. 3) Hier siehst du den Verbrauch in mL je Produkt und Phase (Wachstum / Blüte). Dieselbe Auswertung pro Grow steht im Grow unter „Nährlösung & Dünger-Verbrauch“.',
          '1) Choose your fertilizer in the “Nutrients” tab (e.g. Athena). 2) Below, log every mixed batch with date and liters – it is assigned automatically to the grow that was running on that date. 3) Here you see the usage in mL per product and phase (veg / flower). The same analysis per grow is in the grow under “Nutrient solution & fertilizer usage”.'
        )}
      </HintCard>

      {/* Dünger-Verbrauch nach Phase */}
      <FertOverviewCard batches={batches} grows={grows} />

      {/* Neuer Ansatz */}
      <div className="rounded-2xl border border-ink-800 bg-ink-900/60 p-5 space-y-4">
        <h3 className="text-base font-semibold text-white">{t('Neu angemischt', 'Newly mixed')}</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <DateField label={t('Datum des Anmischens', 'Date mixed')} value={date} onChange={setDate} />
          <label className="block">
            <span className="text-sm font-medium text-ink-200 flex items-center gap-1.5 mb-1.5">
              <Droplets size={14} className="text-primary-400" />
              {t('Menge', 'Amount')} <span className="text-ink-600 font-normal">· {volumeUnit()}</span>
            </span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step={0.5}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={t('z.B. 20', 'e.g. 5')}
              data-testid="nutrient-amount"
              className={inputCls}
            />
          </label>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {grows.length > 0 && (
            <div className="block">
              <span className="text-sm font-medium text-ink-200 mb-1.5 block">
                {t('Für Grow', 'For grow')} <span className="text-ink-600 font-normal">(optional)</span>
              </span>
              <DarkSelect
                testid="nutrient-grow"
                value={growId}
                onChange={(v) => {
                  setGrowId(v);
                  setWeekChoice('auto');
                }}
                options={[
                  { value: '', label: `${t('Automatisch nach Datum', 'Automatic by date')}${!growId && selectedGrow ? ` (${selectedGrow.name})` : ''}` },
                  ...grows.map((g) => ({ value: g.id, label: g.name })),
                ]}
              />
            </div>
          )}
          {selectedSchedule && (
            <div className="block">
              <span className="text-sm font-medium text-ink-200 mb-1.5 block">
                {t('Schema-Woche', 'Schedule week')} <span className="text-ink-600 font-normal">· {selectedSchedule.brand}</span>
              </span>
              <DarkSelect
                testid="nutrient-week"
                value={weekChoice}
                onChange={setWeekChoice}
                options={[
                  { value: 'auto', label: `${t('Automatisch', 'Automatic')} (${autoIdx !== null ? selectedSchedule.weeks[autoIdx].label : '—'})` },
                  ...selectedSchedule.weeks.map((w, i) => ({ value: String(i), label: w.label })),
                ]}
              />
            </div>
          )}
        </div>
        <label className="block">
          <span className="text-xs font-medium text-ink-400 mb-1.5 flex items-center gap-1.5">
            <StickyNote size={14} className="text-primary-400" />
            {t('Notiz', 'Note')} <span className="text-ink-600 font-normal">(optional)</span>
          </span>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('z.B. EC 1.4, pH 5.9, Blüte-Schema Woche 3', 'e.g. EC 1.4, pH 5.9, bloom week 3')}
            className={inputCls}
          />
        </label>
        <button
          type="button"
          onClick={add}
          disabled={!canSave}
          data-testid="nutrient-add"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-ink-950 bg-primary-500 hover:bg-primary-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-glow"
        >
          <Plus size={17} />
          {t('Ansatz speichern', 'Save batch')}
        </button>
      </div>

      {/* Verlauf */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-ink-500 mb-3">{t('Verlauf', 'History')}</h3>
        {sorted.length === 0 ? (
          <p className="text-sm text-ink-600">{t('Noch keine Einträge.', 'No entries yet.')}</p>
        ) : (
          <ul className="space-y-2">
            {sorted.map((b, i) => (
              <li key={b.id} className="flex items-center gap-3 rounded-xl border border-ink-800 bg-ink-900/40 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-ink-100">
                    {formatDate(b.date)} · {fmtNum(litersToDisplay(b.liters) ?? 0, 2)} {volumeUnit()}
                    {i === 0 && (
                      <span className="ml-2 text-[10px] uppercase tracking-wide text-primary-300 bg-primary-500/10 border border-primary-500/20 rounded px-1.5 py-0.5">
                        {t('aktuell', 'current')}
                      </span>
                    )}
                  </div>
                  {b.note && <div className="text-xs text-ink-500 mt-0.5 truncate">{b.note}</div>}
                  <BatchAssign
                    batch={b}
                    grows={grows}
                    globalFert={globalFert}
                    schedules={schedules}
                    onGrow={(v) => assignGrow(b.id, v)}
                    onWeek={(v) => assignWeek(b.id, v)}
                  />
                  {i > 0 && sorted[i - 1] && (
                    <div className="text-[11px] text-ink-600 mt-0.5">
                      {t(
                        `${daysBetweenLocal(b.date, sorted[i - 1].date)} Tage bis zum nächsten Ansatz`,
                        `${daysBetweenLocal(b.date, sorted[i - 1].date)} days until next batch`
                      )}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setToDelete(b)}
                  title={t('Löschen', 'Delete')}
                  className="p-2 rounded-lg text-ink-500 hover:text-error-400 hover:bg-ink-800 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={!!toDelete}
        title={t('Eintrag löschen?', 'Delete entry?')}
        message={t('Dieser Nährlösungs-Eintrag wird entfernt.', 'This nutrient solution entry will be removed.')}
        confirmLabel={t('Löschen', 'Delete')}
        cancelLabel={t('Abbrechen', 'Cancel')}
        destructive
        onConfirm={() => {
          if (toDelete) onChange(batches.filter((b) => b.id !== toDelete.id));
          setToDelete(null);
        }}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}

function BatchAssign({
  batch,
  grows,
  globalFert,
  schedules,
  onGrow,
  onWeek,
}: {
  batch: NutrientBatch;
  grows: Grow[];
  globalFert: string;
  schedules: ReturnType<typeof getFertilizers>;
  onGrow: (v: string) => void;
  onWeek: (v: string) => void;
}) {
  const explicit = grows.find((g) => g.id === batch.growId) ?? null;
  const inferred = explicit ? null : inferGrowForDate(batch.date, grows);
  const grow = explicit ?? inferred;
  const schedule = scheduleById(grow?.fertilizerId ?? globalFert, schedules);
  const autoIdx = grow && schedule ? autoWeekIndex(grow, schedule, batch.date) : null;
  if (grows.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-1.5">
      <DarkSelect
        size="sm"
        testid="batch-grow"
        title={t('Diesem Grow zuordnen', 'Assign to grow')}
        value={explicit ? explicit.id : ''}
        onChange={onGrow}
        options={[
          { value: '', label: inferred ? `${t('Automatisch', 'Automatic')}: ${inferred.name}` : t('— kein Grow —', '— no grow —') },
          ...grows.map((g) => ({ value: g.id, label: g.name })),
        ]}
      />
      {schedule && (
        <DarkSelect
          size="sm"
          testid="batch-week"
          title={t('Schema-Woche', 'Schedule week')}
          value={batch.weekIndex !== undefined && batch.weekIndex < schedule.weeks.length ? String(batch.weekIndex) : ''}
          onChange={onWeek}
          options={[
            { value: '', label: `${t('Woche automatisch', 'Week automatic')} (${autoIdx !== null ? schedule.weeks[autoIdx].label : '—'})` },
            ...schedule.weeks.map((w, i) => ({ value: String(i), label: w.label })),
          ]}
        />
      )}
    </div>
  );
}

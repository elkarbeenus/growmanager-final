import { useState } from 'react';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Sprout,
  CalendarDays,
  Hourglass,
  Target,
} from 'lucide-react';
import type { AppSettings, Grow, LogEntry, Milestones, DryingData, CostEntry, NutrientBatch } from '@/types';
import {
  currentPhase,
  phaseProgress,
  daysSince,
  daysUntil,
  milestoneProgressList,
  growStartDate,
  formatDate,
} from '@/lib/growLogic';
import { t } from '@/lib/i18n';
import Timeline from './Timeline';
import MilestonesPanel from './MilestonesPanel';
import Journal from './Journal';
import DryingPanel from './DryingPanel';
import LogEntryModal from './LogEntryModal';
import CostsPanel from './CostsPanel';
import FertUsagePanel from './FertUsagePanel';
import PdfExportButton from './PdfExportButton';
import { buildGrowReport } from '@/lib/pdfReport';
import { getSelectedFertilizer } from '@/lib/fertilizerSelection';
import HintCard from './HintCard';
import { plantsOf, plantsLabel } from '@/lib/growStats';

interface GrowDetailProps {
  grow: Grow;
  allGrows: Grow[];
  settings: AppSettings | undefined;
  onOpenSettings: () => void;
  fertPrices: Record<string, number> | undefined;
  onFertPricesChange: (prices: Record<string, number> | undefined) => void;
  batches: NutrientBatch[];
  onBack: () => void;
  onUpdateGrow: (grow: Grow) => void;
  onEditGrow: () => void;
  onDeleteGrow: () => void;
}

export default function GrowDetail({
  grow,
  allGrows,
  settings,
  onOpenSettings,
  fertPrices,
  onFertPricesChange,
  batches,
  onBack,
  onUpdateGrow,
  onEditGrow,
  onDeleteGrow,
}: GrowDetailProps) {
  const phase = currentPhase(grow);
  const progress = phaseProgress(grow);
  const elapsed = daysSince(growStartDate(grow));
  const remaining = daysUntil(grow.milestones.expectedHarvest);
  const milestones = milestoneProgressList(grow);

  const [logModalOpen, setLogModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<LogEntry | undefined>(undefined);

  const saveMilestones = (m: Milestones) => {
    onUpdateGrow({ ...grow, milestones: m });
  };

  const saveDrying = (drying: DryingData | undefined) => {
    onUpdateGrow({ ...grow, drying });
  };

  const saveCosts = (costs: CostEntry[] | undefined) => {
    onUpdateGrow({ ...grow, costs });
  };

  const addLog = (entry: Omit<LogEntry, 'id'>) => {
    const newEntry: LogEntry = { ...entry, id: crypto.randomUUID() };
    onUpdateGrow({ ...grow, logs: [...grow.logs, newEntry] });
    setLogModalOpen(false);
  };

  const updateLog = (entry: Omit<LogEntry, 'id'>) => {
    if (!editingLog) return;
    onUpdateGrow({
      ...grow,
      logs: grow.logs.map((l) => (l.id === editingLog.id ? { ...entry, id: editingLog.id } : l)),
    });
    setEditingLog(undefined);
    setLogModalOpen(false);
  };

  const deleteLog = (id: string) => {
    onUpdateGrow({ ...grow, logs: grow.logs.filter((l) => l.id !== id) });
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="self-start flex items-center gap-1.5 text-sm text-ink-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          {t('Alle Grows', 'All grows')}
        </button>
        <div className="flex-1 flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3.5">
            <div
              className="h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 border"
              style={{
                backgroundColor: `${grow.color}1a`,
                borderColor: `${grow.color}44`,
                color: grow.color,
              }}
            >
              <Sprout size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {grow.name}
              </h1>
              <p className="text-sm text-ink-400 mt-0.5">
                {grow.strain && <>{grow.strain} · </>}
                <span data-testid="detail-plants">{plantsLabel(plantsOf(grow))}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <PdfExportButton
              testid="grow-pdf"
              label={t('PDF-Bericht', 'PDF report')}
              title={t('Bericht dieses Grows als PDF speichern', 'Save a report of this grow as PDF')}
              build={() => buildGrowReport(grow, batches, allGrows, getSelectedFertilizer(), fertPrices, settings)}
            />
            <button
              onClick={onEditGrow}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-ink-300 bg-ink-800 hover:bg-ink-700 transition-colors"
            >
              <Pencil size={14} />
              <span className="hidden sm:inline">{t('Bearbeiten', 'Edit')}</span>
            </button>
            <button
              onClick={onDeleteGrow}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-error-300 bg-error-500/10 hover:bg-error-500/20 border border-error-500/20 transition-colors"
            >
              <Trash2 size={14} />
              <span className="hidden sm:inline">{t('Löschen', 'Delete')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Phase banner + progress */}
      <div className="rounded-3xl border border-ink-800 bg-ink-900/60 p-5 sm:p-6 mb-5 overflow-hidden relative">
        <div
          className="absolute -top-20 -right-20 h-48 w-48 rounded-full blur-3xl opacity-30"
          style={{ backgroundColor: grow.color }}
        />
        <div className="relative flex flex-col lg:flex-row gap-6 lg:items-center lg:justify-between">
          <div className="space-y-3 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border"
                style={{
                  color: grow.color,
                  backgroundColor: `${grow.color}14`,
                  borderColor: `${grow.color}33`,
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full animate-pulse-soft"
                  style={{ backgroundColor: grow.color }}
                />
                {phase.label}
              </span>
              <span className="text-xs text-ink-500">{phase.description}</span>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-ink-400 font-medium">{t('Gesamtfortschritt', 'Overall progress')}</span>
                <span className="text-ink-200 tabular-nums">
                  {progress.completed}/{progress.total} {t('Meilensteine', 'milestones')} · {progress.percent}%
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-ink-850 border border-ink-800 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${progress.percent}%`,
                    background: `linear-gradient(90deg, ${grow.color}, ${grow.color}cc)`,
                    boxShadow: `0 0 12px ${grow.color}66`,
                  }}
                />
              </div>
            </div>

            {/* Milestone pills */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {milestones.map((m) => (
                <span
                  key={m.key}
                  className={`text-[11px] px-2 py-1 rounded-md border ${
                    m.done
                      ? 'text-primary-300 bg-primary-500/10 border-primary-500/30'
                      : m.inFuture
                      ? 'text-ink-400 bg-ink-850 border-ink-700'
                      : 'text-ink-600 bg-ink-900 border-ink-800'
                  }`}
                  title={m.date ? formatDate(m.date) : t('Nicht gesetzt', 'Not set')}
                >
                  {m.label}
                </span>
              ))}
            </div>
          </div>

          {/* Big stat tiles */}
          <div className="grid grid-cols-3 gap-2.5 lg:gap-3 lg:w-[380px]">
            <StatTile
              icon={<CalendarDays size={16} />}
              label={t('Seit Start', 'Since start')}
              value={elapsed !== null ? `${elapsed}` : '—'}
              unit={t('Tage', 'days')}
            />
            <StatTile
              icon={<Hourglass size={16} />}
              label={t('Bis Ernte', 'To harvest')}
              value={remaining !== null ? `${remaining}` : '—'}
              unit={t('Tage', 'days')}
              tone={remaining !== null && remaining <= 14 ? 'warning' : undefined}
            />
            <StatTile
              icon={<Target size={16} />}
              label={t('Fortschritt', 'Progress')}
              value={`${progress.percent}`}
              unit="%"
            />
          </div>
        </div>
      </div>

      {/* Schnellsprung + Hinweis */}
      <div className="mb-5 space-y-3">
        <HintCard id="grow-detail-v1" title={t('So findest du alles in diesem Grow', 'Finding your way around this grow')}>
          {t(
            'Die Pflanzenanzahl stellst du ganz oben im Bereich „Meilensteine“ ein. Weiter unten findest du Tagebuch, Trocknung & Ernte, Nährlösung & Dünger-Verbrauch sowie Kosten & Ertrag. Der Button „PDF-Bericht“ oben rechts zeigt dir den Bericht erst in einer Vorschau. Mit den Chips hier springst du direkt zu jedem Bereich.',
            'You set the number of plants at the top of the “Milestones” section. Further down you will find the journal, drying & harvest, nutrient solution & fertilizer usage and costs & yield. The “PDF report” button at the top right shows the report in a preview first. Use the chips here to jump straight to any section.'
          )}
        </HintCard>
        <nav className="flex flex-wrap gap-2" data-testid="jump-bar" aria-label={t('Schnellsprung', 'Quick jump')}>
          {[
            ['sec-milestones', t('Meilensteine & Pflanzen', 'Milestones & plants')],
            ['sec-journal', t('Tagebuch', 'Journal')],
            ['sec-drying', t('Trocknung & Ernte', 'Drying & harvest')],
            ['sec-fert', t('Dünger-Verbrauch', 'Fertilizer usage')],
            ['sec-costs', t('Kosten & Ertrag', 'Costs & yield')],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              data-testid={`jump-${id}`}
              onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="px-3 py-1.5 rounded-full text-xs font-medium text-ink-300 bg-ink-900/60 hover:text-white hover:bg-ink-800 border border-ink-800 transition-colors"
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Timeline */}
      <div className="rounded-3xl border border-ink-800 bg-ink-900/60 p-5 sm:p-6 mb-5">
        <h3 className="text-base font-semibold text-white mb-4">{t('Phasen-Zeitleiste', 'Phase timeline')}</h3>
        <Timeline grow={grow} />
      </div>

      {/* Milestones + calculations */}
      <div id="sec-milestones" className="scroll-mt-36 rounded-3xl border border-ink-800 bg-ink-900/60 p-5 sm:p-6 mb-5">
        <MilestonesPanel
          grow={grow}
          onChange={saveMilestones}
          onPlantCountChange={(n) => onUpdateGrow({ ...grow, plantCount: n })}
        />
      </div>

      {/* Journal */}
      <div id="sec-journal" className="scroll-mt-36 rounded-3xl border border-ink-800 bg-ink-900/60 p-5 sm:p-6 mb-5">
        <Journal
          grow={grow}
          onAdd={() => {
            setEditingLog(undefined);
            setLogModalOpen(true);
          }}
          onEdit={(entry) => {
            setEditingLog(entry);
            setLogModalOpen(true);
          }}
          onDelete={deleteLog}
        />
      </div>

      {/* Trocknung */}
      <div id="sec-drying" className="scroll-mt-36 rounded-3xl border border-ink-800 bg-ink-900/60 p-5 sm:p-6 mb-5">
        <DryingPanel grow={grow} onChange={saveDrying} />
      </div>

      {/* Nährlösung & Dünger-Verbrauch */}
      <div id="sec-fert" className="scroll-mt-36 rounded-3xl border border-ink-800 bg-ink-900/60 p-5 sm:p-6 mb-5">
        <FertUsagePanel
          grow={grow}
          allGrows={allGrows}
          batches={batches}
          onFertilizerChange={(id) => onUpdateGrow({ ...grow, fertilizerId: id })}
        />
      </div>

      {/* Kosten & Ertrag */}
      <div id="sec-costs" className="scroll-mt-36 rounded-3xl border border-ink-800 bg-ink-900/60 p-5 sm:p-6">
        <CostsPanel
          grow={grow}
          allGrows={allGrows}
          batches={batches}
          fertPrices={fertPrices}
          onFertPricesChange={onFertPricesChange}
          onToggleAuto={(enabled) => onUpdateGrow({ ...grow, fertCostAuto: enabled ? undefined : false })}
          settings={settings}
          onOpenSettings={onOpenSettings}
          onToggleAutoPower={(enabled) => onUpdateGrow({ ...grow, powerCostAuto: enabled ? undefined : false })}
          onLampChange={(lampId, count) => onUpdateGrow({ ...grow, lampId, lampCount: lampId ? count : undefined })}
          onDevicesChange={(ids) => onUpdateGrow({ ...grow, deviceIds: ids.length ? ids : undefined })}
          onChange={saveCosts}
        />
      </div>

      <LogEntryModal
        open={logModalOpen}
        onClose={() => {
          setLogModalOpen(false);
          setEditingLog(undefined);
        }}
        onSubmit={editingLog ? updateLog : addLog}
        initial={editingLog}
      />
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
  unit,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  tone?: 'warning';
}) {
  return (
    <div
      className={`rounded-2xl border p-3.5 text-center ${
        tone === 'warning'
          ? 'bg-warning-500/10 border-warning-500/30'
          : 'bg-ink-850/60 border-ink-800'
      }`}
    >
      <div
        className={`mx-auto h-8 w-8 rounded-lg flex items-center justify-center mb-2 ${
          tone === 'warning'
            ? 'text-warning-400 bg-warning-500/10'
            : 'text-primary-400 bg-primary-500/10'
        }`}
      >
        {icon}
      </div>
      <div className={`text-2xl font-bold tabular-nums ${tone === 'warning' ? 'text-warning-200' : 'text-white'}`}>
        {value}
      </div>
      <div className="text-[11px] uppercase tracking-wide text-ink-500 mt-0.5">
        {label} · {unit}
      </div>
    </div>
  );
}



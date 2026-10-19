import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Sprout,
  Plus,
  Download,
  Upload,
  Leaf,
  Flower2,
  FlaskConical,
  Database,
  ChevronDown,
  ChevronRight,
  Droplets,
  Calculator,
  Hourglass,
  Info,
  Archive,
} from 'lucide-react';
import type { AppData, Grow, NutrientBatch } from '@/types';
import {
  loadData,
  saveData,
  exportDataAsJSON,
  importDataFromJSON,
  createAutoBackupIfDue,
  createSafetyBackup,
  clearAllBackups,
  clearBackupLog,
  emptyData,
} from '@/lib/storage';
import { currentPhase, isPlanned, earliestDate } from '@/lib/growLogic';
import { plantsOf } from '@/lib/growStats';
import GrowCard from '@/components/GrowCard';
import GrowFormModal from '@/components/GrowFormModal';
import GrowDetail from '@/components/GrowDetail';
import ConfirmDialog from '@/components/ConfirmDialog';
import FertilizerSchema from '@/components/FertilizerSchema';
import BackupPanel from '@/components/BackupPanel';
import NutrientPanel from '@/components/NutrientPanel';
import NutrientBanner from '@/components/NutrientBanner';
import ShotSizeCalculator from '@/components/ShotSizeCalculator';
import AboutPanel from '@/components/AboutPanel';
import OverviewPanel from '@/components/OverviewPanel';
import GuidedTour from '@/components/GuidedTour';
import ImportSummaryModal from '@/components/ImportSummaryModal';
import { diffData, type ImportSummary } from '@/lib/importDiff';
import { saveBackupAs } from '@/lib/backupExport';
import ResetDialog from '@/components/ResetDialog';
import { resetHints, setTourSeen } from '@/lib/hints';
import { resetSelectedFertilizer } from '@/lib/fertilizerSelection';
import { isTourSeen } from '@/lib/hints';
import VersionBadge from '@/components/VersionBadge';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { t, useLang } from '@/lib/i18n';

type Tab = 'grows' | 'overview' | 'nutrient' | 'athena' | 'shotsize' | 'backup' | 'about';

const nGrows = (n: number) => `${n} ${n === 1 ? 'Grow' : 'Grows'}`;
const nBatches = (n: number) => `${n} ${n === 1 ? t('Ansatz', 'batch') : t('Ansätze', 'batches')}`;
const nEntries = (n: number) => `${n} ${n === 1 ? t('Eintrag', 'entry') : t('Einträge', 'entries')}`;

export default function App() {
  const [data, setData] = useState<AppData>(() => loadData());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingGrow, setEditingGrow] = useState<Grow | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Grow | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('grows');
  const [importSummary, setImportSummary] = useState<{ summary: ImportSummary; kind: 'import' | 'restore'; safety: boolean } | null>(null);
  const [pendingImport, setPendingImport] = useState<AppData | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [toast, setToast] = useState<{ ok: boolean; message: string } | null>(null);
  const [tourOpen, setTourOpen] = useState<boolean>(() => !isTourSeen());
  const fileInputRef = useRef<HTMLInputElement>(null);
  useLang(); // bei Sprachwechsel die gesamte Oberfläche neu rendern

  useEffect(() => {
    saveData(data);
  }, [data]);

  // Täglicher Auto-Backup beim Laden / beim Datenwechsel prüfen
  useEffect(() => {
    createAutoBackupIfDue(data);
  }, [data]);

  const selectedGrow = useMemo(
    () => data.grows.find((g) => g.id === selectedId) ?? null,
    [data.grows, selectedId]
  );

  const harvestedGrows = data.grows.filter((g) => currentPhase(g).key === 'harvested');
  // Geplante Grows (Start in der Zukunft) werden separat geführt und nicht als aktiv gezählt
  const plannedGrows = data.grows
    .filter((g) => !harvestedGrows.includes(g) && isPlanned(g))
    .sort((a, b) => earliestDate(a).localeCompare(earliestDate(b)));
  const activeGrows = data.grows.filter((g) => !harvestedGrows.includes(g) && !plannedGrows.includes(g));

  const openCreate = () => {
    setEditingGrow(null);
    setFormOpen(true);
  };

  const openEdit = (grow: Grow) => {
    setEditingGrow(grow);
    setFormOpen(true);
  };

  const submitForm = (input: { name: string; strain: string; color: string; plantCount: number }) => {
    if (editingGrow) {
      setData((d) => ({
        ...d,
        grows: d.grows.map((g) =>
          g.id === editingGrow.id
            ? { ...g, name: input.name, strain: input.strain, color: input.color, plantCount: input.plantCount }
            : g
        ),
      }));
    } else {
      const newGrow: Grow = {
        id: crypto.randomUUID(),
        name: input.name,
        strain: input.strain,
        color: input.color,
        plantCount: input.plantCount,
        milestones: {},
        logs: [],
        createdAt: new Date().toISOString(),
      };
      setData((d) => ({ ...d, grows: [newGrow, ...d.grows] }));
      setSelectedId(newGrow.id);
    }
    setFormOpen(false);
    setEditingGrow(null);
  };

  const requestDelete = (grow: Grow) => setConfirmDelete(grow);

  const confirmDeleteGrow = () => {
    if (!confirmDelete) return;
    setData((d) => ({
      ...d,
      grows: d.grows.filter((g) => g.id !== confirmDelete.id),
      // Ansätze des gelöschten Grows bleiben erhalten, werden aber keinem Grow mehr zugeordnet
      batches: (d.batches ?? []).map((b) => (b.growId === confirmDelete.id ? { ...b, growId: undefined, weekIndex: undefined } : b)),
    }));
    if (selectedId === confirmDelete.id) setSelectedId(null);
    setConfirmDelete(null);
  };

  const updateGrow = (updated: Grow) => {
    setData((d) => ({
      ...d,
      grows: d.grows.map((g) => (g.id === updated.id ? updated : g)),
    }));
  };

  // Export über "Speichern unter …" (funktioniert auch in der Desktop-App, wo ein normaler Download nicht möglich ist)
  const handleExport = async () => {
    const r = await saveBackupAs(data);
    if (r.ok) {
      setToast({
        ok: true,
        message: r.location
          ? t(`Backup gespeichert unter: ${r.location}`, `Backup saved to: ${r.location}`)
          : r.method === 'download'
            ? t(`Backup „${r.filename}“ heruntergeladen (Download-Ordner).`, `Backup “${r.filename}” downloaded (download folder).`)
            : t(`Backup „${r.filename}“ gespeichert.`, `Backup “${r.filename}” saved.`),
      });
    } else if (!r.cancelled) {
      setToast({ ok: false, message: r.message });
    }
  };

  const handleImportClick = () => {
    setImportError(null);
    fileInputRef.current?.click();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const imported = await importDataFromJSON(file);
      // Erst nachfragen: Ein Import überschreibt alle aktuellen Daten
      setPendingImport(imported);
      setImportError(null);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : t('Backup-Datei konnte nicht gelesen werden.', 'Backup file could not be read.'));
    }
  };

  const handleRestoreFromBackup = (restored: AppData, kind: 'import' | 'restore' = 'restore') => {
    // Vorher die aktuellen Daten sichern, damit nichts verloren geht
    const safety = createSafetyBackup(data, kind);
    setImportSummary({ summary: diffData(data, restored), kind, safety });
    setData(restored);
    setSelectedId(null);
    setTab('grows');
  };

  // Alles zurücksetzen (App wie frisch installiert)
  const handleReset = ({ deleteBackups }: { deleteBackups: boolean }) => {
    const counts = {
      grows: data.grows.length,
      logs: data.grows.reduce((sum, g) => sum + (g.logs?.length ?? 0), 0),
      batches: (data.batches ?? []).length,
    };
    if (deleteBackups) {
      clearAllBackups();
      clearBackupLog();
    } else {
      createSafetyBackup(data, 'reset');
    }
    setData(emptyData());
    setSelectedId(null);
    resetHints();
    resetSelectedFertilizer();
    setTourSeen(false);
    setResetOpen(false);
    setToast({
      ok: true,
      message: t(
        `Zurückgesetzt: ${nGrows(counts.grows)}, ${nEntries(counts.logs)} und ${nBatches(counts.batches)} gelöscht.${deleteBackups ? '' : ' Ein Backup deiner Daten findest du unter „Backup“.'}`,
        `Reset: ${nGrows(counts.grows)}, ${nEntries(counts.logs)} and ${nBatches(counts.batches)} deleted.${deleteBackups ? '' : ' A backup of your data is available under “Backup”.'}`
      ),
    });
  };

  // Athena/Backup-Overlay: Wenn ein anderer Tab aktiv ist, wird dieser im
  // Vordergrund angezeigt. Der vorherige View (Grow-Detail oder Übersicht)
  // bleibt erhalten und ist wieder sichtbar, sobald man auf den Grows-Tab schaltet.
  const showOverview = tab === 'overview';
  const showNutrient = tab === 'nutrient';
  const showAthena = tab === 'athena';
  const showShotSize = tab === 'shotsize';
  const showBackup = tab === 'backup';
  const showAbout = tab === 'about';

  return (
    <Shell
      tab={tab}
      onTabChange={setTab}
      onExport={handleExport}
      onImport={handleImportClick}
      onHelp={() => setTourOpen(true)}
      onImportFile={handleImportFile}
      fileInputRef={fileInputRef}
      importError={importError}
      batches={data.batches}
    >
      {showOverview ? (
        <OverviewPanel
          data={data}
          onOpenGrow={(id) => {
            setSelectedId(id);
            setTab('grows');
          }}
        />
      ) : showNutrient ? (
        <NutrientPanel
          batches={data.batches ?? []}
          grows={data.grows}
          onChange={(batches: NutrientBatch[]) => setData((d) => ({ ...d, batches }))}
        />
      ) : showAthena ? (
        <FertilizerSchema prices={data.fertPrices} onPricesChange={(prices) => setData((d) => ({ ...d, fertPrices: prices }))} />
      ) : showShotSize ? (
        <ShotSizeCalculator />
      ) : showBackup ? (
        <BackupPanel data={data} onRestore={handleRestoreFromBackup} />
      ) : showAbout ? (
        <AboutPanel onStartTour={() => setTourOpen(true)} onReset={() => setResetOpen(true)} />
      ) : selectedGrow ? (
        <>
          <GrowDetail
            grow={selectedGrow}
            allGrows={data.grows}
            fertPrices={data.fertPrices}
            onFertPricesChange={(prices) => setData((d) => ({ ...d, fertPrices: prices }))}
            batches={data.batches ?? []}
            onBack={() => setSelectedId(null)}
            onUpdateGrow={updateGrow}
            onEditGrow={() => openEdit(selectedGrow)}
            onDeleteGrow={() => requestDelete(selectedGrow)}
          />
          <GrowFormModal
            open={formOpen}
            onClose={() => setFormOpen(false)}
            onSubmit={submitForm}
            initial={editingGrow ? { name: editingGrow.name, strain: editingGrow.strain ?? '', color: editingGrow.color, plantCount: plantsOf(editingGrow) } : undefined}
            mode="edit"
          />
          <ConfirmDialog
            open={!!confirmDelete}
            title={t('Grow löschen?', 'Delete grow?')}
            message={t(
              `"${confirmDelete?.name}" und alle Tagebucheinträge werden endgültig entfernt. Dies kann nicht rückgängig gemacht werden.`,
              `"${confirmDelete?.name}" and all journal entries will be permanently removed. This cannot be undone.`
            )}
            confirmLabel={t('Löschen', 'Delete')}
            cancelLabel={t('Abbrechen', 'Cancel')}
            destructive
            onConfirm={confirmDeleteGrow}
            onCancel={() => setConfirmDelete(null)}
          />
        </>
      ) : (
        <>
          <section className="mb-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <SummaryStat
                icon={<Sprout size={18} />}
                label={t('Aktive Grows', 'Active grows')}
                value={activeGrows.length}
                tone="primary"
              />
              <SummaryStat
                icon={<Leaf size={18} />}
                label={t('In Wachstum', 'In veg')}
                value={activeGrows.filter((g) => currentPhase(g).key === 'veg').length}
                tone="accent"
              />
              <SummaryStat
                icon={<Flower2 size={18} />}
                label={t('In Blüte', 'In flower')}
                value={activeGrows.filter((g) => ['stretch', 'bloom', 'ready'].includes(currentPhase(g).key)).length}
                tone="warning"
              />
              <SummaryStat
                icon={<Hourglass size={18} />}
                label={t('Ausstehend', 'Pending')}
                value={plannedGrows.length}
                tone="muted"
              />
            </div>

            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-lg font-semibold text-white">{t('Deine Grows & Tents', 'Your grows & tents')}</h2>
                <p className="text-sm text-ink-500 mt-0.5">
                  {t('Meilensteine, Phasen und Tageswerte für jeden Grow verfolgen.', 'Track milestones, phases and daily values for every grow.')}
                </p>
              </div>
              <button
                onClick={openCreate}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-ink-950 bg-primary-500 hover:bg-primary-400 transition-colors shadow-glow"
              >
                <Plus size={17} />
                {t('Neuer Grow', 'New grow')}
              </button>
            </div>
          </section>

          {data.grows.length === 0 ? (
            <EmptyState onCreate={openCreate} />
          ) : (
            <>
              {activeGrows.length > 0 && (
                <section className="mb-8">
                  <SectionLabel>{t('Aktiv', 'Active')}</SectionLabel>
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {activeGrows.map((grow) => (
                      <GrowCard
                        key={grow.id}
                        grow={grow}
                        onOpen={() => setSelectedId(grow.id)}
                        onEdit={() => openEdit(grow)}
                        onDelete={() => requestDelete(grow)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {plannedGrows.length > 0 && (
                <section className="mb-8">
                  <SectionLabel>
                    <span className="flex items-center gap-2">
                      <Hourglass size={14} className="text-ink-400" />
                      {t('Geplant', 'Planned')}
                    </span>
                  </SectionLabel>
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {plannedGrows.map((grow) => (
                      <GrowCard
                        key={grow.id}
                        grow={grow}
                        onOpen={() => setSelectedId(grow.id)}
                        onEdit={() => openEdit(grow)}
                        onDelete={() => requestDelete(grow)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {harvestedGrows.length > 0 && (
                <HarvestedByYear
                  harvestedGrows={harvestedGrows}
                  onOpen={(id) => setSelectedId(id)}
                  onEdit={openEdit}
                  onDelete={requestDelete}
                />
              )}
            </>
          )}

          <GrowFormModal
            open={formOpen}
            onClose={() => setFormOpen(false)}
            onSubmit={submitForm}
            initial={editingGrow ? { name: editingGrow.name, strain: editingGrow.strain ?? '', color: editingGrow.color, plantCount: plantsOf(editingGrow) } : undefined}
            mode={editingGrow ? 'edit' : 'create'}
          />
          <ConfirmDialog
            open={!!confirmDelete}
            title={t('Grow löschen?', 'Delete grow?')}
            message={t(
              `"${confirmDelete?.name}" und alle Tagebucheinträge werden endgültig entfernt. Dies kann nicht rückgängig gemacht werden.`,
              `"${confirmDelete?.name}" and all journal entries will be permanently removed. This cannot be undone.`
            )}
            confirmLabel={t('Löschen', 'Delete')}
            cancelLabel={t('Abbrechen', 'Cancel')}
            destructive
            onConfirm={confirmDeleteGrow}
            onCancel={() => setConfirmDelete(null)}
          />
        </>
      )}
      {importSummary && (
        <ImportSummaryModal summary={importSummary.summary} kind={importSummary.kind} safetyBackup={importSummary.safety} onClose={() => setImportSummary(null)} />
      )}
      <ConfirmDialog
        open={!!pendingImport}
        title={t('Daten importieren?', 'Import data?')}
        message={
          pendingImport
            ? t(
                `Der Import überschreibt alle deine aktuellen Daten. Aktuell: ${nGrows(data.grows.length)} · ${nBatches((data.batches ?? []).length)}. In der Datei: ${nGrows(pendingImport.grows.length)} · ${nBatches((pendingImport.batches ?? []).length)}. Deine aktuellen Daten werden vorher automatisch als Backup gesichert. Fortfahren?`,
                `The import overwrites all your current data. Currently: ${nGrows(data.grows.length)} · ${nBatches((data.batches ?? []).length)}. In the file: ${nGrows(pendingImport.grows.length)} · ${nBatches((pendingImport.batches ?? []).length)}. Your current data is backed up automatically first. Continue?`
              )
            : ''
        }
        confirmLabel={t('Importieren & überschreiben', 'Import & overwrite')}
        cancelLabel={t('Abbrechen', 'Cancel')}
        destructive
        onConfirm={() => {
          if (pendingImport) handleRestoreFromBackup(pendingImport, 'import');
          setPendingImport(null);
        }}
        onCancel={() => setPendingImport(null)}
      />
      <ResetDialog
        open={resetOpen}
        counts={{
          grows: data.grows.length,
          logs: data.grows.reduce((sum, g) => sum + (g.logs?.length ?? 0), 0),
          batches: (data.batches ?? []).length,
        }}
        onConfirm={handleReset}
        onCancel={() => setResetOpen(false)}
      />
      {toast && (
        <div
          data-testid="app-toast"
          className={`fixed bottom-14 left-1/2 -translate-x-1/2 z-50 w-[min(92vw,34rem)] flex items-start gap-2 rounded-xl px-3.5 py-3 shadow-2xl border bg-ink-900 ${
            toast.ok ? 'border-accent-500/40' : 'border-error-500/40'
          }`}
        >
          <p className={`text-sm break-all flex-1 ${toast.ok ? 'text-accent-300' : 'text-error-300'}`}>{toast.message}</p>
          <button onClick={() => setToast(null)} className="text-ink-500 hover:text-white shrink-0 text-lg leading-none" aria-label="close">
            ×
          </button>
        </div>
      )}
      {tourOpen && (
        <GuidedTour
          startTab={tab}
          onNavigate={(t2) => setTab(t2)}
          onClose={() => setTourOpen(false)}
        />
      )}
    </Shell>
  );
}

// ---------------- Shell + helpers ----------------

function Shell({
  children,
  tab,
  onTabChange,
  onExport,
  onImport,
  onHelp,
  onImportFile,
  fileInputRef,
  importError,
  batches,
}: {
  batches: NutrientBatch[] | undefined;
  children: React.ReactNode;
  tab: Tab;
  onTabChange: (t: Tab) => void;
  onExport: () => void;
  onImport: () => void;
  onHelp: () => void;
  onImportFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  importError: string | null;
}) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-ink-950/70 border-b border-ink-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-glow">
              <Leaf size={18} className="text-ink-950" />
            </div>
            <div className="leading-none">
              <div className="font-bold text-white tracking-tight">GrowHub</div>
              <div className="hidden min-[420px]:block text-[10px] uppercase tracking-widest text-ink-500 mt-0.5 whitespace-nowrap">
                Grow Manager
              </div>
            </div>
          </div>

          {/* Sprachauswahl — oben mittig */}
          <div className="justify-self-center">
            <LanguageSwitcher />
          </div>

          <div className="flex items-center gap-2 justify-self-end">
            <button
              onClick={onHelp}
              data-testid="help-button"
              className="h-9 w-9 rounded-full text-sm font-bold text-primary-300 bg-primary-500/10 hover:bg-primary-500/20 border border-primary-500/30 transition-colors"
              title={t('Kurze Einführung (Tour) starten', 'Start the short tour')}
              aria-label={t('Einführung starten', 'Start tour')}
            >
              ?
            </button>
            <button
              onClick={onExport}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-ink-300 bg-ink-850 hover:bg-ink-800 border border-ink-700/60 transition-colors"
              title={t('Backup als JSON exportieren', 'Export backup as JSON')}
            >
              <Download size={15} />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              onClick={onImport}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-ink-300 bg-ink-850 hover:bg-ink-800 border border-ink-700/60 transition-colors"
              title={t('Backup aus JSON importieren', 'Import backup from JSON')}
            >
              <Upload size={15} />
              <span className="hidden sm:inline">Import</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={onImportFile}
              className="hidden"
            />
          </div>
        </div>

        {/* Tab-Navigation */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <nav className="flex gap-0.5 sm:gap-1 -mb-px overflow-x-auto scrollbar-thin">
            <TabButton
              tour="grows"
              active={tab === 'grows'}
              onClick={() => onTabChange('grows')}
              icon={<Sprout size={15} />}
              label="Grows"
            />
            <TabButton
              tour="overview"
              active={tab === 'overview'}
              onClick={() => onTabChange('overview')}
              icon={<Archive size={15} />}
              label={t('Übersicht', 'Overview')}
            />
            <TabButton
              tour="nutrient"
              active={tab === 'nutrient'}
              onClick={() => onTabChange('nutrient')}
              icon={<Droplets size={15} />}
              label={t('Nährlösung', 'Nutrient mix')}
            />
            <TabButton
              tour="athena"
              active={tab === 'athena'}
              onClick={() => onTabChange('athena')}
              icon={<FlaskConical size={15} />}
              label={t('Dünger', 'Nutrients')}
            />
            <TabButton
              tour="shotsize"
              active={tab === 'shotsize'}
              onClick={() => onTabChange('shotsize')}
              icon={<Calculator size={15} />}
              label={t('Shot Size', 'Shot size')}
            />
            <TabButton
              tour="backup"
              active={tab === 'backup'}
              onClick={() => onTabChange('backup')}
              icon={<Database size={15} />}
              label="Backup"
            />
            <TabButton
              tour="about"
              active={tab === 'about'}
              onClick={() => onTabChange('about')}
              icon={<Info size={15} />}
              label={t('Über', 'About')}
            />
          </nav>
        </div>

        <NutrientBanner batches={batches} onClick={() => onTabChange('nutrient')} />

        {importError && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-2 mt-1">
            <div className="text-xs text-error-300 bg-error-500/10 border border-error-500/30 rounded-lg px-3 py-2">
              {importError}
            </div>
          </div>
        )}
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">{children}</main>

      <footer className="max-w-6xl mx-auto px-4 sm:px-6 py-8 text-center text-xs text-ink-600">
        {t('Daten werden lokal im Browser gespeichert. Exportiere regelmäßig Backups.', 'Data is stored locally in your browser. Export backups regularly.')}
      </footer>

      <VersionBadge />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  tour,
}: {
  tour?: string;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      data-tour={tour ? `tab-${tour}` : undefined}
      className={`flex items-center gap-1.5 px-1.5 min-[420px]:px-3 sm:px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
        active
          ? 'text-primary-300 border-primary-500'
          : 'text-ink-500 border-transparent hover:text-ink-200 hover:border-ink-700'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function SummaryStat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: 'primary' | 'accent' | 'warning' | 'muted';
}) {
  const toneMap = {
    primary: 'text-primary-400 bg-primary-500/10 border-primary-500/20',
    accent: 'text-accent-400 bg-accent-500/10 border-accent-500/20',
    warning: 'text-warning-400 bg-warning-500/10 border-warning-500/20',
    muted: 'text-ink-300 bg-ink-700/30 border-ink-600/40',
  } as const;
  return (
    <div className="rounded-2xl border border-ink-800 bg-ink-900/60 p-4 flex items-center gap-3.5">
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${toneMap[tone]}`}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-white tabular-nums leading-none">{value}</div>
        <div className="text-xs text-ink-500 mt-1">{label}</div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-widest text-ink-500 mb-3">
      {children}
    </h3>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-3xl border border-dashed border-ink-700/60 bg-ink-900/40 px-6 py-16 text-center">
      <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 border border-primary-500/30 flex items-center justify-center mb-5">
        <Sprout size={28} className="text-primary-400" />
      </div>
      <h2 className="text-xl font-bold text-white">{t('Starte deinen ersten Grow', 'Start your first grow')}</h2>
      <p className="text-sm text-ink-400 mt-2 max-w-md mx-auto leading-relaxed">
        {t(
          'Erstelle einen Tent oder Grow, setze deine Meilenstein-Daten und beginne, täglich pH, EC, Temperatur, Luftfeuchtigkeit und Gießmenge zu protokollieren.',
          'Create a tent or grow, set your milestone dates and start logging pH, EC, temperature, humidity and watering every day.'
        )}
      </p>
      <button
        onClick={onCreate}
        className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-ink-950 bg-primary-500 hover:bg-primary-400 transition-colors shadow-glow"
      >
        <Plus size={18} />
        {t('Ersten Grow anlegen', 'Create first grow')}
      </button>
    </div>
  );
}

function HarvestedByYear({
  harvestedGrows,
  onOpen,
  onEdit,
  onDelete,
}: {
  harvestedGrows: Grow[];
  onOpen: (id: string) => void;
  onEdit: (grow: Grow) => void;
  onDelete: (grow: Grow) => void;
}) {
  // Geerntete Grows nach Jahr gruppieren — basierend auf tatsächlicher Ernte,
  // sonst geplanter Ernte, sonst createdAt. Nur Jahre erscheinen, in denen
  // tatsächlich ein Grow existiert.
  const yearGroups = useMemo(() => {
    const groups = new Map<number, Grow[]>();
    harvestedGrows.forEach((grow) => {
      const dateStr =
        grow.milestones.actualHarvest ??
        grow.milestones.expectedHarvest ??
        grow.createdAt;
      const year = new Date(dateStr).getFullYear();
      const arr = groups.get(year) ?? [];
      arr.push(grow);
      groups.set(year, arr);
    });
    // Nach Jahr absteigend sortieren (neueste zuerst)
    return Array.from(groups.entries()).sort((a, b) => b[0] - a[0]);
  }, [harvestedGrows]);

  const [openYears, setOpenYears] = useState<Set<number>>(() => {
    // Neuestes Jahr standardmäßig aufgeklappt
    return new Set(yearGroups.length > 0 ? [yearGroups[0][0]] : []);
  });

  const toggleYear = (year: number) => {
    setOpenYears((prev) => {
      const next = new Set(prev);
      if (next.has(year)) next.delete(year);
      else next.add(year);
      return next;
    });
  };

  return (
    <section>
      <SectionLabel>
        <span className="flex items-center gap-2">
          <Flower2 size={14} className="text-error-400" />
          {t('Bisherige Grows', 'Past grows')}
        </span>
      </SectionLabel>
      <div className="space-y-3">
        {yearGroups.map(([year, grows]) => {
          const isOpen = openYears.has(year);
          return (
            <div
              key={year}
              className="rounded-2xl border border-ink-800 bg-ink-900/40 overflow-hidden"
            >
              <button
                onClick={() => toggleYear(year)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-ink-850/60 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  {isOpen ? (
                    <ChevronDown size={16} className="text-ink-400" />
                  ) : (
                    <ChevronRight size={16} className="text-ink-400" />
                  )}
                  <span className="text-base font-bold text-white tabular-nums">{year}</span>
                  <span className="text-xs font-medium text-ink-500">
                    {grows.length} {grows.length === 1 ? 'Grow' : 'Grows'}
                  </span>
                </div>
                <span className="text-xs text-ink-600">
                  {isOpen ? t('einklappen', 'collapse') : t('aufklappen', 'expand')}
                </span>
              </button>
              {isOpen && (
                <div className="px-4 pb-4 pt-1 animate-fade-in">
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {grows.map((grow) => (
                      <GrowCard
                        key={grow.id}
                        grow={grow}
                        onOpen={() => onOpen(grow.id)}
                        onEdit={() => onEdit(grow)}
                        onDelete={() => onDelete(grow)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

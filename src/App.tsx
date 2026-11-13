import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  Settings,
  ShoppingCart,
} from 'lucide-react';
import type { AppData, DeviceUsage, DimProfile, Grow, NutrientBatch } from '@/types';
import {
  loadData,
  saveData,
  importDataFromJSON,
  createAutoBackupIfDue,
  createSafetyBackup,
  clearAllBackups,
  clearBackupLog,
  emptyData,
  createManualBackup,
} from '@/lib/storage';
import { storeImportedImages, clearImages } from '@/lib/imageStore';
import { ensureSavedBaseline, hasUnsavedChanges, getLastSave } from '@/lib/saveState';
import { usePersistentState, useScrollMemory, flushUi } from '@/lib/uiState';
import { guardClose, closeWindowNow, isDesktop, restoreWindowState, trackWindowState, confirmRenderMode } from '@/lib/desktop';
import { saveBackupToLastFolder, canSaveToLastFolder } from '@/lib/backupExport';
import OrderClonesPanel from '@/components/OrderClonesPanel';
import CloseDialog from '@/components/CloseDialog';
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
import SettingsPanel from '@/components/SettingsPanel';
import ResetDialog from '@/components/ResetDialog';
import { resetHints, setTourSeen } from '@/lib/hints';
import { resetSelectedFertilizer } from '@/lib/fertilizerSelection';
import { isTourSeen } from '@/lib/hints';
import VersionBadge from '@/components/VersionBadge';
import UpdateDialog from '@/components/UpdateDialog';
import { checkOnStartup } from '@/lib/updateCheck';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { t, useLang } from '@/lib/i18n';

type Tab = 'grows' | 'overview' | 'nutrient' | 'athena' | 'shotsize' | 'order' | 'backup' | 'settings' | 'about';
const TABS: Tab[] = ['grows', 'overview', 'nutrient', 'athena', 'shotsize', 'order', 'backup', 'settings', 'about'];
const isTab = (v: unknown): v is Tab => typeof v === 'string' && (TABS as string[]).includes(v);
const isStrOrNull = (v: unknown): v is string | null => v === null || typeof v === 'string';

const nGrows = (n: number) => `${n} ${n === 1 ? 'Grow' : 'Grows'}`;
const nBatches = (n: number) => `${n} ${n === 1 ? t('Ansatz', 'batch') : t('Ansätze', 'batches')}`;
const nEntries = (n: number) => `${n} ${n === 1 ? t('Eintrag', 'entry') : t('Einträge', 'entries')}`;

export default function App() {
  const [data, setData] = useState<AppData>(() => loadData());
  const [selectedId, setSelectedId] = usePersistentState<string | null>('selectedGrow', null, isStrOrNull);
  const [formOpen, setFormOpen] = useState(false);
  const [editingGrow, setEditingGrow] = useState<Grow | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Grow | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [tab, setTab] = usePersistentState<Tab>('tab', 'grows', isTab);
  const [activeCollapsed, setActiveCollapsed] = usePersistentState<boolean>('sec:active', false);
  const [plannedCollapsed, setPlannedCollapsed] = usePersistentState<boolean>('sec:planned', false);
  const [closeAsk, setCloseAsk] = useState(false);
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

  // Hinweis unten blendet sich nach einigen Sekunden selbst aus (Fehler bleiben länger stehen)
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), toast.ok ? 7000 : 15000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Beim ersten Start dieser Version: aktuellen Stand als „gesichert“ übernehmen
  useEffect(() => {
    ensureSavedBaseline(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Desktop-App: Fenstergröße/-position wiederherstellen und merken; Darstellungsmodus bestätigen
  useEffect(() => {
    if (!isDesktop()) return;
    void restoreWindowState();
    const off = trackWindowState();
    const timer = setTimeout(confirmRenderMode, 1500);
    return () => {
      off();
      clearTimeout(timer);
    };
  }, []);

  // Beim Start im Hintergrund nach einer neuen Version suchen (GitHub Releases)
  useEffect(() => checkOnStartup(), []);

  // Beim Schließen fragen, wenn es Änderungen seit dem letzten Backup gibt
  const dataRef = useRef(data);
  dataRef.current = data;
  const closeNow = useCallback(async () => {
    flushUi();
    saveData(dataRef.current);
    await closeWindowNow();
  }, []);
  useEffect(() => {
    if (isDesktop()) {
      return guardClose(() => {
        flushUi();
        saveData(dataRef.current);
        if (hasUnsavedChanges(dataRef.current)) setCloseAsk(true);
        else void closeNow();
      });
    }
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      flushUi();
      if (hasUnsavedChanges(dataRef.current)) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [closeNow]);

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

  const submitForm = (input: { name: string; strain: string; color: string; plantCount: number; lampId?: string; lampCount?: number; deviceIds?: string[]; dim?: DimProfile; deviceUsage?: Record<string, DeviceUsage> }) => {
    if (editingGrow) {
      setData((d) => ({
        ...d,
        grows: d.grows.map((g) =>
          g.id === editingGrow.id
            ? { ...g, name: input.name, strain: input.strain, color: input.color, plantCount: input.plantCount, lampId: input.lampId, lampCount: input.lampCount, deviceIds: input.deviceIds, dim: input.dim, deviceUsage: input.deviceUsage }
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
        lampId: input.lampId,
        lampCount: input.lampCount,
        deviceIds: input.deviceIds,
        dim: input.dim,
        deviceUsage: input.deviceUsage,
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
    // Bilder aus einer Backup-Datei zuerst lokal speichern (die Bilddaten gehören nicht in den App-Speicher)
    if (restored.images) {
      void storeImportedImages(restored).then((clean) => applyRestore(clean, kind));
      return;
    }
    applyRestore(restored, kind);
  };

  const applyRestore = (restored: AppData, kind: 'import' | 'restore') => {
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
    if (deleteBackups) void clearImages().catch(() => {});
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
  const showSettings = tab === 'settings';
  const showAbout = tab === 'about';
  const showOrder = tab === 'order';

  // Scroll-Position je Ansicht merken (auch über Neustarts)
  useScrollMemory(tab === 'grows' ? (selectedGrow ? `grow:${selectedGrow.id}` : 'grows') : tab);

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
      grows={data.grows}
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
      ) : showOrder ? (
        <OrderClonesPanel />
      ) : showBackup ? (
        <BackupPanel data={data} onRestore={handleRestoreFromBackup} />
      ) : showSettings ? (
        <SettingsPanel
          settings={data.settings}
          grows={data.grows}
          onChange={(settings) =>
            setData((d) => {
              // Gelöschte Lampen aus den Grows entfernen, damit keine ins Leere zeigende Zuordnung bleibt
              const ids = new Set((settings?.lamps ?? []).map((l) => l.id));
              const devIds = new Set((settings?.devices ?? []).map((x) => x.id));
              return {
                ...d,
                settings,
                grows: d.grows.map((g) => {
                  let next = g;
                  if (g.lampId && !ids.has(g.lampId)) next = { ...next, lampId: undefined, lampCount: undefined, dim: undefined };
                  if (g.deviceIds?.some((x) => !devIds.has(x))) {
                    const keep = g.deviceIds.filter((x) => devIds.has(x));
                    next = { ...next, deviceIds: keep.length ? keep : undefined };
                  }
                  if (g.deviceUsage && Object.keys(g.deviceUsage).some((x) => !devIds.has(x))) {
                    const u = Object.fromEntries(Object.entries(g.deviceUsage).filter(([x]) => devIds.has(x)));
                    next = { ...next, deviceUsage: Object.keys(u).length ? u : undefined };
                  }
                  return next;
                }),
              };
            })
          }
        />
      ) : showAbout ? (
        <AboutPanel onStartTour={() => setTourOpen(true)} onReset={() => setResetOpen(true)} />
      ) : selectedGrow ? (
        <>
          <GrowDetail
            grow={selectedGrow}
            allGrows={data.grows}
            settings={data.settings}
            onOpenSettings={() => setTab('settings')}
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
            initial={editingGrow ? { name: editingGrow.name, strain: editingGrow.strain ?? '', color: editingGrow.color, plantCount: plantsOf(editingGrow), lampId: editingGrow.lampId, lampCount: editingGrow.lampCount, deviceIds: editingGrow.deviceIds, dim: editingGrow.dim, deviceUsage: editingGrow.deviceUsage } : undefined}
            lamps={data.settings?.lamps ?? []}
            devices={data.settings?.devices ?? []}
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
          <section className="mb-9">
            <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
              <div>
                <h2 className="gm-title">{t('Deine Grows', 'Your grows')}</h2>
                <p className="text-sm text-ink-400 mt-1.5 max-w-xl">
                  {t('Meilensteine, Phasen und Tageswerte für jeden Grow und jedes Zelt.', 'Milestones, phases and daily values for every grow and tent.')}
                </p>
              </div>
              <button
                onClick={openCreate}
                data-testid="new-grow"
                className="flex items-center gap-2 h-11 px-5 rounded-xl text-sm font-semibold text-ink-950 bg-primary-400 hover:bg-primary-300 shadow-glow"
              >
                <Plus size={18} />
                {t('Neuer Grow', 'New grow')}
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 rounded-2xl border border-ink-800 bg-ink-900/70 overflow-hidden divide-x divide-y md:divide-y-0 divide-ink-800" data-testid="phase-strip">
              <SummaryStat icon={<Sprout size={16} />} label={t('Aktive Grows', 'Active grows')} value={activeGrows.length} tone="primary" />
              <SummaryStat icon={<Leaf size={16} />} label={t('In Wachstum', 'In veg')} value={activeGrows.filter((g) => currentPhase(g).key === 'veg').length} tone="accent" />
              <SummaryStat
                icon={<Flower2 size={16} />}
                label={t('In Blüte', 'In flower')}
                value={activeGrows.filter((g) => ['stretch', 'bloom', 'ready'].includes(currentPhase(g).key)).length}
                tone="warning"
              />
              <SummaryStat icon={<Hourglass size={16} />} label={t('Geplant', 'Planned')} value={plannedGrows.length} tone="muted" />
            </div>
          </section>

          {data.grows.length === 0 ? (
            <EmptyState onCreate={openCreate} />
          ) : (
            <>
              {activeGrows.length > 0 && (
                <section className="mb-8" data-testid="section-active">
                  <CollapsibleLabel collapsed={activeCollapsed} onToggle={() => setActiveCollapsed((v) => !v)} count={activeGrows.length} testid="toggle-active">
                    {t('Aktiv', 'Active')}
                  </CollapsibleLabel>
                  {!activeCollapsed && <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {activeGrows.map((grow) => (
                      <GrowCard
                        key={grow.id}
                        grow={grow}
                        onOpen={() => setSelectedId(grow.id)}
                        onEdit={() => openEdit(grow)}
                        onDelete={() => requestDelete(grow)}
                      />
                    ))}
                  </div>}
                </section>
              )}

              {plannedGrows.length > 0 && (
                <section className="mb-8" data-testid="section-planned">
                  <CollapsibleLabel collapsed={plannedCollapsed} onToggle={() => setPlannedCollapsed((v) => !v)} count={plannedGrows.length} testid="toggle-planned">
                    <span className="flex items-center gap-2">
                      <Hourglass size={14} className="text-ink-400" />
                      {t('Geplant', 'Planned')}
                    </span>
                  </CollapsibleLabel>
                  {!plannedCollapsed && <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {plannedGrows.map((grow) => (
                      <GrowCard
                        key={grow.id}
                        grow={grow}
                        onOpen={() => setSelectedId(grow.id)}
                        onEdit={() => openEdit(grow)}
                        onDelete={() => requestDelete(grow)}
                      />
                    ))}
                  </div>}
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
            initial={editingGrow ? { name: editingGrow.name, strain: editingGrow.strain ?? '', color: editingGrow.color, plantCount: plantsOf(editingGrow), lampId: editingGrow.lampId, lampCount: editingGrow.lampCount, deviceIds: editingGrow.deviceIds, dim: editingGrow.dim, deviceUsage: editingGrow.deviceUsage } : undefined}
            lamps={data.settings?.lamps ?? []}
            devices={data.settings?.devices ?? []}
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
          className={`fixed bottom-14 left-1/2 -translate-x-1/2 z-[60] w-[min(92vw,34rem)] animate-slide-up flex items-start gap-2 rounded-xl px-3.5 py-3 shadow-2xl border bg-ink-900 ${
            toast.ok ? 'border-accent-500/40' : 'border-error-500/40'
          }`}
        >
          <p className={`text-sm break-all flex-1 ${toast.ok ? 'text-accent-300' : 'text-error-300'}`}>{toast.message}</p>
          <button onClick={() => setToast(null)} className="text-ink-500 hover:text-white shrink-0 text-lg leading-none" aria-label="close">
            ×
          </button>
        </div>
      )}
      <CloseDialog
        open={closeAsk}
        folder={canSaveToLastFolder() ? getLastSave()?.folder : undefined}
        onCancel={() => setCloseAsk(false)}
        onCloseWithoutSaving={() => void closeNow()}
        onSaveAndClose={async () => {
          const current = dataRef.current;
          const r = createManualBackup(current);
          if (canSaveToLastFolder()) {
            const f = await saveBackupToLastFolder(current);
            if (f && !f.ok) {
              setToast({ ok: false, message: t(`Datei-Backup fehlgeschlagen: ${f.message}`, `File backup failed: ${f.message}`) });
              setCloseAsk(false);
              return;
            }
          }
          if (!r.ok) {
            setToast({ ok: false, message: r.errors.join('; ') });
            setCloseAsk(false);
            return;
          }
          await closeNow();
        }}
      />
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

type NavItem = { tab: Tab; icon: React.ReactNode; label: string };

function navGroups(): { label: string; items: NavItem[] }[] {
  return [
    {
      label: t('Garten', 'Garden'),
      items: [
        { tab: 'grows', icon: <Sprout size={17} />, label: 'Grows' },
        { tab: 'overview', icon: <Archive size={17} />, label: t('Übersicht', 'Overview') },
        { tab: 'nutrient', icon: <Droplets size={17} />, label: t('Nährlösung', 'Nutrient mix') },
      ],
    },
    {
      label: t('Werkzeuge', 'Tools'),
      items: [
        { tab: 'athena', icon: <FlaskConical size={17} />, label: t('Dünger', 'Nutrients') },
        { tab: 'shotsize', icon: <Calculator size={17} />, label: t('Shot Size', 'Shot size') },
        { tab: 'order', icon: <ShoppingCart size={17} />, label: t('Steckling bestellen', 'Order clones') },
      ],
    },
    {
      label: 'System',
      items: [
        { tab: 'backup', icon: <Database size={17} />, label: 'Backup' },
        { tab: 'settings', icon: <Settings size={17} />, label: t('Einstellungen', 'Settings') },
        { tab: 'about', icon: <Info size={17} />, label: t('Über', 'About') },
      ],
    },
  ];
}

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="relative h-10 w-10 shrink-0 rounded-xl bg-ink-850 border border-ink-700 flex items-center justify-center overflow-hidden">
        <span className="absolute inset-x-0 top-0 h-[3px] gm-spectrum" aria-hidden="true" />
        <Leaf size={19} className="text-primary-300" />
      </div>
      {!compact && (
        <div className="leading-none min-w-0">
          <div className="font-display font-extrabold text-[1.15rem] text-white tracking-tight">growmanager</div>
          <div className="text-[11px] text-ink-500 mt-1 whitespace-nowrap">{t('Dein Grow-Tagebuch', 'Your grow journal')}</div>
        </div>
      )}
    </div>
  );
}

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
  grows,
}: {
  batches: NutrientBatch[] | undefined;
  grows: Grow[];
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
  const groups = navGroups();
  const actionBtn =
    'flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium text-ink-200 bg-ink-900 hover:bg-ink-850 border border-ink-800 hover:border-ink-700';
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[252px_minmax(0,1fr)]">
      {/* Seitenleiste (ab 1024 px) */}
      <aside className="hidden lg:flex sticky top-0 h-screen flex-col border-r border-ink-800/80 bg-ink-950/60" data-testid="sidebar">
        <div className="px-5 pt-5 pb-6">
          <BrandMark />
        </div>
        <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 space-y-6" aria-label={t('Hauptnavigation', 'Main navigation')}>
          {groups.map((g) => (
            <div key={g.label}>
              <div className="px-3 mb-1.5 text-xs font-medium text-ink-500">{g.label}</div>
              <div className="space-y-0.5">
                {g.items.map((it) => (
                  <TabButton key={it.tab} variant="side" tour={it.tab} active={tab === it.tab} onClick={() => onTabChange(it.tab)} icon={it.icon} label={it.label} />
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="px-4 pt-4 pb-14 border-t border-ink-800/80 space-y-3">
          <LanguageSwitcher up full />
          <p className="text-[11px] leading-relaxed text-ink-500">
            {t('Alles bleibt lokal auf diesem Gerät. Exportiere regelmäßig Backups.', 'Everything stays on this device. Export backups regularly.')}
          </p>
        </div>
      </aside>

      <div className="min-w-0 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-ink-950/95 border-b border-ink-800/80">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-3">
            <div className="lg:hidden min-w-0">
              <BrandMark compact />
            </div>
            <div className="hidden min-[480px]:block lg:hidden min-w-0">
              <div className="font-display font-extrabold text-white tracking-tight">growmanager</div>
            </div>
            <div className="lg:hidden ml-auto min-[480px]:ml-2">
              <LanguageSwitcher />
            </div>
            <div className="flex items-center gap-2 ml-auto" data-tour="header-actions">
              <button
                onClick={onHelp}
                data-testid="help-button"
                className="h-9 px-3 rounded-lg flex items-center gap-1.5 text-sm font-semibold text-led-300 bg-led-500/10 hover:bg-led-500/20 border border-led-500/30"
                title={t('Kurze Einführung (Tour) starten', 'Start the short tour')}
                aria-label={t('Einführung starten', 'Start tour')}
              >
                <span className="font-display text-base leading-none">?</span>
                <span className="hidden xl:inline">{t('Tour', 'Tour')}</span>
              </button>
              <button onClick={onExport} data-testid="export-button" className={actionBtn} title={t('Backup als JSON exportieren', 'Export backup as JSON')}>
                <Download size={15} />
                <span className="hidden sm:inline">Export</span>
              </button>
              <button onClick={onImport} data-testid="import-button" className={actionBtn} title={t('Backup aus JSON importieren', 'Import backup from JSON')}>
                <Upload size={15} />
                <span className="hidden sm:inline">Import</span>
              </button>
              <input ref={fileInputRef} type="file" accept="application/json,.json" onChange={onImportFile} className="hidden" />
            </div>
          </div>

          {/* Reiter als Leiste (unter 1024 px) */}
          <div className="lg:hidden max-w-6xl mx-auto px-2 sm:px-4">
            <nav className="flex gap-1 overflow-x-auto scrollbar-thin pb-2" aria-label={t('Hauptnavigation', 'Main navigation')}>
              {groups.flatMap((g) => g.items).map((it) => (
                <TabButton key={it.tab} variant="top" tour={it.tab} active={tab === it.tab} onClick={() => onTabChange(it.tab)} icon={it.icon} label={it.label} />
              ))}
            </nav>
          </div>

          <span className="absolute left-0 right-0 -bottom-px h-px gm-spectrum opacity-40" aria-hidden="true" />

          {importError && (
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-2 mt-1">
              <div className="text-xs text-error-300 bg-error-500/10 border border-error-500/30 rounded-lg px-3 py-2">{importError}</div>
            </div>
          )}
        </header>

        {/* Nährlösungs-Erinnerungen – nicht in der festen Kopfzeile, damit sie keinen Platz dauerhaft belegen */}
        <div className="w-full max-w-6xl mx-auto pt-5 empty:hidden">
          <NutrientBanner batches={batches} grows={grows} onClick={() => onTabChange('nutrient')} />
        </div>

        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-7 sm:py-9">{children}</main>

        <footer className="lg:hidden max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-14 text-center text-xs text-ink-500">
          {t('Alles bleibt lokal auf diesem Gerät. Exportiere regelmäßig Backups.', 'Everything stays on this device. Export backups regularly.')}
        </footer>
      </div>

      <VersionBadge />
      <UpdateDialog />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  tour,
  variant,
}: {
  tour?: string;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  variant: 'side' | 'top';
}) {
  if (variant === 'side') {
    return (
      <button
        onClick={onClick}
        data-tour={tour ? `tab-${tour}` : undefined}
        data-testid={tour ? `nav-${tour}` : undefined}
        aria-current={active ? 'page' : undefined}
        className={`relative w-full flex items-center gap-3 pl-3 pr-2 py-2 rounded-lg text-sm font-medium text-left ${
          active ? 'text-white bg-ink-850' : 'text-ink-400 hover:text-ink-100 hover:bg-ink-900'
        }`}
      >
        {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-gradient-to-b from-led-400 via-accent-400 to-primary-400" aria-hidden="true" />}
        <span className={active ? 'text-primary-300' : 'text-ink-500'}>{icon}</span>
        {label}
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      data-tour={tour ? `tab-${tour}` : undefined}
      data-testid={tour ? `navtop-${tour}` : undefined}
      aria-current={active ? 'page' : undefined}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap border ${
        active ? 'text-white bg-ink-850 border-ink-700' : 'text-ink-400 border-transparent hover:text-ink-100 hover:bg-ink-900'
      }`}
    >
      <span className={active ? 'text-primary-300' : ''}>{icon}</span>
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
    primary: 'text-primary-300',
    accent: 'text-accent-300',
    warning: 'text-warning-300',
    muted: 'text-led-300',
  } as const;
  return (
    <div className="px-5 py-4 flex items-center justify-between gap-3">
      <div>
        <div className={`flex items-center gap-1.5 text-xs font-medium ${toneMap[tone]}`}>
          {icon}
          {label}
        </div>
        <div className={`font-display text-3xl font-extrabold tabular-nums leading-none mt-2 ${value > 0 ? 'text-white' : 'text-ink-600'}`}>{value}</div>
      </div>
    </div>
  );
}

function CollapsibleLabel({
  children,
  collapsed,
  onToggle,
  count,
  testid,
}: {
  children: React.ReactNode;
  collapsed: boolean;
  onToggle: () => void;
  count: number;
  testid?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      data-testid={testid}
      aria-expanded={!collapsed}
      className="w-full flex items-center gap-1 mb-4 group"
    >
      <span className="flex items-center gap-2 font-display text-base font-bold text-ink-100 group-hover:text-white">
        {collapsed ? <ChevronRight size={16} className="text-ink-500" /> : <ChevronDown size={16} className="text-ink-500" />}
        {children}
        <span className="font-sans text-xs font-semibold text-ink-400 bg-ink-850 border border-ink-800 rounded-md px-1.5 py-0.5 tabular-nums">{count}</span>
      </span>
      <span className="flex-1 h-px bg-ink-800 mx-2" aria-hidden="true" />
      <span className="text-xs text-ink-500 group-hover:text-ink-300">{collapsed ? t('aufklappen', 'expand') : t('einklappen', 'collapse')}</span>
    </button>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="relative rounded-3xl border border-ink-800 bg-ink-900/60 px-6 py-16 text-center overflow-hidden" data-testid="empty-state">
      <span className="absolute inset-x-0 top-0 h-[3px] gm-spectrum opacity-70" aria-hidden="true" />
      <div className="mx-auto h-16 w-16 rounded-2xl bg-ink-850 border border-ink-700 flex items-center justify-center mb-5">
        <Sprout size={28} className="text-primary-300" />
      </div>
      <h2 className="font-display text-2xl font-bold text-white tracking-tight">{t('Starte deinen ersten Grow', 'Start your first grow')}</h2>
      <p className="text-sm text-ink-400 mt-2 max-w-md mx-auto leading-relaxed">
        {t(
          'Erstelle einen Tent oder Grow, setze deine Meilenstein-Daten und beginne, täglich pH, EC, Temperatur, Luftfeuchtigkeit und Gießmenge zu protokollieren.',
          'Create a tent or grow, set your milestone dates and start logging pH, EC, temperature, humidity and watering every day.'
        )}
      </p>
      <button
        onClick={onCreate}
        className="mt-7 inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-ink-950 bg-primary-400 hover:bg-primary-300 shadow-glow"
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

  // Neuestes Jahr standardmäßig aufgeklappt; Auswahl wird gemerkt
  const [openYearList, setOpenYearList] = usePersistentState<number[]>(
    'sec:years',
    yearGroups.length > 0 ? [yearGroups[0][0]] : [],
    (v): v is number[] => Array.isArray(v) && v.every((x) => typeof x === 'number')
  );
  const openYears = new Set(openYearList);
  const [pastCollapsed, setPastCollapsed] = usePersistentState<boolean>('sec:past', false);

  const toggleYear = (year: number) => {
    setOpenYearList((prev) => (prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]));
  };

  return (
    <section>
      <CollapsibleLabel collapsed={pastCollapsed} onToggle={() => setPastCollapsed((v) => !v)} count={harvestedGrows.length} testid="toggle-past">
        <span className="flex items-center gap-2">
          <Flower2 size={15} className="text-warning-400" />
          {t('Bisherige Grows', 'Past grows')}
        </span>
      </CollapsibleLabel>
      {!pastCollapsed && <div className="space-y-3">
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
                  <span className="font-display text-lg font-bold text-white tabular-nums">{year}</span>
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
      </div>}
    </section>
  );
}

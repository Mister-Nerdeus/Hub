import { useCallback, useEffect, useRef, useState } from "react";
import type { AuthoringDraftContract } from "@nerdeus/shared";
import { ActiveFloorplanSummary } from "./features/floorplans/ActiveFloorplanSummary";
import {
  cleanupActiveFloorplanAfterSavedDelete,
  createActiveFloorplanContract,
  createActiveFloorplanSummaryViewModel,
  createEmptyActiveFloorplanState,
  markActiveFloorplanForAssignment,
  markActiveFloorplanForSimulation,
  openDefaultFloorplan,
  openSavedFloorplan
} from "./features/floorplans/activeFloorplanState";
import { createDuplicateFloorplanViewModel } from "./features/floorplans/duplicateFloorplanViewModel";
import { ActiveFloorplanHub } from "./features/floorplans/ActiveFloorplanHub";
import { createActiveFloorplanSelectorViewModel } from "./features/floorplans/activeFloorplanSelectorViewModel";
import { ActiveFloorplanBanner } from "./features/floorplans/ActiveFloorplanBanner";
import { createActiveFloorplanBannerViewModel } from "./features/floorplans/activeFloorplanBannerViewModel";
import { ActiveFloorplanContext } from "./features/floorplans/activeFloorplanContext";
import { FloorplanChangeConfirmationDialog } from "./features/floorplans/FloorplanChangeConfirmationDialog";
import { FloorplanLibrary } from "./features/floorplans/FloorplanLibrary";
import { createFloorplanLibraryViewModel } from "./features/floorplans/floorplanLibraryViewModel";
import { FloorplanLandingSummary } from "./features/floorplans/FloorplanLandingSummary";
import { FloorplanReadinessChecklist } from "./features/floorplans/FloorplanReadinessChecklist";
import { createFloorplanReadinessViewModel } from "./features/floorplans/floorplanReadinessViewModel";
import { FloorplanVersionHistoryPanel } from "./features/floorplans/FloorplanVersionHistoryPanel";
import {
  archiveFloorplanVersion,
  mapSavedRecordsToFloorplanVersions,
  restoreFloorplanVersion
} from "./features/floorplans/floorplanVersionHistory";
import {
  ACTIVE_FLOORPLAN_ID,
  createFloorplanVersionLabel,
  normalizeFloorplanDisplayName
} from "./features/floorplans/floorplanVersionNaming";
import {
  readPersistedActiveFloorplanSelection,
  writePersistedActiveFloorplanSelection
} from "./features/floorplans/activeFloorplanPersistence";
import { checkAssignmentCompatibility } from "./features/floorplans/floorplanCompatibility";
import { CanonicalFloorplanHeader } from "./features/floorplans/CanonicalFloorplanHeader";
import { CANONICAL_FLOORPLAN_ID } from "./features/floorplans/canonicalFloorplanViewModel";
import { createCanonicalFloorplanHeaderViewModel } from "./features/floorplans/canonicalFloorplanHeaderViewModel";
import {
  createSavedFloorplanStore,
  type SavedFloorplanRecord,
  type SavedFloorplanStore
} from "./features/floorplans/savedFloorplanStore";
import { createSavedFloorplanPersistence } from "./features/floorplans/savedFloorplanPersistence";
import { LayoutEditorStage } from "./features/layout-editor/LayoutEditorStage";
import type { SaveWorkingCopyResult } from "./features/layout-editor/LayoutEditorStage";
import {
  recordDraftTraceStage,
  recordEditableLayoutTraceStage,
  recordPlanTraceStage,
  recordSavedRecordTraceStage
} from "./features/layout-editor/layoutSaveTrace";
import { LayoutEditorErrorBoundary } from "./features/layout-editor/LayoutEditorErrorBoundary";
import { AppShell } from "./features/app-shell/AppShell";
import {
  APP_SECTIONS,
  DEFAULT_APP_SECTION_ID,
  DEVELOPER_EVIDENCE_SECTION_ID,
  type AppSectionId
} from "./features/app-shell/appNavigation";
import { DeveloperEvidencePage } from "./features/app-shell/DeveloperEvidencePage";
import { AssignmentWorkflow } from "./features/assignments/AssignmentWorkflow";
import {
  ManualAssignmentWorkspace,
  splitRoomManualAssignmentOverlayNurses,
  type ManualAssignmentMap
} from "./features/manual-assignment/ManualAssignmentWorkspace";
import { summarizeManualAssignmentCompatibility } from "./features/manual-assignment/manualAssignmentCompatibility";
import { ScenarioRatioComparisonPanel } from "./features/scenarios/ScenarioRatioComparisonPanel";
import { SimulationV0InternalDryRunPanel } from "./features/simulation/SimulationV0InternalDryRunPanel";
import { createSimulationV0InternalDryRunViewModel } from "./features/simulation/simulationV0ViewModel";
import { WorkspaceAccessEntryScreen } from "./features/demo-pin/WorkspaceAccessEntryScreen";
import {
  clearWorkspaceAccessSession,
  createInitialWorkspaceAccessState,
  submitWorkspaceAccess,
  tickWorkspaceAccessState,
  updateWorkspaceAccessInput
} from "./features/demo-pin/workspaceAccessState";
import { createDemoPinGateViewModel } from "./features/demo-pin/demoPinViewModel";
import { useDemoPinTimer } from "./features/demo-pin/useDemoPinTimer";
import { LegacyFloorplanFixturesPanel } from "./features/floorplans/LegacyFloorplanFixturesPanel";
import { createLegacyFloorplanFixturesPanelViewModel } from "./features/floorplans/legacyFloorplanFixturesViewModel";

import "./styles.css";

type AppProps = {
  initialSection?: AppSectionId;
};

export function App({ initialSection = DEFAULT_APP_SECTION_ID }: AppProps) {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";
  const [activeSection, setActiveSection] = useState(() => readInitialSection(initialSection));
  const [workspaceAccessState, setWorkspaceAccessState] = useState(() =>
    createInitialWorkspaceAccessState(getSessionStorage(), Date.now())
  );

  const savedFloorplanStoreRef = useRef<SavedFloorplanStore | null>(null);
  if (savedFloorplanStoreRef.current == null) {
    savedFloorplanStoreRef.current = createSavedFloorplanStore(
      typeof window === "undefined" || window.localStorage == null
        ? null
        : createSavedFloorplanPersistence(window.localStorage)
    );
  }
  const savedFloorplanStore = savedFloorplanStoreRef.current;
  const [savedFloorplans, setSavedFloorplans] = useState<SavedFloorplanRecord[]>(() =>
    savedFloorplanStore.list()
  );
  const floorplanLibraryViewModel = createFloorplanLibraryViewModel(undefined, savedFloorplans);
  const demoPinGateViewModel = createDemoPinGateViewModel(workspaceAccessState);
  const legacyFloorplanFixturesPanelViewModel = createLegacyFloorplanFixturesPanelViewModel();
  const simulationV0ViewModel = createSimulationV0InternalDryRunViewModel();

  const [activeFloorplanState, setActiveFloorplanState] = useState(() =>
    restoreInitialActiveFloorplanState(savedFloorplanStore.list())
  );
  const [floorplanStatusMessage, setFloorplanStatusMessage] = useState<string | null>(null);
  const [manualAssignmentsByRoomId, setManualAssignmentsByRoomId] =
    useState<ManualAssignmentMap>({});
  const [archivedVersionIds, setArchivedVersionIds] = useState<Set<string>>(() => new Set());
  const [pendingFloorplanChangeVersionId, setPendingFloorplanChangeVersionId] = useState<string | null>(null);
  const activeFloorplanContract = createActiveFloorplanContract(activeFloorplanState, savedFloorplans);
  const floorplanVersions = mapSavedRecordsToFloorplanVersions({
    records: savedFloorplans,
    currentVersionId: activeFloorplanContract?.activeFloorplanVersionId ?? null,
    archivedVersionIds
  });
  const activeFloorplanSelectorViewModel = activeFloorplanContract == null
    ? null
    : createActiveFloorplanSelectorViewModel({
        activeFloorplan: activeFloorplanContract,
        versions: floorplanVersions
      });
  const activeFloorplanBannerViewModel = activeFloorplanContract == null
    ? null
    : createActiveFloorplanBannerViewModel({
        activeFloorplan: activeFloorplanContract,
        versions: floorplanVersions
      });
  const floorplanReadinessViewModel = activeFloorplanContract == null
    ? null
    : createFloorplanReadinessViewModel(activeFloorplanContract);
  const manualAssignmentCompatibility = activeFloorplanContract == null
    ? null
    : summarizeManualAssignmentCompatibility(activeFloorplanContract, manualAssignmentsByRoomId);
  const activeFloorplanSummaryViewModel =
    createActiveFloorplanSummaryViewModel(activeFloorplanState);
  const canonicalFloorplanHeaderViewModel = createCanonicalFloorplanHeaderViewModel({
    activeFloorplan: activeFloorplanSummaryViewModel,
    savedFloorplans
  });

  useEffect(() => {
    if (activeFloorplanContract == null) {
      return;
    }
    writePersistedActiveFloorplanSelection(getLocalStorage(), {
      schemaVersion: "1.0.0",
      activeFloorplanId: activeFloorplanContract.activeFloorplanId,
      activeFloorplanVersionId: activeFloorplanContract.activeFloorplanVersionId
    });
  }, [activeFloorplanContract?.activeFloorplanId, activeFloorplanContract?.activeFloorplanVersionId]);

  function openDefault(planId: string) {
    setActiveFloorplanState((state) => openDefaultFloorplan(state, planId));
    setFloorplanStatusMessage(null);
  }

  function duplicateDefault(planId: string) {
    const duplicate = createDuplicateFloorplanViewModel(planId).copy;
    const saved = savedFloorplanStore.save(duplicate);
    setSavedFloorplans(savedFloorplanStore.list());
    setActiveFloorplanState((state) => openSavedFloorplan(state, saved));
    setFloorplanStatusMessage(null);
  }

  function requestOpenSaved(recordId: string) {
    if (Object.keys(manualAssignmentsByRoomId).length > 0) {
      setPendingFloorplanChangeVersionId(recordId);
      return;
    }
    openSaved(recordId, { clearAssignments: false });
  }

  function openSaved(recordId: string, options: { clearAssignments: boolean } = { clearAssignments: true }) {
    const saved = savedFloorplanStore.load(recordId);
    if (saved == null) {
      return;
    }
    recordPlanTraceStage("reopenedPlan", {
      recordId: saved.recordId,
      plan: saved.plan
    });
    recordEditableLayoutTraceStage("reopenedEditableLayout", {
      recordId: saved.recordId,
      planId: saved.planId,
      editableLayout: saved.authoringDraft.editableLayout
    });
    setActiveFloorplanState((state) => openSavedFloorplan(state, saved));
    if (options.clearAssignments) {
      setManualAssignmentsByRoomId({});
      setFloorplanStatusMessage("Active floorplan changed. Current assignments were cleared for compatibility.");
    } else {
      setFloorplanStatusMessage(null);
    }
  }

  function deleteSaved(recordId: string) {
    savedFloorplanStore.delete(recordId);
    setSavedFloorplans(savedFloorplanStore.list());
    setActiveFloorplanState((state) => cleanupActiveFloorplanAfterSavedDelete(state, recordId));
    setFloorplanStatusMessage("Saved copy deleted. Canonical floorplan remains available.");
  }

  function selectFloorplanVersion(versionId: string) {
    if (versionId === activeFloorplanContract?.activeFloorplanVersionId) {
      return;
    }
    if (savedFloorplanStore.load(versionId) == null) {
      openDefault(CANONICAL_FLOORPLAN_ID);
      return;
    }
    if (Object.keys(manualAssignmentsByRoomId).length > 0) {
      setPendingFloorplanChangeVersionId(versionId);
      return;
    }
    openSaved(versionId, { clearAssignments: false });
  }

  function confirmPendingFloorplanChange() {
    if (pendingFloorplanChangeVersionId == null) {
      return;
    }
    openSaved(pendingFloorplanChangeVersionId, { clearAssignments: true });
    setPendingFloorplanChangeVersionId(null);
  }

  function saveActiveWorkingCopy(draft: AuthoringDraftContract): SaveWorkingCopyResult {
    const active = activeFloorplanState.activeFloorplan;
    if (active == null) {
      return { status: "failed", message: "No active floorplan is loaded." };
    }
    try {
      const savedAt = new Date().toISOString();
      recordDraftTraceStage("saveHandlerInput", {
        recordId: active.recordId,
        draft
      });
      if (active.sourceKind === "saved-json") {
        const saved = savedFloorplanStore.saveDraft(active.recordId, stampDraft(draft, savedAt));
        recordSavedRecordTraceStage("savedRecordPayload", saved);
        recordPlanTraceStage("reopenedPlan", {
          recordId: saved.recordId,
          plan: saved.plan
        });
        recordEditableLayoutTraceStage("reopenedEditableLayout", {
          recordId: saved.recordId,
          planId: saved.planId,
          editableLayout: saved.authoringDraft.editableLayout
        });
        setSavedFloorplans(savedFloorplanStore.list());
        setActiveFloorplanState((state) => openSavedFloorplan(state, saved));
        setFloorplanStatusMessage("Saved. This floorplan is active for assignments and scenarios.");
        return {
          status: "saved",
          recordId: saved.recordId,
          displayName: normalizeFloorplanDisplayName(saved.displayName),
          savedAt
        };
      }
      const saved = savedFloorplanStore.saveAsDraft(stampDraft(draft, savedAt), {
        displayName: normalizeFloorplanDisplayName(draft.displayName),
        versionLabel: createFloorplanVersionLabel({ fallbackIndex: savedFloorplans.length + 1 })
      });
      recordSavedRecordTraceStage("savedRecordPayload", saved);
      recordPlanTraceStage("reopenedPlan", {
        recordId: saved.recordId,
        plan: saved.plan
      });
      recordEditableLayoutTraceStage("reopenedEditableLayout", {
        recordId: saved.recordId,
        planId: saved.planId,
        editableLayout: saved.authoringDraft.editableLayout
      });
      setSavedFloorplans(savedFloorplanStore.list());
      setActiveFloorplanState((state) => openSavedFloorplan(state, saved));
      setFloorplanStatusMessage("Saved. This floorplan is active for assignments and scenarios.");
      return {
        status: "created_copy",
        recordId: saved.recordId,
        displayName: normalizeFloorplanDisplayName(saved.displayName),
        savedAt
      };
    } catch (error) {
      return { status: "failed", message: errorMessage(error) };
    }
  }

  function saveActiveAsNewCopy(draft: AuthoringDraftContract): SaveWorkingCopyResult {
    if (activeFloorplanState.activeFloorplan == null) {
      return { status: "failed", message: "No active floorplan is loaded." };
    }
    try {
      const savedAt = new Date().toISOString();
      recordDraftTraceStage("saveHandlerInput", {
        recordId: activeFloorplanState.activeFloorplan.recordId,
        draft
      });
      const saved = savedFloorplanStore.saveAsDraft(stampDraft(draft, savedAt), {
        displayName: normalizeFloorplanDisplayName(draft.displayName),
        versionLabel: createFloorplanVersionLabel({ fallbackIndex: savedFloorplans.length + 1 })
      });
      recordSavedRecordTraceStage("savedRecordPayload", saved);
      setSavedFloorplans(savedFloorplanStore.list());
      setActiveFloorplanState((state) => openSavedFloorplan(state, saved));
      setFloorplanStatusMessage("Saved new version. This floorplan is active for assignments and scenarios.");
      return {
        status: "created_copy",
        recordId: saved.recordId,
        displayName: normalizeFloorplanDisplayName(saved.displayName),
        savedAt
      };
    } catch (error) {
      return { status: "failed", message: errorMessage(error) };
    }
  }

  useEffect(() => {
    if (typeof window === "undefined" || window.location.hash.length <= 1) {
      return;
    }
    const targetId = decodeURIComponent(window.location.hash.slice(1));
    document.getElementById(targetId)?.scrollIntoView();
  }, []);

  const tickDemoPin = useCallback(() => {
    setWorkspaceAccessState((state) => tickWorkspaceAccessState(state));
  }, []);
  useDemoPinTimer(!workspaceAccessState.unlocked, tickDemoPin);

  function submitDemoPinEntry() {
    setWorkspaceAccessState((state) => {
      const nextState = submitWorkspaceAccess(state, getSessionStorage());
      if (nextState.unlocked) {
        setActiveSection(DEFAULT_APP_SECTION_ID);
      }
      return nextState;
    });
  }

  function clearDemoPinEntry() {
    setWorkspaceAccessState(clearWorkspaceAccessSession(getSessionStorage()));
  }

  function relockDemo() {
    setWorkspaceAccessState(clearWorkspaceAccessSession(getSessionStorage()));
    setActiveSection(DEFAULT_APP_SECTION_ID);
  }

  const captureManualAssignments = useCallback((assignments: ManualAssignmentMap) => {
    setManualAssignmentsByRoomId(assignments);
  }, []);

  const assignmentOverlaySource = {
    assignmentsByRoomId: manualAssignmentsByRoomId,
    nurses: splitRoomManualAssignmentOverlayNurses
  };

  if (!workspaceAccessState.unlocked) {
    return (
      <WorkspaceAccessEntryScreen
        viewModel={demoPinGateViewModel}
        value={workspaceAccessState.input}
        onChange={(value) => setWorkspaceAccessState((state) => updateWorkspaceAccessInput(state, value))}
        onUnlock={submitDemoPinEntry}
        onClear={clearDemoPinEntry}
      />
    );
  }

  const pendingFloorplanChangeRecord = pendingFloorplanChangeVersionId == null
    ? null
    : savedFloorplanStore.load(pendingFloorplanChangeVersionId);
  const pendingFloorplanChangeVersion = floorplanVersions.find(
    (version) => version.versionId === pendingFloorplanChangeVersionId
  );
  const pendingTargetContract = pendingFloorplanChangeRecord == null
    ? null
    : createActiveFloorplanContract(
        openSavedFloorplan(activeFloorplanState, pendingFloorplanChangeRecord),
        savedFloorplans
      );
  const pendingCompatibility = pendingTargetContract == null
    ? null
    : checkAssignmentCompatibility(pendingTargetContract, manualAssignmentsByRoomId);

  return (
    <ActiveFloorplanContext.Provider value={activeFloorplanContract}>
    <AppShell
      activeSection={activeSection}
      sections={APP_SECTIONS}
      onSectionChange={(section) => setActiveSection(section)}
      onRelockDemo={relockDemo}
      activeFloorplanBanner={activeFloorplanBannerViewModel == null ? null : (
        <ActiveFloorplanBanner
          viewModel={activeFloorplanBannerViewModel}
          onChange={() => setActiveSection("floorplans")}
          onEdit={() => setActiveSection("editor")}
        />
      )}
    >
      {activeSection === "floorplans" ? (
        <section className="workflow-section" aria-labelledby="floorplans-title">
          <h2 id="floorplans-title">Floorplan</h2>
          {activeFloorplanSelectorViewModel == null ? null : (
            <ActiveFloorplanHub
              selectorViewModel={activeFloorplanSelectorViewModel}
              readinessViewModel={floorplanReadinessViewModel}
              statusMessage={floorplanStatusMessage}
              onEditFloorplan={() => setActiveSection("editor")}
              onUseForAssignment={() => {
                setActiveFloorplanState((state) => markActiveFloorplanForAssignment(state));
                setActiveSection("manual-assignment");
              }}
              onUseForSimulation={() => {
                setActiveFloorplanState((state) => markActiveFloorplanForSimulation(state));
                setActiveSection("simulation");
              }}
              onChangeFloorplan={selectFloorplanVersion}
              advancedContent={(
                <>
                  <FloorplanLandingSummary
                    activeFloorplan={activeFloorplanSummaryViewModel}
                    onOpenEditor={() => setActiveSection("editor")}
                    onOpenManualAssignment={() => setActiveSection("manual-assignment")}
                    onOpenScenarioComparison={() => setActiveSection("scenarios")}
                    onFocusLibrary={() => document.getElementById("floorplan-library-title")?.scrollIntoView()}
                    demoPinUnlocked={workspaceAccessState.unlocked}
                  />
                  <CanonicalFloorplanHeader viewModel={canonicalFloorplanHeaderViewModel} />
                  <ActiveFloorplanSummary
                    viewModel={activeFloorplanSummaryViewModel}
                    onLaunchEditor={() => setActiveSection("editor")}
                  />
                  <FloorplanVersionHistoryPanel
                    versions={floorplanVersions}
                    onRestoreVersion={(versionId) => {
                      setArchivedVersionIds((state) => restoreFloorplanVersion(state, versionId));
                      requestOpenSaved(versionId);
                    }}
                    onArchiveVersion={(versionId) => setArchivedVersionIds((state) => archiveFloorplanVersion(state, versionId))}
                  />
                  <FloorplanLibrary
                    viewModel={floorplanLibraryViewModel}
                    onOpenDefaultPlan={openDefault}
                    onDuplicateDefaultPlan={duplicateDefault}
                    onOpenSavedPlan={requestOpenSaved}
                    onDeleteSavedPlan={deleteSaved}
                    demoPinUnlocked={workspaceAccessState.unlocked}
                  />
                  <details className="floorplan-demo-proof">
                    <summary>Advanced evidence</summary>
                    <LegacyFloorplanFixturesPanel viewModel={legacyFloorplanFixturesPanelViewModel} />
                  </details>
                </>
              )}
            />
          )}
        </section>
      ) : null}

      {activeSection === "editor" ? (
        <section className="workflow-section" aria-labelledby="editor-title">
          <h2 id="editor-title">Layout editor</h2>
          <LayoutEditorErrorBoundary
            activeFloorplan={activeFloorplanState.activeFloorplan}
            onReturnToLibrary={() => setActiveSection("floorplans")}
          >
            <LayoutEditorStage
              activeFloorplan={activeFloorplanState.activeFloorplan}
              activeFloorplanContract={activeFloorplanContract}
              assignmentOverlaySource={assignmentOverlaySource}
              onCreateWorkingCopy={() =>
                duplicateDefault(activeFloorplanState.activeFloorplan?.planId ?? "default-er-layout-plan-1")
              }
              onSaveWorkingCopy={saveActiveWorkingCopy}
              onSaveAsNewCopy={saveActiveAsNewCopy}
              onDoneEditing={() => setActiveSection("floorplans")}
            />
          </LayoutEditorErrorBoundary>
          {floorplanReadinessViewModel == null ? null : (
            <FloorplanReadinessChecklist viewModel={floorplanReadinessViewModel} />
          )}
        </section>
      ) : null}

      {activeSection === "routes" ? (
        <section className="workflow-section" aria-labelledby="routes-title">
          <h2 id="routes-title">Routes</h2>
          <p className="workflow-section__placeholder">Route tools will be available in a future workflow step.</p>
        </section>
      ) : null}

      {activeSection === "assignments" ? (
        <section className="workflow-section" aria-labelledby="assignments-title">
          <h2 id="assignments-title">Assignments</h2>
          <AssignmentWorkflow activePlan={activeFloorplanState.activeFloorplan?.plan ?? null} />
        </section>
      ) : null}

      {activeSection === "manual-assignment" ? (
        <section className="workflow-section" aria-labelledby="manual-assignment-section-title">
          <h2 id="manual-assignment-section-title">Manual Assignment</h2>
          {manualAssignmentCompatibility == null || manualAssignmentCompatibility.status !== "incompatible" ? null : (
            <p className="floorplan-status-message" role="status">
              Assignment set is incompatible with this floorplan. Missing room IDs: {manualAssignmentCompatibility.missingRoomIds.join(", ")}
            </p>
          )}
          <ManualAssignmentWorkspace
            activeFloorplan={activeFloorplanContract}
            assignmentsByRoomId={manualAssignmentsByRoomId}
            onAssignmentsChange={captureManualAssignments}
          />
        </section>
      ) : null}

      {activeSection === "scenarios" ? (
        <section className="workflow-section" aria-labelledby="scenarios-title">
          <h2 id="scenarios-title">Scenarios</h2>
          <ScenarioRatioComparisonPanel activeFloorplan={activeFloorplanContract} />
        </section>
      ) : null}

      {activeSection === "simulation" ? (
        <section className="workflow-section" aria-labelledby="simulation-title">
          <h2 id="simulation-title">Simulation Review</h2>
          <SimulationV0InternalDryRunPanel
            activeFloorplan={activeFloorplanContract}
            viewModel={simulationV0ViewModel}
          />
        </section>
      ) : null}

      {activeSection === "reports" ? (
        <section className="workflow-section" aria-labelledby="reports-title">
          <h2 id="reports-title">Reports</h2>
          <p>Selected floorplan: {activeFloorplanContract?.displayName ?? "ER Pod Main Layout"}</p>
          <p className="workflow-section__placeholder">Reports workflow placeholder while assignments and simulation outputs remain in proof mode.</p>
        </section>
      ) : null}

      {activeSection === "help" ? (
        <section className="workflow-section" aria-labelledby="help-title">
          <h2 id="help-title">Help</h2>
          <p className="workflow-section__placeholder">
            This workspace uses synthetic operational data only. Finish Floorplan and Assignments before scenario setup.
          </p>
        </section>
      ) : null}

      {activeSection === "settings" ? (
        <section className="workflow-section" aria-labelledby="settings-title">
          <h2 id="settings-title">Settings</h2>
          <p className="workflow-section__placeholder">Settings and environment controls will be available in a follow-on issue.</p>
        </section>
      ) : null}

      {activeSection === DEVELOPER_EVIDENCE_SECTION_ID ? (
        <section className="workflow-section" aria-labelledby="developer-evidence-title">
          <DeveloperEvidencePage apiBaseUrl={apiBaseUrl} />
        </section>
      ) : null}
      {pendingFloorplanChangeRecord == null || activeFloorplanBannerViewModel == null ? null : (
        <FloorplanChangeConfirmationDialog
          currentFloorplan={activeFloorplanBannerViewModel}
          targetVersionLabel={pendingFloorplanChangeVersion?.versionLabel ?? pendingFloorplanChangeRecord.versionLabel}
          missingRoomIds={pendingCompatibility?.missingRoomIds ?? []}
          onCancel={() => setPendingFloorplanChangeVersionId(null)}
          onConfirm={confirmPendingFloorplanChange}
        />
      )}
    </AppShell>
    </ActiveFloorplanContext.Provider>
  );
}

function readInitialSection(fallback: AppSectionId): AppSectionId {
  if (typeof window === "undefined") {
    return fallback;
  }
  const candidate = new URLSearchParams(window.location.search).get("section");
  return APP_SECTIONS.some((section) => section.id === candidate) ? candidate as AppSectionId : fallback;
}

function getSessionStorage(): Storage | null {
  return typeof window === "undefined" ? null : window.sessionStorage;
}

function getLocalStorage(): Storage | null {
  return typeof window === "undefined" ? null : window.localStorage;
}

function restoreInitialActiveFloorplanState(savedRecords: readonly SavedFloorplanRecord[]) {
  const fallback = createEmptyActiveFloorplanState();
  const persisted = readPersistedActiveFloorplanSelection(getLocalStorage());
  if (persisted == null || persisted.activeFloorplanId !== ACTIVE_FLOORPLAN_ID) {
    return fallback;
  }
  const savedRecord = savedRecords.find(
    (record) => record.recordId === persisted.activeFloorplanVersionId
  );
  return savedRecord == null ? fallback : openSavedFloorplan(fallback, savedRecord);
}

function stampDraft(draft: AuthoringDraftContract, updatedAt: string): AuthoringDraftContract {
  return {
    ...draft,
    updatedAt
  };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

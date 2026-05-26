import { useEffect, useRef, useState } from "react";
import { ActiveFloorplanSummary } from "./features/floorplans/ActiveFloorplanSummary";
import {
  createActiveFloorplanSummaryViewModel,
  createEmptyActiveFloorplanState,
  openDefaultFloorplan,
  openSavedFloorplan
} from "./features/floorplans/activeFloorplanState";
import { createDuplicateFloorplanViewModel } from "./features/floorplans/duplicateFloorplanViewModel";
import { FloorplanLibrary } from "./features/floorplans/FloorplanLibrary";
import { createFloorplanLibraryViewModel } from "./features/floorplans/floorplanLibraryViewModel";
import { PlanBuilderLanding } from "./features/floorplans/PlanBuilderLanding";
import {
  createSavedFloorplanStore,
  type SavedFloorplanRecord,
  type SavedFloorplanStore
} from "./features/floorplans/savedFloorplanStore";
import { createSavedFloorplanPersistence } from "./features/floorplans/savedFloorplanPersistence";
import { LayoutEditorStage } from "./features/layout-editor/LayoutEditorStage";
import { AppShell } from "./features/app-shell/AppShell";
import {
  APP_SECTIONS,
  DEFAULT_APP_SECTION_ID,
  DEVELOPER_EVIDENCE_SECTION_ID,
  type AppSectionId
} from "./features/app-shell/appNavigation";
import { DeveloperEvidencePage } from "./features/app-shell/DeveloperEvidencePage";
import { AssignmentWorkflow } from "./features/assignments/AssignmentWorkflow";
import { Plan1DemoGuide } from "./features/demo/Plan1DemoGuide";
import { createPlan1DemoWorkflowViewModel } from "./features/demo/plan1DemoWorkflowViewModel";
import { Plan1ScenarioBuilder } from "./features/scenarios/Plan1ScenarioBuilder";

import "./styles.css";

type AppProps = {
  initialSection?: AppSectionId;
};

export function App({ initialSection = DEFAULT_APP_SECTION_ID }: AppProps) {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";
  const [activeSection, setActiveSection] = useState(initialSection);

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

  const [activeFloorplanState, setActiveFloorplanState] = useState(createEmptyActiveFloorplanState);
  const activeFloorplanSummaryViewModel =
    createActiveFloorplanSummaryViewModel(activeFloorplanState);
  const demoWorkflowViewModel = createPlan1DemoWorkflowViewModel({
    activeSection,
    activePlanId: activeFloorplanState.activeFloorplan?.plan.planId ?? null
  });

  function openDefault(planId: string) {
    setActiveFloorplanState((state) => openDefaultFloorplan(state, planId));
  }

  function duplicateDefault(planId: string) {
    const duplicate = createDuplicateFloorplanViewModel(planId).copy;
    const saved = savedFloorplanStore.save(duplicate);
    setSavedFloorplans(savedFloorplanStore.list());
    setActiveFloorplanState((state) => openSavedFloorplan(state, saved));
  }

  function openSaved(recordId: string) {
    const saved = savedFloorplanStore.load(recordId);
    if (saved == null) {
      return;
    }
    setActiveFloorplanState((state) => openSavedFloorplan(state, saved));
  }

  function deleteSaved(recordId: string) {
    savedFloorplanStore.delete(recordId);
    setSavedFloorplans(savedFloorplanStore.list());
    setActiveFloorplanState((state) =>
      state.activeFloorplan?.recordId === recordId ? createEmptyActiveFloorplanState() : state
    );
  }

  function openPlan1Demo() {
    openDefault("default-er-layout-plan-1");
    setActiveSection("editor");
  }

  function navigateDemo(sectionId: AppSectionId, anchorId?: string) {
    setActiveSection(sectionId);
    if (anchorId == null) {
      return;
    }
    window.setTimeout(() => document.getElementById(anchorId)?.scrollIntoView(), 0);
  }

  useEffect(() => {
    if (typeof window === "undefined" || window.location.hash.length <= 1) {
      return;
    }
    const targetId = decodeURIComponent(window.location.hash.slice(1));
    document.getElementById(targetId)?.scrollIntoView();
  }, []);

  return (
    <AppShell
      activeSection={activeSection}
      sections={APP_SECTIONS}
      onSectionChange={(section) => setActiveSection(section)}
    >
      {activeSection !== DEVELOPER_EVIDENCE_SECTION_ID ? (
        <Plan1DemoGuide
          viewModel={demoWorkflowViewModel}
          onOpenPlan1={openPlan1Demo}
          onNavigate={navigateDemo}
        />
      ) : null}

      {activeSection === "floorplans" ? (
        <section className="workflow-section" aria-labelledby="floorplans-title">
          <h2 id="floorplans-title">Floorplans</h2>
          <PlanBuilderLanding />
          <FloorplanLibrary
            viewModel={floorplanLibraryViewModel}
            onOpenDefaultPlan={openDefault}
            onDuplicateDefaultPlan={duplicateDefault}
            onOpenSavedPlan={openSaved}
            onDeleteSavedPlan={deleteSaved}
          />
          <ActiveFloorplanSummary viewModel={activeFloorplanSummaryViewModel} />
        </section>
      ) : null}

      {activeSection === "editor" ? (
        <section className="workflow-section" aria-labelledby="editor-title">
          <h2 id="editor-title">Layout editor</h2>
          <LayoutEditorStage activeFloorplan={activeFloorplanState.activeFloorplan} />
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

      {activeSection === "scenarios" ? (
        <section className="workflow-section" aria-labelledby="scenarios-title">
          <h2 id="scenarios-title">Scenarios</h2>
          <Plan1ScenarioBuilder activePlan={activeFloorplanState.activeFloorplan?.plan ?? null} />
        </section>
      ) : null}

      {activeSection === "simulation" ? (
        <section className="workflow-section" aria-labelledby="simulation-title">
          <h2 id="simulation-title">Simulation</h2>
          <p className="workflow-section__placeholder">Simulation execution is in preview mode and will be refined in a dedicated workflow.</p>
        </section>
      ) : null}

      {activeSection === "reports" ? (
        <section className="workflow-section" aria-labelledby="reports-title">
          <h2 id="reports-title">Reports</h2>
          <p className="workflow-section__placeholder">Reports workflow placeholder while assignments and simulation outputs remain in proof mode.</p>
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
    </AppShell>
  );
}

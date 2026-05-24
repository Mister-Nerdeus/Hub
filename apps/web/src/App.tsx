import { useEffect, useReducer, useState } from "react";
import type { PlanContract } from "@nerdeus/shared";

import { BundleAuditProof } from "./features/bundle-audit/BundleAuditProof";
import { createBundleAuditProofViewModel } from "./features/bundle-audit/bundleAuditViewModel";
import { ScenarioComparisonProof } from "./features/comparison/ScenarioComparisonProof";
import { createScenarioComparisonProofViewModel } from "./features/comparison/scenarioComparisonViewModel";
import { ExportBundleReviewProof } from "./features/export-review/ExportBundleReviewProof";
import { createExportBundleReviewViewModel } from "./features/export-review/exportBundleReviewViewModel";
import { FloorplanLibrary } from "./features/floorplans/FloorplanLibrary";
import { createFloorplanLibraryViewModel } from "./features/floorplans/floorplanLibraryViewModel";
import { ManualAssignmentProof } from "./features/manual-assignment/ManualAssignmentProof";
import { createManualAssignmentViewModel } from "./features/manual-assignment/manualAssignmentViewModel";
import { OptimizerProof } from "./features/optimization/OptimizerProof";
import { createOptimizerProofViewModel } from "./features/optimization/optimizerProofViewModel";
import { GeneratedPlanPreview } from "./features/plan-builder/GeneratedPlanPreview";
import {
  applyGeneratedPlanPreview,
  createGeneratedPlanPreviewViewModel,
  type GeneratedPlanPreviewViewModel
} from "./features/plan-builder/generatedPlanPreviewViewModel";
import { PlanBuilderDefaultsForm } from "./features/plan-builder/PlanBuilderDefaultsForm";
import {
  buildDefaults,
  createDefaultPlanBuilderDefaultsFormState,
  planBuilderDefaultsFormStateToContract,
  updatePlanBuilderDefaultsFormState,
  type PlanBuilderDefaultsFormState
} from "./features/plan-builder/planBuilderDefaultsFormState";
import { PlanDraftPanel } from "./features/plan-builder/PlanDraftPanel";
import { planDraftReducer } from "./features/plan-builder/planDraftReducer";
import { PlanRenderer } from "./features/plan-renderer/PlanRenderer";
import { PlanImportExportPanel } from "./features/plans/PlanImportExportPanel";
import { PlanSaveLoadPanel } from "./features/plans/PlanSaveLoadPanel";
import { OperationalReportsProof } from "./features/reports/OperationalReportsProof";
import { createReportProofViewModel } from "./features/reports/reportProofViewModel";
import { OperationalOutcomeDashboardProof } from "./features/outcomes/OperationalOutcomeDashboardProof";
import { createOperationalOutcomeDashboardViewModel } from "./features/outcomes/operationalOutcomeDashboardViewModel";
import { RoutePreviewProof } from "./features/route-preview/RoutePreviewProof";
import { createRoutePreviewProofViewModel } from "./features/route-preview/routePreviewProofViewModel";
import { SimulationTimelineProof } from "./features/simulation/SimulationTimelineProof";
import { createSimulationTimelineViewModel } from "./features/simulation/simulationTimelineViewModel";
import { SimulationRunRetrievalProof } from "./features/simulation/SimulationRunRetrievalProof";
import { LayoutEditorStage } from "./features/layout-editor/LayoutEditorStage";
import {
  manualAssignmentBasic,
  manualAssignmentRoomLoads
} from "./fixtures/manualAssignmentBasic";
import { planErPodPhase2 } from "./fixtures/planErPodPhase2";

export function App() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8010";
  const manualAssignmentViewModel = createManualAssignmentViewModel(
    planErPodPhase2,
    manualAssignmentRoomLoads,
    manualAssignmentBasic
  );
  const reportProofViewModel = createReportProofViewModel();
  const scenarioComparisonProofViewModel = createScenarioComparisonProofViewModel();
  const exportBundleReviewViewModel = createExportBundleReviewViewModel();
  const bundleAuditProofViewModel = createBundleAuditProofViewModel();
  const simulationTimelineViewModel = createSimulationTimelineViewModel();
  const operationalOutcomeDashboardViewModel = createOperationalOutcomeDashboardViewModel();
  const routePreviewProofViewModel = createRoutePreviewProofViewModel();
  const optimizerProofViewModel = createOptimizerProofViewModel();
  const floorplanLibraryViewModel = createFloorplanLibraryViewModel();
  const [draftPlan, dispatchDraft] = useReducer(
    planDraftReducer,
    planErPodPhase2 as PlanContract
  );
  const [defaultsFormState, setDefaultsFormState] = useState(
    createDefaultPlanBuilderDefaultsFormState
  );
  const [generatedPreview, setGeneratedPreview] = useState<GeneratedPlanPreviewViewModel | null>(null);
  const defaultsResult = planBuilderDefaultsFormStateToContract(defaultsFormState);
  const validationError = defaultsResult.ok ? null : defaultsResult.error;

  function updateDefaultsField<K extends keyof PlanBuilderDefaultsFormState>(
    key: K,
    value: PlanBuilderDefaultsFormState[K]
  ) {
    setDefaultsFormState((state) => updatePlanBuilderDefaultsFormState(state, key, value));
    setGeneratedPreview(null);
  }

  function generatePreview() {
    setGeneratedPreview(createGeneratedPlanPreviewViewModel(buildDefaults(defaultsFormState)));
  }

  function applyPreview() {
    if (generatedPreview == null) {
      return;
    }
    applyGeneratedPlanPreview(generatedPreview, (plan) =>
      dispatchDraft({ type: "replacePlan", plan })
    );
  }

  useEffect(() => {
    if (window.location.hash.length > 1) {
      const targetId = decodeURIComponent(window.location.hash.slice(1));
      document.getElementById(targetId)?.scrollIntoView();
    }
  }, []);

  return (
    <main className="app-shell">
      <section className="workspace-header" aria-labelledby="page-title">
        <div>
          <p className="eyebrow">Operational simulation workspace</p>
          <h1 id="page-title">Nerdeus ER Pod Shift Simulator</h1>
        </div>
        <div className="api-pill" aria-label="Configured API base URL">
          <span>API</span>
          <strong>{apiBaseUrl}</strong>
        </div>
      </section>

      <FloorplanLibrary viewModel={floorplanLibraryViewModel} />
      <LayoutEditorStage />
      <SimulationRunRetrievalProof apiBaseUrl={apiBaseUrl} />
      <ManualAssignmentProof viewModel={manualAssignmentViewModel} />
      <OperationalReportsProof viewModel={reportProofViewModel} />
      <OperationalOutcomeDashboardProof viewModel={operationalOutcomeDashboardViewModel} />
      <RoutePreviewProof initialViewModel={routePreviewProofViewModel} />
      <ScenarioComparisonProof viewModel={scenarioComparisonProofViewModel} />
      <ExportBundleReviewProof viewModel={exportBundleReviewViewModel} />
      <BundleAuditProof viewModel={bundleAuditProofViewModel} />
      <SimulationTimelineProof viewModel={simulationTimelineViewModel} />
      <OptimizerProof viewModel={optimizerProofViewModel} />
      <PlanBuilderDefaultsForm
        state={defaultsFormState}
        validationError={validationError}
        onChange={updateDefaultsField}
      />
      <GeneratedPlanPreview
        preview={generatedPreview}
        onGenerate={generatePreview}
        onApply={applyPreview}
      />
      <PlanDraftPanel plan={draftPlan} dispatch={dispatchDraft} />
      <PlanSaveLoadPanel
        apiBaseUrl={apiBaseUrl}
        draftPlan={draftPlan}
        onLoadPlan={(plan) => dispatchDraft({ type: "replacePlan", plan })}
      />
      <PlanImportExportPanel
        draftPlan={draftPlan}
        onImportPlan={(plan) => dispatchDraft({ type: "replacePlan", plan })}
      />
      <PlanRenderer plan={draftPlan} />
    </main>
  );
}

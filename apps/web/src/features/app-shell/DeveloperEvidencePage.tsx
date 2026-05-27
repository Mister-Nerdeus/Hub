import { useReducer, useState, type ReactNode } from "react";
import type { PlanContract } from "@nerdeus/shared";

import { BundleAuditProof } from "../bundle-audit/BundleAuditProof";
import { createBundleAuditProofViewModel } from "../bundle-audit/bundleAuditViewModel";
import { ScenarioComparisonProof } from "../comparison/ScenarioComparisonProof";
import { createScenarioComparisonProofViewModel } from "../comparison/scenarioComparisonViewModel";
import { ExportBundleReviewProof } from "../export-review/ExportBundleReviewProof";
import { createExportBundleReviewViewModel } from "../export-review/exportBundleReviewViewModel";
import { ManualAssignmentProof } from "../manual-assignment/ManualAssignmentProof";
import { createManualAssignmentViewModel } from "../manual-assignment/manualAssignmentViewModel";
import { OptimizerProof } from "../optimization/OptimizerProof";
import { createOptimizerProofViewModel } from "../optimization/optimizerProofViewModel";
import { GeneratedPlanPreview } from "../plan-builder/GeneratedPlanPreview";
import {
  applyGeneratedPlanPreview,
  createGeneratedPlanPreviewViewModel,
  type GeneratedPlanPreviewViewModel
} from "../plan-builder/generatedPlanPreviewViewModel";
import { PlanBuilderDefaultsForm } from "../plan-builder/PlanBuilderDefaultsForm";
import {
  buildDefaults,
  createDefaultPlanBuilderDefaultsFormState,
  planBuilderDefaultsFormStateToContract,
  updatePlanBuilderDefaultsFormState,
  type PlanBuilderDefaultsFormState
} from "../plan-builder/planBuilderDefaultsFormState";
import { PlanDraftPanel } from "../plan-builder/PlanDraftPanel";
import { planDraftReducer } from "../plan-builder/planDraftReducer";
import { PlanRenderer } from "../plan-renderer/PlanRenderer";
import { PlanImportExportPanel } from "../plans/PlanImportExportPanel";
import { PlanSaveLoadPanel } from "../plans/PlanSaveLoadPanel";
import { OperationalOutcomeDashboardProof } from "../outcomes/OperationalOutcomeDashboardProof";
import { createOperationalOutcomeDashboardViewModel } from "../outcomes/operationalOutcomeDashboardViewModel";
import { LegacyFloorplanReferenceList } from "../floorplans/LegacyFloorplanReferenceList";
import { createFloorplanLibraryViewModel } from "../floorplans/floorplanLibraryViewModel";
import { RoutePreviewProof } from "../route-preview/RoutePreviewProof";
import { createRoutePreviewProofViewModel } from "../route-preview/routePreviewProofViewModel";
import { OperationalReportsProof } from "../reports/OperationalReportsProof";
import { createReportProofViewModel } from "../reports/reportProofViewModel";
import { SimulationTimelineProof } from "../simulation/SimulationTimelineProof";
import { createSimulationTimelineViewModel } from "../simulation/simulationTimelineViewModel";
import { SimulationRunRetrievalProof } from "../simulation/SimulationRunRetrievalProof";
import { manualAssignmentBasic, manualAssignmentRoomLoads } from "../../fixtures/manualAssignmentBasic";
import { planErPodPhase2 } from "../../fixtures/planErPodPhase2";
import "./developerEvidencePage.css";

type DeveloperEvidencePageProps = {
  apiBaseUrl: string;
};

export function DeveloperEvidencePage({ apiBaseUrl }: DeveloperEvidencePageProps) {
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

  const [draftPlan, dispatchDraft] = useReducer(planDraftReducer, planErPodPhase2 as PlanContract);
  const [defaultsFormState, setDefaultsFormState] = useState(createDefaultPlanBuilderDefaultsFormState);
  const [generatedPreview, setGeneratedPreview] = useState<GeneratedPlanPreviewViewModel | null>(null);
  const defaultsResult = planBuilderDefaultsFormStateToContract(defaultsFormState);
  const validationError = defaultsResult.ok ? null : defaultsResult.error;

  function updateDefaultsField<K extends keyof PlanBuilderDefaultsFormState>(
    key: K,
    value: PlanBuilderDefaultsFormState[K]
  ) {
    setDefaultsFormModelState((state) => updatePlanBuilderDefaultsFormState(state, key, value));
  }

  function setDefaultsFormModelState(
    updater: (state: PlanBuilderDefaultsFormState) => PlanBuilderDefaultsFormState
  ) {
    setDefaultsFormState(updater);
    setGeneratedPreview(null);
  }

  function generatePreview() {
    setGeneratedPreview(createGeneratedPlanPreviewViewModel(buildDefaults(defaultsFormState)));
  }

  function applyPreview() {
    if (generatedPreview == null) {
      return;
    }
    applyGeneratedPlanPreview(generatedPreview, (plan) => dispatchDraft({ type: "replacePlan", plan }));
  }

  function evidenceSection(title: string, content: ReactNode) {
    return (
      <section className="developer-evidence__panel">
        <h3>{title}</h3>
        {content}
      </section>
    );
  }

  return (
    <div className="developer-evidence">
      <h2 id="developer-evidence-title">Developer/Evidence</h2>
      <p className="developer-evidence__intro">Proof-only workflow modules are preserved here only.</p>
      <div className="developer-evidence__grid">
        {evidenceSection("Simulation API retrieval", <SimulationRunRetrievalProof apiBaseUrl={apiBaseUrl} />)}
        {evidenceSection(
          "Legacy floorplan references",
          <LegacyFloorplanReferenceList floorplans={floorplanLibraryViewModel.legacyDefaultFloorplans} />
        )}
        {evidenceSection("Manual assignment", <ManualAssignmentProof viewModel={manualAssignmentViewModel} />)}
        {evidenceSection("Operational reports", <OperationalReportsProof viewModel={reportProofViewModel} />)}
        {evidenceSection("Operational outcomes", <OperationalOutcomeDashboardProof viewModel={operationalOutcomeDashboardViewModel} />)}
        {evidenceSection("Route preview", <RoutePreviewProof initialViewModel={routePreviewProofViewModel} />)}
        {evidenceSection("Scenario comparison", <ScenarioComparisonProof viewModel={scenarioComparisonProofViewModel} />)}
        {evidenceSection("Export bundle", <ExportBundleReviewProof viewModel={exportBundleReviewViewModel} />)}
        {evidenceSection("Bundle audit", <BundleAuditProof viewModel={bundleAuditProofViewModel} />)}
        {evidenceSection("Simulation timeline", <SimulationTimelineProof viewModel={simulationTimelineViewModel} />)}
        {evidenceSection("Optimizer", <OptimizerProof viewModel={optimizerProofViewModel} />)}
        {evidenceSection(
          "Plan builder defaults",
          <PlanBuilderDefaultsForm
            state={defaultsFormState}
            validationError={validationError}
            onChange={updateDefaultsField}
          />
        )}
        {evidenceSection(
          "Generated plan preview",
          <GeneratedPlanPreview preview={generatedPreview} onGenerate={generatePreview} onApply={applyPreview} />
        )}
        {evidenceSection("Plan draft panel", <PlanDraftPanel plan={draftPlan} dispatch={dispatchDraft} />)}
        {evidenceSection(
          "Plan save/load API",
          <PlanSaveLoadPanel
            apiBaseUrl={apiBaseUrl}
            draftPlan={draftPlan}
            onLoadPlan={(plan) => dispatchDraft({ type: "replacePlan", plan })}
          />
        )}
        {evidenceSection(
          "Plan import/export",
          <PlanImportExportPanel
            draftPlan={draftPlan}
            onImportPlan={(plan) => dispatchDraft({ type: "replacePlan", plan })}
          />
        )}
        {evidenceSection("Plan renderer", <PlanRenderer plan={draftPlan} />)}
      </div>
    </div>
  );
}

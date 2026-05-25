import {
  buildPlan1OperationalSummary,
  buildPlan1AssumptionViewModel,
  buildPlan1DemoProofBundle,
  buildPlan1DemoSeedPackSummary,
  buildPlan1ScenarioComparisonViewModel,
  buildPlan1SimulationProofReport,
  buildPlan1TimelineViewModel,
  buildPlan1TimelineNarratives,
  createPlan1BaselineScenarioControlState,
  explainPlan1Warnings,
  runPlan1ShiftDryRun,
  validatePlan1DemoSeedPack,
  validatePlanContract,
  validatePlan1ScenarioBuilderState,
  validatePlan1ScenarioComparisonFixture,
  validatePlan1ScenarioIntensityProfiles,
  validatePlan1GeneratedTaskSet,
  validatePlan1SimulationAssumptions,
  validatePlan1SimulationInput,
  validatePlan1TaskTemplates,
  validateWalkingBaselineContract,
  type PlanContract
} from "@nerdeus/shared";

import plan1Fixture from "../../../../../packages/shared/fixtures/default-plans/default-er-layout-plan-1.json" with { type: "json" };
import walkingBaselineFixture from "../../../../../packages/shared/fixtures/default-plans/walking-baselines/default-er-layout-plan-1-walking-baseline.json" with { type: "json" };
import assumptionsFixture from "../../../../../packages/shared/fixtures/scenarios/plan-1/assumptions-register.json" with { type: "json" };
import comparisonFixture from "../../../../../packages/shared/fixtures/scenarios/plan-1/scenario-comparison-fixtures.json" with { type: "json" };
import intensityProfileFixture from "../../../../../packages/shared/fixtures/scenarios/plan-1/scenario-intensity-profiles.json" with { type: "json" };
import scenarioBuilderFixture from "../../../../../packages/shared/fixtures/scenarios/plan-1/scenario-builder-baseline.json" with { type: "json" };
import simulationInputFixture from "../../../../../packages/shared/fixtures/scenarios/plan-1/simulation-input-baseline.json" with { type: "json" };
import taskTemplateFixture from "../../../../../packages/shared/fixtures/scenarios/plan-1/task-templates.json" with { type: "json" };
import seededTaskFixture from "../../../../../packages/shared/fixtures/scenarios/plan-1/seeded-scenario-validation-fixtures.json" with { type: "json" };
import demoSeedPackFixture from "../../../../../packages/shared/fixtures/demo/plan-1/plan-1-demo-seed-pack.json" with { type: "json" };
import { Plan1DemoProofBundlePanel } from "../demo/Plan1DemoProofBundlePanel";
import { Plan1AssumptionsPanel } from "./Plan1AssumptionsPanel";
import { Plan1OperationalSummaryPanel } from "./Plan1OperationalSummaryPanel";
import { Plan1ScenarioComparisonPanel } from "./Plan1ScenarioComparisonPanel";
import { Plan1ScenarioControls } from "./Plan1ScenarioControls";
import { Plan1SimulationProofReportPanel } from "./Plan1SimulationProofReportPanel";
import { Plan1SimulationTimelinePanel } from "./Plan1SimulationTimelinePanel";
import { Plan1WarningExplainabilityPanel } from "./Plan1WarningExplainabilityPanel";
import "../assignments/AssignmentWorkflow.css";

export function Plan1ScenarioBuilder({ activePlan }: { activePlan?: PlanContract | null }) {
  const planIsActivePlan1 = activePlan?.planId === "default-er-layout-plan-1";
  const plan = validatePlanContract(plan1Fixture.plan);
  const walkingBaseline = validateWalkingBaselineContract(walkingBaselineFixture);
  const assumptions = validatePlan1SimulationAssumptions(assumptionsFixture);
  const intensityProfiles = validatePlan1ScenarioIntensityProfiles(intensityProfileFixture);
  const taskTemplates = validatePlan1TaskTemplates(taskTemplateFixture);
  const assumptionViewModel = buildPlan1AssumptionViewModel(assumptions);
  const scenarioState = validatePlan1ScenarioBuilderState(scenarioBuilderFixture, {
    assumptions,
    intensityProfiles,
    taskTemplates
  });
  const controls = createPlan1BaselineScenarioControlState({
    profileId: scenarioState.intensityProfileId,
    seed: scenarioState.seed,
    durationMinutes: scenarioState.durationMinutes,
    taskTemplates,
    limitations: scenarioState.limitations,
    nonClaims: scenarioState.nonClaims
  });
  const simulationInput = validatePlan1SimulationInput(simulationInputFixture, scenarioState);
  const generatedTaskSet = validatePlan1GeneratedTaskSet(seededTaskFixture.baselineTaskSet, simulationInput);
  const dryRun = runPlan1ShiftDryRun({
    simulationInput,
    generatedTaskSet,
    plan,
    walkingBaseline
  });
  const summary = buildPlan1OperationalSummary(dryRun);
  const comparison = validatePlan1ScenarioComparisonFixture(comparisonFixture);
  const comparisonViewModel = buildPlan1ScenarioComparisonViewModel(comparison);
  const timelineViewModel = buildPlan1TimelineViewModel(dryRun);
  const warningExplanations = explainPlan1Warnings(dryRun.warningCodes);
  const timelineNarratives = buildPlan1TimelineNarratives(timelineViewModel, warningExplanations);
  const demoSeedSummary = buildPlan1DemoSeedPackSummary(validatePlan1DemoSeedPack(demoSeedPackFixture));
  const proofReport = buildPlan1SimulationProofReport({
    reportId: "plan-1-simulation-proof-report-ui",
    scenarioState,
    assumptionsViewModel: assumptionViewModel,
    generatedTaskSet,
    dryRun,
    timelineViewModel,
    warningExplanations,
    comparisonViewModel
  });
  const demoProofBundle = buildPlan1DemoProofBundle({
    proofReport,
    demoSeedSummary,
    sourceIssue: "277"
  });

  if (!planIsActivePlan1) {
    return (
      <div className="assignment-workflow" data-scenario-stage="scope-blocked" data-plan-1-scope="blocked">
        <section className="assignment-panel" aria-labelledby="plan-1-scenario-blocked-title">
          <h3 id="plan-1-scenario-blocked-title">Plan 1 Scenario Builder</h3>
          <p>Open repaired Plan 1 to inspect scenario assumptions and deterministic dry-run fixtures.</p>
          <p>{assumptions.nonClaims.join(" ")}</p>
        </section>
      </div>
    );
  }

  return (
    <div className="assignment-workflow" data-plan-id={scenarioState.planId} data-scenario-stage="final">
      <section className="assignment-panel" aria-labelledby="plan-1-scenario-builder-title" data-scenario-stage="scenario-state">
        <h3 id="plan-1-scenario-builder-title">Plan 1 Scenario Builder</h3>
        <dl className="scenario-metric-grid">
          <div><dt>Scenario</dt><dd>{scenarioState.scenarioLabel}</dd></div>
          <div><dt>Profile</dt><dd>{scenarioState.intensityProfileId}</dd></div>
          <div><dt>Seed</dt><dd>{scenarioState.seed}</dd></div>
          <div><dt>Duration</dt><dd>{scenarioState.durationMinutes}</dd></div>
          <div><dt>Templates</dt><dd>{scenarioState.taskTemplateIds.length}</dd></div>
          <div><dt>Tasks</dt><dd>{seededTaskFixture.baselineTaskSet.tasks.length}</dd></div>
        </dl>
        <p>{scenarioState.limitations.join(" ")}</p>
        <p>{scenarioState.nonClaims.join(" ")}</p>
      </section>
      <Plan1AssumptionsPanel viewModel={assumptionViewModel} />
      <Plan1ScenarioControls controlState={controls} profiles={intensityProfiles} taskTemplates={taskTemplates} />
      <Plan1OperationalSummaryPanel summary={summary} />
      <Plan1SimulationTimelinePanel narratives={timelineNarratives} viewModel={timelineViewModel} />
      <Plan1WarningExplainabilityPanel narratives={timelineNarratives} />
      <Plan1ScenarioComparisonPanel comparison={comparison} viewModel={comparisonViewModel} />
      <Plan1SimulationProofReportPanel report={proofReport} />
      <Plan1DemoProofBundlePanel bundle={demoProofBundle} />
    </div>
  );
}

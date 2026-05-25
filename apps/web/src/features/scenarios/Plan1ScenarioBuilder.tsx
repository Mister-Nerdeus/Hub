import {
  buildPlan1OperationalSummary,
  runPlan1ShiftDryRun,
  validatePlan1ScenarioBuilderState,
  validatePlan1ScenarioComparisonFixture,
  validatePlan1ScenarioIntensityProfiles,
  validatePlan1GeneratedTaskSet,
  validatePlan1SimulationAssumptions,
  validatePlan1SimulationInput,
  validatePlan1TaskTemplates,
  type PlanContract
} from "@nerdeus/shared";

import assumptionsFixture from "../../../../../packages/shared/fixtures/scenarios/plan-1/assumptions-register.json" with { type: "json" };
import comparisonFixture from "../../../../../packages/shared/fixtures/scenarios/plan-1/scenario-comparison-fixtures.json" with { type: "json" };
import intensityProfileFixture from "../../../../../packages/shared/fixtures/scenarios/plan-1/scenario-intensity-profiles.json" with { type: "json" };
import scenarioBuilderFixture from "../../../../../packages/shared/fixtures/scenarios/plan-1/scenario-builder-baseline.json" with { type: "json" };
import simulationInputFixture from "../../../../../packages/shared/fixtures/scenarios/plan-1/simulation-input-baseline.json" with { type: "json" };
import taskTemplateFixture from "../../../../../packages/shared/fixtures/scenarios/plan-1/task-templates.json" with { type: "json" };
import seededTaskFixture from "../../../../../packages/shared/fixtures/scenarios/plan-1/seeded-scenario-validation-fixtures.json" with { type: "json" };
import { Plan1OperationalSummaryPanel } from "./Plan1OperationalSummaryPanel";
import { Plan1ScenarioComparisonPanel } from "./Plan1ScenarioComparisonPanel";
import "../assignments/AssignmentWorkflow.css";

export function Plan1ScenarioBuilder({ activePlan }: { activePlan?: PlanContract | null }) {
  const planIsActivePlan1 = activePlan?.planId === "default-er-layout-plan-1";
  const assumptions = validatePlan1SimulationAssumptions(assumptionsFixture);
  const intensityProfiles = validatePlan1ScenarioIntensityProfiles(intensityProfileFixture);
  const taskTemplates = validatePlan1TaskTemplates(taskTemplateFixture);
  const scenarioState = validatePlan1ScenarioBuilderState(scenarioBuilderFixture, {
    assumptions,
    intensityProfiles,
    taskTemplates
  });
  const simulationInput = validatePlan1SimulationInput(simulationInputFixture, scenarioState);
  const generatedTaskSet = validatePlan1GeneratedTaskSet(seededTaskFixture.baselineTaskSet, simulationInput);
  const dryRun = runPlan1ShiftDryRun({
    simulationInput,
    generatedTaskSet
  });
  const summary = buildPlan1OperationalSummary(dryRun);
  const comparison = validatePlan1ScenarioComparisonFixture(comparisonFixture);

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
      <Plan1OperationalSummaryPanel summary={summary} />
      <Plan1ScenarioComparisonPanel comparison={comparison} />
    </div>
  );
}

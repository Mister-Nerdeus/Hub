import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  assertPlan1TimelineNarrativesHaveNoProhibitedClaims,
  buildPlan1TimelineNarratives,
  buildPlan1TimelineViewModel,
  explainPlan1Warnings,
  generatePlan1SeededSyntheticTasks,
  runPlan1ShiftDryRun,
  validatePlan1ScenarioBuilderState,
  validatePlan1ScenarioIntensityProfiles,
  validatePlan1SimulationAssumptions,
  validatePlan1SimulationInput,
  validatePlan1TaskTemplates,
  validatePlanContract,
  validateWalkingBaselineContract
} from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));
const plan = validatePlanContract(readJson("default-plans/default-er-layout-plan-1.json").plan);
const walkingBaseline = validateWalkingBaselineContract(
  readJson("default-plans/walking-baselines/default-er-layout-plan-1-walking-baseline.json")
);
const assumptions = validatePlan1SimulationAssumptions(readJson("scenarios/plan-1/assumptions-register.json"));
const intensityProfiles = validatePlan1ScenarioIntensityProfiles(readJson("scenarios/plan-1/scenario-intensity-profiles.json"));
const taskTemplates = validatePlan1TaskTemplates(readJson("scenarios/plan-1/task-templates.json"));
const scenarioState = validatePlan1ScenarioBuilderState(readJson("scenarios/plan-1/scenario-builder-baseline.json"), {
  assumptions,
  intensityProfiles,
  taskTemplates
});
const simulationInput = validatePlan1SimulationInput(readJson("scenarios/plan-1/simulation-input-baseline.json"), scenarioState);
const dryRun = runPlan1ShiftDryRun({
  simulationInput,
  generatedTaskSet: generatePlan1SeededSyntheticTasks(simulationInput),
  plan,
  walkingBaseline
});

test("Plan 1 timeline narratives expose deterministic queue, deferred, walking, and warning callouts", () => {
  const viewModel = buildPlan1TimelineViewModel(dryRun);
  const narratives = buildPlan1TimelineNarratives(viewModel, explainPlan1Warnings(dryRun.warningCodes));

  assert.equal(narratives.operationalOnlyLabel, "Operational-only Plan 1 timeline review");
  assert.match(narratives.highestQueueCallout.summary, /highest queue-depth signal/u);
  assert.match(narratives.deferredTasksCallout.summary, /deferred synthetic tasks/u);
  assert.match(narratives.walkingLoadCallout.summary, /approximate feet/u);
  assert.equal(narratives.warningCards.length, explainPlan1Warnings(dryRun.warningCodes).length);
  assert.equal(narratives.nonClaims.includes("Synthetic operational modeling only."), true);
});

test("Plan 1 timeline narratives are deterministic", () => {
  const viewModel = buildPlan1TimelineViewModel(dryRun);
  assert.deepEqual(
    buildPlan1TimelineNarratives(viewModel, explainPlan1Warnings(dryRun.warningCodes)),
    buildPlan1TimelineNarratives(viewModel, explainPlan1Warnings(dryRun.warningCodes))
  );
});

test("Plan 1 timeline narratives reject prohibited claim language", () => {
  const viewModel = buildPlan1TimelineViewModel(dryRun);
  const narratives = buildPlan1TimelineNarratives(viewModel, explainPlan1Warnings(dryRun.warningCodes));

  assert.throws(
    () => assertPlan1TimelineNarrativesHaveNoProhibitedClaims({
      ...narratives,
      highestQueueCallout: {
        ...narratives.highestQueueCallout,
        detail: "safe staffing"
      }
    }),
    /must not include/u
  );
});

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(fixturesDir, relativePath), "utf8"));
}

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  assertPlan1AssumptionViewModelComplete,
  assertRequiredPlan1WarningExplanations,
  buildPlan1AssumptionViewModel,
  buildPlan1OperationalSummary,
  buildPlan1ScenarioComparisonViewModel,
  buildPlan1ScenarioFromControls,
  buildPlan1SimulationProofReport,
  buildPlan1TimelineViewModel,
  createPlan1AssignmentWorkflowState,
  createPlan1BaselineScenarioControlState,
  explainPlan1Warnings,
  generatePlan1SeededSyntheticTasks,
  runPlan1ShiftDryRun,
  validatePlan1ScenarioBuilderState,
  validatePlan1ScenarioComparisonFixture,
  validatePlan1ScenarioControlState,
  validatePlan1ScenarioIntensityProfiles,
  validatePlan1SimulationAssumptions,
  validatePlan1SimulationInput,
  validatePlan1TaskTemplates,
  validatePlanContract
} from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));
const plan = validatePlanContract(readJson("default-plans/default-er-layout-plan-1.json").plan);
const walkingBaseline = readJson("default-plans/walking-baselines/default-er-layout-plan-1-walking-baseline.json");
const nurses = readJson("assignments/plan-1/synthetic-nurses.json").nurses;
const roomLoads = readJson("assignments/plan-1/room-loads-baseline.json").roomLoads;
const assignments = readJson("assignments/plan-1/manual-assignment-baseline.json").assignments;
const assumptions = validatePlan1SimulationAssumptions(readJson("scenarios/plan-1/assumptions-register.json"));
const intensityProfiles = validatePlan1ScenarioIntensityProfiles(readJson("scenarios/plan-1/scenario-intensity-profiles.json"));
const taskTemplates = validatePlan1TaskTemplates(readJson("scenarios/plan-1/task-templates.json"));
const scenarioState = validatePlan1ScenarioBuilderState(readJson("scenarios/plan-1/scenario-builder-baseline.json"), {
  assumptions,
  intensityProfiles,
  taskTemplates
});
const simulationInput = validatePlan1SimulationInput(readJson("scenarios/plan-1/simulation-input-baseline.json"), scenarioState);
const generatedTaskSet = generatePlan1SeededSyntheticTasks(simulationInput);
const dryRun = runPlan1ShiftDryRun({ simulationInput, generatedTaskSet, plan, walkingBaseline });
const comparison = validatePlan1ScenarioComparisonFixture(readJson("scenarios/plan-1/scenario-comparison-fixtures.json"));

test("Plan 1 assumptions view model exposes all required sections and non-claims", () => {
  const viewModel = buildPlan1AssumptionViewModel(assumptions);
  assertPlan1AssumptionViewModelComplete(viewModel);
  assert.equal(viewModel.mode, "read_only_proof");
});

test("Plan 1 scenario controls validate negative cases and produce deterministic input", () => {
  const baseline = createPlan1BaselineScenarioControlState({
    profileId: "plan-1-typical",
    seed: 4101,
    durationMinutes: 240,
    taskTemplates,
    limitations: scenarioState.limitations,
    nonClaims: scenarioState.nonClaims
  });
  const workflowState = createPlan1AssignmentWorkflowState({ plan, nurses, roomLoads, assignments });
  const first = buildPlan1ScenarioFromControls({
    controlState: baseline,
    references: { assumptions, intensityProfiles, taskTemplates, assignmentWorkflowState: workflowState }
  });
  const second = buildPlan1ScenarioFromControls({
    controlState: baseline,
    references: { assumptions, intensityProfiles, taskTemplates, assignmentWorkflowState: workflowState }
  });
  assert.deepEqual(first.simulationInput, second.simulationInput);

  const invalid = validatePlan1ScenarioControlState({
    ...baseline,
    selectedProfileId: "missing",
    seed: 1.5,
    durationMinutes: 0,
    selectedTaskTemplateIds: [taskTemplates[0].templateId, taskTemplates[0].templateId, "missing-template"]
  }, {
    profiles: intensityProfiles.map((profile) => profile.profileId),
    taskTemplateIds: taskTemplates.map((template) => template.templateId)
  });
  assert.equal(invalid.validationStatus, "invalid");
  assert.ok(invalid.validationMessages.length >= 4);
});

test("Plan 1 timeline view model summarizes nurse, room, queue, walking, and warning sections", () => {
  const viewModel = buildPlan1TimelineViewModel(dryRun);
  assert.equal(viewModel.nurseTimelineSummary.length, simulationInput.assignmentWorkflowState.nurses.length);
  assert.equal(viewModel.roomTimelineSummary.length, simulationInput.assignmentWorkflowState.roomLoads.length);
  assert.ok(viewModel.walkingLoadSummary.pathBasedTaskCount > 0);
  assert.ok(Array.isArray(viewModel.warningTimelineSummary));
});

test("Plan 1 warning explainability covers required warning codes without claim language", () => {
  assertRequiredPlan1WarningExplanations();
  const explanations = explainPlan1Warnings(["QUEUE_DEPTH_WARNING", "TASK_ROUTE_DISTANCE_FALLBACK"]);
  assert.equal(explanations.length, 2);
  assert.equal(explanations.every((entry) => entry.operationalInterpretation.length > 0), true);
});

test("Plan 1 comparison view model explains required comparison rows", () => {
  const viewModel = buildPlan1ScenarioComparisonViewModel(comparison);
  assert.equal(viewModel.requiredComparisons.typicalVsSlammed.profileId, "plan-1-slammed");
  assert.match(viewModel.narratives.requiredNarratives.typical_vs_walking_heavy.summary, /higher approximate walking load/u);
  assert.equal(viewModel.nonClaims.includes("Not a patient outcome prediction."), true);
});

test("Plan 1 proof report includes deterministic required sections", () => {
  const assumptionsViewModel = buildPlan1AssumptionViewModel(assumptions);
  const timelineViewModel = buildPlan1TimelineViewModel(dryRun);
  const comparisonViewModel = buildPlan1ScenarioComparisonViewModel(comparison);
  const report = buildPlan1SimulationProofReport({
    reportId: "plan-1-proof-report-test",
    scenarioState,
    assumptionsViewModel,
    generatedTaskSet,
    dryRun,
    timelineViewModel,
    warningExplanations: explainPlan1Warnings(dryRun.warningCodes),
    comparisonViewModel
  });
  const replay = buildPlan1SimulationProofReport({
    reportId: "plan-1-proof-report-test",
    scenarioState,
    assumptionsViewModel,
    generatedTaskSet,
    dryRun,
    timelineViewModel,
    warningExplanations: explainPlan1Warnings(dryRun.warningCodes),
    comparisonViewModel
  });
  assert.deepEqual(report, replay);
  assert.equal(report.sections.determinismProof.sameInputProducesSameReport, true);
  assert.equal(report.sections.warningExplanations.length, dryRun.warningCodes.length);
});

test("Plan 1 operational summary consumes refined walking totals", () => {
  const summary = buildPlan1OperationalSummary(dryRun);
  assert.equal(summary.totalApproxWalkingFeet, dryRun.nurseTimelineSummaries.reduce((total, nurse) => total + nurse.approxWalkingFeet, 0));
});

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(fixturesDir, relativePath), "utf8"));
}

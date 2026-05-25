import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  validatePlan1ScenarioBuilderState,
  validatePlan1ScenarioIntensityProfiles,
  validatePlan1SimulationAssumptions,
  validatePlan1SimulationInput,
  validatePlan1TaskTemplates
} from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));
const assumptions = validatePlan1SimulationAssumptions(readJson("scenarios/plan-1/assumptions-register.json"));
const intensityProfiles = validatePlan1ScenarioIntensityProfiles(readJson("scenarios/plan-1/scenario-intensity-profiles.json"));
const taskTemplates = validatePlan1TaskTemplates(readJson("scenarios/plan-1/task-templates.json"));
const scenarioState = validatePlan1ScenarioBuilderState(readJson("scenarios/plan-1/scenario-builder-baseline.json"), {
  assumptions,
  intensityProfiles,
  taskTemplates
});
const simulationInput = readJson("scenarios/plan-1/simulation-input-baseline.json");
const forbiddenField = ["diagnosis", "Text"].join("");

test("Plan 1 simulation input validates and derives from scenario state", () => {
  const input = validatePlan1SimulationInput(simulationInput, scenarioState);
  assert.equal(input.planId, "default-er-layout-plan-1");
  assert.equal(input.scenarioId, scenarioState.scenarioId);
  assert.equal(input.seed, scenarioState.seed);
  assert.equal(input.durationMinutes, scenarioState.durationMinutes);
  assert.equal(input.taskTemplates.length, scenarioState.taskTemplateIds.length);
});

test("Plan 1 simulation input rejects scope, mismatches, missing references, and PHI-like fields", () => {
  assert.throws(() => validatePlan1SimulationInput({ ...simulationInput, planId: "default-er-layout-plan-2" }, scenarioState), /planId/u);
  assert.throws(() => validatePlan1SimulationInput({ ...simulationInput, scenarioId: "wrong" }, scenarioState), /scenarioId/u);
  assert.throws(() => validatePlan1SimulationInput({ ...simulationInput, seed: simulationInput.seed + 1 }, scenarioState), /seed/u);
  assert.throws(() => validatePlan1SimulationInput({ ...simulationInput, durationMinutes: 1 }, scenarioState), /durationMinutes/u);
  assert.throws(() => validatePlan1SimulationInput({ ...simulationInput, assumptions: undefined }, scenarioState), /assumptions/u);
  assert.throws(() => validatePlan1SimulationInput({ ...simulationInput, taskTemplates: [] }, scenarioState), /taskTemplates/u);
  assert.throws(() => validatePlan1SimulationInput({ ...simulationInput, syntheticDataOnly: false }, scenarioState), /syntheticDataOnly/u);
  assert.throws(() => validatePlan1SimulationInput({ ...simulationInput, [forbiddenField]: "blocked" }, scenarioState), /forbidden/u);
});

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(fixturesDir, relativePath), "utf8"));
}

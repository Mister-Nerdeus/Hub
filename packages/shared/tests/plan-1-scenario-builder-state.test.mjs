import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  validatePlan1ScenarioBuilderState,
  validatePlan1ScenarioIntensityProfiles,
  validatePlan1SimulationAssumptions,
  validatePlan1TaskTemplates
} from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));
const assumptions = validatePlan1SimulationAssumptions(readJson("scenarios/plan-1/assumptions-register.json"));
const intensityProfiles = validatePlan1ScenarioIntensityProfiles(readJson("scenarios/plan-1/scenario-intensity-profiles.json"));
const taskTemplates = validatePlan1TaskTemplates(readJson("scenarios/plan-1/task-templates.json"));
const scenarioState = readJson("scenarios/plan-1/scenario-builder-baseline.json");
const references = { assumptions, intensityProfiles, taskTemplates };

test("Plan 1 scenario builder state validates canonical assignment workflow references", () => {
  const state = validatePlan1ScenarioBuilderState(scenarioState, references);
  assert.equal(state.planId, "default-er-layout-plan-1");
  assert.equal(state.assignmentWorkflowState.planId, "default-er-layout-plan-1");
  assert.equal(state.seed, 251001);
  assert.equal(state.taskTemplateIds.length, taskTemplates.length);
});

test("Plan 1 scenario builder state rejects invalid references and scope", () => {
  assert.throws(
    () => validatePlan1ScenarioBuilderState({ ...scenarioState, planId: "default-er-layout-plan-2" }, references),
    /planId/u
  );
  assert.throws(
    () =>
      validatePlan1ScenarioBuilderState(
        {
          ...scenarioState,
          assignmentWorkflowState: { ...scenarioState.assignmentWorkflowState, planId: "default-er-layout-plan-2" }
        },
        references
      ),
    /assignmentWorkflowState/u
  );
  assert.throws(
    () => validatePlan1ScenarioBuilderState({ ...scenarioState, intensityProfileId: "missing-profile" }, references),
    /intensityProfileId/u
  );
  assert.throws(
    () =>
      validatePlan1ScenarioBuilderState(
        { ...scenarioState, taskTemplateIds: [scenarioState.taskTemplateIds[0], scenarioState.taskTemplateIds[0]] },
        references
      ),
    /duplicate/u
  );
  assert.throws(
    () => validatePlan1ScenarioBuilderState({ ...scenarioState, seed: 1.5 }, references),
    /seed/u
  );
  assert.throws(
    () => validatePlan1ScenarioBuilderState({ ...scenarioState, durationMinutes: 0 }, references),
    /durationMinutes/u
  );
});

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(fixturesDir, relativePath), "utf8"));
}

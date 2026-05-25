import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  generatePlan1SeededSyntheticTasks,
  runPlan1ShiftDryRun,
  validatePlan1SimulationInput
} from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));
const simulationInput = validatePlan1SimulationInput(readJson("scenarios/plan-1/simulation-input-baseline.json"));
const taskSet = generatePlan1SeededSyntheticTasks(simulationInput);

test("Plan 1 dry-run produces deterministic nurse and room summaries", () => {
  const first = runPlan1ShiftDryRun({ simulationInput, generatedTaskSet: taskSet });
  const second = runPlan1ShiftDryRun({ simulationInput, generatedTaskSet: taskSet });
  assert.deepEqual(first, second);
  assert.equal(first.planId, "default-er-layout-plan-1");
  assert.equal(first.taskCount, taskSet.tasks.length);
  assert.equal(first.nurseTimelineSummaries.length, simulationInput.assignmentWorkflowState.nurses.length);
  assert.equal(first.roomTimelineSummaries.length, simulationInput.assignmentWorkflowState.roomLoads.length);
});

test("Plan 1 dry-run does not mutate simulation input", () => {
  const before = JSON.stringify(simulationInput);
  runPlan1ShiftDryRun({ simulationInput, generatedTaskSet: taskSet });
  assert.equal(JSON.stringify(simulationInput), before);
});

test("Plan 1 dry-run rejects invalid scope, task references, and missing non-claims", () => {
  assert.throws(
    () => runPlan1ShiftDryRun({ simulationInput: { ...simulationInput, planId: "default-er-layout-plan-2" }, generatedTaskSet: taskSet }),
    /Plan 1/u
  );
  assert.throws(
    () =>
      runPlan1ShiftDryRun({
        simulationInput,
        generatedTaskSet: { ...taskSet, tasks: [{ ...taskSet.tasks[0], roomId: "missing" }] }
      }),
    /roomId/u
  );
  assert.throws(
    () =>
      runPlan1ShiftDryRun({
        simulationInput: { ...simulationInput, nonClaims: [] },
        generatedTaskSet: taskSet
      }),
    /nonClaims|not be empty/u
  );
});

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(fixturesDir, relativePath), "utf8"));
}

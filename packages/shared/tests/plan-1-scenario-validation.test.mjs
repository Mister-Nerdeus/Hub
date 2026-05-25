import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  generatePlan1SeededSyntheticTasks,
  validatePlan1GeneratedTask,
  validatePlan1ScenarioTaskReferences,
  validatePlan1SimulationInput
} from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));
const simulationInput = validatePlan1SimulationInput(readJson("scenarios/plan-1/simulation-input-baseline.json"));
const taskSet = generatePlan1SeededSyntheticTasks(simulationInput);
const forbiddenField = ["medication", "Name"].join("");

test("Plan 1 scenario validation passes generated task references", () => {
  const result = validatePlan1ScenarioTaskReferences(taskSet, simulationInput);
  assert.equal(result.status, "passed");
  assert.equal(result.taskCount, taskSet.tasks.length);
});

test("Plan 1 scenario validation rejects invalid generated tasks", () => {
  const task = taskSet.tasks[0];
  assert.throws(() => validatePlan1GeneratedTask({ ...task, templateId: "missing" }, simulationInput), /templateId/u);
  assert.throws(() => validatePlan1GeneratedTask({ ...task, roomId: "missing" }, simulationInput), /roomId/u);
  assert.throws(() => validatePlan1GeneratedTask({ ...task, assignedNurseId: "missing" }, simulationInput), /assignedNurseId/u);
  assert.throws(() => validatePlan1GeneratedTask({ ...task, scheduledStartMinute: -1 }, simulationInput), /scheduledStartMinute/u);
  assert.throws(
    () => validatePlan1GeneratedTask({ ...task, scheduledStartMinute: simulationInput.durationMinutes + 1 }, simulationInput),
    /scheduledStartMinute/u
  );
  assert.throws(() => validatePlan1GeneratedTask({ ...task, estimatedDurationMinutes: 0 }, simulationInput), /estimatedDurationMinutes/u);
  assert.throws(() => validatePlan1GeneratedTask({ ...task, syntheticDataOnly: false }, simulationInput), /syntheticDataOnly/u);
  assert.throws(() => validatePlan1GeneratedTask({ ...task, [forbiddenField]: "blocked" }, simulationInput), /forbidden/u);
});

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(fixturesDir, relativePath), "utf8"));
}

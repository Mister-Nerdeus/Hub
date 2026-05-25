import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  generatePlan1SeededSyntheticTasks,
  validatePlan1GeneratedTaskSet,
  validatePlan1SimulationInput
} from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));
const simulationInput = validatePlan1SimulationInput(readJson("scenarios/plan-1/simulation-input-baseline.json"));

test("Plan 1 seeded task generation is deterministic for same seed and input", () => {
  const first = generatePlan1SeededSyntheticTasks(simulationInput);
  const second = generatePlan1SeededSyntheticTasks(simulationInput);
  assert.deepEqual(first, second);
  assert.ok(first.tasks.length > 0);
  validatePlan1GeneratedTaskSet(first, simulationInput);
});

test("Plan 1 seeded task generation changes ordering or timing for a different seed", () => {
  const first = generatePlan1SeededSyntheticTasks(simulationInput);
  const second = generatePlan1SeededSyntheticTasks({ ...simulationInput, seed: simulationInput.seed + 1 });
  assert.equal(first.tasks.length, second.tasks.length);
  assert.notDeepEqual(
    first.tasks.map((task) => [task.templateId, task.roomId, task.scheduledStartMinute]),
    second.tasks.map((task) => [task.templateId, task.roomId, task.scheduledStartMinute])
  );
});

test("Plan 1 seeded task generation references valid rooms, nurses, and templates only", () => {
  const taskSet = generatePlan1SeededSyntheticTasks(simulationInput);
  const roomIds = new Set(simulationInput.assignmentWorkflowState.roomLoads.map((roomLoad) => roomLoad.roomId));
  const nurseIds = new Set(simulationInput.assignmentWorkflowState.nurses.map((nurse) => nurse.nurseId));
  const templateIds = new Set(simulationInput.taskTemplates.map((template) => template.templateId));
  for (const task of taskSet.tasks) {
    assert.ok(roomIds.has(task.roomId));
    assert.ok(nurseIds.has(task.assignedNurseId));
    assert.ok(templateIds.has(task.templateId));
    assert.equal(task.syntheticDataOnly, true);
  }
});

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(fixturesDir, relativePath), "utf8"));
}

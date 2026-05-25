import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  generatePlan1SeededSyntheticTasks,
  resolvePlan1TaskWalkingDistance,
  summarizePlan1TaskWalkingDistances,
  validatePlan1SimulationInput,
  validatePlanContract
} from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));
const plan = validatePlanContract(readJson("default-plans/default-er-layout-plan-1.json").plan);
const walkingBaseline = readJson("default-plans/walking-baselines/default-er-layout-plan-1-walking-baseline.json");
const simulationInput = validatePlan1SimulationInput(readJson("scenarios/plan-1/simulation-input-baseline.json"));
const taskSet = generatePlan1SeededSyntheticTasks(simulationInput);
const walkingTask = taskSet.tasks.find((task) => task.requiresWalkingRoute);

test("Plan 1 task walking distance resolves route-found distances from path data", () => {
  assert.ok(walkingTask, "fixture must include a walking task");
  const output = resolvePlan1TaskWalkingDistance({
    simulationInput,
    task: walkingTask,
    plan,
    walkingBaseline
  });
  assert.equal(output.requiresWalkingRoute, true);
  assert.match(output.distanceSource, /walking_baseline|plan_1_path_graph/u);
  assert.ok(output.approxDistanceFeet > 0);
  assert.equal(output.nonClaims.includes("Not a clinical safety score."), true);
});

test("Plan 1 task walking distance emits missing-route warning without silent fake distance", () => {
  assert.ok(walkingTask, "fixture must include a walking task");
  const output = resolvePlan1TaskWalkingDistance({
    simulationInput,
    task: { ...walkingTask, roomId: "room-missing" },
    plan,
    walkingBaseline,
    allowFallback: false
  });
  assert.equal(output.distanceSource, "missing_route_warning");
  assert.equal(output.approxDistanceFeet, 0);
  assert.deepEqual(output.warningCodes, ["TASK_ROUTE_DISTANCE_MISSING"]);
});

test("Plan 1 task walking distance labels fallback constants explicitly", () => {
  assert.ok(walkingTask, "fixture must include a walking task");
  const output = resolvePlan1TaskWalkingDistance({
    simulationInput,
    task: { ...walkingTask, assignedNurseId: "nurse-missing" },
    plan,
    walkingBaseline,
    allowFallback: true
  });
  assert.equal(output.distanceSource, "fallback_constant");
  assert.equal(output.approxDistanceFeet, 120);
  assert.deepEqual(output.warningCodes, ["TASK_ROUTE_DISTANCE_FALLBACK", "TASK_ROUTE_DISTANCE_MISSING"]);
});

test("Plan 1 task walking distance surfaces stale path sync warnings", () => {
  assert.ok(walkingTask, "fixture must include a walking task");
  const staleInput = {
    ...simulationInput,
    assignmentWorkflowState: {
      ...simulationInput.assignmentWorkflowState,
      pathSyncStatus: "stale_warning"
    }
  };
  const output = resolvePlan1TaskWalkingDistance({
    simulationInput: staleInput,
    task: walkingTask,
    plan,
    walkingBaseline
  });
  assert.equal(output.warningCodes.includes("STALE_PATH_SYNC"), true);
});

test("Plan 1 task walking distance summary is deterministic", () => {
  const first = summarizePlan1TaskWalkingDistances({
    simulationInput,
    tasks: taskSet.tasks,
    plan,
    walkingBaseline,
    allowFallback: true
  });
  const second = summarizePlan1TaskWalkingDistances({
    simulationInput,
    tasks: taskSet.tasks,
    plan,
    walkingBaseline,
    allowFallback: true
  });
  assert.deepEqual(first, second);
  assert.ok(first.pathBasedTaskCount > 0);
});

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(fixturesDir, relativePath), "utf8"));
}

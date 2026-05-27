import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  createPlan1AssignmentWorkflowState,
  validatePlanContract
} from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));
const plan = validatePlanContract(readJson("default-plans/default-er-layout-plan-1.json").plan);
const nurses = readJson("assignments/plan-1/synthetic-nurses.json").nurses;
const roomLoads = readJson("assignments/plan-1/room-loads-baseline.json").roomLoads;
const assignments = readJson("assignments/plan-1/manual-assignment-baseline.json").assignments;

test("canonical Plan 1 assignment workflow state validates synthetic fixtures", () => {
  const state = createPlan1AssignmentWorkflowState({ plan, nurses, roomLoads, assignments });

  assert.equal(state.planId, "default-er-layout-plan-1");
  assert.equal(state.visualParityStatus, "valid");
  assert.equal(state.pathSyncStatus, "fresh");
  assert.equal(state.syntheticDataOnly, true);
  assert.equal(state.nurses.length, 4);
  assert.equal(state.roomLoads.length, 22);
  assert.equal(state.assignments.length, assignments.length);
  assert.ok(Array.isArray(state.validationWarnings));
});

test("canonical Plan 1 assignment workflow state carries stale path sync warnings", () => {
  const state = createPlan1AssignmentWorkflowState({
    plan,
    nurses,
    roomLoads,
    assignments,
    pathSyncStatus: "blocked"
  });

  assert.equal(state.pathSyncStatus, "blocked");
  assert.ok(state.validationWarnings.some((warning) => warning.code === "STALE_PATH_SYNC"));
});

test("canonical Plan 1 assignment workflow state rejects non-Plan-1 scope", () => {
  assert.throws(
    () =>
      createPlan1AssignmentWorkflowState({
        plan: { ...plan, planId: "default-er-layout-plan-2" },
        nurses,
        roomLoads,
        assignments
      }),
    /requires default-er-layout-plan-1/u
  );
});

test("canonical Plan 1 assignment workflow state rejects invalid runtime statuses", () => {
  assert.throws(
    () =>
      createPlan1AssignmentWorkflowState({
        plan,
        nurses,
        roomLoads,
        assignments,
        visualParityStatus: "invalid"
      }),
    /visualParityStatus valid/u
  );
  assert.throws(
    () =>
      createPlan1AssignmentWorkflowState({
        plan,
        nurses,
        roomLoads,
        assignments,
        pathSyncStatus: "unknown"
      }),
    /pathSyncStatus must be fresh/u
  );
});

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(fixturesDir, relativePath), "utf8"));
}

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  PLAN_1_BURDEN_SCORE_WEIGHTS,
  PLAN_1_SIMULATION_NON_CLAIMS,
  validatePlan1AssignmentsForOperations,
  validatePlan1SimulationAssumptions,
  validatePlanContract,
  validatePlan1ManualAssignments,
  validatePlan1NurseProfiles,
  validatePlan1RoomLoads
} from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));
const assumptions = readJson("scenarios/plan-1/assumptions-register.json");

test("Plan 1 simulation assumptions register validates required categories and non-claims", () => {
  const register = validatePlan1SimulationAssumptions(assumptions);
  for (const key of [
    "burdenScoreWeights",
    "walkingAssumptions",
    "taskDurationAssumptions",
    "taskFrequencyAssumptions",
    "scenarioIntensityAssumptions",
    "queueAssumptions",
    "handoffAssumptions",
    "interruptionAssumptions",
    "overloadThresholds",
    "statusSemantics",
    "nonClaims"
  ]) {
    assert.ok(Object.hasOwn(register, key), `${key} must exist`);
  }
  for (const nonClaim of PLAN_1_SIMULATION_NON_CLAIMS) {
    assert.ok(register.nonClaims.includes(nonClaim));
  }
});

test("Plan 1 burden score weights are represented without drift", () => {
  const register = validatePlan1SimulationAssumptions(assumptions);
  assert.deepEqual(register.burdenScoreWeights, PLAN_1_BURDEN_SCORE_WEIGHTS);
});

test("Plan 1 status semantics distinguish info from warning", () => {
  const register = validatePlan1SimulationAssumptions(assumptions);
  assert.equal(register.statusSemantics.info.blocksProgress, false);
  assert.equal(register.statusSemantics.warning.blocksProgress, false);
  assert.equal(register.statusSemantics.blocking.blocksProgress, true);

  const plan = validatePlanContract(readJson("default-plans/default-er-layout-plan-1.json").plan);
  const nurses = validatePlan1NurseProfiles(readJson("assignments/plan-1/synthetic-nurses.json").nurses, plan);
  const roomLoads = validatePlan1RoomLoads(readJson("assignments/plan-1/room-loads-baseline.json").roomLoads, plan);
  const assignments = validatePlan1ManualAssignments(
    readJson("assignments/plan-1/manual-assignment-baseline.json").assignments,
    plan,
    nurses
  );
  const result = validatePlan1AssignmentsForOperations({
    plan,
    nurses,
    roomLoads,
    assignments: [...assignments, { ...assignments[0], assignmentId: "info-only", roomId: "room-05" }],
    stalePathSync: false
  });
  assert.equal(result.status, "info");
});

test("Plan 1 assumptions reject missing non-claims and hidden weight drift", () => {
  assert.throws(
    () => validatePlan1SimulationAssumptions({ ...assumptions, nonClaims: [] }),
    /nonClaims|not be empty/u
  );
  assert.throws(
    () =>
      validatePlan1SimulationAssumptions({
        ...assumptions,
        burdenScoreWeights: { ...assumptions.burdenScoreWeights, occupiedRoom: 6 }
      }),
    /burdenScoreWeights/u
  );
});

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(fixturesDir, relativePath), "utf8"));
}

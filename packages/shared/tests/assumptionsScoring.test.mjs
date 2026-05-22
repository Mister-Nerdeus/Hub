import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import {
  assertDefaultScoringAssumptionParity,
  scoreNurseBurden,
  scoreNurseBurdenWithAssumptions,
  scoreRoomLoad,
  scoreRoomLoadWithAssumptions,
  validateAssumptionsRegisterContract,
  validatePlanContract,
  validateRoomLoads
} from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));

function readFixture(name) {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8"));
}

const assumptions = validateAssumptionsRegisterContract(readFixture("assumptions-basic.json"));
const parityFixture = readFixture("scoring/assumptions-scoring-parity.json");

test("default scoring assumptions match exported default constants", () => {
  assert.doesNotThrow(() => assertDefaultScoringAssumptionParity(assumptions));
});

test("parity failure names the mismatched assumption weight", () => {
  const changedAssumptions = structuredClone(assumptions);
  changedAssumptions.roomWorkloadWeights.highMedicationFrequency += 1;

  assert.throws(
    () => assertDefaultScoringAssumptionParity(changedAssumptions),
    new RegExp(parityFixture.expectedParityMismatchPattern)
  );
});

test("scoreRoomLoadWithAssumptions matches default scoring with assumptions-basic", () => {
  const roomLoads = validateRoomLoads(readFixture("room-loads-basic.json"));

  for (const roomLoad of roomLoads) {
    assert.deepEqual(
      scoreRoomLoadWithAssumptions(roomLoad, assumptions),
      scoreRoomLoad(roomLoad)
    );
  }
});

test("scoreRoomLoadWithAssumptions responds to changed assumptions without changing default scoring", () => {
  const roomLoad = validateRoomLoads(readFixture("room-loads-basic.json")).find(
    (candidate) => candidate.roomId === parityFixture.roomId
  );
  assert.ok(roomLoad);
  const changedAssumptions = structuredClone(assumptions);
  changedAssumptions.roomWorkloadWeights.highMedicationFrequency += 4;

  assert.equal(scoreRoomLoad(roomLoad).totalRoomBurden, parityFixture.expectedDefaultRoomBurden);
  assert.equal(
    scoreRoomLoadWithAssumptions(roomLoad, changedAssumptions).totalRoomBurden,
    parityFixture.expectedChangedRoomBurden
  );
});

test("scoreNurseBurdenWithAssumptions matches default scoring with assumptions-basic", () => {
  const plan = validatePlanContract(readFixture("plan-er-pod-phase2.json"));
  const roomLoads = validateRoomLoads(readFixture("room-loads-basic.json"));
  const assignmentSet = readFixture("manual-assignment-basic.json");

  assert.deepEqual(
    scoreNurseBurdenWithAssumptions(plan, roomLoads, assignmentSet, assumptions),
    scoreNurseBurden(plan, roomLoads, assignmentSet)
  );
  assert.deepEqual(
    scoreNurseBurden(plan, roomLoads, assignmentSet).nurseScores.map(({ nurseId, totalBurden }) => ({
      nurseId,
      totalBurden
    })),
    parityFixture.expectedNurseBurdenTotals
  );
});

test("scoreNurseBurdenWithAssumptions responds to changed nurse burden weights only", () => {
  const plan = validatePlanContract(readFixture("plan-er-pod-phase2.json"));
  const roomLoads = validateRoomLoads(readFixture("room-loads-basic.json"));
  const assignmentSet = readFixture("manual-assignment-basic.json");
  const changedAssumptions = structuredClone(assumptions);
  changedAssumptions.nurseBurdenWeights.overTargetPerRoom += 2;

  const defaultResult = scoreNurseBurden(plan, roomLoads, assignmentSet);
  const assumptionResult = scoreNurseBurdenWithAssumptions(
    plan,
    roomLoads,
    assignmentSet,
    changedAssumptions
  );
  const defaultAlpha = defaultResult.nurseScores.find((score) => score.nurseId === "nurse-alpha");
  const assumptionAlpha = assumptionResult.nurseScores.find(
    (score) => score.nurseId === "nurse-alpha"
  );

  assert.notEqual(assumptionAlpha.totalBurden, defaultAlpha.totalBurden);
  assert.deepEqual(scoreNurseBurden(plan, roomLoads, assignmentSet), defaultResult);
});

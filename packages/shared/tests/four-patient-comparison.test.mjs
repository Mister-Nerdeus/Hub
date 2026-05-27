import assert from "node:assert/strict";
import test from "node:test";

import { buildFourPatientManualAssignmentComparison } from "../dist/index.js";

test("four patient comparison proves equal counts can carry different burden", () => {
  const proof = buildFourPatientManualAssignmentComparison();
  const low = proof.burdenScores.find((score) => score.nurseId === proof.lowBurdenNurseId);
  const high = proof.burdenScores.find((score) => score.nurseId === proof.highBurdenNurseId);
  assert.ok(low);
  assert.ok(high);
  assert.equal(low.assignedRoomCount, 4);
  assert.equal(high.assignedRoomCount, 4);
  assert.notEqual(low.acuityBurden, high.acuityBurden);
  assert.notEqual(low.specialBurden, high.specialBurden);
  assert.notEqual(low.walkingBurden, high.walkingBurden);
  assert.notEqual(low.totalBurden, high.totalBurden);
  assert.ok(proof.warnings.length > 0);
});

test("four patient comparison is deterministic", () => {
  assert.deepEqual(buildFourPatientManualAssignmentComparison(), buildFourPatientManualAssignmentComparison());
});

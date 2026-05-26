import assert from "node:assert/strict";
import test from "node:test";

import {
  syntheticManualAssignmentRoomLoads,
  validateManualAssignmentRoomLoad
} from "../dist/index.js";

test("synthetic manual assignment room load defaults validate", () => {
  assert.equal(syntheticManualAssignmentRoomLoads.length, 3);
  for (const roomLoad of syntheticManualAssignmentRoomLoads) {
    assert.equal(validateManualAssignmentRoomLoad(roomLoad).syntheticDataOnly, true);
  }
});

test("room load contract rejects forbidden clinical and identity fields", () => {
  const base = syntheticManualAssignmentRoomLoads[0];
  assert.throws(() => validateManualAssignmentRoomLoad({ ...base, diagnosisText: "forbidden" }), /forbidden|not allowed/u);
  assert.throws(() => validateManualAssignmentRoomLoad({ ...base, clinicalNarrative: "forbidden" }), /forbidden|not allowed/u);
  assert.throws(() => validateManualAssignmentRoomLoad({ ...base, recordIdentifier: "forbidden" }), /forbidden|not allowed/u);
  assert.throws(() => validateManualAssignmentRoomLoad({ ...base, medicationName: "forbidden" }), /forbidden|not allowed/u);
  assert.throws(() => validateManualAssignmentRoomLoad({ ...base, freeText: "forbidden" }), /not allowed/u);
});

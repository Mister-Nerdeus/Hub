import assert from "node:assert/strict";
import test from "node:test";

import {
  syntheticManualAssignmentNurseProfiles,
  syntheticManualAssignmentRoomLoads,
  validateManualAssignmentStateSnapshot
} from "../dist/index.js";

function assignment(assignmentId, roomId, nurseId) {
  return {
    assignmentId,
    roomId,
    nurseId,
    primary: true,
    syntheticDataOnly: true
  };
}

test("manual assignment state snapshot validates synthetic deterministic state", () => {
  const snapshot = validateManualAssignmentStateSnapshot({
    nurses: syntheticManualAssignmentNurseProfiles,
    roomLoads: syntheticManualAssignmentRoomLoads,
    assignments: [assignment("assignment-room-101-nurse-blue", "room-101", "nurse-blue")],
    activeNurseId: "nurse-blue",
    syntheticDataOnly: true
  });

  assert.equal(snapshot.activeNurseId, "nurse-blue");
  assert.equal(snapshot.assignments.length, 1);
});

test("manual assignment state rejects duplicate primary room assignments", () => {
  assert.throws(
    () =>
      validateManualAssignmentStateSnapshot({
        nurses: syntheticManualAssignmentNurseProfiles,
        roomLoads: syntheticManualAssignmentRoomLoads,
        assignments: [
          assignment("assignment-room-101-nurse-blue", "room-101", "nurse-blue"),
          assignment("assignment-room-101-nurse-green", "room-101", "nurse-green")
        ],
        activeNurseId: "nurse-blue",
        syntheticDataOnly: true
      }),
    /duplicate primary assignment/u
  );
});

test("manual assignment state rejects unsupported active nurse and assignment references", () => {
  assert.throws(
    () =>
      validateManualAssignmentStateSnapshot({
        nurses: syntheticManualAssignmentNurseProfiles,
        roomLoads: syntheticManualAssignmentRoomLoads,
        assignments: [],
        activeNurseId: "unsupported-nurse",
        syntheticDataOnly: true
      }),
    /activeNurseId/u
  );

  assert.throws(
    () =>
      validateManualAssignmentStateSnapshot({
        nurses: syntheticManualAssignmentNurseProfiles,
        roomLoads: syntheticManualAssignmentRoomLoads,
        assignments: [assignment("assignment-room-999-nurse-blue", "room-999", "nurse-blue")],
        activeNurseId: "nurse-blue",
        syntheticDataOnly: true
      }),
    /unsupported roomId/u
  );
});

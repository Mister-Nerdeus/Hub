import assert from "node:assert/strict";
import test from "node:test";

import {
  buildManualAssignmentWarnings,
  syntheticManualAssignmentNurseProfiles,
  syntheticManualAssignmentRoomLoads
} from "../dist/index.js";

test("manual assignment warnings cover operational burden cases", () => {
  const warnings = buildManualAssignmentWarnings({
    nurses: syntheticManualAssignmentNurseProfiles.map((nurse) =>
      nurse.nurseId === "nurse-green" ? { ...nurse, targetPatientCount: 1, maxPatientCount: 1 } : nurse
    ),
    roomLoads: syntheticManualAssignmentRoomLoads.map((roomLoad) =>
      roomLoad.roomId === "room-101" ? { ...roomLoad, acuity: 4 } : roomLoad
    ),
    assignments: [
      { assignmentId: "assignment-room-101-nurse-green", roomId: "room-101", nurseId: "nurse-green", primary: true, syntheticDataOnly: true },
      { assignmentId: "assignment-room-102-nurse-green", roomId: "room-102", nurseId: "nurse-green", primary: true, syntheticDataOnly: true }
    ],
    walkingSummaries: [
      {
        nurseId: "nurse-green",
        assignedRoomCount: 2,
        stationToRoomDistance: 130,
        roomToRoomSpread: 90,
        clusterSpreadBurden: 2,
        estimatedWalkingBurdenUnits: 9,
        usedGraphDistance: true,
        fallbackDistanceCount: 0,
        visibleComponents: ["room spread 90"],
        syntheticDataOnly: true
      }
    ]
  });

  const codes = warnings.map((warning) => warning.code);
  assert.ok(codes.includes("OVER_TARGET_RATIO"));
  assert.ok(codes.includes("OVER_MAX_RATIO"));
  assert.ok(codes.includes("TRAUMA_QUALIFICATION_MISMATCH"));
  assert.ok(codes.includes("HIGH_ACUITY_CLUSTER"));
  assert.ok(codes.includes("ROOMS_TOO_SPREAD_OUT"));
  assert.ok(warnings.every((warning) => warning.visibleComponents.length > 0));
});

import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateManualBurdenScores,
  manualBurdenWeightRegister,
  syntheticManualAssignmentNurseProfiles,
  syntheticManualAssignmentRoomLoads
} from "../dist/index.js";

const walkingSummaries = [
  {
    nurseId: "nurse-blue",
    assignedRoomCount: 2,
    stationToRoomDistance: 130,
    roomToRoomSpread: 70,
    clusterSpreadBurden: 1,
    estimatedWalkingBurdenUnits: 8,
    usedGraphDistance: true,
    fallbackDistanceCount: 0,
    visibleComponents: ["station distance 130"],
    syntheticDataOnly: true
  }
];

test("manual burden weights are centralized editable operational assumptions", () => {
  assert.equal(manualBurdenWeightRegister.acuity[1], 1);
  assert.equal(manualBurdenWeightRegister.acuity[5], 10);
  assert.match(manualBurdenWeightRegister.description, /Editable operational assumptions/u);
});

test("manual burden score exposes visible component totals", () => {
  const scores = calculateManualBurdenScores({
    nurses: syntheticManualAssignmentNurseProfiles,
    roomLoads: syntheticManualAssignmentRoomLoads,
    assignments: [
      { assignmentId: "assignment-room-101-nurse-blue", roomId: "room-101", nurseId: "nurse-blue", primary: true, syntheticDataOnly: true },
      { assignmentId: "assignment-room-102-nurse-blue", roomId: "room-102", nurseId: "nurse-blue", primary: true, syntheticDataOnly: true }
    ],
    walkingSummaries
  });
  const blue = scores.find((score) => score.nurseId === "nurse-blue");
  assert.ok(blue);
  assert.equal(blue.assignedRoomCount, 2);
  assert.equal(blue.occupiedRoomCount, 2);
  assert.equal(blue.acuityBurden, 11);
  assert.equal(blue.traumaBurden, 8);
  assert.equal(blue.walkingBurden, 8);
  assert.equal(blue.roomSpreadPenalty, 1);
  assert.equal(blue.totalBurden, blue.acuityBurden + blue.traumaBurden + blue.specialBurden + blue.walkingBurden + blue.roomSpreadPenalty + blue.overRatioPenalty);
  assert.ok(blue.visibleComponents.some((component) => component.includes("acuity burden")));
});

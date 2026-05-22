import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import {
  validateManualAssignment,
  validatePlanContract,
  validateRoomLoads
} from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));

function readFixture(name) {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8"));
}

const plan = validatePlanContract(readFixture("plan-er-pod-phase2.json"));
const cases = readFixture("assignment/assignment-validation-cases.json");

for (const validationCase of cases) {
  test(`validateManualAssignment: ${validationCase.name}`, () => {
    const assignmentSet = buildAssignmentSet(validationCase);
    const roomLoads = validateRoomLoads(
      validationCase.roomLoads.map((roomLoad) => buildRoomLoad(roomLoad))
    );
    const result = validateManualAssignment(plan, roomLoads, assignmentSet);
    const codes = result.warnings.map((warning) => warning.code);

    for (const expectedCode of validationCase.expectedCodes) {
      assert.ok(codes.includes(expectedCode), `${expectedCode} must be reported`);
    }
    if (validationCase.expectedPerNurseAssignedOccupiedCounts != null) {
      assert.deepEqual(
        result.perNurseAssignedOccupiedCounts,
        validationCase.expectedPerNurseAssignedOccupiedCounts
      );
    }
    if (validationCase.expectedUnassignedOccupiedRoomIds != null) {
      assert.deepEqual(
        result.unassignedOccupiedRoomIds,
        validationCase.expectedUnassignedOccupiedRoomIds
      );
    }
  });
}

test("validateManualAssignment returns deterministic warning order", () => {
  const validationCase = cases.find((item) => item.name === "nurse over max");
  const assignmentSet = buildAssignmentSet(validationCase);
  const roomLoads = validateRoomLoads(validationCase.roomLoads.map((roomLoad) => buildRoomLoad(roomLoad)));

  const first = validateManualAssignment(plan, roomLoads, assignmentSet);
  const second = validateManualAssignment(plan, roomLoads, assignmentSet);

  assert.deepEqual(first.warnings, second.warnings);
});

function buildAssignmentSet(validationCase) {
  return {
    schemaVersion: "1.0.0",
    assignmentSetId: `case-${validationCase.name.replaceAll(" ", "-")}`,
    planId: plan.planId,
    name: validationCase.name,
    description: null,
    nurses: validationCase.nurses.map((nurse, index) => ({
      id: nurse.id,
      name: `Nurse ${index + 1}`,
      color: index === 0 ? "#2563eb" : "#059669",
      role: "primary",
      homeStationId: "station-primary",
      traumaQualified: nurse.traumaQualified,
      chargeQualified: false,
      psychQualified: false,
      triageQualified: false,
      maxPatients: nurse.maxPatients,
      targetPatients: nurse.targetPatients,
      walkingSpeedFeetPerMinute: 250,
      shiftStartMinute: 0,
      shiftEndMinute: 720,
      breakWindows: []
    })),
    assignments: validationCase.assignments.map((assignment) => ({
      id: assignment.id,
      nurseId: assignment.nurseId,
      roomIds: assignment.roomIds,
      assignmentType: "manual",
      startMinute: 0,
      endMinute: null
    }))
  };
}

function buildRoomLoad(roomLoad) {
  return {
    roomId: roomLoad.roomId,
    occupied: roomLoad.occupied,
    acuity: roomLoad.acuity,
    traumaActive: roomLoad.traumaActive,
    isolationActive: false,
    behavioralRisk: false,
    fallRisk: false,
    sitterRequired: false,
    medicationFrequency: "none",
    monitoringFrequency: "none",
    procedureBurden: "none",
    expectedTurnover: "normal"
  };
}

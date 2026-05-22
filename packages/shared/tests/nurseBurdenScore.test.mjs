import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import { scoreNurseBurden, validatePlanContract, validateRoomLoads } from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));

function readFixture(name) {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8"));
}

const plan = validatePlanContract(readFixture("plan-er-pod-phase2.json"));
const cases = readFixture("scoring/nurse-burden-cases.json");

for (const scoringCase of cases) {
  test(`scoreNurseBurden: ${scoringCase.name}`, () => {
    const assignmentSet = buildAssignmentSet(scoringCase);
    const roomLoads = validateRoomLoads(scoringCase.roomLoads.map((roomLoad) => buildRoomLoad(roomLoad)));
    const result = scoreNurseBurden(plan, roomLoads, assignmentSet);
    const score = scoringCase.expected.nurseId
      ? result.nurseScores.find((nurseScore) => nurseScore.nurseId === scoringCase.expected.nurseId)
      : undefined;

    if (scoringCase.expected.occupiedRoomCount != null) {
      assert.equal(score?.occupiedRoomCount, scoringCase.expected.occupiedRoomCount);
    }
    if (scoringCase.expected.minimumTotalBurden != null) {
      assert.ok((score?.totalBurden ?? 0) >= scoringCase.expected.minimumTotalBurden);
    }
    if (scoringCase.expected.overRatioPenalty != null) {
      assert.equal(score?.overRatioPenalty, scoringCase.expected.overRatioPenalty);
    }
    if (scoringCase.expected.traumaMismatchPenalty != null) {
      assert.equal(score?.traumaMismatchPenalty, scoringCase.expected.traumaMismatchPenalty);
    }
    if (scoringCase.expected.totalAcuityBurden != null) {
      assert.equal(score?.totalAcuityBurden, scoringCase.expected.totalAcuityBurden);
    }
    if (scoringCase.expected.warningCode != null) {
      assert.ok(
        result.warnings.some((warning) => warning.code === scoringCase.expected.warningCode),
        `${scoringCase.expected.warningCode} must be reported`
      );
    }
    if (scoringCase.expected.nurseScores != null) {
      for (const expectedScore of scoringCase.expected.nurseScores) {
        const nurseScore = result.nurseScores.find(
          (candidate) => candidate.nurseId === expectedScore.nurseId
        );
        assert.equal(nurseScore?.occupiedRoomCount, expectedScore.occupiedRoomCount);
        assert.equal(nurseScore?.totalBurden, expectedScore.totalBurden);
      }
    }
    for (const nurseScore of result.nurseScores) {
      assert.equal(nurseScore.activeTaskMinutes, 0);
      assert.equal(nurseScore.walkingMinutes, 0);
      assert.equal(nurseScore.breakCoveragePenalty, 0);
      assert.equal(nurseScore.interruptionPenalty, 0);
    }
  });
}

test("same occupied-room count with different acuity yields different burden", () => {
  const lowCase = cases.find((item) => item.name === "same count lower acuity");
  const highCase = cases.find((item) => item.name === "same count higher acuity");
  const lowResult = scoreNurseBurden(
    plan,
    validateRoomLoads(lowCase.roomLoads.map((roomLoad) => buildRoomLoad(roomLoad))),
    buildAssignmentSet(lowCase)
  );
  const highResult = scoreNurseBurden(
    plan,
    validateRoomLoads(highCase.roomLoads.map((roomLoad) => buildRoomLoad(roomLoad))),
    buildAssignmentSet(highCase)
  );

  assert.equal(lowResult.nurseScores[0].occupiedRoomCount, highResult.nurseScores[0].occupiedRoomCount);
  assert.notEqual(lowResult.nurseScores[0].totalBurden, highResult.nurseScores[0].totalBurden);
});

function buildAssignmentSet(scoringCase) {
  return {
    schemaVersion: "1.0.0",
    assignmentSetId: `case-${scoringCase.name.replaceAll(" ", "-")}`,
    planId: plan.planId,
    name: scoringCase.name,
    description: null,
    nurses: scoringCase.nurses.map((nurse, index) => ({
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
    assignments: scoringCase.assignments.map((assignment) => ({
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

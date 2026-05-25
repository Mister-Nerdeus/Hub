import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  buildPlan1AssignmentWalkingPreviews,
  scorePlan1AssignmentBurden,
  validatePlan1AssignmentsForOperations,
  validatePlan1ManualAssignments,
  validatePlan1NurseProfiles,
  validatePlan1RoomLoads,
  validatePlanContract
} from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));
const plan = validatePlanContract(readJson("default-plans/default-er-layout-plan-1.json").plan);
const nurses = validatePlan1NurseProfiles(readJson("assignments/plan-1/synthetic-nurses.json").nurses, plan);
const roomLoads = validatePlan1RoomLoads(readJson("assignments/plan-1/room-loads-baseline.json").roomLoads, plan);
const assignments = validatePlan1ManualAssignments(readJson("assignments/plan-1/manual-assignment-baseline.json").assignments, plan, nurses);

test("transparent burden score includes all required components", () => {
  const score = scoreFor(assignments, roomLoads).nurseScores[0];
  for (const key of [
    "assignedOccupiedRoomCount",
    "acuityLoadPoints",
    "traumaLoadPoints",
    "isolationLoadPoints",
    "behavioralRiskPoints",
    "sitterLoadPoints",
    "fallRiskPoints",
    "medicationBurdenPoints",
    "procedureBurdenPoints",
    "turnoverBurdenPoints",
    "walkingDistancePoints",
    "walkingTimePoints",
    "warningPenaltyPoints",
    "totalBurdenScore"
  ]) {
    assert.equal(typeof score[key], "number", `${key} must be numeric`);
  }
});

test("transparent burden score carries required operational non-claim text", () => {
  const result = scoreFor(assignments, roomLoads);
  for (const text of [
    "This is an operational comparison score only.",
    "It is not a clinical safety score.",
    "It is not a staffing compliance recommendation.",
    "It is not a patient outcome prediction."
  ]) {
    assert.ok(result.limitations.includes(text), `${text} must be present`);
    assert.ok(result.nurseScores.every((score) => score.limitations.includes(text)), `${text} must be present on nurse scores`);
  }
});

test("a 3-room assignment can score higher than a 4-room assignment when load and walking are worse", () => {
  const threeHeavy = assignments.filter((assignment) => ["room-level-1-trauma", "room-17", "room-21"].includes(assignment.roomId)).map((assignment) => ({ ...assignment, nurseId: "nurse-blue" }));
  const fourLight = ["room-02", "room-03", "room-04", "room-05"].map((roomId, index) => ({ ...assignments[0], assignmentId: `light-${index}`, roomId, nurseId: "nurse-green" }));
  const result = scoreFor([...threeHeavy, ...fourLight], roomLoads);
  assert.ok(result.nurseScores.find((score) => score.nurseId === "nurse-blue").totalBurdenScore > result.nurseScores.find((score) => score.nurseId === "nurse-green").totalBurdenScore);
});

test("two 4-room assignments score differently", () => {
  const result = scoreFor(assignments, roomLoads);
  const orange = result.nurseScores.find((score) => score.nurseId === "nurse-orange").totalBurdenScore;
  const purple = result.nurseScores.find((score) => score.nurseId === "nurse-purple").totalBurdenScore;
  assert.notEqual(orange, purple);
});

test("trauma mismatch adds warning penalty without safety wording", () => {
  const mismatch = assignments.map((assignment) => assignment.roomId === "room-level-1-trauma" ? { ...assignment, nurseId: "nurse-green" } : assignment);
  const result = scoreFor(mismatch, roomLoads);
  assert.ok(result.nurseScores.find((score) => score.nurseId === "nurse-green").warningPenaltyPoints > 0);
  assert.ok(result.limitations.every((text) => !/safe staffing|unsafe staffing/i.test(text)));
});

function scoreFor(scoreAssignments, scoreRoomLoads) {
  const validation = validatePlan1AssignmentsForOperations({ plan, nurses, roomLoads: scoreRoomLoads, assignments: scoreAssignments, stalePathSync: false });
  const walkingPreviews = buildPlan1AssignmentWalkingPreviews({ plan, nurses, assignments: scoreAssignments, stalePathSync: false });
  return scorePlan1AssignmentBurden({ nurses, roomLoads: scoreRoomLoads, assignments: scoreAssignments, walkingPreviews, warnings: validation.warnings });
}

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(fixturesDir, relativePath), "utf8"));
}

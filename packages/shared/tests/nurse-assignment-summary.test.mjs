import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  buildPlan1NurseAssignmentSummaries,
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
const warnings = validatePlan1AssignmentsForOperations({
  plan,
  nurses,
  roomLoads,
  assignments: assignments.map((assignment) =>
    assignment.roomId === "room-level-1-trauma" ? { ...assignment, nurseId: "nurse-green" } : assignment
  ),
  stalePathSync: false
}).warnings;

test("builds nurse assignment summaries for 0, 3, and 4 rooms", () => {
  const summaries = buildPlan1NurseAssignmentSummaries({ plan, nurses, roomLoads, assignments: assignments.slice(0, 10), warnings });
  assert.equal(summaries.find((summary) => summary.nurseId === "nurse-purple")?.assignedRoomIds.length, 0);
  assert.equal(summaries.find((summary) => summary.nurseId === "nurse-blue")?.assignedRoomIds.length, 3);
  assert.equal(summaries.find((summary) => summary.nurseId === "nurse-orange")?.assignedRoomIds.length, 4);
});

test("summary includes warning codes and limitations", () => {
  const summaries = buildPlan1NurseAssignmentSummaries({ plan, nurses, roomLoads, assignments, warnings });
  assert.ok(summaries.every((summary) => summary.limitations.length > 0));
  assert.ok(summaries.some((summary) => summary.warningCodes.includes("TRAUMA_ROOM_WITH_NON_TRAUMA_QUALIFIED_NURSE")));
});

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(fixturesDir, relativePath), "utf8"));
}

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
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

test("assignment validation reports all required warning codes", () => {
  const warningAssignments = [
    ...assignments.filter((assignment) => assignment.roomId !== "room-24"),
    { ...assignments[0], assignmentId: "duplicate-primary", nurseId: "nurse-green" },
    { ...assignments[0], assignmentId: "invalid-room", roomId: "room-missing" },
    { ...assignments[0], assignmentId: "invalid-nurse", nurseId: "nurse-red" },
    { ...assignments[0], assignmentId: "unoccupied-assigned", roomId: "room-05", nurseId: "nurse-green" }
  ];
  const overloadedNurses = nurses.map((nurse) =>
    nurse.nurseId === "nurse-orange" ? { ...nurse, targetPatientCount: 1, maxPatientCount: 1 } : nurse
  );
  const result = validatePlan1AssignmentsForOperations({
    plan,
    nurses: overloadedNurses,
    roomLoads,
    assignments: warningAssignments,
    stalePathSync: true
  });
  const codes = result.warnings.map((warning) => warning.code);
  for (const code of [
    "UNOCCUPIED_ASSIGNED_ROOM",
    "OCCUPIED_UNASSIGNED_ROOM",
    "NURSE_OVER_TARGET_RATIO",
    "NURSE_OVER_MAX_RATIO",
    "TRAUMA_ROOM_WITH_NON_TRAUMA_QUALIFIED_NURSE",
    "INVALID_ROOM_REFERENCE",
    "INVALID_NURSE_REFERENCE",
    "DUPLICATE_PRIMARY_ASSIGNMENT",
    "STALE_PATH_SYNC"
  ]) {
    assert.ok(codes.includes(code), `${code} must be reported`);
  }
  assert.equal(result.status, "blocking");
});

test("assignment validation reports missing and non-Plan-1 scope", () => {
  assert.ok(validatePlan1AssignmentsForOperations({ plan: null, nurses, roomLoads, assignments, stalePathSync: false }).warnings.some((warning) => warning.code === "NO_ACTIVE_PLAN_1_FLOORPLAN"));
  assert.ok(validatePlan1AssignmentsForOperations({ plan: { ...plan, planId: "default-er-layout-plan-2" }, nurses, roomLoads, assignments, stalePathSync: false }).warnings.some((warning) => warning.code === "NON_PLAN_1_ASSIGNMENT_SCOPE"));
});

test("assignment validation does not mutate assignment state", () => {
  const before = JSON.stringify(assignments);
  validatePlan1AssignmentsForOperations({ plan, nurses, roomLoads, assignments, stalePathSync: false });
  assert.equal(JSON.stringify(assignments), before);
});

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(fixturesDir, relativePath), "utf8"));
}

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  validatePlan1ManualAssignments,
  validatePlan1NurseProfiles,
  validatePlanContract
} from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));
const plan = validatePlanContract(readJson("default-plans/default-er-layout-plan-1.json").plan);
const nurses = validatePlan1NurseProfiles(readJson("assignments/plan-1/synthetic-nurses.json").nurses, plan);
const assignments = readJson("assignments/plan-1/manual-assignment-baseline.json").assignments;

test("validates Plan 1 manual assignment baseline", () => {
  assert.equal(validatePlan1ManualAssignments(assignments, plan, nurses).length, assignments.length);
});

test("rejects duplicate primary assignment for one room", () => {
  assert.throws(
    () => validatePlan1ManualAssignments([...assignments, { ...assignments[0], assignmentId: "duplicate", nurseId: "nurse-green" }], plan, nurses),
    /duplicate primary room assignment/
  );
});

test("rejects invalid room and nurse references", () => {
  assert.throws(() => validatePlan1ManualAssignments([{ ...assignments[0], roomId: "room-99" }], plan, nurses), /Plan 1 room/);
  assert.throws(() => validatePlan1ManualAssignments([{ ...assignments[0], nurseId: "nurse-red" }], plan, nurses), /synthetic Plan 1 nurse/);
});

test("rejects synthetic flag false", () => {
  assert.throws(() => validatePlan1ManualAssignments([{ ...assignments[0], syntheticDataOnly: false }], plan, nurses), /must be true/);
});

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(fixturesDir, relativePath), "utf8"));
}

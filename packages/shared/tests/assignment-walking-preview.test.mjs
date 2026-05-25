import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  buildPlan1AssignmentWalkingPreviews,
  validatePlan1ManualAssignments,
  validatePlan1NurseProfiles,
  validatePlanContract
} from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));
const plan = validatePlanContract(readJson("default-plans/default-er-layout-plan-1.json").plan);
const nurses = validatePlan1NurseProfiles(readJson("assignments/plan-1/synthetic-nurses.json").nurses, plan);
const assignments = validatePlan1ManualAssignments(readJson("assignments/plan-1/manual-assignment-baseline.json").assignments, plan, nurses);

test("walking preview reports reachable 3-room and 4-room assignments", () => {
  const previews = buildPlan1AssignmentWalkingPreviews({ plan, nurses, assignments, stalePathSync: false });
  assert.equal(previews.find((preview) => preview.nurseId === "nurse-blue")?.reachableRoomCount, 3);
  assert.equal(previews.find((preview) => preview.nurseId === "nurse-orange")?.reachableRoomCount, 4);
  assert.ok((previews.find((preview) => preview.nurseId === "nurse-orange")?.totalApproxDistanceFeet ?? 0) > 0);
});

test("walking preview reports unreachable and stale path warnings", () => {
  const brokenPlan = {
    ...plan,
    pathEdges: plan.pathEdges.filter(
      (edge) => edge.fromNodeId !== "node-door-room-02" && edge.toNodeId !== "node-door-room-02"
    )
  };
  const previews = buildPlan1AssignmentWalkingPreviews({ plan: brokenPlan, nurses, assignments: assignments.slice(0, 1).map((assignment) => ({ ...assignment, roomId: "room-02" })), stalePathSync: true });
  assert.equal(previews[0].unreachableRoomCount, 1);
  assert.ok(previews[0].warningCodes.includes("STALE_PATH_SYNC"));
});

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(fixturesDir, relativePath), "utf8"));
}

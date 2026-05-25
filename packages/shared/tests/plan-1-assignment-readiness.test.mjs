import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { auditPlan1AssignmentReadiness, makeStalePathSyncWarning, validatePlanContract } from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));
const plan = validatePlanContract(readJson("default-plans/default-er-layout-plan-1.json").plan);
const walkingBaseline = readJson("default-plans/walking-baselines/default-er-layout-plan-1-walking-baseline.json");

test("Plan 1 assignment readiness passes semantic gate", () => {
  const audit = auditPlan1AssignmentReadiness({ plan, walkingBaseline });
  assert.equal(audit.status, "passed");
  assert.equal(audit.roomCount, 23);
  assert.equal(audit.nurseStationCount, 2);
  assert.equal(audit.walkingBaselineUnreachableRouteCount, 0);
  assert.equal(audit.room17AssignmentClass, "assignment_patient_care");
  assert.equal(audit.providerPharmacySupportClassified, true);
  assert.equal(audit.scaffoldZonesNonAssignment, true);
  assert.deepEqual(audit.oldSimplifiedPlanLabelsRemaining, []);
});

test("stale path sync warning is blocking before walking-aware routing", () => {
  const warning = makeStalePathSyncWarning();
  assert.equal(warning.code, "STALE_PATH_SYNC");
  assert.equal(warning.severity, "blocking");
  assert.equal(warning.deferredSync.pathEdges, "preserved_from_source_plan");
});

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(fixturesDir, relativePath), "utf8"));
}

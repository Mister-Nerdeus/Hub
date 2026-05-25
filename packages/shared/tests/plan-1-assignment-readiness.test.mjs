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

test("Room 17 remains assignment patient-care even when its zone is provider pharmacy support", () => {
  const room17 = plan.rooms.find((room) => room.id === "room-17");
  const room17Zone = plan.zones.find((zone) => zone.id === room17.zoneId);
  const audit = auditPlan1AssignmentReadiness({ plan, walkingBaseline });
  assert.equal(room17Zone.zoneOperationalMetadata.zoneClass, "support");
  assert.equal(room17.roomOperationalMetadata.roomClass, "standard");
  assert.equal(audit.room17AssignmentClass, "assignment_patient_care");
});

test("Room 17 readiness fails if room operational metadata is missing", () => {
  const missingMetadataPlan = structuredClone(plan);
  const room17 = missingMetadataPlan.rooms.find((room) => room.id === "room-17");
  room17.roomOperationalMetadata = null;
  const audit = auditPlan1AssignmentReadiness({ plan: missingMetadataPlan, walkingBaseline });
  assert.equal(audit.status, "failed");
  assert.equal(audit.room17AssignmentClass, "not_assignment_patient_care");
  assert.ok(audit.failures.includes("ROOM_17_ASSIGNMENT_PATIENT_CARE_CLASS_MISSING"));
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

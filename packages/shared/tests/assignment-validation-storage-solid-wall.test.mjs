import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  validateDefaultSavedPlanFixtureContract,
  validatePlan1AssignmentsForOperations
} from "../dist/index.js";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));

test("Plan 1 assignment validation rejects canonical storage assignment and room load", () => {
  const fixture = validateDefaultSavedPlanFixtureContract(
    JSON.parse(readFileSync(join(repoRoot, "packages/shared/fixtures/default-plans/default-er-layout-plan-1.json"), "utf8")),
    {
      sourcePlanIds: new Set(["source-er-layout-plan-1"]),
      mappingIds: new Set(["mapping-er-layout-plan-1"])
    }
  );
  const result = validatePlan1AssignmentsForOperations({
    plan: fixture.plan,
    nurses: [{
      nurseId: "nurse-blue",
      displayName: "Nurse Blue",
      color: "#2563eb",
      role: "primary",
      homeStationId: "station-left",
      targetPatientCount: 4,
      maxPatientCount: 4,
      traumaQualified: true,
      chargeQualified: false,
      triageQualified: false,
      behavioralHealthComfort: true,
      walkingSpeedFeetPerMinute: 250,
      syntheticDataOnly: true
    }],
    roomLoads: [{
      roomId: "room-14",
      occupied: true,
      acuityLevel: "medium",
      traumaActive: false,
      isolationActive: false,
      behavioralRisk: false,
      sitterRequired: false,
      fallRisk: false,
      monitoringIntensity: "low",
      medicationBurden: "low",
      procedureBurden: "none",
      turnoverExpected: false,
      notesCode: "none",
      syntheticDataOnly: true
    }],
    assignments: [{
      assignmentId: "assignment-storage",
      roomId: "room-14",
      nurseId: "nurse-blue",
      assignmentType: "primary",
      startMinute: 0,
      endMinute: null,
      source: "manual",
      syntheticDataOnly: true
    }],
    stalePathSync: false
  });
  assert.equal(result.status, "blocking");
  assert.equal(result.warnings.some((warning) => warning.summary.includes("excluded from nurse assignment")), true);
  assert.equal(result.warnings.some((warning) => warning.summary.includes("excluded from nurse assignment")), true);
});

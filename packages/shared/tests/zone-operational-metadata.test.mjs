import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import {
  NO_PHI_RUNTIME_REJECTION_CODE,
  validatePlanContract
} from "../dist/index.js";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const fixturesDir = join(repoRoot, "packages", "shared", "fixtures");
const evidenceDir = join(repoRoot, "docs", "verification", "issues", "issue-200");

function readFixture(name) {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8"));
}

function writeEvidence(name, payload) {
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(join(evidenceDir, name), `${JSON.stringify(payload, null, 2)}\n`);
}

function assertRuntimeRejection(action, rejectedValue) {
  assert.throws(
    action,
    (error) => {
      assert.match(error.message, new RegExp(NO_PHI_RUNTIME_REJECTION_CODE));
      assert.equal(error.message.includes(rejectedValue), false);
      return true;
    }
  );
}

test("ER zone taxonomy and metadata validate in representative fixture zones", () => {
  const plan = validatePlanContract(readFixture("plan-er-pod-phase2.json"));
  const zoneTypes = plan.zones.map((zone) => zone.zoneType);

  assert.deepEqual(zoneTypes, [
    "provider_area",
    "hallway",
    "trauma_zone",
    "ems_entry",
    "supply_storage"
  ]);
  assert.equal(plan.zones[0].zoneOperationalMetadata.zoneClass, "patient_care");
  assert.equal(plan.zones[1].zoneOperationalMetadata.supportsPatientFlow, true);
  assert.equal(plan.zones[4].zoneOperationalMetadata.staffOnly, true);

  writeEvidence("er-zone-taxonomy-output.json", {
    issue: "200",
    status: "passed",
    zoneTypes,
    zoneClasses: plan.zones.map((zone) => zone.zoneOperationalMetadata?.zoneClass)
  });
});

test("zone fixture migration keeps representative ER zones valid", () => {
  const plan = validatePlanContract(readFixture("plan-er-pod-phase2.json"));

  assert.equal(plan.zones.some((zone) => zone.zoneType === "supply_storage"), true);
  assert.equal(plan.zones.every((zone) => zone.zoneOperationalMetadata != null), true);

  writeEvidence("zone-fixture-validation-output.json", {
    issue: "200",
    status: "passed",
    fixture: "plan-er-pod-phase2.json",
    zoneCount: plan.zones.length,
    supplyStorageMigrated: true,
    allZonesHaveOperationalMetadata: true
  });
});

test("zone taxonomy and metadata reject invalid enum and narrative fields", () => {
  const invalidType = readFixture("plan-er-pod-phase2.json");
  invalidType.zones[0].zoneType = "storage";
  assert.throws(() => validatePlanContract(invalidType), /zones\[0\]\.zoneType must be one of/);

  const invalidClass = readFixture("plan-er-pod-phase2.json");
  invalidClass.zones[0].zoneOperationalMetadata.zoneClass = "clinical";
  assert.throws(
    () => validatePlanContract(invalidClass),
    /zones\[0\]\.zoneOperationalMetadata\.zoneClass must be one of/
  );

  const rejectedValue = "Narrative zone metadata";
  const freeText = readFixture("plan-er-pod-phase2.json");
  freeText.zones[0].zoneOperationalMetadata.freeText = rejectedValue;
  assert.throws(
    () => validatePlanContract(freeText),
    (error) => {
      assert.match(error.message, /zoneOperationalMetadata\.freeText is not allowed/);
      assert.equal(error.message.includes(rejectedValue), false);
      return true;
    }
  );
});

test("zone labels remain no-PHI guarded", () => {
  const rejectedLabel = ["John", "Smith"].join(" ");
  const badLabel = readFixture("plan-er-pod-phase2.json");
  badLabel.zones[0].label = rejectedLabel;
  assertRuntimeRejection(() => validatePlanContract(badLabel), rejectedLabel);

  writeEvidence("no-phi-zone-label-output.json", {
    issue: "200",
    status: "passed",
    zoneLabelGuarded: true,
    rejectionCode: NO_PHI_RUNTIME_REJECTION_CODE,
    rejectedValuesEchoed: false
  });
});

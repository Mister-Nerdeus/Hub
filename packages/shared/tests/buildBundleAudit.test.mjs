import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import {
  buildBundleAuditFromJson,
  validateBundleAuditTrailContract
} from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));
const exportFixturesDir = join(fixturesDir, "export");
const invalidFixturesDir = join(fixturesDir, "invalid");

function readExportText(name) {
  return readFileSync(join(exportFixturesDir, name), "utf8");
}

function readExportFixture(name) {
  return JSON.parse(readExportText(name));
}

function readInvalidText(name) {
  return readFileSync(join(invalidFixturesDir, name), "utf8");
}

test("valid bundle audit output is deterministic and validates", () => {
  const jsonText = readExportText("report-export-bundle-basic.json");
  const first = buildBundleAuditFromJson(jsonText);
  const second = buildBundleAuditFromJson(jsonText);

  assert.equal(first.ok, true);
  assert.deepEqual(first, second);
  assert.deepEqual(first, readExportFixture("bundle-audit-output.json"));
  assert.ok(first.integrity?.canonicalJsonHash);
  assert.equal(validateBundleAuditTrailContract(first.auditTrail).validationStatus, "passed");
});

test("invalid JSON returns a failed local audit trail", () => {
  const result = buildBundleAuditFromJson(readInvalidText("export-bundle-invalid-json.txt"));

  assert.equal(result.ok, false);
  assert.equal(result.summary.exportId, "unavailable");
  assert.equal(result.auditTrail.validationStatus, "failed");
  assert.equal(result.auditTrail.reviewSteps[0].status, "failed");
  assert.equal(result.auditTrail.reviewSteps[1].status, "not_run");
  assert.equal(validateBundleAuditTrailContract(result.auditTrail).validationStatus, "failed");
});

test("invalid bundle JSON returns a failed validation step", () => {
  const result = buildBundleAuditFromJson(
    JSON.stringify(JSON.parse(readInvalidText("export-bundle-safety-claim.json")))
  );

  assert.equal(result.ok, false);
  assert.equal(result.auditTrail.reviewSteps[0].status, "passed");
  assert.equal(result.auditTrail.reviewSteps[1].status, "failed");
});

test("valid bundle audit includes deterministic summary fields", () => {
  const result = buildBundleAuditFromJson(readExportText("report-export-bundle-basic.json"));

  assert.equal(result.summary.exportId, "report-export-bundle-basic");
  assert.deepEqual(result.summary.scenarioIds, [
    "shift-scenario-basic",
    "shift-scenario-surge"
  ]);
  assert.deepEqual(result.summary.reportIds, [
    "operational-summary-generated-task-set-basic",
    "operational-summary-generated-task-set-surge"
  ]);
});

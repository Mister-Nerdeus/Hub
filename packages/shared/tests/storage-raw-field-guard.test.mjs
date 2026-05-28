import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import {
  buildCanonicalCapacityCountReport,
  buildStorageRawFieldGuardReport
} from "../dist/index.js";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const evidenceDir = join(repoRoot, "docs", "verification", "issues", "issue-546");
const plan = JSON.parse(readFileSync(join(repoRoot, "packages", "shared", "fixtures", "default-plans", "default-er-layout-plan-1.json"), "utf8")).plan;

function writeEvidence(name, payload) {
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(join(evidenceDir, name), `${JSON.stringify(payload, null, 2)}\n`);
}

test("canonical storage raw room-like fields are audited and ignored by selectors", () => {
  const storage = plan.rooms.find((room) => room.id === "room-14");
  const report = buildStorageRawFieldGuardReport(storage);

  assert.equal(report.rawFieldRiskPresent, true);
  assert.equal(report.rawFieldAudit.maxPatients, 1);
  assert.equal(report.rawFieldAudit.hasPathNodeId, true);
  assert.equal(report.selectorExclusion.occupancyType, "storage");
  assert.equal(report.selectorExclusion.bedCountContribution, 0);
  assert.equal(report.selectorExclusion.physicalRoomCountContribution, 0);
  assert.equal(report.selectorExclusion.assignmentEligible, false);
  assert.equal(report.selectorExclusion.ratioEligible, false);
  assert.equal(report.selectorExclusion.roomLoadEligible, false);
  assert.equal(report.futureDriftNegative.storageWithRoomLikeRawFieldsStillExcluded, true);

  writeEvidence("storage-raw-field-audit-output.json", report.rawFieldAudit);
  writeEvidence("storage-selector-ignore-proof.json", report.selectorExclusion);
  writeEvidence("storage-future-drift-negative-output.json", report.futureDriftNegative);
});

test("capacity report keeps storage excluded despite room-like raw fields", () => {
  const report = buildCanonicalCapacityCountReport();

  assert.equal(report.storageCount, 1);
  assert.equal(report.excludedByType.storage, 1);
  assert.equal(report.ratioEligibleCount, 22);
  assert.equal(report.assignmentEligibleCount, 22);

  writeEvidence("storage-capacity-exclusion-output.json", {
    status: "passed",
    storageCount: report.storageCount,
    excludedByType: report.excludedByType,
    ratioEligibleCount: report.ratioEligibleCount,
    assignmentEligibleCount: report.assignmentEligibleCount
  });
});

import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import { buildCanonicalCapacityCountReport } from "../dist/index.js";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const evidenceDir = join(repoRoot, "docs", "verification", "issues", "issue-545");

function writeEvidence(name, payload) {
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(join(evidenceDir, name), `${JSON.stringify(payload, null, 2)}\n`);
}

test("canonical capacity count report separates rooms, beds, split bays, and exclusions", () => {
  const report = buildCanonicalCapacityCountReport();

  assert.equal(report.source, "semantic_selectors");
  assert.equal(report.physicalRoomCount, 18);
  assert.equal(report.bedPositionCount, 22);
  assert.equal(report.splitBayCount, 4);
  assert.equal(report.ordinaryPatientRoomCount, 14);
  assert.equal(report.storageCount, 1);
  assert.equal(report.supportAreaCount, 3);
  assert.equal(report.hallwayCorridorCount, 7);
  assert.equal(report.excludedCount, 11);
  assert.equal(report.ratioEligibleCount, 22);
  assert.equal(report.assignmentEligibleCount, 22);

  writeEvidence("capacity-count-report-output.json", report);
  writeEvidence("physical-room-count-output.json", { status: "passed", physicalRoomCount: report.physicalRoomCount });
  writeEvidence("bed-position-count-output.json", { status: "passed", bedPositionCount: report.bedPositionCount });
  writeEvidence("split-bay-count-output.json", { status: "passed", splitBayCount: report.splitBayCount });
  writeEvidence("excluded-space-count-output.json", { status: "passed", excludedCount: report.excludedCount, excludedByType: report.excludedByType });
  writeEvidence("ratio-eligible-count-output.json", { status: "passed", ratioEligibleCount: report.ratioEligibleCount });
  writeEvidence("assignment-eligible-count-output.json", { status: "passed", assignmentEligibleCount: report.assignmentEligibleCount });
});

test("capacity report documents selector-driven counting instead of raw room fields", () => {
  const report = buildCanonicalCapacityCountReport();

  assert.match(report.selectorNotes.join(" "), /selectors/);
  assert.equal(report.excludedByType.storage, 1);
  assert.equal(report.ratioEligibleCount, report.bedPositionCount);
  assert.equal(report.assignmentEligibleCount, report.bedPositionCount);
});

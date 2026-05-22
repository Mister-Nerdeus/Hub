import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import { buildWarningReport, validateOperationalReportContract } from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));
const taskFixturesDir = join(fixturesDir, "tasks");
const reportFixturesDir = join(fixturesDir, "reports");

function readFixture(name) {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8"));
}

function readTaskFixture(name) {
  return JSON.parse(readFileSync(join(taskFixturesDir, name), "utf8"));
}

function readReportFixture(name) {
  return JSON.parse(readFileSync(join(reportFixturesDir, name), "utf8"));
}

function buildInput() {
  return {
    scenario: readFixture("shift-scenario-basic.json"),
    generatedTaskSet: readTaskFixture("generated-task-set-basic.json"),
    timelineSummary: readTaskFixture("task-timeline-basic.json"),
    nurseTaskAssignmentResult: readTaskFixture("nurse-task-assignments-basic.json"),
    manualAssignmentSet: readFixture("manual-assignment-basic.json")
  };
}

test("buildWarningReport exposes deterministic warning severity and code aggregation", () => {
  const report = buildWarningReport(buildInput());

  assert.deepEqual(report, readReportFixture("warning-report-output.json"));
  assert.equal(report.warningSummary.warningCount, 1);
  assert.equal(report.warningSummary.infoCount, 0);
  assert.equal(report.warningSummary.criticalCount, 0);
  assert.deepEqual(report.warningSummary.warningCodes, {
    ROOM_WITHOUT_COVERAGE: 1
  });
  assert.doesNotThrow(() => validateOperationalReportContract(report));
});

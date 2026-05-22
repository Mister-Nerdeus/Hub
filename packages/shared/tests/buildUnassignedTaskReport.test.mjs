import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import { buildUnassignedTaskReport, validateOperationalReportContract } from "../dist/index.js";

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

test("buildUnassignedTaskReport exposes deterministic unassigned task IDs and room IDs", () => {
  const report = buildUnassignedTaskReport(buildInput());

  assert.deepEqual(report, readReportFixture("unassigned-task-report-output.json"));
  assert.deepEqual(report.unassignedTaskSummary.taskIds, [
    "task-basic-hall-bed-01-turnover-001"
  ]);
  assert.deepEqual(report.unassignedTaskSummary.roomIds, ["hall-bed-01"]);
  assert.doesNotThrow(() => validateOperationalReportContract(report));
});

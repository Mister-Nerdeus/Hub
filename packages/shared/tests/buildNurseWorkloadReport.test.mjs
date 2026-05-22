import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import { buildNurseWorkloadReport } from "../dist/index.js";

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

test("buildNurseWorkloadReport creates deterministic per-nurse workload output", () => {
  const report = buildNurseWorkloadReport(buildInput());

  assert.deepEqual(report, readReportFixture("nurse-workload-report-output.json"));
  assert.equal(report.reportType, "nurse_workload");
  assert.deepEqual(
    report.nurseSummaries.map((summary) => [
      summary.nurseId,
      summary.assignedTaskCount,
      summary.estimatedTaskMinutes
    ]),
    [
      ["nurse-alpha", 2, 18],
      ["nurse-bravo", 1, 15],
      ["nurse-charlie", 2, 25]
    ]
  );
});

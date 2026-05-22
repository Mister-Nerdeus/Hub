import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import {
  buildOperationalSummaryReport,
  validateOperationalReportContract,
  validateShiftScenarioContract
} from "../dist/index.js";

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
    scenario: validateShiftScenarioContract(readFixture("shift-scenario-basic.json")),
    generatedTaskSet: readTaskFixture("generated-task-set-basic.json"),
    timelineSummary: readTaskFixture("task-timeline-basic.json"),
    nurseTaskAssignmentResult: readTaskFixture("nurse-task-assignments-basic.json"),
    manualAssignmentSet: readFixture("manual-assignment-basic.json")
  };
}

test("buildOperationalSummaryReport creates deterministic validated summary output", () => {
  const report = buildOperationalSummaryReport(buildInput());

  assert.deepEqual(report, readReportFixture("operational-summary-report-output.json"));
  assert.doesNotThrow(() =>
    validateOperationalReportContract(report, {
      scenario: buildInput().scenario,
      generatedTaskSet: buildInput().generatedTaskSet,
      nurseTaskAssignmentSet: buildInput().nurseTaskAssignmentResult.assignmentSet,
      manualAssignmentSet: buildInput().manualAssignmentSet,
      warnings: buildInput().nurseTaskAssignmentResult.warnings
    })
  );
});

test("buildOperationalSummaryReport rejects mismatched timeline input", () => {
  const input = buildInput();
  input.timelineSummary.totalTaskCount += 1;

  assert.throws(() => buildOperationalSummaryReport(input), /totalTaskCount/);
});

test("buildOperationalSummaryReport includes required operational limitations", () => {
  const report = buildOperationalSummaryReport(buildInput());
  const limitationText = report.limitations.join(" ");

  assert.match(limitationText, /Operational-only/);
  assert.match(limitationText, /No optimizer/);
  assert.match(limitationText, /No task-completion simulation/);
  assert.match(limitationText, /No walking route calculation/);
  assert.match(limitationText, /No delay calculation/);
});

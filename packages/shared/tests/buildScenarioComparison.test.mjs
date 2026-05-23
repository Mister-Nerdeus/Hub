import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import {
  buildScenarioComparison,
  validateScenarioComparisonContract
} from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));
const comparisonFixturesDir = join(fixturesDir, "comparison");
const exportFixturesDir = join(fixturesDir, "export");

function readComparisonFixture(name) {
  return JSON.parse(readFileSync(join(comparisonFixturesDir, name), "utf8"));
}

function readExportFixture(name) {
  return JSON.parse(readFileSync(join(exportFixturesDir, name), "utf8"));
}

function readComparisonReports() {
  return readExportFixture("report-export-bundle-basic.json").reports;
}

test("buildScenarioComparison creates deterministic validated output", () => {
  const reports = readComparisonReports();
  const comparison = buildScenarioComparison({
    comparisonId: "scenario-comparison-basic",
    label: "Operational-only scenario comparison proof",
    baselineReportId: "operational-summary-generated-task-set-basic",
    reports: [reports[1], reports[0]]
  });

  assert.deepEqual(comparison, readComparisonFixture("scenario-comparison-basic.json"));
  assert.doesNotThrow(() =>
    validateScenarioComparisonContract(comparison, {
      reports
    })
  );
});

test("buildScenarioComparison keeps baseline first", () => {
  const reports = readComparisonReports();
  const comparison = buildScenarioComparison({
    comparisonId: "scenario-comparison-basic",
    label: "Operational-only scenario comparison proof",
    baselineReportId: "operational-summary-generated-task-set-basic",
    reports: [reports[1], reports[0]]
  });

  assert.equal(comparison.reportIds[0], "operational-summary-generated-task-set-basic");
  assert.equal(comparison.items[0].isBaseline, true);
  assert.equal(comparison.items[1].isBaseline, false);
});

test("buildScenarioComparison summary max values match comparison items", () => {
  const comparison = readComparisonFixture("scenario-comparison-basic.json");

  assert.equal(comparison.summary.maxGeneratedTasks, 8);
  assert.equal(comparison.summary.maxAssignedTaskCount, 6);
  assert.equal(comparison.summary.maxUnassignedTaskCount, 2);
  assert.equal(comparison.summary.maxEstimatedTaskMinutes, 96);
  assert.equal(comparison.summary.maxWarningCount, 2);
  assert.equal(comparison.summary.maxBusiestMinuteTaskCount, 3);
});

test("validateScenarioComparisonContract rejects mismatched summary max values", () => {
  const comparison = readComparisonFixture("scenario-comparison-basic.json");
  comparison.summary.maxWarningCount = 99;

  assert.throws(() => validateScenarioComparisonContract(comparison), /maxWarningCount/);
});

test("buildScenarioComparison rejects missing baseline report", () => {
  const reports = readComparisonReports();

  assert.throws(
    () =>
      buildScenarioComparison({
        comparisonId: "scenario-comparison-basic",
        label: "Operational-only scenario comparison proof",
        baselineReportId: "missing-report",
        reports
      }),
    /baselineReportId/
  );
});

test("buildScenarioComparison rejects recommendation language", () => {
  const reports = readComparisonReports();

  assert.throws(
    () =>
      buildScenarioComparison({
        comparisonId: "scenario-comparison-basic",
        label: "Recommended scenario comparison",
        baselineReportId: "operational-summary-generated-task-set-basic",
        reports
      }),
    /operational inspection summary/
  );
});

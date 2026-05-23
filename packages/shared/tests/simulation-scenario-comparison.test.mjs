import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import {
  buildSimulationOperationalReport,
  buildSimulationRun,
  buildSimulationScenarioComparison,
  buildSimulationScore,
  validateSimulationScenarioComparisonContract
} from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));
const taskFixturesDir = join(fixturesDir, "tasks");

function readFixture(name) {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8"));
}

function readTaskFixture(name) {
  return JSON.parse(readFileSync(join(taskFixturesDir, name), "utf8"));
}

function reportFor(simulationRunId) {
  const run = buildSimulationRun({
    simulationRunId,
    scenario: readFixture("shift-scenario-basic.json"),
    generatedTaskSet: readTaskFixture("generated-task-set-basic.json"),
    nurseTaskAssignmentSet: readFixture("nurse-task-assignment-basic.json"),
    manualAssignmentSet: readFixture("manual-assignment-basic.json")
  });
  return buildSimulationOperationalReport({
    reportId: `report-${simulationRunId}`,
    simulationRun: run,
    simulationScore: buildSimulationScore(run)
  });
}

test("simulation comparison builds deterministically", () => {
  const reports = [reportFor("simulation-run-comparison-basic"), reportFor("simulation-run-comparison-surge")];
  const first = buildSimulationScenarioComparison({
    comparisonId: "simulation-comparison-basic-vs-surge",
    baselineReportId: reports[0].reportId,
    reports
  });
  const second = buildSimulationScenarioComparison({
    comparisonId: "simulation-comparison-basic-vs-surge",
    baselineReportId: reports[0].reportId,
    reports: [...reports].reverse()
  });

  assert.deepEqual(first, second);
});

test("baseline remains first", () => {
  const reports = [reportFor("simulation-run-comparison-basic"), reportFor("simulation-run-comparison-surge")];
  const comparison = buildSimulationScenarioComparison({
    comparisonId: "simulation-comparison-basic-vs-surge",
    baselineReportId: reports[0].reportId,
    reports: [...reports].reverse()
  });

  assert.equal(comparison.reportIds[0], reports[0].reportId);
  assert.equal(comparison.items[0].isBaseline, true);
});

test("mismatched report IDs fail", () => {
  const reports = [reportFor("simulation-run-comparison-basic"), reportFor("simulation-run-comparison-surge")];
  const comparison = buildSimulationScenarioComparison({
    comparisonId: "simulation-comparison-basic-vs-surge",
    baselineReportId: reports[0].reportId,
    reports
  });
  comparison.items[1].reportId = "wrong-report";

  assert.throws(() => validateSimulationScenarioComparisonContract(comparison, { reports }), /items/);
});

test("summary max values are derived", () => {
  const reports = [reportFor("simulation-run-comparison-basic"), reportFor("simulation-run-comparison-surge")];
  const comparison = buildSimulationScenarioComparison({
    comparisonId: "simulation-comparison-basic-vs-surge",
    baselineReportId: reports[0].reportId,
    reports
  });
  comparison.summary.maxDelayedTaskCount += 1;

  assert.throws(() => validateSimulationScenarioComparisonContract(comparison), /summary/);
});

test("recommendation wording rejected", () => {
  const reports = [reportFor("simulation-run-comparison-basic"), reportFor("simulation-run-comparison-surge")];
  const comparison = buildSimulationScenarioComparison({
    comparisonId: "simulation-comparison-basic-vs-surge",
    baselineReportId: reports[0].reportId,
    reports
  });
  comparison.limitations = ["recommended scenario"];

  assert.throws(() => validateSimulationScenarioComparisonContract(comparison), /recommended/);
});

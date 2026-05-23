import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import {
  buildSimulationOperationalReport,
  buildSimulationRun,
  buildSimulationScore,
  validateSimulationOperationalReportContract
} from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));
const taskFixturesDir = join(fixturesDir, "tasks");

function readFixture(name) {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8"));
}

function readTaskFixture(name) {
  return JSON.parse(readFileSync(join(taskFixturesDir, name), "utf8"));
}

function buildSources() {
  const simulationRun = buildSimulationRun({
    simulationRunId: "simulation-run-report-basic",
    scenario: readFixture("shift-scenario-basic.json"),
    generatedTaskSet: readTaskFixture("generated-task-set-basic.json"),
    nurseTaskAssignmentSet: readFixture("nurse-task-assignment-basic.json"),
    manualAssignmentSet: readFixture("manual-assignment-basic.json")
  });
  return {
    simulationRun,
    simulationScore: buildSimulationScore(simulationRun)
  };
}

test("report builds from simulation run and score", () => {
  const sources = buildSources();
  const report = buildSimulationOperationalReport(sources);

  assert.equal(report.simulationRunId, sources.simulationRun.simulationRunId);
  assert.equal(report.simulationScoreId, sources.simulationScore.simulationScoreId);
});

test("mismatched simulation run ID fails", () => {
  const sources = buildSources();
  const report = buildSimulationOperationalReport(sources);
  report.simulationRunId = "wrong-run";

  assert.throws(
    () => validateSimulationOperationalReportContract(report, sources),
    /simulationRunId/
  );
});

test("fake summary totals fail", () => {
  const sources = buildSources();
  const report = buildSimulationOperationalReport(sources);
  report.summary.completedTaskCount += 1;

  assert.throws(() => validateSimulationOperationalReportContract(report, sources), /summary/);
});

test("limitations are required", () => {
  const sources = buildSources();
  const report = buildSimulationOperationalReport(sources);
  report.limitations = [];

  assert.throws(() => validateSimulationOperationalReportContract(report, sources), /limitations/);
});

test("forbidden wording is rejected", () => {
  const sources = buildSources();
  const report = buildSimulationOperationalReport(sources);
  report.limitations = ["recommended output"];

  assert.throws(() => validateSimulationOperationalReportContract(report, sources), /recommended/);
});

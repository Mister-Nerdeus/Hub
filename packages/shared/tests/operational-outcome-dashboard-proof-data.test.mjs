import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import {
  INTENSITY_LABELS,
  OPERATIONAL_OUTCOME_DASHBOARD_METRIC_IDS,
  PRESSURE_BAND_LABELS,
  RATIO_LABELS,
  buildOperationalOutcomeDashboardProofData,
  validateOperationalOutcomeDashboardProofData
} from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/outcomes/", import.meta.url));

function readFixture(name) {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8"));
}

test("buildOperationalOutcomeDashboardProofData matches the shared fixture", () => {
  const output = buildOperationalOutcomeDashboardProofData();
  const fixture = readFixture("operational-outcome-dashboard-proof-data.json");

  assert.deepEqual(output, fixture);
  assert.deepEqual(validateOperationalOutcomeDashboardProofData(output), fixture);
});

test("dashboard proof data uses valid ratio, intensity, pressure band, and metric ids", () => {
  const output = buildOperationalOutcomeDashboardProofData();
  assert.equal(output.scenarios.length, 4);

  for (const scenario of output.scenarios) {
    assert.equal(RATIO_LABELS.includes(scenario.ratioLabel), true);
    assert.equal(INTENSITY_LABELS.includes(scenario.intensityLabel), true);
    assert.equal(PRESSURE_BAND_LABELS.includes(scenario.pressureBand), true);
    assert.deepEqual(
      scenario.operationalMetrics.map((metric) => metric.metricId),
      [...OPERATIONAL_OUTCOME_DASHBOARD_METRIC_IDS]
    );
  }
});

test("dashboard proof data rejects invalid shared metric ids", () => {
  const output = buildOperationalOutcomeDashboardProofData();
  const invalid = structuredClone(output);
  invalid.scenarios[0].operationalMetrics[0].metricId = "web-local-metric";

  assert.throws(
    () => validateOperationalOutcomeDashboardProofData(invalid),
    /must match dashboard metric ids/
  );
});

test("dashboard proof data remains operational-only", () => {
  const output = buildOperationalOutcomeDashboardProofData();
  const serialized = JSON.stringify(output).toLowerCase();
  for (const forbidden of ["safe", "unsafe", "clinical", "satisfaction", "recommendation"]) {
    assert.equal(serialized.includes(forbidden), false, `must not include ${forbidden}`);
  }
});

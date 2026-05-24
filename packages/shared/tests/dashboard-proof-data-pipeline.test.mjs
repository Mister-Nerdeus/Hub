import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  OPERATIONAL_OUTCOME_DASHBOARD_METRIC_IDS,
  buildOperationalDeltaComparison,
  buildOperationalOutcomeDashboardProofData,
  buildPressureBandingSummary,
  operationalOutcomeDashboardProofData,
  resolveCanonicalMetricId,
  validateMetricAgainstRegistry
} from "../dist/index.js";

const testDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(testDir, "../../..");

test("dashboard proof data is assembled from shared pipeline builders", () => {
  const output = buildOperationalOutcomeDashboardProofData();
  const source = readFileSync(
    join(repoRoot, "packages/shared/src/outcomes/buildOperationalOutcomeDashboardProofData.ts"),
    "utf8"
  );

  assert.equal(source.includes("DASHBOARD_METRIC_FORMULAS"), false);
  assert.equal(source.includes("deriveDashboardMetricValue"), false);
  assert.equal(source.includes("buildTaskTimeQueueSummary"), true);
  assert.equal(source.includes("buildPressureBandingSummary"), true);
  assert.equal(source.includes("buildOperationalDeltaComparison"), true);
  assert.deepEqual(output, operationalOutcomeDashboardProofData);
});

test("dashboard metric cards use canonical registry ids", () => {
  const output = buildOperationalOutcomeDashboardProofData();

  for (const scenario of output.scenarios) {
    assert.deepEqual(
      scenario.operationalMetrics.map((metric) => metric.metricId),
      [...OPERATIONAL_OUTCOME_DASHBOARD_METRIC_IDS]
    );

    for (const metric of scenario.operationalMetrics) {
      assert.equal(resolveCanonicalMetricId(metric.metricId), metric.metricId);
      assert.equal(validateMetricAgainstRegistry(metric).isRegistered, true);
    }
  }
});

test("dashboard pressure bands are rebuilt from unified pressure banding", () => {
  const output = buildOperationalOutcomeDashboardProofData();

  for (const scenario of output.scenarios) {
    const summary = buildPressureBandingSummary({ metrics: scenario.operationalMetrics });
    const overall = summary.metrics.find((metric) => metric.metricId === "overall_pressure_band");
    const threshold = summary.thresholds.find(
      (candidate) => candidate.bandValue === overall?.value
    );
    assert.equal(scenario.pressureBand, threshold?.bandLabel);
  }
});

test("dashboard ratio deltas are rebuilt from operational delta comparison", () => {
  const output = buildOperationalOutcomeDashboardProofData();
  const baseline = output.scenarios.find((scenario) => scenario.scenarioKey === "3_to_1_light");
  const modified = output.scenarios.find((scenario) => scenario.scenarioKey === "4_to_1_light");

  assert.ok(baseline);
  assert.ok(modified);
  assert.deepEqual(
    output.ratioDeltaComparison,
    buildOperationalDeltaComparison({
      comparisonId: "outcome-dashboard-ratio-contrast",
      baselineLabel: "3:1 light",
      modifiedLabel: "4:1 light",
      baselineMetrics: baseline.operationalMetrics,
      modifiedMetrics: modified.operationalMetrics,
      limitations: output.limitations
    })
  );
});

test("editing serialized proof metric values cannot become the generated dashboard data", () => {
  const generated = buildOperationalOutcomeDashboardProofData();
  const edited = structuredClone(generated);
  edited.scenarios[0].operationalMetrics[0].value += 1;

  assert.notDeepEqual(edited, buildOperationalOutcomeDashboardProofData());
});

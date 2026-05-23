import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import {
  DEFAULT_PRESSURE_BAND_THRESHOLDS,
  PRESSURE_BAND_LABELS,
  buildPressureBandingSummary,
  validateOperationalMetricContracts,
  validatePressureBandingSummary
} from "../dist/index.js";

const rootDir = fileURLToPath(new URL("../../..", import.meta.url));
const fixturesDir = fileURLToPath(new URL("../fixtures/outcomes/", import.meta.url));
const retiredPressureBandLabels = ["watch", "elevated", "compressed"];
const activePressureBandLabels = ["low", "moderate", "high", "critical"];

function buildMetric(value = 42) {
  return validateOperationalMetricContracts([
    {
      schemaVersion: "1.0.0",
      metricId: "taxonomy-pressure-check",
      label: "Taxonomy pressure check",
      group: "unit",
      unit: "score",
      value,
      directionality: "lower_is_better",
      source: "derived_proxy",
      scope: "simulation",
      limitations: ["Operational-only taxonomy pressure check."]
    }
  ]);
}

test("shared pressure band taxonomy exposes only low, moderate, high, and critical", () => {
  assert.deepEqual([...PRESSURE_BAND_LABELS], activePressureBandLabels);
  assert.deepEqual(
    DEFAULT_PRESSURE_BAND_THRESHOLDS.map((threshold) => threshold.bandLabel),
    activePressureBandLabels
  );
});

test("shared pressure band validation rejects retired pressure-band labels", () => {
  for (const retiredLabel of retiredPressureBandLabels) {
    const summary = buildPressureBandingSummary({ metrics: buildMetric(42) });
    summary.thresholds[0].bandLabel = retiredLabel;
    assert.throws(
      () => validatePressureBandingSummary(summary),
      /must be one of low, moderate, high, critical/
    );

    const bandedMetricSummary = buildPressureBandingSummary({ metrics: buildMetric(42) });
    bandedMetricSummary.bandedMetrics[0].bandLabel = retiredLabel;
    assert.throws(
      () => validatePressureBandingSummary(bandedMetricSummary),
      /must be one of low, moderate, high, critical/
    );
  }
});

test("new pressure bands validate and map deterministically across default thresholds", () => {
  const summary = buildPressureBandingSummary({
    metrics: validateOperationalMetricContracts([
      buildMetric(12)[0],
      { ...buildMetric(38)[0], metricId: "moderate-pressure-check", label: "Moderate pressure check" },
      { ...buildMetric(58)[0], metricId: "high-pressure-check", label: "High pressure check" },
      { ...buildMetric(82)[0], metricId: "critical-pressure-check", label: "Critical pressure check" }
    ])
  });

  assert.deepEqual(
    summary.bandedMetrics.map((metric) => metric.bandLabel),
    activePressureBandLabels
  );
  assert.equal(validatePressureBandingSummary(summary).bandedMetrics.length, 4);
});

test("active outcome fixtures, dashboard fixtures, and README phase status do not use retired labels", () => {
  const fixtureFiles = readdirSync(fixturesDir)
    .filter((fileName) => fileName.endsWith(".json"))
    .map((fileName) => join(fixturesDir, fileName));
  const activeFiles = [
    ...fixtureFiles,
    join(rootDir, "apps/web/src/fixtures/outcomes/operationalOutcomeDashboardProof.ts"),
    join(rootDir, "README.md")
  ];

  for (const filePath of activeFiles) {
    const content = readFileSync(filePath, "utf8");
    for (const retiredLabel of retiredPressureBandLabels) {
      assert.equal(
        new RegExp(`\\b${retiredLabel}\\b`).test(content),
        false,
        `${filePath} must not use retired pressure-band label ${retiredLabel}`
      );
    }
  }
});

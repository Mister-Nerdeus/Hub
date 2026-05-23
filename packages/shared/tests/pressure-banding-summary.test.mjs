import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import {
  buildPressureBandingSummary,
  validateOperationalMetricContracts,
  validatePressureBandingSummary
} from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));

function readFixture(name) {
  return JSON.parse(readFileSync(join(fixturesDir, "outcomes", name), "utf8"));
}

function buildSourceMetrics() {
  return [
    {
      schemaVersion: "1.0.0",
      metricId: "queue-wait-minutes",
      label: "Queue wait minutes",
      group: "task",
      unit: "minutes",
      value: 12,
      directionality: "lower_is_better",
      source: "queue_event",
      scope: "simulation",
      limitations: ["Operational-only queue wait metric."]
    },
    {
      schemaVersion: "1.0.0",
      metricId: "room-pressure-score",
      label: "Room pressure score",
      group: "room",
      unit: "score",
      value: 58,
      directionality: "lower_is_better",
      source: "derived_proxy",
      scope: "room",
      limitations: ["Operational-only room pressure metric."]
    },
    {
      schemaVersion: "1.0.0",
      metricId: "layout-friction-score",
      label: "Layout friction score",
      group: "layout",
      unit: "score",
      value: 82,
      directionality: "lower_is_better",
      source: "derived_proxy",
      scope: "layout",
      limitations: ["Operational-only layout friction metric."]
    }
  ];
}

test("buildPressureBandingSummary assigns deterministic bands to operational metrics", () => {
  const output = buildPressureBandingSummary({
    metrics: validateOperationalMetricContracts(buildSourceMetrics())
  });
  const fixture = readFixture("pressure-banding-summary-basic.json");

  assert.deepEqual(output, fixture);
  assert.equal(validatePressureBandingSummary(output).bandedMetrics.length, 3);
  assert.equal(
    output.metrics.some((metric) => metric.metricId === "overall_pressure_band" && metric.value === 4),
    true
  );
});

test("buildPressureBandingSummary increases band value when the source value crosses a threshold", () => {
  const low = buildPressureBandingSummary({
    metrics: validateOperationalMetricContracts([buildSourceMetrics()[0]])
  });
  const highMetric = buildSourceMetrics()[0];
  highMetric.value = 77;
  const high = buildPressureBandingSummary({
    metrics: validateOperationalMetricContracts([highMetric])
  });

  assert.equal(low.bandedMetrics[0].bandLabel, "low");
  assert.equal(high.bandedMetrics[0].bandLabel, "critical");
  assert.equal(high.bandedMetrics[0].bandValue > low.bandedMetrics[0].bandValue, true);
});

test("buildPressureBandingSummary rejects empty metric input", () => {
  assert.throws(() => buildPressureBandingSummary({ metrics: [] }), /at least one/);
});

test("buildPressureBandingSummary preserves negative comparison deltas while banding from zero floor", () => {
  const output = buildPressureBandingSummary({
    metrics: validateOperationalMetricContracts([
      {
        schemaVersion: "1.0.0",
        metricId: "comparison-delta",
        label: "Comparison delta",
        group: "comparison",
        unit: "count",
        value: -4,
        directionality: "neutral",
        source: "comparison_delta",
        scope: "comparison",
        limitations: ["Operational-only signed delta metric."]
      }
    ])
  });

  assert.equal(output.bandedMetrics[0].sourceValue, -4);
  assert.equal(output.bandedMetrics[0].bandLabel, "low");
  assert.equal(output.bandedMetrics[0].bandValue, 1);
});

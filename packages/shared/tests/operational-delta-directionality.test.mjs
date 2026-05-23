import assert from "node:assert/strict";
import test from "node:test";

import {
  buildOperationalDeltaComparison,
  validateOperationalDeltaComparison
} from "../dist/index.js";

function metric(metricId, value, directionality) {
  return {
    schemaVersion: "1.0.0",
    metricId,
    label: `Metric ${metricId}`,
    group: "comparison",
    unit: "score",
    value,
    directionality,
    source: "derived_proxy",
    scope: "comparison",
    limitations: ["Operational-only delta directionality test metric."]
  };
}

test("serialized lower-is-better deltas cannot claim improvement when value increases", () => {
  const comparison = buildOperationalDeltaComparison({
    comparisonId: "delta-directionality-lower",
    baselineLabel: "baseline",
    modifiedLabel: "modified",
    baselineMetrics: [metric("lower-pressure", 10, "lower_is_better")],
    modifiedMetrics: [metric("lower-pressure", 12, "lower_is_better")]
  });

  const invalid = structuredClone(comparison);
  invalid.deltas[0].direction = "improved";

  assert.throws(
    () => validateOperationalDeltaComparison(invalid),
    /direction must match directionality/
  );
});

test("serialized higher-is-better deltas cannot claim improvement when value decreases", () => {
  const comparison = buildOperationalDeltaComparison({
    comparisonId: "delta-directionality-higher",
    baselineLabel: "baseline",
    modifiedLabel: "modified",
    baselineMetrics: [metric("higher-throughput", 12, "higher_is_better")],
    modifiedMetrics: [metric("higher-throughput", 10, "higher_is_better")]
  });

  const invalid = structuredClone(comparison);
  invalid.deltas[0].direction = "improved";

  assert.throws(
    () => validateOperationalDeltaComparison(invalid),
    /direction must match directionality/
  );
});

test("neutral deltas validate only as unchanged even when values move", () => {
  const comparison = buildOperationalDeltaComparison({
    comparisonId: "delta-directionality-neutral",
    baselineLabel: "baseline",
    modifiedLabel: "modified",
    baselineMetrics: [metric("neutral-context", 4, "neutral")],
    modifiedMetrics: [metric("neutral-context", 8, "neutral")]
  });

  assert.equal(comparison.deltas[0].directionality, "neutral");
  assert.equal(comparison.deltas[0].direction, "unchanged");
  assert.equal(validateOperationalDeltaComparison(comparison).deltas[0].direction, "unchanged");
});

test("zero absolute change validates only as unchanged", () => {
  const comparison = buildOperationalDeltaComparison({
    comparisonId: "delta-directionality-zero",
    baselineLabel: "baseline",
    modifiedLabel: "modified",
    baselineMetrics: [metric("zero-change", 4, "lower_is_better")],
    modifiedMetrics: [metric("zero-change", 4, "lower_is_better")]
  });

  const invalid = structuredClone(comparison);
  invalid.deltas[0].direction = "worse";

  assert.throws(
    () => validateOperationalDeltaComparison(invalid),
    /direction must match directionality/
  );
});

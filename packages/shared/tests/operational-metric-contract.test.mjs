import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import {
  validateOperationalMetricContract,
  validateOperationalMetricContracts
} from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));

function readFixture(name) {
  return JSON.parse(readFileSync(join(fixturesDir, "outcomes", name), "utf8"));
}

function baseMetric() {
  return {
    schemaVersion: "1.0.0",
    metricId: "base",
    label: "Base metric",
    group: "nurse",
    unit: "minutes",
    value: 12,
    directionality: "lower_is_better",
    source: "task_event",
    scope: "simulation",
    limitations: ["Operational-only metric proxy for workload comparison."]
  };
}

test("operational metric fixture validates with full operational variable coverage", () => {
  const fixture = readFixture("operational-metric-basic.json");
  const metrics = validateOperationalMetricContracts(fixture.operationalMetrics);

  assert.equal(metrics.length, fixture.operationalMetrics.length);
  assert.equal(metrics[0].metricId, "nurse-walk-time");
  assert.equal(metrics.some((metric) => metric.metricId === "comparison-delta"), true);
  assert.equal(metrics.some((metric) => metric.group === "ratio"), true);
  assert.equal(metrics[0].directionality, "lower_is_better");
  assert.equal(metrics[0].source, "travel_event");
  assert.equal(metrics[0].scope, "nurse");
});

test("metrics reject clinical wording in operational labels", () => {
  const metric = baseMetric();
  metric.label = "clinical outcome walk metric";
  assert.throws(() => validateOperationalMetricContract(metric), /forbidden/);
});

test("metrics reject satisfaction wording in limitations", () => {
  const metric = baseMetric();
  metric.limitations = ["patient satisfaction proxy for workload"];
  assert.throws(() => validateOperationalMetricContract(metric), /forbidden wording/);
});

test("metrics reject recommendation wording in limitations", () => {
  const metric = baseMetric();
  metric.metricId = "recommendation-check";
  metric.label = "Nurse walk time";
  metric.limitations = ["Best layout recommendation for staff"];
  assert.throws(() => validateOperationalMetricContract(metric), /must avoid operational-only forbidden wording/);
});

test("missing directionality demonstrates no shared metric contract exists without it", () => {
  const metric = baseMetric();
  delete metric.directionality;
  assert.throws(() => validateOperationalMetricContract(metric), /directionality/);
});

test("missing source demonstrates no shared metric contract exists without provenance", () => {
  const metric = baseMetric();
  delete metric.source;
  assert.throws(() => validateOperationalMetricContract(metric), /source/);
});

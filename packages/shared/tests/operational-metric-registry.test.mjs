import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  OPERATIONAL_DASHBOARD_CANONICAL_METRIC_IDS,
  OPERATIONAL_METRIC_REGISTRY,
  buildOperationalDeltaComparison,
  getOperationalMetricDefinition,
  getOperationalMetricDirectionality,
  resolveCanonicalMetricId,
  validateMetricAgainstRegistry
} from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));

function readFixture(name) {
  return JSON.parse(readFileSync(join(fixturesDir, "outcomes", name), "utf8"));
}

function registryMetric(metricId, value, directionality = "lower_is_better") {
  return {
    schemaVersion: "1.0.0",
    metricId,
    label: `Metric ${metricId}`,
    group: "nurse",
    unit: "count",
    value,
    directionality,
    source: "task_event",
    scope: "nurse",
    limitations: ["Operational-only registry directionality test metric."]
  };
}

function pickDefinition(definition) {
  return {
    canonicalMetricId: definition.canonicalMetricId,
    aliases: [...definition.aliases],
    label: definition.label,
    group: definition.group,
    unit: definition.unit,
    directionality: definition.directionality,
    source: definition.source,
    scope: definition.scope,
    metricKind: definition.metricKind,
    purpose: definition.purpose
  };
}

test("operational metric registry fixture matches registered canonical definitions", () => {
  const fixture = readFixture("operational-metric-registry.json");

  assert.equal(fixture.schemaVersion, "1.0.0");
  for (const fixtureDefinition of fixture.definitions) {
    const runtimeDefinition = getOperationalMetricDefinition(fixtureDefinition.canonicalMetricId);
    assert.notEqual(runtimeDefinition, null);
    assert.deepEqual(pickDefinition(runtimeDefinition), fixtureDefinition);
  }
});

test("dashboard proof card aliases resolve to canonical metric ids", () => {
  for (const canonicalMetricId of OPERATIONAL_DASHBOARD_CANONICAL_METRIC_IDS) {
    assert.equal(resolveCanonicalMetricId(canonicalMetricId), canonicalMetricId);
  }

  assert.equal(resolveCanonicalMetricId("nurse-walk-time"), "nurse_walk_time");
  assert.equal(resolveCanonicalMetricId("patient-wait-idle-proxy"), "patient_wait_idle_proxy");
  assert.equal(resolveCanonicalMetricId("layout_friction_score"), "layout_friction");
  assert.equal(resolveCanonicalMetricId("room-turnover-pressure"), "room_turnover_pressure");
});

test("throughput and direct-work metrics are not lower-is-better", () => {
  assert.equal(getOperationalMetricDirectionality("completed_task_count_by_nurse"), "neutral");
  assert.equal(getOperationalMetricDirectionality("assigned_task_count_by_nurse"), "neutral");
  assert.equal(getOperationalMetricDirectionality("direct_task_minutes"), "neutral");
  assert.equal(getOperationalMetricDirectionality("completed_task_count_by_nurse_alpha"), "neutral");
});

test("known metric registry validation rejects contradictory directionality", () => {
  assert.throws(
    () => validateMetricAgainstRegistry(registryMetric("completed_task_count_by_nurse_alpha", 10)),
    /directionality must be neutral/
  );
});

test("unknown ad-hoc metrics can still validate outside canonical registry proof", () => {
  const validation = validateMetricAgainstRegistry({
    schemaVersion: "1.0.0",
    metricId: "ad_hoc_local_metric",
    label: "Ad hoc local metric",
    group: "comparison",
    unit: "count",
    value: 1,
    directionality: "neutral",
    source: "comparison_delta",
    scope: "comparison",
    limitations: ["Operational-only ad hoc metric used outside canonical proof."]
  });

  assert.deepEqual(validation, {
    metricId: "ad_hoc_local_metric",
    canonicalMetricId: null,
    isRegistered: false
  });
});

test("registered throughput reduction cannot be labeled as improvement by delta comparison", () => {
  const comparison = buildOperationalDeltaComparison({
    comparisonId: "issue-137-throughput-reduction",
    baselineLabel: "baseline",
    modifiedLabel: "modified",
    baselineMetrics: [registryMetric("completed_task_count_by_nurse_alpha", 10)],
    modifiedMetrics: [registryMetric("completed_task_count_by_nurse_alpha", 5)]
  });

  assert.deepEqual(comparison.deltas[0], {
    metricId: "completed_task_count_by_nurse_alpha",
    directionality: "neutral",
    baselineValue: 10,
    modifiedValue: 5,
    absoluteChange: -5,
    percentChange: -50,
    direction: "unchanged"
  });
  assert.equal(
    resolveCanonicalMetricId(comparison.deltas[0].metricId),
    "completed_task_count_by_nurse"
  );
});

test("registry entries include supported metric kinds", () => {
  const allowedKinds = new Set([
    "burden",
    "pressure",
    "throughput",
    "distance",
    "time",
    "density",
    "comparison"
  ]);

  assert.equal(OPERATIONAL_METRIC_REGISTRY.every((definition) => allowedKinds.has(definition.metricKind)), true);
});

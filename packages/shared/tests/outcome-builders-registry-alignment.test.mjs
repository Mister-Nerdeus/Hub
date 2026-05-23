import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  buildDynamicOperationalMetric,
  buildRegisteredOperationalMetric
} from "../dist/outcomes/outcomeMetricsBuilder.js";
import {
  getOperationalMetricDirectionality,
  resolveCanonicalMetricId,
  validateMetricAgainstRegistry
} from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));

const outcomeBuilderFixtures = [
  "nurse-walk-layout-friction-summary-basic.json",
  "task-time-queue-summary-basic.json",
  "patient-wait-idle-proxy-basic.json",
  "room-turnover-blocked-time-proxy-basic.json",
  "nurse-task-burden-summary-basic.json"
];

function readOutcomeFixture(name) {
  return JSON.parse(readFileSync(join(fixturesDir, "outcomes", name), "utf8"));
}

test("current outcome builder fixtures emit only registry-aligned known metrics", () => {
  for (const fixtureName of outcomeBuilderFixtures) {
    const fixture = readOutcomeFixture(fixtureName);
    for (const metric of fixture.metrics) {
      const validation = validateMetricAgainstRegistry(metric);
      assert.equal(
        validation.isRegistered,
        true,
        `${fixtureName} metric must be registered: ${metric.metricId}`
      );
      assert.equal(
        validation.canonicalMetricId,
        resolveCanonicalMetricId(metric.metricId),
        `${fixtureName} metric must resolve deterministically: ${metric.metricId}`
      );
    }
  }
});

test("registered metric helper uses canonical registry directionality", () => {
  const metric = buildRegisteredOperationalMetric({
    metricId: "direct_task_minutes",
    value: 12,
    limitations: ["Operational-only registered metric helper test."]
  });

  assert.equal(metric.metricId, "direct_task_minutes");
  assert.equal(metric.directionality, "neutral");
  assert.equal(validateMetricAgainstRegistry(metric).isRegistered, true);
});

test("dynamic metric helper derives base registry directionality from prefixes", () => {
  const completed = buildDynamicOperationalMetric({
    metricId: "completed_task_count_by_nurse_nurse-alpha",
    label: "Completed task count for nurse nurse-alpha",
    value: 2,
    limitations: ["Operational-only dynamic metric helper test."]
  });
  const assigned = buildDynamicOperationalMetric({
    metricId: "assigned_task_count_by_nurse_nurse-alpha",
    label: "Assigned task count for nurse nurse-alpha",
    value: 3,
    limitations: ["Operational-only dynamic metric helper test."]
  });

  assert.equal(completed.directionality, "neutral");
  assert.equal(assigned.directionality, "neutral");
  assert.equal(resolveCanonicalMetricId(completed.metricId), "completed_task_count_by_nurse");
  assert.equal(resolveCanonicalMetricId(assigned.metricId), "assigned_task_count_by_nurse");
});

test("dynamic metric helper rejects unknown dynamic prefixes", () => {
  assert.throws(
    () =>
      buildDynamicOperationalMetric({
        metricId: "unregistered_metric_by_nurse_nurse-alpha",
        label: "Unregistered metric",
        value: 1,
        limitations: ["Operational-only dynamic metric helper rejection test."]
      }),
    /registered operational metric is required/
  );
});

test("registered and dynamic metric helpers enforce their ID boundaries", () => {
  assert.throws(
    () =>
      buildRegisteredOperationalMetric({
        metricId: "walk_minutes_by_nurse_nurse-alpha",
        value: 12
      }),
    /not dynamic metric/
  );

  assert.throws(
    () =>
      buildDynamicOperationalMetric({
        metricId: "direct_task_minutes",
        value: 12
      }),
    /registered dynamic prefix/
  );
});

test("throughput and direct-work dynamic prefixes remain neutral", () => {
  assert.equal(getOperationalMetricDirectionality("direct_task_minutes_by_nurse_nurse-alpha"), "neutral");
  assert.equal(getOperationalMetricDirectionality("completed_task_count_by_nurse_nurse-alpha"), "neutral");
  assert.equal(getOperationalMetricDirectionality("assigned_task_count_by_nurse_nurse-alpha"), "neutral");
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import {
  INTENSITY_LABELS,
  RATIO_LABELS,
  validateOperationalMetricContracts
} from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));
const scenarioFiles = [
  "ratio-3to1-light.json",
  "ratio-3to1-normal.json",
  "ratio-3to1-busy.json",
  "ratio-3to1-slammed.json",
  "ratio-4to1-light.json",
  "ratio-4to1-normal.json",
  "ratio-4to1-busy.json",
  "ratio-4to1-slammed.json"
];
const fixtureOrderByIntensity = [...INTENSITY_LABELS];
const expectedMetricIds = [
  "nurse-walk-time",
  "patient-wait-idle-proxy",
  "task-time",
  "queue-delay",
  "unit-saturation",
  "room-turnover-pressure",
  "nurse-strain-proxy",
  "layout-friction"
];

function readFixture(name) {
  return JSON.parse(readFileSync(join(fixturesDir, "outcomes", name), "utf8"));
}

function extractMetricMap(fixture) {
  return new Map(fixture.operationalMetrics.map((metric) => [metric.metricId, metric.value]));
}

function expectMonotonicIntensities(aValue, bValue) {
  assert.equal(aValue <= bValue, true, `metric must not decrease with intensity`);
}

function isExpectedWorse(base, modified, directionality) {
  if (directionality === "higher_is_better") {
    return modified < base;
  }
  if (directionality === "neutral") {
    return false;
  }
  return modified > base;
}

test("all ratio fixture files exist, validate, and include stable metric IDs", () => {
  const fixtures = scenarioFiles.map((name) => readFixture(name));
  assert.equal(fixtures.length, 8);

  const metricIds = new Set(validateOperationalMetricContracts(fixtures[0].operationalMetrics).map((metric) => metric.metricId));
  assert.equal(metricIds.size, expectedMetricIds.length);
  assert.equal(metricIds.has("unit-saturation"), true);

  const seen = new Set();
  for (const fixture of fixtures) {
    assert.equal(RATIO_LABELS.includes(fixture.ratioLabel), true);
    assert.equal(INTENSITY_LABELS.includes(fixture.intensityLabel), true);
    assert.equal(fixture.scenarioKey.includes(fixture.ratioLabel), true);
    assert.equal(fixture.scenarioKey.includes(fixture.intensityLabel), true);
    assert.equal(validateOperationalMetricContracts(fixture.operationalMetrics).length, expectedMetricIds.length);
    const ids = validateOperationalMetricContracts(fixture.operationalMetrics).map((metric) => metric.metricId).sort();
    assert.deepEqual(ids, [...expectedMetricIds].sort());
    seen.add(`${fixture.ratioLabel}:${fixture.intensityLabel}`);
    fixture.operationalMetrics.forEach((metric) => {
      const text = `${fixture.ratioLabel} ${fixture.intensityLabel} ${metric.metricId}`;
      assert.equal(text.includes("recommendation"), false);
    });
  }
  for (const ratio of RATIO_LABELS) {
    for (const intensity of INTENSITY_LABELS) {
      assert.equal(seen.has(`${ratio}:${intensity}`), true);
    }
  }
});

test("metric values stay monotonic across light → normal → busy → slammed for each ratio", () => {
  const fixtures = scenarioFiles.map((name) => readFixture(name));
  const byRatio = new Map();
  for (const fixture of fixtures) {
    const list = byRatio.get(fixture.ratioLabel) ?? [];
    list.push(fixture);
    byRatio.set(fixture.ratioLabel, list);
  }

  for (const ratio of RATIO_LABELS) {
    const fixturesByIntensity = byRatio.get(ratio);
    if (fixturesByIntensity == null) {
      throw new Error(`missing ratio fixtures for ${ratio}`);
    }
    const sorted = fixtureOrderByIntensity.map((intensity) => {
      const fixture = fixturesByIntensity.find((candidate) => candidate.intensityLabel === intensity);
      if (fixture == null) {
        throw new Error(`missing intensity ${intensity} for ${ratio}`);
      }
      return fixture;
    });
    for (let index = 1; index < sorted.length; index += 1) {
      const previousMetrics = extractMetricMap(sorted[index - 1]);
      const currentMetrics = extractMetricMap(sorted[index]);
      for (const metricId of expectedMetricIds) {
        const previousValue = previousMetrics.get(metricId);
        const currentValue = currentMetrics.get(metricId);
        if (previousValue == null || currentValue == null) {
          throw new Error(`metric ${metricId} missing in fixture`);
        }
        expectMonotonicIntensities(previousValue, currentValue);
      }
    }
  }
});

test("3:1 vs 4:1 pressure comparison preserves pressure growth under equivalent intensity", () => {
  const fixtures = scenarioFiles.map((name) => readFixture(name));
  const byIntensity = new Map();
  for (const fixture of fixtures) {
    const list = byIntensity.get(fixture.intensityLabel) ?? [];
    list.push(fixture);
    byIntensity.set(fixture.intensityLabel, list);
  }

  for (const intensity of INTENSITY_LABELS) {
    const threeToOne = byIntensity.get(intensity)?.find((candidate) => candidate.ratioLabel === "3_to_1");
    const fourToOne = byIntensity.get(intensity)?.find((candidate) => candidate.ratioLabel === "4_to_1");
    if (threeToOne == null || fourToOne == null) {
      throw new Error(`missing equivalent ratio fixture for ${intensity}`);
    }

    const threeToOneMetrics = extractMetricMap(threeToOne);
    const fourToOneMetrics = extractMetricMap(fourToOne);
    let observedWorse = 0;
    for (const metricId of expectedMetricIds) {
      const baseMetric = threeToOne.operationalMetrics.find((metric) => metric.metricId === metricId);
      const modifiedMetric = fourToOne.operationalMetrics.find((metric) => metric.metricId === metricId);
      if (baseMetric == null || modifiedMetric == null) {
        throw new Error(`metric ${metricId} mismatch across 3:1 and 4:1 for ${intensity}`);
      }
      if (isExpectedWorse(threeToOneMetrics.get(metricId), fourToOneMetrics.get(metricId), baseMetric.directionality)) {
        observedWorse += 1;
      }
    }
    assert.equal(observedWorse >= 1, true, `4:1 must be worse in at least one metric for ${intensity}`);
  }
});

test("slammed scenarios are in high or critical pressure bands", () => {
  const fixtures = scenarioFiles.map((name) => readFixture(name));
  const slammed = fixtures.filter((fixture) => fixture.intensityLabel === "slammed");
  assert.equal(slammed.length, 2);
  const allowed = new Set(["high", "critical"]);
  for (const fixture of slammed) {
    assert.equal(allowed.has(fixture.pressureBand), true);
  }
});

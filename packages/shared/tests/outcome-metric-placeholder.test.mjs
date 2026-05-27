import assert from "node:assert/strict";
import test from "node:test";

import {
  outcomeMetricPlaceholderSet,
  outcomeMetricPlaceholders,
  validateOutcomeMetricPlaceholder,
  validateOutcomeMetricPlaceholderSet
} from "../dist/index.js";

test("outcome metric placeholders are not computed", () => {
  const set = validateOutcomeMetricPlaceholderSet(outcomeMetricPlaceholderSet);
  assert.equal(set.metrics.length, outcomeMetricPlaceholders.length);
  for (const metric of set.metrics) {
    assert.equal(metric.status, "placeholder");
    assert.equal(metric.computed, false);
    assert.equal(metric.simulationRequired, true);
  }
});

test("computed outcome values are rejected", () => {
  assert.throws(
    () => validateOutcomeMetricPlaceholder({ ...outcomeMetricPlaceholders[0], computed: true }),
    /computed/
  );
  assert.throws(
    () => validateOutcomeMetricPlaceholder({ ...outcomeMetricPlaceholders[0], value: 12 }),
    /not allowed/
  );
});

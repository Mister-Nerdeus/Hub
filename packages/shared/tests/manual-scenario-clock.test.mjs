import test from "node:test";
import assert from "node:assert/strict";

import {
  MANUAL_SCENARIO_FIXTURE_TIMESTAMP,
  createManualScenarioSequenceClock,
  createManualScenarioSystemClock,
  manualScenarioFixtureClock
} from "../dist/index.js";

test("manual scenario fixture clock is deterministic", () => {
  assert.equal(manualScenarioFixtureClock.nowIso(), MANUAL_SCENARIO_FIXTURE_TIMESTAMP);
  assert.equal(manualScenarioFixtureClock.nowIso(), MANUAL_SCENARIO_FIXTURE_TIMESTAMP);
});

test("manual scenario sequence clock advances deterministically", () => {
  const clock = createManualScenarioSequenceClock([
    "2026-06-01T00:00:00.000Z",
    "2026-06-01T00:05:00.000Z"
  ]);

  assert.equal(clock.nowIso(), "2026-06-01T00:00:00.000Z");
  assert.equal(clock.nowIso(), "2026-06-01T00:05:00.000Z");
  assert.equal(clock.nowIso(), "2026-06-01T00:05:00.000Z");
});

test("manual scenario system clock returns an ISO timestamp", () => {
  const timestamp = createManualScenarioSystemClock().nowIso();

  assert.match(timestamp, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u);
});

test("manual scenario sequence clock rejects empty input", () => {
  assert.throws(
    () => createManualScenarioSequenceClock([]),
    /timestamps must not be empty/u
  );
});

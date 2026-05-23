import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import {
  INTENSITY_LABELS,
  RATIO_LABELS,
  buildRatioScenarioIntensityContract,
  validateRatioScenarioIntensityContract
} from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));

function readFixture(name) {
  return JSON.parse(readFileSync(join(fixturesDir, "outcomes", name), "utf8"));
}

test("buildRatioScenarioIntensityContract emits deterministic ratio and intensity scenarios", () => {
  const output = buildRatioScenarioIntensityContract();
  const fixture = readFixture("ratio-scenario-intensity-basic.json");

  assert.deepEqual(output, fixture);
  assert.equal(validateRatioScenarioIntensityContract(output).scenarios.length, 8);
  assert.deepEqual(output.ratios, [...RATIO_LABELS]);
  assert.deepEqual(output.intensities, [...INTENSITY_LABELS]);
});

test("ratio scenario intensity validation rejects missing scenario pairs", () => {
  const fixture = readFixture("ratio-scenario-intensity-basic.json");
  fixture.scenarios = fixture.scenarios.filter(
    (scenario) => scenario.scenarioKey !== "4_to_1_slammed"
  );

  assert.throws(() => validateRatioScenarioIntensityContract(fixture), /every ratio and intensity pair/);
});

test("ratio scenario intensity validation rejects forbidden wording", () => {
  const fixture = readFixture("ratio-scenario-intensity-basic.json");
  fixture.limitations = ["safe staffing label"];

  assert.throws(() => validateRatioScenarioIntensityContract(fixture), /forbidden wording/);
});

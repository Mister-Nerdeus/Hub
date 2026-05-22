import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import { validatePlanContract, validateScenarioContract } from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));

function readFixture(name) {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8"));
}

test("plan fixture validates against TypeScript contract", () => {
  const plan = validatePlanContract(readFixture("plan-basic.json"));

  assert.equal(plan.schemaVersion, "1.0.0");
  assert.equal(plan.units.origin, "top-left");
  assert.equal(plan.units.unit, "feet");
  assert.equal(Object.hasOwn(plan, "selectionState"), false);
});

test("scenario fixture validates against TypeScript contract", () => {
  const scenario = validateScenarioContract(readFixture("scenario-basic.json"));

  assert.equal(scenario.schemaVersion, "1.0.0");
  assert.equal(scenario.shiftLengthMinutes, 480);
  assert.equal(scenario.timestepMinutes, 5);
  assert.equal(scenario.seed, 20260521);
});

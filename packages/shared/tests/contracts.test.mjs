import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import { validatePlanContract, validateScenarioContract } from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));
const invalidFixturesDir = join(fixturesDir, "invalid");

function readFixture(name) {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8"));
}

function readInvalidFixture(name) {
  return JSON.parse(readFileSync(join(invalidFixturesDir, name), "utf8"));
}

test("plan fixture validates against TypeScript contract", () => {
  const plan = validatePlanContract(readFixture("plan-basic.json"));

  assert.equal(plan.schemaVersion, "1.0.0");
  assert.equal(plan.scale.origin, "top-left");
  assert.equal(plan.scale.unit, "feet");
  assert.equal(Object.hasOwn(plan, "selectionState"), false);
});

test("Phase 2 ER pod fixture validates against TypeScript contract", () => {
  const plan = validatePlanContract(readFixture("plan-er-pod-phase2.json"));

  assert.equal(plan.rooms.length, 7);
  assert.equal(plan.nurseStations.length, 1);
  assert.equal(plan.scale.snapToGrid, true);
  assert.equal(plan.pathEdges.some((edge) => edge.blocked), false);
});

test("scenario fixture validates against TypeScript contract", () => {
  const scenario = validateScenarioContract(readFixture("scenario-basic.json"));

  assert.equal(scenario.schemaVersion, "1.0.0");
  assert.equal(scenario.shiftLengthMinutes, 480);
  assert.equal(scenario.timestepMinutes, 5);
  assert.equal(scenario.seed, 20260521);
});

const invalidPlanFixtures = [
  "plan-duplicate-door-id.json",
  "plan-duplicate-path-edge-id.json",
  "plan-bad-room-type.json",
  "plan-path-edge-missing-node.json",
  "plan-extra-unknown-field.json"
];

for (const fixtureName of invalidPlanFixtures) {
  test(`${fixtureName} is rejected by TypeScript contract`, () => {
    assert.throws(() => validatePlanContract(readInvalidFixture(fixtureName)));
  });
}

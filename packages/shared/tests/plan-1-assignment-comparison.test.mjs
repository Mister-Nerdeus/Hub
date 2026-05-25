import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  buildPlan1AssignmentComparisonOutputs,
  validatePlan1AssignmentComparisonFixtures,
  validatePlanContract
} from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));
const plan = validatePlanContract(readJson("default-plans/default-er-layout-plan-1.json").plan);
const fixtures = validatePlan1AssignmentComparisonFixtures(readJson("assignments/plan-1/assignment-comparison-fixtures.json"), plan);
const outputs = buildPlan1AssignmentComparisonOutputs({ plan, fixtures });

test("comparison fixtures are deterministic and named", () => {
  assert.deepEqual(outputs.map((output) => output.fixtureId), [
    "fixture-plan-1-balanced-3-to-1",
    "fixture-plan-1-light-4-to-1",
    "fixture-plan-1-heavy-4-to-1",
    "fixture-plan-1-walking-heavy-3-to-1",
    "fixture-plan-1-trauma-mismatch"
  ]);
});

test("3-room assignment can be heavier than a 4-room assignment", () => {
  assert.ok(byId("fixture-plan-1-walking-heavy-3-to-1").totalBurdenScore > byId("fixture-plan-1-light-4-to-1").totalBurdenScore);
});

test("two 4-room assignments produce different burden", () => {
  assert.notEqual(byId("fixture-plan-1-light-4-to-1").totalBurdenScore, byId("fixture-plan-1-heavy-4-to-1").totalBurdenScore);
});

test("trauma mismatch and walking-heavy fixtures are explicit", () => {
  assert.ok(byId("fixture-plan-1-trauma-mismatch").warningCodes.includes("TRAUMA_ROOM_WITH_NON_TRAUMA_QUALIFIED_NURSE"));
  assert.ok(byId("fixture-plan-1-walking-heavy-3-to-1").walkingTotalFeet > byId("fixture-plan-1-balanced-3-to-1").walkingTotalFeet);
});

function byId(fixtureId) {
  return outputs.find((output) => output.fixtureId === fixtureId);
}

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(fixturesDir, relativePath), "utf8"));
}

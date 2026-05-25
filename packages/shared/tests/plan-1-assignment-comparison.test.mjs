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
const rawFixtureFile = readJson("assignments/plan-1/assignment-comparison-fixtures.json");

test("comparison fixtures are deterministic and named", () => {
  assert.deepEqual(outputs.map((output) => output.fixtureId), [
    "fixture-plan-1-balanced-3-to-1",
    "fixture-plan-1-light-4-to-1",
    "fixture-plan-1-heavy-4-to-1",
    "fixture-plan-1-walking-heavy-3-to-1",
    "fixture-plan-1-trauma-mismatch"
  ]);
});

test("comparison fixtures are normalized through canonical workflow state", () => {
  for (const fixture of fixtures) {
    assert.equal(fixture.workflowState.planId, "default-er-layout-plan-1");
    assert.equal(fixture.workflowState.visualParityStatus, "valid");
    assert.equal(fixture.workflowState.pathSyncStatus, "fresh");
    assert.equal(fixture.workflowState.syntheticDataOnly, true);
    assert.equal(fixture.workflowState.nurses.length, fixture.nurses.length);
    assert.equal(fixture.workflowState.roomLoads.length, fixture.roomLoads.length);
    assert.equal(fixture.workflowState.assignments.length, fixture.assignments.length);
  }
});

test("comparison fixtures reject non-Plan-1 root metadata", () => {
  assert.throws(
    () => validatePlan1AssignmentComparisonFixtures({ ...rawFixtureFile, planId: "default-er-layout-plan-2" }, plan),
    /planId must match default-er-layout-plan-1/u
  );
  assert.throws(
    () => validatePlan1AssignmentComparisonFixtures({ ...rawFixtureFile, schemaVersion: "2.0.0" }, plan),
    /schemaVersion must be 1\.0\.0/u
  );
});

test("comparison fixtures reject duplicate IDs and PHI-like labels", () => {
  assert.throws(
    () =>
      validatePlan1AssignmentComparisonFixtures(
        {
          ...rawFixtureFile,
          fixtures: [
            rawFixtureFile.fixtures[0],
            {
              ...rawFixtureFile.fixtures[1],
              fixtureId: rawFixtureFile.fixtures[0].fixtureId
            }
          ]
        },
        plan
      ),
    /duplicate comparison fixtureId/u
  );
  assert.throws(
    () =>
      validatePlan1AssignmentComparisonFixtures(
        {
          ...rawFixtureFile,
          fixtures: [
            {
              ...rawFixtureFile.fixtures[0],
              label: ["M", "RN 123456"].join("")
            }
          ]
        },
        plan
      ),
    /NO_PHI_RUNTIME_REJECTION/u
  );
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

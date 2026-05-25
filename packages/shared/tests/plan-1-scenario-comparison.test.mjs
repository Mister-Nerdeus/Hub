import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { validatePlan1ScenarioComparisonFixture } from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));
const comparison = readJson("scenarios/plan-1/scenario-comparison-fixtures.json");

test("Plan 1 scenario comparison fixture validates required profile outputs", () => {
  const fixture = validatePlan1ScenarioComparisonFixture(comparison);
  const profileIds = fixture.items.map((item) => item.profileId);
  for (const profileId of [
    "plan-1-typical",
    "plan-1-busy",
    "plan-1-slammed",
    "plan-1-trauma-heavy",
    "plan-1-walking-heavy"
  ]) {
    assert.ok(profileIds.includes(profileId));
  }
});

test("Plan 1 scenario comparison proof cases hold", () => {
  const fixture = validatePlan1ScenarioComparisonFixture(comparison);
  assert.equal(fixture.proof.slammedHigherTaskPressureThanTypical, true);
  assert.equal(fixture.proof.walkingHeavyHigherWalkingBurdenThanTypical, true);
  assert.equal(fixture.proof.traumaHeavyCreatesTraumaWorkloadSignal, true);
  assert.equal(fixture.proof.deterministicOutput, true);
});

test("Plan 1 scenario comparison rejects invalid scope and staffing recommendation wording", () => {
  assert.throws(() => validatePlan1ScenarioComparisonFixture({ ...comparison, planId: "default-er-layout-plan-2" }), /Plan 1/u);
  assert.throws(
    () => validatePlan1ScenarioComparisonFixture({ ...comparison, limitations: ["recommended staffing"] }),
    /recommendation|staffing/u
  );
});

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(fixturesDir, relativePath), "utf8"));
}

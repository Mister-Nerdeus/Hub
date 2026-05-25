import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  assertPlan1AssumptionDisplayGroupsComplete,
  buildPlan1AssumptionDisplayGroups,
  buildPlan1AssumptionViewModel,
  validatePlan1SimulationAssumptions
} from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));
const assumptions = validatePlan1SimulationAssumptions(readJson("scenarios/plan-1/assumptions-register.json"));

test("Plan 1 assumption display groups expose required reader sections", () => {
  const groups = buildPlan1AssumptionDisplayGroups(buildPlan1AssumptionViewModel(assumptions));
  assertPlan1AssumptionDisplayGroupsComplete(groups);
  assert.deepEqual(
    groups.map((group) => group.label),
    [
      "What this simulation assumes",
      "Walking and route assumptions",
      "Task volume and duration assumptions",
      "Queue and interruption assumptions",
      "Warning thresholds",
      "What this simulation does NOT claim"
    ]
  );
});

test("Plan 1 assumption display groups keep deterministic source entries", () => {
  const viewModel = buildPlan1AssumptionViewModel(assumptions);
  const first = buildPlan1AssumptionDisplayGroups(viewModel);
  const second = buildPlan1AssumptionDisplayGroups(viewModel);

  assert.deepEqual(first, second);
  const walkingGroup = first.find((group) => group.groupId === "walking-and-route-assumptions");
  assert.ok(walkingGroup.entries.length > 0);
  assert.ok(walkingGroup.entries.some((entry) => entry.label.includes("Default Task Walking Feet")));
  assert.ok(first.find((group) => group.groupId === "warning-thresholds").entries.length > 0);
});

test("Plan 1 assumption display groups preserve limitations and non-claims", () => {
  const groups = buildPlan1AssumptionDisplayGroups(buildPlan1AssumptionViewModel(assumptions));
  const nonClaimGroup = groups.find((group) => group.groupId === "what-this-simulation-does-not-claim");

  assert.ok(nonClaimGroup.nonClaims.includes("Not a staffing compliance recommendation."));
  assert.ok(nonClaimGroup.limitations.includes("Plan 1 only."));
});

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(fixturesDir, relativePath), "utf8"));
}

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  assertPlan1SummaryHasNoRecommendationClaims,
  buildPlan1OperationalSummary
} from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));
const dryRun = readJson("scenarios/plan-1/dry-run-baseline-output.json");

test("Plan 1 operational summary derives readable dry-run metrics", () => {
  const summary = buildPlan1OperationalSummary(dryRun);
  assert.equal(summary.scenarioId, dryRun.scenarioId);
  assert.equal(summary.taskCount, dryRun.taskCount);
  assert.equal(summary.completedTaskCount, dryRun.completedTaskCount);
  assert.equal(summary.deferredTaskCount, dryRun.deferredTaskCount);
  assert.ok(summary.totalApproxWalkingFeet > 0);
  assert.ok(summary.highestBurdenNurseId.length > 0);
  assertPlan1SummaryHasNoRecommendationClaims(summary);
});

test("Plan 1 operational summary rejects mismatched totals, missing non-claims, and non-Plan-1 output", () => {
  assert.throws(() => buildPlan1OperationalSummary({ ...dryRun, planId: "default-er-layout-plan-2" }), /Plan 1/u);
  assert.throws(() => buildPlan1OperationalSummary({ ...dryRun, completedTaskCount: dryRun.completedTaskCount + 1 }), /totals/u);
  assert.throws(() => buildPlan1OperationalSummary({ ...dryRun, nonClaims: [] }), /nonClaims|not be empty/u);
});

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(fixturesDir, relativePath), "utf8"));
}

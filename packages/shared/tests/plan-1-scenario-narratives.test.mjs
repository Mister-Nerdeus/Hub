import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  assertPlan1ScenarioNarrativeClaims,
  buildPlan1ScenarioComparisonViewModel,
  buildPlan1ScenarioNarratives,
  validatePlan1ScenarioComparisonFixture
} from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));
const comparison = validatePlan1ScenarioComparisonFixture(readJson("scenarios/plan-1/scenario-comparison-fixtures.json"));

test("Plan 1 scenario narratives include required deterministic narrative types", () => {
  const viewModel = buildPlan1ScenarioComparisonViewModel(comparison);
  const narratives = buildPlan1ScenarioNarratives(viewModel);

  assert.deepEqual(
    Object.keys(narratives.requiredNarratives).sort(),
    [
      "overall_demo_summary",
      "typical_vs_slammed",
      "typical_vs_trauma_heavy",
      "typical_vs_walking_heavy"
    ].sort()
  );
  assert.equal(narratives.syntheticDataOnly, true);
  assert.deepEqual(narratives, buildPlan1ScenarioNarratives(viewModel));
});

test("Plan 1 scenario narratives use human-readable operational comparison language", () => {
  const narratives = buildPlan1ScenarioComparisonViewModel(comparison).narratives.requiredNarratives;

  assert.match(narratives.typical_vs_slammed.summary, /higher synthetic task pressure/u);
  assert.match(narratives.typical_vs_slammed.summary, /more deferred synthetic work/u);
  assert.match(narratives.typical_vs_walking_heavy.summary, /higher approximate walking load/u);
  assert.match(narratives.typical_vs_trauma_heavy.summary, /larger queue-depth signal/u);
  assert.match(narratives.overall_demo_summary.summary, /operational comparison only/u);
});

test("Plan 1 scenario narratives reject prohibited safety, compliance, and outcome wording", () => {
  const baseline = buildPlan1ScenarioComparisonViewModel(comparison).narratives.requiredNarratives.typical_vs_slammed;

  for (const prohibitedSummary of [
    "This proves unsafe staffing.",
    "This is safe.",
    "This is staffing compliant.",
    "This is clinically unacceptable.",
    "This predicts outcomes.",
    "This sets a required staffing level.",
    "This predicts patient harm."
  ]) {
    assert.throws(
      () => assertPlan1ScenarioNarrativeClaims({ ...baseline, summary: prohibitedSummary }),
      /prohibited claim language/u
    );
  }
});

test("Plan 1 scenario narratives keep limitations and non-claims attached", () => {
  const narratives = buildPlan1ScenarioComparisonViewModel(comparison).narratives;

  for (const narrative of narratives.narratives) {
    assert.ok(narrative.limitations.includes("Plan 1 deterministic dry-run foundation only."));
    assert.ok(narrative.nonClaims.includes("Not a staffing compliance recommendation."));
  }
});

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(fixturesDir, relativePath), "utf8"));
}

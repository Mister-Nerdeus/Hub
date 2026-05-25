import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  PLAN_1_REQUIRED_INTENSITY_PROFILE_IDS,
  validatePlan1ScenarioIntensityProfiles
} from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));
const fixture = readJson("scenarios/plan-1/scenario-intensity-profiles.json");

test("Plan 1 intensity profiles validate required deterministic profiles", () => {
  const profiles = validatePlan1ScenarioIntensityProfiles(fixture);
  assert.deepEqual(profiles.map((profile) => profile.profileId), [...PLAN_1_REQUIRED_INTENSITY_PROFILE_IDS]);
  assert.ok(profiles.every((profile) => Number.isSafeInteger(profile.seedDefault)));
  assert.ok(profiles.every((profile) => profile.syntheticDataOnly));
});

test("slammed profile carries the highest synthetic task pressure multiplier", () => {
  const profiles = validatePlan1ScenarioIntensityProfiles(fixture);
  const slammed = profiles.find((profile) => profile.profileId === "plan-1-slammed");
  const typical = profiles.find((profile) => profile.profileId === "plan-1-typical");
  assert.ok(slammed.taskVolumeMultiplier > typical.taskVolumeMultiplier);
  assert.ok(slammed.acuityPressureMultiplier > typical.acuityPressureMultiplier);
});

test("Plan 1 intensity profiles reject invalid shape and non-synthetic wording", () => {
  const invalid = structuredClone(fixture);
  delete invalid.profiles[0].profileId;
  assert.throws(() => validatePlan1ScenarioIntensityProfiles(invalid), /profileId/u);

  const duplicate = structuredClone(fixture);
  duplicate.profiles[1].profileId = duplicate.profiles[0].profileId;
  assert.throws(() => validatePlan1ScenarioIntensityProfiles(duplicate), /duplicate/u);

  const negative = structuredClone(fixture);
  negative.profiles[0].taskVolumeMultiplier = -1;
  assert.throws(() => validatePlan1ScenarioIntensityProfiles(negative), /positive/u);

  const nonSynthetic = structuredClone(fixture);
  nonSynthetic.profiles[0].syntheticDataOnly = false;
  assert.throws(() => validatePlan1ScenarioIntensityProfiles(nonSynthetic), /syntheticDataOnly/u);

  const predictive = structuredClone(fixture);
  predictive.profiles[0].description = "real demand forecast";
  assert.throws(() => validatePlan1ScenarioIntensityProfiles(predictive), /prediction/u);
});

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(fixturesDir, relativePath), "utf8"));
}

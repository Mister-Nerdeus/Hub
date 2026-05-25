import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  buildPlan1DemoSeedPackSummary,
  validatePlan1DemoSeedPack
} from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));
const seedPackFixture = readJson("demo/plan-1/plan-1-demo-seed-pack.json");

const requiredSeedIds = [
  "demo-plan-1-typical",
  "demo-plan-1-slammed",
  "demo-plan-1-walking-heavy",
  "demo-plan-1-trauma-heavy",
  "demo-plan-1-comparison"
];

const requiredExpectedSignals = [
  "higher synthetic task pressure",
  "more deferred synthetic work",
  "higher approximate walking load",
  "larger queue-depth signal",
  "proof report available"
];

test("Plan 1 demo seed pack contains the required deterministic seeds", () => {
  const seedPack = validatePlan1DemoSeedPack(seedPackFixture);
  const summary = buildPlan1DemoSeedPackSummary(seedPack);

  assert.deepEqual(summary.demoSeedIds, requiredSeedIds);
  assert.equal(summary.seedCount, requiredSeedIds.length);
  assert.equal(summary.syntheticDataOnly, true);
  assert.equal(summary.nonClaims.includes("Synthetic operational modeling only."), true);
});

test("Plan 1 demo seed pack exposes expected demo signals", () => {
  const summary = buildPlan1DemoSeedPackSummary(validatePlan1DemoSeedPack(seedPackFixture));

  for (const signal of requiredExpectedSignals) {
    assert.equal(summary.expectedSignals.includes(signal), true, `missing signal ${signal}`);
  }
});

test("Plan 1 demo seed pack summary is deterministic", () => {
  const seedPack = validatePlan1DemoSeedPack(seedPackFixture);

  assert.deepEqual(
    buildPlan1DemoSeedPackSummary(seedPack),
    buildPlan1DemoSeedPackSummary(seedPack)
  );
});

test("Plan 1 demo seed pack rejects missing required seeds", () => {
  assert.throws(
    () => validatePlan1DemoSeedPack({
      ...seedPackFixture,
      seeds: seedPackFixture.seeds.filter((seed) => seed.demoSeedId !== "demo-plan-1-comparison")
    }),
    /missing demo-plan-1-comparison/u
  );
});

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(fixturesDir, relativePath), "utf8"));
}

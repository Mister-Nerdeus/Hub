import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  summarizeCapacityRoomEligibility,
  validateDefaultSavedPlanFixtureContract
} from "../dist/index.js";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));

test("capacity and ratio room eligibility excludes canonical storage", () => {
  const fixture = validateDefaultSavedPlanFixtureContract(
    JSON.parse(readFileSync(join(repoRoot, "packages/shared/fixtures/default-plans/default-er-layout-plan-1.json"), "utf8")),
    {
      sourcePlanIds: new Set(["source-er-layout-plan-1"]),
      mappingIds: new Set(["mapping-er-layout-plan-1"])
    }
  );
  const summary = summarizeCapacityRoomEligibility(fixture.plan);
  assert.equal(summary.excludedRoomIds.includes("room-14"), true);
  assert.equal(summary.eligibleActiveRoomIds.includes("room-14"), false);
  assert.equal(summary.ratioCountRoomCount, fixture.plan.rooms.length - summary.excludedRoomCount);
});

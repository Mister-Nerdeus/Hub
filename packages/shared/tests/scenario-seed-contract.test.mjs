import assert from "node:assert/strict";
import test from "node:test";

import {
  CANONICAL_ER_POD_FLOORPLAN_ID,
  fourToOneScenarioSeedFixture,
  validateScenarioSeedContract
} from "../dist/index.js";

test("scenario seed references one canonical floorplan without geometry", () => {
  const seed = validateScenarioSeedContract(fourToOneScenarioSeedFixture);
  assert.equal(seed.canonicalFloorplanId, CANONICAL_ER_POD_FLOORPLAN_ID);
  assert.equal(Object.hasOwn(seed, "floorplan"), false);
  assert.equal(Object.hasOwn(seed, "rooms"), false);
});

test("scenario seed rejects missing or multiple floorplan references", () => {
  const missingFloorplan = { ...fourToOneScenarioSeedFixture };
  delete missingFloorplan.canonicalFloorplanId;
  assert.throws(() => validateScenarioSeedContract(missingFloorplan), /canonicalFloorplanId/);

  assert.throws(
    () => validateScenarioSeedContract({ ...fourToOneScenarioSeedFixture, canonicalFloorplanIds: [CANONICAL_ER_POD_FLOORPLAN_ID] }),
    /not allowed/
  );
});

test("scenario seed rejects embedded floorplan copies and timeline fields", () => {
  assert.throws(
    () => validateScenarioSeedContract({ ...fourToOneScenarioSeedFixture, floorplan: { rooms: [] } }),
    /not allowed/
  );
  assert.throws(
    () => validateScenarioSeedContract({ ...fourToOneScenarioSeedFixture, shiftTimeline: [] }),
    /not allowed/
  );
});

test("scenario seed rejects identity-like fields", () => {
  assert.throws(
    () => validateScenarioSeedContract({ ...fourToOneScenarioSeedFixture, ["patient" + "Name"]: "Jane Example" }),
    /forbidden/
  );
});

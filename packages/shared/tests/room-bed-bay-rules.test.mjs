import assert from "node:assert/strict";
import test from "node:test";

import {
  LAYOUT_OCCUPANCY_TYPES,
  canonicalRoomBedBayEntry,
  getRoomBedBayEligibilityRule,
  isAssignmentEligibleOccupancy,
  isBedCountEligibleOccupancy,
  isPatientCareEligibleOccupancy,
  isRatioEligibleOccupancy,
  isRoomCountEligibleOccupancy
} from "../dist/index.js";

test("room/bed/bay rules cover every occupancy type", () => {
  for (const occupancyType of LAYOUT_OCCUPANCY_TYPES) {
    assert.equal(getRoomBedBayEligibilityRule(occupancyType).occupancyType, occupancyType);
  }
});

test("bed positions are assignable/countable as beds but not independent rooms", () => {
  assert.equal(isPatientCareEligibleOccupancy("bed_position"), true);
  assert.equal(isBedCountEligibleOccupancy("bed_position"), true);
  assert.equal(isRoomCountEligibleOccupancy("bed_position"), false);
  assert.equal(isAssignmentEligibleOccupancy("bed_position"), true);
  assert.equal(isRatioEligibleOccupancy("bed_position"), true);
});

test("storage, support, hallway, and solid wall are excluded from patient math", () => {
  for (const occupancyType of ["storage", "support_area", "hallway", "solid_wall"]) {
    assert.equal(isPatientCareEligibleOccupancy(occupancyType), false, occupancyType);
    assert.equal(isBedCountEligibleOccupancy(occupancyType), false, occupancyType);
    assert.equal(isAssignmentEligibleOccupancy(occupancyType), false, occupancyType);
    assert.equal(isRatioEligibleOccupancy(occupancyType), false, occupancyType);
  }
});

test("canonical storage entry is non-patient and non-countable", () => {
  const storage = canonicalRoomBedBayEntry("room-14");
  assert.ok(storage);
  assert.equal(storage.occupancyType, "storage");
  assert.equal(storage.bedPositionCount, 0);
  assert.equal(storage.roomCountEligible, false);
});

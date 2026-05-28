import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  CANONICAL_ROOM_BED_BAY_ENTRIES,
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

test("canonical room/bed/bay entries cover every Plan 1 room and primary support object", () => {
  const fixture = JSON.parse(
    readFileSync(new URL("../fixtures/default-plans/default-er-layout-plan-1.json", import.meta.url), "utf8")
  );
  const plan = fixture.plan;
  const entryIds = new Set(CANONICAL_ROOM_BED_BAY_ENTRIES.map((entry) => entry.objectId));

  for (const room of plan.rooms) {
    assert.equal(entryIds.has(room.id), true, `${room.id} is missing room/bed/bay semantics`);
  }
  for (const station of plan.nurseStations) {
    assert.equal(entryIds.has(station.id), true, `${station.id} is missing support-area semantics`);
  }
  for (const hallway of plan.hallways) {
    assert.equal(entryIds.has(hallway.id), true, `${hallway.id} is missing hallway semantics`);
  }
  assert.equal(canonicalRoomBedBayEntry("zone-provider-pharmacy")?.occupancyType, "support_area");
});

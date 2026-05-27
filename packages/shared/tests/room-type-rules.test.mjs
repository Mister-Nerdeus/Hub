import assert from "node:assert/strict";
import test from "node:test";

import {
  EDITABLE_ROOM_TYPES,
  ROOM_TYPES,
  ROOM_TYPE_RULES,
  getRoomTypeRule,
  isBurdenScoreEligibleRoomType,
  isDoorEligibleRoomType,
  isNurseAssignableRoomType,
  isPathNodeEligibleRoomType,
  isRatioCountEligibleRoomType,
  isRoomLoadEligibleRoomType
} from "../dist/index.js";

test("room type semantic rules cover all persisted and editable room types", () => {
  for (const roomType of new Set([...ROOM_TYPES, ...EDITABLE_ROOM_TYPES])) {
    assert.equal(getRoomTypeRule(roomType).roomType, roomType);
  }
});

test("patient-care room-like types remain eligible for operational room semantics", () => {
  for (const roomType of ["standard", "trauma", "isolation", "psych", "behavioral", "hall_bed", "procedure", "overflow"]) {
    const rule = getRoomTypeRule(roomType);
    assert.equal(rule.patientCareEligible, true, roomType);
    assert.equal(rule.nurseAssignable, true, roomType);
    assert.equal(rule.roomLoadEligible, true, roomType);
    assert.equal(rule.ratioCountEligible, true, roomType);
    assert.equal(rule.burdenScoreEligible, true, roomType);
    assert.equal(rule.pathNodeEligible, true, roomType);
    assert.equal(rule.doorEligible, true, roomType);
    assert.equal(rule.travelBlocking, false, roomType);
    assert.equal(rule.presentationMuted, false, roomType);
  }
});

test("storage is not assignable or countable as a patient-care room", () => {
  assert.equal(ROOM_TYPE_RULES.storage.patientCareEligible, false);
  assert.equal(isNurseAssignableRoomType("storage"), false);
  assert.equal(isRatioCountEligibleRoomType("storage"), false);
  assert.equal(isRoomLoadEligibleRoomType("storage"), false);
  assert.equal(isBurdenScoreEligibleRoomType("storage"), false);
  assert.equal(isPathNodeEligibleRoomType("storage"), false);
});

test("solid wall is blocked from doors, assignment, load, path nodes, and ratio math", () => {
  assert.equal(ROOM_TYPE_RULES.solid_wall.patientCareEligible, false);
  assert.equal(isNurseAssignableRoomType("solid_wall"), false);
  assert.equal(isRatioCountEligibleRoomType("solid_wall"), false);
  assert.equal(isRoomLoadEligibleRoomType("solid_wall"), false);
  assert.equal(isBurdenScoreEligibleRoomType("solid_wall"), false);
  assert.equal(isPathNodeEligibleRoomType("solid_wall"), false);
  assert.equal(isDoorEligibleRoomType("solid_wall"), false);
  assert.equal(ROOM_TYPE_RULES.solid_wall.travelBlocking, true);
});

import test from "node:test";
import assert from "node:assert/strict";
import {
  applyDoorWidthPreset,
  clampDoorWidthToWall,
  decreaseDoorWidth,
  deriveDoorOrientationFromWall,
  increaseDoorWidth
} from "../dist/index.js";

const room = {
  objectType: "room",
  id: "room-01",
  label: "Room 01",
  roomNumber: "01",
  roomType: "standard",
  capacityType: "single",
  isHallBed: false,
  isTraumaAdjacent: false,
  xFeet: 0,
  yFeet: 0,
  widthFeet: 6,
  heightFeet: 10
};
const door = {
  objectType: "door",
  id: "door-01",
  label: "Door 01",
  ownerKind: "room",
  ownerId: "room-01",
  wall: "north",
  offsetFeet: 1,
  widthFeet: 4
};

test("increases, decreases, presets, clamps, and derives orientation", () => {
  assert.equal(increaseDoorWidth({ door, room }).widthFeet, 5);
  assert.equal(decreaseDoorWidth({ door, room }).widthFeet, 3);
  assert.equal(applyDoorWidthPreset({ door, room, widthFeet: 6 }).widthFeet, 6);
  assert.deepEqual(clampDoorWidthToWall({ room, wall: "north", widthFeet: 99, offsetFeet: 5 }), {
    widthFeet: 6,
    offsetFeet: 0,
    orientation: "horizontal",
    clamped: true
  });
  assert.equal(deriveDoorOrientationFromWall("east"), "vertical");
});

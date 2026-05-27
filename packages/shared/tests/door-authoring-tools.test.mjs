import test from "node:test";
import assert from "node:assert/strict";
import {
  centerDoorOnWall,
  clampDoorOffsetToWall,
  moveToOppositeWall,
  nudgeDoor,
  preserveOffsetWhenOwnerChanges
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
  widthFeet: 12,
  heightFeet: 10
};
const door = {
  objectType: "door",
  id: "door-01",
  label: "Door 01",
  ownerKind: "room",
  ownerId: "room-01",
  wall: "north",
  offsetFeet: 3,
  widthFeet: 4
};

test("centers and nudges doors within wall bounds", () => {
  assert.deepEqual(centerDoorOnWall({ door, room }), { wall: "north", offsetFeet: 4 });
  assert.deepEqual(nudgeDoor({ door, room, deltaFeet: -10 }), { wall: "north", offsetFeet: 0 });
  assert.deepEqual(nudgeDoor({ door, room, deltaFeet: 20 }), { wall: "north", offsetFeet: 8 });
});

test("moves to opposite wall while preserving valid offset", () => {
  assert.deepEqual(moveToOppositeWall({ door, room }), { wall: "south", offsetFeet: 3 });
});

test("preserves and clamps offset when room owner changes", () => {
  const smallerRoom = { ...room, id: "room-02", widthFeet: 6 };
  assert.equal(
    preserveOffsetWhenOwnerChanges({
      fromRoom: room,
      toRoom: smallerRoom,
      wall: "north",
      offsetFeet: 8,
      widthFeet: 4
    }),
    2
  );
  assert.equal(clampDoorOffsetToWall({ room: smallerRoom, wall: "north", offsetFeet: 99, widthFeet: 4 }), 2);
});

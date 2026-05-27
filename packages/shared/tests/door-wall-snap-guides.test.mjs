import test from "node:test";
import assert from "node:assert/strict";
import { buildDoorWallSnapGuide, snapDoorOffsetToIncrement } from "../dist/index.js";

test("builds snap markers, centerline, and offset marker values", () => {
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
  const door = { objectType: "door", id: "door-01", label: "Door", ownerKind: "room", ownerId: "room-01", wall: "north", offsetFeet: 3, widthFeet: 4 };
  const guide = buildDoorWallSnapGuide({ door, room, snapIncrementFeet: 2 });
  assert.equal(guide.wallLengthFeet, 12);
  assert.equal(guide.centerOffsetFeet, 4);
  assert.equal(guide.currentOffsetFeet, 3);
  assert.deepEqual(guide.markers.map((marker) => marker.offsetFeet), [0, 2, 4, 6, 8]);
  assert.equal(snapDoorOffsetToIncrement({ offsetFeet: 3.2, incrementFeet: 2, maxOffsetFeet: 8 }), 4);
});

import test from "node:test";
import assert from "node:assert/strict";
import { alignRoomToReference, snapRoomToGrid } from "../dist/index.js";

test("aligns room edges, matches size, and snaps to grid without mutating input", () => {
  const layout = testLayout();
  assert.equal(roomById(alignRoomToReference({ layout, roomId: "target", referenceRoomId: "reference", operation: "alignTop" }), "target").yFeet, 3);
  assert.equal(roomById(alignRoomToReference({ layout, roomId: "target", referenceRoomId: "reference", operation: "alignBottom" }), "target").yFeet, 7);
  assert.equal(roomById(alignRoomToReference({ layout, roomId: "target", referenceRoomId: "reference", operation: "alignLeft" }), "target").xFeet, 5);
  assert.equal(roomById(alignRoomToReference({ layout, roomId: "target", referenceRoomId: "reference", operation: "alignRight" }), "target").xFeet, 9);
  assert.equal(roomById(alignRoomToReference({ layout, roomId: "target", referenceRoomId: "reference", operation: "matchWidth" }), "target").widthFeet, 12);
  assert.equal(roomById(alignRoomToReference({ layout, roomId: "target", referenceRoomId: "reference", operation: "matchHeight" }), "target").heightFeet, 10);
  assert.deepEqual(
    roomById(snapRoomToGrid({ layout, roomId: "target", gridFeet: 2 }), "target"),
    { ...roomById(layout, "target"), xFeet: 22, yFeet: 16, widthFeet: 8, heightFeet: 6 }
  );
  assert.equal(roomById(layout, "target").xFeet, 21);
});

function roomById(layout, id) {
  return layout.rooms.find((room) => room.id === id);
}

function testLayout() {
  return {
    schemaVersion: "1.0.0",
    layoutId: "room-alignment-test",
    units: "feet",
    rooms: [
      room("reference", "Reference", 5, 3, 12, 10),
      room("target", "Target", 21, 15, 8, 6)
    ],
    doors: [],
    stations: [],
    hallways: [],
    zones: [],
    limitations: ["synthetic geometry test"]
  };
}

function room(id, label, xFeet, yFeet, widthFeet, heightFeet) {
  return {
    objectType: "room",
    id,
    label,
    roomNumber: id,
    roomType: "standard",
    capacityType: "single",
    isHallBed: false,
    isTraumaAdjacent: false,
    xFeet,
    yFeet,
    widthFeet,
    heightFeet
  };
}

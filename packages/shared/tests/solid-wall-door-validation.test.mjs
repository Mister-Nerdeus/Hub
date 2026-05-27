import assert from "node:assert/strict";
import test from "node:test";

import {
  addDoorToRoom,
  canCreateRoomDoorPathNode,
  validateDoorPlacement,
  validateEditableLayoutGeometryContract,
  validateNoSolidWallDoorReferences
} from "../dist/index.js";

const solidWallRoom = {
  objectType: "room",
  id: "solid-wall-01",
  label: "Solid wall",
  roomNumber: "Wall",
  roomType: "solid_wall",
  capacityType: "single",
  isHallBed: false,
  isTraumaAdjacent: false,
  xFeet: 0,
  yFeet: 0,
  widthFeet: 10,
  heightFeet: 10
};

const patientRoom = {
  ...solidWallRoom,
  id: "room-01",
  label: "Room 01",
  roomNumber: "01",
  roomType: "standard"
};

const baseLayout = {
  schemaVersion: "1.0.0",
  layoutId: "solid-wall-door-validation",
  units: "feet",
  rooms: [solidWallRoom, patientRoom],
  doors: [],
  stations: [],
  hallways: [],
  zones: [],
  limitations: ["Synthetic validation fixture."]
};

test("solid wall rejects authored doors", () => {
  assert.throws(
    () =>
      addDoorToRoom({
        layout: baseLayout,
        readOnly: false,
        doorId: "door-solid-wall",
        roomId: "solid-wall-01",
        wall: "north",
        offsetFeet: 1,
        widthFeet: 3
      }),
    /cannot accept doors/
  );
});

test("editable layout validation rejects imported solid-wall door references", () => {
  assert.throws(
    () =>
      validateEditableLayoutGeometryContract({
        ...baseLayout,
        doors: [{
          objectType: "door",
          id: "door-solid-wall",
          label: "Door solid wall",
          ownerKind: "room",
          ownerId: "solid-wall-01",
          wall: "north",
          offsetFeet: 1,
          widthFeet: 3
        }]
      }),
    /solid_wall/
  );
});

test("door placement validity fails for solid walls and normal rooms still work", () => {
  const invalid = validateDoorPlacement({
    layout: baseLayout,
    door: {
      objectType: "door",
      id: "door-solid-wall",
      label: "Door solid wall",
      ownerKind: "room",
      ownerId: "solid-wall-01",
      wall: "north",
      offsetFeet: 1,
      widthFeet: 3
    }
  });
  assert.equal(invalid.status, "invalid");
  assert.ok(invalid.reasonCodes.includes("owner_room_door_ineligible"));

  const normal = addDoorToRoom({
    layout: baseLayout,
    readOnly: false,
    doorId: "door-room-01",
    roomId: "room-01",
    wall: "north",
    offsetFeet: 1,
    widthFeet: 3
  });
  assert.equal(normal.selectedDoorId, "door-room-01");
});

test("solid wall creates no room-door path node", () => {
  assert.equal(canCreateRoomDoorPathNode(solidWallRoom), false);
  assert.equal(canCreateRoomDoorPathNode(patientRoom), true);
});

test("solid-wall validation reports quarantinable door references", () => {
  const issues = validateNoSolidWallDoorReferences({
    ...baseLayout,
    doors: [{
      objectType: "door",
      id: "door-solid-wall",
      label: "Door solid wall",
      ownerKind: "room",
      ownerId: "solid-wall-01",
      wall: "north",
      offsetFeet: 1,
      widthFeet: 3
    }]
  });
  assert.deepEqual(issues.map((issue) => issue.code), ["SOLID_WALL_DOOR_REFERENCE"]);
});

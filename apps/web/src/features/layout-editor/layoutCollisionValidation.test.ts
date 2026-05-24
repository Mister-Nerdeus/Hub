import { layoutEditorProofFixture } from "../../fixtures/layout-editor/layoutEditorProofFixture";
import { validateMovedRoomCollisions } from "./layoutCollisionValidation";

const assert = {
  deepEqual(actual: unknown, expected: unknown): void {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(`Expected ${JSON.stringify(actual)} to deep equal ${JSON.stringify(expected)}`);
    }
  }
};

const movedRoom = layoutEditorProofFixture.rooms[0];
const station = layoutEditorProofFixture.stations[0];
const zone = layoutEditorProofFixture.zones[0];
const hallway = layoutEditorProofFixture.hallways[0];
if (movedRoom == null || station == null || zone == null || hallway == null) {
  throw new Error("proof fixture requires room, station, zone, and hallway geometry");
}

const layoutWithOverlaps = {
  ...layoutEditorProofFixture,
  rooms: [
    movedRoom,
    {
      ...movedRoom,
      id: "room-overlap",
      label: "Overlap room",
      roomNumber: "02",
      xFeet: 6,
      yFeet: 2
    }
  ],
  stations: [
    {
      ...station,
      id: "station-overlap",
      xFeet: 8,
      yFeet: 2
    }
  ],
  zones: [
    {
      ...zone,
      id: "zone-overlap",
      xFeet: 4,
      yFeet: 3
    }
  ],
  hallways: [
    {
      ...hallway,
      id: "hallway-overlap",
      xFeet: 2,
      yFeet: 4
    }
  ]
};

assert.deepEqual(
  validateMovedRoomCollisions({
    layout: layoutWithOverlaps,
    roomId: movedRoom.id,
    includeHallways: true
  }),
  [
    {
      code: "room_overlap_hallway",
      message: "Room overlaps hallway hallway-overlap.",
      objectType: "room",
      objectId: movedRoom.id,
      relatedObjectType: "hallway",
      relatedObjectId: "hallway-overlap"
    },
    {
      code: "room_overlap_room",
      message: "Room overlaps room room-overlap.",
      objectType: "room",
      objectId: movedRoom.id,
      relatedObjectType: "room",
      relatedObjectId: "room-overlap"
    },
    {
      code: "room_overlap_station",
      message: "Room overlaps station station-overlap.",
      objectType: "room",
      objectId: movedRoom.id,
      relatedObjectType: "station",
      relatedObjectId: "station-overlap"
    },
    {
      code: "room_overlap_zone",
      message: "Room overlaps zone zone-overlap.",
      objectType: "room",
      objectId: movedRoom.id,
      relatedObjectType: "zone",
      relatedObjectId: "zone-overlap"
    }
  ]
);

assert.deepEqual(
  validateMovedRoomCollisions({
    layout: layoutWithOverlaps,
    roomId: movedRoom.id,
    includeHallways: false
  }).map((warning) => warning.code),
  ["room_overlap_room", "room_overlap_station", "room_overlap_zone"]
);

assert.deepEqual(
  validateMovedRoomCollisions({
    layout: layoutEditorProofFixture,
    roomId: movedRoom.id,
    includeHallways: true
  }),
  []
);

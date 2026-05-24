import { layoutEditorProofFixture } from "../../fixtures/layout-editor/layoutEditorProofFixture";
import { layoutEditorReducer } from "./layoutEditorReducer";
import { createLayoutEditorState } from "./layoutEditorState";
import { DEFAULT_LAYOUT_BOUNDS_FEET } from "./layoutMoveValidation";
import { validateRoomResizeWarnings } from "./roomResizeValidation";

const assert = {
  equal<T>(actual: T, expected: T): void {
    if (actual !== expected) {
      throw new Error(`Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`);
    }
  },
  deepEqual(actual: unknown, expected: unknown): void {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(`Expected ${JSON.stringify(actual)} to deep equal ${JSON.stringify(expected)}`);
    }
  }
};

const room = layoutEditorProofFixture.rooms.find((candidate) => candidate.id === "room-01");
const station = layoutEditorProofFixture.stations[0];
const zone = layoutEditorProofFixture.zones[0];
const hallway = layoutEditorProofFixture.hallways[0];
if (room == null || station == null || zone == null || hallway == null) {
  throw new Error("proof fixture requires room, station, zone, and hallway geometry");
}

const layoutWithResizeOverlaps = {
  ...layoutEditorProofFixture,
  rooms: [
    room,
    {
      ...room,
      id: "room-overlap",
      label: "Overlap room",
      roomNumber: "02",
      xFeet: 6,
      yFeet: 2
    }
  ],
  stations: [{ ...station, id: "station-overlap", xFeet: 8, yFeet: 2 }],
  zones: [{ ...zone, id: "zone-overlap", xFeet: 4, yFeet: 3 }],
  hallways: [{ ...hallway, id: "hallway-overlap", xFeet: 2, yFeet: 4 }]
};

assert.deepEqual(
  validateRoomResizeWarnings({
    layout: layoutWithResizeOverlaps,
    roomId: room.id,
    boundsFeet: DEFAULT_LAYOUT_BOUNDS_FEET
  }).map((warning) => ({
    code: warning.code,
    source: warning.source,
    relatedObjectType: warning.relatedObjectType,
    relatedObjectId: warning.relatedObjectId
  })),
  [
    {
      code: "room_resize_overlap_hallway",
      source: "resize",
      relatedObjectType: "hallway",
      relatedObjectId: "hallway-overlap"
    },
    {
      code: "room_resize_overlap_room",
      source: "resize",
      relatedObjectType: "room",
      relatedObjectId: "room-overlap"
    },
    {
      code: "room_resize_overlap_station",
      source: "resize",
      relatedObjectType: "station",
      relatedObjectId: "station-overlap"
    },
    {
      code: "room_resize_overlap_zone",
      source: "resize",
      relatedObjectType: "zone",
      relatedObjectId: "zone-overlap"
    }
  ]
);

const selectedState = createLayoutEditorState({
  editableLayout: layoutEditorProofFixture,
  selectedObjectType: "room",
  selectedObjectId: room.id
});

const resizedOverlapState = layoutEditorReducer(selectedState, {
  type: "resizeRoom",
  roomId: room.id,
  handle: "east",
  deltaXFeet: 20,
  deltaYFeet: 0
});
assert.equal(
  resizedOverlapState.validationWarnings.some(
    (warning) => warning.code === "room_resize_overlap_station" && warning.source === "resize"
  ),
  true
);

const resizedClearState = layoutEditorReducer(resizedOverlapState, {
  type: "resizeRoom",
  roomId: room.id,
  handle: "east",
  deltaXFeet: -20,
  deltaYFeet: 0
});
assert.equal(
  resizedClearState.validationWarnings.some((warning) => warning.code.startsWith("room_resize_overlap")),
  false
);

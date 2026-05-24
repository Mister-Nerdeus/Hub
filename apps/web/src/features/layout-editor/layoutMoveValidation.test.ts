import { layoutEditorProofFixture } from "../../fixtures/layout-editor/layoutEditorProofFixture";
import {
  DEFAULT_LAYOUT_BOUNDS_FEET,
  validateRoomMoveBounds,
  validateRoomMoveWarnings
} from "./layoutMoveValidation";

const assert = {
  deepEqual(actual: unknown, expected: unknown): void {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(`Expected ${JSON.stringify(actual)} to deep equal ${JSON.stringify(expected)}`);
    }
  }
};

const room = layoutEditorProofFixture.rooms[0];
if (room == null) {
  throw new Error("proof fixture requires a room");
}

assert.deepEqual(
  validateRoomMoveBounds({
    layout: {
      ...layoutEditorProofFixture,
      rooms: [{ ...room, xFeet: -1 }]
    },
    roomId: room.id,
    boundsFeet: DEFAULT_LAYOUT_BOUNDS_FEET
  }),
  [
    {
      code: "room_out_of_bounds_left",
      severity: "warning",
      source: "bounds",
      message: "Room extends beyond the layout left boundary.",
      objectType: "room",
      objectId: room.id,
      relatedObjectType: null,
      relatedObjectId: null,
      isGenerated: true
    }
  ]
);

assert.deepEqual(
  validateRoomMoveBounds({
    layout: {
      ...layoutEditorProofFixture,
      rooms: [{ ...room, yFeet: -1 }]
    },
    roomId: room.id,
    boundsFeet: DEFAULT_LAYOUT_BOUNDS_FEET
  }),
  [
    {
      code: "room_out_of_bounds_top",
      severity: "warning",
      source: "bounds",
      message: "Room extends beyond the layout top boundary.",
      objectType: "room",
      objectId: room.id,
      relatedObjectType: null,
      relatedObjectId: null,
      isGenerated: true
    }
  ]
);

assert.deepEqual(
  validateRoomMoveBounds({
    layout: {
      ...layoutEditorProofFixture,
      rooms: [{ ...room, xFeet: 60 }]
    },
    roomId: room.id,
    boundsFeet: DEFAULT_LAYOUT_BOUNDS_FEET
  }),
  [
    {
      code: "room_out_of_bounds_right",
      severity: "warning",
      source: "bounds",
      message: "Room extends beyond the layout right boundary.",
      objectType: "room",
      objectId: room.id,
      relatedObjectType: null,
      relatedObjectId: null,
      isGenerated: true
    }
  ]
);

assert.deepEqual(
  validateRoomMoveBounds({
    layout: {
      ...layoutEditorProofFixture,
      rooms: [{ ...room, yFeet: 36 }]
    },
    roomId: room.id,
    boundsFeet: DEFAULT_LAYOUT_BOUNDS_FEET
  }),
  [
    {
      code: "room_out_of_bounds_bottom",
      severity: "warning",
      source: "bounds",
      message: "Room extends beyond the layout bottom boundary.",
      objectType: "room",
      objectId: room.id,
      relatedObjectType: null,
      relatedObjectId: null,
      isGenerated: true
    }
  ]
);

assert.deepEqual(
  validateRoomMoveBounds({
    layout: layoutEditorProofFixture,
    roomId: room.id,
    boundsFeet: DEFAULT_LAYOUT_BOUNDS_FEET
  }),
  []
);

const station = layoutEditorProofFixture.stations[0];
if (station == null) {
  throw new Error("proof fixture requires a station");
}

assert.deepEqual(
  validateRoomMoveWarnings({
    layout: {
      ...layoutEditorProofFixture,
      rooms: [{ ...room, xFeet: -1 }],
      stations: [{ ...station, xFeet: 4, yFeet: 2 }]
    },
    roomId: room.id,
    boundsFeet: DEFAULT_LAYOUT_BOUNDS_FEET
  }).map((warning) => warning.code),
  ["room_out_of_bounds_left", "room_overlap_station"]
);

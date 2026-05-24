import { layoutEditorProofFixture } from "../../fixtures/layout-editor/layoutEditorProofFixture";
import { layoutEditorReducer } from "./layoutEditorReducer";
import { createLayoutEditorState } from "./layoutEditorState";
import { DEFAULT_LAYOUT_BOUNDS_FEET } from "./layoutMoveValidation";
import { validateRoomResizeBounds } from "./roomResizeValidation";

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
if (room == null) {
  throw new Error("proof fixture requires room-01");
}

const warningShape = {
  severity: "warning",
  source: "resize",
  objectType: "room",
  objectId: room.id,
  relatedObjectType: null,
  relatedObjectId: null,
  isGenerated: true
} as const;

assert.deepEqual(
  validateRoomResizeBounds({
    layout: {
      ...layoutEditorProofFixture,
      rooms: [{ ...room, xFeet: -1 }]
    },
    roomId: room.id,
    boundsFeet: DEFAULT_LAYOUT_BOUNDS_FEET
  }),
  [
    {
      code: "room_resize_out_of_bounds_left",
      severity: warningShape.severity,
      source: warningShape.source,
      message: "Resized room extends beyond the layout left boundary.",
      objectType: warningShape.objectType,
      objectId: warningShape.objectId,
      relatedObjectType: warningShape.relatedObjectType,
      relatedObjectId: warningShape.relatedObjectId,
      isGenerated: warningShape.isGenerated
    }
  ]
);

assert.deepEqual(
  validateRoomResizeBounds({
    layout: {
      ...layoutEditorProofFixture,
      rooms: [{ ...room, yFeet: -1 }]
    },
    roomId: room.id,
    boundsFeet: DEFAULT_LAYOUT_BOUNDS_FEET
  }).map((warning) => warning.code),
  ["room_resize_out_of_bounds_top"]
);

assert.deepEqual(
  validateRoomResizeBounds({
    layout: {
      ...layoutEditorProofFixture,
      rooms: [{ ...room, widthFeet: 80 }]
    },
    roomId: room.id,
    boundsFeet: DEFAULT_LAYOUT_BOUNDS_FEET
  }).map((warning) => warning.code),
  ["room_resize_out_of_bounds_right"]
);

assert.deepEqual(
  validateRoomResizeBounds({
    layout: {
      ...layoutEditorProofFixture,
      rooms: [{ ...room, heightFeet: 80 }]
    },
    roomId: room.id,
    boundsFeet: DEFAULT_LAYOUT_BOUNDS_FEET
  }).map((warning) => warning.code),
  ["room_resize_out_of_bounds_bottom"]
);

const selectedState = createLayoutEditorState({
  editableLayout: layoutEditorProofFixture,
  selectedObjectType: "room",
  selectedObjectId: room.id
});

const resizedOutOfBoundsState = layoutEditorReducer(selectedState, {
  type: "resizeRoom",
  roomId: room.id,
  handle: "west",
  deltaXFeet: -2,
  deltaYFeet: 0
});
assert.equal(
  resizedOutOfBoundsState.validationWarnings.some(
    (warning) => warning.code === "room_resize_out_of_bounds_left" && warning.source === "resize"
  ),
  true
);

const resizedBackInBoundsState = layoutEditorReducer(resizedOutOfBoundsState, {
  type: "resizeRoom",
  roomId: room.id,
  handle: "west",
  deltaXFeet: 2,
  deltaYFeet: 0
});
assert.equal(
  resizedBackInBoundsState.validationWarnings.some((warning) => warning.source === "resize"),
  false
);
assert.equal(resizedOutOfBoundsState.isDirty, true);
assert.equal(resizedBackInBoundsState.isDirty, true);

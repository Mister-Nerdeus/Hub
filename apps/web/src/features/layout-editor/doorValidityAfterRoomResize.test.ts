import { layoutEditorProofFixture } from "../../fixtures/layout-editor/layoutEditorProofFixture";
import { layoutEditorReducer } from "./layoutEditorReducer";
import { createLayoutEditorState } from "./layoutEditorState";
import { validateDoorValidityAfterRoomResize } from "./doorValidityAfterRoomResize";

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
const door = layoutEditorProofFixture.doors.find((candidate) => candidate.ownerId === "room-01");
if (room == null || door == null) {
  throw new Error("proof fixture requires room-01 and attached door geometry");
}

const warningShape = {
  code: "door_exceeds_resized_room_wall",
  severity: "warning",
  source: "door_sync",
  message: "Door span exceeds resized room wall length.",
  objectType: "room",
  objectId: room.id,
  relatedObjectType: "door",
  relatedObjectId: door.id,
  isGenerated: true
} as const;

assert.deepEqual(
  validateDoorValidityAfterRoomResize({
    layout: {
      ...layoutEditorProofFixture,
      rooms: [{ ...room, heightFeet: 5 }]
    },
    roomId: room.id
  }),
  [warningShape]
);

const wallLengthCases = [
  ["north", { widthFeet: 5, heightFeet: 10 }],
  ["south", { widthFeet: 5, heightFeet: 10 }],
  ["east", { widthFeet: 12, heightFeet: 5 }],
  ["west", { widthFeet: 12, heightFeet: 5 }]
] as const;

for (const [wall, roomSize] of wallLengthCases) {
  assert.deepEqual(
    validateDoorValidityAfterRoomResize({
      layout: {
        ...layoutEditorProofFixture,
        rooms: [{ ...room, ...roomSize }],
        doors: [{ ...door, wall, offsetFeet: 3, widthFeet: 4 }]
      },
      roomId: room.id
    }).map((warning) => warning.code),
    ["door_exceeds_resized_room_wall"]
  );
}

assert.deepEqual(
  validateDoorValidityAfterRoomResize({
    layout: {
      ...layoutEditorProofFixture,
      rooms: [],
      doors: [{ ...door, ownerId: room.id }]
    },
    roomId: room.id
  }).map((warning) => warning.code),
  ["door_owner_geometry_missing_after_resize"]
);

const selectedState = createLayoutEditorState({
  editableLayout: {
    ...layoutEditorProofFixture,
    doors: [{ ...door, offsetFeet: 3, widthFeet: 4 }]
  },
  selectedObjectType: "room",
  selectedObjectId: room.id
});

const resizedDoorInvalidState = layoutEditorReducer(selectedState, {
  type: "resizeRoom",
  roomId: room.id,
  handle: "south",
  deltaXFeet: 0,
  deltaYFeet: -4
});
assert.equal(
  resizedDoorInvalidState.validationWarnings.some(
    (warning) => warning.code === "door_exceeds_resized_room_wall" && warning.source === "door_sync"
  ),
  true
);
assert.deepEqual(resizedDoorInvalidState.editableLayout?.doors, selectedState.editableLayout?.doors);

const resizedDoorValidState = layoutEditorReducer(resizedDoorInvalidState, {
  type: "resizeRoom",
  roomId: room.id,
  handle: "south",
  deltaXFeet: 0,
  deltaYFeet: 4
});
assert.equal(
  resizedDoorValidState.validationWarnings.some((warning) => warning.source === "door_sync"),
  false
);

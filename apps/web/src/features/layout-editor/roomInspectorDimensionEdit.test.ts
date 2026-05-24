import { layoutEditorProofFixture } from "../../fixtures/layout-editor/layoutEditorProofFixture";
import {
  editSelectedRoomDimensionsInLayout,
  type RoomInspectorDimensionChanges
} from "./roomInspectorDimensionEdit";

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
  },
  throws(fn: () => void, pattern: RegExp): void {
    try {
      fn();
    } catch (error) {
      if (error instanceof Error && pattern.test(error.message)) {
        return;
      }
      throw error;
    }
    throw new Error(`Expected function to throw ${pattern}`);
  }
};

const room = layoutEditorProofFixture.rooms.find((candidate) => candidate.id === "room-01");
if (room == null) {
  throw new Error("proof fixture requires room-01");
}

const changes: RoomInspectorDimensionChanges = {
  xFeet: 1.2,
  yFeet: 1.6,
  widthFeet: 3,
  heightFeet: 8.25
};

const editedLayout = editSelectedRoomDimensionsInLayout({
  layout: layoutEditorProofFixture,
  selectedObjectType: "room",
  selectedObjectId: room.id,
  roomId: room.id,
  changes,
  snapMode: "default"
});
const editedRoom = editedLayout.rooms.find((candidate) => candidate.id === room.id);
if (editedRoom == null) {
  throw new Error("edited layout must include room-01");
}

assert.deepEqual(
  {
    xFeet: editedRoom.xFeet,
    yFeet: editedRoom.yFeet,
    widthFeet: editedRoom.widthFeet,
    heightFeet: editedRoom.heightFeet
  },
  {
    xFeet: 1,
    yFeet: 2,
    widthFeet: 4,
    heightFeet: 8
  }
);
assert.equal(editedRoom.label, room.label);
assert.equal(editedRoom.roomNumber, room.roomNumber);
assert.deepEqual(editedLayout.doors, layoutEditorProofFixture.doors);

const fineEditedLayout = editSelectedRoomDimensionsInLayout({
  layout: layoutEditorProofFixture,
  selectedObjectType: "room",
  selectedObjectId: room.id,
  roomId: room.id,
  changes: { xFeet: 1.25, heightFeet: 8.75 },
  snapMode: "fine"
});
const fineEditedRoom = fineEditedLayout.rooms.find((candidate) => candidate.id === room.id);
if (fineEditedRoom == null) {
  throw new Error("fine edited layout must include room-01");
}
assert.equal(fineEditedRoom.xFeet, 1.5);
assert.equal(fineEditedRoom.heightFeet, 9);

const nonRoomSelectionLayout = editSelectedRoomDimensionsInLayout({
  layout: layoutEditorProofFixture,
  selectedObjectType: "door",
  selectedObjectId: "door-room-01-east",
  roomId: room.id,
  changes: { widthFeet: 20 },
  snapMode: "default"
});
assert.equal(nonRoomSelectionLayout, layoutEditorProofFixture);
assert.deepEqual(layoutEditorProofFixture.rooms[0], room);

assert.throws(
  () =>
    editSelectedRoomDimensionsInLayout({
      layout: layoutEditorProofFixture,
      selectedObjectType: "room",
      selectedObjectId: room.id,
      roomId: room.id,
      changes: { xFeet: Number.NaN },
      snapMode: "default"
    }),
  /finite number/
);

const minimumSizeLayout = editSelectedRoomDimensionsInLayout({
  layout: layoutEditorProofFixture,
  selectedObjectType: "room",
  selectedObjectId: room.id,
  roomId: room.id,
  changes: { widthFeet: 1, heightFeet: 2 },
  snapMode: "default"
});
const minimumSizeRoom = minimumSizeLayout.rooms.find((candidate) => candidate.id === room.id);
if (minimumSizeRoom == null) {
  throw new Error("minimum size layout must include room-01");
}
assert.equal(minimumSizeRoom.widthFeet, 4);
assert.equal(minimumSizeRoom.heightFeet, 4);

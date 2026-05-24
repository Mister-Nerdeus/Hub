import { layoutEditorProofFixture } from "../../fixtures/layout-editor/layoutEditorProofFixture";
import { resizeSelectedRoomInLayout } from "./roomResizeInteraction";

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

const snapshot = JSON.stringify(layoutEditorProofFixture);

const resizedLayout = resizeSelectedRoomInLayout({
  layout: layoutEditorProofFixture,
  selectedObjectType: "room",
  selectedObjectId: room.id,
  roomId: room.id,
  handle: "southeast",
  deltaFeet: { deltaXFeet: 2, deltaYFeet: 1 },
  snapMode: "default"
});

const resizedRoom = resizedLayout.rooms.find((candidate) => candidate.id === room.id);
if (resizedRoom == null) {
  throw new Error("resized layout must keep room-01");
}
assert.deepEqual(
  {
    xFeet: resizedRoom.xFeet,
    yFeet: resizedRoom.yFeet,
    widthFeet: resizedRoom.widthFeet,
    heightFeet: resizedRoom.heightFeet
  },
  {
    xFeet: room.xFeet,
    yFeet: room.yFeet,
    widthFeet: room.widthFeet + 2,
    heightFeet: room.heightFeet + 1
  }
);
assert.equal(resizedRoom.label, room.label);
assert.equal(resizedRoom.roomType, room.roomType);
assert.deepEqual(resizedLayout.doors, layoutEditorProofFixture.doors);
assert.deepEqual(resizedLayout.hallways, layoutEditorProofFixture.hallways);
assert.deepEqual(resizedLayout.zones, layoutEditorProofFixture.zones);

const notSelectedLayout = resizeSelectedRoomInLayout({
  layout: layoutEditorProofFixture,
  selectedObjectType: "station",
  selectedObjectId: "station-primary",
  roomId: room.id,
  handle: "east",
  deltaFeet: { deltaXFeet: 4, deltaYFeet: 0 },
  snapMode: "default"
});
assert.equal(notSelectedLayout, layoutEditorProofFixture);
assert.equal(JSON.stringify(layoutEditorProofFixture), snapshot);

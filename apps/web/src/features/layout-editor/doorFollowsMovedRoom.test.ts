import { layoutEditorProofFixture } from "../../fixtures/layout-editor/layoutEditorProofFixture";
import { buildDoorShapeViewModel } from "./doorShapeViewModel";
import {
  buildLayoutObjectRenderPipeline,
  deriveDoorDisplayRectFeet
} from "./layoutObjectRenderPipeline";
import { moveRoomByDeltaFeet } from "./roomDragMove";

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

const viewport = { pixelsPerFoot: 12, zoom: 1, panXFeet: 0, panYFeet: 0 };
const roomDoor = layoutEditorProofFixture.doors.find((door) => door.ownerKind === "room");
const hallway = layoutEditorProofFixture.hallways[0];
if (roomDoor == null || hallway == null) {
  throw new Error("proof fixture requires a room-owned door and hallway");
}

const hallwayDoor = {
  objectType: "door" as const,
  id: "door-hall-main-north",
  label: "Main hallway north door",
  ownerKind: "hallway" as const,
  ownerId: hallway.id,
  wall: "north" as const,
  offsetFeet: 6,
  widthFeet: 4
};
const layoutWithHallwayDoor = {
  ...layoutEditorProofFixture,
  doors: [...layoutEditorProofFixture.doors, hallwayDoor]
};
const storedRoomDoorBefore = JSON.parse(JSON.stringify(roomDoor));
const storedHallwayDoorBefore = JSON.parse(JSON.stringify(hallwayDoor));
const beforeItems = buildLayoutObjectRenderPipeline({
  layout: layoutWithHallwayDoor,
  viewport
});
const roomDoorBefore = requireDoorItem(beforeItems, roomDoor.id);
const hallwayDoorBefore = requireDoorItem(beforeItems, hallwayDoor.id);
const roomDoorViewModelBefore = buildDoorShapeViewModel(roomDoorBefore);

const movedLayout = moveRoomByDeltaFeet({
  layout: layoutWithHallwayDoor,
  roomId: roomDoor.ownerId,
  delta: { deltaXFeet: 4, deltaYFeet: -2 },
  snapMode: "default"
});
const afterItems = buildLayoutObjectRenderPipeline({
  layout: movedLayout,
  viewport
});
const roomDoorAfter = requireDoorItem(afterItems, roomDoor.id);
const hallwayDoorAfter = requireDoorItem(afterItems, hallwayDoor.id);
const roomDoorViewModelAfter = buildDoorShapeViewModel(roomDoorAfter);
const storedRoomDoorAfter = movedLayout.doors.find((door) => door.id === roomDoor.id);
const storedHallwayDoorAfter = movedLayout.doors.find((door) => door.id === hallwayDoor.id);

assert.deepEqual(storedRoomDoorAfter, storedRoomDoorBefore);
assert.deepEqual(storedHallwayDoorAfter, storedHallwayDoorBefore);
assert.deepEqual(roomDoorAfter.displayRectFeet, {
  ...roomDoorBefore.displayRectFeet,
  xFeet: roomDoorBefore.displayRectFeet.xFeet + 4,
  yFeet: roomDoorBefore.displayRectFeet.yFeet - 2
});
assert.deepEqual(roomDoorViewModelAfter, {
  ...roomDoorViewModelBefore,
  xPixels: roomDoorViewModelBefore.xPixels + 48,
  yPixels: roomDoorViewModelBefore.yPixels - 24,
  markerX: roomDoorViewModelBefore.markerX + 48,
  markerY: roomDoorViewModelBefore.markerY - 24
});
assert.deepEqual(hallwayDoorAfter.displayRectFeet, hallwayDoorBefore.displayRectFeet);
assert.deepEqual(
  deriveDoorDisplayRectFeet(roomDoor, {
    xFeet: 4,
    yFeet: -2,
    widthFeet: 12,
    heightFeet: 10
  }),
  roomDoorAfter.displayRectFeet
);

function requireDoorItem(
  items: ReturnType<typeof buildLayoutObjectRenderPipeline>,
  objectId: string
) {
  const item = items.find((candidate) => candidate.objectType === "door" && candidate.objectId === objectId);
  if (item == null) {
    throw new Error(`missing door render item: ${objectId}`);
  }
  return item;
}

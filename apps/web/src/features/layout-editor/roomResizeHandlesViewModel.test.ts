import { layoutEditorProofFixture } from "../../fixtures/layout-editor/layoutEditorProofFixture";
import { buildLayoutObjectRenderPipeline } from "./layoutObjectRenderPipeline";
import {
  buildRoomResizeHandlesViewModel,
  buildSelectedRoomResizeHandlesViewModel,
  isRoomResizeHandle
} from "./roomResizeHandlesViewModel";

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

const snapshot = JSON.stringify(layoutEditorProofFixture);
const renderItems = buildLayoutObjectRenderPipeline({
  layout: layoutEditorProofFixture,
  viewport: {
    pixelsPerFoot: 12,
    zoom: 1,
    panXFeet: 0,
    panYFeet: 0
  }
});
const roomItem = renderItems.find((item) => item.objectType === "room");
const hallwayItem = renderItems.find((item) => item.objectType === "hallway");

if (roomItem == null || hallwayItem == null) {
  throw new Error("proof fixture requires room and hallway render items");
}

const handles = buildRoomResizeHandlesViewModel(roomItem);
assert.equal(handles.objectType, "room");
assert.equal(handles.objectId, "room-01");
assert.equal(handles.isDisplayOnly, true);
assert.deepEqual(
  handles.handles.map((handle) => handle.handle),
  ["north", "south", "east", "west", "northeast", "northwest", "southeast", "southwest"]
);
assert.equal(isRoomResizeHandle("north"), true);
assert.equal(isRoomResizeHandle("center"), false);
assert.deepEqual(
  handles.handles.map((handle) => ({
    handle: handle.handle,
    xPixels: handle.xPixels,
    yPixels: handle.yPixels
  })),
  [
    { handle: "north", xPixels: 72, yPixels: 0 },
    { handle: "south", xPixels: 72, yPixels: 120 },
    { handle: "east", xPixels: 144, yPixels: 60 },
    { handle: "west", xPixels: 0, yPixels: 60 },
    { handle: "northeast", xPixels: 144, yPixels: 0 },
    { handle: "northwest", xPixels: 0, yPixels: 0 },
    { handle: "southeast", xPixels: 144, yPixels: 120 },
    { handle: "southwest", xPixels: 0, yPixels: 120 }
  ]
);
assert.deepEqual(
  handles.handles.map((handle) => handle.sizePixels),
  [8, 8, 8, 8, 8, 8, 8, 8]
);
assert.equal(JSON.stringify(layoutEditorProofFixture), snapshot);

const selectedRoomHandles = buildSelectedRoomResizeHandlesViewModel({
  renderItems,
  selectedObjectType: "room",
  selectedObjectId: "room-01"
});
assert.equal(selectedRoomHandles?.objectId, "room-01");
assert.equal(selectedRoomHandles?.handles.length, 8);
assert.equal(
  buildSelectedRoomResizeHandlesViewModel({
    renderItems,
    selectedObjectType: "hallway",
    selectedObjectId: hallwayItem.objectId
  }),
  null
);
assert.equal(
  buildSelectedRoomResizeHandlesViewModel({
    renderItems,
    selectedObjectType: null,
    selectedObjectId: null
  }),
  null
);

assert.throws(() => buildRoomResizeHandlesViewModel(null), /selected room/);
assert.throws(() => buildRoomResizeHandlesViewModel(hallwayItem), /room render item/);

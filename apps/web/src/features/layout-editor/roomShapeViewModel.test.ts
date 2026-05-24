import { layoutEditorProofFixture } from "../../fixtures/layout-editor/layoutEditorProofFixture";
import { buildLayoutObjectRenderPipeline } from "./layoutObjectRenderPipeline";
import { buildRoomShapeViewModel } from "./roomShapeViewModel";

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

const room = buildRoomShapeViewModel(roomItem);
assert.equal(room.objectType, "room");
assert.equal(room.objectId, "room-01");
assert.equal(room.roomNumber, "01");
assert.equal(room.roomType, "standard");
assert.equal(room.hitTargetKey, "room:room-01");
assert.equal(room.ariaLabel.includes("standard"), true);
assert.deepEqual(
  {
    xPixels: room.xPixels,
    yPixels: room.yPixels,
    widthPixels: room.widthPixels,
    heightPixels: room.heightPixels,
    labelX: room.labelX,
    labelY: room.labelY
  },
  {
    xPixels: 0,
    yPixels: 0,
    widthPixels: 144,
    heightPixels: 120,
    labelX: 72,
    labelY: 60
  }
);

assert.throws(() => buildRoomShapeViewModel(hallwayItem), /room/);
assert.equal(JSON.stringify(layoutEditorProofFixture), snapshot);

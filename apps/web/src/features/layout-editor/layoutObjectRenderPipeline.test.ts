import { layoutEditorProofFixture } from "../../fixtures/layout-editor/layoutEditorProofFixture";
import {
  LAYOUT_OBJECT_RENDER_LAYER_ORDER,
  buildLayoutObjectRenderPipeline
} from "./layoutObjectRenderPipeline";

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
  ok(value: unknown, message: string): void {
    if (!value) {
      throw new Error(message);
    }
  }
};

const viewport = {
  pixelsPerFoot: 12,
  zoom: 1,
  panXFeet: 0,
  panYFeet: 0
};

const layoutSnapshot = JSON.stringify(layoutEditorProofFixture);
const renderItems = buildLayoutObjectRenderPipeline({
  layout: layoutEditorProofFixture,
  viewport
});

assert.deepEqual(
  renderItems.map((item) => item.renderLayer),
  ["hallways", "walls", "zones", "rooms", "doors", "doors", "doors", "stations"]
);
assert.deepEqual(
  renderItems.map((item) => item.objectType),
  ["hallway", "perimeter_wall", "zone", "room", "door", "entry_exit", "entry_exit", "station"]
);
assert.deepEqual(
  renderItems.map((item) => item.renderLayerIndex),
  [0, 1, 2, 3, 4, 4, 4, 5]
);
assert.deepEqual(
  [...LAYOUT_OBJECT_RENDER_LAYER_ORDER],
  ["hallways", "walls", "zones", "rooms", "doors", "stations", "overlays"]
);

for (const item of renderItems) {
  assert.ok(item.objectId.length > 0, "render item requires objectId");
  assert.ok(item.ariaLabel.includes(item.objectType), "render item ariaLabel includes objectType");
  assert.equal(item.hitTargetKey, `${item.objectType}:${item.objectId}`);
  assert.equal(typeof item.displayRectFeet.xFeet, "number");
  assert.equal(typeof item.displayRectPixels.xPixels, "number");
}

const roomItem = renderItems.find((item) => item.objectType === "room");
assert.ok(roomItem, "room render item exists");
assert.deepEqual(roomItem?.displayRectPixels, {
  xPixels: 0,
  yPixels: 0,
  widthPixels: 144,
  heightPixels: 120
});

const doorItem = renderItems.find((item) => item.objectType === "door");
assert.ok(doorItem, "door render item exists");
assert.deepEqual(doorItem?.displayRectFeet, {
  xFeet: 11.75,
  yFeet: 3,
  widthFeet: 0.5,
  heightFeet: 4
});

assert.equal(JSON.stringify(layoutEditorProofFixture), layoutSnapshot);

const firstDoor = layoutEditorProofFixture.doors[0];
if (firstDoor == null) {
  throw new Error("proof fixture requires a door");
}

const missingDoorOwnerLayout = {
  ...layoutEditorProofFixture,
  doors: [
    {
      ...firstDoor,
      ownerId: "missing-owner"
    }
  ]
};
const missingOwnerItems = buildLayoutObjectRenderPipeline({
  layout: missingDoorOwnerLayout,
  viewport
});
assert.equal(missingOwnerItems.some((item) => item.objectType === "door"), false);

import { layoutEditorProofFixture } from "../../fixtures/layout-editor/layoutEditorProofFixture";
import { buildDoorShapeViewModel } from "./doorShapeViewModel";
import { buildLayoutObjectRenderPipeline } from "./layoutObjectRenderPipeline";

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

const firstDoor = layoutEditorProofFixture.doors[0];
const roomItem = buildLayoutObjectRenderPipeline({
  layout: layoutEditorProofFixture,
  viewport: { pixelsPerFoot: 12, zoom: 1, panXFeet: 0, panYFeet: 0 }
}).find((item) => item.objectType === "room");

if (firstDoor == null || roomItem == null) {
  throw new Error("proof fixture requires a door and room");
}

const layoutWithWallDoors = {
  ...layoutEditorProofFixture,
  doors: (["north", "south", "east", "west"] as const).map((wall) => ({
    ...firstDoor,
    id: `door-${wall}`,
    label: `${wall} door`,
    wall,
    offsetFeet: 2,
    widthFeet: 4
  }))
};
const snapshot = JSON.stringify(layoutWithWallDoors);
const doorItems = buildLayoutObjectRenderPipeline({
  layout: layoutWithWallDoors,
  viewport: { pixelsPerFoot: 12, zoom: 1, panXFeet: 0, panYFeet: 0 }
}).filter((item) => item.objectType === "door");

assert.deepEqual(
  doorItems.map((item) => item.objectId),
  ["door-east", "door-north", "door-south", "door-west"]
);

const expectedRects = {
  "door-north": { xPixels: 24, yPixels: -3, widthPixels: 48, heightPixels: 6 },
  "door-south": { xPixels: 24, yPixels: 117, widthPixels: 48, heightPixels: 6 },
  "door-east": { xPixels: 141, yPixels: 24, widthPixels: 6, heightPixels: 48 },
  "door-west": { xPixels: -3, yPixels: 24, widthPixels: 6, heightPixels: 48 }
};

for (const item of doorItems) {
  const viewModel = buildDoorShapeViewModel(item);
  assert.equal(viewModel.objectType, "door");
  assert.equal(viewModel.hitTargetKey, `door:${viewModel.objectId}`);
  assert.equal(viewModel.ariaLabel.includes(viewModel.wall), true);
  assert.equal(viewModel.ownerKind, firstDoor.ownerKind);
  assert.equal(viewModel.ownerId, firstDoor.ownerId);
  assert.equal(viewModel.offsetFeet, 2);
  assert.equal(viewModel.widthFeet, 4);
  assert.deepEqual(
    {
      xPixels: viewModel.xPixels,
      yPixels: viewModel.yPixels,
      widthPixels: viewModel.widthPixels,
      heightPixels: viewModel.heightPixels
    },
    expectedRects[viewModel.objectId as keyof typeof expectedRects]
  );
}

assert.throws(() => buildDoorShapeViewModel(roomItem), /door/);
assert.equal(JSON.stringify(layoutWithWallDoors), snapshot);

import { layoutEditorProofFixture } from "../../fixtures/layout-editor/layoutEditorProofFixture";
import {
  buildSelectObjectActionFromRenderItem,
  selectionFromShapeClick
} from "./layoutStageSelectionEvents";
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

const renderItems = buildLayoutObjectRenderPipeline({
  layout: layoutEditorProofFixture,
  viewport: { pixelsPerFoot: 12, zoom: 1, panXFeet: 0, panYFeet: 0 }
});

for (const item of renderItems) {
  assert.deepEqual(buildSelectObjectActionFromRenderItem(item), {
    type: "selectObject",
    objectType: item.objectType,
    objectId: item.objectId
  });
  assert.deepEqual(selectionFromShapeClick(item.objectType, item.objectId), {
    objectType: item.objectType,
    objectId: item.objectId
  });
}

assert.throws(() => selectionFromShapeClick("room", ""), /objectId/);
assert.equal(renderItems.length, 8);

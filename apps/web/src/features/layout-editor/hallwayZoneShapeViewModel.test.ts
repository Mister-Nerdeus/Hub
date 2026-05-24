import { layoutEditorProofFixture } from "../../fixtures/layout-editor/layoutEditorProofFixture";
import {
  buildHallwayShapeViewModel,
  buildZoneShapeViewModel
} from "./hallwayZoneShapeViewModel";
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

const viewport = {
  pixelsPerFoot: 12,
  zoom: 1,
  panXFeet: 0,
  panYFeet: 0
};
const snapshot = JSON.stringify(layoutEditorProofFixture);
const renderItems = buildLayoutObjectRenderPipeline({
  layout: layoutEditorProofFixture,
  viewport
});
const hallwayItem = renderItems.find((item) => item.objectType === "hallway");
const zoneItem = renderItems.find((item) => item.objectType === "zone");
const roomItem = renderItems.find((item) => item.objectType === "room");

if (hallwayItem == null || zoneItem == null || roomItem == null) {
  throw new Error("proof fixture requires hallway, zone, and room render items");
}

const hallway = buildHallwayShapeViewModel(hallwayItem);
assert.equal(hallway.objectType, "hallway");
assert.equal(hallway.objectId, "hall-main");
assert.equal(hallway.hitTargetKey, "hallway:hall-main");
assert.deepEqual(
  {
    xPixels: hallway.xPixels,
    yPixels: hallway.yPixels,
    widthPixels: hallway.widthPixels,
    heightPixels: hallway.heightPixels
  },
  {
    xPixels: 0,
    yPixels: 144,
    widthPixels: 768,
    heightPixels: 96
  }
);

const zone = buildZoneShapeViewModel(zoneItem);
assert.equal(zone.objectType, "zone");
assert.equal(zone.objectId, "zone-entry");
assert.equal(zone.zoneType, "ems_entry");
assert.equal(zone.ariaLabel.includes("ems_entry"), true);
assert.deepEqual(
  {
    xPixels: zone.xPixels,
    yPixels: zone.yPixels,
    widthPixels: zone.widthPixels,
    heightPixels: zone.heightPixels
  },
  {
    xPixels: 384,
    yPixels: 0,
    widthPixels: 144,
    heightPixels: 96
  }
);

assert.throws(() => buildHallwayShapeViewModel(roomItem), /hallway/);
assert.throws(() => buildZoneShapeViewModel(roomItem), /zone/);
assert.equal(JSON.stringify(layoutEditorProofFixture), snapshot);

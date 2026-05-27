import { layoutEditorProofFixture } from "../../fixtures/layout-editor/layoutEditorProofFixture";
import { buildLayoutObjectRenderPipeline } from "./layoutObjectRenderPipeline";
import { selectionFromShapeClick } from "./layoutStageSelectionEvents";
import { buildStationShapeViewModel } from "./stationShapeViewModel";

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
const stationItem = renderItems.find((item) => item.objectType === "station");
const roomItem = renderItems.find((item) => item.objectType === "room");

if (stationItem == null || roomItem == null) {
  throw new Error("proof fixture requires station and room render items");
}

const station = buildStationShapeViewModel(stationItem);
assert.equal(station.objectType, "station");
assert.equal(station.objectId, "station-primary");
assert.equal(station.stationType, "nurse_station");
assert.equal(station.hitTargetKey, "station:station-primary");
assert.equal(station.ariaLabel.includes("nurse_station"), true);
assert.deepEqual(
  {
    xPixels: station.xPixels,
    yPixels: station.yPixels,
    widthPixels: station.widthPixels,
    heightPixels: station.heightPixels,
    labelX: station.labelX,
    labelY: station.labelY
  },
  {
    xPixels: 216,
    yPixels: 0,
    widthPixels: 120,
    heightPixels: 72,
    labelX: 276,
    labelY: 36
  }
);

assert.equal(station.presentationStyle, "curved_desk");
if (!station.presentationPath.includes("Q") || station.presentationPath.includes("L 216 0")) {
  throw new Error("station presentation path must be a shallow curved desk band, not the edit rectangle");
}
assert.equal(station.labelPlate.label, "Nurses station");
if (station.labelPlate.widthPixels <= 0 || station.labelPlate.heightPixels <= 0) {
  throw new Error("station label plate geometry must be populated");
}

assert.throws(() => buildStationShapeViewModel(roomItem), /station/);
assert.deepEqual(selectionFromShapeClick("station", station.objectId), {
  objectType: "station",
  objectId: "station-primary"
});
assert.equal(JSON.stringify(layoutEditorProofFixture), snapshot);

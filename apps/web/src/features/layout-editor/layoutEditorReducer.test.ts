import type { EditableLayoutGeometryContract } from "@nerdeus/shared";

import { layoutEditorReducer, panViewportAction } from "./layoutEditorReducer";
import { createLayoutEditorState, type LayoutEditorState } from "./layoutEditorState";

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

const editableLayout: EditableLayoutGeometryContract = {
  schemaVersion: "1.0.0",
  layoutId: "layout-editor-reducer-proof",
  units: "feet",
  rooms: [
    {
      objectType: "room",
      id: "room-01",
      label: "Room 01",
      roomNumber: "01",
      roomType: "standard",
      capacityType: "single",
      isHallBed: false,
      isTraumaAdjacent: false,
      xFeet: 0,
      yFeet: 0,
      widthFeet: 12,
      heightFeet: 10
    }
  ],
  doors: [
    {
      objectType: "door",
      id: "door-room-01-east",
      label: "Room 01 east door",
      ownerKind: "room",
      ownerId: "room-01",
      wall: "east",
      offsetFeet: 3,
      widthFeet: 4
    }
  ],
  stations: [
    {
      objectType: "station",
      id: "station-primary",
      label: "Primary nurse station",
      stationType: "nurse_station",
      xFeet: 18,
      yFeet: 0,
      widthFeet: 10,
      heightFeet: 6
    }
  ],
  hallways: [
    {
      objectType: "hallway",
      id: "hall-main",
      label: "Main hallway",
      xFeet: 0,
      yFeet: 12,
      widthFeet: 32,
      heightFeet: 8
    }
  ],
  zones: [
    {
      objectType: "zone",
      id: "zone-ems-entry",
      label: "EMS entry",
      zoneType: "ems_entry",
      xFeet: 0,
      yFeet: 22,
      widthFeet: 12,
      heightFeet: 8
    }
  ],
  limitations: ["Reducer proof fixture uses feet-based operational layout geometry only."]
};

const defaultState = createLayoutEditorState();

assert.equal(defaultState.editableLayout, null);
assert.equal(defaultState.selectedObjectId, null);
assert.equal(defaultState.selectedObjectType, null);
assert.equal(defaultState.snapMode, "default");
assert.equal(defaultState.isDirty, false);
assert.deepEqual(defaultState.viewport, {
  pixelsPerFoot: 12,
  zoom: 1,
  panXFeet: 0,
  panYFeet: 0
});

const dirtySelectedState = createLayoutEditorState({
  editableLayout,
  selectedObjectId: "room-01",
  selectedObjectType: "room",
  validationWarnings: [{ code: "old-warning", message: "old warning" }],
  isDirty: true
});
const dirtySelectedSnapshot = JSON.stringify(dirtySelectedState);
const loadedState = layoutEditorReducer(dirtySelectedState, {
  type: "loadLayout",
  layout: editableLayout
});
assert.equal(JSON.stringify(dirtySelectedState), dirtySelectedSnapshot);
assert.equal(loadedState.editableLayout, editableLayout);
assert.equal(loadedState.selectedObjectId, null);
assert.equal(loadedState.selectedObjectType, null);
assert.equal(loadedState.validationWarnings.length, 0);
assert.equal(loadedState.isDirty, false);

const stateWithLayout = createLayoutEditorState({ editableLayout });
const selectableObjects = [
  ["room", "room-01"],
  ["door", "door-room-01-east"],
  ["station", "station-primary"],
  ["hallway", "hall-main"],
  ["zone", "zone-ems-entry"]
] as const;
for (const [objectType, objectId] of selectableObjects) {
  const selectedState = layoutEditorReducer(stateWithLayout, {
    type: "selectObject",
    objectType,
    objectId
  });
  assert.equal(selectedState.selectedObjectType, objectType);
  assert.equal(selectedState.selectedObjectId, objectId);
  assert.equal(selectedState.editableLayout?.rooms[0]?.xFeet, 0);
}

const selectedRoomState = layoutEditorReducer(stateWithLayout, {
  type: "selectObject",
  objectType: "room",
  objectId: "room-01"
});
const invalidSelectionResult = layoutEditorReducer(selectedRoomState, {
  type: "selectObject",
  objectType: "room",
  objectId: "missing-room"
});
assert.equal(invalidSelectionResult, selectedRoomState);
assert.equal(invalidSelectionResult.selectedObjectId, "room-01");

const clearedState = layoutEditorReducer(selectedRoomState, { type: "clearSelection" });
assert.equal(clearedState.selectedObjectId, null);
assert.equal(clearedState.selectedObjectType, null);

const viewportState = layoutEditorReducer(stateWithLayout, {
  type: "setViewport",
  viewport: {
    pixelsPerFoot: 16,
    zoom: 1.5,
    panXFeet: 8,
    panYFeet: 3
  }
});
assert.deepEqual(viewportState.viewport, {
  pixelsPerFoot: 16,
  zoom: 1.5,
  panXFeet: 8,
  panYFeet: 3
});
assert.equal(stateWithLayout.viewport.zoom, 1);

const zoomedViewportState = layoutEditorReducer(stateWithLayout, {
  type: "zoomViewport",
  direction: "in"
});
assert.equal(zoomedViewportState.viewport.zoom, 1.25);
assert.equal(zoomedViewportState.editableLayout?.rooms[0]?.xFeet, 0);

const pannedViewportState = layoutEditorReducer(stateWithLayout, panViewportAction("east"));
assert.equal(pannedViewportState.viewport.panXFeet, 5);
assert.equal(pannedViewportState.viewport.panYFeet, 0);
assert.equal(stateWithLayout.viewport.panXFeet, 0);

const resetViewportState = layoutEditorReducer(
  createLayoutEditorState({
    editableLayout,
    viewport: { pixelsPerFoot: 18, zoom: 2, panXFeet: 8, panYFeet: 4 }
  }),
  { type: "resetViewport" }
);
assert.deepEqual(resetViewportState.viewport, {
  pixelsPerFoot: 12,
  zoom: 1,
  panXFeet: 0,
  panYFeet: 0
});

const fineSnapState = layoutEditorReducer(stateWithLayout, {
  type: "setSnapMode",
  snapMode: "fine"
});
assert.equal(fineSnapState.snapMode, "fine");

const warnings = [{ code: "warn-001", message: "Door is outside selected room", objectId: "door-room-01-east" }];
const warningState = layoutEditorReducer(stateWithLayout, {
  type: "setValidationWarnings",
  validationWarnings: warnings
});
const firstWarning = warnings[0];
if (firstWarning == null) {
  throw new Error("warning fixture must include one warning");
}
firstWarning.message = "mutated outside reducer";
assert.equal(warningState.validationWarnings[0]?.message, "Door is outside selected room");
assert.equal(warningState.isDirty, false);

const cleanState = layoutEditorReducer(createLayoutEditorState({ editableLayout, isDirty: true }), {
  type: "markClean"
});
assert.equal(cleanState.isDirty, false);

assert.throws(
  () =>
    layoutEditorReducer(stateWithLayout, {
      type: "setViewport",
      viewport: { pixelsPerFoot: 12, zoom: 0, panXFeet: 0, panYFeet: 0 }
    }),
  /zoom/
);

assert.throws(
  () =>
    layoutEditorReducer(stateWithLayout, {
      type: "setSnapMode",
      snapMode: "coarse"
    } as never),
  /snapMode/
);

assert.throws(
  () =>
    layoutEditorReducer(stateWithLayout, {
      type: "setValidationWarnings",
      validationWarnings: "not an array"
    } as never),
  /validationWarnings/
);

assert.throws(
  () =>
    layoutEditorReducer(stateWithLayout, {
      type: "selectObject",
      objectType: "bed",
      objectId: "room-01"
    } as never),
  /objectType/
);

const stateSnapshot = JSON.stringify(stateWithLayout);
layoutEditorReducer(stateWithLayout, {
  type: "selectObject",
  objectType: "room",
  objectId: "room-01"
});
assert.equal(JSON.stringify(stateWithLayout), stateSnapshot);

const hasPixelGeometryKey = (state: LayoutEditorState) => JSON.stringify(state.editableLayout).includes("Pixels");
assert.equal(hasPixelGeometryKey(stateWithLayout), false);

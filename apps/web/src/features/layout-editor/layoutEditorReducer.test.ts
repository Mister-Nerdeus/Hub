import { layoutEditorProofFixture } from "../../fixtures/layout-editor/layoutEditorProofFixture";
import { layoutEditorReducer, panViewportAction } from "./layoutEditorReducer";
import { createLayoutEditorState, type LayoutEditorState } from "./layoutEditorState";
import { LAYOUT_SELECTION_OBJECT_TYPES } from "./layoutSelectionModel";
import { buildLayoutValidationWarning } from "./layoutValidationWarningContract";

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

const editableLayout = layoutEditorProofFixture;

const defaultState = createLayoutEditorState();

assert.equal(defaultState.editableLayout, null);
assert.equal(defaultState.selectedObjectId, null);
assert.equal(defaultState.selectedObjectType, null);
assert.equal(defaultState.snapMode, "default");
assert.equal(defaultState.isDirty, false);
assert.deepEqual(defaultState.editAuditTrail, []);
assert.deepEqual(defaultState.viewport, {
  pixelsPerFoot: 12,
  zoom: 1,
  panXFeet: 0,
  panYFeet: 0
});
assert.deepEqual(defaultState.layoutBoundsFeet, {
  xFeet: 0,
  yFeet: 0,
  widthFeet: 64,
  heightFeet: 40
});

const dirtySelectedState = createLayoutEditorState({
  editableLayout,
  selectedObjectId: "room-01",
  selectedObjectType: "room",
  validationWarnings: [
    buildLayoutValidationWarning({
      code: "old-warning",
      severity: "warning",
      source: "unknown",
      message: "Old warning.",
      objectType: "room",
      objectId: "room-01",
      isGenerated: false
    })
  ],
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
assert.equal(loadedState.editAuditTrail.length, 0);
assert.equal(loadedState.isDirty, false);

const stateWithLayout = createLayoutEditorState({ editableLayout });
const selectableObjects = [
  ["room", "room-01"],
  ["door", "door-room-01-east"],
  ["station", "station-primary"],
  ["hallway", "hall-main"],
  ["zone", "zone-entry"]
] as const;
assert.deepEqual(
  selectableObjects.map(([objectType]) => objectType),
  [...LAYOUT_SELECTION_OBJECT_TYPES]
);
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

const warnings = [
  buildLayoutValidationWarning({
    code: "warn-001",
    severity: "warning",
    source: "unknown",
    message: "Door is outside selected room.",
    objectType: "door",
    objectId: "door-room-01-east",
    isGenerated: false
  })
];
const warningState = layoutEditorReducer(stateWithLayout, {
  type: "setValidationWarnings",
  validationWarnings: warnings
});
const firstWarning = warnings[0];
if (firstWarning == null) {
  throw new Error("warning fixture must include one warning");
}
firstWarning.message = "mutated outside reducer";
assert.equal(warningState.validationWarnings[0]?.message, "Door is outside selected room.");
assert.equal(warningState.isDirty, false);

const cleanState = layoutEditorReducer(createLayoutEditorState({ editableLayout, isDirty: true }), {
  type: "markClean"
});
assert.equal(cleanState.isDirty, false);

const roomBeforeMove = editableLayout.rooms.find((room) => room.id === "room-01");
if (roomBeforeMove == null) {
  throw new Error("proof fixture must include room-01");
}
const movedRoomState = layoutEditorReducer(stateWithLayout, {
  type: "moveRoom",
  roomId: "room-01",
  deltaXFeet: 1.2,
  deltaYFeet: 0.6
});
const roomAfterMove = movedRoomState.editableLayout?.rooms.find((room) => room.id === "room-01");
if (roomAfterMove == null) {
  throw new Error("moved state must include room-01");
}
assert.equal(roomAfterMove.xFeet, roomBeforeMove.xFeet + 1);
assert.equal(roomAfterMove.yFeet, roomBeforeMove.yFeet + 1);
assert.equal(roomAfterMove.widthFeet, roomBeforeMove.widthFeet);
assert.equal(roomAfterMove.heightFeet, roomBeforeMove.heightFeet);
assert.equal(roomAfterMove.label, roomBeforeMove.label);
assert.equal(movedRoomState.selectedObjectType, "room");
assert.equal(movedRoomState.selectedObjectId, "room-01");
assert.equal(movedRoomState.isDirty, true);
assert.deepEqual(movedRoomState.validationWarnings, []);
assert.deepEqual(movedRoomState.editAuditTrail, [
  {
    editId: "layout-edit-000001",
    editType: "move_room",
    objectType: "room",
    objectId: "room-01",
    before: { xFeet: roomBeforeMove.xFeet, yFeet: roomBeforeMove.yFeet },
    after: { xFeet: roomBeforeMove.xFeet + 1, yFeet: roomBeforeMove.yFeet + 1 },
    deltaFeet: { deltaXFeet: 1, deltaYFeet: 1 },
    createdAtOrder: 1,
    limitations: [
      "Audit entry describes an operational layout edit only.",
      "Undo, redo, persistence, path sync, and simulation rerun are not performed."
    ]
  }
]);
assert.deepEqual(movedRoomState.editableLayout?.doors, editableLayout.doors);
assert.equal(stateWithLayout.editableLayout?.rooms[0]?.xFeet, roomBeforeMove.xFeet);

const leftWarningState = layoutEditorReducer(stateWithLayout, {
  type: "moveRoom",
  roomId: "room-01",
  deltaXFeet: -2,
  deltaYFeet: 0
});
assert.deepEqual(leftWarningState.validationWarnings, [
  {
    code: "room_out_of_bounds_left",
    severity: "warning",
    source: "bounds",
    message: "Room extends beyond the layout left boundary.",
    objectType: "room",
    objectId: "room-01",
    relatedObjectType: null,
    relatedObjectId: null,
    isGenerated: true
  }
]);
assert.equal(leftWarningState.editableLayout?.rooms[0]?.xFeet, -2);

const bottomRightWarningState = layoutEditorReducer(stateWithLayout, {
  type: "moveRoom",
  roomId: "room-01",
  deltaXFeet: 60,
  deltaYFeet: 36
});
assert.deepEqual(bottomRightWarningState.validationWarnings, [
  {
    code: "room_out_of_bounds_bottom",
    severity: "warning",
    source: "bounds",
    message: "Room extends beyond the layout bottom boundary.",
    objectType: "room",
    objectId: "room-01",
    relatedObjectType: null,
    relatedObjectId: null,
    isGenerated: true
  },
  {
    code: "room_out_of_bounds_right",
    severity: "warning",
    source: "bounds",
    message: "Room extends beyond the layout right boundary.",
    objectType: "room",
    objectId: "room-01",
    relatedObjectType: null,
    relatedObjectId: null,
    isGenerated: true
  }
]);
assert.equal(bottomRightWarningState.editableLayout?.rooms[0]?.xFeet, 60);
assert.equal(bottomRightWarningState.editableLayout?.rooms[0]?.yFeet, 36);

const collisionWarningState = layoutEditorReducer(stateWithLayout, {
  type: "moveRoom",
  roomId: "room-01",
  deltaXFeet: 18,
  deltaYFeet: 0
});
assert.deepEqual(collisionWarningState.validationWarnings, [
  {
    code: "room_overlap_station",
    severity: "warning",
    source: "collision",
    message: "Room overlaps station station-primary.",
    objectType: "room",
    objectId: "room-01",
    relatedObjectType: "station",
    relatedObjectId: "station-primary",
    isGenerated: true
  }
]);
assert.equal(collisionWarningState.editableLayout?.rooms[0]?.xFeet, 18);

const secondMoveAuditState = layoutEditorReducer(movedRoomState, {
  type: "moveRoom",
  roomId: "room-01",
  deltaXFeet: 1,
  deltaYFeet: 0
});
assert.deepEqual(
  secondMoveAuditState.editAuditTrail.map((entry) => ({
    editId: entry.editId,
    createdAtOrder: entry.createdAtOrder,
    deltaFeet: entry.deltaFeet
  })),
  [
    {
      editId: "layout-edit-000001",
      createdAtOrder: 1,
      deltaFeet: { deltaXFeet: 1, deltaYFeet: 1 }
    },
    {
      editId: "layout-edit-000002",
      createdAtOrder: 2,
      deltaFeet: { deltaXFeet: 1, deltaYFeet: 0 }
    }
  ]
);

const fineMovedRoomState = layoutEditorReducer(
  createLayoutEditorState({ editableLayout, snapMode: "fine" }),
  {
    type: "moveRoom",
    roomId: "room-01",
    deltaXFeet: 0.25,
    deltaYFeet: -0.25
  }
);
assert.equal(fineMovedRoomState.editableLayout?.rooms[0]?.xFeet, roomBeforeMove.xFeet + 0.5);
assert.equal(fineMovedRoomState.editableLayout?.rooms[0]?.yFeet, roomBeforeMove.yFeet - 0.5);

assert.throws(
  () =>
    layoutEditorReducer(stateWithLayout, {
      type: "moveRoom",
      roomId: "station-primary",
      deltaXFeet: 1,
      deltaYFeet: 1
    }),
  /unknown room/
);

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

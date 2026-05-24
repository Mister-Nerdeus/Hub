import { layoutEditorProofFixture } from "../../fixtures/layout-editor/layoutEditorProofFixture";
import { layoutEditorReducer } from "./layoutEditorReducer";
import { createLayoutEditorState } from "./layoutEditorState";
import {
  recalculateWarningsForRoom,
  replaceGeneratedWarningsBySources
} from "./layoutWarningRecalculation";
import { DEFAULT_LAYOUT_BOUNDS_FEET } from "./layoutMoveValidation";
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
  }
};

const room = layoutEditorProofFixture.rooms.find((candidate) => candidate.id === "room-01");
if (room == null) {
  throw new Error("proof fixture requires room-01");
}

const manualWarning = buildLayoutValidationWarning({
  code: "manual-audit-note",
  severity: "info",
  source: "audit",
  message: "Manual audit note for editor review.",
  objectType: "room",
  objectId: room.id,
  isGenerated: false
});

const staleBoundsWarning = buildLayoutValidationWarning({
  code: "room_out_of_bounds_left",
  severity: "warning",
  source: "bounds",
  message: "Room extends beyond the layout left boundary.",
  objectType: "room",
  objectId: room.id,
  isGenerated: true
});

const staleCollisionWarning = buildLayoutValidationWarning({
  code: "room_overlap_station",
  severity: "warning",
  source: "collision",
  message: "Room overlaps station station-primary.",
  objectType: "room",
  objectId: room.id,
  relatedObjectType: "station",
  relatedObjectId: "station-primary",
  isGenerated: true
});

const outOfBoundsLayout = {
  ...layoutEditorProofFixture,
  rooms: layoutEditorProofFixture.rooms.map((candidate) =>
    candidate.id === room.id ? { ...candidate, xFeet: -1 } : candidate
  )
};

assert.deepEqual(
  recalculateWarningsForRoom({
    existingWarnings: [],
    layout: outOfBoundsLayout,
    roomId: room.id,
    boundsFeet: DEFAULT_LAYOUT_BOUNDS_FEET
  }).map((warning) => warning.code),
  ["room_out_of_bounds_left"]
);

assert.deepEqual(
  recalculateWarningsForRoom({
    existingWarnings: [staleBoundsWarning],
    layout: layoutEditorProofFixture,
    roomId: room.id,
    boundsFeet: DEFAULT_LAYOUT_BOUNDS_FEET
  }),
  []
);

const overlapLayout = {
  ...layoutEditorProofFixture,
  rooms: layoutEditorProofFixture.rooms.map((candidate) =>
    candidate.id === room.id ? { ...candidate, xFeet: 18 } : candidate
  )
};

assert.deepEqual(
  recalculateWarningsForRoom({
    existingWarnings: [],
    layout: overlapLayout,
    roomId: room.id,
    boundsFeet: DEFAULT_LAYOUT_BOUNDS_FEET
  }).map((warning) => warning.code),
  ["room_overlap_station"]
);

assert.deepEqual(
  recalculateWarningsForRoom({
    existingWarnings: [staleCollisionWarning],
    layout: layoutEditorProofFixture,
    roomId: room.id,
    boundsFeet: DEFAULT_LAYOUT_BOUNDS_FEET
  }),
  []
);

assert.deepEqual(
  recalculateWarningsForRoom({
    existingWarnings: [manualWarning, staleBoundsWarning, staleCollisionWarning],
    layout: layoutEditorProofFixture,
    roomId: room.id,
    boundsFeet: DEFAULT_LAYOUT_BOUNDS_FEET
  }),
  [manualWarning]
);

assert.deepEqual(
  replaceGeneratedWarningsBySources({
    existingWarnings: [manualWarning, staleBoundsWarning, staleCollisionWarning],
    replacementWarnings: [staleCollisionWarning],
    sources: ["bounds", "collision"]
  }),
  [manualWarning, staleCollisionWarning]
);

const stateWithManualWarning = createLayoutEditorState({
  editableLayout: layoutEditorProofFixture,
  validationWarnings: [manualWarning]
});
const movedState = layoutEditorReducer(stateWithManualWarning, {
  type: "moveRoom",
  roomId: room.id,
  deltaXFeet: 1,
  deltaYFeet: 0
});
assert.equal(movedState.validationWarnings.some((warning) => warning.code === "manual-audit-note"), true);
assert.equal(movedState.validationWarnings.some((warning) => warning.isGenerated), false);

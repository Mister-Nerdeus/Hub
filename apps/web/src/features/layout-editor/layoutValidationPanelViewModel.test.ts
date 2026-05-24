import type { LayoutEditorValidationWarning } from "./layoutEditorState";
import { buildLayoutValidationPanelViewModel } from "./layoutValidationPanelViewModel";

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

const emptyViewModel = buildLayoutValidationPanelViewModel({ warnings: [] });
assert.deepEqual(emptyViewModel, {
  status: "empty",
  title: "Layout warnings",
  emptyMessage: "No layout warnings.",
  warningCount: 0,
  isReadOnly: true,
  warnings: []
});

const warnings: LayoutEditorValidationWarning[] = [
  {
    code: "room_overlap_station",
    message: "Room overlaps station station-primary.",
    objectType: "room",
    objectId: "room-01",
    relatedObjectType: "station",
    relatedObjectId: "station-primary"
  },
  {
    code: "room_out_of_bounds_left",
    message: "Room extends beyond the layout left boundary.",
    objectType: "room",
    objectId: "room-01"
  },
  {
    code: "room_overlap_station",
    message: "Room overlaps station station-primary.",
    objectType: "room",
    objectId: "room-01",
    relatedObjectType: "station",
    relatedObjectId: "station-primary"
  }
];

const warningViewModel = buildLayoutValidationPanelViewModel({ warnings });
assert.equal(warningViewModel.status, "warnings");
assert.equal(warningViewModel.warningCount, 2);
assert.deepEqual(
  warningViewModel.warnings.map((warning) => ({
    code: warning.code,
    message: warning.message,
    objectType: warning.objectType,
    objectId: warning.objectId,
    relatedObjectType: warning.relatedObjectType,
    relatedObjectId: warning.relatedObjectId,
    duplicateCount: warning.duplicateCount
  })),
  [
    {
      code: "room_out_of_bounds_left",
      message: "Room extends beyond the layout left boundary.",
      objectType: "room",
      objectId: "room-01",
      relatedObjectType: null,
      relatedObjectId: null,
      duplicateCount: 1
    },
    {
      code: "room_overlap_station",
      message: "Room overlaps station station-primary.",
      objectType: "room",
      objectId: "room-01",
      relatedObjectType: "station",
      relatedObjectId: "station-primary",
      duplicateCount: 2
    }
  ]
);
assert.equal(warnings.length, 3);

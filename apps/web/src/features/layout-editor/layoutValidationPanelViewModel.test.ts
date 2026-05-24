import type { LayoutEditorValidationWarning } from "./layoutValidationWarningContract";
import {
  buildLayoutValidationPanelViewModel,
  buildLayoutValidationPanelWarningKey
} from "./layoutValidationPanelViewModel";

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
    severity: "warning",
    source: "collision",
    message: "Room overlaps station station-primary.",
    objectType: "room",
    objectId: "room-01",
    relatedObjectType: "station",
    relatedObjectId: "station-primary",
    isGenerated: true
  },
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
  },
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
];

const warningViewModel = buildLayoutValidationPanelViewModel({ warnings });
assert.equal(warningViewModel.status, "warnings");
assert.equal(warningViewModel.warningCount, 2);
assert.deepEqual(
  warningViewModel.warnings.map((warning) => ({
    code: warning.code,
    severity: warning.severity,
    severityLabel: warning.severityLabel,
    source: warning.source,
    sourceLabel: warning.sourceLabel,
    message: warning.message,
    objectType: warning.objectType,
    objectId: warning.objectId,
    relatedObjectType: warning.relatedObjectType,
    relatedObjectId: warning.relatedObjectId,
    isGenerated: warning.isGenerated,
    duplicateCount: warning.duplicateCount
  })),
  [
    {
      code: "room_out_of_bounds_left",
      severity: "warning",
      severityLabel: "Warning",
      source: "bounds",
      sourceLabel: "Bounds",
      message: "Room extends beyond the layout left boundary.",
      objectType: "room",
      objectId: "room-01",
      relatedObjectType: null,
      relatedObjectId: null,
      isGenerated: true,
      duplicateCount: 1
    },
    {
      code: "room_overlap_station",
      severity: "warning",
      severityLabel: "Warning",
      source: "collision",
      sourceLabel: "Collision",
      message: "Room overlaps station station-primary.",
      objectType: "room",
      objectId: "room-01",
      relatedObjectType: "station",
      relatedObjectId: "station-primary",
      isGenerated: true,
      duplicateCount: 2
    }
  ]
);
assert.equal(warnings.length, 3);

const distinctWarningsWithSharedDisplayMetadata: LayoutEditorValidationWarning[] = [
  {
    code: "room_bounds_review",
    severity: "warning",
    source: "bounds",
    message: "Room extends beyond the layout left boundary.",
    objectType: "room",
    objectId: "room-01",
    relatedObjectType: null,
    relatedObjectId: null,
    isGenerated: true
  },
  {
    code: "room_bounds_review",
    severity: "warning",
    source: "bounds",
    message: "Room extends beyond the layout right boundary.",
    objectType: "room",
    objectId: "room-01",
    relatedObjectType: null,
    relatedObjectId: null,
    isGenerated: true
  },
  {
    code: "room_bounds_review",
    severity: "warning",
    source: "bounds",
    message: "Room extends beyond the layout left boundary.",
    objectType: "room",
    objectId: "room-01",
    relatedObjectType: null,
    relatedObjectId: null,
    isGenerated: false
  }
];

const distinctWarningViewModel = buildLayoutValidationPanelViewModel({
  warnings: distinctWarningsWithSharedDisplayMetadata
});
assert.equal(distinctWarningViewModel.warningCount, 3);
assert.equal(
  new Set(distinctWarningViewModel.warnings.map(buildLayoutValidationPanelWarningKey)).size,
  distinctWarningViewModel.warnings.length
);

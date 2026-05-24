import { createLayoutEditorState } from "./layoutEditorState";
import {
  buildLayoutValidationWarning,
  compareLayoutValidationWarnings,
  filterGeneratedWarningsBySource,
  isGeneratedLayoutWarning,
  validateLayoutValidationWarning
} from "./layoutValidationWarningContract";

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

assert.throws(
  () =>
    createLayoutEditorState({
      validationWarnings: [
        {
          code: "room_out_of_bounds_left",
          message: "Room extends beyond the layout left boundary.",
          objectType: "room",
          objectId: "room-01"
        }
      ]
    } as never),
  /severity|source|isGenerated/
);

const boundsWarning = buildLayoutValidationWarning({
  code: "room_out_of_bounds_left",
  severity: "warning",
  source: "bounds",
  message: "Room extends beyond the layout left boundary.",
  objectType: "room",
  objectId: "room-01",
  isGenerated: true
});

assert.deepEqual(boundsWarning, {
  code: "room_out_of_bounds_left",
  severity: "warning",
  source: "bounds",
  message: "Room extends beyond the layout left boundary.",
  objectType: "room",
  objectId: "room-01",
  relatedObjectType: null,
  relatedObjectId: null,
  isGenerated: true
});
assert.equal(isGeneratedLayoutWarning(boundsWarning), true);
assert.deepEqual(validateLayoutValidationWarning(boundsWarning), boundsWarning);

assert.throws(
  () =>
    validateLayoutValidationWarning({
      ...boundsWarning,
      severity: "urgent"
    }),
  /severity/
);

assert.throws(
  () =>
    validateLayoutValidationWarning({
      ...boundsWarning,
      source: "layout"
    }),
  /source/
);

assert.throws(
  () =>
    validateLayoutValidationWarning({
      ...boundsWarning,
      message: `This warning ${["reco", "mmends"].join("")} a ${["best", "layout"].join("-")} change.`
    }),
  /forbidden wording/
);

const manualAuditWarning = buildLayoutValidationWarning({
  code: "manual-audit-note",
  severity: "info",
  source: "audit",
  message: "Manual audit note for editor review.",
  objectType: "room",
  objectId: "room-02",
  isGenerated: false
});

assert.deepEqual(
  [manualAuditWarning, boundsWarning].sort(compareLayoutValidationWarnings).map((warning) => warning.code),
  ["manual-audit-note", "room_out_of_bounds_left"]
);
assert.deepEqual(filterGeneratedWarningsBySource([manualAuditWarning, boundsWarning], ["bounds"]), [
  boundsWarning
]);

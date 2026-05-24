import { layoutEditorProofFixture } from "../../fixtures/layout-editor/layoutEditorProofFixture";
import { createLayoutEditorState } from "./layoutEditorState";
import {
  applyLayoutEditEffects,
  getLatestDeltaPreviewEdit,
  isDeltaPreviewTriggeringEdit,
  isNoOpLayoutEdit
} from "./layoutEditEffects";
import type { LayoutEditAuditEntry } from "./layoutEditAuditTrail";

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

const moveEntry: LayoutEditAuditEntry = {
  editId: "layout-edit-000001",
  editType: "move_room",
  objectType: "room",
  objectId: "room-01",
  before: { xFeet: 0, yFeet: 0 },
  after: { xFeet: 1, yFeet: 0 },
  deltaFeet: { deltaXFeet: 1, deltaYFeet: 0 },
  createdAtOrder: 1,
  limitations: ["Audit entry describes an operational layout edit only."]
};

const resizeEntry: LayoutEditAuditEntry = {
  editId: "layout-edit-000002",
  editType: "resize_room",
  objectType: "room",
  objectId: "room-01",
  resizeHandle: "east",
  before: { xFeet: 0, yFeet: 0, widthFeet: 12, heightFeet: 10 },
  after: { xFeet: 0, yFeet: 0, widthFeet: 14, heightFeet: 10 },
  deltaFeet: { deltaXFeet: 0, deltaYFeet: 0, deltaWidthFeet: 2, deltaHeightFeet: 0 },
  createdAtOrder: 2,
  limitations: ["Audit entry describes an operational layout edit only."]
};

const dimensionEntry: LayoutEditAuditEntry = {
  editId: "layout-edit-000003",
  editType: "edit_room_dimensions",
  objectType: "room",
  objectId: "room-01",
  before: { xFeet: 0, yFeet: 0, widthFeet: 12, heightFeet: 10 },
  after: { xFeet: 1, yFeet: 0, widthFeet: 12, heightFeet: 10 },
  deltaFeet: { deltaXFeet: 1, deltaYFeet: 0, deltaWidthFeet: 0, deltaHeightFeet: 0 },
  changedFields: ["xFeet"],
  createdAtOrder: 3,
  limitations: ["Audit entry describes an operational layout edit only."]
};

for (const entry of [moveEntry, resizeEntry, dimensionEntry]) {
  assert.equal(isDeltaPreviewTriggeringEdit(entry), true);
  assert.equal(isNoOpLayoutEdit(entry), false);
}

assert.equal(getLatestDeltaPreviewEdit([moveEntry, dimensionEntry, resizeEntry])?.editId, "layout-edit-000003");

const state = createLayoutEditorState({ editableLayout: layoutEditorProofFixture });
const appliedState = applyLayoutEditEffects({
  state,
  editableLayout: layoutEditorProofFixture,
  validationWarnings: [],
  auditEntry: moveEntry,
  selectedObjectType: "room",
  selectedObjectId: "room-01"
});
assert.equal(appliedState.isDirty, true);
assert.deepEqual(appliedState.editAuditTrail, [moveEntry]);
assert.equal(appliedState.selectedObjectType, "room");
assert.equal(appliedState.selectedObjectId, "room-01");

const noOpMoveEntry: LayoutEditAuditEntry = {
  ...moveEntry,
  after: { xFeet: 0, yFeet: 0 },
  deltaFeet: { deltaXFeet: 0, deltaYFeet: 0 }
};
assert.equal(isNoOpLayoutEdit(noOpMoveEntry), true);
assert.equal(
  applyLayoutEditEffects({
    state,
    editableLayout: layoutEditorProofFixture,
    validationWarnings: [],
    auditEntry: noOpMoveEntry,
    selectedObjectType: "room",
    selectedObjectId: "room-01"
  }),
  state
);

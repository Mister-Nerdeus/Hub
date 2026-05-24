import { layoutEditorProofFixture } from "../../fixtures/layout-editor/layoutEditorProofFixture";
import {
  createLayoutUndoRedoHistory,
  pushLayoutUndoRedoSnapshot,
  redoLayoutEditHistory,
  undoLayoutEditHistory
} from "./layoutUndoRedoHistory";

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

const snapshotA = {
  editableLayout: layoutEditorProofFixture,
  validationWarnings: [],
  editAuditTrail: [],
  isDirty: false
};
const snapshotB = {
  ...snapshotA,
  isDirty: true
};
const snapshotC = {
  ...snapshotA,
  editAuditTrail: [
    {
      editId: "layout-edit-000001",
      editType: "move_room" as const,
      objectType: "room" as const,
      objectId: "room-01",
      before: { xFeet: 0, yFeet: 0 },
      after: { xFeet: 1, yFeet: 0 },
      deltaFeet: { deltaXFeet: 1, deltaYFeet: 0 },
      createdAtOrder: 1,
      limitations: ["Audit entry describes an operational layout edit only."]
    }
  ],
  isDirty: true
};

let history = createLayoutUndoRedoHistory(2);
history = pushLayoutUndoRedoSnapshot(history, snapshotA);
history = pushLayoutUndoRedoSnapshot(history, snapshotB);
history = pushLayoutUndoRedoSnapshot(history, snapshotC);
assert.equal(history.past.length, 2);
assert.deepEqual(history.future, []);

const undo = undoLayoutEditHistory(history, snapshotC);
assert.equal(undo.status, "applied");
if (undo.status !== "applied") {
  throw new Error("undo should apply");
}
assert.equal(undo.snapshot.isDirty, true);
assert.equal(undo.history.future.length, 1);

const redo = redoLayoutEditHistory(undo.history, undo.snapshot);
assert.equal(redo.status, "applied");
if (redo.status !== "applied") {
  throw new Error("redo should apply");
}
assert.deepEqual(redo.snapshot.editAuditTrail, snapshotC.editAuditTrail);
assert.equal(redo.history.future.length, 0);

const clearedFuture = pushLayoutUndoRedoSnapshot(undo.history, snapshotA);
assert.equal(clearedFuture.future.length, 0);

assert.equal(undoLayoutEditHistory(createLayoutUndoRedoHistory(), snapshotA).status, "empty");

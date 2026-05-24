import { layoutEditorProofFixture } from "../../fixtures/layout-editor/layoutEditorProofFixture";
import {
  cancelRoomInspectorDimensionDraftField,
  commitRoomInspectorDimensionDraftField,
  createRoomInspectorDimensionDraft,
  parseRoomInspectorDimensionDraftValue,
  updateRoomInspectorDimensionDraft
} from "./roomInspectorDimensionDraft";

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

const initialDraft = createRoomInspectorDimensionDraft(room);
assert.equal(initialDraft.roomId, "room-01");
assert.deepEqual(
  Object.fromEntries(Object.entries(initialDraft.fields).map(([field, state]) => [field, state.value])),
  {
    xFeet: "0",
    yFeet: "0",
    widthFeet: "12",
    heightFeet: "10"
  }
);

const partialDraft = updateRoomInspectorDimensionDraft(initialDraft, "xFeet", "-");
assert.equal(partialDraft.fields.xFeet.value, "-");
assert.equal(initialDraft.fields.xFeet.value, "0");
assert.deepEqual(parseRoomInspectorDimensionDraftValue("-"), null);
assert.deepEqual(parseRoomInspectorDimensionDraftValue("."), null);
assert.deepEqual(parseRoomInspectorDimensionDraftValue("1."), null);
assert.equal(parseRoomInspectorDimensionDraftValue("1.5"), 1.5);

const invalidCommit = commitRoomInspectorDimensionDraftField(partialDraft, "xFeet");
assert.equal(invalidCommit.status, "invalid");
assert.deepEqual(invalidCommit.changes, null);
assert.equal(invalidCommit.draft.fields.xFeet.error, "Enter a complete feet value.");

const validDraft = updateRoomInspectorDimensionDraft(initialDraft, "widthFeet", "7.25");
const validCommit = commitRoomInspectorDimensionDraftField(validDraft, "widthFeet");
assert.equal(validCommit.status, "valid");
if (validCommit.status !== "valid") {
  throw new Error("valid draft should commit");
}
assert.deepEqual(validCommit.changes, { widthFeet: 7.25 });
assert.equal(validCommit.draft.fields.widthFeet.value, "7.25");
assert.equal(validCommit.draft.fields.widthFeet.error, null);

const cancelledDraft = cancelRoomInspectorDimensionDraftField(
  updateRoomInspectorDimensionDraft(initialDraft, "heightFeet", "6"),
  room,
  "heightFeet"
);
assert.equal(cancelledDraft.fields.heightFeet.value, "10");
assert.equal(cancelledDraft.fields.heightFeet.error, null);

const emptyDraft = createRoomInspectorDimensionDraft(null);
assert.equal(emptyDraft.roomId, null);
assert.equal(emptyDraft.fields.xFeet.value, "");

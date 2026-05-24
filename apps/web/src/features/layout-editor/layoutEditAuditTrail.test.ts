import { createRoomMoveAuditEntry, LAYOUT_EDIT_AUDIT_ENTRY_TYPES } from "./layoutEditAuditTrail";

const assert = {
  deepEqual(actual: unknown, expected: unknown): void {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(`Expected ${JSON.stringify(actual)} to deep equal ${JSON.stringify(expected)}`);
    }
  }
};

assert.deepEqual([...LAYOUT_EDIT_AUDIT_ENTRY_TYPES], ["move_room"]);

assert.deepEqual(
  createRoomMoveAuditEntry({
    roomId: "room-14",
    before: { xFeet: 10, yFeet: 8 },
    after: { xFeet: 18, yFeet: 6 },
    deltaFeet: { deltaXFeet: 8, deltaYFeet: -2 },
    createdAtOrder: 1
  }),
  {
    editId: "layout-edit-000001",
    editType: "move_room",
    objectType: "room",
    objectId: "room-14",
    before: { xFeet: 10, yFeet: 8 },
    after: { xFeet: 18, yFeet: 6 },
    deltaFeet: { deltaXFeet: 8, deltaYFeet: -2 },
    createdAtOrder: 1,
    limitations: [
      "Audit entry describes an operational layout edit only.",
      "Undo, redo, persistence, path sync, and simulation rerun are not performed."
    ]
  }
);

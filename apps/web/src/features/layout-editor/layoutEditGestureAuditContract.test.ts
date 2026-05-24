import { createRoomMoveAuditEntry } from "./layoutEditAuditTrail";
import { buildRoomMoveGestureAuditSummary } from "./layoutEditGestureAuditContract";

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

const firstMove = createRoomMoveAuditEntry({
  roomId: "room-14",
  before: { xFeet: 10, yFeet: 8 },
  after: { xFeet: 11, yFeet: 8 },
  deltaFeet: { deltaXFeet: 1, deltaYFeet: 0 },
  createdAtOrder: 1
});

const secondMove = createRoomMoveAuditEntry({
  roomId: "room-14",
  before: { xFeet: 11, yFeet: 8 },
  after: { xFeet: 13, yFeet: 7 },
  deltaFeet: { deltaXFeet: 2, deltaYFeet: -1 },
  createdAtOrder: 2
});

assert.deepEqual(
  buildRoomMoveGestureAuditSummary({
    lowLevelEntries: [firstMove],
    createdAtOrder: 1
  }),
  {
    gestureId: "layout-gesture-000001-room-move-room-14",
    gestureType: "room_move_drag",
    objectType: "room",
    objectId: "room-14",
    start: { xFeet: 10, yFeet: 8 },
    end: { xFeet: 11, yFeet: 8 },
    totalDeltaFeet: { deltaXFeet: 1, deltaYFeet: 0 },
    lowLevelEditIds: ["layout-edit-000001"],
    createdAtOrder: 1,
    limitations: [
      "Gesture summary describes operational layout edits only.",
      "Undo, redo, persistence, path sync, and simulation rerun are not performed.",
      "Low-level audit entries remain the source edit records."
    ]
  }
);

assert.deepEqual(
  buildRoomMoveGestureAuditSummary({
    lowLevelEntries: [secondMove, firstMove],
    createdAtOrder: 2
  }),
  {
    gestureId: "layout-gesture-000002-room-move-room-14",
    gestureType: "room_move_drag",
    objectType: "room",
    objectId: "room-14",
    start: { xFeet: 10, yFeet: 8 },
    end: { xFeet: 13, yFeet: 7 },
    totalDeltaFeet: { deltaXFeet: 3, deltaYFeet: -1 },
    lowLevelEditIds: ["layout-edit-000001", "layout-edit-000002"],
    createdAtOrder: 2,
    limitations: [
      "Gesture summary describes operational layout edits only.",
      "Undo, redo, persistence, path sync, and simulation rerun are not performed.",
      "Low-level audit entries remain the source edit records."
    ]
  }
);

const otherRoomMove = createRoomMoveAuditEntry({
  roomId: "room-15",
  before: { xFeet: 0, yFeet: 0 },
  after: { xFeet: 1, yFeet: 0 },
  deltaFeet: { deltaXFeet: 1, deltaYFeet: 0 },
  createdAtOrder: 3
});

assert.throws(
  () =>
    buildRoomMoveGestureAuditSummary({
      lowLevelEntries: [firstMove, otherRoomMove],
      createdAtOrder: 3
    }),
  /same room/
);

assert.throws(
  () =>
    buildRoomMoveGestureAuditSummary({
      lowLevelEntries: [{ ...firstMove, editType: "resize_room" } as never],
      createdAtOrder: 4
    }),
  /move_room/
);

assert.equal(firstMove.editId, "layout-edit-000001");
assert.equal(secondMove.editId, "layout-edit-000002");

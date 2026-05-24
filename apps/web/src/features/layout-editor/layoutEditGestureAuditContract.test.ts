import {
  createRoomDimensionEditAuditEntry,
  createRoomMoveAuditEntry,
  createRoomResizeAuditEntry
} from "./layoutEditAuditTrail";
import { buildLayoutEditGestureAuditSummary } from "./layoutEditGestureAuditContract";

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
  buildLayoutEditGestureAuditSummary({
    lowLevelEntries: [secondMove, firstMove],
    createdAtOrder: 1
  }),
  {
    gestureId: "layout-gesture-000001-move_room_gesture-room-14",
    gestureType: "move_room_gesture",
    objectType: "room",
    objectId: "room-14",
    start: { xFeet: 10, yFeet: 8 },
    end: { xFeet: 13, yFeet: 7 },
    totalDeltaFeet: { deltaXFeet: 3, deltaYFeet: -1 },
    resizeHandle: null,
    lowLevelEditIds: ["layout-edit-000001", "layout-edit-000002"],
    createdAtOrder: 1,
    limitations: [
      "Gesture summary describes operational layout edits only.",
      "Undo, redo, persistence, path sync, and simulation rerun are not performed.",
      "Low-level audit entries remain compatible source edit records."
    ]
  }
);

const firstResize = createRoomResizeAuditEntry({
  roomId: "room-14",
  resizeHandle: "east",
  before: { xFeet: 10, yFeet: 8, widthFeet: 12, heightFeet: 10 },
  after: { xFeet: 10, yFeet: 8, widthFeet: 14, heightFeet: 10 },
  deltaFeet: { deltaXFeet: 0, deltaYFeet: 0, deltaWidthFeet: 2, deltaHeightFeet: 0 },
  createdAtOrder: 3
});

const secondResize = createRoomResizeAuditEntry({
  roomId: "room-14",
  resizeHandle: "east",
  before: { xFeet: 10, yFeet: 8, widthFeet: 14, heightFeet: 10 },
  after: { xFeet: 10, yFeet: 8, widthFeet: 15, heightFeet: 10 },
  deltaFeet: { deltaXFeet: 0, deltaYFeet: 0, deltaWidthFeet: 1, deltaHeightFeet: 0 },
  createdAtOrder: 4
});

assert.deepEqual(
  buildLayoutEditGestureAuditSummary({
    lowLevelEntries: [secondResize, firstResize],
    createdAtOrder: 2
  }),
  {
    gestureId: "layout-gesture-000002-resize_room_gesture-room-14",
    gestureType: "resize_room_gesture",
    objectType: "room",
    objectId: "room-14",
    start: { xFeet: 10, yFeet: 8, widthFeet: 12, heightFeet: 10 },
    end: { xFeet: 10, yFeet: 8, widthFeet: 15, heightFeet: 10 },
    totalDeltaFeet: { deltaXFeet: 0, deltaYFeet: 0, deltaWidthFeet: 3, deltaHeightFeet: 0 },
    resizeHandle: "east",
    lowLevelEditIds: ["layout-edit-000003", "layout-edit-000004"],
    createdAtOrder: 2,
    limitations: [
      "Gesture summary describes operational layout edits only.",
      "Undo, redo, persistence, path sync, and simulation rerun are not performed.",
      "Low-level audit entries remain compatible source edit records."
    ]
  }
);

const dimensionEdit = createRoomDimensionEditAuditEntry({
  roomId: "room-14",
  before: { xFeet: 10, yFeet: 8, widthFeet: 12, heightFeet: 10 },
  after: { xFeet: 11, yFeet: 8, widthFeet: 14, heightFeet: 9 },
  deltaFeet: { deltaXFeet: 1, deltaYFeet: 0, deltaWidthFeet: 2, deltaHeightFeet: -1 },
  changedFields: ["xFeet", "widthFeet", "heightFeet"],
  createdAtOrder: 5
});

assert.deepEqual(
  buildLayoutEditGestureAuditSummary({
    lowLevelEntries: [dimensionEdit],
    createdAtOrder: 3
  }),
  {
    gestureId: "layout-gesture-000003-dimension_edit_gesture-room-14",
    gestureType: "dimension_edit_gesture",
    objectType: "room",
    objectId: "room-14",
    start: { xFeet: 10, yFeet: 8, widthFeet: 12, heightFeet: 10 },
    end: { xFeet: 11, yFeet: 8, widthFeet: 14, heightFeet: 9 },
    totalDeltaFeet: { deltaXFeet: 1, deltaYFeet: 0, deltaWidthFeet: 2, deltaHeightFeet: -1 },
    resizeHandle: null,
    lowLevelEditIds: ["layout-edit-000005"],
    createdAtOrder: 3,
    limitations: [
      "Gesture summary describes operational layout edits only.",
      "Undo, redo, persistence, path sync, and simulation rerun are not performed.",
      "Low-level audit entries remain compatible source edit records."
    ]
  }
);

const otherRoomMove = createRoomMoveAuditEntry({
  roomId: "room-15",
  before: { xFeet: 0, yFeet: 0 },
  after: { xFeet: 1, yFeet: 0 },
  deltaFeet: { deltaXFeet: 1, deltaYFeet: 0 },
  createdAtOrder: 6
});

assert.throws(
  () =>
    buildLayoutEditGestureAuditSummary({
      lowLevelEntries: [firstMove, otherRoomMove],
      createdAtOrder: 4
    }),
  /same object ID/
);

assert.throws(
  () =>
    buildLayoutEditGestureAuditSummary({
      lowLevelEntries: [firstMove, firstResize],
      createdAtOrder: 5
    }),
  /incompatible mixed edit types/
);

assert.throws(
  () =>
    buildLayoutEditGestureAuditSummary({
      lowLevelEntries: [dimensionEdit, { ...dimensionEdit, editId: "layout-edit-000006", createdAtOrder: 6 }],
      createdAtOrder: 6
    }),
  /exactly one/
);

assert.equal(firstMove.editId, "layout-edit-000001");
assert.equal(secondMove.editId, "layout-edit-000002");

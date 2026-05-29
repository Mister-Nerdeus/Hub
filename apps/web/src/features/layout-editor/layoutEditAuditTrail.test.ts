import {
  createRoomDimensionEditAuditEntry,
  createRoomMoveAuditEntry,
  createRoomResizeAuditEntry,
  createStationDimensionEditAuditEntry,
  createStationMoveAuditEntry,
  createStationResizeAuditEntry,
  LAYOUT_EDIT_AUDIT_ENTRY_TYPES
} from "./layoutEditAuditTrail";

const assert = {
  deepEqual(actual: unknown, expected: unknown): void {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(`Expected ${JSON.stringify(actual)} to deep equal ${JSON.stringify(expected)}`);
    }
  }
};

assert.deepEqual([...LAYOUT_EDIT_AUDIT_ENTRY_TYPES], [
  "move_room",
  "station_moved",
  "resize_room",
  "station_resized",
  "edit_room_dimensions",
  "edit_station_dimensions"
]);

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

assert.deepEqual(
  createStationMoveAuditEntry({
    stationId: "station-primary",
    before: { xFeet: 40, yFeet: 12 },
    after: { xFeet: 42, yFeet: 13 },
    deltaFeet: { deltaXFeet: 2, deltaYFeet: 1 },
    createdAtOrder: 2
  }),
  {
    editId: "layout-edit-000002",
    editType: "station_moved",
    objectType: "station",
    objectId: "station-primary",
    before: { xFeet: 40, yFeet: 12 },
    after: { xFeet: 42, yFeet: 13 },
    deltaFeet: { deltaXFeet: 2, deltaYFeet: 1 },
    createdAtOrder: 2,
    limitations: [
      "Audit entry describes an operational layout edit only.",
      "Undo, redo, persistence, path sync, and simulation rerun are not performed."
    ]
  }
);

assert.deepEqual(
  createRoomResizeAuditEntry({
    roomId: "room-14",
    resizeHandle: "southeast",
    before: { xFeet: 10, yFeet: 8, widthFeet: 12, heightFeet: 10 },
    after: { xFeet: 10, yFeet: 8, widthFeet: 14, heightFeet: 11 },
    deltaFeet: { deltaXFeet: 0, deltaYFeet: 0, deltaWidthFeet: 2, deltaHeightFeet: 1 },
    createdAtOrder: 3
  }),
  {
    editId: "layout-edit-000003",
    editType: "resize_room",
    objectType: "room",
    objectId: "room-14",
    resizeHandle: "southeast",
    before: { xFeet: 10, yFeet: 8, widthFeet: 12, heightFeet: 10 },
    after: { xFeet: 10, yFeet: 8, widthFeet: 14, heightFeet: 11 },
    deltaFeet: { deltaXFeet: 0, deltaYFeet: 0, deltaWidthFeet: 2, deltaHeightFeet: 1 },
    createdAtOrder: 3,
    limitations: [
      "Audit entry describes an operational layout edit only.",
      "Undo, redo, persistence, path sync, and simulation rerun are not performed."
    ]
  }
);

assert.deepEqual(
  createStationResizeAuditEntry({
    stationId: "station-primary",
    resizeHandle: "southeast",
    before: { xFeet: 40, yFeet: 12, widthFeet: 8, heightFeet: 6 },
    after: { xFeet: 40, yFeet: 12, widthFeet: 10, heightFeet: 7 },
    deltaFeet: { deltaXFeet: 0, deltaYFeet: 0, deltaWidthFeet: 2, deltaHeightFeet: 1 },
    createdAtOrder: 4
  }),
  {
    editId: "layout-edit-000004",
    editType: "station_resized",
    objectType: "station",
    objectId: "station-primary",
    resizeHandle: "southeast",
    before: { xFeet: 40, yFeet: 12, widthFeet: 8, heightFeet: 6 },
    after: { xFeet: 40, yFeet: 12, widthFeet: 10, heightFeet: 7 },
    deltaFeet: { deltaXFeet: 0, deltaYFeet: 0, deltaWidthFeet: 2, deltaHeightFeet: 1 },
    createdAtOrder: 4,
    limitations: [
      "Audit entry describes an operational layout edit only.",
      "Undo, redo, persistence, path sync, and simulation rerun are not performed."
    ]
  }
);

assert.deepEqual(
  createStationDimensionEditAuditEntry({
    stationId: "station-primary",
    before: { xFeet: 40, yFeet: 12, widthFeet: 8, heightFeet: 6 },
    after: { xFeet: 40, yFeet: 12, widthFeet: 12, heightFeet: 8 },
    deltaFeet: { deltaXFeet: 0, deltaYFeet: 0, deltaWidthFeet: 4, deltaHeightFeet: 2 },
    changedFields: ["heightFeet", "widthFeet"],
    createdAtOrder: 5
  }),
  {
    editId: "layout-edit-000005",
    editType: "edit_station_dimensions",
    objectType: "station",
    objectId: "station-primary",
    before: { xFeet: 40, yFeet: 12, widthFeet: 8, heightFeet: 6 },
    after: { xFeet: 40, yFeet: 12, widthFeet: 12, heightFeet: 8 },
    deltaFeet: { deltaXFeet: 0, deltaYFeet: 0, deltaWidthFeet: 4, deltaHeightFeet: 2 },
    changedFields: ["heightFeet", "widthFeet"],
    createdAtOrder: 5,
    limitations: [
      "Audit entry describes an operational layout edit only.",
      "Undo, redo, persistence, path sync, and simulation rerun are not performed."
    ]
  }
);

assert.deepEqual(
  createRoomDimensionEditAuditEntry({
    roomId: "room-14",
    before: { xFeet: 10, yFeet: 8, widthFeet: 12, heightFeet: 10 },
    after: { xFeet: 11, yFeet: 8, widthFeet: 14, heightFeet: 9 },
    deltaFeet: { deltaXFeet: 1, deltaYFeet: 0, deltaWidthFeet: 2, deltaHeightFeet: -1 },
    changedFields: ["widthFeet", "xFeet", "heightFeet"],
    createdAtOrder: 6
  }),
  {
    editId: "layout-edit-000006",
    editType: "edit_room_dimensions",
    objectType: "room",
    objectId: "room-14",
    before: { xFeet: 10, yFeet: 8, widthFeet: 12, heightFeet: 10 },
    after: { xFeet: 11, yFeet: 8, widthFeet: 14, heightFeet: 9 },
    deltaFeet: { deltaXFeet: 1, deltaYFeet: 0, deltaWidthFeet: 2, deltaHeightFeet: -1 },
    changedFields: ["heightFeet", "widthFeet", "xFeet"],
    createdAtOrder: 6,
    limitations: [
      "Audit entry describes an operational layout edit only.",
      "Undo, redo, persistence, path sync, and simulation rerun are not performed."
    ]
  }
);

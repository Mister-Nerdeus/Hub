export type LayoutEditAuditPointFeet = {
  xFeet: number;
  yFeet: number;
};

export type LayoutEditAuditDeltaFeet = {
  deltaXFeet: number;
  deltaYFeet: number;
};

export type LayoutEditAuditRectFeet = LayoutEditAuditPointFeet & {
  widthFeet: number;
  heightFeet: number;
};

export type LayoutEditAuditResizeDeltaFeet = LayoutEditAuditDeltaFeet & {
  deltaWidthFeet: number;
  deltaHeightFeet: number;
};

export const LAYOUT_EDIT_AUDIT_ENTRY_TYPES = [
  "move_room",
  "station_moved",
  "resize_room",
  "edit_room_dimensions"
] as const;

export type LayoutEditAuditEntryType = (typeof LAYOUT_EDIT_AUDIT_ENTRY_TYPES)[number];

export type LayoutRoomMoveAuditEntry = {
  editId: string;
  editType: "move_room";
  objectType: "room";
  objectId: string;
  before: LayoutEditAuditPointFeet;
  after: LayoutEditAuditPointFeet;
  deltaFeet: LayoutEditAuditDeltaFeet;
  createdAtOrder: number;
  limitations: string[];
};

export type LayoutStationMoveAuditEntry = {
  editId: string;
  editType: "station_moved";
  objectType: "station";
  objectId: string;
  before: LayoutEditAuditPointFeet;
  after: LayoutEditAuditPointFeet;
  deltaFeet: LayoutEditAuditDeltaFeet;
  createdAtOrder: number;
  limitations: string[];
};

export type LayoutRoomResizeAuditEntry = {
  editId: string;
  editType: "resize_room";
  objectType: "room";
  objectId: string;
  resizeHandle: string;
  before: LayoutEditAuditRectFeet;
  after: LayoutEditAuditRectFeet;
  deltaFeet: LayoutEditAuditResizeDeltaFeet;
  createdAtOrder: number;
  limitations: string[];
};

export type LayoutRoomDimensionEditAuditEntry = {
  editId: string;
  editType: "edit_room_dimensions";
  objectType: "room";
  objectId: string;
  before: LayoutEditAuditRectFeet;
  after: LayoutEditAuditRectFeet;
  deltaFeet: LayoutEditAuditResizeDeltaFeet;
  changedFields: string[];
  createdAtOrder: number;
  limitations: string[];
};

export type LayoutEditAuditEntry =
  | LayoutRoomMoveAuditEntry
  | LayoutStationMoveAuditEntry
  | LayoutRoomResizeAuditEntry
  | LayoutRoomDimensionEditAuditEntry;

export type CreateRoomMoveAuditEntryInput = {
  roomId: string;
  before: LayoutEditAuditPointFeet;
  after: LayoutEditAuditPointFeet;
  deltaFeet: LayoutEditAuditDeltaFeet;
  createdAtOrder: number;
};

export type CreateStationMoveAuditEntryInput = {
  stationId: string;
  before: LayoutEditAuditPointFeet;
  after: LayoutEditAuditPointFeet;
  deltaFeet: LayoutEditAuditDeltaFeet;
  createdAtOrder: number;
};

export type CreateRoomResizeAuditEntryInput = {
  roomId: string;
  resizeHandle: string;
  before: LayoutEditAuditRectFeet;
  after: LayoutEditAuditRectFeet;
  deltaFeet: LayoutEditAuditResizeDeltaFeet;
  createdAtOrder: number;
};

export type CreateRoomDimensionEditAuditEntryInput = {
  roomId: string;
  before: LayoutEditAuditRectFeet;
  after: LayoutEditAuditRectFeet;
  deltaFeet: LayoutEditAuditResizeDeltaFeet;
  changedFields: readonly string[];
  createdAtOrder: number;
};

const ROOM_MOVE_AUDIT_LIMITATIONS = [
  "Audit entry describes an operational layout edit only.",
  "Undo, redo, persistence, path sync, and simulation rerun are not performed."
] as const;

export function createRoomMoveAuditEntry({
  roomId,
  before,
  after,
  deltaFeet,
  createdAtOrder
}: CreateRoomMoveAuditEntryInput): LayoutEditAuditEntry {
  const order = requirePositiveInteger(createdAtOrder, "createdAtOrder");
  return {
    editId: `layout-edit-${order.toString().padStart(6, "0")}`,
    editType: "move_room",
    objectType: "room",
    objectId: requireString(roomId, "roomId"),
    before: normalizePoint(before, "before"),
    after: normalizePoint(after, "after"),
    deltaFeet: normalizeDelta(deltaFeet),
    createdAtOrder: order,
    limitations: [...ROOM_MOVE_AUDIT_LIMITATIONS]
  };
}

export function createStationMoveAuditEntry({
  stationId,
  before,
  after,
  deltaFeet,
  createdAtOrder
}: CreateStationMoveAuditEntryInput): LayoutStationMoveAuditEntry {
  const order = requirePositiveInteger(createdAtOrder, "createdAtOrder");
  return {
    editId: `layout-edit-${order.toString().padStart(6, "0")}`,
    editType: "station_moved",
    objectType: "station",
    objectId: requireString(stationId, "stationId"),
    before: normalizePoint(before, "before"),
    after: normalizePoint(after, "after"),
    deltaFeet: normalizeDelta(deltaFeet),
    createdAtOrder: order,
    limitations: [...ROOM_MOVE_AUDIT_LIMITATIONS]
  };
}

export function createRoomResizeAuditEntry({
  roomId,
  resizeHandle,
  before,
  after,
  deltaFeet,
  createdAtOrder
}: CreateRoomResizeAuditEntryInput): LayoutRoomResizeAuditEntry {
  const order = requirePositiveInteger(createdAtOrder, "createdAtOrder");
  return {
    editId: `layout-edit-${order.toString().padStart(6, "0")}`,
    editType: "resize_room",
    objectType: "room",
    objectId: requireString(roomId, "roomId"),
    resizeHandle: requireString(resizeHandle, "resizeHandle"),
    before: normalizeRect(before, "before"),
    after: normalizeRect(after, "after"),
    deltaFeet: normalizeResizeDelta(deltaFeet),
    createdAtOrder: order,
    limitations: [...ROOM_MOVE_AUDIT_LIMITATIONS]
  };
}

export function createRoomDimensionEditAuditEntry({
  roomId,
  before,
  after,
  deltaFeet,
  changedFields,
  createdAtOrder
}: CreateRoomDimensionEditAuditEntryInput): LayoutRoomDimensionEditAuditEntry {
  const order = requirePositiveInteger(createdAtOrder, "createdAtOrder");
  return {
    editId: `layout-edit-${order.toString().padStart(6, "0")}`,
    editType: "edit_room_dimensions",
    objectType: "room",
    objectId: requireString(roomId, "roomId"),
    before: normalizeRect(before, "before"),
    after: normalizeRect(after, "after"),
    deltaFeet: normalizeResizeDelta(deltaFeet),
    changedFields: [...changedFields].map((field) => requireString(field, "changedField")).sort(),
    createdAtOrder: order,
    limitations: [...ROOM_MOVE_AUDIT_LIMITATIONS]
  };
}

function normalizePoint(point: LayoutEditAuditPointFeet, label: string): LayoutEditAuditPointFeet {
  return {
    xFeet: normalizeSignedZero(roundFeet(requireFinite(point.xFeet, `${label}.xFeet`))),
    yFeet: normalizeSignedZero(roundFeet(requireFinite(point.yFeet, `${label}.yFeet`)))
  };
}

function normalizeDelta(delta: LayoutEditAuditDeltaFeet): LayoutEditAuditDeltaFeet {
  return {
    deltaXFeet: normalizeSignedZero(roundFeet(requireFinite(delta.deltaXFeet, "deltaFeet.deltaXFeet"))),
    deltaYFeet: normalizeSignedZero(roundFeet(requireFinite(delta.deltaYFeet, "deltaFeet.deltaYFeet")))
  };
}

function normalizeRect(rect: LayoutEditAuditRectFeet, label: string): LayoutEditAuditRectFeet {
  return {
    ...normalizePoint(rect, label),
    widthFeet: normalizeSignedZero(roundFeet(requireFinite(rect.widthFeet, `${label}.widthFeet`))),
    heightFeet: normalizeSignedZero(roundFeet(requireFinite(rect.heightFeet, `${label}.heightFeet`)))
  };
}

function normalizeResizeDelta(delta: LayoutEditAuditResizeDeltaFeet): LayoutEditAuditResizeDeltaFeet {
  return {
    ...normalizeDelta(delta),
    deltaWidthFeet: normalizeSignedZero(roundFeet(requireFinite(delta.deltaWidthFeet, "deltaFeet.deltaWidthFeet"))),
    deltaHeightFeet: normalizeSignedZero(roundFeet(requireFinite(delta.deltaHeightFeet, "deltaFeet.deltaHeightFeet")))
  };
}

function roundFeet(value: number): number {
  return Number(value.toFixed(6));
}

function normalizeSignedZero(value: number): number {
  return Object.is(value, -0) ? 0 : value;
}

function requireString(value: string, label: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}

function requirePositiveInteger(value: number, label: string): number {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${label} must be a positive integer`);
  }
  return value;
}

function requireFinite(value: number, label: string): number {
  if (!Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }
  return value;
}

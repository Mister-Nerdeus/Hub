export type LayoutEditAuditPointFeet = {
  xFeet: number;
  yFeet: number;
};

export type LayoutEditAuditDeltaFeet = {
  deltaXFeet: number;
  deltaYFeet: number;
};

export type LayoutEditAuditEntry = {
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

export type CreateRoomMoveAuditEntryInput = {
  roomId: string;
  before: LayoutEditAuditPointFeet;
  after: LayoutEditAuditPointFeet;
  deltaFeet: LayoutEditAuditDeltaFeet;
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

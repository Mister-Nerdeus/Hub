import type {
  LayoutEditAuditDeltaFeet,
  LayoutEditAuditEntry,
  LayoutEditAuditPointFeet
} from "./layoutEditAuditTrail";

export type LayoutEditGestureAuditSummary = {
  gestureId: string;
  gestureType: "room_move_drag";
  objectType: "room";
  objectId: string;
  start: LayoutEditAuditPointFeet;
  end: LayoutEditAuditPointFeet;
  totalDeltaFeet: LayoutEditAuditDeltaFeet;
  lowLevelEditIds: string[];
  createdAtOrder: number;
  limitations: string[];
};

export type BuildRoomMoveGestureAuditSummaryInput = {
  lowLevelEntries: readonly LayoutEditAuditEntry[];
  createdAtOrder: number;
};

const ROOM_MOVE_GESTURE_LIMITATIONS = [
  "Gesture summary describes operational layout edits only.",
  "Undo, redo, persistence, path sync, and simulation rerun are not performed.",
  "Low-level audit entries remain the source edit records."
] as const;

export function buildRoomMoveGestureAuditSummary({
  lowLevelEntries,
  createdAtOrder
}: BuildRoomMoveGestureAuditSummaryInput): LayoutEditGestureAuditSummary {
  const orderedEntries = [...lowLevelEntries].sort(
    (left, right) => left.createdAtOrder - right.createdAtOrder || left.editId.localeCompare(right.editId)
  );
  if (orderedEntries.length === 0) {
    throw new Error("lowLevelEntries must include at least one move_room audit entry");
  }

  const firstEntry = orderedEntries[0];
  const lastEntry = orderedEntries[orderedEntries.length - 1];
  if (firstEntry == null || lastEntry == null) {
    throw new Error("lowLevelEntries must include room move audit entries");
  }

  for (const entry of orderedEntries) {
    if (entry.editType !== "move_room") {
      throw new Error("room move gesture summaries only accept move_room audit entries");
    }
    if (entry.objectType !== "room" || entry.objectId !== firstEntry.objectId) {
      throw new Error("room move gesture summaries require low-level entries for the same room");
    }
  }

  const order = requirePositiveInteger(createdAtOrder, "createdAtOrder");
  return {
    gestureId: `layout-gesture-${order.toString().padStart(6, "0")}-room-move-${firstEntry.objectId}`,
    gestureType: "room_move_drag",
    objectType: "room",
    objectId: firstEntry.objectId,
    start: normalizePoint(firstEntry.before),
    end: normalizePoint(lastEntry.after),
    totalDeltaFeet: orderedEntries.reduce(
      (total, entry) => ({
        deltaXFeet: normalizeSignedZero(roundFeet(total.deltaXFeet + entry.deltaFeet.deltaXFeet)),
        deltaYFeet: normalizeSignedZero(roundFeet(total.deltaYFeet + entry.deltaFeet.deltaYFeet))
      }),
      { deltaXFeet: 0, deltaYFeet: 0 }
    ),
    lowLevelEditIds: orderedEntries.map((entry) => entry.editId),
    createdAtOrder: order,
    limitations: [...ROOM_MOVE_GESTURE_LIMITATIONS]
  };
}

function normalizePoint(point: LayoutEditAuditPointFeet): LayoutEditAuditPointFeet {
  return {
    xFeet: normalizeSignedZero(roundFeet(requireFinite(point.xFeet, "point.xFeet"))),
    yFeet: normalizeSignedZero(roundFeet(requireFinite(point.yFeet, "point.yFeet")))
  };
}

function roundFeet(value: number): number {
  return Number(value.toFixed(6));
}

function normalizeSignedZero(value: number): number {
  return Object.is(value, -0) ? 0 : value;
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

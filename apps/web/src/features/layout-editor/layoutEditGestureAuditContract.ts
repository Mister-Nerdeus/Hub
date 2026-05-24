import type {
  LayoutEditAuditDeltaFeet,
  LayoutEditAuditEntry,
  LayoutEditAuditPointFeet,
  LayoutEditAuditRectFeet,
  LayoutEditAuditResizeDeltaFeet
} from "./layoutEditAuditTrail";

export const LAYOUT_EDIT_GESTURE_TYPES = [
  "move_room_gesture",
  "resize_room_gesture",
  "dimension_edit_gesture"
] as const;

export type LayoutEditGestureType = (typeof LAYOUT_EDIT_GESTURE_TYPES)[number];

export type LayoutEditGestureAuditSummary = {
  gestureId: string;
  gestureType: LayoutEditGestureType;
  objectType: "room";
  objectId: string;
  start: LayoutEditAuditPointFeet | LayoutEditAuditRectFeet;
  end: LayoutEditAuditPointFeet | LayoutEditAuditRectFeet;
  totalDeltaFeet: LayoutEditAuditDeltaFeet | LayoutEditAuditResizeDeltaFeet;
  resizeHandle: string | null;
  lowLevelEditIds: string[];
  createdAtOrder: number;
  limitations: string[];
};

export type BuildLayoutEditGestureAuditSummaryInput = {
  lowLevelEntries: readonly LayoutEditAuditEntry[];
  createdAtOrder: number;
};

const EDIT_GESTURE_LIMITATIONS = [
  "Gesture summary describes operational layout edits only.",
  "Undo, redo, persistence, path sync, and simulation rerun are not performed.",
  "Low-level audit entries remain compatible source edit records."
] as const;

export function buildLayoutEditGestureAuditSummary({
  lowLevelEntries,
  createdAtOrder
}: BuildLayoutEditGestureAuditSummaryInput): LayoutEditGestureAuditSummary {
  const orderedEntries = [...lowLevelEntries].sort(
    (left, right) => left.createdAtOrder - right.createdAtOrder || left.editId.localeCompare(right.editId)
  );
  if (orderedEntries.length === 0) {
    throw new Error("lowLevelEntries must include at least one layout edit audit entry");
  }

  const firstEntry = orderedEntries[0];
  const lastEntry = orderedEntries[orderedEntries.length - 1];
  if (firstEntry == null || lastEntry == null) {
    throw new Error("lowLevelEntries must include layout edit audit entries");
  }

  for (const entry of orderedEntries) {
    if (entry.objectType !== firstEntry.objectType || entry.objectId !== firstEntry.objectId) {
      throw new Error("gesture summaries require low-level entries for the same object ID");
    }
    if (entry.editType !== firstEntry.editType) {
      throw new Error("gesture summaries reject incompatible mixed edit types");
    }
  }

  const order = requirePositiveInteger(createdAtOrder, "createdAtOrder");
  switch (firstEntry.editType) {
    case "move_room":
      return buildMoveRoomGestureSummary(
        orderedEntries.filter(isMoveRoomAuditEntry),
        order
      );
    case "resize_room":
      return buildResizeRoomGestureSummary(
        orderedEntries.filter(isResizeRoomAuditEntry),
        order
      );
    case "edit_room_dimensions":
      if (orderedEntries.length !== 1) {
        throw new Error("dimension edit gestures require exactly one edit_room_dimensions entry");
      }
      return buildDimensionEditGestureSummary(firstEntry, order);
  }
}

function isMoveRoomAuditEntry(
  entry: LayoutEditAuditEntry
): entry is Extract<LayoutEditAuditEntry, { editType: "move_room" }> {
  return entry.editType === "move_room";
}

function isResizeRoomAuditEntry(
  entry: LayoutEditAuditEntry
): entry is Extract<LayoutEditAuditEntry, { editType: "resize_room" }> {
  return entry.editType === "resize_room";
}

function buildMoveRoomGestureSummary(
  orderedEntries: readonly Extract<LayoutEditAuditEntry, { editType: "move_room" }>[],
  order: number
): LayoutEditGestureAuditSummary {
  const firstEntry = firstEntryOf(orderedEntries);
  const lastEntry = lastEntryOf(orderedEntries);
  return {
    gestureId: gestureId(order, "move_room_gesture", firstEntry.objectId),
    gestureType: "move_room_gesture",
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
    resizeHandle: null,
    lowLevelEditIds: orderedEntries.map((entry) => entry.editId),
    createdAtOrder: order,
    limitations: [...EDIT_GESTURE_LIMITATIONS]
  };
}

function buildResizeRoomGestureSummary(
  orderedEntries: readonly Extract<LayoutEditAuditEntry, { editType: "resize_room" }>[],
  order: number
): LayoutEditGestureAuditSummary {
  const firstEntry = firstEntryOf(orderedEntries);
  const lastEntry = lastEntryOf(orderedEntries);
  for (const entry of orderedEntries) {
    if (entry.resizeHandle !== firstEntry.resizeHandle) {
      throw new Error("resize gesture summaries require the same resize handle");
    }
  }

  return {
    gestureId: gestureId(order, "resize_room_gesture", firstEntry.objectId),
    gestureType: "resize_room_gesture",
    objectType: "room",
    objectId: firstEntry.objectId,
    start: normalizeRect(firstEntry.before),
    end: normalizeRect(lastEntry.after),
    totalDeltaFeet: orderedEntries.reduce(
      (total, entry) => ({
        deltaXFeet: normalizeSignedZero(roundFeet(total.deltaXFeet + entry.deltaFeet.deltaXFeet)),
        deltaYFeet: normalizeSignedZero(roundFeet(total.deltaYFeet + entry.deltaFeet.deltaYFeet)),
        deltaWidthFeet: normalizeSignedZero(roundFeet(total.deltaWidthFeet + entry.deltaFeet.deltaWidthFeet)),
        deltaHeightFeet: normalizeSignedZero(roundFeet(total.deltaHeightFeet + entry.deltaFeet.deltaHeightFeet))
      }),
      { deltaXFeet: 0, deltaYFeet: 0, deltaWidthFeet: 0, deltaHeightFeet: 0 }
    ),
    resizeHandle: firstEntry.resizeHandle,
    lowLevelEditIds: orderedEntries.map((entry) => entry.editId),
    createdAtOrder: order,
    limitations: [...EDIT_GESTURE_LIMITATIONS]
  };
}

function buildDimensionEditGestureSummary(
  entry: Extract<LayoutEditAuditEntry, { editType: "edit_room_dimensions" }>,
  order: number
): LayoutEditGestureAuditSummary {
  return {
    gestureId: gestureId(order, "dimension_edit_gesture", entry.objectId),
    gestureType: "dimension_edit_gesture",
    objectType: "room",
    objectId: entry.objectId,
    start: normalizeRect(entry.before),
    end: normalizeRect(entry.after),
    totalDeltaFeet: normalizeResizeDelta(entry.deltaFeet),
    resizeHandle: null,
    lowLevelEditIds: [entry.editId],
    createdAtOrder: order,
    limitations: [...EDIT_GESTURE_LIMITATIONS]
  };
}

function gestureId(order: number, gestureType: LayoutEditGestureType, objectId: string): string {
  return `layout-gesture-${order.toString().padStart(6, "0")}-${gestureType}-${objectId}`;
}

function normalizePoint(point: LayoutEditAuditPointFeet): LayoutEditAuditPointFeet {
  return {
    xFeet: normalizeSignedZero(roundFeet(requireFinite(point.xFeet, "point.xFeet"))),
    yFeet: normalizeSignedZero(roundFeet(requireFinite(point.yFeet, "point.yFeet")))
  };
}

function normalizeRect(rect: LayoutEditAuditRectFeet): LayoutEditAuditRectFeet {
  return {
    ...normalizePoint(rect),
    widthFeet: normalizeSignedZero(roundFeet(requireFinite(rect.widthFeet, "rect.widthFeet"))),
    heightFeet: normalizeSignedZero(roundFeet(requireFinite(rect.heightFeet, "rect.heightFeet")))
  };
}

function normalizeResizeDelta(delta: LayoutEditAuditResizeDeltaFeet): LayoutEditAuditResizeDeltaFeet {
  return {
    deltaXFeet: normalizeSignedZero(roundFeet(requireFinite(delta.deltaXFeet, "deltaFeet.deltaXFeet"))),
    deltaYFeet: normalizeSignedZero(roundFeet(requireFinite(delta.deltaYFeet, "deltaFeet.deltaYFeet"))),
    deltaWidthFeet: normalizeSignedZero(roundFeet(requireFinite(delta.deltaWidthFeet, "deltaFeet.deltaWidthFeet"))),
    deltaHeightFeet: normalizeSignedZero(roundFeet(requireFinite(delta.deltaHeightFeet, "deltaFeet.deltaHeightFeet")))
  };
}

function firstEntryOf<T>(entries: readonly T[]): T {
  const entry = entries[0];
  if (entry == null) {
    throw new Error("gesture summaries require typed low-level entries");
  }
  return entry;
}

function lastEntryOf<T>(entries: readonly T[]): T {
  const entry = entries[entries.length - 1];
  if (entry == null) {
    throw new Error("gesture summaries require typed low-level entries");
  }
  return entry;
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

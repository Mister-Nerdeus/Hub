import type { EditableRoomGeometry } from "../layout-editor/editableLayoutGeometryContract.js";

export type SplitRoomAdjacencyResult =
  | {
      status: "adjacent";
      orientation: "horizontal" | "vertical";
      gapFeet: number;
    }
  | {
      status: "blocked";
      reason: string;
      gapFeet: number | null;
    };

export const SPLIT_ROOM_ADJACENCY_TOLERANCE_FEET = 0.01;

const NOT_ADJACENT_REASON = "Rooms are not adjacent enough to form one physical bay.";
const OVERLAP_REASON = "Rooms overlap and are not adjacent enough to form one physical bay.";

export function evaluateSplitRoomAdjacency(
  roomA: EditableRoomGeometry,
  roomB: EditableRoomGeometry
): SplitRoomAdjacencyResult {
  const rectA = roomRect(roomA);
  const rectB = roomRect(roomB);
  const overlapWidth = overlapLength(rectA.left, rectA.right, rectB.left, rectB.right);
  const overlapHeight = overlapLength(rectA.top, rectA.bottom, rectB.top, rectB.bottom);

  if (overlapWidth > 0 && overlapHeight > 0) {
    return {
      status: "blocked",
      reason: OVERLAP_REASON,
      gapFeet: null
    };
  }

  const horizontalGaps = [
    rectB.left - rectA.right,
    rectA.left - rectB.right
  ];
  const horizontalGap = horizontalGaps.find((gap) => gap >= 0 && gap <= SPLIT_ROOM_ADJACENCY_TOLERANCE_FEET);
  if (
    horizontalGap != null &&
    withinTolerance(rectA.top, rectB.top) &&
    withinTolerance(rectA.height, rectB.height)
  ) {
    return {
      status: "adjacent",
      orientation: "horizontal",
      gapFeet: normalizeGap(horizontalGap)
    };
  }

  const verticalGaps = [
    rectB.top - rectA.bottom,
    rectA.top - rectB.bottom
  ];
  const verticalGap = verticalGaps.find((gap) => gap >= 0 && gap <= SPLIT_ROOM_ADJACENCY_TOLERANCE_FEET);
  if (
    verticalGap != null &&
    withinTolerance(rectA.left, rectB.left) &&
    withinTolerance(rectA.width, rectB.width)
  ) {
    return {
      status: "adjacent",
      orientation: "vertical",
      gapFeet: normalizeGap(verticalGap)
    };
  }

  const nearestGap = nearestNonOverlappingGap(rectA, rectB);
  return {
    status: "blocked",
    reason: NOT_ADJACENT_REASON,
    gapFeet: nearestGap
  };
}

function roomRect(room: EditableRoomGeometry) {
  return {
    left: room.xFeet,
    right: room.xFeet + room.widthFeet,
    top: room.yFeet,
    bottom: room.yFeet + room.heightFeet,
    width: room.widthFeet,
    height: room.heightFeet
  };
}

function withinTolerance(left: number, right: number): boolean {
  return Math.abs(left - right) <= SPLIT_ROOM_ADJACENCY_TOLERANCE_FEET;
}

function overlapLength(leftA: number, rightA: number, leftB: number, rightB: number): number {
  return Math.max(0, Math.min(rightA, rightB) - Math.max(leftA, leftB));
}

function nearestNonOverlappingGap(
  rectA: ReturnType<typeof roomRect>,
  rectB: ReturnType<typeof roomRect>
): number | null {
  const gaps = [
    rectB.left - rectA.right,
    rectA.left - rectB.right,
    rectB.top - rectA.bottom,
    rectA.top - rectB.bottom
  ].filter((gap) => gap >= 0);
  return gaps.length === 0 ? null : normalizeGap(Math.min(...gaps));
}

function normalizeGap(gapFeet: number): number {
  return Math.abs(gapFeet) < Number.EPSILON ? 0 : Number(gapFeet.toFixed(4));
}

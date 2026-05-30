import type { EditableSplitBayDividerStyle } from "../layout-editor/editableLayoutGeometryContract.js";

export type SplitRoomCanonicalPair = {
  pairId: string;
  pairLabel: string;
  roomAId: string;
  roomBId: string;
  suggestedDivider: Extract<EditableSplitBayDividerStyle, "diagonal_down" | "diagonal_up" | "vertical" | "horizontal">;
  physicalBayCount: 1;
  patientCarePositionCount: 2;
};

export type SplitRoomPairResolution =
  | {
      status: "ready";
      pairId: string;
      pairLabel: string;
      roomAId: string;
      roomBId: string;
      roomALabel: string;
      roomBLabel: string;
      suggestedDivider: "diagonal_down" | "diagonal_up" | "vertical" | "horizontal";
      physicalBayCount: 1;
      patientCarePositionCount: 2;
    }
  | {
      status: "blocked";
      reason: string;
      selectedRoomId: string;
      expectedPartnerId?: string;
    };

export type SplitRoomAuthoringResult =
  | {
      status: "created";
      layout: import("../layout-editor/editableLayoutGeometryContract.js").EditableLayoutGeometryContract;
      splitBayId: string;
      pairLabel: string;
      childRoomIds: [string, string];
      warnings: string[];
    }
  | {
      status: "blocked";
      layout: import("../layout-editor/editableLayoutGeometryContract.js").EditableLayoutGeometryContract;
      reason: string;
    };

export type SplitRoomAssignmentSemantics = {
  parentSplitBayId: string;
  assignableRoomIds: string[];
  physicalBayCount: number;
  patientCarePositionCount: number;
  parentAssignable: false;
};

export const CANONICAL_SPLIT_ROOM_PAIRS: readonly SplitRoomCanonicalPair[] = [
  canonicalPair("room-02", "room-03", "2/3"),
  canonicalPair("room-04", "room-05", "4/5"),
  canonicalPair("room-06", "room-07", "6/7"),
  canonicalPair("room-08", "room-09", "8/9")
];

export function splitRoomPairForRoomId(roomId: string): SplitRoomCanonicalPair | null {
  return CANONICAL_SPLIT_ROOM_PAIRS.find(
    (pair) => pair.roomAId === roomId || pair.roomBId === roomId
  ) ?? null;
}

export function splitRoomIdForPair(roomAId: string, roomBId: string): string {
  return `split-bay-${roomAId}-${roomBId}`;
}

function canonicalPair(roomAId: string, roomBId: string, pairLabel: string): SplitRoomCanonicalPair {
  return {
    pairId: splitRoomIdForPair(roomAId, roomBId),
    pairLabel,
    roomAId,
    roomBId,
    suggestedDivider: "diagonal_down",
    physicalBayCount: 1,
    patientCarePositionCount: 2
  };
}

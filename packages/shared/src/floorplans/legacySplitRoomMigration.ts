import type { EditableRoomGeometry, EditableSplitBayGeometry } from "../layout-editor/editableLayoutGeometryContract.js";
import {
  createSplitRoomContract,
  stableSplitRoomBedPositionId,
  type SplitRoomContract
} from "./splitRoomContract.js";

export type LegacySplitRoomMigrationResult =
  | {
      status: "migrated";
      splitRoom: SplitRoomContract;
      reviewRequired: false;
    }
  | {
      status: "needs_review";
      legacySplitBayId: string;
      reviewRequired: true;
      reason: string;
    };

export function migrateLegacySplitBayToParentBed(input: {
  splitBay: EditableSplitBayGeometry;
  rooms: readonly EditableRoomGeometry[];
}): LegacySplitRoomMigrationResult {
  const [firstRoomId, secondRoomId] = input.splitBay.bedPositionRoomIds;
  const firstRoom = input.rooms.find((room) => room.id === firstRoomId);
  const secondRoom = input.rooms.find((room) => room.id === secondRoomId);
  if (firstRoom == null || secondRoom == null) {
    return needsReview(input.splitBay, "Legacy split room references missing child-room geometry.");
  }
  if (firstRoom.id === secondRoom.id) {
    return needsReview(input.splitBay, "Legacy split room must reference two distinct bed positions.");
  }

  const dividerOrientation = input.splitBay.dividerStyle === "horizontal" ? "horizontal" : "vertical";
  return {
    status: "migrated",
    reviewRequired: false,
    splitRoom: createSplitRoomContract({
      splitRoomId: input.splitBay.splitBayId,
      parentRoomId: input.splitBay.splitBayId,
      splitMode: "two_bed",
      dividerOrientation,
      dividerRatio: 0.5,
      bedPositions: [
        {
          bedPositionId: stableSplitRoomBedPositionId({ parentRoomId: input.splitBay.splitBayId, bedSuffix: "a" }),
          parentRoomId: input.splitBay.splitBayId,
          label: `${firstRoom.roomNumber}A`,
          assignmentTarget: true,
          relativeBounds: dividerOrientation === "horizontal"
            ? { xRatio: 0, yRatio: 0, widthRatio: 1, heightRatio: 0.5 }
            : { xRatio: 0, yRatio: 0, widthRatio: 0.5, heightRatio: 1 }
        },
        {
          bedPositionId: stableSplitRoomBedPositionId({ parentRoomId: input.splitBay.splitBayId, bedSuffix: "b" }),
          parentRoomId: input.splitBay.splitBayId,
          label: `${secondRoom.roomNumber}B`,
          assignmentTarget: true,
          relativeBounds: dividerOrientation === "horizontal"
            ? { xRatio: 0, yRatio: 0.5, widthRatio: 1, heightRatio: 0.5 }
            : { xRatio: 0.5, yRatio: 0, widthRatio: 0.5, heightRatio: 1 }
        }
      ]
    })
  };
}

function needsReview(
  splitBay: EditableSplitBayGeometry,
  reason: string
): LegacySplitRoomMigrationResult {
  return {
    status: "needs_review",
    legacySplitBayId: splitBay.splitBayId,
    reviewRequired: true,
    reason
  };
}

import type { EditableRoomGeometry, EditableSplitBayGeometry } from "../layout-editor/editableLayoutGeometryContract.js";
import {
  createSplitRoomContract,
  stableSplitRoomBedPositionId,
  type SplitRoomContract
} from "./splitRoomContract.js";

export type LegacySplitRoomMigrationResult =
  | {
      status: "migrated";
      parentRoom: EditableRoomGeometry;
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
  const parentRoom = createLegacySplitParentRoom(input.splitBay, firstRoom, secondRoom);
  return {
    status: "migrated",
    reviewRequired: false,
    parentRoom,
    splitRoom: createSplitRoomContract({
      splitRoomId: input.splitBay.splitBayId,
      parentRoomId: parentRoom.id,
      splitMode: "two_bed",
      dividerOrientation,
      dividerRatio: 0.5,
      bedPositions: [
        {
          bedPositionId: stableSplitRoomBedPositionId({ parentRoomId: parentRoom.id, bedSuffix: "a" }),
          parentRoomId: parentRoom.id,
          label: `${firstRoom.roomNumber}A`,
          assignmentTarget: true,
          relativeBounds: dividerOrientation === "horizontal"
            ? { xRatio: 0, yRatio: 0, widthRatio: 1, heightRatio: 0.5 }
            : { xRatio: 0, yRatio: 0, widthRatio: 0.5, heightRatio: 1 }
        },
        {
          bedPositionId: stableSplitRoomBedPositionId({ parentRoomId: parentRoom.id, bedSuffix: "b" }),
          parentRoomId: parentRoom.id,
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

function createLegacySplitParentRoom(
  splitBay: EditableSplitBayGeometry,
  firstRoom: EditableRoomGeometry,
  secondRoom: EditableRoomGeometry
): EditableRoomGeometry {
  return {
    objectType: "room",
    id: splitBay.splitBayId,
    label: splitBay.label,
    roomNumber: splitBay.label,
    roomType: legacySplitParentRoomType(firstRoom, secondRoom),
    capacityType: "double",
    isHallBed: false,
    isTraumaAdjacent: firstRoom.isTraumaAdjacent || secondRoom.isTraumaAdjacent,
    xFeet: splitBay.xFeet,
    yFeet: splitBay.yFeet,
    widthFeet: splitBay.widthFeet,
    heightFeet: splitBay.heightFeet
  };
}

function legacySplitParentRoomType(
  firstRoom: EditableRoomGeometry,
  secondRoom: EditableRoomGeometry
): EditableRoomGeometry["roomType"] {
  const parentCompatibleTypes = new Set<EditableRoomGeometry["roomType"]>([
    "standard",
    "trauma",
    "isolation",
    "behavioral",
    "procedure",
    "overflow"
  ]);
  if (firstRoom.roomType === secondRoom.roomType && parentCompatibleTypes.has(firstRoom.roomType)) {
    return firstRoom.roomType;
  }
  return "standard";
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

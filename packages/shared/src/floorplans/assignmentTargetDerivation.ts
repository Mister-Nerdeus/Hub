import {
  assignmentTargetIdForGeometry,
  createAssignmentTargetContract,
  type AssignmentTargetContract
} from "./assignmentTargetContract.js";
import {
  validateBedPositionContract,
  validateSplitRoomContract,
  type BedPositionContract,
  type SplitRoomContract
} from "./splitRoomContract.js";

export function assignmentTargetIdForSplitBedPosition(
  bedPosition: BedPositionContract
): string {
  const validBedPosition = validateBedPositionContract(bedPosition);
  return assignmentTargetIdForGeometry({
    targetKind: "split_room_bed_position",
    geometrySourceId: validBedPosition.bedPositionId
  });
}

export function deriveSplitRoomAssignmentTargets(
  splitRoom: SplitRoomContract
): AssignmentTargetContract[] {
  const validSplitRoom = validateSplitRoomContract(splitRoom);
  return validSplitRoom.bedPositions.map((bedPosition) =>
    createAssignmentTargetContract({
      assignmentTargetId: assignmentTargetIdForSplitBedPosition(bedPosition),
      geometrySourceId: bedPosition.bedPositionId,
      targetKind: "split_room_bed_position",
      displayLabel: bedPosition.label,
      parentRoomId: validSplitRoom.parentRoomId,
      active: true
    })
  );
}

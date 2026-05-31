import { deriveSplitRoomAssignmentTargets } from "./assignmentTargetDerivation.js";
import {
  validateSplitRoomContract,
  type SplitRoomContract
} from "./splitRoomContract.js";

export type SplitRoomValidationIssueCode =
  | "SPLIT_PARENT_ROOM_MISSING"
  | "SPLIT_TWO_BED_REQUIRES_EXACTLY_TWO_BEDS"
  | "SPLIT_BED_OUTSIDE_PARENT_BOUNDS"
  | "SPLIT_DIVIDER_RATIO_OUT_OF_RANGE"
  | "SPLIT_ASSIGNMENT_TARGET_ID_UNSTABLE"
  | "SPLIT_DUPLICATE_BED_LABEL";

export type SplitRoomValidationIssue = {
  code: SplitRoomValidationIssueCode;
  severity: "blocking";
  message: string;
  splitRoomId: string;
  bedPositionId?: string;
};

export type SplitRoomValidationParent = {
  id: string;
};

export function validateSplitRoomGeometry(input: {
  splitRoom: SplitRoomContract;
  parentRooms: readonly SplitRoomValidationParent[];
}): SplitRoomValidationIssue[] {
  const splitRoom = validateSplitRoomContract(input.splitRoom);
  const issues: SplitRoomValidationIssue[] = [];
  const parentRoomExists = input.parentRooms.some((room) => room.id === splitRoom.parentRoomId);
  if (!parentRoomExists) {
    issues.push(issue(splitRoom, "SPLIT_PARENT_ROOM_MISSING", "Split room parent room is missing."));
  }
  if (splitRoom.splitMode === "two_bed" && splitRoom.bedPositions.length !== 2) {
    issues.push(issue(splitRoom, "SPLIT_TWO_BED_REQUIRES_EXACTLY_TWO_BEDS", "Two-bed split rooms require exactly two bed positions."));
  }
  if (splitRoom.dividerRatio < 0.2 || splitRoom.dividerRatio > 0.8) {
    issues.push(issue(splitRoom, "SPLIT_DIVIDER_RATIO_OUT_OF_RANGE", "Split room divider ratio must stay within editable bounds."));
  }

  const labels = new Set<string>();
  for (const bedPosition of splitRoom.bedPositions) {
    if (labels.has(bedPosition.label)) {
      issues.push(issue(splitRoom, "SPLIT_DUPLICATE_BED_LABEL", "Split room bed labels must be unique.", bedPosition.bedPositionId));
    }
    labels.add(bedPosition.label);
    if (!bedRelativeBoundsInsideParent(bedPosition.relativeBounds)) {
      issues.push(issue(splitRoom, "SPLIT_BED_OUTSIDE_PARENT_BOUNDS", "Split room bed position must remain inside parent bounds.", bedPosition.bedPositionId));
    }
  }

  const targetIds = deriveSplitRoomAssignmentTargets(splitRoom).map((target) => target.assignmentTargetId);
  if (new Set(targetIds).size !== targetIds.length || targetIds.some((targetId) => !targetId.startsWith("split_room_bed_position:"))) {
    issues.push(issue(splitRoom, "SPLIT_ASSIGNMENT_TARGET_ID_UNSTABLE", "Split room assignment target IDs must be stable."));
  }

  return issues;
}

export function splitRoomValidationBlocksAssignments(input: {
  splitRoom: SplitRoomContract;
  parentRooms: readonly SplitRoomValidationParent[];
}): boolean {
  return validateSplitRoomGeometry(input).length > 0;
}

function bedRelativeBoundsInsideParent(bounds: {
  xRatio: number;
  yRatio: number;
  widthRatio: number;
  heightRatio: number;
}): boolean {
  return (
    bounds.xRatio >= 0 &&
    bounds.yRatio >= 0 &&
    bounds.widthRatio > 0 &&
    bounds.heightRatio > 0 &&
    bounds.xRatio + bounds.widthRatio <= 1 &&
    bounds.yRatio + bounds.heightRatio <= 1
  );
}

function issue(
  splitRoom: SplitRoomContract,
  code: SplitRoomValidationIssueCode,
  message: string,
  bedPositionId?: string
): SplitRoomValidationIssue {
  return {
    code,
    severity: "blocking",
    message,
    splitRoomId: splitRoom.splitRoomId,
    ...(bedPositionId == null ? {} : { bedPositionId })
  };
}

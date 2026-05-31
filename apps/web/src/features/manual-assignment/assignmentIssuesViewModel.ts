import type { ManualWarningRow } from "./manualBurdenViewModel";

export type AssignmentIssuesViewModel = {
  warningCount: number;
  hasUnassignedOccupiedRooms: boolean;
  hasHighBurdenNurses: boolean;
  hasWideSpread: boolean;
  hasTraumaMismatch: boolean;
  hasSplitRoomIssue: boolean;
  warnings: ManualWarningRow[];
};

export function createAssignmentIssuesViewModel(
  warnings: ManualWarningRow[]
): AssignmentIssuesViewModel {
  return {
    warningCount: warnings.length,
    hasUnassignedOccupiedRooms: warnings.some((warning) => warning.code === "UNASSIGNED_OCCUPIED_ROOM"),
    hasHighBurdenNurses: warnings.some((warning) => warning.code === "OVER_MAX_RATIO" || warning.code === "OVER_TARGET_RATIO" || warning.code === "HIGH_ACUITY_CLUSTER"),
    hasWideSpread: warnings.some((warning) => warning.code === "ROOMS_TOO_SPREAD_OUT"),
    hasTraumaMismatch: warnings.some((warning) => warning.code === "TRAUMA_QUALIFICATION_MISMATCH"),
    hasSplitRoomIssue: warnings.some((warning) => warning.roomIds.some((roomId) => roomId.includes("split"))),
    warnings
  };
}

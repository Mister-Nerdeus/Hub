import {
  assignmentSetMatchesFloorplanVersion,
  type AssignmentSetContract
} from "@nerdeus/shared";

export type AssignmentSetViewModel = {
  assignmentSetId: string;
  displayName: string;
  floorplanVersionId: string;
  statusLabel: string;
  nurseProfileCount: number;
  roomLoadCount: number;
  assignedRoomCount: number;
  compatibilityStatus: "compatible" | "floorplan_version_mismatch";
};

export function createAssignmentSetViewModel(
  assignmentSet: AssignmentSetContract,
  activeFloorplanVersionId: string
): AssignmentSetViewModel {
  const compatible = assignmentSetMatchesFloorplanVersion(assignmentSet, activeFloorplanVersionId);
  return {
    assignmentSetId: assignmentSet.assignmentSetId,
    displayName: assignmentSet.displayName,
    floorplanVersionId: assignmentSet.floorplanVersionId,
    statusLabel: statusLabel(assignmentSet.status),
    nurseProfileCount: assignmentSet.nurseProfiles.length,
    roomLoadCount: Object.keys(assignmentSet.roomLoadsByRoomId).length,
    assignedRoomCount: Object.keys(assignmentSet.assignmentsByRoomId).length,
    compatibilityStatus: compatible ? "compatible" : "floorplan_version_mismatch"
  };
}

function statusLabel(status: AssignmentSetContract["status"]): string {
  if (status === "ready_for_scenario") return "Ready for scenario setup";
  if (status === "archived") return "Archived";
  return "Draft";
}

import {
  assignmentSetMatchesFloorplanVersion,
  type AssignmentSetContract
} from "@nerdeus/shared";

export type AssignmentSetSelectorViewModel = {
  activeAssignmentSetId: string | null;
  selectedScenarioAssignmentSetId: string | null;
  options: AssignmentSetSelectorOption[];
};

export type AssignmentSetSelectorOption = {
  assignmentSetId: string;
  displayName: string;
  status: AssignmentSetContract["status"];
  compatibilityStatus: "compatible" | "floorplan_version_mismatch";
  assignedRoomCount: number;
  roomLoadCount: number;
  active: boolean;
  selectedForScenario: boolean;
};

export function createAssignmentSetSelectorViewModel({
  assignmentSets,
  activeAssignmentSet,
  selectedScenarioAssignmentSet,
  activeFloorplanVersionId
}: {
  assignmentSets: AssignmentSetContract[];
  activeAssignmentSet: AssignmentSetContract | null;
  selectedScenarioAssignmentSet: AssignmentSetContract | null;
  activeFloorplanVersionId: string | null;
}): AssignmentSetSelectorViewModel {
  return {
    activeAssignmentSetId: activeAssignmentSet?.assignmentSetId ?? null,
    selectedScenarioAssignmentSetId: selectedScenarioAssignmentSet?.assignmentSetId ?? null,
    options: assignmentSets
      .filter((assignmentSet) =>
        activeFloorplanVersionId == null ||
        assignmentSetMatchesFloorplanVersion(assignmentSet, activeFloorplanVersionId)
      )
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .map((assignmentSet) => ({
        assignmentSetId: assignmentSet.assignmentSetId,
        displayName: assignmentSet.displayName,
        status: assignmentSet.status,
        compatibilityStatus:
          activeFloorplanVersionId == null || assignmentSetMatchesFloorplanVersion(assignmentSet, activeFloorplanVersionId)
            ? "compatible"
            : "floorplan_version_mismatch",
        assignedRoomCount: Object.keys(assignmentSet.assignmentsByRoomId).length,
        roomLoadCount: Object.keys(assignmentSet.roomLoadsByRoomId).length,
        active: assignmentSet.assignmentSetId === activeAssignmentSet?.assignmentSetId,
        selectedForScenario: assignmentSet.assignmentSetId === selectedScenarioAssignmentSet?.assignmentSetId
      }))
  };
}

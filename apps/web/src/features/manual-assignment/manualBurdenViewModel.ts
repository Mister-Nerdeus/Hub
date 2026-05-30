import {
  buildManualAssignmentWarnings,
  calculateManualBurdenScores,
  type ManualAssignmentWarning,
  type ManualNurseBurdenScore
} from "@nerdeus/shared";
import { selectManualAssignments } from "./manualAssignmentSelectors";
import type { ManualAssignmentState } from "./manualAssignmentState";
import { createWalkingBurdenSummaryByNurse } from "./walkingBurdenViewModel";
import type { ManualAssignmentDisplayOptions } from "./manualAssignmentWorkspaceViewModel";

export type ManualBurdenViewModel = {
  burdenRows: ManualBurdenRow[];
  warnings: ManualWarningRow[];
};

export type ManualBurdenRow = ManualNurseBurdenScore & {
  displayLabel: string;
  assignedRoomIds: string[];
  explanation: string;
};

export type ManualWarningRow = ManualAssignmentWarning & {
  id: string;
  displayText: string;
};

export function createManualBurdenViewModel(
  state: ManualAssignmentState,
  options: ManualAssignmentDisplayOptions = {}
): ManualBurdenViewModel {
  const assignments = selectManualAssignments(state);
  const roomLoads = Object.values(state.roomLoadsByRoomId);
  const walkingSummaries = Object.values(createWalkingBurdenSummaryByNurse(state));
  const nurseLabels = new Map(state.nurses.map((nurse) => [nurse.nurseId, nurse.displayLabel]));
  const assignmentsByNurse = new Map(state.nurses.map((nurse) => [nurse.nurseId, [] as string[]]));
  for (const assignment of assignments) {
    assignmentsByNurse.get(assignment.nurseId)?.push(assignment.roomId);
  }
  const burdenScores = calculateManualBurdenScores({
    nurses: state.nurses,
    roomLoads,
    assignments,
    walkingSummaries
  });
  const warnings = buildManualAssignmentWarnings({
    nurses: state.nurses,
    roomLoads,
    assignments,
    walkingSummaries
  });

  return {
    burdenRows: burdenScores.map((score) => {
      const assignedRoomIds = [...(assignmentsByNurse.get(score.nurseId) ?? [])].sort();
      return {
        ...score,
        displayLabel: options.displayLabelsByNurseId?.[score.nurseId] ?? nurseLabels.get(score.nurseId) ?? score.nurseId,
        assignedRoomIds,
        explanation: [
          ...score.visibleComponents,
          assignedRoomIds.length > 0 ? `rooms ${assignedRoomIds.join(", ")}` : "rooms none"
        ].join("; ")
      };
    }),
    warnings: warnings.map((warning, index) => ({
      ...warning,
      id: `${warning.code}-${index}`,
      displayText: `${warning.summary} ${warning.visibleComponents.join("; ")}`
    }))
  };
}

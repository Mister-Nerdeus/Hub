import {
  buildManualAssignmentWarnings,
  calculateManualBurdenScores,
  type ManualAssignmentWarning,
  type ManualNurseBurdenScore
} from "@nerdeus/shared";
import { selectManualAssignments } from "./manualAssignmentSelectors";
import type { ManualAssignmentState } from "./manualAssignmentState";
import { createWalkingBurdenSummaryByNurse } from "./walkingBurdenViewModel";

export type ManualBurdenViewModel = {
  burdenRows: ManualBurdenRow[];
  warnings: ManualWarningRow[];
};

export type ManualBurdenRow = ManualNurseBurdenScore & {
  displayLabel: string;
  explanation: string;
};

export type ManualWarningRow = ManualAssignmentWarning & {
  id: string;
  displayText: string;
};

export function createManualBurdenViewModel(state: ManualAssignmentState): ManualBurdenViewModel {
  const assignments = selectManualAssignments(state);
  const roomLoads = Object.values(state.roomLoadsByRoomId);
  const walkingSummaries = Object.values(createWalkingBurdenSummaryByNurse(state));
  const nurseLabels = new Map(state.nurses.map((nurse) => [nurse.nurseId, nurse.displayLabel]));
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
    burdenRows: burdenScores.map((score) => ({
      ...score,
      displayLabel: nurseLabels.get(score.nurseId) ?? score.nurseId,
      explanation: score.visibleComponents.join("; ")
    })),
    warnings: warnings.map((warning, index) => ({
      ...warning,
      id: `${warning.code}-${index}`,
      displayText: `${warning.summary} ${warning.visibleComponents.join("; ")}`
    }))
  };
}

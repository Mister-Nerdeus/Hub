import type { Plan1ManualAssignmentRecord, Plan1NurseProfile, PlanContract } from "@nerdeus/shared";
import { validatePlan1ManualAssignments } from "@nerdeus/shared";

import manualAssignmentFixture from "../../../../../packages/shared/fixtures/assignments/plan-1/manual-assignment-baseline.json" with { type: "json" };

export type ManualAssignmentPaintState = {
  selectedNurseId: string;
  assignments: Plan1ManualAssignmentRecord[];
};

export type ManualAssignmentAction =
  | { type: "selectNurse"; nurseId: string }
  | { type: "togglePrimaryRoom"; roomId: string };

export function getDefaultPlan1ManualAssignments(
  plan: PlanContract,
  nurses: Plan1NurseProfile[]
): Plan1ManualAssignmentRecord[] {
  return validatePlan1ManualAssignments(manualAssignmentFixture.assignments, plan, nurses);
}

export function createManualAssignmentPaintState(
  assignments: Plan1ManualAssignmentRecord[],
  selectedNurseId: string
): ManualAssignmentPaintState {
  return { assignments, selectedNurseId };
}

export function manualAssignmentReducer(
  state: ManualAssignmentPaintState,
  action: ManualAssignmentAction
): ManualAssignmentPaintState {
  if (action.type === "selectNurse") {
    return { ...state, selectedNurseId: action.nurseId };
  }
  const existing = state.assignments.find(
    (assignment) => assignment.roomId === action.roomId && assignment.assignmentType === "primary"
  );
  if (existing?.nurseId === state.selectedNurseId) {
    return {
      ...state,
      assignments: state.assignments.filter((assignment) => assignment.assignmentId !== existing.assignmentId)
    };
  }
  const nextAssignment: Plan1ManualAssignmentRecord = {
    assignmentId: `manual-${action.roomId}-${state.selectedNurseId}`,
    roomId: action.roomId,
    nurseId: state.selectedNurseId,
    assignmentType: "primary",
    startMinute: 0,
    endMinute: null,
    source: "manual",
    syntheticDataOnly: true
  };
  return {
    ...state,
    assignments: [
      ...state.assignments.filter(
        (assignment) => !(assignment.roomId === action.roomId && assignment.assignmentType === "primary")
      ),
      nextAssignment
    ].sort((left, right) => left.roomId.localeCompare(right.roomId) || left.nurseId.localeCompare(right.nurseId))
  };
}

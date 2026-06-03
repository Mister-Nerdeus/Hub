import {
  createManualAssignmentSetEntry,
  validateManualAssignmentSetContract,
  type AssignmentFoundationTargetContract,
  type ManualAssignmentNurse,
  type ManualAssignmentRoomLoad,
  type ManualAssignmentSetContract,
  type ManualRoomAssignment,
  type SemanticRoomType,
  type ManualStaffMemberContract
} from "@nerdeus/shared";

export const MANUAL_ASSIGNMENT_SET_ID = "manual-assignment-set-active";
export const MANUAL_ASSIGNMENT_TIMESTAMP = "2026-06-01T00:00:00.000Z";

export type ManualAssignmentEditorState = {
  selectedStaffMemberId: string;
  selectedAssignmentTargetId: string;
  assignmentSet: ManualAssignmentSetContract;
};

export type ManualAssignmentState = {
  nurses: ManualAssignmentNurse[];
  roomLoadsByRoomId: Record<string, ManualAssignmentRoomLoad>;
  roomTypesByRoomId?: Record<string, SemanticRoomType>;
  assignmentsByRoomId: Record<string, ManualRoomAssignment>;
  activeNurseId: string | null;
  syntheticDataOnly: true;
};

export function createManualAssignmentInitialState(
  nurses: ManualAssignmentNurse[],
  roomLoads: ManualAssignmentRoomLoad[],
  roomTypesByRoomId?: Record<string, SemanticRoomType>
): ManualAssignmentState {
  return {
    nurses: nurses.map((nurse) => ({ ...nurse })),
    roomLoadsByRoomId: Object.fromEntries(roomLoads.map((roomLoad) => [roomLoad.roomId, { ...roomLoad }])),
    roomTypesByRoomId,
    assignmentsByRoomId: {},
    activeNurseId: nurses.find((nurse) => nurse.active)?.nurseId ?? null,
    syntheticDataOnly: true
  };
}

export function manualAssignmentStateToSnapshot(state: ManualAssignmentState) {
  return {
    nurses: state.nurses.map((nurse) => ({ ...nurse })),
    roomLoads: Object.values(state.roomLoadsByRoomId).map((roomLoad) => ({ ...roomLoad })),
    assignments: Object.values(state.assignmentsByRoomId).map((assignment) => ({ ...assignment })),
    activeNurseId: state.activeNurseId,
    syntheticDataOnly: true as const
  };
}

export function createManualAssignmentId(roomId: string, nurseId: string): string {
  return `assignment-${roomId}-${nurseId}`;
}

export function createEmptyManualAssignmentSet(floorplanId: string): ManualAssignmentSetContract {
  return validateManualAssignmentSetContract({
    assignmentSetId: MANUAL_ASSIGNMENT_SET_ID,
    floorplanId,
    label: "Manual assignment set",
    createdAtIso: MANUAL_ASSIGNMENT_TIMESTAMP,
    updatedAtIso: MANUAL_ASSIGNMENT_TIMESTAMP,
    assignments: [],
    mode: "manual"
  });
}

export function createManualAssignmentEditorState(input: {
  floorplanId: string;
  staffMembers: readonly ManualStaffMemberContract[];
  assignmentTargets: readonly AssignmentFoundationTargetContract[];
  initialAssignmentSet?: ManualAssignmentSetContract | null;
}): ManualAssignmentEditorState {
  return {
    selectedStaffMemberId: input.staffMembers[0]?.staffMemberId ?? "",
    selectedAssignmentTargetId: input.assignmentTargets[0]?.assignmentTargetId ?? "",
    assignmentSet: input.initialAssignmentSet ?? createEmptyManualAssignmentSet(input.floorplanId)
  };
}

export function reconcileManualAssignmentEditorStateForLayout(input: {
  currentState: ManualAssignmentEditorState;
  floorplanId: string;
  staffMembers: readonly ManualStaffMemberContract[];
  assignmentTargets: readonly AssignmentFoundationTargetContract[];
  matchingAssignmentSet?: ManualAssignmentSetContract | null;
}): ManualAssignmentEditorState {
  const selectedStaffMemberId = input.staffMembers.some((staff) =>
    staff.staffMemberId === input.currentState.selectedStaffMemberId
  )
    ? input.currentState.selectedStaffMemberId
    : input.staffMembers[0]?.staffMemberId ?? "";
  const selectedAssignmentTargetId = input.assignmentTargets.some((target) =>
    target.assignmentTargetId === input.currentState.selectedAssignmentTargetId
  )
    ? input.currentState.selectedAssignmentTargetId
    : input.assignmentTargets[0]?.assignmentTargetId ?? "";
  const assignmentSet = input.matchingAssignmentSet?.floorplanId === input.floorplanId
    ? input.matchingAssignmentSet
    : input.currentState.assignmentSet.floorplanId === input.floorplanId
      ? input.currentState.assignmentSet
      : createEmptyManualAssignmentSet(input.floorplanId);
  const nextState = {
    selectedStaffMemberId,
    selectedAssignmentTargetId,
    assignmentSet
  };
  return manualAssignmentEditorStateEquals(input.currentState, nextState) ? input.currentState : nextState;
}

export function addManualAssignmentToSet(input: {
  assignmentSet: ManualAssignmentSetContract;
  staffMemberId: string;
  assignmentTarget: AssignmentFoundationTargetContract;
}): ManualAssignmentSetContract {
  const assignment = createManualAssignmentSetEntry({
    assignmentSetId: input.assignmentSet.assignmentSetId,
    staffMemberId: input.staffMemberId,
    target: input.assignmentTarget
  });
  const existing = input.assignmentSet.assignments.some((candidate) =>
    candidate.staffMemberId === assignment.staffMemberId &&
    candidate.assignmentTargetId === assignment.assignmentTargetId
  );
  if (existing) {
    return input.assignmentSet;
  }
  return validateManualAssignmentSetContract({
    ...input.assignmentSet,
    updatedAtIso: MANUAL_ASSIGNMENT_TIMESTAMP,
    assignments: [...input.assignmentSet.assignments, assignment]
  });
}

export function removeManualAssignmentFromSet(input: {
  assignmentSet: ManualAssignmentSetContract;
  assignmentId: string;
}): ManualAssignmentSetContract {
  return validateManualAssignmentSetContract({
    ...input.assignmentSet,
    updatedAtIso: MANUAL_ASSIGNMENT_TIMESTAMP,
    assignments: input.assignmentSet.assignments.filter((assignment) => assignment.assignmentId !== input.assignmentId)
  });
}

function manualAssignmentEditorStateEquals(
  left: ManualAssignmentEditorState,
  right: ManualAssignmentEditorState
): boolean {
  return left.selectedStaffMemberId === right.selectedStaffMemberId &&
    left.selectedAssignmentTargetId === right.selectedAssignmentTargetId &&
    left.assignmentSet === right.assignmentSet;
}

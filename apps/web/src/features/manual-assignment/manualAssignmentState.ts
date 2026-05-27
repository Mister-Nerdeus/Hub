import type {
  ManualAssignmentNurse,
  ManualAssignmentRoomLoad,
  ManualRoomAssignment,
  SemanticRoomType
} from "@nerdeus/shared";

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

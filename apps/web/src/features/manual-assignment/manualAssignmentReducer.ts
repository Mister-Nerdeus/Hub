import type { ManualRoomAssignment } from "@nerdeus/shared";
import { isNurseAssignableRoomType, isRoomLoadEligibleRoomType } from "@nerdeus/shared";
import type { ManualAssignmentAction } from "./manualAssignmentActions";
import { createManualAssignmentId, type ManualAssignmentState } from "./manualAssignmentState";

export function manualAssignmentReducer(
  state: ManualAssignmentState,
  action: ManualAssignmentAction
): ManualAssignmentState {
  switch (action.type) {
    case "assignRoom":
    case "reassignRoom":
      return assignRoom(state, action.roomId, action.nurseId);
    case "unassignRoom": {
      if (!state.assignmentsByRoomId[action.roomId]) return state;
      const nextAssignments = { ...state.assignmentsByRoomId };
      delete nextAssignments[action.roomId];
      return { ...state, assignmentsByRoomId: nextAssignments };
    }
    case "clearAssignments":
      return { ...state, assignmentsByRoomId: {} };
    case "setActiveNurse":
      if (action.nurseId !== null && !state.nurses.some((nurse) => nurse.nurseId === action.nurseId && nurse.active)) return state;
      return { ...state, activeNurseId: action.nurseId };
    case "setRoomLoad":
      if (!state.roomLoadsByRoomId[action.roomLoad.roomId]) return state;
      {
        const roomType = state.roomTypesByRoomId?.[action.roomLoad.roomId];
        if (roomType != null && !isRoomLoadEligibleRoomType(roomType)) return state;
      }
      return {
        ...state,
        roomLoadsByRoomId: {
          ...state.roomLoadsByRoomId,
          [action.roomLoad.roomId]: { ...action.roomLoad }
        }
      };
    default:
      return state;
  }
}

function assignRoom(state: ManualAssignmentState, roomId: string, nurseId: string): ManualAssignmentState {
  if (!state.roomLoadsByRoomId[roomId] || !state.nurses.some((nurse) => nurse.nurseId === nurseId && nurse.active)) return state;
  const roomType = state.roomTypesByRoomId?.[roomId];
  if (roomType != null && !isNurseAssignableRoomType(roomType)) return state;
  const assignment: ManualRoomAssignment = {
    assignmentId: createManualAssignmentId(roomId, nurseId),
    roomId,
    nurseId,
    primary: true,
    syntheticDataOnly: true
  };
  return {
    ...state,
    assignmentsByRoomId: {
      ...state.assignmentsByRoomId,
      [roomId]: assignment
    }
  };
}

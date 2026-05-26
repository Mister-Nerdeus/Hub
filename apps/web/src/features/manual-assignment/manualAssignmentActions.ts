import type { ManualAssignmentRoomLoad } from "@nerdeus/shared";

export type ManualAssignmentAction =
  | { type: "assignRoom"; roomId: string; nurseId: string }
  | { type: "reassignRoom"; roomId: string; nurseId: string }
  | { type: "unassignRoom"; roomId: string }
  | { type: "clearAssignments" }
  | { type: "setActiveNurse"; nurseId: string | null }
  | { type: "setRoomLoad"; roomLoad: ManualAssignmentRoomLoad };

export const assignRoomToNurse = (roomId: string, nurseId: string): ManualAssignmentAction => ({
  type: "assignRoom",
  roomId,
  nurseId
});

export const reassignRoomToNurse = (roomId: string, nurseId: string): ManualAssignmentAction => ({
  type: "reassignRoom",
  roomId,
  nurseId
});

export const unassignRoom = (roomId: string): ManualAssignmentAction => ({
  type: "unassignRoom",
  roomId
});

export const clearManualAssignments = (): ManualAssignmentAction => ({
  type: "clearAssignments"
});

export const setActiveManualAssignmentNurse = (nurseId: string | null): ManualAssignmentAction => ({
  type: "setActiveNurse",
  nurseId
});

export const setManualAssignmentRoomLoad = (roomLoad: ManualAssignmentRoomLoad): ManualAssignmentAction => ({
  type: "setRoomLoad",
  roomLoad
});

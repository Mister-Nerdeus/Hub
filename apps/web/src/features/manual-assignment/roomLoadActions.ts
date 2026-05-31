import {
  validateAssignmentSetContract,
  validateRoomLoadContract,
  type AssignmentSetContract,
  type RoomLoadContract
} from "@nerdeus/shared";

export function updateAssignmentSetRoomLoad(
  assignmentSet: AssignmentSetContract,
  roomLoad: RoomLoadContract,
  nowIso = new Date().toISOString()
): AssignmentSetContract {
  const validatedRoomLoad = validateRoomLoadContract(roomLoad);
  if (assignmentSet.roomLoadsByRoomId[validatedRoomLoad.roomId] == null) {
    return assignmentSet;
  }
  return validateAssignmentSetContract({
    ...assignmentSet,
    roomLoadsByRoomId: {
      ...assignmentSet.roomLoadsByRoomId,
      [validatedRoomLoad.roomId]: validatedRoomLoad
    },
    updatedAt: nowIso
  });
}

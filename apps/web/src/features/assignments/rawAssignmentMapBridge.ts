import {
  validateAssignmentSetContract,
  type AssignmentSetContract
} from "@nerdeus/shared";

export type RawAssignmentMap = Readonly<Record<string, string>>;

export function migrateRawAssignmentMapToAssignmentSet(
  assignmentSet: AssignmentSetContract,
  rawAssignmentsByRoomId: RawAssignmentMap,
  nowIso = new Date().toISOString()
): AssignmentSetContract {
  const roomIds = new Set(Object.keys(assignmentSet.roomLoadsByRoomId));
  const nurseIds = new Set(
    assignmentSet.nurseProfiles
      .filter((nurse) => nurse.active)
      .map((nurse) => nurse.nurseProfileId)
  );
  const migratedAssignments = Object.fromEntries(
    Object.entries(rawAssignmentsByRoomId).filter(([roomId, nurseId]) =>
      roomIds.has(roomId) && nurseIds.has(nurseId)
    )
  );
  return validateAssignmentSetContract({
    ...assignmentSet,
    assignmentsByRoomId: {
      ...assignmentSet.assignmentsByRoomId,
      ...migratedAssignments
    },
    updatedAt: nowIso
  });
}

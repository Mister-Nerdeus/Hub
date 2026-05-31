import type {
  ManualAssignmentNurse,
  ManualAssignmentRoomLoad,
  ManualAssignmentWarning,
  ManualRoomAssignment
} from "./manualAssignmentContracts.js";
import type { ManualNurseWalkingBurdenSummary } from "./walkingBurden.js";

export type BuildManualAssignmentWarningsInput = {
  nurses: ManualAssignmentNurse[];
  roomLoads: ManualAssignmentRoomLoad[];
  assignments: ManualRoomAssignment[];
  walkingSummaries?: ManualNurseWalkingBurdenSummary[];
};

export function buildManualAssignmentWarnings(input: BuildManualAssignmentWarningsInput): ManualAssignmentWarning[] {
  const warnings: ManualAssignmentWarning[] = [];
  const nursesById = new Map(input.nurses.map((nurse) => [nurse.nurseId, nurse]));
  const roomLoadsById = new Map(input.roomLoads.map((roomLoad) => [roomLoad.roomId, roomLoad]));
  const assignedRoomIds = new Set(input.assignments.map((assignment) => assignment.roomId));
  const assignmentsByNurse = new Map<string, ManualRoomAssignment[]>();
  for (const nurse of input.nurses) assignmentsByNurse.set(nurse.nurseId, []);
  for (const assignment of input.assignments) assignmentsByNurse.get(assignment.nurseId)?.push(assignment);

  for (const roomLoad of input.roomLoads) {
    if (roomLoad.occupied && !assignedRoomIds.has(roomLoad.roomId)) {
      warnings.push(makeWarning("UNASSIGNED_OCCUPIED_ROOM", "warning", "Occupied room has no primary nurse assignment.", [], [roomLoad.roomId], [
        `room ${roomLoad.roomId}`,
        "occupied true"
      ]));
    }
  }

  for (const nurse of input.nurses) {
    const assignments = assignmentsByNurse.get(nurse.nurseId) ?? [];
    const occupiedRooms = assignments.map((assignment) => roomLoadsById.get(assignment.roomId)).filter(isOccupiedRoomLoad);
    if (!nurse.active && assignments.length > 0) {
      warnings.push(makeWarning("INACTIVE_NURSE_ASSIGNMENT_REVIEW", "warning", "Inactive nurse profile has existing room assignments that need review.", [nurse.nurseId], assignments.map((assignment) => assignment.roomId), [
        "nurse active false",
        `assigned rooms ${assignments.length}`
      ]));
    }
    if (occupiedRooms.length > nurse.targetPatientCount) {
      warnings.push(makeWarning("OVER_TARGET_RATIO", "warning", "Assigned occupied room count is over target.", [nurse.nurseId], occupiedRooms.map((room) => room.roomId), [
        `occupied ${occupiedRooms.length}`,
        `target ${nurse.targetPatientCount}`
      ]));
    }
    if (occupiedRooms.length > nurse.maxPatientCount) {
      warnings.push(makeWarning("OVER_MAX_RATIO", "blocking", "Assigned occupied room count is over max.", [nurse.nurseId], occupiedRooms.map((room) => room.roomId), [
        `occupied ${occupiedRooms.length}`,
        `max ${nurse.maxPatientCount}`
      ]));
    }
    const traumaRooms = occupiedRooms.filter((room) => room.traumaActive);
    if (traumaRooms.length > 0 && !nurse.traumaQualified) {
      warnings.push(makeWarning("TRAUMA_QUALIFICATION_MISMATCH", "warning", "Trauma load is assigned to a nurse without the synthetic trauma qualification flag.", [nurse.nurseId], traumaRooms.map((room) => room.roomId), [
        "trauma active true",
        "trauma qualified false"
      ]));
    }
    const highAcuityRooms = occupiedRooms.filter((room) => room.acuity >= 4);
    if (highAcuityRooms.length >= 2) {
      warnings.push(makeWarning("HIGH_ACUITY_CLUSTER", "warning", "High acuity cluster is assigned to one nurse.", [nurse.nurseId], highAcuityRooms.map((room) => room.roomId), [
        `high acuity rooms ${highAcuityRooms.length}`
      ]));
    }
  }

  for (const walkingSummary of input.walkingSummaries ?? []) {
    if (walkingSummary.roomToRoomSpread > 70) {
      warnings.push(makeWarning("ROOMS_TOO_SPREAD_OUT", "warning", "Assigned rooms have elevated route spread.", [walkingSummary.nurseId], [], [
        `room spread ${walkingSummary.roomToRoomSpread}`
      ]));
    }
  }

  return warnings.sort((left, right) => left.code.localeCompare(right.code) || left.nurseIds.join(",").localeCompare(right.nurseIds.join(",")));
}

function makeWarning(
  code: ManualAssignmentWarning["code"],
  severity: ManualAssignmentWarning["severity"],
  summary: string,
  nurseIds: string[],
  roomIds: string[],
  visibleComponents: string[]
): ManualAssignmentWarning {
  return {
    code,
    severity,
    summary,
    nurseIds,
    roomIds,
    visibleComponents,
    syntheticDataOnly: true
  };
}

function isOccupiedRoomLoad(value: ManualAssignmentRoomLoad | undefined): value is ManualAssignmentRoomLoad {
  return value != null && value.occupied;
}

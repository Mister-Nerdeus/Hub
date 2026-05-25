import type { PlanContract } from "../contracts.js";
import {
  PLAN_1_ID,
  makeStalePathSyncWarning,
  nurseIdsForProfiles,
  roomIdsForPlan,
  type Plan1AssignmentWarning,
  type Plan1ManualAssignmentRecord,
  type Plan1NurseProfile,
  type Plan1RoomLoad
} from "./plan1AssignmentCommon.js";

export type Plan1AssignmentValidationInput = {
  plan: PlanContract | null;
  nurses: Plan1NurseProfile[];
  roomLoads: Plan1RoomLoad[];
  assignments: Plan1ManualAssignmentRecord[];
  stalePathSync: boolean;
};

export type Plan1AssignmentValidationResult = {
  status: "passed" | "warning" | "blocking";
  warnings: Plan1AssignmentWarning[];
};

export function validatePlan1AssignmentsForOperations(
  input: Plan1AssignmentValidationInput
): Plan1AssignmentValidationResult {
  const warnings: Plan1AssignmentWarning[] = [];
  if (input.plan == null) {
    warnings.push(warning("NO_ACTIVE_PLAN_1_FLOORPLAN", "blocking", "Open repaired Plan 1 before validating assignments."));
    return result(warnings);
  }
  if (input.plan.planId !== PLAN_1_ID) {
    warnings.push(warning("NON_PLAN_1_ASSIGNMENT_SCOPE", "blocking", "Assignment workflow is scoped to repaired Plan 1 only."));
    return result(warnings);
  }

  const validRoomIds = roomIdsForPlan(input.plan);
  const validNurseIds = nurseIdsForProfiles(input.nurses);
  const roomLoadById = new Map(input.roomLoads.map((roomLoad) => [roomLoad.roomId, roomLoad]));
  const nurseById = new Map(input.nurses.map((nurse) => [nurse.nurseId, nurse]));
  const primaryByRoom = new Map<string, Plan1ManualAssignmentRecord[]>();
  const assignedPrimaryRoomIds = new Set<string>();
  const occupiedAssignedCountByNurseId = new Map<string, number>();

  for (const assignment of input.assignments) {
    if (!validRoomIds.has(assignment.roomId)) {
      warnings.push(warning("INVALID_ROOM_REFERENCE", "blocking", "Assignment references a room outside repaired Plan 1.", [], [assignment.roomId]));
      continue;
    }
    if (!validNurseIds.has(assignment.nurseId)) {
      warnings.push(warning("INVALID_NURSE_REFERENCE", "blocking", "Assignment references a non-synthetic or missing nurse.", [assignment.nurseId], [assignment.roomId]));
      continue;
    }
    if (assignment.assignmentType === "primary") {
      assignedPrimaryRoomIds.add(assignment.roomId);
      const primaryAssignments = primaryByRoom.get(assignment.roomId) ?? [];
      primaryAssignments.push(assignment);
      primaryByRoom.set(assignment.roomId, primaryAssignments);
      if (roomLoadById.get(assignment.roomId)?.occupied === true) {
        occupiedAssignedCountByNurseId.set(
          assignment.nurseId,
          (occupiedAssignedCountByNurseId.get(assignment.nurseId) ?? 0) + 1
        );
      }
    }
    if (assignment.assignmentType === "primary" && roomLoadById.get(assignment.roomId)?.occupied === false) {
      warnings.push(warning("UNOCCUPIED_ASSIGNED_ROOM", "info", "Primary assignment includes an unoccupied room.", [assignment.nurseId], [assignment.roomId]));
    }
    if (
      assignment.assignmentType === "primary" &&
      roomLoadById.get(assignment.roomId)?.traumaActive === true &&
      nurseById.get(assignment.nurseId)?.traumaQualified !== true
    ) {
      warnings.push(warning("TRAUMA_ROOM_WITH_NON_TRAUMA_QUALIFIED_NURSE", "warning", "Trauma-active room is assigned to a nurse profile without the synthetic trauma-qualified flag.", [assignment.nurseId], [assignment.roomId]));
    }
  }

  for (const [roomId, assignments] of primaryByRoom) {
    if (assignments.length > 1) {
      warnings.push(warning("DUPLICATE_PRIMARY_ASSIGNMENT", "blocking", "A room has more than one primary assignment.", assignments.map((assignment) => assignment.nurseId), [roomId]));
    }
  }

  for (const roomLoad of input.roomLoads) {
    if (!validRoomIds.has(roomLoad.roomId)) {
      warnings.push(warning("INVALID_ROOM_REFERENCE", "blocking", "Room load references a room outside repaired Plan 1.", [], [roomLoad.roomId]));
      continue;
    }
    if (roomLoad.occupied && !assignedPrimaryRoomIds.has(roomLoad.roomId)) {
      warnings.push(warning("OCCUPIED_UNASSIGNED_ROOM", "warning", "Occupied room load has no primary nurse assignment.", [], [roomLoad.roomId]));
    }
  }

  for (const nurse of input.nurses) {
    const occupiedCount = occupiedAssignedCountByNurseId.get(nurse.nurseId) ?? 0;
    if (occupiedCount > nurse.targetPatientCount) {
      warnings.push(warning("NURSE_OVER_TARGET_RATIO", "info", "Nurse profile is above its synthetic target occupied-room count.", [nurse.nurseId]));
    }
    if (occupiedCount > nurse.maxPatientCount) {
      warnings.push(warning("NURSE_OVER_MAX_RATIO", "blocking", "Nurse profile is above its synthetic maximum occupied-room count.", [nurse.nurseId]));
    }
  }

  if (input.stalePathSync) {
    const stale = makeStalePathSyncWarning();
    warnings.push(warning(stale.code, stale.severity, stale.summary));
  }

  return result(warnings);
}

function warning(
  code: Plan1AssignmentWarning["code"],
  severity: Plan1AssignmentWarning["severity"],
  summary: string,
  nurseIds: string[] = [],
  roomIds: string[] = []
): Plan1AssignmentWarning {
  return { code, severity, summary, nurseIds, roomIds };
}

function result(warnings: Plan1AssignmentWarning[]): Plan1AssignmentValidationResult {
  const status = warnings.some((entry) => entry.severity === "blocking")
    ? "blocking"
    : warnings.length > 0
      ? "warning"
      : "passed";
  return { status, warnings };
}

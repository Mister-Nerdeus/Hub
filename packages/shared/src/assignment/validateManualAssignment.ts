import type {
  ManualAssignmentContract,
  ManualAssignmentValidationResult,
  PlanContract,
  RoomLoad,
  Warning
} from "../contracts.js";

type WarningDraft = Omit<Warning, "id">;

export function validateManualAssignment(
  plan: PlanContract,
  roomLoads: RoomLoad[],
  assignmentSet: ManualAssignmentContract
): ManualAssignmentValidationResult {
  const warnings: Warning[] = [];
  const roomIds = new Set(plan.rooms.map((room) => room.id));
  const nurseById = new Map(assignmentSet.nurses.map((nurse) => [nurse.id, nurse]));
  const roomLoadById = new Map(roomLoads.map((roomLoad) => [roomLoad.roomId, roomLoad]));
  const assignedRoomMap = new Map<string, string[]>();
  const validCoverageByRoomId = new Map<string, string>();

  for (const assignment of assignmentSet.assignments) {
    const nurse = nurseById.get(assignment.nurseId);
    if (nurse == null) {
      warnings.push(
        warning({
          severity: "critical",
          code: "UNKNOWN_NURSE",
          message: `Assignment ${assignment.id} references unknown nurse ${assignment.nurseId}.`,
          nurseIds: [assignment.nurseId]
        })
      );
    }

    for (const roomId of assignment.roomIds) {
      const assignedNurseIds = assignedRoomMap.get(roomId) ?? [];
      assignedNurseIds.push(assignment.nurseId);
      assignedRoomMap.set(roomId, assignedNurseIds);

      if (!roomIds.has(roomId)) {
        warnings.push(
          warning({
            severity: "critical",
            code: "UNKNOWN_ROOM",
            message: `Assignment ${assignment.id} references unknown room ${roomId}.`,
            nurseIds: [assignment.nurseId],
            roomIds: [roomId]
          })
        );
        continue;
      }

      if (nurse != null && assignment.assignmentType === "manual") {
        validCoverageByRoomId.set(roomId, assignment.nurseId);
      }
    }
  }

  for (const [roomId, nurseIds] of [...assignedRoomMap.entries()].sort()) {
    if (roomIds.has(roomId) && nurseIds.length > 1) {
      warnings.push(
        warning({
          severity: "critical",
          code: "ROOM_ASSIGNED_MULTIPLE_TIMES",
          message: `Room ${roomId} is assigned to more than one nurse.`,
          nurseIds: sortedUnique(nurseIds),
          roomIds: [roomId]
        })
      );
    }
  }

  const perNurseAssignedOccupiedCounts = Object.fromEntries(
    assignmentSet.nurses.map((nurse) => [nurse.id, 0])
  ) as Record<string, number>;
  const unassignedOccupiedRoomIds: string[] = [];

  for (const roomLoad of roomLoads) {
    if (!roomLoad.occupied) {
      continue;
    }

    const coveredNurseId = validCoverageByRoomId.get(roomLoad.roomId);
    if (coveredNurseId == null) {
      unassignedOccupiedRoomIds.push(roomLoad.roomId);
      const assignedNurseIds = assignedRoomMap.get(roomLoad.roomId) ?? [];
      warnings.push(
        warning({
          severity: assignedNurseIds.length > 0 ? "critical" : "warning",
          code:
            assignedNurseIds.length > 0 ? "ROOM_WITHOUT_COVERAGE" : "UNASSIGNED_OCCUPIED_ROOM",
          message:
            assignedNurseIds.length > 0
              ? `Occupied room ${roomLoad.roomId} has no valid manual coverage.`
              : `Occupied room ${roomLoad.roomId} is unassigned.`,
          nurseIds: assignedNurseIds.length > 0 ? sortedUnique(assignedNurseIds) : undefined,
          roomIds: [roomLoad.roomId]
        })
      );
      continue;
    }

    perNurseAssignedOccupiedCounts[coveredNurseId] =
      (perNurseAssignedOccupiedCounts[coveredNurseId] ?? 0) + 1;
  }

  for (const nurse of assignmentSet.nurses) {
    const occupiedCount = perNurseAssignedOccupiedCounts[nurse.id] ?? 0;
    if (occupiedCount > nurse.targetPatients) {
      warnings.push(
        warning({
          severity: "warning",
          code: "OVER_TARGET_RATIO",
          message: `${nurse.name} is assigned ${occupiedCount} occupied rooms above target ${nurse.targetPatients}.`,
          nurseIds: [nurse.id]
        })
      );
    }
    if (occupiedCount > nurse.maxPatients) {
      warnings.push(
        warning({
          severity: "critical",
          code: "OVER_MAX_RATIO",
          message: `${nurse.name} is assigned ${occupiedCount} occupied rooms above max ${nurse.maxPatients}.`,
          nurseIds: [nurse.id]
        })
      );
    }
  }

  for (const [roomId, nurseId] of [...validCoverageByRoomId.entries()].sort()) {
    const roomLoad = roomLoadById.get(roomId);
    const nurse = nurseById.get(nurseId);
    if (roomLoad?.traumaActive === true && nurse != null && !nurse.traumaQualified) {
      warnings.push(
        warning({
          severity: "warning",
          code: "TRAUMA_WITH_NON_QUALIFIED_NURSE",
          message: `Trauma-active room ${roomId} is assigned to a nurse without trauma qualification.`,
          nurseIds: [nurseId],
          roomIds: [roomId]
        })
      );
    }
  }

  return {
    warnings: warnings.sort(compareWarnings),
    assignedRoomMap: Object.fromEntries(
      [...assignedRoomMap.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([roomId, nurseIds]) => [roomId, [...nurseIds].sort()])
    ),
    unassignedOccupiedRoomIds: unassignedOccupiedRoomIds.sort(),
    perNurseAssignedOccupiedCounts
  };
}

function warning(draft: WarningDraft): Warning {
  const parts = [
    draft.code,
    draft.nurseIds?.join(",") ?? "",
    draft.roomIds?.join(",") ?? "",
    draft.minute?.toString() ?? ""
  ];
  return {
    ...draft,
    id: parts.join(":").replace(/:+$/g, "")
  };
}

function compareWarnings(left: Warning, right: Warning): number {
  return left.id.localeCompare(right.id);
}

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort();
}

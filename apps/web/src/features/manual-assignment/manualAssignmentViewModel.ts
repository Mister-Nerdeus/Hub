import {
  scoreNurseBurden,
  scoreRoomLoad,
  validateManualAssignmentContract,
  validatePlanContract,
  validateRoomLoads,
  type ManualAssignmentContract,
  type PlanContract,
  type RoomLoad,
  type Warning
} from "@nerdeus/shared";

export type ManualAssignmentViewModel = {
  assignmentSetName: string;
  occupiedRoomCount: number;
  assignedOccupiedRoomCount: number;
  unassignedOccupiedRooms: Array<{ roomId: string; label: string; burden: number }>;
  nurseCards: Array<{
    nurseId: string;
    name: string;
    role: string;
    color: string;
    targetPatients: number;
    maxPatients: number;
    assignedRooms: Array<{ roomId: string; label: string; occupied: boolean; burden: number }>;
  }>;
  burdenRows: Array<{
    nurseId: string;
    nurseName: string;
    assignedRoomCount: number;
    occupiedRoomCount: number;
    totalAcuityBurden: number;
    totalSpecialBurden: number;
    overRatioPenalty: number;
    traumaMismatchPenalty: number;
    totalBurden: number;
  }>;
  warnings: Array<Warning & { displayMessage: string }>;
  sameCountDifferentBurdenProof: {
    occupiedRoomCount: number;
    nurseNames: string[];
    burdens: number[];
    visible: boolean;
  };
};

export function createManualAssignmentViewModel(
  planInput: PlanContract,
  roomLoadInput: RoomLoad[],
  assignmentInput: ManualAssignmentContract
): ManualAssignmentViewModel {
  const plan = validatePlanContract(planInput);
  const roomLoads = validateRoomLoads(roomLoadInput, plan);
  const assignmentSet = validateManualAssignmentContract(assignmentInput, plan);
  const burdenResult = scoreNurseBurden(plan, roomLoads, assignmentSet);

  const roomById = new Map(plan.rooms.map((room) => [room.id, room]));
  const roomLoadById = new Map(roomLoads.map((roomLoad) => [roomLoad.roomId, roomLoad]));
  const roomBurdenById = new Map(
    roomLoads.map((roomLoad) => [roomLoad.roomId, scoreRoomLoad(roomLoad).totalRoomBurden])
  );
  const nurseById = new Map(assignmentSet.nurses.map((nurse) => [nurse.id, nurse]));

  const nurseCards = assignmentSet.nurses.map((nurse) => {
    const assignedRoomIds = assignmentSet.assignments
      .filter((assignment) => assignment.nurseId === nurse.id && assignment.assignmentType === "manual")
      .flatMap((assignment) => assignment.roomIds);

    return {
      nurseId: nurse.id,
      name: nurse.name,
      role: nurse.role,
      color: nurse.color,
      targetPatients: nurse.targetPatients,
      maxPatients: nurse.maxPatients,
      assignedRooms: assignedRoomIds.map((roomId) => ({
        roomId,
        label: roomById.get(roomId)?.label ?? roomId,
        occupied: roomLoadById.get(roomId)?.occupied ?? false,
        burden: roomBurdenById.get(roomId) ?? 0
      }))
    };
  });

  const burdenRows = burdenResult.nurseScores.map((score) => ({
    nurseId: score.nurseId,
    nurseName: nurseById.get(score.nurseId)?.name ?? score.nurseId,
    assignedRoomCount: score.assignedRoomCount,
    occupiedRoomCount: score.occupiedRoomCount,
    totalAcuityBurden: score.totalAcuityBurden,
    totalSpecialBurden: score.totalSpecialBurden,
    overRatioPenalty: score.overRatioPenalty,
    traumaMismatchPenalty: score.traumaMismatchPenalty,
    totalBurden: score.totalBurden
  }));

  return {
    assignmentSetName: assignmentSet.name,
    occupiedRoomCount: roomLoads.filter((roomLoad) => roomLoad.occupied).length,
    assignedOccupiedRoomCount: Object.values(
      burdenResult.validation.perNurseAssignedOccupiedCounts
    ).reduce((total, count) => total + count, 0),
    unassignedOccupiedRooms: burdenResult.validation.unassignedOccupiedRoomIds.map((roomId) => ({
      roomId,
      label: roomById.get(roomId)?.label ?? roomId,
      burden: roomBurdenById.get(roomId) ?? 0
    })),
    nurseCards,
    burdenRows,
    warnings: burdenResult.warnings.map((warning) => ({
      ...warning,
      displayMessage: formatWarning(warning, roomById, nurseById)
    })),
    sameCountDifferentBurdenProof: findSameCountDifferentBurdenProof(burdenRows)
  };
}

function formatWarning(
  warning: Warning,
  roomById: Map<string, { label: string }>,
  nurseById: Map<string, { name: string }>
): string {
  const rooms = (warning.roomIds ?? []).map((roomId) => roomById.get(roomId)?.label ?? roomId);
  const nurses = (warning.nurseIds ?? []).map((nurseId) => nurseById.get(nurseId)?.name ?? nurseId);
  const context = [...nurses, ...rooms].join(" / ");
  return context.length > 0 ? `${warning.message} (${context})` : warning.message;
}

function findSameCountDifferentBurdenProof(
  rows: ManualAssignmentViewModel["burdenRows"]
): ManualAssignmentViewModel["sameCountDifferentBurdenProof"] {
  for (const row of rows) {
    const match = rows.find(
      (candidate) =>
        candidate.nurseId !== row.nurseId &&
        candidate.occupiedRoomCount === row.occupiedRoomCount &&
        candidate.totalBurden !== row.totalBurden
    );
    if (match != null) {
      return {
        occupiedRoomCount: row.occupiedRoomCount,
        nurseNames: [row.nurseName, match.nurseName],
        burdens: [row.totalBurden, match.totalBurden],
        visible: true
      };
    }
  }

  return {
    occupiedRoomCount: 0,
    nurseNames: [],
    burdens: [],
    visible: false
  };
}

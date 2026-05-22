import type {
  ManualAssignmentContract,
  NurseBurdenWeights,
  NurseBurdenResult,
  NurseBurdenScore,
  PlanContract,
  RoomLoad,
  RoomWorkloadScore,
  Warning
} from "../contracts.js";
import { validateManualAssignment } from "../assignment/validateManualAssignment.js";
import { scoreRoomLoad } from "./roomWorkloadScore.js";

export const NURSE_BURDEN_PENALTIES = {
  roomSpreadPerAdditionalOccupiedRoom: 2,
  overTargetPerRoom: 5,
  overMaxPerRoom: 10,
  traumaMismatchPerRoom: 8,
  activeTaskMinutesPlaceholder: 0,
  walkingMinutesPlaceholder: 0,
  breakCoveragePenaltyPlaceholder: 0,
  interruptionPenaltyPlaceholder: 0
} as const;

export function scoreNurseBurden(
  plan: PlanContract,
  roomLoads: RoomLoad[],
  assignmentSet: ManualAssignmentContract
): NurseBurdenResult {
  return scoreNurseBurdenWithWeights(
    plan,
    roomLoads,
    assignmentSet,
    NURSE_BURDEN_PENALTIES,
    scoreRoomLoad
  );
}

export function scoreNurseBurdenWithWeights(
  plan: PlanContract,
  roomLoads: RoomLoad[],
  assignmentSet: ManualAssignmentContract,
  weights: NurseBurdenWeights,
  roomScorer: (roomLoad: RoomLoad) => RoomWorkloadScore = scoreRoomLoad
): NurseBurdenResult {
  const validation = validateManualAssignment(plan, roomLoads, assignmentSet);
  const roomLoadById = new Map(roomLoads.map((roomLoad) => [roomLoad.roomId, roomLoad]));
  const roomScoreById = new Map(roomLoads.map((roomLoad) => [roomLoad.roomId, roomScorer(roomLoad)]));
  const warningsByNurseId = new Map<string, Warning[]>();

  for (const warning of validation.warnings) {
    for (const nurseId of warning.nurseIds ?? []) {
      const nurseWarnings = warningsByNurseId.get(nurseId) ?? [];
      nurseWarnings.push(warning);
      warningsByNurseId.set(nurseId, nurseWarnings);
    }
  }

  const nurseScores: NurseBurdenScore[] = assignmentSet.nurses.map((nurse) => {
    const assignedRoomIds = [
      ...new Set(
        assignmentSet.assignments
          .filter((assignment) => assignment.nurseId === nurse.id && assignment.assignmentType === "manual")
          .flatMap((assignment) => assignment.roomIds)
      )
    ].sort();
    const occupiedAssignedRoomIds = assignedRoomIds.filter(
      (roomId) =>
        roomLoadById.get(roomId)?.occupied === true &&
        validation.assignedRoomMap[roomId]?.length === 1 &&
        validation.assignedRoomMap[roomId]?.[0] === nurse.id
    );
    const roomScores = occupiedAssignedRoomIds
      .map((roomId) => roomScoreById.get(roomId))
      .filter((roomScore): roomScore is NonNullable<typeof roomScore> => roomScore != null);

    const totalAcuityBurden = roomScores.reduce(
      (total, roomScore) => total + roomScore.acuityPoints,
      0
    );
    const totalSpecialBurden = roomScores.reduce(
      (total, roomScore) => total + roomScore.totalRoomBurden - roomScore.acuityPoints,
      0
    );
    const occupiedRoomCount = occupiedAssignedRoomIds.length;
    const roomSpreadPenalty =
      occupiedRoomCount > 1
        ? (occupiedRoomCount - 1) * weights.roomSpreadPerAdditionalOccupiedRoom
        : 0;
    const overTargetPenalty =
      Math.max(0, occupiedRoomCount - nurse.targetPatients) * weights.overTargetPerRoom;
    const overMaxPenalty =
      Math.max(0, occupiedRoomCount - nurse.maxPatients) * weights.overMaxPerRoom;
    const traumaMismatchPenalty = occupiedAssignedRoomIds.reduce((total, roomId) => {
      const roomLoad = roomLoadById.get(roomId);
      if (roomLoad?.traumaActive === true && !nurse.traumaQualified) {
        return total + weights.traumaMismatchPerRoom;
      }
      return total;
    }, 0);

    const activeTaskMinutes = weights.activeTaskMinutesPlaceholder;
    const walkingMinutes = weights.walkingMinutesPlaceholder;
    const breakCoveragePenalty = weights.breakCoveragePenaltyPlaceholder;
    const interruptionPenalty = weights.interruptionPenaltyPlaceholder;
    const overRatioPenalty = overTargetPenalty + overMaxPenalty;

    return {
      nurseId: nurse.id,
      assignedRoomCount: assignedRoomIds.length,
      occupiedRoomCount,
      totalAcuityBurden,
      totalSpecialBurden,
      activeTaskMinutes,
      walkingMinutes,
      roomSpreadPenalty,
      overRatioPenalty,
      traumaMismatchPenalty,
      breakCoveragePenalty,
      interruptionPenalty,
      totalBurden:
        totalAcuityBurden +
        totalSpecialBurden +
        activeTaskMinutes +
        walkingMinutes +
        roomSpreadPenalty +
        overRatioPenalty +
        traumaMismatchPenalty +
        breakCoveragePenalty +
        interruptionPenalty,
      warnings: (warningsByNurseId.get(nurse.id) ?? []).sort((left, right) =>
        left.id.localeCompare(right.id)
      )
    };
  });

  return {
    nurseScores,
    warnings: validation.warnings,
    validation
  };
}

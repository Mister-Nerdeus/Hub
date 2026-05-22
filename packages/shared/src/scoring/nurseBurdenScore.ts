import type {
  ManualAssignmentContract,
  NurseBurdenResult,
  NurseBurdenScore,
  PlanContract,
  RoomLoad,
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
  const validation = validateManualAssignment(plan, roomLoads, assignmentSet);
  const roomLoadById = new Map(roomLoads.map((roomLoad) => [roomLoad.roomId, roomLoad]));
  const roomScoreById = new Map(roomLoads.map((roomLoad) => [roomLoad.roomId, scoreRoomLoad(roomLoad)]));
  const warningsByNurseId = new Map<string, Warning[]>();

  for (const warning of validation.warnings) {
    for (const nurseId of warning.nurseIds ?? []) {
      const nurseWarnings = warningsByNurseId.get(nurseId) ?? [];
      nurseWarnings.push(warning);
      warningsByNurseId.set(nurseId, nurseWarnings);
    }
  }

  const nurseScores: NurseBurdenScore[] = assignmentSet.nurses.map((nurse) => {
    const assignedRoomIds = assignmentSet.assignments
      .filter((assignment) => assignment.nurseId === nurse.id && assignment.assignmentType === "manual")
      .flatMap((assignment) => assignment.roomIds);
    const occupiedAssignedRoomIds = assignedRoomIds.filter(
      (roomId) => roomLoadById.get(roomId)?.occupied === true
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
        ? (occupiedRoomCount - 1) * NURSE_BURDEN_PENALTIES.roomSpreadPerAdditionalOccupiedRoom
        : 0;
    const overTargetPenalty =
      Math.max(0, occupiedRoomCount - nurse.targetPatients) *
      NURSE_BURDEN_PENALTIES.overTargetPerRoom;
    const overMaxPenalty =
      Math.max(0, occupiedRoomCount - nurse.maxPatients) * NURSE_BURDEN_PENALTIES.overMaxPerRoom;
    const traumaMismatchPenalty = occupiedAssignedRoomIds.reduce((total, roomId) => {
      const roomLoad = roomLoadById.get(roomId);
      if (roomLoad?.traumaActive === true && !nurse.traumaQualified) {
        return total + NURSE_BURDEN_PENALTIES.traumaMismatchPerRoom;
      }
      return total;
    }, 0);

    const activeTaskMinutes = NURSE_BURDEN_PENALTIES.activeTaskMinutesPlaceholder;
    const walkingMinutes = NURSE_BURDEN_PENALTIES.walkingMinutesPlaceholder;
    const breakCoveragePenalty = NURSE_BURDEN_PENALTIES.breakCoveragePenaltyPlaceholder;
    const interruptionPenalty = NURSE_BURDEN_PENALTIES.interruptionPenaltyPlaceholder;
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

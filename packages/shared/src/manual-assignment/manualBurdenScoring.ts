import type {
  ManualAssignmentNurse,
  ManualAssignmentRoomLoad,
  ManualNurseBurdenScore,
  ManualRoomAssignment
} from "./manualAssignmentContracts.js";
import type { ManualNurseWalkingBurdenSummary } from "./walkingBurden.js";
import { manualBurdenWeightRegister } from "./manualBurdenWeights.js";

export type CalculateManualBurdenScoresInput = {
  nurses: ManualAssignmentNurse[];
  roomLoads: ManualAssignmentRoomLoad[];
  assignments: ManualRoomAssignment[];
  walkingSummaries?: ManualNurseWalkingBurdenSummary[];
};

export function calculateManualBurdenScores(input: CalculateManualBurdenScoresInput): ManualNurseBurdenScore[] {
  const roomsById = new Map(input.roomLoads.map((roomLoad) => [roomLoad.roomId, roomLoad]));
  const walkingByNurse = new Map((input.walkingSummaries ?? []).map((summary) => [summary.nurseId, summary]));
  const assignmentsByNurse = new Map<string, ManualRoomAssignment[]>();
  for (const nurse of input.nurses) assignmentsByNurse.set(nurse.nurseId, []);
  for (const assignment of input.assignments) {
    assignmentsByNurse.get(assignment.nurseId)?.push(assignment);
  }

  return input.nurses.map((nurse) => {
    const assignments = [...(assignmentsByNurse.get(nurse.nurseId) ?? [])].sort((left, right) =>
      left.roomId.localeCompare(right.roomId)
    );
    const assignedRoomLoads = assignments.map((assignment) => roomsById.get(assignment.roomId)).filter(isRoomLoad);
    const occupiedRoomLoads = assignedRoomLoads.filter((roomLoad) => roomLoad.occupied);
    const acuityBurden = occupiedRoomLoads.reduce((total, roomLoad) => total + manualBurdenWeightRegister.acuity[roomLoad.acuity], 0);
    const traumaBurden = occupiedRoomLoads.reduce((total, roomLoad) => total + (roomLoad.traumaActive ? manualBurdenWeightRegister.traumaActive : 0), 0);
    const specialBurden = occupiedRoomLoads.reduce((total, roomLoad) => total + scoreSpecialBurden(roomLoad), 0);
    const walkingSummary = walkingByNurse.get(nurse.nurseId);
    const walkingBurden = walkingSummary?.estimatedWalkingBurdenUnits ?? 0;
    const roomSpreadPenalty = walkingSummary?.clusterSpreadBurden ?? 0;
    const overTargetCount = Math.max(0, occupiedRoomLoads.length - nurse.targetPatientCount);
    const overMaxCount = Math.max(0, occupiedRoomLoads.length - nurse.maxPatientCount);
    const overRatioPenalty = overTargetCount * manualBurdenWeightRegister.overTargetRoom + overMaxCount * manualBurdenWeightRegister.overMaxRoom;
    const totalBurden = acuityBurden + traumaBurden + specialBurden + walkingBurden + roomSpreadPenalty + overRatioPenalty;

    return {
      nurseId: nurse.nurseId,
      assignedRoomCount: assignedRoomLoads.length,
      occupiedRoomCount: occupiedRoomLoads.length,
      acuityBurden,
      traumaBurden,
      specialBurden,
      walkingBurden,
      roomSpreadPenalty,
      overRatioPenalty,
      totalBurden,
      visibleComponents: [
        `assigned room count ${assignedRoomLoads.length}`,
        `occupied room count ${occupiedRoomLoads.length}`,
        `acuity burden ${acuityBurden}`,
        `trauma burden ${traumaBurden}`,
        `special burden ${specialBurden}`,
        `walking burden ${walkingBurden}`,
        `room spread penalty ${roomSpreadPenalty}`,
        `over ratio penalty ${overRatioPenalty}`
      ],
      syntheticDataOnly: true
    };
  });
}

export function scoreSpecialBurden(roomLoad: ManualAssignmentRoomLoad): number {
  if (!roomLoad.occupied) return 0;
  return [
    roomLoad.isolationActive ? manualBurdenWeightRegister.isolationActive : 0,
    roomLoad.behavioralRisk ? manualBurdenWeightRegister.behavioralRisk : 0,
    roomLoad.fallRisk ? manualBurdenWeightRegister.fallRisk : 0,
    roomLoad.sitterRequired ? manualBurdenWeightRegister.sitterRequired : 0,
    roomLoad.medicationFrequency === "high" ? manualBurdenWeightRegister.highMedicationFrequency : 0,
    roomLoad.monitoringFrequency === "high" ? manualBurdenWeightRegister.highMonitoringFrequency : 0,
    roomLoad.procedureBurden === "high" ? manualBurdenWeightRegister.highProcedureBurden : 0
  ].reduce((total, value) => total + value, 0);
}

function isRoomLoad(value: ManualAssignmentRoomLoad | undefined): value is ManualAssignmentRoomLoad {
  return value != null;
}

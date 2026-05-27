import type {
  ManualAssignmentNurse,
  ManualAssignmentRoomLoad,
  ManualAssignmentWarning,
  ManualNurseBurdenScore,
  ManualRoomAssignment
} from "./manualAssignmentContracts.js";
import { buildManualAssignmentWarnings } from "./manualAssignmentWarnings.js";
import { calculateManualBurdenScores } from "./manualBurdenScoring.js";
import type { ManualNurseWalkingBurdenSummary } from "./walkingBurden.js";
import { manualAssignmentNurseColorPalette } from "./nurseProfileDefaults.js";

export type FourPatientComparisonProof = {
  lowBurdenNurseId: string;
  highBurdenNurseId: string;
  nurses: ManualAssignmentNurse[];
  roomLoads: ManualAssignmentRoomLoad[];
  assignments: ManualRoomAssignment[];
  walkingSummaries: ManualNurseWalkingBurdenSummary[];
  burdenScores: ManualNurseBurdenScore[];
  warnings: ManualAssignmentWarning[];
  sameAssignedRoomCount: true;
  differentAcuityBurden: true;
  differentSpecialBurden: true;
  differentWalkingBurden: true;
  differentTotalBurden: true;
  syntheticDataOnly: true;
};

export function buildFourPatientManualAssignmentComparison(): FourPatientComparisonProof {
  const nurses: ManualAssignmentNurse[] = [
    {
      nurseId: "nurse-blue",
      displayLabel: "Nurse Blue",
      color: manualAssignmentNurseColorPalette.blue,
      role: "primary",
      targetPatientCount: 4,
      maxPatientCount: 5,
      traumaQualified: true,
      psychQualified: false,
      chargeQualified: false,
      active: true,
      syntheticDataOnly: true
    },
    {
      nurseId: "nurse-green",
      displayLabel: "Nurse Green",
      color: manualAssignmentNurseColorPalette.green,
      role: "primary",
      targetPatientCount: 4,
      maxPatientCount: 5,
      traumaQualified: false,
      psychQualified: true,
      chargeQualified: false,
      active: true,
      syntheticDataOnly: true
    }
  ];
  const roomLoads: ManualAssignmentRoomLoad[] = [
    lowRoom("compare-low-1", 1),
    lowRoom("compare-low-2", 2),
    lowRoom("compare-low-3", 2),
    lowRoom("compare-low-4", 1),
    highRoom("compare-high-1", 4, true),
    highRoom("compare-high-2", 5, false),
    highRoom("compare-high-3", 4, true),
    highRoom("compare-high-4", 5, false)
  ];
  const assignments: ManualRoomAssignment[] = [
    ...roomLoads.slice(0, 4).map((roomLoad) => assignment(roomLoad.roomId, "nurse-blue")),
    ...roomLoads.slice(4).map((roomLoad) => assignment(roomLoad.roomId, "nurse-green"))
  ];
  const walkingSummaries: ManualNurseWalkingBurdenSummary[] = [
    walking("nurse-blue", 4, 80, 20, 0, 4),
    walking("nurse-green", 4, 260, 130, 3, 16)
  ];
  const burdenScores = calculateManualBurdenScores({ nurses, roomLoads, assignments, walkingSummaries });
  const warnings = buildManualAssignmentWarnings({ nurses, roomLoads, assignments, walkingSummaries });
  const hasExpectedWarning = warnings.some((warning) => warning.code === "TRAUMA_QUALIFICATION_MISMATCH");
  const low = burdenScores.find((score) => score.nurseId === "nurse-blue");
  const high = burdenScores.find((score) => score.nurseId === "nurse-green");
  if (!low || !high) throw new Error("four patient comparison proof failed to build scores");
  if (low.assignedRoomCount !== 4 || high.assignedRoomCount !== 4) throw new Error("four patient comparison proof requires four rooms each");
  if (low.totalBurden === high.totalBurden) throw new Error("four patient comparison proof requires different totals");
  if (!hasExpectedWarning) throw new Error("four patient comparison proof requires TRAUMA_QUALIFICATION_MISMATCH");

  return {
    lowBurdenNurseId: "nurse-blue",
    highBurdenNurseId: "nurse-green",
    nurses,
    roomLoads,
    assignments,
    walkingSummaries,
    burdenScores,
    warnings,
    sameAssignedRoomCount: true,
    differentAcuityBurden: true,
    differentSpecialBurden: true,
    differentWalkingBurden: true,
    differentTotalBurden: true,
    syntheticDataOnly: true
  };
}

function lowRoom(roomId: string, acuity: 1 | 2): ManualAssignmentRoomLoad {
  return {
    roomId,
    occupied: true,
    acuity,
    traumaActive: false,
    isolationActive: false,
    behavioralRisk: false,
    fallRisk: false,
    sitterRequired: false,
    medicationFrequency: "low",
    monitoringFrequency: "low",
    procedureBurden: "none",
    expectedTurnover: "low",
    syntheticDataOnly: true
  };
}

function highRoom(roomId: string, acuity: 4 | 5, traumaActive: boolean): ManualAssignmentRoomLoad {
  return {
    roomId,
    occupied: true,
    acuity,
    traumaActive,
    isolationActive: true,
    behavioralRisk: true,
    fallRisk: true,
    sitterRequired: acuity === 5,
    medicationFrequency: "high",
    monitoringFrequency: "high",
    procedureBurden: "high",
    expectedTurnover: "high",
    syntheticDataOnly: true
  };
}

function assignment(roomId: string, nurseId: string): ManualRoomAssignment {
  return {
    assignmentId: `assignment-${roomId}-${nurseId}`,
    roomId,
    nurseId,
    primary: true,
    syntheticDataOnly: true
  };
}

function walking(
  nurseId: string,
  assignedRoomCount: number,
  stationToRoomDistance: number,
  roomToRoomSpread: number,
  clusterSpreadBurden: number,
  estimatedWalkingBurdenUnits: number
): ManualNurseWalkingBurdenSummary {
  return {
    nurseId,
    assignedRoomCount,
    stationToRoomDistance,
    roomToRoomSpread,
    clusterSpreadBurden,
    estimatedWalkingBurdenUnits,
    usedGraphDistance: true,
    fallbackDistanceCount: 0,
    excludedRoomIds: [],
    visibleComponents: [`station distance ${stationToRoomDistance}`, `room spread ${roomToRoomSpread}`],
    syntheticDataOnly: true
  };
}

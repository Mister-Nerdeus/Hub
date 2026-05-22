import type {
  BurdenLevel,
  RoomLoad,
  RoomWorkloadScore,
  RoomWorkloadWeights,
  TaskFrequency
} from "../contracts.js";

export const ROOM_WORKLOAD_WEIGHTS = {
  acuity: {
    1: 1,
    2: 2,
    3: 4,
    4: 7,
    5: 10
  },
  traumaActive: 8,
  isolationActive: 3,
  behavioralRisk: 4,
  fallRisk: 2,
  sitterRequired: 5,
  highMedicationFrequency: 3,
  highMonitoringFrequency: 3,
  highProcedureBurden: 4
} as const;

export function scoreRoomLoad(roomLoad: RoomLoad): RoomWorkloadScore {
  return scoreRoomLoadWithWeights(roomLoad, ROOM_WORKLOAD_WEIGHTS);
}

export function scoreRoomLoadWithWeights(
  roomLoad: RoomLoad,
  weights: RoomWorkloadWeights
): RoomWorkloadScore {
  if (!roomLoad.occupied) {
    return zeroRoomWorkloadScore(roomLoad.roomId);
  }

  const acuityPoints = weights.acuity[String(roomLoad.acuity) as keyof RoomWorkloadWeights["acuity"]];
  const traumaPoints = roomLoad.traumaActive ? weights.traumaActive : 0;
  const isolationPoints = roomLoad.isolationActive ? weights.isolationActive : 0;
  const behavioralPoints = roomLoad.behavioralRisk ? weights.behavioralRisk : 0;
  const fallRiskPoints = roomLoad.fallRisk ? weights.fallRisk : 0;
  const sitterPoints = roomLoad.sitterRequired ? weights.sitterRequired : 0;
  const medicationPoints = isHighFrequency(roomLoad.medicationFrequency)
    ? weights.highMedicationFrequency
    : 0;
  const monitoringPoints = isHighFrequency(roomLoad.monitoringFrequency)
    ? weights.highMonitoringFrequency
    : 0;
  const procedurePoints = isHighBurden(roomLoad.procedureBurden)
    ? weights.highProcedureBurden
    : 0;

  return {
    roomId: roomLoad.roomId,
    acuityPoints,
    traumaPoints,
    isolationPoints,
    behavioralPoints,
    fallRiskPoints,
    sitterPoints,
    medicationPoints,
    monitoringPoints,
    procedurePoints,
    totalRoomBurden:
      acuityPoints +
      traumaPoints +
      isolationPoints +
      behavioralPoints +
      fallRiskPoints +
      sitterPoints +
      medicationPoints +
      monitoringPoints +
      procedurePoints
  };
}

function zeroRoomWorkloadScore(roomId: string): RoomWorkloadScore {
  return {
    roomId,
    acuityPoints: 0,
    traumaPoints: 0,
    isolationPoints: 0,
    behavioralPoints: 0,
    fallRiskPoints: 0,
    sitterPoints: 0,
    medicationPoints: 0,
    monitoringPoints: 0,
    procedurePoints: 0,
    totalRoomBurden: 0
  };
}

function isHighFrequency(value: TaskFrequency): boolean {
  return value === "high" || value === "continuous";
}

function isHighBurden(value: BurdenLevel): boolean {
  return value === "high" || value === "very_high";
}

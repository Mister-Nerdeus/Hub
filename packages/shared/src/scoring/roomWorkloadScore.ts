import type { BurdenLevel, RoomLoad, RoomWorkloadScore, TaskFrequency } from "../contracts.js";

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
  if (!roomLoad.occupied) {
    return zeroRoomWorkloadScore(roomLoad.roomId);
  }

  const acuityPoints = ROOM_WORKLOAD_WEIGHTS.acuity[roomLoad.acuity];
  const traumaPoints = roomLoad.traumaActive ? ROOM_WORKLOAD_WEIGHTS.traumaActive : 0;
  const isolationPoints = roomLoad.isolationActive ? ROOM_WORKLOAD_WEIGHTS.isolationActive : 0;
  const behavioralPoints = roomLoad.behavioralRisk ? ROOM_WORKLOAD_WEIGHTS.behavioralRisk : 0;
  const fallRiskPoints = roomLoad.fallRisk ? ROOM_WORKLOAD_WEIGHTS.fallRisk : 0;
  const sitterPoints = roomLoad.sitterRequired ? ROOM_WORKLOAD_WEIGHTS.sitterRequired : 0;
  const medicationPoints = isHighFrequency(roomLoad.medicationFrequency)
    ? ROOM_WORKLOAD_WEIGHTS.highMedicationFrequency
    : 0;
  const monitoringPoints = isHighFrequency(roomLoad.monitoringFrequency)
    ? ROOM_WORKLOAD_WEIGHTS.highMonitoringFrequency
    : 0;
  const procedurePoints = isHighBurden(roomLoad.procedureBurden)
    ? ROOM_WORKLOAD_WEIGHTS.highProcedureBurden
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

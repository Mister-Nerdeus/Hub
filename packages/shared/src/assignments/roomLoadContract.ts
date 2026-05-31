export const ROOM_LOAD_ACUITY_LEVELS = [1, 2, 3, 4, 5] as const;
export const ROOM_LOAD_FREQUENCY_LEVELS = ["none", "low", "medium", "high", "continuous"] as const;
export const ROOM_LOAD_PROCEDURE_BURDEN_LEVELS = ["none", "low", "medium", "high", "very_high"] as const;
export const ROOM_LOAD_TURNOVER_LEVELS = ["low", "normal", "high", "surge"] as const;

export type RoomLoadAcuityLevel = (typeof ROOM_LOAD_ACUITY_LEVELS)[number];
export type RoomLoadFrequencyLevel = (typeof ROOM_LOAD_FREQUENCY_LEVELS)[number];
export type RoomLoadProcedureBurdenLevel = (typeof ROOM_LOAD_PROCEDURE_BURDEN_LEVELS)[number];
export type RoomLoadTurnoverLevel = (typeof ROOM_LOAD_TURNOVER_LEVELS)[number];

export type RoomLoadContract = {
  schemaVersion: "1.0.0";
  roomId: string;
  occupied: boolean;
  acuity: RoomLoadAcuityLevel;
  traumaActive: boolean;
  isolationActive: boolean;
  behavioralRisk: boolean;
  fallRisk: boolean;
  sitterRequired: boolean;
  medicationFrequency: RoomLoadFrequencyLevel;
  monitoringFrequency: RoomLoadFrequencyLevel;
  procedureBurden: RoomLoadProcedureBurdenLevel;
  expectedTurnover: RoomLoadTurnoverLevel;
};

export const ER_ACTIVITY_PRESET_SCHEMA_VERSION = "1.0.0" as const;
export const ER_ACTIVITY_PRESET_IDS = [
  "steady",
  "busy",
  "surge",
  "trauma_spike",
  "boarding_pressure"
] as const;
export const ER_ACTIVITY_PRESSURE_LEVELS = ["low", "medium", "high", "very_high"] as const;
export const ER_ACTIVITY_NON_CLAIM_COPY =
  "Operational activity preset only; no clinical prediction." as const;

export type ErActivityPresetId = (typeof ER_ACTIVITY_PRESET_IDS)[number];
export type ErActivityPressureLevel = (typeof ER_ACTIVITY_PRESSURE_LEVELS)[number];

export type ErActivityPresetContract = {
  schemaVersion: typeof ER_ACTIVITY_PRESET_SCHEMA_VERSION;
  presetId: ErActivityPresetId;
  label: string;
  arrivalPressureLevel: ErActivityPressureLevel;
  turnoverPressureLevel: ErActivityPressureLevel;
  traumaFrequencyLevel: ErActivityPressureLevel;
  boardingPressureLevel: ErActivityPressureLevel;
  hallwayPressureLevel: ErActivityPressureLevel;
  nonClaimCopy: typeof ER_ACTIVITY_NON_CLAIM_COPY;
  syntheticDataOnly: true;
};

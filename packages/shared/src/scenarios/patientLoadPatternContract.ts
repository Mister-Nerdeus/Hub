import type { ErActivityPressureLevel } from "./erActivityPresetContract.js";

export const PATIENT_LOAD_PATTERN_SCHEMA_VERSION = "1.0.0" as const;
export const PATIENT_LOAD_PATTERN_IDS = [
  "low_load",
  "typical_load",
  "high_load",
  "overwhelmed_load"
] as const;

export type PatientLoadPatternId = (typeof PATIENT_LOAD_PATTERN_IDS)[number];

export type PatientLoadPatternContract = {
  schemaVersion: typeof PATIENT_LOAD_PATTERN_SCHEMA_VERSION;
  patientLoadPatternId: PatientLoadPatternId;
  label: string;
  occupiedRoomCount: number;
  hallwayPressureLevel: ErActivityPressureLevel;
  syntheticDataOnly: true;
};

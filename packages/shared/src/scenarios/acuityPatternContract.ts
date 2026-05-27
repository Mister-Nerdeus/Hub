import type { ErActivityPressureLevel } from "./erActivityPresetContract.js";

export const ACUITY_PATTERN_SCHEMA_VERSION = "1.0.0" as const;
export const ACUITY_PATTERN_IDS = [
  "low_load_acuity",
  "typical_load_acuity",
  "high_load_acuity",
  "overwhelmed_load_acuity"
] as const;

export type AcuityPatternId = (typeof ACUITY_PATTERN_IDS)[number];

export type AcuityPatternContract = {
  schemaVersion: typeof ACUITY_PATTERN_SCHEMA_VERSION;
  acuityPatternId: AcuityPatternId;
  label: string;
  lowAcuityShare: number;
  mediumAcuityShare: number;
  highAcuityShare: number;
  traumaActiveCountRange: {
    min: number;
    max: number;
  };
  isolationBurdenLevel: ErActivityPressureLevel;
  behavioralBurdenLevel: ErActivityPressureLevel;
  sitterBurdenLevel: ErActivityPressureLevel;
  syntheticDataOnly: true;
};

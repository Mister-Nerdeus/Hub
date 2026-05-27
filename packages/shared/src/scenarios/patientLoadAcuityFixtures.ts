import type { AcuityPatternContract } from "./acuityPatternContract.js";
import type { PatientLoadPatternContract } from "./patientLoadPatternContract.js";

export type PatientLoadAcuityPreset = {
  presetId: "low_load" | "typical_load" | "high_load" | "overwhelmed_load";
  patientLoadPattern: PatientLoadPatternContract;
  acuityPattern: AcuityPatternContract;
};

export const lowLoadPatientLoadPattern: PatientLoadPatternContract = {
  schemaVersion: "1.0.0",
  patientLoadPatternId: "low_load",
  label: "Low load",
  occupiedRoomCount: 12,
  hallwayPressureLevel: "low",
  syntheticDataOnly: true
};

export const typicalLoadPatientLoadPattern: PatientLoadPatternContract = {
  schemaVersion: "1.0.0",
  patientLoadPatternId: "typical_load",
  label: "Typical load",
  occupiedRoomCount: 18,
  hallwayPressureLevel: "medium",
  syntheticDataOnly: true
};

export const highLoadPatientLoadPattern: PatientLoadPatternContract = {
  schemaVersion: "1.0.0",
  patientLoadPatternId: "high_load",
  label: "High load",
  occupiedRoomCount: 22,
  hallwayPressureLevel: "high",
  syntheticDataOnly: true
};

export const overwhelmedLoadPatientLoadPattern: PatientLoadPatternContract = {
  schemaVersion: "1.0.0",
  patientLoadPatternId: "overwhelmed_load",
  label: "Overwhelmed load",
  occupiedRoomCount: 23,
  hallwayPressureLevel: "very_high",
  syntheticDataOnly: true
};

export const lowLoadAcuityPattern: AcuityPatternContract = {
  schemaVersion: "1.0.0",
  acuityPatternId: "low_load_acuity",
  label: "Lower acuity distribution",
  lowAcuityShare: 55,
  mediumAcuityShare: 35,
  highAcuityShare: 10,
  traumaActiveCountRange: { min: 0, max: 1 },
  isolationBurdenLevel: "low",
  behavioralBurdenLevel: "low",
  sitterBurdenLevel: "low",
  syntheticDataOnly: true
};

export const typicalLoadAcuityPattern: AcuityPatternContract = {
  schemaVersion: "1.0.0",
  acuityPatternId: "typical_load_acuity",
  label: "Typical acuity distribution",
  lowAcuityShare: 30,
  mediumAcuityShare: 50,
  highAcuityShare: 20,
  traumaActiveCountRange: { min: 1, max: 2 },
  isolationBurdenLevel: "medium",
  behavioralBurdenLevel: "medium",
  sitterBurdenLevel: "medium",
  syntheticDataOnly: true
};

export const highLoadAcuityPattern: AcuityPatternContract = {
  schemaVersion: "1.0.0",
  acuityPatternId: "high_load_acuity",
  label: "High load acuity distribution",
  lowAcuityShare: 20,
  mediumAcuityShare: 45,
  highAcuityShare: 35,
  traumaActiveCountRange: { min: 2, max: 3 },
  isolationBurdenLevel: "high",
  behavioralBurdenLevel: "high",
  sitterBurdenLevel: "medium",
  syntheticDataOnly: true
};

export const overwhelmedLoadAcuityPattern: AcuityPatternContract = {
  schemaVersion: "1.0.0",
  acuityPatternId: "overwhelmed_load_acuity",
  label: "Overwhelmed acuity distribution",
  lowAcuityShare: 10,
  mediumAcuityShare: 45,
  highAcuityShare: 45,
  traumaActiveCountRange: { min: 3, max: 4 },
  isolationBurdenLevel: "very_high",
  behavioralBurdenLevel: "high",
  sitterBurdenLevel: "high",
  syntheticDataOnly: true
};

export const patientLoadAcuityPresets: readonly PatientLoadAcuityPreset[] = [
  {
    presetId: "low_load",
    patientLoadPattern: lowLoadPatientLoadPattern,
    acuityPattern: lowLoadAcuityPattern
  },
  {
    presetId: "typical_load",
    patientLoadPattern: typicalLoadPatientLoadPattern,
    acuityPattern: typicalLoadAcuityPattern
  },
  {
    presetId: "high_load",
    patientLoadPattern: highLoadPatientLoadPattern,
    acuityPattern: highLoadAcuityPattern
  },
  {
    presetId: "overwhelmed_load",
    patientLoadPattern: overwhelmedLoadPatientLoadPattern,
    acuityPattern: overwhelmedLoadAcuityPattern
  }
] as const;

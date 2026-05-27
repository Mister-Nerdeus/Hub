import {
  ER_ACTIVITY_NON_CLAIM_COPY,
  ER_ACTIVITY_PRESET_SCHEMA_VERSION,
  type ErActivityPresetContract
} from "./erActivityPresetContract.js";

export const steadyErActivityPreset: ErActivityPresetContract = {
  schemaVersion: ER_ACTIVITY_PRESET_SCHEMA_VERSION,
  presetId: "steady",
  label: "Steady",
  arrivalPressureLevel: "low",
  turnoverPressureLevel: "medium",
  traumaFrequencyLevel: "low",
  boardingPressureLevel: "low",
  hallwayPressureLevel: "low",
  nonClaimCopy: ER_ACTIVITY_NON_CLAIM_COPY,
  syntheticDataOnly: true
};

export const busyErActivityPreset: ErActivityPresetContract = {
  schemaVersion: ER_ACTIVITY_PRESET_SCHEMA_VERSION,
  presetId: "busy",
  label: "Busy",
  arrivalPressureLevel: "medium",
  turnoverPressureLevel: "medium",
  traumaFrequencyLevel: "medium",
  boardingPressureLevel: "medium",
  hallwayPressureLevel: "medium",
  nonClaimCopy: ER_ACTIVITY_NON_CLAIM_COPY,
  syntheticDataOnly: true
};

export const surgeErActivityPreset: ErActivityPresetContract = {
  schemaVersion: ER_ACTIVITY_PRESET_SCHEMA_VERSION,
  presetId: "surge",
  label: "Surge",
  arrivalPressureLevel: "very_high",
  turnoverPressureLevel: "high",
  traumaFrequencyLevel: "medium",
  boardingPressureLevel: "high",
  hallwayPressureLevel: "high",
  nonClaimCopy: ER_ACTIVITY_NON_CLAIM_COPY,
  syntheticDataOnly: true
};

export const traumaSpikeErActivityPreset: ErActivityPresetContract = {
  schemaVersion: ER_ACTIVITY_PRESET_SCHEMA_VERSION,
  presetId: "trauma_spike",
  label: "Trauma spike",
  arrivalPressureLevel: "high",
  turnoverPressureLevel: "medium",
  traumaFrequencyLevel: "very_high",
  boardingPressureLevel: "medium",
  hallwayPressureLevel: "medium",
  nonClaimCopy: ER_ACTIVITY_NON_CLAIM_COPY,
  syntheticDataOnly: true
};

export const boardingPressureErActivityPreset: ErActivityPresetContract = {
  schemaVersion: ER_ACTIVITY_PRESET_SCHEMA_VERSION,
  presetId: "boarding_pressure",
  label: "Boarding pressure",
  arrivalPressureLevel: "medium",
  turnoverPressureLevel: "high",
  traumaFrequencyLevel: "low",
  boardingPressureLevel: "very_high",
  hallwayPressureLevel: "high",
  nonClaimCopy: ER_ACTIVITY_NON_CLAIM_COPY,
  syntheticDataOnly: true
};

export const erActivityPresetFixtures = [
  steadyErActivityPreset,
  busyErActivityPreset,
  surgeErActivityPreset,
  traumaSpikeErActivityPreset,
  boardingPressureErActivityPreset
] as const;

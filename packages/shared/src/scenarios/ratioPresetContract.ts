import { CANONICAL_SCENARIO_FLOORPLAN_ID, CANONICAL_SCENARIO_SEED_ID } from "./canonicalScenarioSeedContract.js";

export const RATIO_PRESET_SCHEMA_VERSION = "1.0.0" as const;
export const RATIO_PRESET_IDS = ["four_to_one", "three_to_one"] as const;
export type RatioPresetId = (typeof RATIO_PRESET_IDS)[number];

export type RatioPresetContract = {
  schemaVersion: typeof RATIO_PRESET_SCHEMA_VERSION;
  presetId: RatioPresetId;
  label: "4:1" | "3:1";
  patientsPerNurse: 4 | 3;
  sourceNote: "synthetic planning assumption";
  canonicalScenarioSeedId: typeof CANONICAL_SCENARIO_SEED_ID;
  canonicalFloorplanId: typeof CANONICAL_SCENARIO_FLOORPLAN_ID;
  capacityReportReference: "docs/verification/canonical-capacity-count-report.json";
  usesRatioEligibleBedPositions: true;
  excludesNonPatientSpaces: true;
  usesRawRoomCount: false;
  complianceClaim: false;
  clinicalSafetyClaim: false;
  fullShiftSimulationStatus: "not_started";
  optimizerStatus: "not_started";
  syntheticDataOnly: true;
};

export const fourToOneRatioPreset: RatioPresetContract = {
  schemaVersion: RATIO_PRESET_SCHEMA_VERSION,
  presetId: "four_to_one",
  label: "4:1",
  patientsPerNurse: 4,
  sourceNote: "synthetic planning assumption",
  canonicalScenarioSeedId: CANONICAL_SCENARIO_SEED_ID,
  canonicalFloorplanId: CANONICAL_SCENARIO_FLOORPLAN_ID,
  capacityReportReference: "docs/verification/canonical-capacity-count-report.json",
  usesRatioEligibleBedPositions: true,
  excludesNonPatientSpaces: true,
  usesRawRoomCount: false,
  complianceClaim: false,
  clinicalSafetyClaim: false,
  fullShiftSimulationStatus: "not_started",
  optimizerStatus: "not_started",
  syntheticDataOnly: true
};

export const threeToOneRatioPreset: RatioPresetContract = {
  ...fourToOneRatioPreset,
  presetId: "three_to_one",
  label: "3:1",
  patientsPerNurse: 3
};

export const ratioPresetContracts = [fourToOneRatioPreset, threeToOneRatioPreset] as const;


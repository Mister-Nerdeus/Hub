import type { CanonicalCapacityCountReport } from "../floorplans/canonicalCapacityCountReport.js";
import { CANONICAL_SCENARIO_FLOORPLAN_ID, CANONICAL_SCENARIO_SEED_ID } from "./canonicalScenarioSeedContract.js";
import {
  RATIO_PRESET_SCHEMA_VERSION,
  type RatioPresetContract,
  type RatioPresetId
} from "./ratioPresetContract.js";

const expectedPatientsPerNurse: Record<RatioPresetId, 4 | 3> = {
  four_to_one: 4,
  three_to_one: 3
};

export function validateRatioPresetContract(
  preset: RatioPresetContract,
  capacityReport: CanonicalCapacityCountReport
): RatioPresetContract {
  if (preset.schemaVersion !== RATIO_PRESET_SCHEMA_VERSION) {
    throw new Error("ratio preset schema version is unsupported");
  }
  if (preset.canonicalScenarioSeedId !== CANONICAL_SCENARIO_SEED_ID) {
    throw new Error("ratio preset must reference the canonical scenario seed");
  }
  if (preset.canonicalFloorplanId !== CANONICAL_SCENARIO_FLOORPLAN_ID || capacityReport.canonicalFloorplanId !== CANONICAL_SCENARIO_FLOORPLAN_ID) {
    throw new Error("ratio preset must use canonical Plan 1");
  }
  if (preset.patientsPerNurse !== expectedPatientsPerNurse[preset.presetId] || preset.patientsPerNurse <= 0) {
    throw new Error("ratio preset patientsPerNurse does not match the declared preset");
  }
  if (!preset.usesRatioEligibleBedPositions || !preset.excludesNonPatientSpaces || preset.usesRawRoomCount) {
    throw new Error("ratio preset must use selector-driven eligible bed positions and exclude non-patient spaces");
  }
  if (capacityReport.source !== "semantic_selectors" || capacityReport.ratioEligibleCount <= 0) {
    throw new Error("ratio preset requires selector-driven ratio-eligible capacity counts");
  }
  if (preset.complianceClaim || preset.clinicalSafetyClaim) {
    throw new Error("ratio preset must not make compliance or clinical-safety claims");
  }
  if (preset.fullShiftSimulationStatus !== "not_started" || preset.optimizerStatus !== "not_started") {
    throw new Error("ratio preset must not start simulation or optimizer behavior");
  }
  return preset;
}

export function validateRatioPresetPair(
  fourToOne: RatioPresetContract,
  threeToOne: RatioPresetContract,
  capacityReport: CanonicalCapacityCountReport
): [RatioPresetContract, RatioPresetContract] {
  const validatedFourToOne = validateRatioPresetContract(fourToOne, capacityReport);
  const validatedThreeToOne = validateRatioPresetContract(threeToOne, capacityReport);
  if (validatedFourToOne.presetId !== "four_to_one" || validatedThreeToOne.presetId !== "three_to_one") {
    throw new Error("ratio preset pair must contain 4:1 and 3:1 presets");
  }
  if (
    validatedFourToOne.canonicalScenarioSeedId !== validatedThreeToOne.canonicalScenarioSeedId ||
    validatedFourToOne.capacityReportReference !== validatedThreeToOne.capacityReportReference
  ) {
    throw new Error("ratio preset pair must share canonical seed and capacity report assumptions");
  }
  return [validatedFourToOne, validatedThreeToOne];
}


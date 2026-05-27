import { ACUITY_PATTERN_IDS } from "./acuityPatternContract.js";
import { ER_ACTIVITY_PRESET_IDS } from "./erActivityPresetContract.js";
import { NURSE_RATIO_IDS } from "./nurseRatioContract.js";
import { OUTCOME_PLACEHOLDER_SET_ID } from "./outcomeMetricPlaceholderContract.js";
import { PATIENT_LOAD_PATTERN_IDS } from "./patientLoadPatternContract.js";
import {
  CANONICAL_ER_POD_FLOORPLAN_ID,
  SCENARIO_SEED_SCHEMA_VERSION,
  type ScenarioSeedContract
} from "./scenarioSeedContract.js";
import {
  requireScenarioEnum,
  requireScenarioExactKeys,
  requireScenarioLiteralTrue,
  requireScenarioRecord,
  requireScenarioString
} from "./scenarioValidationUtils.js";

const scenarioSeedKeys = [
  "schemaVersion",
  "scenarioSeedId",
  "scenarioName",
  "canonicalFloorplanId",
  "ratioConfigurationId",
  "assignmentTemplateId",
  "erActivityPresetId",
  "patientLoadPatternId",
  "acuityPatternId",
  "outcomePlaceholderSetId",
  "syntheticDataOnly"
] as const;

export function validateScenarioSeedContract(value: unknown): ScenarioSeedContract {
  const record = requireScenarioRecord(value, "scenarioSeed");
  requireScenarioExactKeys(record, "scenarioSeed", scenarioSeedKeys);
  if (record.schemaVersion !== SCENARIO_SEED_SCHEMA_VERSION) {
    throw new Error("scenarioSeed.schemaVersion is unsupported");
  }
  if (record.canonicalFloorplanId !== CANONICAL_ER_POD_FLOORPLAN_ID) {
    throw new Error("scenarioSeed.canonicalFloorplanId must reference the canonical ER pod floorplan");
  }
  if (record.outcomePlaceholderSetId !== OUTCOME_PLACEHOLDER_SET_ID) {
    throw new Error("scenarioSeed.outcomePlaceholderSetId is unsupported");
  }
  return {
    schemaVersion: SCENARIO_SEED_SCHEMA_VERSION,
    scenarioSeedId: requireScenarioString(record.scenarioSeedId, "scenarioSeed.scenarioSeedId"),
    scenarioName: requireScenarioString(record.scenarioName, "scenarioSeed.scenarioName"),
    canonicalFloorplanId: CANONICAL_ER_POD_FLOORPLAN_ID,
    ratioConfigurationId: requireScenarioEnum(record.ratioConfigurationId, NURSE_RATIO_IDS, "scenarioSeed.ratioConfigurationId"),
    assignmentTemplateId: requireScenarioString(record.assignmentTemplateId, "scenarioSeed.assignmentTemplateId"),
    erActivityPresetId: requireScenarioEnum(record.erActivityPresetId, ER_ACTIVITY_PRESET_IDS, "scenarioSeed.erActivityPresetId"),
    patientLoadPatternId: requireScenarioEnum(record.patientLoadPatternId, PATIENT_LOAD_PATTERN_IDS, "scenarioSeed.patientLoadPatternId"),
    acuityPatternId: requireScenarioEnum(record.acuityPatternId, ACUITY_PATTERN_IDS, "scenarioSeed.acuityPatternId"),
    outcomePlaceholderSetId: OUTCOME_PLACEHOLDER_SET_ID,
    syntheticDataOnly: requireScenarioLiteralTrue(record.syntheticDataOnly, "scenarioSeed.syntheticDataOnly")
  };
}

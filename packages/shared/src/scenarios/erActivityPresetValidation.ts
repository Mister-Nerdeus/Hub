import {
  ER_ACTIVITY_NON_CLAIM_COPY,
  ER_ACTIVITY_PRESET_IDS,
  ER_ACTIVITY_PRESET_SCHEMA_VERSION,
  ER_ACTIVITY_PRESSURE_LEVELS,
  type ErActivityPresetContract
} from "./erActivityPresetContract.js";
import {
  requireScenarioEnum,
  requireScenarioExactKeys,
  requireScenarioLiteralTrue,
  requireScenarioRecord,
  requireScenarioString
} from "./scenarioValidationUtils.js";

const erActivityPresetKeys = [
  "schemaVersion",
  "presetId",
  "label",
  "arrivalPressureLevel",
  "turnoverPressureLevel",
  "traumaFrequencyLevel",
  "boardingPressureLevel",
  "hallwayPressureLevel",
  "nonClaimCopy",
  "syntheticDataOnly"
] as const;

export function validateErActivityPresetContract(value: unknown): ErActivityPresetContract {
  const record = requireScenarioRecord(value, "erActivityPreset");
  requireScenarioExactKeys(record, "erActivityPreset", erActivityPresetKeys);
  if (record.schemaVersion !== ER_ACTIVITY_PRESET_SCHEMA_VERSION) {
    throw new Error("erActivityPreset.schemaVersion is unsupported");
  }
  if (record.nonClaimCopy !== ER_ACTIVITY_NON_CLAIM_COPY) {
    throw new Error("erActivityPreset.nonClaimCopy must preserve operational-only non-claim language");
  }
  return {
    schemaVersion: ER_ACTIVITY_PRESET_SCHEMA_VERSION,
    presetId: requireScenarioEnum(record.presetId, ER_ACTIVITY_PRESET_IDS, "erActivityPreset.presetId"),
    label: requireScenarioString(record.label, "erActivityPreset.label"),
    arrivalPressureLevel: requireScenarioEnum(record.arrivalPressureLevel, ER_ACTIVITY_PRESSURE_LEVELS, "erActivityPreset.arrivalPressureLevel"),
    turnoverPressureLevel: requireScenarioEnum(record.turnoverPressureLevel, ER_ACTIVITY_PRESSURE_LEVELS, "erActivityPreset.turnoverPressureLevel"),
    traumaFrequencyLevel: requireScenarioEnum(record.traumaFrequencyLevel, ER_ACTIVITY_PRESSURE_LEVELS, "erActivityPreset.traumaFrequencyLevel"),
    boardingPressureLevel: requireScenarioEnum(record.boardingPressureLevel, ER_ACTIVITY_PRESSURE_LEVELS, "erActivityPreset.boardingPressureLevel"),
    hallwayPressureLevel: requireScenarioEnum(record.hallwayPressureLevel, ER_ACTIVITY_PRESSURE_LEVELS, "erActivityPreset.hallwayPressureLevel"),
    nonClaimCopy: ER_ACTIVITY_NON_CLAIM_COPY,
    syntheticDataOnly: requireScenarioLiteralTrue(record.syntheticDataOnly, "erActivityPreset.syntheticDataOnly")
  };
}

import {
  ACUITY_PATTERN_IDS,
  ACUITY_PATTERN_SCHEMA_VERSION,
  type AcuityPatternContract
} from "./acuityPatternContract.js";
import { ER_ACTIVITY_PRESSURE_LEVELS } from "./erActivityPresetContract.js";
import {
  PATIENT_LOAD_PATTERN_IDS,
  PATIENT_LOAD_PATTERN_SCHEMA_VERSION,
  type PatientLoadPatternContract
} from "./patientLoadPatternContract.js";
import {
  requireScenarioEnum,
  requireScenarioExactKeys,
  requireScenarioInteger,
  requireScenarioLiteralTrue,
  requireScenarioRecord,
  requireScenarioString
} from "./scenarioValidationUtils.js";

const patientLoadPatternKeys = [
  "schemaVersion",
  "patientLoadPatternId",
  "label",
  "occupiedRoomCount",
  "hallwayPressureLevel",
  "syntheticDataOnly"
] as const;
const acuityPatternKeys = [
  "schemaVersion",
  "acuityPatternId",
  "label",
  "lowAcuityShare",
  "mediumAcuityShare",
  "highAcuityShare",
  "traumaActiveCountRange",
  "isolationBurdenLevel",
  "behavioralBurdenLevel",
  "sitterBurdenLevel",
  "syntheticDataOnly"
] as const;
const traumaRangeKeys = ["min", "max"] as const;

export function validatePatientLoadPatternContract(value: unknown): PatientLoadPatternContract {
  const record = requireScenarioRecord(value, "patientLoadPattern");
  requireScenarioExactKeys(record, "patientLoadPattern", patientLoadPatternKeys);
  if (record.schemaVersion !== PATIENT_LOAD_PATTERN_SCHEMA_VERSION) {
    throw new Error("patientLoadPattern.schemaVersion is unsupported");
  }
  return {
    schemaVersion: PATIENT_LOAD_PATTERN_SCHEMA_VERSION,
    patientLoadPatternId: requireScenarioEnum(record.patientLoadPatternId, PATIENT_LOAD_PATTERN_IDS, "patientLoadPattern.patientLoadPatternId"),
    label: requireScenarioString(record.label, "patientLoadPattern.label"),
    occupiedRoomCount: requireScenarioInteger(record.occupiedRoomCount, "patientLoadPattern.occupiedRoomCount", 0, 23),
    hallwayPressureLevel: requireScenarioEnum(record.hallwayPressureLevel, ER_ACTIVITY_PRESSURE_LEVELS, "patientLoadPattern.hallwayPressureLevel"),
    syntheticDataOnly: requireScenarioLiteralTrue(record.syntheticDataOnly, "patientLoadPattern.syntheticDataOnly")
  };
}

export function validateAcuityPatternContract(value: unknown): AcuityPatternContract {
  const record = requireScenarioRecord(value, "acuityPattern");
  requireScenarioExactKeys(record, "acuityPattern", acuityPatternKeys);
  if (record.schemaVersion !== ACUITY_PATTERN_SCHEMA_VERSION) {
    throw new Error("acuityPattern.schemaVersion is unsupported");
  }
  const lowAcuityShare = requireScenarioInteger(record.lowAcuityShare, "acuityPattern.lowAcuityShare", 0, 100);
  const mediumAcuityShare = requireScenarioInteger(record.mediumAcuityShare, "acuityPattern.mediumAcuityShare", 0, 100);
  const highAcuityShare = requireScenarioInteger(record.highAcuityShare, "acuityPattern.highAcuityShare", 0, 100);
  if (lowAcuityShare + mediumAcuityShare + highAcuityShare !== 100) {
    throw new Error("acuityPattern acuity shares must sum to 100");
  }
  const traumaRange = requireScenarioRecord(record.traumaActiveCountRange, "acuityPattern.traumaActiveCountRange");
  requireScenarioExactKeys(traumaRange, "acuityPattern.traumaActiveCountRange", traumaRangeKeys);
  const min = requireScenarioInteger(traumaRange.min, "acuityPattern.traumaActiveCountRange.min", 0, 23);
  const max = requireScenarioInteger(traumaRange.max, "acuityPattern.traumaActiveCountRange.max", min, 23);
  return {
    schemaVersion: ACUITY_PATTERN_SCHEMA_VERSION,
    acuityPatternId: requireScenarioEnum(record.acuityPatternId, ACUITY_PATTERN_IDS, "acuityPattern.acuityPatternId"),
    label: requireScenarioString(record.label, "acuityPattern.label"),
    lowAcuityShare,
    mediumAcuityShare,
    highAcuityShare,
    traumaActiveCountRange: { min, max },
    isolationBurdenLevel: requireScenarioEnum(record.isolationBurdenLevel, ER_ACTIVITY_PRESSURE_LEVELS, "acuityPattern.isolationBurdenLevel"),
    behavioralBurdenLevel: requireScenarioEnum(record.behavioralBurdenLevel, ER_ACTIVITY_PRESSURE_LEVELS, "acuityPattern.behavioralBurdenLevel"),
    sitterBurdenLevel: requireScenarioEnum(record.sitterBurdenLevel, ER_ACTIVITY_PRESSURE_LEVELS, "acuityPattern.sitterBurdenLevel"),
    syntheticDataOnly: requireScenarioLiteralTrue(record.syntheticDataOnly, "acuityPattern.syntheticDataOnly")
  };
}

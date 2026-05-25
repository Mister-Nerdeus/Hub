import type { PlanContract } from "../contracts.js";
import {
  PLAN_1_NURSE_ROLES,
  PLAN_1_SYNTHETIC_NURSE_IDS,
  PLAN_1_SYNTHETIC_NURSE_NAMES,
  assertNoDuplicateStrings,
  isPlan1SyntheticNurseId,
  requireBoolean,
  requireEnum,
  requireExactKeys,
  requireInteger,
  requireLiteralTrue,
  requirePositiveNumber,
  requireRecord,
  requireString,
  stationIdsForPlan,
  validatePlan1AssignmentText,
  validatePlan1Plan,
  type Plan1NurseProfile
} from "./plan1AssignmentCommon.js";

const NURSE_PROFILE_KEYS = [
  "nurseId",
  "displayName",
  "color",
  "role",
  "homeStationId",
  "targetPatientCount",
  "maxPatientCount",
  "traumaQualified",
  "chargeQualified",
  "triageQualified",
  "behavioralHealthComfort",
  "walkingSpeedFeetPerMinute",
  "syntheticDataOnly"
];

export function validatePlan1NurseProfile(
  value: unknown,
  plan: PlanContract,
  index = 0
): Plan1NurseProfile {
  const validatedPlan = validatePlan1Plan(plan);
  const label = `nurses[${index}]`;
  const record = requireRecord(value, label);
  requireExactKeys(record, label, NURSE_PROFILE_KEYS);
  const nurseId = requireString(record.nurseId, `${label}.nurseId`);
  if (!isPlan1SyntheticNurseId(nurseId)) {
    throw new Error(`${label}.nurseId must be one of the Plan 1 synthetic nurse IDs`);
  }
  const displayName = validatePlan1AssignmentText(requireString(record.displayName, `${label}.displayName`), `${label}.displayName`);
  if (!(PLAN_1_SYNTHETIC_NURSE_NAMES as readonly string[]).includes(displayName)) {
    throw new Error(`${label}.displayName must use a Plan 1 synthetic nurse display name`);
  }
  if (PLAN_1_SYNTHETIC_NURSE_IDS.indexOf(nurseId) !== PLAN_1_SYNTHETIC_NURSE_NAMES.indexOf(displayName as never)) {
    throw new Error(`${label}.nurseId must match displayName`);
  }
  const color = requireString(record.color, `${label}.color`);
  if (!/^#[0-9a-fA-F]{6}$/u.test(color)) {
    throw new Error(`${label}.color must be a hex color`);
  }
  const homeStationId = requireString(record.homeStationId, `${label}.homeStationId`);
  if (!stationIdsForPlan(validatedPlan).has(homeStationId)) {
    throw new Error(`${label}.homeStationId must reference a Plan 1 nurse station`);
  }
  const targetPatientCount = requireInteger(record.targetPatientCount, `${label}.targetPatientCount`, 0);
  const maxPatientCount = requireInteger(record.maxPatientCount, `${label}.maxPatientCount`, 0);
  if (targetPatientCount > maxPatientCount) {
    throw new Error(`${label}.targetPatientCount must be less than or equal to maxPatientCount`);
  }
  return {
    nurseId,
    displayName,
    color,
    role: requireEnum(record.role, PLAN_1_NURSE_ROLES, `${label}.role`),
    homeStationId,
    targetPatientCount,
    maxPatientCount,
    traumaQualified: requireBoolean(record.traumaQualified, `${label}.traumaQualified`),
    chargeQualified: requireBoolean(record.chargeQualified, `${label}.chargeQualified`),
    triageQualified: requireBoolean(record.triageQualified, `${label}.triageQualified`),
    behavioralHealthComfort: requireBoolean(record.behavioralHealthComfort, `${label}.behavioralHealthComfort`),
    walkingSpeedFeetPerMinute: requirePositiveNumber(record.walkingSpeedFeetPerMinute, `${label}.walkingSpeedFeetPerMinute`),
    syntheticDataOnly: requireLiteralTrue(record.syntheticDataOnly, `${label}.syntheticDataOnly`)
  };
}

export function validatePlan1NurseProfiles(values: unknown[], plan: PlanContract): Plan1NurseProfile[] {
  const nurses = values.map((value, index) => validatePlan1NurseProfile(value, plan, index));
  assertNoDuplicateStrings(nurses.map((nurse) => nurse.nurseId), "nurseId");
  return nurses;
}

import type { PlanContract } from "../contracts.js";
import {
  PLAN_1_ACUITY_LEVELS,
  PLAN_1_BURDEN_LEVELS,
  PLAN_1_NOTES_CODES,
  assertNoDuplicateStrings,
  requireBoolean,
  requireEnum,
  requireExactKeys,
  requireLiteralTrue,
  requireRecord,
  requireString,
  roomIdsForPlan,
  validatePlan1Plan,
  type Plan1RoomLoad
} from "./plan1AssignmentCommon.js";

const ROOM_LOAD_KEYS = [
  "roomId",
  "occupied",
  "acuityLevel",
  "traumaActive",
  "isolationActive",
  "behavioralRisk",
  "sitterRequired",
  "fallRisk",
  "monitoringIntensity",
  "medicationBurden",
  "procedureBurden",
  "turnoverExpected",
  "notesCode",
  "syntheticDataOnly"
];

export function validatePlan1RoomLoad(value: unknown, plan: PlanContract, index = 0): Plan1RoomLoad {
  const validatedPlan = validatePlan1Plan(plan);
  const label = `roomLoads[${index}]`;
  const record = requireRecord(value, label);
  requireExactKeys(record, label, ROOM_LOAD_KEYS);
  const roomId = requireString(record.roomId, `${label}.roomId`);
  if (!roomIdsForPlan(validatedPlan).has(roomId)) {
    throw new Error(`${label}.roomId must reference a Plan 1 room`);
  }
  return {
    roomId,
    occupied: requireBoolean(record.occupied, `${label}.occupied`),
    acuityLevel: requireEnum(record.acuityLevel, PLAN_1_ACUITY_LEVELS, `${label}.acuityLevel`),
    traumaActive: requireBoolean(record.traumaActive, `${label}.traumaActive`),
    isolationActive: requireBoolean(record.isolationActive, `${label}.isolationActive`),
    behavioralRisk: requireBoolean(record.behavioralRisk, `${label}.behavioralRisk`),
    sitterRequired: requireBoolean(record.sitterRequired, `${label}.sitterRequired`),
    fallRisk: requireBoolean(record.fallRisk, `${label}.fallRisk`),
    monitoringIntensity: requireEnum(record.monitoringIntensity, PLAN_1_BURDEN_LEVELS, `${label}.monitoringIntensity`),
    medicationBurden: requireEnum(record.medicationBurden, PLAN_1_BURDEN_LEVELS, `${label}.medicationBurden`),
    procedureBurden: requireEnum(record.procedureBurden, PLAN_1_BURDEN_LEVELS, `${label}.procedureBurden`),
    turnoverExpected: requireBoolean(record.turnoverExpected, `${label}.turnoverExpected`),
    notesCode: requireEnum(record.notesCode, PLAN_1_NOTES_CODES, `${label}.notesCode`),
    syntheticDataOnly: requireLiteralTrue(record.syntheticDataOnly, `${label}.syntheticDataOnly`)
  };
}

export function validatePlan1RoomLoads(values: unknown[], plan: PlanContract): Plan1RoomLoad[] {
  const roomLoads = values.map((value, index) => validatePlan1RoomLoad(value, plan, index));
  assertNoDuplicateStrings(roomLoads.map((roomLoad) => roomLoad.roomId), "roomId");
  return roomLoads;
}

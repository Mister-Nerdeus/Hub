import { validateOperationalRuntimeText } from "../no-phi/runtimeTextGuard.js";
import {
  MANUAL_ASSIGNMENT_ACUITY_LEVELS,
  MANUAL_ASSIGNMENT_BURDEN_LEVELS,
  MANUAL_ASSIGNMENT_NURSE_ROLES,
  MANUAL_ASSIGNMENT_SYNTHETIC_LABELS,
  MANUAL_ASSIGNMENT_TASK_FREQUENCY_LEVELS,
  MANUAL_ASSIGNMENT_TURNOVER_LEVELS,
  MANUAL_ASSIGNMENT_WARNING_CODES,
  MANUAL_ASSIGNMENT_WARNING_SEVERITIES,
  type ManualAssignmentNurse,
  type ManualAssignmentRoomLoad,
  type ManualAssignmentSet,
  type ManualAssignmentWarning,
  type ManualNurseBurdenScore,
  type ManualRoomAssignment
} from "./manualAssignmentContracts.js";

const nurseKeys = [
  "nurseId",
  "displayLabel",
  "color",
  "role",
  "targetPatientCount",
  "maxPatientCount",
  "traumaQualified",
  "psychQualified",
  "chargeQualified",
  "active",
  "syntheticDataOnly"
] as const;
const roomLoadKeys = [
  "roomId",
  "occupied",
  "acuity",
  "traumaActive",
  "isolationActive",
  "behavioralRisk",
  "fallRisk",
  "sitterRequired",
  "medicationFrequency",
  "monitoringFrequency",
  "procedureBurden",
  "expectedTurnover",
  "syntheticDataOnly"
] as const;
const assignmentKeys = ["assignmentId", "roomId", "nurseId", "primary", "syntheticDataOnly"] as const;
const warningKeys = ["code", "severity", "summary", "nurseIds", "roomIds", "visibleComponents", "syntheticDataOnly"] as const;
const burdenScoreKeys = [
  "nurseId",
  "assignedRoomCount",
  "occupiedRoomCount",
  "acuityBurden",
  "traumaBurden",
  "specialBurden",
  "walkingBurden",
  "roomSpreadPenalty",
  "overRatioPenalty",
  "totalBurden",
  "visibleComponents",
  "syntheticDataOnly"
] as const;
const assignmentSetKeys = [
  "assignmentSetId",
  "nurses",
  "roomLoads",
  "assignments",
  "warnings",
  "burdenScores",
  "syntheticDataOnly"
] as const;
const forbiddenFieldPatterns = [
  new RegExp(`${"record"}Identifier`, "i"),
  /\bmrn\b/i,
  /\bdob\b/i,
  /birth/i,
  /diagnosis/i,
  /clinical/i,
  /note/i,
  /medicationName/i,
  /employee/i,
  /payroll/i,
  /\bhr\b/i,
  /ehr/i,
  /hospital/i,
  /legalName/i,
  /realName/i
];

export function validateManualAssignmentNurse(value: unknown, index = 0): ManualAssignmentNurse {
  const label = `nurses[${index}]`;
  const record = requireRecord(value, label);
  requireExactKeys(record, label, nurseKeys);
  const nurseId = validateOperationalRuntimeText(requireString(record.nurseId, `${label}.nurseId`), `${label}.nurseId`);
  const displayLabel = requireEnum(record.displayLabel, MANUAL_ASSIGNMENT_SYNTHETIC_LABELS, `${label}.displayLabel`);
  const targetPatientCount = requireInteger(record.targetPatientCount, `${label}.targetPatientCount`, 0);
  const maxPatientCount = requireInteger(record.maxPatientCount, `${label}.maxPatientCount`, 0);
  if (targetPatientCount > maxPatientCount) {
    throw new Error(`${label}.targetPatientCount must be less than or equal to maxPatientCount`);
  }
  const color = requireString(record.color, `${label}.color`);
  if (!/^#[0-9a-fA-F]{6}$/u.test(color)) throw new Error(`${label}.color must be a hex color`);
  return {
    nurseId,
    displayLabel,
    color,
    role: requireEnum(record.role, MANUAL_ASSIGNMENT_NURSE_ROLES, `${label}.role`),
    targetPatientCount,
    maxPatientCount,
    traumaQualified: requireBoolean(record.traumaQualified, `${label}.traumaQualified`),
    psychQualified: requireBoolean(record.psychQualified, `${label}.psychQualified`),
    chargeQualified: requireBoolean(record.chargeQualified, `${label}.chargeQualified`),
    active: requireBoolean(record.active, `${label}.active`),
    syntheticDataOnly: requireLiteralTrue(record.syntheticDataOnly, `${label}.syntheticDataOnly`)
  };
}

export function validateManualAssignmentRoomLoad(value: unknown, index = 0): ManualAssignmentRoomLoad {
  const label = `roomLoads[${index}]`;
  const record = requireRecord(value, label);
  requireExactKeys(record, label, roomLoadKeys);
  return {
    roomId: validateOperationalRuntimeText(requireString(record.roomId, `${label}.roomId`), `${label}.roomId`),
    occupied: requireBoolean(record.occupied, `${label}.occupied`),
    acuity: requireEnum(record.acuity, MANUAL_ASSIGNMENT_ACUITY_LEVELS, `${label}.acuity`),
    traumaActive: requireBoolean(record.traumaActive, `${label}.traumaActive`),
    isolationActive: requireBoolean(record.isolationActive, `${label}.isolationActive`),
    behavioralRisk: requireBoolean(record.behavioralRisk, `${label}.behavioralRisk`),
    fallRisk: requireBoolean(record.fallRisk, `${label}.fallRisk`),
    sitterRequired: requireBoolean(record.sitterRequired, `${label}.sitterRequired`),
    medicationFrequency: requireEnum(record.medicationFrequency, MANUAL_ASSIGNMENT_TASK_FREQUENCY_LEVELS, `${label}.medicationFrequency`),
    monitoringFrequency: requireEnum(record.monitoringFrequency, MANUAL_ASSIGNMENT_TASK_FREQUENCY_LEVELS, `${label}.monitoringFrequency`),
    procedureBurden: requireEnum(record.procedureBurden, MANUAL_ASSIGNMENT_BURDEN_LEVELS, `${label}.procedureBurden`),
    expectedTurnover: requireEnum(record.expectedTurnover, MANUAL_ASSIGNMENT_TURNOVER_LEVELS, `${label}.expectedTurnover`),
    syntheticDataOnly: requireLiteralTrue(record.syntheticDataOnly, `${label}.syntheticDataOnly`)
  };
}

export function validateManualRoomAssignment(value: unknown, index = 0): ManualRoomAssignment {
  const label = `assignments[${index}]`;
  const record = requireRecord(value, label);
  requireExactKeys(record, label, assignmentKeys);
  return {
    assignmentId: validateOperationalRuntimeText(requireString(record.assignmentId, `${label}.assignmentId`), `${label}.assignmentId`),
    roomId: validateOperationalRuntimeText(requireString(record.roomId, `${label}.roomId`), `${label}.roomId`),
    nurseId: validateOperationalRuntimeText(requireString(record.nurseId, `${label}.nurseId`), `${label}.nurseId`),
    primary: requireLiteralTrue(record.primary, `${label}.primary`),
    syntheticDataOnly: requireLiteralTrue(record.syntheticDataOnly, `${label}.syntheticDataOnly`)
  };
}

export function validateManualAssignmentWarning(value: unknown, index = 0): ManualAssignmentWarning {
  const label = `warnings[${index}]`;
  const record = requireRecord(value, label);
  requireExactKeys(record, label, warningKeys);
  return {
    code: requireEnum(record.code, MANUAL_ASSIGNMENT_WARNING_CODES, `${label}.code`),
    severity: requireEnum(record.severity, MANUAL_ASSIGNMENT_WARNING_SEVERITIES, `${label}.severity`),
    summary: validateOperationalRuntimeText(requireString(record.summary, `${label}.summary`), `${label}.summary`),
    nurseIds: requireStringArray(record.nurseIds, `${label}.nurseIds`),
    roomIds: requireStringArray(record.roomIds, `${label}.roomIds`),
    visibleComponents: requireStringArray(record.visibleComponents, `${label}.visibleComponents`),
    syntheticDataOnly: requireLiteralTrue(record.syntheticDataOnly, `${label}.syntheticDataOnly`)
  };
}

export function validateManualNurseBurdenScore(value: unknown, index = 0): ManualNurseBurdenScore {
  const label = `burdenScores[${index}]`;
  const record = requireRecord(value, label);
  requireExactKeys(record, label, burdenScoreKeys);
  return {
    nurseId: validateOperationalRuntimeText(requireString(record.nurseId, `${label}.nurseId`), `${label}.nurseId`),
    assignedRoomCount: requireInteger(record.assignedRoomCount, `${label}.assignedRoomCount`, 0),
    occupiedRoomCount: requireInteger(record.occupiedRoomCount, `${label}.occupiedRoomCount`, 0),
    acuityBurden: requireNumber(record.acuityBurden, `${label}.acuityBurden`, 0),
    traumaBurden: requireNumber(record.traumaBurden, `${label}.traumaBurden`, 0),
    specialBurden: requireNumber(record.specialBurden, `${label}.specialBurden`, 0),
    walkingBurden: requireNumber(record.walkingBurden, `${label}.walkingBurden`, 0),
    roomSpreadPenalty: requireNumber(record.roomSpreadPenalty, `${label}.roomSpreadPenalty`, 0),
    overRatioPenalty: requireNumber(record.overRatioPenalty, `${label}.overRatioPenalty`, 0),
    totalBurden: requireNumber(record.totalBurden, `${label}.totalBurden`, 0),
    visibleComponents: requireStringArray(record.visibleComponents, `${label}.visibleComponents`),
    syntheticDataOnly: requireLiteralTrue(record.syntheticDataOnly, `${label}.syntheticDataOnly`)
  };
}

export function validateManualAssignmentSet(value: unknown): ManualAssignmentSet {
  const record = requireRecord(value, "manualAssignmentSet");
  requireExactKeys(record, "manualAssignmentSet", assignmentSetKeys);
  const nurses = requireArray(record.nurses, "manualAssignmentSet.nurses").map(validateManualAssignmentNurse);
  const roomLoads = requireArray(record.roomLoads, "manualAssignmentSet.roomLoads").map(validateManualAssignmentRoomLoad);
  const assignments = requireArray(record.assignments, "manualAssignmentSet.assignments").map(validateManualRoomAssignment);
  const warnings = requireArray(record.warnings, "manualAssignmentSet.warnings").map(validateManualAssignmentWarning);
  const burdenScores = requireArray(record.burdenScores, "manualAssignmentSet.burdenScores").map(validateManualNurseBurdenScore);
  assertNoDuplicate(nurses.map((nurse) => nurse.nurseId), "nurseId");
  assertNoDuplicate(roomLoads.map((roomLoad) => roomLoad.roomId), "roomId");
  assertNoDuplicate(assignments.map((assignment) => assignment.assignmentId), "assignmentId");
  const nurseIds = new Set(nurses.map((nurse) => nurse.nurseId));
  const roomIds = new Set(roomLoads.map((roomLoad) => roomLoad.roomId));
  for (const assignment of assignments) {
    if (!nurseIds.has(assignment.nurseId)) throw new Error(`assignment ${assignment.assignmentId} references unsupported nurseId`);
    if (!roomIds.has(assignment.roomId)) throw new Error(`assignment ${assignment.assignmentId} references unsupported roomId`);
  }
  assertNoDuplicate(assignments.map((assignment) => assignment.roomId), "primary room assignment");
  return {
    assignmentSetId: validateOperationalRuntimeText(requireString(record.assignmentSetId, "manualAssignmentSet.assignmentSetId"), "manualAssignmentSet.assignmentSetId"),
    nurses,
    roomLoads,
    assignments,
    warnings,
    burdenScores,
    syntheticDataOnly: requireLiteralTrue(record.syntheticDataOnly, "manualAssignmentSet.syntheticDataOnly")
  };
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be an object`);
  const record = value as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (forbiddenFieldPatterns.some((pattern) => pattern.test(key))) throw new Error(`${label}.${key} is forbidden operational identity or clinical data`);
  }
  return record;
}

function requireExactKeys(value: Record<string, unknown>, label: string, allowedKeys: readonly string[]): void {
  const allowed = new Set(allowedKeys);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) throw new Error(`${label}.${key} is not allowed`);
  }
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) throw new Error(`${label} must be a non-empty string`);
  return value;
}

function requireBoolean(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") throw new Error(`${label} must be a boolean`);
  return value;
}

function requireLiteralTrue(value: unknown, label: string): true {
  if (value !== true) throw new Error(`${label} must be true`);
  return true;
}

function requireInteger(value: unknown, label: string, min: number): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < min) throw new Error(`${label} must be an integer greater than or equal to ${min}`);
  return value;
}

function requireNumber(value: unknown, label: string, min: number): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min) throw new Error(`${label} must be a number greater than or equal to ${min}`);
  return value;
}

function requireEnum<T extends string | number>(value: unknown, allowedValues: readonly T[], label: string): T {
  if (!allowedValues.includes(value as T)) throw new Error(`${label} must be one of ${allowedValues.join(", ")}`);
  return value as T;
}

function requireArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
  return value;
}

function requireStringArray(value: unknown, label: string): string[] {
  return requireArray(value, label).map((entry, index) =>
    validateOperationalRuntimeText(requireString(entry, `${label}[${index}]`), `${label}[${index}]`)
  );
}

function assertNoDuplicate(values: string[], label: string): void {
  if (new Set(values).size !== values.length) throw new Error(`duplicate ${label} values are not allowed`);
}

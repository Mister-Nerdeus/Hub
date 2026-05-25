import { validateOperationalRuntimeText } from "../no-phi/runtimeTextGuard.js";
import { validatePlanContract, type PlanContract } from "../contracts.js";

export const PLAN_1_ID = "default-er-layout-plan-1" as const;
export const PLAN_1_SYNTHETIC_NURSE_IDS = [
  "nurse-blue",
  "nurse-green",
  "nurse-orange",
  "nurse-purple"
] as const;
export const PLAN_1_SYNTHETIC_NURSE_NAMES = [
  "Nurse Blue",
  "Nurse Green",
  "Nurse Orange",
  "Nurse Purple"
] as const;
export const PLAN_1_NURSE_ROLES = ["primary", "charge", "float", "triage"] as const;
export const PLAN_1_ACUITY_LEVELS = ["low", "medium", "high", "critical"] as const;
export const PLAN_1_BURDEN_LEVELS = ["none", "low", "medium", "high"] as const;
export const PLAN_1_NOTES_CODES = [
  "none",
  "high_turnover",
  "trauma_ready",
  "behavioral_watch",
  "isolation_workflow"
] as const;
export const PLAN_1_ASSIGNMENT_TYPES = ["primary", "secondary", "observer", "excluded"] as const;
export const PLAN_1_ASSIGNMENT_SOURCES = ["manual", "fixture", "imported_json"] as const;
export const PLAN_1_WARNING_SEVERITIES = ["info", "warning", "blocking"] as const;
export const PLAN_1_WARNING_CODES = [
  "UNOCCUPIED_ASSIGNED_ROOM",
  "OCCUPIED_UNASSIGNED_ROOM",
  "NURSE_OVER_TARGET_RATIO",
  "NURSE_OVER_MAX_RATIO",
  "TRAUMA_ROOM_WITH_NON_TRAUMA_QUALIFIED_NURSE",
  "INVALID_ROOM_REFERENCE",
  "INVALID_NURSE_REFERENCE",
  "DUPLICATE_PRIMARY_ASSIGNMENT",
  "STALE_PATH_SYNC",
  "NO_ACTIVE_PLAN_1_FLOORPLAN",
  "NON_PLAN_1_ASSIGNMENT_SCOPE"
] as const;

export type Plan1SyntheticNurseId = (typeof PLAN_1_SYNTHETIC_NURSE_IDS)[number];
export type Plan1NurseRole = (typeof PLAN_1_NURSE_ROLES)[number];
export type Plan1AcuityLevel = (typeof PLAN_1_ACUITY_LEVELS)[number];
export type Plan1BurdenLevel = (typeof PLAN_1_BURDEN_LEVELS)[number];
export type Plan1NotesCode = (typeof PLAN_1_NOTES_CODES)[number];
export type Plan1AssignmentType = (typeof PLAN_1_ASSIGNMENT_TYPES)[number];
export type Plan1AssignmentSource = (typeof PLAN_1_ASSIGNMENT_SOURCES)[number];
export type Plan1AssignmentWarningSeverity = (typeof PLAN_1_WARNING_SEVERITIES)[number];
export type Plan1AssignmentWarningCode = (typeof PLAN_1_WARNING_CODES)[number];

export type Plan1NurseProfile = {
  nurseId: string;
  displayName: string;
  color: string;
  role: Plan1NurseRole;
  homeStationId: string;
  targetPatientCount: number;
  maxPatientCount: number;
  traumaQualified: boolean;
  chargeQualified: boolean;
  triageQualified: boolean;
  behavioralHealthComfort: boolean;
  walkingSpeedFeetPerMinute: number;
  syntheticDataOnly: true;
};

export type Plan1RoomLoad = {
  roomId: string;
  occupied: boolean;
  acuityLevel: Plan1AcuityLevel;
  traumaActive: boolean;
  isolationActive: boolean;
  behavioralRisk: boolean;
  sitterRequired: boolean;
  fallRisk: boolean;
  monitoringIntensity: Plan1BurdenLevel;
  medicationBurden: Plan1BurdenLevel;
  procedureBurden: Plan1BurdenLevel;
  turnoverExpected: boolean;
  notesCode: Plan1NotesCode;
  syntheticDataOnly: true;
};

export type Plan1ManualAssignmentRecord = {
  assignmentId: string;
  roomId: string;
  nurseId: string;
  assignmentType: Plan1AssignmentType;
  startMinute: number;
  endMinute: number | null;
  source: Plan1AssignmentSource;
  syntheticDataOnly: true;
};

export type Plan1AssignmentWarning = {
  code: Plan1AssignmentWarningCode;
  severity: Plan1AssignmentWarningSeverity;
  summary: string;
  nurseIds: string[];
  roomIds: string[];
};

export type Plan1StalePathSyncWarning = {
  code: "STALE_PATH_SYNC";
  severity: "blocking";
  summary: string;
  deferredSync: {
    doors: "preserved_from_source_plan";
    pathNodes: "preserved_from_source_plan";
    pathEdges: "preserved_from_source_plan";
  };
};

export function validatePlan1Plan(value: PlanContract): PlanContract {
  const plan = validatePlanContract(value);
  if (plan.planId !== PLAN_1_ID) {
    throw new Error("Plan 1 assignment workflow requires default-er-layout-plan-1");
  }
  return plan;
}

export function validatePlan1Scope(plan: PlanContract | null): PlanContract {
  if (plan == null) {
    throw new Error("NO_ACTIVE_PLAN_1_FLOORPLAN");
  }
  return validatePlan1Plan(plan);
}

export function roomIdsForPlan(plan: PlanContract): Set<string> {
  return new Set(plan.rooms.map((room) => room.id));
}

export function stationIdsForPlan(plan: PlanContract): Set<string> {
  return new Set(plan.nurseStations.map((station) => station.id));
}

export function nurseIdsForProfiles(nurses: Plan1NurseProfile[]): Set<string> {
  return new Set(nurses.map((nurse) => nurse.nurseId));
}

export function isPlan1SyntheticNurseId(value: string): value is Plan1SyntheticNurseId {
  return (PLAN_1_SYNTHETIC_NURSE_IDS as readonly string[]).includes(value);
}

export function plan1PatientCareRoomIds(plan: PlanContract): Set<string> {
  return new Set(plan.rooms.map((room) => room.id));
}

export function isPlan1ScaffoldZoneId(zoneId: string): boolean {
  return zoneId.startsWith("region-");
}

export function isPlan1AssignmentZone(zoneId: string): boolean {
  return !isPlan1ScaffoldZoneId(zoneId);
}

export function makeStalePathSyncWarning(): Plan1StalePathSyncWarning {
  return {
    code: "STALE_PATH_SYNC",
    severity: "blocking",
    summary:
      "Edited geometry preserved source doors, path nodes, and path edges; walking-aware assignment routing requires path sync review before use.",
    deferredSync: {
      doors: "preserved_from_source_plan",
      pathNodes: "preserved_from_source_plan",
      pathEdges: "preserved_from_source_plan"
    }
  };
}

export function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

export function requireExactKeys(value: Record<string, unknown>, label: string, allowedKeys: string[]): void {
  const allowed = new Set(allowedKeys);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      throw new Error(`${label}.${key} is not allowed`);
    }
  }
}

export function requireArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array`);
  }
  return value;
}

export function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}

export function requireBoolean(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`${label} must be a boolean`);
  }
  return value;
}

export function requireInteger(value: unknown, label: string, min = 0): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < min) {
    throw new Error(`${label} must be an integer greater than or equal to ${min}`);
  }
  return value;
}

export function requirePositiveNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be a positive number`);
  }
  return value;
}

export function requireLiteralTrue(value: unknown, label: string): true {
  if (value !== true) {
    throw new Error(`${label} must be true`);
  }
  return true;
}

export function requireEnum<T extends string>(value: unknown, allowedValues: readonly T[], label: string): T {
  if (typeof value !== "string" || !allowedValues.includes(value as T)) {
    throw new Error(`${label} must be one of ${allowedValues.join(", ")}`);
  }
  return value as T;
}

export function validatePlan1AssignmentText(value: string, label: string): string {
  return validateOperationalRuntimeText(value, label);
}

export function assertNoDuplicateStrings(values: string[], label: string): void {
  if (new Set(values).size !== values.length) {
    throw new Error(`duplicate ${label} values are not allowed`);
  }
}

export function roundPlan1Number(value: number): number {
  return Math.round(value * 1000) / 1000;
}

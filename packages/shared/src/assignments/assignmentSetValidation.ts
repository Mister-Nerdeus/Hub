import {
  ASSIGNMENT_SET_STATUSES,
  type AssignmentSetContract
} from "./assignmentSetContract.js";
import {
  DEFAULT_NURSE_PROFILE_LABELS,
  NURSE_PROFILE_ROLES,
  type NurseProfileContract
} from "./nurseProfileContract.js";
import {
  ROOM_LOAD_ACUITY_LEVELS,
  ROOM_LOAD_FREQUENCY_LEVELS,
  ROOM_LOAD_PROCEDURE_BURDEN_LEVELS,
  ROOM_LOAD_TURNOVER_LEVELS,
  type RoomLoadContract
} from "./roomLoadContract.js";
import { validateOperationalRuntimeText } from "../no-phi/runtimeTextGuard.js";

export function validateAssignmentSetContract(value: unknown): AssignmentSetContract {
  const record = requireRecord(value, "assignmentSet");
  const nurseProfiles = requireArray(record.nurseProfiles, "assignmentSet.nurseProfiles")
    .map(validateNurseProfileContract);
  requireUnique(
    "assignmentSet.nurseProfiles.nurseProfileId",
    nurseProfiles.map((nurse) => nurse.nurseProfileId)
  );
  const roomLoads = requireRecord(record.roomLoadsByRoomId, "assignmentSet.roomLoadsByRoomId");
  const roomLoadsByRoomId = Object.fromEntries(
    Object.entries(roomLoads).map(([roomId, roomLoad]) => {
      const validated = validateRoomLoadContract(roomLoad);
      if (validated.roomId !== roomId) {
        throw new Error(`roomLoadsByRoomId key ${roomId} must match roomLoad.roomId ${validated.roomId}`);
      }
      return [roomId, validated];
    })
  );
  const assignments = requireRecord(record.assignmentsByRoomId, "assignmentSet.assignmentsByRoomId");
  const nurseIds = new Set(nurseProfiles.map((nurse) => nurse.nurseProfileId));
  for (const [roomId, nurseId] of Object.entries(assignments)) {
    if (typeof nurseId !== "string" || nurseId.trim().length === 0) {
      throw new Error(`assignment for ${roomId} must reference a nurse profile ID`);
    }
    if (!nurseIds.has(nurseId)) {
      throw new Error(`assignment for ${roomId} references unknown nurse profile ${nurseId}`);
    }
    if (roomLoadsByRoomId[roomId] == null) {
      throw new Error(`assignment for ${roomId} references room without a structured room load`);
    }
  }

  return {
    schemaVersion: requireLiteral(record.schemaVersion, "1.0.0", "assignmentSet.schemaVersion"),
    assignmentSetId: requireString(record.assignmentSetId, "assignmentSet.assignmentSetId"),
    floorplanVersionId: requireString(record.floorplanVersionId, "assignmentSet.floorplanVersionId"),
    displayName: validateOperationalRuntimeText(
      requireString(record.displayName, "assignmentSet.displayName"),
      "assignmentSet.displayName"
    ),
    status: requireEnum(record.status, ASSIGNMENT_SET_STATUSES, "assignmentSet.status"),
    nurseProfiles,
    assignmentsByRoomId: Object.fromEntries(
      Object.entries(assignments).map(([roomId, nurseId]) => [roomId, nurseId as string])
    ),
    roomLoadsByRoomId,
    createdAt: requireIsoString(record.createdAt, "assignmentSet.createdAt"),
    updatedAt: requireIsoString(record.updatedAt, "assignmentSet.updatedAt")
  };
}

export function validateNurseProfileContract(value: unknown): NurseProfileContract {
  const record = requireRecord(value, "nurseProfile");
  const displayLabel = validateOperationalRuntimeText(
    requireString(record.displayLabel, "nurseProfile.displayLabel"),
    "nurseProfile.displayLabel"
  );
  if (displayLabel.trim().length === 0) {
    throw new Error("nurseProfile.displayLabel must be an operational display label");
  }
  const targetPatientCount = requireNonNegativeInteger(record.targetPatientCount, "nurseProfile.targetPatientCount");
  const maxPatientCount = requireNonNegativeInteger(record.maxPatientCount, "nurseProfile.maxPatientCount");
  if (maxPatientCount < targetPatientCount) {
    throw new Error("nurseProfile.maxPatientCount must be greater than or equal to targetPatientCount");
  }
  const color = requireString(record.color, "nurseProfile.color");
  if (!/^#[0-9a-fA-F]{6}$/u.test(color)) {
    throw new Error("nurseProfile.color must be a hex color");
  }
  return {
    schemaVersion: requireLiteral(record.schemaVersion, "1.0.0", "nurseProfile.schemaVersion"),
    nurseProfileId: requireString(record.nurseProfileId, "nurseProfile.nurseProfileId"),
    displayLabel,
    color,
    role: requireEnum(record.role, NURSE_PROFILE_ROLES, "nurseProfile.role"),
    targetPatientCount,
    maxPatientCount,
    traumaQualified: requireBoolean(record.traumaQualified, "nurseProfile.traumaQualified"),
    psychQualified: requireBoolean(record.psychQualified, "nurseProfile.psychQualified"),
    chargeQualified: requireBoolean(record.chargeQualified, "nurseProfile.chargeQualified"),
    active: requireBoolean(record.active, "nurseProfile.active")
  };
}

export function validateRoomLoadContract(value: unknown): RoomLoadContract {
  const record = requireRecord(value, "roomLoad");
  return {
    schemaVersion: requireLiteral(record.schemaVersion, "1.0.0", "roomLoad.schemaVersion"),
    roomId: requireString(record.roomId, "roomLoad.roomId"),
    occupied: requireBoolean(record.occupied, "roomLoad.occupied"),
    acuity: requireEnum(record.acuity, ROOM_LOAD_ACUITY_LEVELS, "roomLoad.acuity"),
    traumaActive: requireBoolean(record.traumaActive, "roomLoad.traumaActive"),
    isolationActive: requireBoolean(record.isolationActive, "roomLoad.isolationActive"),
    behavioralRisk: requireBoolean(record.behavioralRisk, "roomLoad.behavioralRisk"),
    fallRisk: requireBoolean(record.fallRisk, "roomLoad.fallRisk"),
    sitterRequired: requireBoolean(record.sitterRequired, "roomLoad.sitterRequired"),
    medicationFrequency: requireEnum(record.medicationFrequency, ROOM_LOAD_FREQUENCY_LEVELS, "roomLoad.medicationFrequency"),
    monitoringFrequency: requireEnum(record.monitoringFrequency, ROOM_LOAD_FREQUENCY_LEVELS, "roomLoad.monitoringFrequency"),
    procedureBurden: requireEnum(record.procedureBurden, ROOM_LOAD_PROCEDURE_BURDEN_LEVELS, "roomLoad.procedureBurden"),
    expectedTurnover: requireEnum(record.expectedTurnover, ROOM_LOAD_TURNOVER_LEVELS, "roomLoad.expectedTurnover")
  };
}

export function assignmentSetMatchesFloorplanVersion(
  assignmentSet: AssignmentSetContract,
  floorplanVersionId: string
): boolean {
  return assignmentSet.floorplanVersionId === floorplanVersionId;
}

export function createDefaultNurseProfiles(): NurseProfileContract[] {
  return DEFAULT_NURSE_PROFILE_LABELS.map((displayLabel, index) => ({
    schemaVersion: "1.0.0",
    nurseProfileId: `nurse-${displayLabel.toLowerCase().replace("nurse ", "")}`,
    displayLabel,
    color: ["#2563eb", "#16a34a", "#ea580c", "#7c3aed"][index] ?? "#64748b",
    role: index === 3 ? "charge" : "primary",
    targetPatientCount: 4,
    maxPatientCount: 5,
    traumaQualified: index < 2,
    psychQualified: index !== 2,
    chargeQualified: index === 3,
    active: true
  }));
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function requireArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array`);
  }
  return value;
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}

function requireBoolean(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`${label} must be a boolean`);
  }
  return value;
}

function requireNonNegativeInteger(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer`);
  }
  return value;
}

function requireIsoString(value: unknown, label: string): string {
  const text = requireString(value, label);
  if (Number.isNaN(Date.parse(text))) {
    throw new Error(`${label} must be an ISO timestamp`);
  }
  return text;
}

function requireLiteral<T extends string>(value: unknown, expected: T, label: string): T {
  if (value !== expected) {
    throw new Error(`${label} must be ${expected}`);
  }
  return expected;
}

function requireEnum<T extends readonly (string | number)[]>(
  value: unknown,
  allowed: T,
  label: string
): T[number] {
  if (!allowed.includes(value as T[number])) {
    throw new Error(`${label} must be one of ${allowed.join(", ")}`);
  }
  return value as T[number];
}

function requireUnique(label: string, values: readonly string[]): void {
  if (new Set(values).size !== values.length) {
    throw new Error(`${label} must be unique`);
  }
}

import type {
  ManualAssignmentNurse,
  ManualAssignmentRoomLoad,
  ManualRoomAssignment
} from "./manualAssignmentContracts.js";
import {
  validateManualAssignmentNurse,
  validateManualAssignmentRoomLoad,
  validateManualRoomAssignment
} from "./manualAssignmentValidation.js";

export type ManualAssignmentStateSnapshot = {
  nurses: ManualAssignmentNurse[];
  roomLoads: ManualAssignmentRoomLoad[];
  assignments: ManualRoomAssignment[];
  activeNurseId: string | null;
  syntheticDataOnly: true;
};

export function validateManualAssignmentStateSnapshot(value: unknown): ManualAssignmentStateSnapshot {
  const record = requireRecord(value, "manualAssignmentState");
  requireExactKeys(record, "manualAssignmentState", [
    "nurses",
    "roomLoads",
    "assignments",
    "activeNurseId",
    "syntheticDataOnly"
  ]);
  if (record.syntheticDataOnly !== true) {
    throw new Error("manualAssignmentState.syntheticDataOnly must be true");
  }

  const nurses = requireArray(record.nurses, "manualAssignmentState.nurses").map(validateManualAssignmentNurse);
  const roomLoads = requireArray(record.roomLoads, "manualAssignmentState.roomLoads").map(validateManualAssignmentRoomLoad);
  const assignments = requireArray(record.assignments, "manualAssignmentState.assignments").map(validateManualRoomAssignment);
  const activeNurseId = requireNullableString(record.activeNurseId, "manualAssignmentState.activeNurseId");

  assertNoDuplicate(nurses.map((nurse) => nurse.nurseId), "nurseId");
  assertNoDuplicate(roomLoads.map((roomLoad) => roomLoad.roomId), "roomId");
  assertNoDuplicate(assignments.map((assignment) => assignment.assignmentId), "assignmentId");

  const nurseIds = new Set(nurses.map((nurse) => nurse.nurseId));
  const roomIds = new Set(roomLoads.map((roomLoad) => roomLoad.roomId));
  if (activeNurseId !== null && !nurseIds.has(activeNurseId)) {
    throw new Error("manualAssignmentState.activeNurseId references unsupported nurseId");
  }

  const assignedRoomIds = new Set<string>();
  for (const assignment of assignments) {
    if (!nurseIds.has(assignment.nurseId)) {
      throw new Error(`assignment ${assignment.assignmentId} references unsupported nurseId`);
    }
    if (!roomIds.has(assignment.roomId)) {
      throw new Error(`assignment ${assignment.assignmentId} references unsupported roomId`);
    }
    if (assignedRoomIds.has(assignment.roomId)) {
      throw new Error(`duplicate primary assignment for room ${assignment.roomId}`);
    }
    assignedRoomIds.add(assignment.roomId);
  }

  return {
    nurses,
    roomLoads,
    assignments,
    activeNurseId,
    syntheticDataOnly: true
  };
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function requireExactKeys(value: Record<string, unknown>, label: string, allowedKeys: readonly string[]): void {
  const allowed = new Set(allowedKeys);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) throw new Error(`${label}.${key} is not allowed`);
  }
}

function requireArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
  return value;
}

function requireNullableString(value: unknown, label: string): string | null {
  if (value === null) return null;
  if (typeof value !== "string" || value.length === 0) throw new Error(`${label} must be a non-empty string or null`);
  return value;
}

function assertNoDuplicate(values: string[], label: string): void {
  if (new Set(values).size !== values.length) throw new Error(`duplicate ${label} values are not allowed`);
}

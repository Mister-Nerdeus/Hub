export const ASSIGNMENT_TARGET_KINDS = [
  "single_room_patient_position",
  "split_room_bed_position",
  "hall_bed_position"
] as const;

export type AssignmentTargetKind = (typeof ASSIGNMENT_TARGET_KINDS)[number];

export type AssignmentTargetContract = {
  assignmentTargetId: string;
  geometrySourceId: string;
  targetKind: AssignmentTargetKind;
  displayLabel: string;
  parentRoomId?: string;
  active: boolean;
};

export function validateAssignmentTargetContract(value: unknown): AssignmentTargetContract {
  const target = requireRecord(value, "assignmentTargetContract");
  const targetKind = requireTargetKind(target.targetKind, "targetKind");
  const parentRoomId = target.parentRoomId == null
    ? undefined
    : requireString(target.parentRoomId, "parentRoomId");

  if (targetKind === "split_room_bed_position" && parentRoomId == null) {
    throw new Error("split room bed assignment targets require parentRoomId");
  }
  if (targetKind !== "split_room_bed_position" && parentRoomId != null) {
    throw new Error("parentRoomId is reserved for split room bed assignment targets");
  }

  return {
    assignmentTargetId: requireString(target.assignmentTargetId, "assignmentTargetId"),
    geometrySourceId: requireString(target.geometrySourceId, "geometrySourceId"),
    targetKind,
    displayLabel: requireString(target.displayLabel, "displayLabel"),
    ...(parentRoomId == null ? {} : { parentRoomId }),
    active: requireBoolean(target.active, "active")
  };
}

export function createAssignmentTargetContract(
  value: AssignmentTargetContract
): AssignmentTargetContract {
  return validateAssignmentTargetContract(value);
}

export function assignmentTargetIdForGeometry(input: {
  geometrySourceId: string;
  targetKind: AssignmentTargetKind;
}): string {
  return `${input.targetKind}:${input.geometrySourceId}`;
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function requireTargetKind(value: unknown, label: string): AssignmentTargetKind {
  if (typeof value !== "string" || !ASSIGNMENT_TARGET_KINDS.includes(value as AssignmentTargetKind)) {
    throw new Error(`${label} must be one of ${ASSIGNMENT_TARGET_KINDS.join(", ")}`);
  }
  return value as AssignmentTargetKind;
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

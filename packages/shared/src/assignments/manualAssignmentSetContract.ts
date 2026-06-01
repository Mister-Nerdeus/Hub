import {
  ASSIGNMENT_TARGET_KINDS,
  validateAssignmentTargetContract,
  type AssignmentTargetContract,
  type AssignmentTargetKind
} from "./assignmentTargetContract.js";

export type ManualAssignmentContract = {
  assignmentId: string;
  staffMemberId: string;
  assignmentTargetId: string;
  assignmentTargetKind: AssignmentTargetKind;
  notes?: string;
};

export type ManualAssignmentSetContract = {
  assignmentSetId: string;
  floorplanId: string;
  label: string;
  createdAtIso: string;
  updatedAtIso: string;
  assignments: ManualAssignmentContract[];
  mode: "manual";
};

export function manualAssignmentIdFor(input: {
  assignmentSetId: string;
  staffMemberId: string;
  assignmentTargetId: string;
}): string {
  return `manual-assignment:${input.assignmentSetId}:${input.staffMemberId}:${input.assignmentTargetId}`;
}

export function createManualAssignment(input: {
  assignmentSetId: string;
  staffMemberId: string;
  target: AssignmentTargetContract;
  notes?: string;
}): ManualAssignmentContract {
  const target = validateAssignmentTargetContract(input.target);
  return validateManualAssignmentContract({
    assignmentId: manualAssignmentIdFor({
      assignmentSetId: input.assignmentSetId,
      staffMemberId: input.staffMemberId,
      assignmentTargetId: target.assignmentTargetId
    }),
    staffMemberId: input.staffMemberId,
    assignmentTargetId: target.assignmentTargetId,
    assignmentTargetKind: target.targetKind,
    ...(input.notes == null ? {} : { notes: input.notes })
  });
}

export function validateManualAssignmentContract(value: unknown): ManualAssignmentContract {
  const assignment = requireRecord(value, "manualAssignment");
  requireAllowedKeys(assignment, "manualAssignment", [
    "assignmentId",
    "staffMemberId",
    "assignmentTargetId",
    "assignmentTargetKind",
    "notes"
  ]);
  return {
    assignmentId: requireString(assignment.assignmentId, "manualAssignment.assignmentId"),
    staffMemberId: requireString(assignment.staffMemberId, "manualAssignment.staffMemberId"),
    assignmentTargetId: requireString(assignment.assignmentTargetId, "manualAssignment.assignmentTargetId"),
    assignmentTargetKind: requireEnum(
      assignment.assignmentTargetKind,
      ASSIGNMENT_TARGET_KINDS,
      "manualAssignment.assignmentTargetKind"
    ),
    ...(assignment.notes == null ? {} : { notes: requireString(assignment.notes, "manualAssignment.notes") })
  };
}

export function validateManualAssignmentSetContract(value: unknown): ManualAssignmentSetContract {
  const set = requireRecord(value, "manualAssignmentSet");
  requireAllowedKeys(set, "manualAssignmentSet", [
    "assignmentSetId",
    "floorplanId",
    "label",
    "createdAtIso",
    "updatedAtIso",
    "assignments",
    "mode"
  ]);
  if (set.mode !== "manual") {
    throw new Error("manualAssignmentSet.mode must be manual");
  }
  const assignmentSetId = requireString(set.assignmentSetId, "manualAssignmentSet.assignmentSetId");
  const assignments = requireArray(set.assignments, "manualAssignmentSet.assignments")
    .map(validateManualAssignmentContract)
    .sort((left, right) => left.assignmentId.localeCompare(right.assignmentId));
  const ids = assignments.map((assignment) => assignment.assignmentId);
  if (new Set(ids).size !== ids.length) {
    throw new Error("manualAssignmentSet.assignments must not contain duplicate assignmentId values");
  }
  return {
    assignmentSetId,
    floorplanId: requireString(set.floorplanId, "manualAssignmentSet.floorplanId"),
    label: requireString(set.label, "manualAssignmentSet.label"),
    createdAtIso: requireIso(set.createdAtIso, "manualAssignmentSet.createdAtIso"),
    updatedAtIso: requireIso(set.updatedAtIso, "manualAssignmentSet.updatedAtIso"),
    assignments,
    mode: "manual"
  };
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function requireAllowedKeys(value: Record<string, unknown>, label: string, allowedKeys: readonly string[]): void {
  const allowed = new Set(allowedKeys);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      throw new Error(`${label}.${key} is not allowed`);
    }
  }
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
  return value.trim();
}

function requireIso(value: unknown, label: string): string {
  const text = requireString(value, label);
  if (Number.isNaN(Date.parse(text))) {
    throw new Error(`${label} must be an ISO date string`);
  }
  return text;
}

function requireEnum<const TValue extends string>(
  value: unknown,
  allowedValues: readonly TValue[],
  label: string
): TValue {
  if (typeof value !== "string" || !allowedValues.includes(value as TValue)) {
    throw new Error(`${label} must be one of ${allowedValues.join(", ")}`);
  }
  return value as TValue;
}

export const ASSIGNMENT_TARGET_KINDS = [
  "room",
  "bed_position",
  "hall_bed",
  "support_area",
  "zone"
] as const;

export type AssignmentTargetKind = (typeof ASSIGNMENT_TARGET_KINDS)[number];

export const ASSIGNMENT_CARE_POSITION_TARGET_KIND = "bed_position" satisfies AssignmentTargetKind;

export type AssignmentTargetContract = {
  assignmentTargetId: string;
  targetKind: AssignmentTargetKind;
  sourceId: string;
  displayLabel: string;
  floorplanId: string;
  routeNodeId?: string;
  active: boolean;
};

export function assignmentTargetIdFor(input: {
  floorplanId: string;
  targetKind: AssignmentTargetKind;
  sourceId: string;
}): string {
  return `assignment-target:${input.floorplanId}:${input.targetKind}:${input.sourceId}`;
}

export function validateAssignmentTargetContract(value: unknown): AssignmentTargetContract {
  const target = requireRecord(value, "assignmentTarget");
  requireAllowedKeys(target, "assignmentTarget", [
    "assignmentTargetId",
    "targetKind",
    "sourceId",
    "displayLabel",
    "floorplanId",
    "routeNodeId",
    "active"
  ]);
  const targetKind = requireEnum(target.targetKind, ASSIGNMENT_TARGET_KINDS, "assignmentTarget.targetKind");
  const sourceId = requireString(target.sourceId, "assignmentTarget.sourceId");
  const floorplanId = requireString(target.floorplanId, "assignmentTarget.floorplanId");
  const assignmentTargetId = requireString(target.assignmentTargetId, "assignmentTarget.assignmentTargetId");
  const expectedId = assignmentTargetIdFor({ floorplanId, targetKind, sourceId });
  if (assignmentTargetId !== expectedId) {
    throw new Error("assignmentTarget.assignmentTargetId must be deterministic");
  }
  return {
    assignmentTargetId,
    targetKind,
    sourceId,
    displayLabel: requireString(target.displayLabel, "assignmentTarget.displayLabel"),
    floorplanId,
    ...(target.routeNodeId == null ? {} : { routeNodeId: requireString(target.routeNodeId, "assignmentTarget.routeNodeId") }),
    active: requireBoolean(target.active, "assignmentTarget.active")
  };
}

export function validateAssignmentTargetList(value: unknown): AssignmentTargetContract[] {
  const targets = requireArray(value, "assignmentTargets").map(validateAssignmentTargetContract);
  const ids = targets.map((target) => target.assignmentTargetId);
  if (new Set(ids).size !== ids.length) {
    throw new Error("assignmentTargets must not contain duplicate assignmentTargetId values");
  }
  return targets.slice().sort((left, right) => left.assignmentTargetId.localeCompare(right.assignmentTargetId));
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

function requireBoolean(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`${label} must be a boolean`);
  }
  return value;
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

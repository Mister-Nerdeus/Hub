export const MANUAL_STAFF_ROLES = [
  "rn",
  "charge_nurse",
  "tech",
  "provider",
  "support"
] as const;

export type ManualStaffRole = (typeof MANUAL_STAFF_ROLES)[number];

export type ManualStaffMemberContract = {
  staffMemberId: string;
  displayName: string;
  role: ManualStaffRole;
  active: boolean;
  notes?: string;
};

export function validateManualStaffMemberContract(value: unknown): ManualStaffMemberContract {
  const staff = requireRecord(value, "manualStaffMember");
  requireAllowedKeys(staff, "manualStaffMember", ["staffMemberId", "displayName", "role", "active", "notes"]);
  return {
    staffMemberId: requireString(staff.staffMemberId, "manualStaffMember.staffMemberId"),
    displayName: requireString(staff.displayName, "manualStaffMember.displayName"),
    role: requireEnum(staff.role, MANUAL_STAFF_ROLES, "manualStaffMember.role"),
    active: requireBoolean(staff.active, "manualStaffMember.active"),
    ...(staff.notes == null ? {} : { notes: requireString(staff.notes, "manualStaffMember.notes") })
  };
}

export function validateManualStaffMembers(value: unknown): ManualStaffMemberContract[] {
  const staffMembers = requireArray(value, "manualStaffMembers").map(validateManualStaffMemberContract);
  const ids = staffMembers.map((staff) => staff.staffMemberId);
  if (new Set(ids).size !== ids.length) {
    throw new Error("manualStaffMembers must not contain duplicate staffMemberId values");
  }
  return staffMembers.slice().sort((left, right) => left.staffMemberId.localeCompare(right.staffMemberId));
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

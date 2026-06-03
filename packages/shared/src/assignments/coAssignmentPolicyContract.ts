import {
  ASSIGNMENT_TARGET_KINDS,
  type AssignmentTargetKind
} from "./assignmentTargetContract.js";

export type CoAssignmentPolicyMode =
  | "single_primary_per_patient_target"
  | "allow_multiple_manual_staff";

export type CoAssignmentPolicyContract = {
  policyId: string;
  mode: CoAssignmentPolicyMode;
  allowMultipleForTargetKinds: AssignmentTargetKind[];
  warningOnly: boolean;
};

export const DEFAULT_CO_ASSIGNMENT_POLICY: CoAssignmentPolicyContract = {
  policyId: "default-manual-co-assignment-policy",
  mode: "single_primary_per_patient_target",
  allowMultipleForTargetKinds: ["support_area", "zone"],
  warningOnly: true
};

const CO_ASSIGNMENT_POLICY_MODES = [
  "single_primary_per_patient_target",
  "allow_multiple_manual_staff"
] as const;

export function validateCoAssignmentPolicyContract(value: unknown): CoAssignmentPolicyContract {
  const policy = requireRecord(value, "coAssignmentPolicy");
  requireAllowedKeys(policy, "coAssignmentPolicy", [
    "policyId",
    "mode",
    "allowMultipleForTargetKinds",
    "warningOnly"
  ]);
  const allowMultipleForTargetKinds = requireArray(
    policy.allowMultipleForTargetKinds,
    "coAssignmentPolicy.allowMultipleForTargetKinds"
  ).map((targetKind) =>
    requireEnum(targetKind, ASSIGNMENT_TARGET_KINDS, "coAssignmentPolicy.allowMultipleForTargetKinds")
  );
  return {
    policyId: requireString(policy.policyId, "coAssignmentPolicy.policyId"),
    mode: requireEnum(policy.mode, CO_ASSIGNMENT_POLICY_MODES, "coAssignmentPolicy.mode"),
    allowMultipleForTargetKinds: [...new Set(allowMultipleForTargetKinds)].sort(),
    warningOnly: requireBoolean(policy.warningOnly, "coAssignmentPolicy.warningOnly")
  };
}

export function coAssignmentPolicyAllowsMultipleStaff(
  policy: CoAssignmentPolicyContract,
  targetKind: AssignmentTargetKind
): boolean {
  const validPolicy = validateCoAssignmentPolicyContract(policy);
  return validPolicy.allowMultipleForTargetKinds.includes(targetKind);
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

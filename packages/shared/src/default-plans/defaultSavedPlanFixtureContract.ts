import { validatePlanContract, type PlanContract } from "../contracts.js";
import { validateOperationalRuntimeText } from "../no-phi/runtimeTextGuard.js";

export const DEFAULT_SAVED_PLAN_IMPORT_STATUSES = [
  "draft_converted",
  "ready_for_review",
  "validated_default"
] as const;

export type DefaultSavedPlanImportStatus = (typeof DEFAULT_SAVED_PLAN_IMPORT_STATUSES)[number];
export type DefaultSavedPlanAuditStatus = "validated_default";

export type DefaultSavedPlanFixtureContract = {
  schemaVersion: "1.0.0";
  defaultPlanRecordId: string;
  sourcePlanId: string;
  mappingId: string;
  readOnly: true;
  importStatus: DefaultSavedPlanImportStatus;
  auditStatus: DefaultSavedPlanAuditStatus;
  plan: PlanContract;
  limitations: string[];
};

export type DefaultSavedPlanFixtureValidationReferences = {
  sourcePlanIds?: ReadonlySet<string>;
  mappingIds?: ReadonlySet<string>;
};

export function validateDefaultSavedPlanFixtureContract(
  value: unknown,
  references: DefaultSavedPlanFixtureValidationReferences = {}
): DefaultSavedPlanFixtureContract {
  const wrapper = requireRecord(value, "defaultSavedPlanFixture");
  requireExactKeys(wrapper, "defaultSavedPlanFixture", [
    "schemaVersion",
    "defaultPlanRecordId",
    "sourcePlanId",
    "mappingId",
    "readOnly",
    "importStatus",
    "auditStatus",
    "plan",
    "limitations"
  ]);

  requireLiteral(wrapper.schemaVersion, "1.0.0", "schemaVersion");
  const defaultPlanRecordId = requireString(
    wrapper.defaultPlanRecordId,
    "defaultPlanRecordId"
  );
  if (!defaultPlanRecordId.startsWith("default-plan-")) {
    throw new Error("defaultPlanRecordId must use the default-plan- namespace");
  }

  const sourcePlanId = requireString(wrapper.sourcePlanId, "sourcePlanId");
  if (references.sourcePlanIds && !references.sourcePlanIds.has(sourcePlanId)) {
    throw new Error("sourcePlanId must reference a registered source plan");
  }

  const mappingId = requireString(wrapper.mappingId, "mappingId");
  if (references.mappingIds && !references.mappingIds.has(mappingId)) {
    throw new Error("mappingId must reference a registered source mapping");
  }

  requireLiteral(wrapper.readOnly, true, "readOnly");
  requireEnum(
    wrapper.importStatus,
    DEFAULT_SAVED_PLAN_IMPORT_STATUSES,
    "importStatus"
  );
  requireLiteral(wrapper.auditStatus, "validated_default", "auditStatus");
  if (wrapper.importStatus !== wrapper.auditStatus) {
    throw new Error("importStatus must match auditStatus");
  }

  const plan = validatePlanContract(wrapper.plan);
  if (!plan.planId.startsWith("default-er-layout-plan-")) {
    throw new Error("plan.planId must use the default-er-layout-plan- namespace");
  }

  const limitations = requireArray(wrapper.limitations, "limitations");
  if (limitations.length === 0) {
    throw new Error("limitations requires at least one entry");
  }
  limitations.forEach((limitation, index) => {
    validateOperationalRuntimeText(
      requireString(limitation, `limitations[${index}]`),
      `limitations[${index}]`
    );
  });

  return {
    ...wrapper,
    plan,
    limitations: limitations as string[]
  } as DefaultSavedPlanFixtureContract;
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function requireExactKeys(value: Record<string, unknown>, label: string, allowedKeys: string[]): void {
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
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}

function requireLiteral<T extends string | boolean>(
  value: unknown,
  expected: T,
  label: string
): T {
  if (value !== expected) {
    throw new Error(`${label} must be ${expected}`);
  }
  return expected;
}

function requireEnum<T extends string>(
  value: unknown,
  allowedValues: readonly T[],
  label: string
): T {
  if (typeof value !== "string" || !allowedValues.includes(value as T)) {
    throw new Error(`${label} must be one of ${allowedValues.join(", ")}`);
  }
  return value as T;
}

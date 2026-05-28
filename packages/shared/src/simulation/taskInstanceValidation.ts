import type { ScenarioCapacityIntegration } from "../scenarios/scenarioCapacityIntegration.js";
import {
  DRY_RUN_TASK_INSTANCE_SCHEMA_VERSION,
  type DryRunTaskInstance,
  type DryRunTaskInstanceSet
} from "./taskInstanceGeneration.js";

export function validateDryRunTaskInstanceSet(
  value: unknown,
  context: { capacity: ScenarioCapacityIntegration }
): DryRunTaskInstanceSet {
  const set = requireRecord(value, "dryRunTaskInstanceSet");
  requireExactKeys(set, "dryRunTaskInstanceSet", [
    "schemaVersion",
    "taskInstanceSetId",
    "canonicalScenarioSeedId",
    "roomLoadContractId",
    "activityProfileId",
    "deterministicSeedId",
    "source",
    "instances",
    "usesRawRoomCounts",
    "usesStorageOrSupportForTasks",
    "syntheticDataOnly",
    "optimizerStatus"
  ]);
  const instances = requireArray(set.instances, "instances").map((instance) =>
    validateDryRunTaskInstance(instance, context)
  );
  requireUnique(
    "dry-run task instance ids",
    instances.map((instance) => instance.taskInstanceId)
  );
  return {
    schemaVersion: requireLiteral(set.schemaVersion, DRY_RUN_TASK_INSTANCE_SCHEMA_VERSION, "schemaVersion"),
    taskInstanceSetId: requireLiteral(
      set.taskInstanceSetId,
      "dry-run-task-instances-canonical-plan-1",
      "taskInstanceSetId"
    ),
    canonicalScenarioSeedId: requireLiteral(
      set.canonicalScenarioSeedId,
      "scenario-seed-canonical-plan-1-foundation",
      "canonicalScenarioSeedId"
    ),
    roomLoadContractId: requireLiteral(
      set.roomLoadContractId,
      "room-load-starter-canonical-plan-1",
      "roomLoadContractId"
    ),
    activityProfileId: requireEnum(set.activityProfileId, ["typical", "busy", "slammed"], "activityProfileId"),
    deterministicSeedId: requireLiteral(
      set.deterministicSeedId,
      "deterministic-dry-run-seed-canonical-plan-1",
      "deterministicSeedId"
    ),
    source: requireLiteral(set.source, "room-load starter synthetic input", "source"),
    instances,
    usesRawRoomCounts: requireBooleanLiteral(set.usesRawRoomCounts, false, "usesRawRoomCounts"),
    usesStorageOrSupportForTasks: requireBooleanLiteral(
      set.usesStorageOrSupportForTasks,
      false,
      "usesStorageOrSupportForTasks"
    ),
    syntheticDataOnly: requireBooleanLiteral(set.syntheticDataOnly, true, "syntheticDataOnly"),
    optimizerStatus: requireLiteral(set.optimizerStatus, "not_started", "optimizerStatus")
  };
}

function validateDryRunTaskInstance(
  value: unknown,
  context: { capacity: ScenarioCapacityIntegration }
): DryRunTaskInstance {
  const instance = requireRecord(value, "dryRunTaskInstance");
  requireExactKeys(instance, "dryRunTaskInstance", [
    "taskInstanceId",
    "loadableBedPositionId",
    "templateId",
    "syntheticTimestepOffsetMinutes",
    "durationPlaceholderMinutes",
    "intensityPlaceholder",
    "dryRunStatus",
    "syntheticDataOnly",
    "clinicalClaim",
    "outcomePredictionClaim",
    "optimizerStatus"
  ]);
  const loadableBedPositionId = requireString(instance.loadableBedPositionId, "loadableBedPositionId");
  if (!context.capacity.assignmentEligibleBedPositionIds.includes(loadableBedPositionId)) {
    throw new Error("dry-run task instance must reference assignment-eligible bed positions only");
  }
  if (context.capacity.excludedObjectIds.includes(loadableBedPositionId)) {
    throw new Error("dry-run task instance must not reference excluded spaces");
  }
  return {
    taskInstanceId: requireString(instance.taskInstanceId, "taskInstanceId"),
    loadableBedPositionId,
    templateId: requireString(instance.templateId, "templateId"),
    syntheticTimestepOffsetMinutes: requireInteger(
      instance.syntheticTimestepOffsetMinutes,
      "syntheticTimestepOffsetMinutes",
      0
    ),
    durationPlaceholderMinutes: requireInteger(
      instance.durationPlaceholderMinutes,
      "durationPlaceholderMinutes",
      1
    ),
    intensityPlaceholder: requireEnum(instance.intensityPlaceholder, ["low", "medium", "high"], "intensityPlaceholder"),
    dryRunStatus: requireLiteral(
      instance.dryRunStatus,
      "internal_dry_run_shell_only",
      "dryRunStatus"
    ),
    syntheticDataOnly: requireBooleanLiteral(instance.syntheticDataOnly, true, "syntheticDataOnly"),
    clinicalClaim: requireBooleanLiteral(instance.clinicalClaim, false, "clinicalClaim"),
    outcomePredictionClaim: requireBooleanLiteral(
      instance.outcomePredictionClaim,
      false,
      "outcomePredictionClaim"
    ),
    optimizerStatus: requireLiteral(instance.optimizerStatus, "not_started", "optimizerStatus")
  };
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
    if (!allowed.has(key)) throw new Error(`${label}.${key} is not allowed`);
  }
}

function requireArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
  return value;
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}

function requireInteger(value: unknown, label: string, min: number): number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new Error(`${label} must be an integer`);
  }
  if (value < min) throw new Error(`${label} must be greater than or equal to ${min}`);
  return value;
}

function requireLiteral<T extends string>(value: unknown, expected: T, label: string): T {
  if (value !== expected) throw new Error(`${label} must be ${expected}`);
  return expected;
}

function requireBooleanLiteral<T extends boolean>(value: unknown, expected: T, label: string): T {
  if (value !== expected) throw new Error(`${label} must be ${String(expected)}`);
  return expected;
}

function requireEnum<T extends string>(value: unknown, allowed: readonly T[], label: string): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new Error(`${label} must be one of ${allowed.join(", ")}`);
  }
  return value as T;
}

function requireUnique(label: string, values: string[]): void {
  if (new Set(values).size !== values.length) throw new Error(`duplicate ${label} are not allowed`);
}

import {
  DRY_RUN_DELAY_BANDS,
  DRY_RUN_QUEUE_PLACEHOLDER_SCHEMA_VERSION,
  type DryRunQueuePlaceholder
} from "./dryRunQueuePlaceholder.js";

export function validateDryRunQueuePlaceholder(value: unknown): DryRunQueuePlaceholder {
  const queue = requireRecord(value, "dryRunQueuePlaceholder");
  requireExactKeys(queue, "dryRunQueuePlaceholder", [
    "schemaVersion",
    "queuePlaceholderId",
    "deterministicSeedId",
    "queuedTaskIds",
    "delayedTaskIds",
    "syntheticDelayBand",
    "placeholderPressureLabel",
    "taskSetSnapshot",
    "outcomeClaim",
    "clinicalSafetyScoreStatus",
    "staffingComplianceStatus",
    "optimizerStatus",
    "assignmentRecommendationStatus",
    "syntheticDataOnly"
  ]);
  const queuedTaskIds = validateStringArray(queue.queuedTaskIds, "queuedTaskIds");
  const delayedTaskIds = validateStringArray(queue.delayedTaskIds, "delayedTaskIds");
  const queued = new Set(queuedTaskIds);
  for (const taskId of delayedTaskIds) {
    if (!queued.has(taskId)) throw new Error("delayed task placeholders must reference queued task ids");
  }
  return {
    schemaVersion: requireLiteral(
      queue.schemaVersion,
      DRY_RUN_QUEUE_PLACEHOLDER_SCHEMA_VERSION,
      "schemaVersion"
    ),
    queuePlaceholderId: requireLiteral(
      queue.queuePlaceholderId,
      "dry-run-queue-placeholder-canonical-plan-1",
      "queuePlaceholderId"
    ),
    deterministicSeedId: requireLiteral(
      queue.deterministicSeedId,
      "deterministic-dry-run-seed-canonical-plan-1",
      "deterministicSeedId"
    ),
    queuedTaskIds,
    delayedTaskIds,
    syntheticDelayBand: requireEnum(queue.syntheticDelayBand, DRY_RUN_DELAY_BANDS, "syntheticDelayBand"),
    placeholderPressureLabel: requireEnum(
      queue.placeholderPressureLabel,
      ["placeholder_light", "placeholder_moderate", "placeholder_heavy"],
      "placeholderPressureLabel"
    ),
    taskSetSnapshot: queue.taskSetSnapshot as DryRunQueuePlaceholder["taskSetSnapshot"],
    outcomeClaim: requireBooleanLiteral(queue.outcomeClaim, false, "outcomeClaim"),
    clinicalSafetyScoreStatus: requireLiteral(
      queue.clinicalSafetyScoreStatus,
      "not_started",
      "clinicalSafetyScoreStatus"
    ),
    staffingComplianceStatus: requireLiteral(
      queue.staffingComplianceStatus,
      "not_started",
      "staffingComplianceStatus"
    ),
    optimizerStatus: requireLiteral(queue.optimizerStatus, "not_started", "optimizerStatus"),
    assignmentRecommendationStatus: requireLiteral(
      queue.assignmentRecommendationStatus,
      "not_started",
      "assignmentRecommendationStatus"
    ),
    syntheticDataOnly: requireBooleanLiteral(queue.syntheticDataOnly, true, "syntheticDataOnly")
  };
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be an object`);
  return value as Record<string, unknown>;
}

function requireExactKeys(value: Record<string, unknown>, label: string, allowedKeys: string[]): void {
  const allowed = new Set(allowedKeys);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) throw new Error(`${label}.${key} is not allowed`);
  }
}

function validateStringArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
  const values = value.map((item, index) => {
    if (typeof item !== "string" || item.length === 0) throw new Error(`${label}[${index}] must be a non-empty string`);
    return item;
  });
  if (new Set(values).size !== values.length) throw new Error(`duplicate ${label} are not allowed`);
  return values;
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
  if (typeof value !== "string" || !allowed.includes(value as T)) throw new Error(`${label} must be one of ${allowed.join(", ")}`);
  return value as T;
}

import {
  createDeterministicDryRunSequence,
  createDeterministicRatioRuntimeSequence
} from "./deterministicSequence.js";
import type {
  DeterministicDryRunSeedContract,
  RatioRuntimeSeedContract
} from "./deterministicSeedContract.js";
import type { DryRunTaskInstanceSet } from "./taskInstanceGeneration.js";

export const DRY_RUN_QUEUE_PLACEHOLDER_SCHEMA_VERSION = "1.0.0" as const;
export const DRY_RUN_DELAY_BANDS = ["placeholder_low", "placeholder_medium", "placeholder_high"] as const;
export type DryRunDelayBand = (typeof DRY_RUN_DELAY_BANDS)[number];
export type DryRunPressureLabel = "placeholder_light" | "placeholder_moderate" | "placeholder_heavy";

export type DryRunQueuePlaceholder = {
  schemaVersion: typeof DRY_RUN_QUEUE_PLACEHOLDER_SCHEMA_VERSION;
  queuePlaceholderId: "dry-run-queue-placeholder-canonical-plan-1";
  deterministicSeedId: DeterministicDryRunSeedContract["seedId"] | RatioRuntimeSeedContract["seedId"];
  queuedTaskIds: readonly string[];
  delayedTaskIds: readonly string[];
  syntheticDelayBand: DryRunDelayBand;
  placeholderPressureLabel: DryRunPressureLabel;
  taskSetSnapshot: DryRunTaskInstanceSet;
  outcomeClaim: false;
  clinicalSafetyScoreStatus: "not_started";
  staffingComplianceStatus: "not_started";
  optimizerStatus: "not_started";
  assignmentRecommendationStatus: "not_started";
  syntheticDataOnly: true;
};

export function buildDryRunQueuePlaceholder(input: {
  taskSet: DryRunTaskInstanceSet;
  seedContract: DeterministicDryRunSeedContract | RatioRuntimeSeedContract;
}): DryRunQueuePlaceholder {
  const sequenceCount = Math.max(1, input.taskSet.instances.length);
  const sequence =
    "namespace" in input.seedContract && input.seedContract.namespace === "ratio_runtime"
      ? createDeterministicRatioRuntimeSequence(
          input.seedContract,
          `queue-placeholder:${input.taskSet.taskInstanceSetId}`,
          sequenceCount
        )
      : createDeterministicDryRunSequence(
          input.seedContract as DeterministicDryRunSeedContract,
          `queue-placeholder:${input.taskSet.taskInstanceSetId}`,
          sequenceCount
        );
  const ordered = input.taskSet.instances
    .map((task, index) => ({
      taskId: task.taskInstanceId,
      orderValue: sequence[index] ?? 0,
      minute: task.syntheticTimestepOffsetMinutes
    }))
    .sort((left, right) => left.minute - right.minute || left.orderValue - right.orderValue || left.taskId.localeCompare(right.taskId))
    .map((entry) => entry.taskId);
  const delayedTaskIds = ordered.filter((_, index) => index % 3 === 2);
  return {
    schemaVersion: DRY_RUN_QUEUE_PLACEHOLDER_SCHEMA_VERSION,
    queuePlaceholderId: "dry-run-queue-placeholder-canonical-plan-1",
    deterministicSeedId: input.seedContract.seedId,
    queuedTaskIds: ordered,
    delayedTaskIds,
    syntheticDelayBand: delayBandForCount(delayedTaskIds.length),
    placeholderPressureLabel: pressureLabelForCount(ordered.length),
    taskSetSnapshot: input.taskSet,
    outcomeClaim: false,
    clinicalSafetyScoreStatus: "not_started",
    staffingComplianceStatus: "not_started",
    optimizerStatus: "not_started",
    assignmentRecommendationStatus: "not_started",
    syntheticDataOnly: true
  };
}

function delayBandForCount(count: number): DryRunDelayBand {
  if (count <= 1) return "placeholder_low";
  if (count <= 3) return "placeholder_medium";
  return "placeholder_high";
}

function pressureLabelForCount(count: number): DryRunPressureLabel {
  if (count <= 4) return "placeholder_light";
  if (count <= 10) return "placeholder_moderate";
  return "placeholder_heavy";
}

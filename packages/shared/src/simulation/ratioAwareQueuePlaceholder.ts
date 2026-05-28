import type { RatioPresetContract } from "../scenarios/ratioPresetContract.js";
import type { ScenarioCapacityIntegration } from "../scenarios/scenarioCapacityIntegration.js";
import type { NurseRuntimeStateSet } from "./nurseRuntimeStateContract.js";
import { processNurseTaskPlaceholders } from "./nurseTaskProcessingLoop.js";
import type { RatioRuntimeSeedContract } from "./deterministicSeedContract.js";
import type { DryRunTaskInstanceSet } from "./taskInstanceGeneration.js";

export const RATIO_AWARE_QUEUE_PLACEHOLDER_SCHEMA_VERSION = "1.0.0" as const;
export type RatioAwarePressureBand = "placeholder_light" | "placeholder_moderate" | "placeholder_heavy";

export type RatioAwareQueuePlaceholderSummary = {
  schemaVersion: typeof RATIO_AWARE_QUEUE_PLACEHOLDER_SCHEMA_VERSION;
  queueSummaryId: string;
  ratioPresetId: RatioPresetContract["presetId"];
  ratioRuntimeSeedId: RatioRuntimeSeedContract["seedId"];
  generatedTaskCount: number;
  syntheticNurseRuntimeGroupCount: number;
  queuedPlaceholderCount: number;
  delayedPlaceholderCount: number;
  unassignedPlaceholderCount: number;
  placeholderPressureBand: RatioAwarePressureBand;
  limitationCopy: readonly string[];
  outcomeClaim: false;
  clinicalSafetyClaim: false;
  staffingComplianceClaim: false;
  recommendationStatus: "not_started";
  optimizerStatus: "not_started";
  syntheticDataOnly: true;
};

export function calculateRatioAwareQueuePlaceholder(input: {
  taskSet: DryRunTaskInstanceSet;
  runtimeStates: NurseRuntimeStateSet;
  ratioPreset: RatioPresetContract;
  ratioRuntimeSeed: RatioRuntimeSeedContract;
  capacity: ScenarioCapacityIntegration;
}): RatioAwareQueuePlaceholderSummary {
  const processing = processNurseTaskPlaceholders({
    taskSet: input.taskSet,
    runtimeStates: input.runtimeStates,
    capacity: input.capacity,
    ratioRuntimeSeed: input.ratioRuntimeSeed
  });
  const queuedPlaceholderCount = processing.busyNurseQueuedTaskIds.length;
  const delayedPlaceholderCount = processing.timeline.filter(
    (event) => event.eventLabel === "task_placeholder_delayed"
  ).length;
  const unassignedPlaceholderCount = processing.unassignedPlaceholderTaskIds.length;
  const pressureCount = queuedPlaceholderCount + delayedPlaceholderCount;
  return {
    schemaVersion: RATIO_AWARE_QUEUE_PLACEHOLDER_SCHEMA_VERSION,
    queueSummaryId: `ratio-aware-queue-${input.ratioPreset.presetId}`,
    ratioPresetId: input.ratioPreset.presetId,
    ratioRuntimeSeedId: input.ratioRuntimeSeed.seedId,
    generatedTaskCount: input.taskSet.instances.length,
    syntheticNurseRuntimeGroupCount: input.runtimeStates.states.length,
    queuedPlaceholderCount,
    delayedPlaceholderCount,
    unassignedPlaceholderCount,
    placeholderPressureBand: pressureBand(pressureCount, input.taskSet.instances.length),
    limitationCopy: [
      "Queue pressure is a synthetic internal placeholder only.",
      "Ratio-specific runtime state can change queue and delay placeholder counts.",
      "No staffing recommendation, optimizer output, clinical safety claim, staffing compliance certification, or patient outcome prediction is produced."
    ],
    outcomeClaim: false,
    clinicalSafetyClaim: false,
    staffingComplianceClaim: false,
    recommendationStatus: "not_started",
    optimizerStatus: "not_started",
    syntheticDataOnly: true
  };
}

function pressureBand(pressureCount: number, taskCount: number): RatioAwarePressureBand {
  if (taskCount === 0 || pressureCount / taskCount <= 0.15) return "placeholder_light";
  if (pressureCount / taskCount <= 0.45) return "placeholder_moderate";
  return "placeholder_heavy";
}

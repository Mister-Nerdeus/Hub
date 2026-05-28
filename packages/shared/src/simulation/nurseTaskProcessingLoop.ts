import type { ScenarioCapacityIntegration } from "../scenarios/scenarioCapacityIntegration.js";
import { createDeterministicRatioRuntimeSequence } from "./deterministicSequence.js";
import type { RatioRuntimeSeedContract } from "./deterministicSeedContract.js";
import type { InternalDryRunTimelineEvent } from "./internalDryRunExecutor.js";
import type { NurseRuntimeStateSet } from "./nurseRuntimeStateContract.js";
import type { DryRunTaskInstance, DryRunTaskInstanceSet } from "./taskInstanceGeneration.js";

export const NURSE_TASK_PROCESSING_LOOP_SCHEMA_VERSION = "1.0.0" as const;

export type NurseTaskProcessingResult = {
  schemaVersion: typeof NURSE_TASK_PROCESSING_LOOP_SCHEMA_VERSION;
  processingLoopId: "nurse-task-processing-loop-canonical-plan-1";
  timeline: readonly InternalDryRunTimelineEvent[];
  busyNurseQueuedTaskIds: readonly string[];
  unassignedPlaceholderTaskIds: readonly string[];
  manualAssignmentBridgeId: NurseRuntimeStateSet["manualAssignmentBridgeId"];
  assignmentSource: "manual_assignment_bridge_only";
  reassignmentSearchStatus: "not_started";
  recommendationStatus: "not_started";
  optimizerStatus: "not_started";
  staffingComplianceClaim: false;
  clinicalSafetyClaim: false;
  syntheticDataOnly: true;
};

export function processNurseTaskPlaceholders(input: {
  taskSet: DryRunTaskInstanceSet;
  runtimeStates: NurseRuntimeStateSet;
  capacity: ScenarioCapacityIntegration;
  ratioRuntimeSeed?: RatioRuntimeSeedContract;
}): NurseTaskProcessingResult {
  const eligible = new Set(input.capacity.assignmentEligibleBedPositionIds);
  const excluded = new Set(input.capacity.excludedObjectIds);
  const coverage = new Map<string, string>();
  const busyUntilByNurse = new Map<string, number>();
  for (const state of input.runtimeStates.states) {
    busyUntilByNurse.set(state.syntheticNurseId, 0);
    for (const bedId of state.assignedBedPositionIds) coverage.set(bedId, state.syntheticNurseId);
  }
  const timeline: InternalDryRunTimelineEvent[] = [];
  const busyNurseQueuedTaskIds: string[] = [];
  const unassignedPlaceholderTaskIds: string[] = [];

  for (const task of orderTasksForRuntime(input.taskSet.instances, input.ratioRuntimeSeed)) {
    if (!eligible.has(task.loadableBedPositionId) || excluded.has(task.loadableBedPositionId)) {
      throw new Error("nurse task processing loop accepts selector-eligible bed positions only");
    }
    const nurseId = coverage.get(task.loadableBedPositionId) ?? null;
    const readyMinute = task.syntheticTimestepOffsetMinutes;
    pushEvent(timeline, "task_placeholder_ready", readyMinute, task.taskInstanceId, task.loadableBedPositionId, nurseId);
    if (nurseId == null) {
      unassignedPlaceholderTaskIds.push(task.taskInstanceId);
      pushEvent(timeline, "task_placeholder_unassigned", readyMinute, task.taskInstanceId, task.loadableBedPositionId, null);
      continue;
    }
    const busyUntil = busyUntilByNurse.get(nurseId) ?? 0;
    const startMinute = Math.max(readyMinute, busyUntil);
    if (startMinute > readyMinute) {
      busyNurseQueuedTaskIds.push(task.taskInstanceId);
      pushEvent(timeline, "task_placeholder_queued", readyMinute, task.taskInstanceId, task.loadableBedPositionId, nurseId);
      pushEvent(timeline, "task_placeholder_delayed", startMinute, task.taskInstanceId, task.loadableBedPositionId, nurseId);
    }
    pushEvent(timeline, "task_placeholder_started", startMinute, task.taskInstanceId, task.loadableBedPositionId, nurseId);
    busyUntilByNurse.set(nurseId, startMinute + task.durationPlaceholderMinutes);
    pushEvent(timeline, "task_placeholder_completed", startMinute + task.durationPlaceholderMinutes, task.taskInstanceId, task.loadableBedPositionId, nurseId);
  }

  return {
    schemaVersion: NURSE_TASK_PROCESSING_LOOP_SCHEMA_VERSION,
    processingLoopId: "nurse-task-processing-loop-canonical-plan-1",
    timeline: timeline.sort((left, right) =>
      left.syntheticMinuteOffset - right.syntheticMinuteOffset ||
      left.eventLabel.localeCompare(right.eventLabel) ||
      left.taskInstanceId.localeCompare(right.taskInstanceId)
    ),
    busyNurseQueuedTaskIds,
    unassignedPlaceholderTaskIds,
    manualAssignmentBridgeId: input.runtimeStates.manualAssignmentBridgeId,
    assignmentSource: "manual_assignment_bridge_only",
    reassignmentSearchStatus: "not_started",
    recommendationStatus: "not_started",
    optimizerStatus: "not_started",
    staffingComplianceClaim: false,
    clinicalSafetyClaim: false,
    syntheticDataOnly: true
  };
}

function orderTasksForRuntime(
  tasks: readonly DryRunTaskInstance[],
  ratioRuntimeSeed: RatioRuntimeSeedContract | undefined
): readonly DryRunTaskInstance[] {
  if (ratioRuntimeSeed == null) {
    return tasks;
  }
  const orderByTaskId = new Map(
    tasks.map((task) => [
      task.taskInstanceId,
      createDeterministicRatioRuntimeSequence(
        ratioRuntimeSeed,
        `nurse-task-processing-loop:same-minute-order:${task.taskInstanceId}`,
        1
      )[0] ?? 0
    ])
  );
  return [...tasks].sort((left, right) =>
    left.syntheticTimestepOffsetMinutes - right.syntheticTimestepOffsetMinutes ||
    (orderByTaskId.get(left.taskInstanceId) ?? 0) - (orderByTaskId.get(right.taskInstanceId) ?? 0) ||
    left.taskInstanceId.localeCompare(right.taskInstanceId)
  );
}

function pushEvent(
  timeline: InternalDryRunTimelineEvent[],
  eventLabel: InternalDryRunTimelineEvent["eventLabel"],
  syntheticMinuteOffset: number,
  taskInstanceId: string,
  loadableBedPositionId: string,
  syntheticNurseId: string | null
): void {
  timeline.push({
    eventId: `dry-run-event-${String(timeline.length + 1).padStart(4, "0")}`,
    eventLabel,
    syntheticMinuteOffset,
    taskInstanceId,
    loadableBedPositionId,
    syntheticNurseId,
    dryRunStatus: "internal_dry_run_only",
    syntheticDataOnly: true
  });
}

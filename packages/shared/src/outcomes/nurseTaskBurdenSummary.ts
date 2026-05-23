import {
  validateSimulationRunContract,
  type SimulationEventContract,
  type SimulationRunContract
} from "../simulation/simulationRunContract.js";
import {
  buildOperationalMetric,
  roundToTwo,
  sortedEntries
} from "./outcomeMetricsBuilder.js";
import {
  validateOperationalMetricContracts,
  type OperationalMetricContract
} from "./operationalMetricContract.js";

type BuildNurseTaskBurdenSummaryInput = {
  simulationRun: SimulationRunContract;
};

export type BuildNurseTaskBurdenSummaryOutput = {
  schemaVersion: "1.0.0";
  summaryLabel: string;
  metrics: OperationalMetricContract[];
};

export const NURSE_TASK_BURDEN_METRIC_PREFIXES = {
  directMinutes: "direct_task_minutes_by_nurse" as const,
  completedCount: "completed_task_count_by_nurse" as const,
  delayedCount: "delayed_task_count_by_nurse" as const,
  missedCount: "missed_task_count_by_nurse" as const,
  queueWaitMinutes: "queue_wait_minutes_by_nurse" as const,
  assignedCount: "assigned_task_count_by_nurse" as const
};

const NURSE_TASK_BURDEN_LIMITATIONS = [
  "Nurse task burden is an operational workload proxy derived from simulation events.",
  "Nurse IDs are synthetic role labels from local fixtures.",
  "Metrics summarize task minutes, task counts, queue wait, delay, and missed work only."
];

type NurseTaskBurdenBuckets = {
  directMinutesByNurse: Record<string, number>;
  completedTasksByNurse: Record<string, number>;
  delayedTasksByNurse: Record<string, number>;
  missedTasksByNurse: Record<string, number>;
  queueWaitByNurse: Record<string, number>;
  assignedTasksByNurse: Record<string, number>;
};

export function buildNurseTaskBurdenSummary(
  input: BuildNurseTaskBurdenSummaryInput
): BuildNurseTaskBurdenSummaryOutput {
  const run = validateSimulationRunContract(input.simulationRun);

  const knownNurses = new Set<string>();
  const taskToNurse = new Map<string, string>();
  const directMinutesByNurseTask = new Map<string, number>();
  const completedTaskKeys = new Set<string>();
  const delayedTaskKeys = new Set<string>();
  const missedTaskKeys = new Set<string>();

  for (const event of run.events) {
    captureNurseAndTaskAssignment(event, knownNurses, taskToNurse);
  }

  const queueWaitByNurse: Record<string, number> = {};

  for (const event of run.events) {
    if (event.eventType === "task") {
      const nurseId = resolveTaskNurse(event.taskId, event.nurseId, taskToNurse);
      if (nurseId == null) {
        continue;
      }

      if (event.action === "completed" && typeof event.durationMinutes === "number") {
        directMinutesByNurseTask.set(taskNurseKey(nurseId, event.taskId), event.durationMinutes);
      }
      if (event.action === "completed") {
        completedTaskKeys.add(taskNurseKey(nurseId, event.taskId));
      }
      if (event.action === "delayed") {
        delayedTaskKeys.add(taskNurseKey(nurseId, event.taskId));
      }
      if (event.action === "missed") {
        missedTaskKeys.add(taskNurseKey(nurseId, event.taskId));
      }
    }

    if (event.eventType === "nurse" && event.taskId != null) {
      const key = taskNurseKey(event.nurseId, event.taskId);
      if (event.action === "completed_task" && !directMinutesByNurseTask.has(key) && typeof event.durationMinutes === "number") {
        directMinutesByNurseTask.set(key, event.durationMinutes);
      }
      if (event.action === "completed_task") {
        completedTaskKeys.add(key);
      }
    }

    if (event.eventType === "queue" && event.action === "started_from_queue") {
      queueWaitByNurse[event.nurseId] = (queueWaitByNurse[event.nurseId] ?? 0) + (event.waitMinutes ?? 0);
    }
  }

  const buckets = initializeBuckets(knownNurses);

  for (const [key, minutes] of directMinutesByNurseTask) {
    const nurseId = nurseIdFromTaskNurseKey(key);
    buckets.directMinutesByNurse[nurseId] = (buckets.directMinutesByNurse[nurseId] ?? 0) + minutes;
  }
  assignSetCounts(completedTaskKeys, buckets.completedTasksByNurse);
  assignSetCounts(delayedTaskKeys, buckets.delayedTasksByNurse);
  assignSetCounts(missedTaskKeys, buckets.missedTasksByNurse);

  for (const [nurseId, minutes] of Object.entries(queueWaitByNurse)) {
    buckets.queueWaitByNurse[nurseId] = roundToTwo((buckets.queueWaitByNurse[nurseId] ?? 0) + minutes);
  }

  for (const [taskId, nurseId] of taskToNurse) {
    if (taskId.length > 0) {
      buckets.assignedTasksByNurse[nurseId] = (buckets.assignedTasksByNurse[nurseId] ?? 0) + 1;
    }
  }

  const metrics = buildMetrics(buckets);
  validateOperationalMetricContracts(metrics);

  return {
    schemaVersion: "1.0.0",
    summaryLabel: "Nurse task burden summary",
    metrics
  };
}

function captureNurseAndTaskAssignment(
  event: SimulationEventContract,
  knownNurses: Set<string>,
  taskToNurse: Map<string, string>
): void {
  if ("nurseId" in event && typeof event.nurseId === "string") {
    knownNurses.add(event.nurseId);
  }

  if (event.eventType === "task" && typeof event.nurseId === "string") {
    setTaskAssignment(taskToNurse, event.taskId, event.nurseId);
    return;
  }

  if (event.eventType === "nurse" && event.taskId != null) {
    setTaskAssignment(taskToNurse, event.taskId, event.nurseId);
    return;
  }

  if (event.eventType === "queue" || event.eventType === "travel") {
    setTaskAssignment(taskToNurse, event.taskId, event.nurseId);
  }
}

function setTaskAssignment(taskToNurse: Map<string, string>, taskId: string, nurseId: string): void {
  if (!taskToNurse.has(taskId)) {
    taskToNurse.set(taskId, nurseId);
  }
}

function resolveTaskNurse(
  taskId: string,
  eventNurseId: string | null | undefined,
  taskToNurse: Map<string, string>
): string | null {
  if (typeof eventNurseId === "string") {
    return eventNurseId;
  }
  return taskToNurse.get(taskId) ?? null;
}

function initializeBuckets(knownNurses: Set<string>): NurseTaskBurdenBuckets {
  const buckets: NurseTaskBurdenBuckets = {
    directMinutesByNurse: {},
    completedTasksByNurse: {},
    delayedTasksByNurse: {},
    missedTasksByNurse: {},
    queueWaitByNurse: {},
    assignedTasksByNurse: {}
  };

  for (const nurseId of [...knownNurses].sort()) {
    buckets.directMinutesByNurse[nurseId] = 0;
    buckets.completedTasksByNurse[nurseId] = 0;
    buckets.delayedTasksByNurse[nurseId] = 0;
    buckets.missedTasksByNurse[nurseId] = 0;
    buckets.queueWaitByNurse[nurseId] = 0;
    buckets.assignedTasksByNurse[nurseId] = 0;
  }

  return buckets;
}

function assignSetCounts(keys: Set<string>, target: Record<string, number>): void {
  for (const key of keys) {
    const nurseId = nurseIdFromTaskNurseKey(key);
    target[nurseId] = (target[nurseId] ?? 0) + 1;
  }
}

function taskNurseKey(nurseId: string, taskId: string): string {
  return `${nurseId}\u0000${taskId}`;
}

function nurseIdFromTaskNurseKey(key: string): string {
  const nurseId = key.split("\u0000")[0];
  if (nurseId == null || nurseId.length === 0) {
    throw new Error("task nurse key must include a nurse ID");
  }
  return nurseId;
}

function buildMetrics(buckets: NurseTaskBurdenBuckets): OperationalMetricContract[] {
  const metrics: OperationalMetricContract[] = [];

  for (const [nurseId, minutes] of sortedEntries(buckets.directMinutesByNurse)) {
    metrics.push(
      buildOperationalMetric({
        metricId: `${NURSE_TASK_BURDEN_METRIC_PREFIXES.directMinutes}_${nurseId}`,
        label: `Direct task minutes for nurse ${nurseId}`,
        group: "nurse",
        unit: "minutes",
        value: roundToTwo(minutes),
        directionality: "lower_is_better",
        source: "task_event",
        scope: "nurse",
        limitations: [...NURSE_TASK_BURDEN_LIMITATIONS]
      })
    );
  }

  for (const [nurseId, value] of sortedEntries(buckets.completedTasksByNurse)) {
    metrics.push(
      buildOperationalMetric({
        metricId: `${NURSE_TASK_BURDEN_METRIC_PREFIXES.completedCount}_${nurseId}`,
        label: `Completed task count for nurse ${nurseId}`,
        group: "nurse",
        unit: "count",
        value,
        directionality: "lower_is_better",
        source: "task_event",
        scope: "nurse",
        limitations: [...NURSE_TASK_BURDEN_LIMITATIONS]
      })
    );
  }

  for (const [nurseId, value] of sortedEntries(buckets.delayedTasksByNurse)) {
    metrics.push(
      buildOperationalMetric({
        metricId: `${NURSE_TASK_BURDEN_METRIC_PREFIXES.delayedCount}_${nurseId}`,
        label: `Delayed task count for nurse ${nurseId}`,
        group: "nurse",
        unit: "count",
        value,
        directionality: "lower_is_better",
        source: "task_event",
        scope: "nurse",
        limitations: [...NURSE_TASK_BURDEN_LIMITATIONS]
      })
    );
  }

  for (const [nurseId, value] of sortedEntries(buckets.missedTasksByNurse)) {
    metrics.push(
      buildOperationalMetric({
        metricId: `${NURSE_TASK_BURDEN_METRIC_PREFIXES.missedCount}_${nurseId}`,
        label: `Missed task count for nurse ${nurseId}`,
        group: "nurse",
        unit: "count",
        value,
        directionality: "lower_is_better",
        source: "task_event",
        scope: "nurse",
        limitations: [...NURSE_TASK_BURDEN_LIMITATIONS]
      })
    );
  }

  for (const [nurseId, minutes] of sortedEntries(buckets.queueWaitByNurse)) {
    metrics.push(
      buildOperationalMetric({
        metricId: `${NURSE_TASK_BURDEN_METRIC_PREFIXES.queueWaitMinutes}_${nurseId}`,
        label: `Queue wait minutes for nurse ${nurseId}`,
        group: "nurse",
        unit: "minutes",
        value: roundToTwo(minutes),
        directionality: "lower_is_better",
        source: "queue_event",
        scope: "nurse",
        limitations: [...NURSE_TASK_BURDEN_LIMITATIONS]
      })
    );
  }

  for (const [nurseId, value] of sortedEntries(buckets.assignedTasksByNurse)) {
    metrics.push(
      buildOperationalMetric({
        metricId: `${NURSE_TASK_BURDEN_METRIC_PREFIXES.assignedCount}_${nurseId}`,
        label: `Assigned task count for nurse ${nurseId}`,
        group: "nurse",
        unit: "count",
        value,
        directionality: "lower_is_better",
        source: "derived_proxy",
        scope: "nurse",
        limitations: [...NURSE_TASK_BURDEN_LIMITATIONS]
      })
    );
  }

  return metrics;
}

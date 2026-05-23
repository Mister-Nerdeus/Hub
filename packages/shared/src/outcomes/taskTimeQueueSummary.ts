import {
  validateSimulationRunContract,
  type SimulationEventContract,
  type SimulationRunContract
} from "../simulation/simulationRunContract.js";
import {
  buildDynamicOperationalMetric,
  buildRegisteredOperationalMetric,
  OPERATIONAL_OUTCOME_LIMITATIONS,
  roundToTwo,
  sortedEntries
} from "./outcomeMetricsBuilder.js";
import {
  validateOperationalMetricContracts,
  type OperationalMetricContract
} from "./operationalMetricContract.js";

type BuildTaskTimeQueueSummaryInput = {
  simulationRun: SimulationRunContract;
  densityBucketMinutes?: number;
};

export type BuildTaskTimeQueueSummaryOutput = {
  schemaVersion: "1.0.0";
  summaryLabel: string;
  metrics: OperationalMetricContract[];
};

export function buildTaskTimeQueueSummary(
  input: BuildTaskTimeQueueSummaryInput
): BuildTaskTimeQueueSummaryOutput {
  const run = validateSimulationRunContract(input.simulationRun);
  const bucketMinutes = input.densityBucketMinutes ?? 60;

  if (!Number.isInteger(bucketMinutes) || bucketMinutes <= 0) {
    throw new Error("densityBucketMinutes must be a positive integer");
  }

  const taskEvents = run.events.filter(
    (event): event is Extract<SimulationEventContract, { eventType: "task" }> =>
      event.eventType === "task"
  );
  const queueEvents = run.events.filter(
    (event): event is Extract<SimulationEventContract, { eventType: "queue" }> =>
      event.eventType === "queue"
  );
  const travelEvents = run.events.filter(
    (event): event is Extract<SimulationEventContract, { eventType: "travel" }> =>
      event.eventType === "travel"
  );
  const nurseEvents = run.events.filter(
    (event): event is Extract<SimulationEventContract, { eventType: "nurse" }> =>
      event.eventType === "nurse"
  );

  const directMinutesByTask = new Map<string, number>();
  const delayByTask = new Map<string, number>();
  const firstReadyByTask = new Map<string, number>();
  const missedTasks = new Set<string>();

  for (const event of taskEvents) {
    const readyMinute = event.scheduledMinute ?? event.minute;
    const previousReady = firstReadyByTask.get(event.taskId);
    if (previousReady == null || readyMinute < previousReady) {
      firstReadyByTask.set(event.taskId, readyMinute);
    }

    if (event.action === "completed") {
      if (typeof event.durationMinutes === "number") {
        directMinutesByTask.set(event.taskId, event.durationMinutes);
      }
    }
    if (event.action === "delayed") {
      if (typeof event.delayMinutes === "number") {
        delayByTask.set(
          event.taskId,
          (delayByTask.get(event.taskId) ?? 0) + event.delayMinutes
        );
      }
    }
    if (event.action === "missed") {
      missedTasks.add(event.taskId);
    }
  }

  for (const event of nurseEvents) {
    if (event.action === "completed_task" && event.taskId != null) {
      if (!directMinutesByTask.has(event.taskId) && typeof event.durationMinutes === "number") {
        directMinutesByTask.set(event.taskId, event.durationMinutes);
      }
    }
  }

  const queueWaitMinutes = queueEvents.reduce((sum, event) => {
    if (event.action === "started_from_queue") {
      return sum + (event.waitMinutes ?? 0);
    }
    return sum;
  }, 0);

  const taskDensityCounts: Record<string, number> = {};
  for (const scheduledMinute of firstReadyByTask.values()) {
    const bucketStart = Math.floor(scheduledMinute / bucketMinutes) * bucketMinutes;
    const bucketMetricId = `task_density_bucket_${String(bucketStart).padStart(4, "0")}`;
    taskDensityCounts[bucketMetricId] = (taskDensityCounts[bucketMetricId] ?? 0) + 1;
  }

  const directTaskMinutes = roundToTwo(
    [...directMinutesByTask.values()].reduce((sum, minutes) => sum + minutes, 0)
  );
  const taskDelayMinutes = roundToTwo(
    [...delayByTask.values()].reduce((sum, minutes) => sum + minutes, 0)
  );
  const travelToTaskMinutes = roundToTwo(
    travelEvents.reduce((sum, event) => sum + (event.travelMinutes ?? 0), 0)
  );
  const missedTaskCount = missedTasks.size;

  const metrics: OperationalMetricContract[] = [];
  const metricLimitations = [...OPERATIONAL_OUTCOME_LIMITATIONS];

  metrics.push(
    buildRegisteredOperationalMetric({
      metricId: "direct_task_minutes",
      label: "Direct task minutes",
      value: directTaskMinutes,
      limitations: metricLimitations
    })
  );

  metrics.push(
    buildRegisteredOperationalMetric({
      metricId: "queue_wait_minutes",
      label: "Queue wait minutes",
      value: roundToTwo(queueWaitMinutes),
      limitations: metricLimitations
    })
  );

  metrics.push(
    buildRegisteredOperationalMetric({
      metricId: "task_delay_minutes",
      label: "Task delay minutes",
      value: taskDelayMinutes,
      limitations: metricLimitations
    })
  );

  metrics.push(
    buildRegisteredOperationalMetric({
      metricId: "travel_to_task_minutes",
      label: "Travel to task minutes",
      value: travelToTaskMinutes,
      limitations: metricLimitations
    })
  );

  metrics.push(
    buildRegisteredOperationalMetric({
      metricId: "missed_task_count",
      label: "Missed task count",
      value: missedTaskCount,
      limitations: metricLimitations
    })
  );

  for (const [bucketMetricId, value] of sortedEntries(taskDensityCounts)) {
    const bucketMinute = bucketMetricId.replace("task_density_bucket_", "");
    metrics.push(
      buildDynamicOperationalMetric({
        metricId: bucketMetricId,
        label: `Tasks ready at minute bucket ${bucketMinute}`,
        value,
        limitations: [
          ...metricLimitations,
          `Task-density bucket size is deterministic and ${bucketMinutes}-minute based.`
        ]
      })
    );
  }

  validateOperationalMetricContracts(metrics);

  return {
    schemaVersion: "1.0.0",
    summaryLabel: "Task time and queue delay summary",
    metrics
  };
}

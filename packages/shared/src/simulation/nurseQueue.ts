import type { TaskBurdenCategory } from "../contracts.js";
import {
  type NurseQueueContract,
  type NurseQueueTaskInput,
  validateNurseQueueContract
} from "./nurseQueueContract.js";

export type BuildNurseQueueInput = {
  queueId: string;
  nurseId: string;
  tasks: NurseQueueTaskInput[];
  nurseAvailableMinute?: number;
};

export const NURSE_QUEUE_LIMITATIONS = [
  "Operational-only deterministic queue ordering for synthetic task demand.",
  "Queue ordering uses visible operational fields only.",
  "No optimizer or clinical claim is applied."
];

export function buildNurseQueue(input: BuildNurseQueueInput): NurseQueueContract {
  const orderedTasks = [...input.tasks].sort(compareQueueTasks);
  let availableMinute = input.nurseAvailableMinute ?? 0;
  const items = orderedTasks.map((task) => {
    const minuteStarted = Math.max(task.scheduledMinute, availableMinute);
    const item = {
      taskId: task.id,
      originalReadyMinute: task.scheduledMinute,
      minuteEnteredQueue: task.scheduledMinute,
      minuteStarted,
      waitMinutes: minuteStarted - task.scheduledMinute,
      interruptible: task.interruptive,
      operationalUrgencyScore: operationalUrgencyScore(task.burdenCategory),
      reasonForOrdering: queueOrderingReason(task)
    };
    availableMinute = minuteStarted + task.estimatedDurationMinutes;
    return item;
  });

  return validateNurseQueueContract({
    schemaVersion: "1.0.0",
    queueId: input.queueId,
    nurseId: input.nurseId,
    taskIdsInQueueOrder: items.map((item) => item.taskId),
    items,
    limitations: [...NURSE_QUEUE_LIMITATIONS]
  });
}

export function compareQueueTasks(
  left: NurseQueueTaskInput,
  right: NurseQueueTaskInput
): number {
  const scheduledMinuteDelta = left.scheduledMinute - right.scheduledMinute;
  if (scheduledMinuteDelta !== 0) {
    return scheduledMinuteDelta;
  }
  const urgencyDelta =
    operationalUrgencyScore(right.burdenCategory) - operationalUrgencyScore(left.burdenCategory);
  if (urgencyDelta !== 0) {
    return urgencyDelta;
  }
  const durationDelta = left.estimatedDurationMinutes - right.estimatedDurationMinutes;
  if (durationDelta !== 0) {
    return durationDelta;
  }
  return left.id.localeCompare(right.id);
}

export function operationalUrgencyScore(category: TaskBurdenCategory): number {
  const scores: Record<TaskBurdenCategory, number> = {
    sitter: 7,
    behavioral: 6,
    isolation: 6,
    procedure: 5,
    medication: 4,
    monitoring: 3,
    turnover: 2
  };
  return scores[category];
}

function queueOrderingReason(task: NurseQueueTaskInput): string {
  return [
    `operational urgency ${operationalUrgencyScore(task.burdenCategory)}`,
    `scheduled minute ${task.scheduledMinute}`,
    `duration ${task.estimatedDurationMinutes}`,
    `task ID ${task.id}`
  ].join("; ");
}

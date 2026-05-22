import type {
  GeneratedOperationalTask,
  GeneratedOperationalTaskSetContract,
  ShiftScenarioContract,
  TaskBurdenCategory,
  TaskTimelineBucket,
  TaskTimelineSummary
} from "../contracts.js";
import { TASK_BURDEN_CATEGORIES, validateGeneratedOperationalTaskSet } from "../contracts.js";

export function aggregateTaskTimeline(
  scenario: ShiftScenarioContract,
  generatedTaskSet: GeneratedOperationalTaskSetContract
): TaskTimelineSummary {
  const validatedTaskSet = validateGeneratedOperationalTaskSet(generatedTaskSet, scenario);
  const tasksByMinute = new Map<number, GeneratedOperationalTask[]>();

  for (const task of validatedTaskSet.generatedTasks) {
    const tasks = tasksByMinute.get(task.scheduledMinute) ?? [];
    tasks.push(task);
    tasksByMinute.set(task.scheduledMinute, tasks);
  }

  const buckets = [...tasksByMinute.entries()]
    .sort(([leftMinute], [rightMinute]) => leftMinute - rightMinute)
    .map(([minute, tasks]) => buildBucket(minute, tasks));

  return {
    scenarioId: scenario.scenarioId,
    generatedTaskSetId: validatedTaskSet.generatedTaskSetId,
    timestepMinutes: scenario.timestepMinutes,
    shiftLengthMinutes: scenario.shiftLengthMinutes,
    buckets,
    totalTaskCount: validatedTaskSet.generatedTasks.length,
    totalEstimatedDurationMinutes: validatedTaskSet.generatedTasks.reduce(
      (total, task) => total + task.estimatedDurationMinutes,
      0
    )
  };
}

function buildBucket(minute: number, tasks: GeneratedOperationalTask[]): TaskTimelineBucket {
  const sortedTasks = [...tasks].sort((left, right) => left.id.localeCompare(right.id));
  const burdenCategories = Object.fromEntries(
    TASK_BURDEN_CATEGORIES.map((category) => [category, 0])
  ) as Record<TaskBurdenCategory, number>;

  for (const task of sortedTasks) {
    burdenCategories[task.burdenCategory] += 1;
  }

  return {
    minute,
    taskIds: sortedTasks.map((task) => task.id),
    taskCount: sortedTasks.length,
    totalEstimatedDurationMinutes: sortedTasks.reduce(
      (total, task) => total + task.estimatedDurationMinutes,
      0
    ),
    interruptiveTaskCount: sortedTasks.filter((task) => task.interruptive).length,
    roomIds: [...new Set(sortedTasks.map((task) => task.roomId))].sort(),
    burdenCategories
  };
}

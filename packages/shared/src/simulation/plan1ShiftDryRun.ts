import { PLAN_1_ID, roundPlan1Number } from "../assignment/plan1AssignmentCommon.js";
import {
  validatePlan1GeneratedTaskSet,
  type Plan1GeneratedTaskSet,
  type Plan1GeneratedSyntheticTask
} from "../scenario/plan1ScenarioValidation.js";
import { validatePlan1Limitations, validatePlan1NonClaims } from "../scenario/plan1SimulationAssumptions.js";
import type { Plan1SimulationInput } from "./plan1SimulationInputContract.js";

export type Plan1NurseTimelineSummary = {
  nurseId: string;
  assignedTaskCount: number;
  completedTaskCount: number;
  deferredTaskCount: number;
  approxWalkingFeet: number;
  approxBusyMinutes: number;
  approxIdleMinutes: number;
  maxQueueDepth: number;
  burdenScoreSnapshot: {
    assignedOccupiedRoomCount: number;
    validationWarningCount: number;
    approximateOperationalBurden: number;
  };
  warningCodes: string[];
};

export type Plan1RoomTimelineSummary = {
  roomId: string;
  assignedTaskCount: number;
  completedTaskCount: number;
  deferredTaskCount: number;
  warningCodes: string[];
};

export type Plan1ShiftDryRunOutput = {
  dryRunId: string;
  planId: typeof PLAN_1_ID;
  scenarioId: string;
  profileId: string;
  seed: number;
  durationMinutes: number;
  taskCount: number;
  completedTaskCount: number;
  deferredTaskCount: number;
  nurseTimelineSummaries: Plan1NurseTimelineSummary[];
  roomTimelineSummaries: Plan1RoomTimelineSummary[];
  warningCodes: string[];
  limitations: string[];
  nonClaims: string[];
  syntheticDataOnly: true;
};

export function runPlan1ShiftDryRun(input: {
  simulationInput: Plan1SimulationInput;
  generatedTaskSet: Plan1GeneratedTaskSet;
  dryRunId?: string;
}): Plan1ShiftDryRunOutput {
  const before = JSON.stringify(input.simulationInput);
  if (input.simulationInput.planId !== PLAN_1_ID) {
    throw new Error("Plan 1 dry-run only accepts default-er-layout-plan-1 input");
  }
  const taskSet = validatePlan1GeneratedTaskSet(input.generatedTaskSet, input.simulationInput);
  const tasksByNurse = groupBy(taskSet.tasks, (task) => task.assignedNurseId);
  const tasksByRoom = groupBy(taskSet.tasks, (task) => task.roomId);
  const nurseTimelineSummaries = input.simulationInput.assignmentWorkflowState.nurses.map((nurse) =>
    buildNurseTimeline(input.simulationInput, tasksByNurse.get(nurse.nurseId) ?? [], nurse.nurseId)
  );
  const roomTimelineSummaries = input.simulationInput.assignmentWorkflowState.roomLoads.map((roomLoad) =>
    buildRoomTimeline(tasksByRoom.get(roomLoad.roomId) ?? [], roomLoad.roomId, input.simulationInput.durationMinutes)
  );
  const completedTaskCount = sum(nurseTimelineSummaries.map((summary) => summary.completedTaskCount));
  const deferredTaskCount = sum(nurseTimelineSummaries.map((summary) => summary.deferredTaskCount));
  const warningCodes = [
    ...new Set([
      ...nurseTimelineSummaries.flatMap((summary) => summary.warningCodes),
      ...roomTimelineSummaries.flatMap((summary) => summary.warningCodes)
    ])
  ].sort();
  const output = {
    dryRunId: input.dryRunId ?? `${input.simulationInput.scenarioId}-dry-run-v1`,
    planId: PLAN_1_ID,
    scenarioId: input.simulationInput.scenarioId,
    profileId: input.simulationInput.intensityProfile.profileId,
    seed: input.simulationInput.seed,
    durationMinutes: input.simulationInput.durationMinutes,
    taskCount: taskSet.tasks.length,
    completedTaskCount,
    deferredTaskCount,
    nurseTimelineSummaries,
    roomTimelineSummaries,
    warningCodes,
    limitations: validatePlan1Limitations(input.simulationInput.limitations, "dryRun.limitations"),
    nonClaims: validatePlan1NonClaims(input.simulationInput.nonClaims, "dryRun.nonClaims"),
    syntheticDataOnly: true as const
  };
  if (JSON.stringify(input.simulationInput) !== before) {
    throw new Error("Plan 1 dry-run must not mutate simulation input");
  }
  return output;
}

function buildNurseTimeline(
  simulationInput: Plan1SimulationInput,
  tasks: Plan1GeneratedSyntheticTask[],
  nurseId: string
): Plan1NurseTimelineSummary {
  const sortedTasks = [...tasks].sort((a, b) => a.scheduledStartMinute - b.scheduledStartMinute || a.taskId.localeCompare(b.taskId));
  let nextAvailableMinute = 0;
  let completedTaskCount = 0;
  let deferredTaskCount = 0;
  let approxBusyMinutes = 0;
  let approxWalkingFeet = 0;
  let maxQueueDepth = 0;
  for (const task of sortedTasks) {
    const queueDepth = Math.max(0, Math.ceil((nextAvailableMinute - task.scheduledStartMinute) / 30));
    maxQueueDepth = Math.max(maxQueueDepth, queueDepth);
    const startMinute = Math.max(task.scheduledStartMinute, nextAvailableMinute);
    if (startMinute + task.estimatedDurationMinutes > simulationInput.durationMinutes) {
      deferredTaskCount += 1;
      continue;
    }
    completedTaskCount += 1;
    approxBusyMinutes += task.estimatedDurationMinutes;
    approxWalkingFeet += task.requiresWalkingRoute
      ? Math.round(120 * simulationInput.intensityProfile.walkingFrictionMultiplier)
      : 20;
    nextAvailableMinute = startMinute + task.estimatedDurationMinutes;
  }
  const assignedOccupiedRoomCount = simulationInput.assignmentWorkflowState.assignments.filter(
    (assignment) => assignment.nurseId === nurseId && assignment.assignmentType === "primary"
  ).length;
  const validationWarningCount = simulationInput.assignmentWorkflowState.validationWarnings.filter((warning) =>
    warning.nurseIds.includes(nurseId)
  ).length;
  const warningCodes = buildNurseWarningCodes(simulationInput, {
    maxQueueDepth,
    approxBusyMinutes,
    deferredTaskCount,
    assignedTaskCount: tasks.length,
    approxWalkingFeet
  });
  return {
    nurseId,
    assignedTaskCount: tasks.length,
    completedTaskCount,
    deferredTaskCount,
    approxWalkingFeet,
    approxBusyMinutes: roundPlan1Number(approxBusyMinutes),
    approxIdleMinutes: Math.max(0, roundPlan1Number(simulationInput.durationMinutes - approxBusyMinutes)),
    maxQueueDepth,
    burdenScoreSnapshot: {
      assignedOccupiedRoomCount,
      validationWarningCount,
      approximateOperationalBurden: roundPlan1Number(
        assignedOccupiedRoomCount * 5 + approxBusyMinutes / 15 + approxWalkingFeet / 100 + validationWarningCount * 2
      )
    },
    warningCodes
  };
}

function buildRoomTimeline(
  tasks: Plan1GeneratedSyntheticTask[],
  roomId: string,
  durationMinutes: number
): Plan1RoomTimelineSummary {
  const deferredTaskCount = tasks.filter(
    (task) => task.scheduledStartMinute + task.estimatedDurationMinutes > durationMinutes
  ).length;
  return {
    roomId,
    assignedTaskCount: tasks.length,
    completedTaskCount: tasks.length - deferredTaskCount,
    deferredTaskCount,
    warningCodes: deferredTaskCount > 0 ? ["ROOM_DEFERRED_TASKS"] : []
  };
}

function buildNurseWarningCodes(
  simulationInput: Plan1SimulationInput,
  summary: {
    maxQueueDepth: number;
    approxBusyMinutes: number;
    deferredTaskCount: number;
    assignedTaskCount: number;
    approxWalkingFeet: number;
  }
): string[] {
  const warnings: string[] = [];
  const thresholds = simulationInput.assumptions.overloadThresholds;
  if (summary.maxQueueDepth >= thresholds.maxQueueDepthWarning) {
    warnings.push("QUEUE_DEPTH_WARNING");
  }
  if (summary.approxBusyMinutes >= thresholds.maxBusyMinutesWarning) {
    warnings.push("BUSY_MINUTES_WARNING");
  }
  if (
    summary.assignedTaskCount > 0 &&
    summary.deferredTaskCount / summary.assignedTaskCount >= thresholds.maxDeferredTaskRatioWarning
  ) {
    warnings.push("DEFERRED_TASK_WARNING");
  }
  if (summary.approxWalkingFeet >= thresholds.maxWalkingFeetWarning) {
    warnings.push("WALKING_LOAD_WARNING");
  }
  if (simulationInput.intensityProfile.traumaEventMultiplier > 1.5) {
    warnings.push("TRAUMA_WORKLOAD_NOTICE");
  }
  return warnings.sort();
}

function groupBy<T>(values: T[], keyFn: (value: T) => string): Map<string, T[]> {
  const result = new Map<string, T[]>();
  for (const value of values) {
    const key = keyFn(value);
    const group = result.get(key) ?? [];
    group.push(value);
    result.set(key, group);
  }
  return result;
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

import type {
  GeneratedOperationalTask,
  GeneratedOperationalTaskSetContract,
  ManualAssignmentContract,
  NurseTaskAssignmentContract,
  PlanContract,
  ShiftScenarioContract
} from "../contracts.js";
import {
  validateGeneratedOperationalTaskSet,
  validateManualAssignmentContract,
  validateNurseTaskAssignmentContract,
  validateShiftScenarioContract
} from "../contracts.js";
import { calculatePathTravelTime } from "../pathing/pathTravelTime.js";
import { compareQueueTasks } from "./nurseQueue.js";
import {
  type SimulationEventContract,
  type SimulationMissReason,
  type SimulationRunContract,
  validateSimulationRunContract
} from "./simulationRunContract.js";

export type SimulationTravelOption = {
  enabled: boolean;
  plan: PlanContract;
  defaultOriginNodeId?: string;
  nurseOriginNodeIds?: Record<string, string>;
  taskLocationNodeIds?: Record<string, string>;
};

export type BuildSimulationRunInput = {
  simulationRunId: string;
  scenario: ShiftScenarioContract;
  generatedTaskSet: GeneratedOperationalTaskSetContract;
  nurseTaskAssignmentSet: NurseTaskAssignmentContract;
  manualAssignmentSet?: ManualAssignmentContract;
  shiftDurationMinutes?: number;
  seed?: number;
  travel?: SimulationTravelOption;
};

export const SIMULATION_RUN_LIMITATIONS = [
  "Operational-only deterministic shift execution result from synthetic task and assignment inputs.",
  "No optimizer or clinical claim is applied.",
  "No route travel is included unless explicit plan path options are supplied."
];

type AssignedTask = {
  task: GeneratedOperationalTask;
  nurseId: string;
};

type TravelResult = {
  travelMinutes: number;
  currentNodeId: string;
  event?: SimulationEventContract;
};

const EVENT_ACTION_ORDER: Record<string, number> = {
  ready: 0,
  entered_queue: 1,
  travel_calculated: 2,
  travel_unreachable: 2,
  delayed: 3,
  started: 4,
  started_task: 5,
  started_from_queue: 6,
  completed: 7,
  completed_task: 8,
  released: 9,
  unassigned: 10,
  missed: 11,
  queued: 12,
  idle: 13
};

export function buildSimulationRun(input: BuildSimulationRunInput): SimulationRunContract {
  const scenario = validateShiftScenarioContract(input.scenario);
  const generatedTaskSet = validateGeneratedOperationalTaskSet(input.generatedTaskSet, scenario);
  const manualAssignmentSet =
    input.manualAssignmentSet == null
      ? undefined
      : validateManualAssignmentContract(input.manualAssignmentSet);
  const nurseTaskAssignmentSet = validateNurseTaskAssignmentContract(
    input.nurseTaskAssignmentSet,
    scenario,
    manualAssignmentSet,
    generatedTaskSet
  );
  const shiftDurationMinutes = input.shiftDurationMinutes ?? scenario.shiftLengthMinutes;
  if (!Number.isInteger(shiftDurationMinutes) || shiftDurationMinutes <= 0) {
    throw new Error("shiftDurationMinutes must be a positive integer");
  }
  if (input.seed != null && input.seed !== scenario.seed) {
    throw new Error("seed must match the scenario seed");
  }

  const taskById = new Map(generatedTaskSet.generatedTasks.map((task) => [task.id, task]));
  const assignmentByTaskId = new Map(
    nurseTaskAssignmentSet.taskAssignments.map((assignment) => [assignment.taskId, assignment])
  );
  const events: SimulationEventContract[] = [];
  const assignedTasksByNurse = new Map<string, AssignedTask[]>();

  for (const task of [...generatedTaskSet.generatedTasks].sort(compareTasks)) {
    events.push(taskReadyEvent(task));
    const assignment = assignmentByTaskId.get(task.id);
    if (assignment == null || assignment.nurseId == null || assignment.assignmentReason === "unassigned") {
      events.push(taskUnassignedEvent(task));
      continue;
    }
    const assignedTasks = assignedTasksByNurse.get(assignment.nurseId) ?? [];
    assignedTasks.push({ task, nurseId: assignment.nurseId });
    assignedTasksByNurse.set(assignment.nurseId, assignedTasks);
  }

  const currentNodeByNurseId = initialCurrentNodes(manualAssignmentSet, input.travel);
  for (const [nurseId, assignedTasks] of [...assignedTasksByNurse.entries()].sort(
    ([left], [right]) => left.localeCompare(right)
  )) {
    let nurseAvailableMinute = 0;
    for (const assignedTask of assignedTasks.sort((left, right) =>
      compareQueueTasks(left.task, right.task)
    )) {
      const task = taskById.get(assignedTask.task.id);
      if (task == null) {
        throw new Error("assigned task references an unknown generated task");
      }
      const readyMinute = task.scheduledMinute;
      let queueWaitMinutes = 0;
      if (nurseAvailableMinute > readyMinute) {
        queueWaitMinutes = nurseAvailableMinute - readyMinute;
        events.push(queueEnteredEvent(nurseId, task, readyMinute));
      }

      const travel = maybeBuildTravelEvent(
        nurseId,
        task,
        Math.max(readyMinute, nurseAvailableMinute),
        currentNodeByNurseId.get(nurseId),
        input.travel
      );
      const startMinute = Math.max(readyMinute, nurseAvailableMinute) + travel.travelMinutes;
      const completedMinute = startMinute + task.estimatedDurationMinutes;
      if (completedMinute > shiftDurationMinutes) {
        events.push(taskMissedEvent(task, nurseId, startMinute, "not_started_shift_window_exceeded"));
        continue;
      }

      if (travel.event != null) {
        events.push(travel.event);
      }
      currentNodeByNurseId.set(nurseId, travel.currentNodeId);

      const delayMinutes = startMinute - readyMinute;
      if (delayMinutes > 0) {
        events.push(taskDelayedEvent(task, nurseId, startMinute, delayMinutes, queueWaitMinutes, travel.travelMinutes));
      }
      if (queueWaitMinutes > 0) {
        events.push(queueStartedEvent(nurseId, task, readyMinute, startMinute, queueWaitMinutes));
      }

      events.push(taskStartedEvent(task, nurseId, startMinute, queueWaitMinutes, travel.travelMinutes));
      events.push(nurseStartedEvent(nurseId, task, startMinute, completedMinute));
      events.push(taskCompletedEvent(task, nurseId, completedMinute, startMinute, queueWaitMinutes, travel.travelMinutes));
      events.push(nurseCompletedEvent(nurseId, task, completedMinute));
      if (queueWaitMinutes > 0) {
        events.push(queueReleasedEvent(nurseId, task, completedMinute, readyMinute, startMinute, queueWaitMinutes));
      }
      nurseAvailableMinute = completedMinute;
    }
  }

  const orderedEvents = events.sort(compareSimulationEvents);
  return validateSimulationRunContract(
    {
      schemaVersion: "1.0.0",
      simulationRunId: input.simulationRunId,
      scenarioId: scenario.scenarioId,
      generatedTaskSetId: generatedTaskSet.generatedTaskSetId,
      assignmentSetId: nurseTaskAssignmentSet.assignmentSetId,
      events: orderedEvents,
      summary: summarizeEvents(generatedTaskSet, orderedEvents),
      limitations: [...SIMULATION_RUN_LIMITATIONS]
    },
    {
      scenario,
      generatedTaskSet,
      nurseTaskAssignmentSet,
      manualAssignmentSet
    }
  );
}

function maybeBuildTravelEvent(
  nurseId: string,
  task: GeneratedOperationalTask,
  minute: number,
  currentNodeId: string | undefined,
  travel?: SimulationTravelOption
): TravelResult {
  if (travel == null || !travel.enabled) {
    return { travelMinutes: 0, currentNodeId: currentNodeId ?? "" };
  }
  const plan = travel.plan;
  const originNodeId =
    currentNodeId ??
    travel.nurseOriginNodeIds?.[nurseId] ??
    travel.defaultOriginNodeId ??
    plan.nurseStations[0]?.pathNodeId;
  const destinationNodeId =
    travel.taskLocationNodeIds?.[task.id] ??
    plan.rooms.find((room) => room.id === task.roomId)?.pathNodeId;
  if (originNodeId == null || destinationNodeId == null) {
    return { travelMinutes: 0, currentNodeId: currentNodeId ?? "" };
  }
  const response = calculatePathTravelTime({
    plan,
    originNodeId,
    destinationNodeId,
    walkingSpeedFeetPerMinute: 250
  });
  const reachable = response.warnings.length === 0;
  return {
    travelMinutes: reachable ? response.travelMinutes : 0,
    currentNodeId: reachable ? destinationNodeId : originNodeId,
    event: {
      eventId: `travel-${nurseId}-${task.id}`,
      eventType: "travel",
      action: reachable ? "travel_calculated" : "travel_unreachable",
      nurseId,
      taskId: task.id,
      minute,
      originNodeId,
      destinationNodeId,
      routeNodeIds: response.routeNodeIds,
      routeEdgeIds: response.routeEdgeIds,
      travelSeconds: response.travelSeconds,
      travelMinutes: reachable ? response.travelMinutes : 0,
      warnings: response.warnings
    }
  };
}

function initialCurrentNodes(
  manualAssignmentSet?: ManualAssignmentContract,
  travel?: SimulationTravelOption
): Map<string, string> {
  const current = new Map<string, string>();
  if (manualAssignmentSet == null || travel == null || !travel.enabled) {
    return current;
  }
  for (const nurse of manualAssignmentSet.nurses) {
    const nodeId =
      travel.nurseOriginNodeIds?.[nurse.id] ??
      (nurse.homeStationId == null
        ? undefined
        : travel.plan.nurseStations.find((station) => station.id === nurse.homeStationId)
            ?.pathNodeId) ??
      travel.defaultOriginNodeId ??
      travel.plan.nurseStations[0]?.pathNodeId;
    if (nodeId != null) {
      current.set(nurse.id, nodeId);
    }
  }
  return current;
}

function summarizeEvents(
  generatedTaskSet: GeneratedOperationalTaskSetContract,
  events: SimulationEventContract[]
) {
  const taskEvents = events.filter((event) => event.eventType === "task");
  return {
    totalTasks: generatedTaskSet.generatedTasks.length,
    completedTaskCount: uniqueTaskCount(taskEvents, "completed"),
    delayedTaskCount: uniqueTaskCount(taskEvents, "delayed"),
    missedTaskCount: uniqueTaskCount(taskEvents, "missed"),
    unassignedTaskCount: uniqueTaskCount(taskEvents, "unassigned")
  };
}

function uniqueTaskCount(
  events: Extract<SimulationEventContract, { eventType: "task" }>[],
  action: string
): number {
  return new Set(events.filter((event) => event.action === action).map((event) => event.taskId))
    .size;
}

function taskReadyEvent(task: GeneratedOperationalTask): SimulationEventContract {
  return {
    eventId: `task-${task.id}-ready`,
    eventType: "task",
    action: "ready",
    taskId: task.id,
    minute: task.scheduledMinute,
    scheduledMinute: task.scheduledMinute
  };
}

function taskUnassignedEvent(task: GeneratedOperationalTask): SimulationEventContract {
  return {
    eventId: `task-${task.id}-unassigned`,
    eventType: "task",
    action: "unassigned",
    taskId: task.id,
    minute: task.scheduledMinute,
    scheduledMinute: task.scheduledMinute,
    missReason: "unassigned"
  };
}

function taskDelayedEvent(
  task: GeneratedOperationalTask,
  nurseId: string,
  startMinute: number,
  delayMinutes: number,
  queueWaitMinutes: number,
  travelMinutes: number
): SimulationEventContract {
  return {
    eventId: `task-${task.id}-delayed`,
    eventType: "task",
    action: "delayed",
    taskId: task.id,
    nurseId,
    minute: startMinute,
    scheduledMinute: task.scheduledMinute,
    startMinute,
    delayMinutes,
    queueWaitMinutes,
    travelMinutes
  };
}

function taskStartedEvent(
  task: GeneratedOperationalTask,
  nurseId: string,
  startMinute: number,
  queueWaitMinutes: number,
  travelMinutes: number
): SimulationEventContract {
  return {
    eventId: `task-${task.id}-started`,
    eventType: "task",
    action: "started",
    taskId: task.id,
    nurseId,
    minute: startMinute,
    scheduledMinute: task.scheduledMinute,
    startMinute,
    durationMinutes: task.estimatedDurationMinutes,
    queueWaitMinutes,
    travelMinutes
  };
}

function taskCompletedEvent(
  task: GeneratedOperationalTask,
  nurseId: string,
  completedMinute: number,
  startMinute: number,
  queueWaitMinutes: number,
  travelMinutes: number
): SimulationEventContract {
  return {
    eventId: `task-${task.id}-completed`,
    eventType: "task",
    action: "completed",
    taskId: task.id,
    nurseId,
    minute: completedMinute,
    scheduledMinute: task.scheduledMinute,
    startMinute,
    completedMinute,
    durationMinutes: task.estimatedDurationMinutes,
    delayMinutes: startMinute - task.scheduledMinute,
    queueWaitMinutes,
    travelMinutes
  };
}

function taskMissedEvent(
  task: GeneratedOperationalTask,
  nurseId: string,
  missMinute: number,
  missReason: SimulationMissReason
): SimulationEventContract {
  return {
    eventId: `task-${task.id}-missed`,
    eventType: "task",
    action: "missed",
    taskId: task.id,
    nurseId,
    minute: missMinute,
    scheduledMinute: task.scheduledMinute,
    missReason
  };
}

function nurseStartedEvent(
  nurseId: string,
  task: GeneratedOperationalTask,
  startMinute: number,
  completedMinute: number
): SimulationEventContract {
  return {
    eventId: `nurse-${nurseId}-${task.id}-started`,
    eventType: "nurse",
    action: "started_task",
    nurseId,
    taskId: task.id,
    minute: startMinute,
    durationMinutes: task.estimatedDurationMinutes,
    busyUntilMinute: completedMinute
  };
}

function nurseCompletedEvent(
  nurseId: string,
  task: GeneratedOperationalTask,
  completedMinute: number
): SimulationEventContract {
  return {
    eventId: `nurse-${nurseId}-${task.id}-completed`,
    eventType: "nurse",
    action: "completed_task",
    nurseId,
    taskId: task.id,
    minute: completedMinute,
    durationMinutes: task.estimatedDurationMinutes
  };
}

function queueEnteredEvent(
  nurseId: string,
  task: GeneratedOperationalTask,
  readyMinute: number
): SimulationEventContract {
  return {
    eventId: `queue-${nurseId}-${task.id}-entered`,
    eventType: "queue",
    action: "entered_queue",
    nurseId,
    taskId: task.id,
    minute: readyMinute,
    originalReadyMinute: task.scheduledMinute,
    enteredQueueMinute: readyMinute,
    orderingReason: "Queued by deterministic operational ordering fields."
  };
}

function queueStartedEvent(
  nurseId: string,
  task: GeneratedOperationalTask,
  readyMinute: number,
  startMinute: number,
  queueWaitMinutes: number
): SimulationEventContract {
  return {
    eventId: `queue-${nurseId}-${task.id}-started`,
    eventType: "queue",
    action: "started_from_queue",
    nurseId,
    taskId: task.id,
    minute: startMinute,
    originalReadyMinute: task.scheduledMinute,
    enteredQueueMinute: readyMinute,
    startedMinute: startMinute,
    waitMinutes: queueWaitMinutes,
    orderingReason: "Started after deterministic nurse availability and queue ordering."
  };
}

function queueReleasedEvent(
  nurseId: string,
  task: GeneratedOperationalTask,
  completedMinute: number,
  readyMinute: number,
  startMinute: number,
  queueWaitMinutes: number
): SimulationEventContract {
  return {
    eventId: `queue-${nurseId}-${task.id}-released`,
    eventType: "queue",
    action: "released",
    nurseId,
    taskId: task.id,
    minute: completedMinute,
    originalReadyMinute: task.scheduledMinute,
    enteredQueueMinute: readyMinute,
    startedMinute: startMinute,
    waitMinutes: queueWaitMinutes,
    orderingReason: "Completed task released deterministic nurse queue slot."
  };
}

function compareTasks(left: GeneratedOperationalTask, right: GeneratedOperationalTask): number {
  const minuteDelta = left.scheduledMinute - right.scheduledMinute;
  if (minuteDelta !== 0) {
    return minuteDelta;
  }
  return left.id.localeCompare(right.id);
}

function compareSimulationEvents(
  left: SimulationEventContract,
  right: SimulationEventContract
): number {
  const minuteDelta = left.minute - right.minute;
  if (minuteDelta !== 0) {
    return minuteDelta;
  }
  const leftAction = "action" in left ? left.action : "";
  const rightAction = "action" in right ? right.action : "";
  const actionDelta =
    (EVENT_ACTION_ORDER[leftAction] ?? 99) - (EVENT_ACTION_ORDER[rightAction] ?? 99);
  if (actionDelta !== 0) {
    return actionDelta;
  }
  return left.eventId.localeCompare(right.eventId);
}

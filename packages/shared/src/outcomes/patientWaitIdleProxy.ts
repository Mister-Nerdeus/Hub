import {
  validateSimulationRunContract,
  type SimulationRunContract,
  type SimulationTaskEventContract
} from "../simulation/simulationRunContract.js";
import { type GeneratedOperationalTaskSetContract } from "../contracts.js";
import {
  buildOperationalMetric,
  OPERATIONAL_OUTCOME_LIMITATIONS,
  roundToTwo,
  sortedEntries
} from "./outcomeMetricsBuilder.js";
import {
  validateOperationalMetricContracts,
  type OperationalMetricContract
} from "./operationalMetricContract.js";

type BuildPatientWaitIdleProxyInput = {
  simulationRun: SimulationRunContract;
  generatedTaskSet?: GeneratedOperationalTaskSetContract;
};

type BuildPatientWaitIdleProxyOutput = {
  schemaVersion: "1.0.0";
  summaryLabel: string;
  metrics: OperationalMetricContract[];
};

type TurnKeyedMap = Record<string, number>;

type TaskRoomMap = Record<string, string>;

const PATIENT_WAIT_IDLE_LIMITATIONS = [
  ...OPERATIONAL_OUTCOME_LIMITATIONS,
  "Patient wait/idle proxy values are deterministic and derived from validated task ready/start/delay events.",
  "Room or synthetic slot grouping is resolved from generated task set room IDs when available, with deterministic taskId pattern fallback.",
  "Missed or unassigned proxy penalty minutes use terminal minute minus first ready minute for each terminal task event.",
  "Projected missed-task pressure uses projected not-started timing fields when available.",
  "Total patient-flow wait/idle proxy is additive across wait, delay exposure, terminal delay-assumption inputs, and projected missed-task pressure."
];

export function buildPatientWaitIdleProxy(
  input: BuildPatientWaitIdleProxyInput
): BuildPatientWaitIdleProxyOutput {
  const run = validateSimulationRunContract(input.simulationRun);

  const generatedTaskSet = input.generatedTaskSet;
  const taskToRoom: TaskRoomMap = {};

  for (const task of generatedTaskSet?.generatedTasks ?? []) {
    taskToRoom[task.id] = task.roomId;
  }

  const waitMinutesByTask: TurnKeyedMap = {};
  const delayMinutesByTask: TurnKeyedMap = {};
  const penaltyMinutesByTask: TurnKeyedMap = {};
  const projectedMissedPressureByTask: TurnKeyedMap = {};
  const firstReadyByTask: TurnKeyedMap = {};
  const firstStartByTask: TurnKeyedMap = {};
  const terminalMinuteByTask: TurnKeyedMap = {};
  const terminalReasonByTask: Set<string> = new Set();

  for (const event of run.events) {
    if (event.eventType !== "task") {
      continue;
    }

    const taskId = event.taskId;
    const readyMinute = event.scheduledMinute ?? event.minute;

    if (event.action === "ready") {
      const priorReady = firstReadyByTask[taskId];
      if (priorReady == null || readyMinute < priorReady) {
        firstReadyByTask[taskId] = readyMinute;
      }
      continue;
    }

    if (event.action === "started") {
      const previousStart = firstStartByTask[taskId];
      if (previousStart == null || (event.startMinute ?? event.minute) < previousStart) {
        firstStartByTask[taskId] = event.startMinute ?? event.minute;
      }
      continue;
    }

    if (event.action === "delayed") {
      const delayMinutes = event.delayMinutes ?? 0;
      if (delayMinutes > 0) {
        delayMinutesByTask[taskId] = (delayMinutesByTask[taskId] ?? 0) + delayMinutes;
      }
      continue;
    }

    if (event.action === "missed" || event.action === "unassigned") {
      terminalMinuteByTask[taskId] = event.minute;
      terminalReasonByTask.add(taskId);
      const projectedPressure = calculateProjectedMissedTaskPressure(event);
      if (projectedPressure > 0) {
        projectedMissedPressureByTask[taskId] =
          (projectedMissedPressureByTask[taskId] ?? 0) + projectedPressure;
      }
    }
  }

  const rooms = new Set<string>();
  const waitByRoom: TurnKeyedMap = {};
  const delayByRoom: TurnKeyedMap = {};
  const penaltyByRoom: TurnKeyedMap = {};
  const projectedMissedPressureByRoom: TurnKeyedMap = {};

  const allTaskIds = new Set<string>([
    ...Object.keys(firstStartByTask),
    ...Object.keys(firstReadyByTask),
    ...Object.keys(delayMinutesByTask),
    ...Object.keys(projectedMissedPressureByTask),
    ...terminalReasonByTask
  ]);

  for (const taskId of allTaskIds) {
    const roomId = resolvePatientRoom(taskId, taskToRoom);
    rooms.add(roomId);

    const readyMinute = firstReadyByTask[taskId] ?? 0;
    const startMinute = firstStartByTask[taskId];
    const waitMinutes = startMinute == null ? 0 : Math.max(0, startMinute - readyMinute);

    waitMinutesByTask[taskId] = waitMinutes;
    waitByRoom[roomId] = (waitByRoom[roomId] ?? 0) + waitMinutes;

    const delayMinutes = delayMinutesByTask[taskId] ?? 0;
    if (delayMinutes > 0) {
      delayByRoom[roomId] = (delayByRoom[roomId] ?? 0) + delayMinutes;
    }

    const projectedPressure = projectedMissedPressureByTask[taskId] ?? 0;
    if (projectedPressure > 0) {
      projectedMissedPressureByRoom[roomId] =
        (projectedMissedPressureByRoom[roomId] ?? 0) + projectedPressure;
    }

    if (terminalReasonByTask.has(taskId)) {
      const terminalMinute = terminalMinuteByTask[taskId] ?? readyMinute;
      const penaltyMinutes = Math.max(0, terminalMinute - readyMinute);
      if (penaltyMinutes > 0) {
        penaltyMinutesByTask[taskId] = penaltyMinutes;
        penaltyByRoom[roomId] = (penaltyByRoom[roomId] ?? 0) + penaltyMinutes;
      }
    }
  }

  for (const roomId of [...rooms]) {
    waitByRoom[roomId] = waitByRoom[roomId] ?? 0;
    delayByRoom[roomId] = delayByRoom[roomId] ?? 0;
    penaltyByRoom[roomId] = penaltyByRoom[roomId] ?? 0;
    projectedMissedPressureByRoom[roomId] = projectedMissedPressureByRoom[roomId] ?? 0;
  }

  const allWaitMinutes = roundToTwo(
    Object.values(waitMinutesByTask).reduce((sum, value) => sum + value, 0)
  );
  const allDelayMinutes = roundToTwo(Object.values(delayMinutesByTask).reduce((sum, value) => sum + value, 0));
  const allPenaltyMinutes = roundToTwo(
    Object.values(penaltyMinutesByTask).reduce((sum, value) => sum + value, 0)
  );
  const projectedMissedTaskPressureMinutes = roundToTwo(
    Object.values(projectedMissedPressureByTask).reduce((sum, value) => sum + value, 0)
  );

  let firstModeledTaskWaitMinutes = 0;
  let earliestModeledTaskReady: number | null = null;
  for (const [taskId, startMinute] of Object.entries(firstStartByTask)) {
    const readyMinute = firstReadyByTask[taskId];
    if (readyMinute == null) {
      continue;
    }
    if (earliestModeledTaskReady == null || readyMinute < earliestModeledTaskReady) {
      earliestModeledTaskReady = readyMinute;
      firstModeledTaskWaitMinutes = Math.max(0, startMinute - readyMinute);
    }
  }

  const roomProxyByRoom: Record<string, number> = {};
  for (const roomId of Object.keys(waitByRoom)) {
    roomProxyByRoom[roomId] = roundToTwo(
      (waitByRoom[roomId] ?? 0) +
        (delayByRoom[roomId] ?? 0) +
        (penaltyByRoom[roomId] ?? 0) +
        (projectedMissedPressureByRoom[roomId] ?? 0)
    );
  }

  const totalPatientFlowWaitIdleMinutes =
    allWaitMinutes + allDelayMinutes + allPenaltyMinutes + projectedMissedTaskPressureMinutes;

  const metrics: OperationalMetricContract[] = [];

  metrics.push(
    buildOperationalMetric({
      metricId: "first_modeled_task_wait_minutes",
      label: "Wait before first modeled task minutes",
      group: "patient_flow",
      unit: "minutes",
      value: roundToTwo(firstModeledTaskWaitMinutes),
      directionality: "lower_is_better",
      source: "task_event",
      scope: "scenario",
      limitations: PATIENT_WAIT_IDLE_LIMITATIONS
    })
  );

  metrics.push(
    buildOperationalMetric({
      metricId: "idle_between_ready_and_start_minutes",
      label: "Idle time between ready and start minutes",
      group: "patient_flow",
      unit: "minutes",
      value: allWaitMinutes,
      directionality: "lower_is_better",
      source: "task_event",
      scope: "scenario",
      limitations: PATIENT_WAIT_IDLE_LIMITATIONS
    })
  );

  metrics.push(
    buildOperationalMetric({
      metricId: "delay_exposure_minutes",
      label: "Delay exposure minutes",
      group: "patient_flow",
      unit: "minutes",
      value: allDelayMinutes,
      directionality: "lower_is_better",
      source: "task_event",
      scope: "simulation",
      limitations: PATIENT_WAIT_IDLE_LIMITATIONS
    })
  );

  metrics.push(
    buildOperationalMetric({
      metricId: "missed_unassigned_proxy_penalty_minutes",
      label: "Missed and unassigned proxy penalty minutes",
      group: "patient_flow",
      unit: "minutes",
      value: allPenaltyMinutes,
      directionality: "lower_is_better",
      source: "task_event",
      scope: "simulation",
      limitations: PATIENT_WAIT_IDLE_LIMITATIONS
    })
  );

  metrics.push(
    buildOperationalMetric({
      metricId: "projected_missed_task_pressure_minutes",
      label: "Projected missed task pressure minutes",
      group: "patient_flow",
      unit: "minutes",
      value: projectedMissedTaskPressureMinutes,
      directionality: "lower_is_better",
      source: "task_event",
      scope: "simulation",
      limitations: PATIENT_WAIT_IDLE_LIMITATIONS
    })
  );

  metrics.push(
    buildOperationalMetric({
      metricId: "patient_flow_wait_idle_minutes",
      label: "Total patient-flow wait and idle minutes",
      group: "patient_flow",
      unit: "minutes",
      value: roundToTwo(totalPatientFlowWaitIdleMinutes),
      directionality: "lower_is_better",
      source: "derived_proxy",
      scope: "simulation",
      limitations: PATIENT_WAIT_IDLE_LIMITATIONS
    })
  );

  for (const [key, roomWaitIdle] of sortedEntries(roomProxyByRoom)) {

    metrics.push(
      buildOperationalMetric({
        metricId: `patient_flow_wait_idle_by_room_${key}`,
        label: `Patient-flow wait/idle proxy minutes for room ${key}`,
        group: "patient_flow",
        unit: "minutes",
        value: roundToTwo(roomWaitIdle),
        directionality: "lower_is_better",
        source: "derived_proxy",
        scope: "room",
        limitations: PATIENT_WAIT_IDLE_LIMITATIONS
      })
    );

    metrics.push(
      buildOperationalMetric({
        metricId: `patient_flow_wait_between_ready_and_start_by_room_${key}`,
        label: `Idle time between ready and start by room ${key}`,
        group: "patient_flow",
        unit: "minutes",
        value: roundToTwo(waitByRoom[key] ?? 0),
        directionality: "lower_is_better",
        source: "task_event",
        scope: "room",
        limitations: PATIENT_WAIT_IDLE_LIMITATIONS
      })
    );

    metrics.push(
      buildOperationalMetric({
        metricId: `patient_flow_delay_exposure_by_room_${key}`,
        label: `Delay exposure by room ${key}`,
        group: "patient_flow",
        unit: "minutes",
        value: roundToTwo(delayByRoom[key] ?? 0),
        directionality: "lower_is_better",
        source: "task_event",
        scope: "room",
        limitations: PATIENT_WAIT_IDLE_LIMITATIONS
      })
    );

    metrics.push(
      buildOperationalMetric({
        metricId: `patient_flow_terminal_penalty_by_room_${key}`,
        label: `Missed and unassigned terminal penalty by room ${key}`,
        group: "patient_flow",
        unit: "minutes",
        value: roundToTwo(penaltyByRoom[key] ?? 0),
        directionality: "lower_is_better",
        source: "task_event",
        scope: "room",
        limitations: PATIENT_WAIT_IDLE_LIMITATIONS
      })
    );
  }

  validateOperationalMetricContracts(metrics);

  return {
    schemaVersion: "1.0.0",
    summaryLabel: "Patient wait and idle proxy",
    metrics
  };
}

function calculateProjectedMissedTaskPressure(event: SimulationTaskEventContract): number {
  if (event.action !== "missed" || event.missReason !== "not_started_shift_window_exceeded") {
    return 0;
  }
  if (
    typeof event.projectedStartMinute !== "number" ||
    typeof event.projectedCompletionMinute !== "number" ||
    typeof event.shiftDurationMinutes !== "number"
  ) {
    return 0;
  }

  const projectedStartAfterShift = Math.max(0, event.projectedStartMinute - event.shiftDurationMinutes);
  const projectedCompletionAfterStart = Math.max(
    0,
    event.projectedCompletionMinute - Math.max(event.projectedStartMinute, event.shiftDurationMinutes)
  );

  return roundToTwo(projectedStartAfterShift + projectedCompletionAfterStart);
}

function resolvePatientRoom(taskId: string, taskToRoom: TaskRoomMap): string {
  if (taskToRoom[taskId] != null) {
    return taskToRoom[taskId];
  }

  const roomMatch = taskId.match(/room-[a-z0-9-]+|hall-bed-[a-z0-9-]+/i);
  if (roomMatch != null) {
    return roomMatch[0].toLowerCase();
  }

  return `slot-${taskId.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

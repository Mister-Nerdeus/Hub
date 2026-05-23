import {
  validateSimulationRunContract,
  type SimulationRunContract,
} from "../simulation/simulationRunContract.js";
import { type GeneratedOperationalTaskSetContract } from "../contracts.js";
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

type BuildRoomTurnoverBlockedTimeProxyInput = {
  simulationRun: SimulationRunContract;
  generatedTaskSet?: GeneratedOperationalTaskSetContract;
};

type BuildRoomTurnoverBlockedTimeProxyOutput = {
  schemaVersion: "1.0.0";
  summaryLabel: string;
  metrics: OperationalMetricContract[];
};

const ROOM_TURNOVER_LIMITATIONS = [
  ...OPERATIONAL_OUTCOME_LIMITATIONS,
  "Room turnover identification uses generated task metadata when available and deterministic taskId heuristics otherwise.",
  "Room blocked minutes derive from completed turnover task minutes, turnover delay minutes, and terminal proxy penalties.",
  "Room pressure is a deterministic operational proxy built from blocked minutes plus a fixed terminal penalty weight.",
  "Room ids are preserved from generated tasks where provided; missing values use deterministic synthetic room-id fallback."
];

const ROLLING_TURNOVER_PRESSURE_MULTIPLIER = 10;

export function buildRoomTurnoverBlockedTimeProxy(
  input: BuildRoomTurnoverBlockedTimeProxyInput
): BuildRoomTurnoverBlockedTimeProxyOutput {
  const run = validateSimulationRunContract(input.simulationRun);
  const taskToRoom: Record<string, string> = {};
  const tasksById = new Map<string, { taskType?: string | null; roomId?: string | null }>(
    input.generatedTaskSet?.generatedTasks.map((task) => [task.id, task]) ?? []
  );

  for (const task of input.generatedTaskSet?.generatedTasks ?? []) {
    taskToRoom[task.id] = task.roomId;
  }

  const isTurnoverTaskById = new Set<string>();
  const firstReadyByTask: Record<string, number> = {};
  const delayByTask: Record<string, number> = {};
  const terminalActionByTask: Record<string, string> = {};
  const terminalMinuteByTask: Record<string, number> = {};
  const durationByTask: Record<string, number> = {};
  const startByTask: Record<string, number> = {};
  const completedByTask: Record<string, number> = {};

  for (const event of run.events) {
    if (event.eventType === "task") {
      const taskId = event.taskId;
      const isTurnoverTask = isRoomTurnoverTask(
        taskId,
        tasksById.get(taskId)
      );
      if (isTurnoverTask) {
        isTurnoverTaskById.add(taskId);
      }

      if (event.action === "ready") {
        firstReadyByTask[taskId] = Math.min(
          firstReadyByTask[taskId] ?? Number.MAX_SAFE_INTEGER,
          event.scheduledMinute ?? event.minute
        );
        continue;
      }
      if (event.action === "started" && event.startMinute != null) {
        startByTask[taskId] = Math.min(startByTask[taskId] ?? Number.MAX_SAFE_INTEGER, event.startMinute);
        continue;
      }
      if (event.action === "completed") {
        const completedMinute = event.completedMinute ?? event.minute;
        completedByTask[taskId] = Math.min(completedByTask[taskId] ?? Number.MAX_SAFE_INTEGER, completedMinute);
        if (typeof event.durationMinutes === "number" && event.durationMinutes > 0) {
          durationByTask[taskId] = event.durationMinutes;
        }
        continue;
      }
      if (event.action === "delayed") {
        delayByTask[taskId] = (delayByTask[taskId] ?? 0) + (event.delayMinutes ?? 0);
        continue;
      }
      if (event.action === "missed" || event.action === "unassigned") {
        terminalActionByTask[taskId] = event.action;
        terminalMinuteByTask[taskId] = event.minute;
        if (isTurnoverTask) {
          isTurnoverTaskById.add(taskId);
        }
      }
      continue;
    }

    if (event.eventType === "nurse" && event.action === "completed_task" && event.taskId != null) {
      if (!durationByTask[event.taskId] && event.durationMinutes != null) {
        durationByTask[event.taskId] = event.durationMinutes;
      }
    }
  }

  const roomBlocks: Record<string, number> = {};
  const roomTurnoverMinutes: Record<string, number> = {};
  const roomDelayMinutes: Record<string, number> = {};
  const roomMissedCount: Record<string, number> = {};

  const knownTurnoverTasks = [...isTurnoverTaskById];
  for (const taskId of knownTurnoverTasks) {
    const roomId = resolveRoomId(taskId, taskToRoom);
    roomBlocks[roomId] = roomBlocks[roomId] ?? 0;
    roomTurnoverMinutes[roomId] = roomTurnoverMinutes[roomId] ?? 0;
    roomDelayMinutes[roomId] = roomDelayMinutes[roomId] ?? 0;
    roomMissedCount[roomId] = roomMissedCount[roomId] ?? 0;

    const delayMinutes = delayByTask[taskId] ?? 0;
    const terminalAction = terminalActionByTask[taskId];
    const readyMinute = firstReadyByTask[taskId] ?? 0;
    const terminalMinute = terminalMinuteByTask[taskId] ?? (completedByTask[taskId] ?? startByTask[taskId] ?? readyMinute);

    if (terminalAction === "missed" || terminalAction === "unassigned") {
      roomMissedCount[roomId] += 1;
      roomBlocks[roomId] += Math.max(0, terminalMinute - readyMinute);
    }

    const turnoverDuration = durationByTask[taskId] ?? estimateTaskDuration(startByTask[taskId], completedByTask[taskId]);
    if (turnoverDuration > 0) {
      roomTurnoverMinutes[roomId] += turnoverDuration;
      roomBlocks[roomId] += turnoverDuration;
    }

    roomDelayMinutes[roomId] += delayMinutes;
    roomBlocks[roomId] += delayMinutes;
  }

  const roomPressure = Object.entries(roomBlocks).reduce<Record<string, number>>((acc, [roomId, blockedMinutes]) => {
    acc[roomId] = blockedMinutes + ((roomMissedCount[roomId] ?? 0) * ROLLING_TURNOVER_PRESSURE_MULTIPLIER);
    return acc;
  }, {});

  const totalTurnoverTaskMinutes = roundToTwo(
    Object.values(roomTurnoverMinutes).reduce((sum, value) => sum + value, 0)
  );
  const totalDelayedTurnoverMinutes = roundToTwo(
    Object.values(roomDelayMinutes).reduce((sum, value) => sum + value, 0)
  );
  const totalBlockedRoomMinutes = roundToTwo(Object.values(roomBlocks).reduce((sum, value) => sum + value, 0));
  const totalMissedTurnoverTasks = Object.values(roomMissedCount).reduce((sum, value) => sum + value, 0);
  const totalRoomPressure = roundToTwo(
    Object.values(roomPressure).reduce((sum, value) => sum + value, 0)
  );

  const metrics: OperationalMetricContract[] = [];

  metrics.push(
    buildRegisteredOperationalMetric({
      metricId: "room_turnover_task_minutes",
      label: "Room turnover task minutes",
      value: totalTurnoverTaskMinutes,
      limitations: ROOM_TURNOVER_LIMITATIONS
    })
  );

  metrics.push(
    buildRegisteredOperationalMetric({
      metricId: "blocked_room_minutes",
      label: "Blocked room minutes",
      value: totalBlockedRoomMinutes,
      limitations: ROOM_TURNOVER_LIMITATIONS
    })
  );

  metrics.push(
    buildRegisteredOperationalMetric({
      metricId: "delayed_turnover_minutes",
      label: "Delayed turnover minutes",
      value: totalDelayedTurnoverMinutes,
      limitations: ROOM_TURNOVER_LIMITATIONS
    })
  );

  metrics.push(
    buildRegisteredOperationalMetric({
      metricId: "missed_turnover_tasks",
      label: "Missed turnover tasks",
      value: totalMissedTurnoverTasks,
      limitations: ROOM_TURNOVER_LIMITATIONS
    })
  );

  metrics.push(
    buildRegisteredOperationalMetric({
      metricId: "room_turnover_pressure",
      label: "Room pressure score",
      value: totalRoomPressure,
      limitations: ROOM_TURNOVER_LIMITATIONS
    })
  );

  for (const [roomId, blockedMinutes] of sortedEntries(roomBlocks)) {
    const turnaroundMinutes = roomTurnoverMinutes[roomId] ?? 0;
    const delayedMinutes = roomDelayMinutes[roomId] ?? 0;
    const missedCount = roomMissedCount[roomId] ?? 0;

    metrics.push(
      buildDynamicOperationalMetric({
        metricId: `blocked_room_minutes_by_room_${roomId}`,
        label: `Blocked minutes for room ${roomId}`,
        value: roundToTwo(blockedMinutes),
        limitations: ROOM_TURNOVER_LIMITATIONS
      })
    );

    metrics.push(
      buildDynamicOperationalMetric({
        metricId: `turnover_task_minutes_by_room_${roomId}`,
        label: `Turnover task minutes for room ${roomId}`,
        value: roundToTwo(turnaroundMinutes),
        limitations: ROOM_TURNOVER_LIMITATIONS
      })
    );

    metrics.push(
      buildDynamicOperationalMetric({
        metricId: `delayed_turnover_minutes_by_room_${roomId}`,
        label: `Delayed turnover minutes for room ${roomId}`,
        value: roundToTwo(delayedMinutes),
        limitations: ROOM_TURNOVER_LIMITATIONS
      })
    );

    metrics.push(
      buildDynamicOperationalMetric({
        metricId: `missed_turnover_tasks_by_room_${roomId}`,
        label: `Missed turnover tasks for room ${roomId}`,
        value: missedCount,
        limitations: ROOM_TURNOVER_LIMITATIONS
      })
    );

    metrics.push(
      buildDynamicOperationalMetric({
        metricId: `room_turnover_pressure_by_room_${roomId}`,
        label: `Room turnover pressure score for room ${roomId}`,
        value: roundToTwo(roomPressure[roomId] ?? 0),
        limitations: ROOM_TURNOVER_LIMITATIONS
      })
    );
  }

  validateOperationalMetricContracts(metrics);

  return {
    schemaVersion: "1.0.0",
    summaryLabel: "Room turnover and blocked-time proxy",
    metrics
  };
}

function isRoomTurnoverTask(
  taskId: string,
  task?: { taskType?: string | null; roomId?: string | null }
): boolean {
  const taskType = task?.taskType?.toLowerCase();

  if (taskType != null) {
    if (taskType === "room_turnover") {
      return true;
    }

    if (taskType === "reset" || taskType === "room_reset") {
      return true;
    }
  }

  return /turnover|reset/i.test(taskId);
}

function resolveRoomId(taskId: string, taskToRoom: Record<string, string>): string {
  const direct = taskToRoom[taskId];
  if (direct != null) {
    return direct;
  }

  const roomMatch = taskId.match(/room-[a-z0-9-]+|hall-bed-[a-z0-9-]+/i);
  if (roomMatch != null) {
    return roomMatch[0].toLowerCase();
  }

  return `slot-${taskId.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

function estimateTaskDuration(startMinute?: number, completedMinute?: number): number {
  if (startMinute == null || completedMinute == null) {
    return 0;
  }
  const duration = completedMinute - startMinute;
  return duration > 0 ? duration : 0;
}

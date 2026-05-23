import {
  validateSimulationRunContract,
  type SimulationRunContract,
  type SimulationTravelEventContract
} from "../simulation/simulationRunContract.js";
import { type GeneratedOperationalTaskSetContract } from "../contracts.js";
import {
  buildOperationalMetric,
  sortedEntries,
  roundToTwo
} from "./outcomeMetricsBuilder.js";
import { validateOperationalMetricContracts, type OperationalMetricContract } from "./operationalMetricContract.js";

type BuildNurseWalkLayoutFrictionSummaryInput = {
  simulationRun: SimulationRunContract;
  generatedTaskSet?: GeneratedOperationalTaskSetContract;
};

export type BuildNurseWalkLayoutFrictionSummaryOutput = {
  schemaVersion: "1.0.0";
  summaryLabel: string;
  metrics: OperationalMetricContract[];
};

const LAYOUT_FRICTION_LIMITATIONS = [
  "Operational metric is operational-only and derived from validated simulation outputs.",
  "No external-system inferences, person identifiers, or PHI are represented.",
  "Assumptions are visible where derived aggregates include normalization or weighting.",
  "Layout friction is derived from walk/travel metrics using deterministic walk duration and event-weighting.",
  "No layout or clinical claims are represented; this is an operational movement proxy only."
];

export const NURSE_WALK_SUMMARY_UNITS = {
  nurseMinutes: "walk_minutes_by_nurse" as const,
  nurseEvents: "walk_events_by_nurse" as const
};

export function buildNurseWalkLayoutFrictionSummary(
  input: BuildNurseWalkLayoutFrictionSummaryInput
): BuildNurseWalkLayoutFrictionSummaryOutput {
  const run = validateSimulationRunContract(input.simulationRun);

  const travelEvents = run.events.filter(
    (event): event is SimulationTravelEventContract =>
      event.eventType === "travel"
      && (event.action === "travel_calculated" || event.action === "travel_unreachable")
  );

  const generatedTasks = input.generatedTaskSet?.generatedTasks ?? [];
  const taskToRoom = new Map<string, string>();
  for (const task of generatedTasks) {
    if (task.roomId != null) {
      taskToRoom.set(task.id, task.roomId);
    }
  }

  const knownNurses = new Set<string>();
  const knownTasks = new Set<string>();

  for (const event of run.events) {
    if (event.eventType === "task") {
      knownTasks.add(event.taskId);
      if (typeof event.nurseId === "string") {
        knownNurses.add(event.nurseId);
      }
    }
    if (event.eventType === "nurse" && event.nurseId != null) {
      knownNurses.add(event.nurseId);
    }
    if (event.eventType === "queue" && event.nurseId != null) {
      knownNurses.add(event.nurseId);
    }
  }
  for (const task of generatedTasks) {
    knownTasks.add(task.id);
  }

  const walkMinutesByNurse: Record<string, number> = {};
  const walkEventsByNurse: Record<string, number> = {};
  const walkMinutesByTask: Record<string, number> = {};
  const walkMinutesByRoom: Record<string, number> = {};

  let totalWalkMinutes = 0;

  for (const event of travelEvents) {
    const nurseId = event.nurseId;
    const taskId = event.taskId;
    const roomId = taskToRoom.get(taskId);

    const minutes = event.travelMinutes;
    totalWalkMinutes += minutes;

    walkMinutesByNurse[nurseId] = (walkMinutesByNurse[nurseId] ?? 0) + minutes;
    walkEventsByNurse[nurseId] = (walkEventsByNurse[nurseId] ?? 0) + 1;
    walkMinutesByTask[taskId] = (walkMinutesByTask[taskId] ?? 0) + minutes;
    if (roomId != null) {
      walkMinutesByRoom[roomId] = (walkMinutesByRoom[roomId] ?? 0) + minutes;
    }
  }

  if (travelEvents.length === 0) {
    for (const nurseId of [...knownNurses].sort()) {
      walkMinutesByNurse[nurseId] = walkMinutesByNurse[nurseId] ?? 0;
      walkEventsByNurse[nurseId] = walkEventsByNurse[nurseId] ?? 0;
    }
    for (const taskId of [...knownTasks].sort()) {
      walkMinutesByTask[taskId] = walkMinutesByTask[taskId] ?? 0;
      const roomId = taskToRoom.get(taskId);
      if (roomId != null) {
        walkMinutesByRoom[roomId] = walkMinutesByRoom[roomId] ?? 0;
      }
    }
    return finalizeSummary([], totalWalkMinutes, walkMinutesByNurse, walkEventsByNurse, walkMinutesByTask, walkMinutesByRoom);
  }

  for (const nurseId of [...knownNurses].sort()) {
    walkMinutesByNurse[nurseId] = walkMinutesByNurse[nurseId] ?? 0;
    walkEventsByNurse[nurseId] = walkEventsByNurse[nurseId] ?? 0;
  }
  for (const taskId of [...knownTasks].sort()) {
    walkMinutesByTask[taskId] = walkMinutesByTask[taskId] ?? 0;
    const roomId = taskToRoom.get(taskId);
    if (roomId != null) {
      walkMinutesByRoom[roomId] = walkMinutesByRoom[roomId] ?? 0;
    }
  }

  return finalizeSummary(
    travelEvents,
    totalWalkMinutes,
    walkMinutesByNurse,
    walkEventsByNurse,
    walkMinutesByTask,
    walkMinutesByRoom
  );
}

function finalizeSummary(
  travelEvents: SimulationTravelEventContract[],
  totalWalkMinutes: number,
  walkMinutesByNurse: Record<string, number>,
  walkEventsByNurse: Record<string, number>,
  walkMinutesByTask: Record<string, number>,
  walkMinutesByRoom: Record<string, number>
): BuildNurseWalkLayoutFrictionSummaryOutput {
  const metrics: OperationalMetricContract[] = [];

  metrics.push(
    buildOperationalMetric({
      metricId: "total_walk_minutes",
      label: "Total walk minutes",
      group: "nurse",
      unit: "minutes",
      value: roundToTwo(totalWalkMinutes),
      directionality: "lower_is_better",
      source: "travel_event",
      scope: "simulation",
      limitations: [...LAYOUT_FRICTION_LIMITATIONS]
    })
  );

  for (const [nurseId, minutes] of sortedEntries(walkMinutesByNurse)) {
    metrics.push(
      buildOperationalMetric({
        metricId: `${NURSE_WALK_SUMMARY_UNITS.nurseMinutes}_${nurseId}`,
        label: `Walk minutes for nurse ${nurseId}`,
        group: "nurse",
        unit: "minutes",
        value: roundToTwo(minutes),
        directionality: "lower_is_better",
        source: "travel_event",
        scope: "nurse",
        limitations: [...LAYOUT_FRICTION_LIMITATIONS]
      })
    );
    metrics.push(
      buildOperationalMetric({
        metricId: `${NURSE_WALK_SUMMARY_UNITS.nurseEvents}_${nurseId}`,
        label: `Walk events for nurse ${nurseId}`,
        group: "nurse",
        unit: "count",
        value: walkEventsByNurse[nurseId] ?? 0,
        directionality: "lower_is_better",
        source: "travel_event",
        scope: "nurse",
        limitations: [...LAYOUT_FRICTION_LIMITATIONS]
      })
    );
  }

  for (const [taskId, minutes] of sortedEntries(walkMinutesByTask)) {
    metrics.push(
      buildOperationalMetric({
        metricId: `walk_minutes_by_task_${taskId}`,
        label: `Walk minutes for task ${taskId}`,
        group: "task",
        unit: "minutes",
        value: roundToTwo(minutes),
        directionality: "lower_is_better",
        source: "travel_event",
        scope: "task",
        limitations: [...LAYOUT_FRICTION_LIMITATIONS]
      })
    );
  }

  for (const [roomId, minutes] of sortedEntries(walkMinutesByRoom)) {
    metrics.push(
      buildOperationalMetric({
        metricId: `walk_minutes_by_room_${roomId}`,
        label: `Walk minutes for room ${roomId}`,
        group: "room",
        unit: "minutes",
        value: roundToTwo(minutes),
        directionality: "lower_is_better",
        source: "travel_event",
        scope: "room",
        limitations: [...LAYOUT_FRICTION_LIMITATIONS]
      })
    );
  }

  const unreachablePenalty = travelEvents.filter((event) => event.action === "travel_unreachable").length * 2;
  const roomWeight = Object.keys(walkMinutesByRoom).length;
  const layoutFrictionScore =
    travelEvents.length === 0
      ? 0
      : totalWalkMinutes + (travelEvents.length * 0.5) + roomWeight + unreachablePenalty;

  metrics.push(
    buildOperationalMetric({
      metricId: "layout_friction_score",
      label: "Layout friction score",
      group: "layout",
      unit: "score",
      value: roundToTwo(layoutFrictionScore),
      directionality: "lower_is_better",
      source: "derived_proxy",
      scope: "layout",
      limitations: [...LAYOUT_FRICTION_LIMITATIONS, "Layout friction uses travel minutes, event counts, room coverage, and unreachable penalties only."]
    })
  );

  validateOperationalMetricContracts(metrics);

  return {
    schemaVersion: "1.0.0",
    summaryLabel: "Nurse walk and layout friction summary",
    metrics
  };
}


import {
  validateSimulationRunContract,
  type SimulationRunContract,
  type SimulationTravelEventContract
} from "../simulation/simulationRunContract.js";
import { type GeneratedOperationalTaskSetContract } from "../contracts.js";
import {
  buildDynamicOperationalMetric,
  buildRegisteredOperationalMetric,
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
  "Layout friction is derived from walk/travel metrics using deterministic walk duration, feet distance, and event-weighting.",
  "No layout or clinical claims are represented; this is an operational movement proxy only."
];

export const NURSE_WALK_SUMMARY_UNITS = {
  nurseMinutes: "walk_minutes_by_nurse" as const,
  nurseDistanceFeet: "walk_distance_feet_by_nurse" as const,
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
  const walkDistanceFeetByNurse: Record<string, number> = {};
  const walkEventsByNurse: Record<string, number> = {};
  const walkMinutesByTask: Record<string, number> = {};
  const walkMinutesByRoom: Record<string, number> = {};

  let totalWalkMinutes = 0;
  let totalWalkDistanceFeet = 0;

  for (const event of travelEvents) {
    const nurseId = event.nurseId;
    const taskId = event.taskId;
    const roomId = taskToRoom.get(taskId);

    const minutes = event.travelMinutes;
    const distanceFeet = event.travelDistanceFeet;
    totalWalkMinutes += minutes;
    totalWalkDistanceFeet += distanceFeet;

    walkMinutesByNurse[nurseId] = (walkMinutesByNurse[nurseId] ?? 0) + minutes;
    walkDistanceFeetByNurse[nurseId] = (walkDistanceFeetByNurse[nurseId] ?? 0) + distanceFeet;
    walkEventsByNurse[nurseId] = (walkEventsByNurse[nurseId] ?? 0) + 1;
    walkMinutesByTask[taskId] = (walkMinutesByTask[taskId] ?? 0) + minutes;
    if (roomId != null) {
      walkMinutesByRoom[roomId] = (walkMinutesByRoom[roomId] ?? 0) + minutes;
    }
  }

  if (travelEvents.length === 0) {
    for (const nurseId of [...knownNurses].sort()) {
      walkMinutesByNurse[nurseId] = walkMinutesByNurse[nurseId] ?? 0;
      walkDistanceFeetByNurse[nurseId] = walkDistanceFeetByNurse[nurseId] ?? 0;
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
      [],
      totalWalkMinutes,
      totalWalkDistanceFeet,
      walkMinutesByNurse,
      walkDistanceFeetByNurse,
      walkEventsByNurse,
      walkMinutesByTask,
      walkMinutesByRoom
    );
  }

  for (const nurseId of [...knownNurses].sort()) {
    walkMinutesByNurse[nurseId] = walkMinutesByNurse[nurseId] ?? 0;
    walkDistanceFeetByNurse[nurseId] = walkDistanceFeetByNurse[nurseId] ?? 0;
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
    totalWalkDistanceFeet,
    walkMinutesByNurse,
    walkDistanceFeetByNurse,
    walkEventsByNurse,
    walkMinutesByTask,
    walkMinutesByRoom
  );
}

function finalizeSummary(
  travelEvents: SimulationTravelEventContract[],
  totalWalkMinutes: number,
  totalWalkDistanceFeet: number,
  walkMinutesByNurse: Record<string, number>,
  walkDistanceFeetByNurse: Record<string, number>,
  walkEventsByNurse: Record<string, number>,
  walkMinutesByTask: Record<string, number>,
  walkMinutesByRoom: Record<string, number>
): BuildNurseWalkLayoutFrictionSummaryOutput {
  const metrics: OperationalMetricContract[] = [];

  metrics.push(
    buildRegisteredOperationalMetric({
      metricId: "total_walk_minutes",
      label: "Total walk minutes",
      value: roundToTwo(totalWalkMinutes),
      limitations: [...LAYOUT_FRICTION_LIMITATIONS]
    })
  );

  metrics.push(
    buildRegisteredOperationalMetric({
      metricId: "total_walk_distance_feet",
      label: "Total walk distance feet",
      value: roundToTwo(totalWalkDistanceFeet),
      limitations: [...LAYOUT_FRICTION_LIMITATIONS]
    })
  );

  for (const [nurseId, minutes] of sortedEntries(walkMinutesByNurse)) {
    metrics.push(
      buildDynamicOperationalMetric({
        metricId: `${NURSE_WALK_SUMMARY_UNITS.nurseMinutes}_${nurseId}`,
        label: `Walk minutes for nurse ${nurseId}`,
        value: roundToTwo(minutes),
        limitations: [...LAYOUT_FRICTION_LIMITATIONS]
      })
    );
    metrics.push(
      buildDynamicOperationalMetric({
        metricId: `${NURSE_WALK_SUMMARY_UNITS.nurseDistanceFeet}_${nurseId}`,
        label: `Walk distance feet for nurse ${nurseId}`,
        value: roundToTwo(walkDistanceFeetByNurse[nurseId] ?? 0),
        limitations: [...LAYOUT_FRICTION_LIMITATIONS]
      })
    );
    metrics.push(
      buildDynamicOperationalMetric({
        metricId: `${NURSE_WALK_SUMMARY_UNITS.nurseEvents}_${nurseId}`,
        label: `Walk events for nurse ${nurseId}`,
        value: walkEventsByNurse[nurseId] ?? 0,
        limitations: [...LAYOUT_FRICTION_LIMITATIONS]
      })
    );
  }

  for (const [taskId, minutes] of sortedEntries(walkMinutesByTask)) {
    metrics.push(
      buildDynamicOperationalMetric({
        metricId: `walk_minutes_by_task_${taskId}`,
        label: `Walk minutes for task ${taskId}`,
        value: roundToTwo(minutes),
        limitations: [...LAYOUT_FRICTION_LIMITATIONS]
      })
    );
  }

  for (const [roomId, minutes] of sortedEntries(walkMinutesByRoom)) {
    metrics.push(
      buildDynamicOperationalMetric({
        metricId: `walk_minutes_by_room_${roomId}`,
        label: `Walk minutes for room ${roomId}`,
        value: roundToTwo(minutes),
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
    buildRegisteredOperationalMetric({
      metricId: "layout_friction",
      label: "Layout friction score",
      value: roundToTwo(layoutFrictionScore),
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


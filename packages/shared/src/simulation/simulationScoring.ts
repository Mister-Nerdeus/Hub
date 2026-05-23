import {
  type SimulationEventContract,
  type SimulationRunContract,
  validateSimulationRunContract
} from "./simulationRunContract.js";
import {
  type SimulationScoreContract,
  type SimulationScoringAssumptions,
  validateSimulationScoreContract
} from "./simulationScoringContract.js";

export const DEFAULT_SIMULATION_SCORING_ASSUMPTIONS: SimulationScoringAssumptions = {
  delayedTaskWeight: 5,
  missedTaskWeight: 20,
  unassignedTaskWeight: 10,
  queueWaitMinuteWeight: 1,
  travelMinuteWeight: 0.5,
  nurseBusyMinuteWeight: 0.1
};

export const SIMULATION_SCORE_LIMITATIONS = [
  "Operational-only score derived from validated simulation run events.",
  "Weights are visible named assumptions in the score output.",
  "No optimizer-only score or clinical claim is applied."
];

export function buildSimulationScore(
  simulationRun: SimulationRunContract,
  assumptions: SimulationScoringAssumptions = DEFAULT_SIMULATION_SCORING_ASSUMPTIONS
): SimulationScoreContract {
  const run = validateSimulationRunContract(simulationRun);
  const taskEvents = run.events.filter((event) => event.eventType === "task");
  const queueEvents = run.events.filter((event) => event.eventType === "queue");
  const travelEvents = run.events.filter((event) => event.eventType === "travel");
  const nurseEvents = run.events.filter((event) => event.eventType === "nurse");
  const nurseBusyMinutes = summarizeNurseBusyMinutes(nurseEvents);
  const queueWaitMinutes = queueEvents
    .filter((event) => event.action === "started_from_queue")
    .reduce((total, event) => total + (event.waitMinutes ?? 0), 0);
  const travelMinutes = travelEvents.reduce((total, event) => total + event.travelMinutes, 0);
  const totalNurseBusyMinutes = Object.values(nurseBusyMinutes).reduce(
    (total, value) => total + value,
    0
  );
  const metrics = {
    completedTaskCount: uniqueTaskCount(taskEvents, "completed"),
    delayedTaskCount: uniqueTaskCount(taskEvents, "delayed"),
    missedTaskCount: uniqueTaskCount(taskEvents, "missed"),
    unassignedTaskCount: uniqueTaskCount(taskEvents, "unassigned"),
    queueWaitMinutes,
    travelMinutes,
    nurseBusyMinutes,
    totalNurseBusyMinutes,
    operationalBurdenScore: roundScore(
      uniqueTaskCount(taskEvents, "delayed") * assumptions.delayedTaskWeight +
        uniqueTaskCount(taskEvents, "missed") * assumptions.missedTaskWeight +
        uniqueTaskCount(taskEvents, "unassigned") * assumptions.unassignedTaskWeight +
        queueWaitMinutes * assumptions.queueWaitMinuteWeight +
        travelMinutes * assumptions.travelMinuteWeight +
        totalNurseBusyMinutes * assumptions.nurseBusyMinuteWeight
    )
  };

  return validateSimulationScoreContract(
    {
      schemaVersion: "1.0.0",
      simulationScoreId: `simulation-score-${run.simulationRunId}`,
      simulationRunId: run.simulationRunId,
      scenarioId: run.scenarioId,
      generatedTaskSetId: run.generatedTaskSetId,
      assignmentSetId: run.assignmentSetId,
      metrics,
      definitions: [
        {
          metricId: "completedTaskCount",
          source: "Unique task completed events."
        },
        {
          metricId: "delayedTaskCount",
          source: "Unique task delayed events."
        },
        {
          metricId: "missedTaskCount",
          source: "Unique task missed events."
        },
        {
          metricId: "unassignedTaskCount",
          source: "Unique task unassigned events."
        },
        {
          metricId: "queueWaitMinutes",
          source: "Queue started-from-queue event wait minutes."
        },
        {
          metricId: "travelMinutes",
          source: "Travel event minutes."
        },
        {
          metricId: "nurseBusyMinutesByNurse",
          source: "Nurse completed-task event duration minutes."
        },
        {
          metricId: "operationalBurdenScore",
          source: "Visible named assumptions multiplied by derived event metrics."
        }
      ],
      assumptions,
      limitations: [...SIMULATION_SCORE_LIMITATIONS]
    },
    run
  );
}

function uniqueTaskCount(
  events: Extract<SimulationEventContract, { eventType: "task" }>[],
  action: string
): number {
  return new Set(events.filter((event) => event.action === action).map((event) => event.taskId))
    .size;
}

function summarizeNurseBusyMinutes(
  events: Extract<SimulationEventContract, { eventType: "nurse" }>[]
): Record<string, number> {
  const minutes: Record<string, number> = {};
  for (const event of events) {
    if (event.action !== "completed_task") {
      continue;
    }
    minutes[event.nurseId] = (minutes[event.nurseId] ?? 0) + (event.durationMinutes ?? 0);
  }
  return Object.fromEntries(
    Object.entries(minutes).sort(([left], [right]) => left.localeCompare(right))
  );
}

function roundScore(value: number): number {
  return Math.round(value * 1000) / 1000;
}

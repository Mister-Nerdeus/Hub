import type { SimulationEventContract } from "@nerdeus/shared";

import {
  simulationTimelineProofFixture,
  type SimulationTimelineProofFixture
} from "../../fixtures/simulationTimelineProof";

export type SimulationTimelineViewModel = {
  sourceIds: Array<{ label: string; value: string }>;
  summaryMetrics: Array<{ label: string; value: number }>;
  timelineEvents: Array<{
    eventId: string;
    minute: number;
    label: string;
    detail: string;
  }>;
  nurseBurdenRows: Array<{
    nurseId: string;
    busyMinutes: number;
  }>;
  limitationRows: string[];
};

export function createSimulationTimelineViewModel(
  fixture: SimulationTimelineProofFixture = simulationTimelineProofFixture
): SimulationTimelineViewModel {
  const { simulationRun, simulationScore, report } = fixture;
  return {
    sourceIds: [
      { label: "Simulation run", value: simulationRun.simulationRunId },
      { label: "Scenario", value: simulationRun.scenarioId },
      { label: "Generated tasks", value: simulationRun.generatedTaskSetId },
      { label: "Assignment", value: simulationRun.assignmentSetId },
      { label: "Score", value: simulationScore.simulationScoreId },
      { label: "Report", value: report.reportId }
    ],
    summaryMetrics: [
      { label: "Completed", value: report.summary.completedTaskCount },
      { label: "Delayed", value: report.summary.delayedTaskCount },
      { label: "Missed", value: report.summary.missedTaskCount },
      { label: "Unassigned", value: report.summary.unassignedTaskCount },
      { label: "Queue wait", value: report.summary.queueWaitMinutes },
      { label: "Travel", value: report.summary.travelMinutes }
    ],
    timelineEvents: simulationRun.events.map(toTimelineEvent),
    nurseBurdenRows: report.nurseWorkload.map((row) => ({
      nurseId: row.nurseId,
      busyMinutes: row.busyMinutes
    })),
    limitationRows: [
      ...new Set([...simulationRun.limitations, ...simulationScore.limitations, ...report.limitations])
    ]
  };
}

function toTimelineEvent(event: SimulationEventContract): {
  eventId: string;
  minute: number;
  label: string;
  detail: string;
} {
  if (event.eventType === "task") {
    return {
      eventId: event.eventId,
      minute: event.minute,
      label: `${event.action} task`,
      detail: event.nurseId == null ? event.taskId : `${event.taskId} / ${event.nurseId}`
    };
  }
  if (event.eventType === "nurse") {
    return {
      eventId: event.eventId,
      minute: event.minute,
      label: `${event.action} nurse`,
      detail: event.taskId == null ? event.nurseId : `${event.nurseId} / ${event.taskId}`
    };
  }
  if (event.eventType === "queue") {
    return {
      eventId: event.eventId,
      minute: event.minute,
      label: `${event.action} queue`,
      detail: `${event.nurseId} / ${event.taskId} / ${event.waitMinutes ?? 0} min`
    };
  }
  return {
    eventId: event.eventId,
    minute: event.minute,
    label: `${event.action} travel`,
    detail: `${event.nurseId} / ${event.taskId} / ${event.travelMinutes} min`
  };
}

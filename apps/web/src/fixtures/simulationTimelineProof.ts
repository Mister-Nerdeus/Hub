import type {
  SimulationOperationalReportContract,
  SimulationRunContract,
  SimulationScoreContract
} from "@nerdeus/shared";

export type SimulationTimelineProofFixture = {
  simulationRun: SimulationRunContract;
  simulationScore: SimulationScoreContract;
  report: SimulationOperationalReportContract;
};

export const simulationTimelineProofFixture: SimulationTimelineProofFixture = {
  simulationRun: {
    schemaVersion: "1.0.0",
    simulationRunId: "simulation-run-basic",
    scenarioId: "shift-scenario-basic",
    generatedTaskSetId: "generated-task-set-basic",
    assignmentSetId: "manual-assignment-basic",
    events: [
      {
        eventId: "task-task-basic-room-01-medication-001-ready",
        eventType: "task",
        action: "ready",
        taskId: "task-basic-room-01-medication-001",
        minute: 0,
        scheduledMinute: 0
      },
      {
        eventId: "task-task-basic-room-01-medication-001-started",
        eventType: "task",
        action: "started",
        taskId: "task-basic-room-01-medication-001",
        nurseId: "nurse-alpha",
        minute: 0,
        scheduledMinute: 0,
        startMinute: 0,
        durationMinutes: 10,
        queueWaitMinutes: 0,
        travelMinutes: 0
      },
      {
        eventId: "task-task-basic-hall-bed-01-turnover-001-unassigned",
        eventType: "task",
        action: "unassigned",
        taskId: "task-basic-hall-bed-01-turnover-001",
        minute: 15,
        scheduledMinute: 15,
        missReason: "unassigned"
      },
      {
        eventId: "queue-nurse-alpha-task-basic-room-03-isolation-001-started",
        eventType: "queue",
        action: "started_from_queue",
        nurseId: "nurse-alpha",
        taskId: "task-basic-room-03-isolation-001",
        minute: 30,
        originalReadyMinute: 30,
        enteredQueueMinute: 30,
        startedMinute: 30,
        waitMinutes: 0,
        orderingReason: "Started after deterministic nurse availability and queue ordering."
      },
      {
        eventId: "travel-nurse-charlie-task-basic-room-05-procedure-001",
        eventType: "travel",
        action: "travel_calculated",
        nurseId: "nurse-charlie",
        taskId: "task-basic-room-05-procedure-001",
        minute: 45,
        originNodeId: "node-station-primary",
        destinationNodeId: "node-door-room-05",
        routeNodeIds: ["node-station-primary", "node-hall-east", "node-hall-mid", "node-hall-west", "node-door-room-05"],
        routeEdgeIds: ["edge-hall-east-station", "edge-hall-mid-east", "edge-hall-west-mid", "edge-room-05-hall"],
        travelSeconds: 25.4,
        travelMinutes: 1,
        warnings: []
      }
    ],
    summary: {
      totalTasks: 6,
      completedTaskCount: 5,
      delayedTaskCount: 0,
      missedTaskCount: 0,
      unassignedTaskCount: 1
    },
    limitations: [
      "Operational-only deterministic shift execution result from synthetic task and assignment inputs.",
      "No optimizer or clinical claim is applied."
    ]
  },
  simulationScore: {
    schemaVersion: "1.0.0",
    simulationScoreId: "simulation-score-simulation-run-basic",
    simulationRunId: "simulation-run-basic",
    scenarioId: "shift-scenario-basic",
    generatedTaskSetId: "generated-task-set-basic",
    assignmentSetId: "manual-assignment-basic",
    metrics: {
      completedTaskCount: 5,
      delayedTaskCount: 0,
      missedTaskCount: 0,
      unassignedTaskCount: 1,
      queueWaitMinutes: 0,
      travelMinutes: 1,
      nurseBusyMinutes: {
        "nurse-alpha": 18,
        "nurse-bravo": 15,
        "nurse-charlie": 25
      },
      totalNurseBusyMinutes: 58,
      operationalBurdenScore: 16.3
    },
    definitions: [
      {
        metricId: "operationalBurdenScore",
        source: "Visible named assumptions multiplied by derived event metrics."
      }
    ],
    assumptions: {
      delayedTaskWeight: 5,
      missedTaskWeight: 20,
      unassignedTaskWeight: 10,
      queueWaitMinuteWeight: 1,
      travelMinuteWeight: 0.5,
      nurseBusyMinuteWeight: 0.1
    },
    limitations: [
      "Operational-only score derived from validated simulation run events."
    ]
  },
  report: {
    schemaVersion: "1.0.0",
    reportId: "simulation-operational-report-basic",
    reportType: "simulation_operational_report",
    simulationRunId: "simulation-run-basic",
    simulationScoreId: "simulation-score-simulation-run-basic",
    scenarioId: "shift-scenario-basic",
    generatedTaskSetId: "generated-task-set-basic",
    assignmentSetId: "manual-assignment-basic",
    summary: {
      completedTaskCount: 5,
      delayedTaskCount: 0,
      missedTaskCount: 0,
      unassignedTaskCount: 1,
      queueWaitMinutes: 0,
      travelMinutes: 1,
      operationalBurdenScore: 16.3
    },
    nurseWorkload: [
      { nurseId: "nurse-alpha", busyMinutes: 18 },
      { nurseId: "nurse-bravo", busyMinutes: 15 },
      { nurseId: "nurse-charlie", busyMinutes: 25 }
    ],
    limitations: [
      "Operational-only report derived from validated simulation run and score outputs.",
      "Report values mirror the source simulation score."
    ]
  }
};

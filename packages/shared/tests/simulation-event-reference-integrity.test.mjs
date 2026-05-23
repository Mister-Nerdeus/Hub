import assert from "node:assert/strict";
import test from "node:test";

import { validateSimulationRunContract } from "../dist/index.js";

function validRun() {
  return {
    schemaVersion: "1.0.0",
    simulationRunId: "simulation-reference-integrity",
    scenarioId: "shift-scenario-reference-integrity",
    generatedTaskSetId: "generated-task-set-reference-integrity",
    assignmentSetId: "assignment-set-reference-integrity",
    events: [],
    summary: {
      totalTasks: 0,
      completedTaskCount: 0,
      delayedTaskCount: 0,
      missedTaskCount: 0,
      unassignedTaskCount: 0
    },
    limitations: ["Operational-only reference integrity validation payload."]
  };
}

function assertRejectsOrphanTaskReference(event) {
  const run = validRun();
  run.events.push(event);

  assert.throws(
    () => validateSimulationRunContract(run),
    /task-event stream|task event stream|task events/i
  );
}

test("rejects orphan queue task references", () => {
  assertRejectsOrphanTaskReference({
    eventId: "queue-orphan-task",
    eventType: "queue",
    action: "entered_queue",
    taskId: "missing-task-id",
    nurseId: "nurse-alpha",
    minute: 0,
    originalReadyMinute: 0,
    enteredQueueMinute: 0,
    orderingReason: "Orphan queue event must fail."
  });
});

test("rejects orphan travel task references", () => {
  assertRejectsOrphanTaskReference({
    eventId: "travel-orphan-task",
    eventType: "travel",
    action: "travel_calculated",
    taskId: "missing-task-id",
    nurseId: "nurse-alpha",
    minute: 0,
    originNodeId: "nurse-station",
    destinationNodeId: "room-1",
    routeNodeIds: ["nurse-station", "room-1"],
    routeEdgeIds: ["edge-nurse-station-room-1"],
    travelSeconds: 30,
    travelMinutes: 1,
    warnings: []
  });
});

test("rejects orphan nurse task references", () => {
  assertRejectsOrphanTaskReference({
    eventId: "nurse-orphan-task",
    eventType: "nurse",
    action: "started_task",
    taskId: "missing-task-id",
    nurseId: "nurse-alpha",
    minute: 0,
    durationMinutes: 5
  });
});

test("accepts non-task references when the task appears in the task-event stream", () => {
  const run = validRun();
  run.events = [
    {
      eventId: "task-ready",
      eventType: "task",
      action: "ready",
      taskId: "task-alpha",
      minute: 0,
      scheduledMinute: 0
    },
    {
      eventId: "queue-known-task",
      eventType: "queue",
      action: "entered_queue",
      taskId: "task-alpha",
      nurseId: "nurse-alpha",
      minute: 0,
      originalReadyMinute: 0,
      enteredQueueMinute: 0,
      orderingReason: "Known task reference validation fixture."
    },
    {
      eventId: "travel-known-task",
      eventType: "travel",
      action: "travel_calculated",
      taskId: "task-alpha",
      nurseId: "nurse-alpha",
      minute: 0,
      originNodeId: "nurse-station",
      destinationNodeId: "room-1",
      routeNodeIds: ["nurse-station", "room-1"],
      routeEdgeIds: ["edge-nurse-station-room-1"],
      travelSeconds: 30,
      travelMinutes: 1,
      warnings: []
    },
    {
      eventId: "nurse-known-task",
      eventType: "nurse",
      action: "started_task",
      taskId: "task-alpha",
      nurseId: "nurse-alpha",
      minute: 0,
      durationMinutes: 5
    }
  ];
  run.summary.totalTasks = 1;

  assert.equal(validateSimulationRunContract(run).events.length, 4);
});

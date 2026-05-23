import assert from "node:assert/strict";
import test from "node:test";

import { validateSimulationRunContract } from "../dist/index.js";

function runWithQueueAction(action) {
  return {
    schemaVersion: "1.0.0",
    simulationRunId: `simulation-run-queue-${action}`,
    scenarioId: "shift-scenario-basic",
    generatedTaskSetId: "generated-task-set-basic",
    assignmentSetId: "manual-assignment-basic",
    events: [
      {
        eventId: `task-basic-ready-${action}`,
        eventType: "task",
        action: "ready",
        taskId: "task-basic",
        minute: 0,
        scheduledMinute: 0
      },
      {
        eventId: `queue-nurse-alpha-task-basic-${action}`,
        eventType: "queue",
        action,
        nurseId: "nurse-alpha",
        taskId: "task-basic",
        minute: 0,
        originalReadyMinute: 0,
        enteredQueueMinute: 0,
        orderingReason: "Queue action validation fixture."
      }
    ],
    summary: {
      totalTasks: 1,
      completedTaskCount: 0,
      delayedTaskCount: 0,
      missedTaskCount: 0,
      unassignedTaskCount: 0
    },
    limitations: ["Operational-only queue action validation fixture."]
  };
}

test("paused queue action is rejected", () => {
  assert.throws(() => validateSimulationRunContract(runWithQueueAction("paused")), /action/);
});

test("resumed queue action is rejected", () => {
  assert.throws(() => validateSimulationRunContract(runWithQueueAction("resumed")), /action/);
});

test("existing queue actions still validate", () => {
  for (const action of ["entered_queue", "started_from_queue", "released"]) {
    const run = runWithQueueAction(action);
    if (action !== "entered_queue") {
      run.events[1].startedMinute = 0;
    }
    assert.doesNotThrow(() => validateSimulationRunContract(run));
  }
});

import assert from "node:assert/strict";
import test from "node:test";

import { buildPatientWaitIdleProxy } from "../dist/index.js";

function buildProjectedMissRun() {
  return {
    schemaVersion: "1.0.0",
    simulationRunId: "simulation-run-issue-130-projected-missed",
    scenarioId: "shift-scenario-basic",
    generatedTaskSetId: "generated-task-set-issue-130-projected-missed",
    assignmentSetId: "nurse-task-assignment-basic",
    events: [
      {
        eventId: "task-task-issue130-room-01-check-ready",
        eventType: "task",
        action: "ready",
        taskId: "task-issue130-room-01-check",
        minute: 90,
        scheduledMinute: 90
      },
      {
        eventId: "task-task-issue130-room-01-check-missed",
        eventType: "task",
        action: "missed",
        taskId: "task-issue130-room-01-check",
        nurseId: "nurse-alpha",
        minute: 120,
        scheduledMinute: 90,
        missReason: "not_started_shift_window_exceeded",
        projectedStartMinute: 115,
        projectedTravelMinutes: 5,
        projectedCompletionMinute: 150,
        shiftDurationMinutes: 120
      }
    ],
    summary: {
      totalTasks: 1,
      completedTaskCount: 0,
      delayedTaskCount: 0,
      missedTaskCount: 1,
      unassignedTaskCount: 0
    },
    limitations: ["Issue 130 projected missed-task operational fixture."]
  };
}

test("buildPatientWaitIdleProxy includes projected missed-task pressure when projected fields exist", () => {
  const output = buildPatientWaitIdleProxy({
    simulationRun: buildProjectedMissRun(),
    generatedTaskSet: {
      schemaVersion: "1.0.0",
      generatedTaskSetId: "generated-task-set-issue-130-projected-missed",
      scenarioId: "shift-scenario-basic",
      seed: 20260523,
      taskCount: 1,
      generatedTasks: [
        {
          id: "task-issue130-room-01-check",
          taskType: "monitoring_check",
          roomId: "room-01",
          sourceTemplateId: "template-check",
          scheduledMinute: 90,
          estimatedDurationMinutes: 30,
          burdenCategory: "monitoring",
          interruptive: false,
          requiresRoomPresence: true
        }
      ]
    }
  });

  const projectedPressure = output.metrics.find(
    (metric) => metric.metricId === "projected_missed_task_pressure_minutes"
  );
  const terminalPenalty = output.metrics.find(
    (metric) => metric.metricId === "missed_unassigned_proxy_penalty_minutes"
  );
  const total = output.metrics.find(
    (metric) => metric.metricId === "patient_flow_wait_idle_minutes"
  );
  const roomTotal = output.metrics.find(
    (metric) => metric.metricId === "patient_flow_wait_idle_by_room_room-01"
  );

  assert.equal(projectedPressure?.value, 30);
  assert.equal(terminalPenalty?.value, 30);
  assert.equal(total?.value, 60);
  assert.equal(roomTotal?.value, 60);
});

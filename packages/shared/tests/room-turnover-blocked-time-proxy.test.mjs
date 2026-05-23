import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import {
  buildRoomTurnoverBlockedTimeProxy,
  validateOperationalMetricContracts
} from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));

function readFixture(name) {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8"));
}

function buildGeneratedTaskSet() {
  return {
    schemaVersion: "1.0.0",
    generatedTaskSetId: "generated-task-set-issue-121-basic",
    scenarioId: "shift-scenario-basic",
    seed: 20260523,
    taskCount: 5,
    generatedTasks: [
      {
        id: "task-issue121-room-01-turnover-001",
        taskType: "room_turnover",
        roomId: "room-01",
        sourceTemplateId: "template-room-turnover",
        scheduledMinute: 0,
        estimatedDurationMinutes: 18,
        burdenCategory: "turnover",
        interruptive: false,
        requiresRoomPresence: true
      },
      {
        id: "task-issue121-room-01-reset-001",
        taskType: "procedure_support",
        roomId: "room-01",
        sourceTemplateId: "template-room-reset",
        scheduledMinute: 30,
        estimatedDurationMinutes: 16,
        burdenCategory: "procedure",
        interruptive: false,
        requiresRoomPresence: true
      },
      {
        id: "task-issue121-room-02-turnover-001",
        taskType: "room_turnover",
        roomId: "room-02",
        sourceTemplateId: "template-room-turnover",
        scheduledMinute: 15,
        estimatedDurationMinutes: 10,
        burdenCategory: "turnover",
        interruptive: false,
        requiresRoomPresence: true
      },
      {
        id: "task-issue121-room-03-monitor-001",
        taskType: "monitoring_check",
        roomId: "room-03",
        sourceTemplateId: "template-monitoring",
        scheduledMinute: 55,
        estimatedDurationMinutes: 11,
        burdenCategory: "monitoring",
        interruptive: false,
        requiresRoomPresence: true
      },
      {
        id: "task-issue121-room-03-medication-001",
        taskType: "medication_round",
        roomId: "room-03",
        sourceTemplateId: "template-medication",
        scheduledMinute: 85,
        estimatedDurationMinutes: 6,
        burdenCategory: "medication",
        interruptive: false,
        requiresRoomPresence: true
      }
    ]
  };
}

function buildFixtureRun() {
  return {
    schemaVersion: "1.0.0",
    simulationRunId: "simulation-run-issue-121-basic",
    scenarioId: "shift-scenario-basic",
    generatedTaskSetId: "generated-task-set-issue-121-basic",
    assignmentSetId: "nurse-task-assignment-basic",
    events: [
      {
        eventId: "task-task-issue121-room-01-turnover-001-ready",
        eventType: "task",
        action: "ready",
        taskId: "task-issue121-room-01-turnover-001",
        minute: 0,
        scheduledMinute: 0
      },
      {
        eventId: "task-task-issue121-room-01-turnover-001-started",
        eventType: "task",
        action: "started",
        taskId: "task-issue121-room-01-turnover-001",
        minute: 1,
        scheduledMinute: 0,
        startMinute: 1
      },
      {
        eventId: "task-task-issue121-room-01-turnover-001-completed",
        eventType: "task",
        action: "completed",
        taskId: "task-issue121-room-01-turnover-001",
        minute: 19,
        scheduledMinute: 0,
        startMinute: 1,
        completedMinute: 19,
        durationMinutes: 18
      },
      {
        eventId: "task-task-issue121-room-01-reset-001-ready",
        eventType: "task",
        action: "ready",
        taskId: "task-issue121-room-01-reset-001",
        minute: 30,
        scheduledMinute: 30
      },
      {
        eventId: "task-task-issue121-room-01-reset-001-started",
        eventType: "task",
        action: "started",
        taskId: "task-issue121-room-01-reset-001",
        minute: 50,
        scheduledMinute: 30,
        startMinute: 50
      },
      {
        eventId: "task-task-issue121-room-01-reset-001-delayed",
        eventType: "task",
        action: "delayed",
        taskId: "task-issue121-room-01-reset-001",
        minute: 60,
        scheduledMinute: 30,
        delayMinutes: 6,
        startMinute: 50
      },
      {
        eventId: "task-task-issue121-room-01-reset-001-completed",
        eventType: "task",
        action: "completed",
        taskId: "task-issue121-room-01-reset-001",
        minute: 78,
        scheduledMinute: 30,
        startMinute: 50,
        completedMinute: 78,
        durationMinutes: 28
      },
      {
        eventId: "task-task-issue121-room-02-turnover-001-ready",
        eventType: "task",
        action: "ready",
        taskId: "task-issue121-room-02-turnover-001",
        minute: 15,
        scheduledMinute: 15
      },
      {
        eventId: "task-task-issue121-room-02-turnover-001-missed",
        eventType: "task",
        action: "missed",
        taskId: "task-issue121-room-02-turnover-001",
        minute: 75,
        scheduledMinute: 15,
        missReason: "not_started_shift_window_exceeded",
        projectedStartMinute: 90,
        projectedTravelMinutes: 5,
        projectedCompletionMinute: 100,
        shiftDurationMinutes: 120
      },
      {
        eventId: "task-task-issue121-room-03-monitor-001-ready",
        eventType: "task",
        action: "ready",
        taskId: "task-issue121-room-03-monitor-001",
        minute: 55,
        scheduledMinute: 55
      },
      {
        eventId: "task-task-issue121-room-03-monitor-001-started",
        eventType: "task",
        action: "started",
        taskId: "task-issue121-room-03-monitor-001",
        minute: 56,
        scheduledMinute: 55,
        startMinute: 56
      },
      {
        eventId: "task-task-issue121-room-03-monitor-001-completed",
        eventType: "task",
        action: "completed",
        taskId: "task-issue121-room-03-monitor-001",
        minute: 66,
        scheduledMinute: 55,
        startMinute: 56,
        completedMinute: 66,
        durationMinutes: 10
      },
      {
        eventId: "task-task-issue121-room-03-medication-001-ready",
        eventType: "task",
        action: "ready",
        taskId: "task-issue121-room-03-medication-001",
        minute: 85,
        scheduledMinute: 85
      },
      {
        eventId: "task-task-issue121-room-03-medication-001-started",
        eventType: "task",
        action: "started",
        taskId: "task-issue121-room-03-medication-001",
        minute: 90,
        scheduledMinute: 85,
        startMinute: 90
      },
      {
        eventId: "task-task-issue121-room-03-medication-001-completed",
        eventType: "task",
        action: "completed",
        taskId: "task-issue121-room-03-medication-001",
        minute: 96,
        scheduledMinute: 85,
        startMinute: 90,
        completedMinute: 96,
        durationMinutes: 6
      }
    ],
    summary: {
      totalTasks: 5,
      completedTaskCount: 4,
      delayedTaskCount: 1,
      missedTaskCount: 1,
      unassignedTaskCount: 0
    },
    limitations: ["Issue 121 turnover fixture."]
  };
}

function buildHighBlockRun() {
  const high = buildFixtureRun();
  high.simulationRunId = "simulation-run-issue-121-high-pressure";
  high.events = high.events.map((event) => {
    if (event.eventType === "task" && event.action === "missed" && event.taskId === "task-issue121-room-02-turnover-001") {
      return {
        ...event,
        minute: 130
      };
    }
    return event;
  });
  return high;
}

test("buildRoomTurnoverBlockedTimeProxy adds deterministic room blocked-time proxy metrics", () => {
  const output = buildRoomTurnoverBlockedTimeProxy({
    simulationRun: buildFixtureRun(),
    generatedTaskSet: buildGeneratedTaskSet()
  });
  const fixture = readFixture("outcomes/room-turnover-blocked-time-proxy-basic.json");

  assert.deepEqual(output, fixture);
  assert.equal(validateOperationalMetricContracts(output.metrics).length, output.metrics.length);
  assert.equal(
    output.metrics.some((metric) => metric.metricId === "room_turnover_pressure_by_room_room-02"),
    true
  );
  assert.equal(output.metrics.some((metric) => metric.metricId === "blocked_room_minutes_by_room_room-01"), true);
});

test("buildRoomTurnoverBlockedTimeProxy pressure increases with additional turnover/missed load", () => {
  const low = buildRoomTurnoverBlockedTimeProxy({
    simulationRun: buildFixtureRun(),
    generatedTaskSet: buildGeneratedTaskSet()
  });
  const high = buildRoomTurnoverBlockedTimeProxy({
    simulationRun: buildHighBlockRun(),
    generatedTaskSet: buildGeneratedTaskSet()
  });

  const lowPressure = low.metrics.find((metric) => metric.metricId === "room_pressure_score");
  const highPressure = high.metrics.find((metric) => metric.metricId === "room_pressure_score");

  assert.equal(typeof lowPressure?.value, "number");
  assert.equal(typeof highPressure?.value, "number");
  assert.equal(highPressure.value > lowPressure.value, true);
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import {
  buildPatientWaitIdleProxy,
  validateOperationalMetricContracts
} from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));

function readFixture(name) {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8"));
}

function buildGeneratedTaskSet() {
  return {
    schemaVersion: "1.0.0",
    generatedTaskSetId: "generated-task-set-issue-120-basic",
    scenarioId: "shift-scenario-basic",
    seed: 20260523,
    taskCount: 4,
    generatedTasks: [
      {
        id: "task-issue120-room-01-assessment-001",
        taskType: "monitoring_check",
        roomId: "room-01",
        sourceTemplateId: "template-assessment",
        scheduledMinute: 0,
        estimatedDurationMinutes: 9,
        burdenCategory: "monitoring",
        interruptive: false,
        requiresRoomPresence: true
      },
      {
        id: "task-issue120-room-02-monitoring-001",
        taskType: "monitoring_check",
        roomId: "room-02",
        sourceTemplateId: "template-monitoring",
        scheduledMinute: 20,
        estimatedDurationMinutes: 12,
        burdenCategory: "monitoring",
        interruptive: false,
        requiresRoomPresence: true
      },
      {
        id: "task-issue120-room-02-followup-001",
        taskType: "monitoring_check",
        roomId: "room-02",
        sourceTemplateId: "template-followup",
        scheduledMinute: 35,
        estimatedDurationMinutes: 7,
        burdenCategory: "monitoring",
        interruptive: false,
        requiresRoomPresence: true
      },
      {
        id: "task-issue120-room-03-check-001",
        taskType: "medication_round",
        roomId: "room-03",
        sourceTemplateId: "template-check",
        scheduledMinute: 60,
        estimatedDurationMinutes: 14,
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
    simulationRunId: "simulation-run-issue-120-basic",
    scenarioId: "shift-scenario-basic",
    generatedTaskSetId: "generated-task-set-issue-120-basic",
    assignmentSetId: "nurse-task-assignment-basic",
    events: [
      {
        eventId: "task-task-issue120-room-01-assessment-001-ready",
        eventType: "task",
        action: "ready",
        taskId: "task-issue120-room-01-assessment-001",
        minute: 0,
        scheduledMinute: 0
      },
      {
        eventId: "task-task-issue120-room-01-assessment-001-started",
        eventType: "task",
        action: "started",
        taskId: "task-issue120-room-01-assessment-001",
        minute: 3,
        scheduledMinute: 0,
        startMinute: 3
      },
      {
        eventId: "task-task-issue120-room-01-assessment-001-delayed",
        eventType: "task",
        action: "delayed",
        taskId: "task-issue120-room-01-assessment-001",
        minute: 4,
        scheduledMinute: 0,
        delayMinutes: 2,
        startMinute: 3
      },
      {
        eventId: "task-task-issue120-room-01-assessment-001-completed",
        eventType: "task",
        action: "completed",
        taskId: "task-issue120-room-01-assessment-001",
        minute: 12,
        scheduledMinute: 0,
        startMinute: 3,
        completedMinute: 12,
        durationMinutes: 9
      },
      {
        eventId: "task-task-issue120-room-02-monitoring-001-ready",
        eventType: "task",
        action: "ready",
        taskId: "task-issue120-room-02-monitoring-001",
        minute: 20,
        scheduledMinute: 20
      },
      {
        eventId: "task-task-issue120-room-02-monitoring-001-started",
        eventType: "task",
        action: "started",
        taskId: "task-issue120-room-02-monitoring-001",
        minute: 55,
        scheduledMinute: 20,
        startMinute: 55
      },
      {
        eventId: "task-task-issue120-room-02-monitoring-001-delayed",
        eventType: "task",
        action: "delayed",
        taskId: "task-issue120-room-02-monitoring-001",
        minute: 58,
        scheduledMinute: 20,
        delayMinutes: 5,
        startMinute: 55
      },
      {
        eventId: "task-task-issue120-room-02-monitoring-001-completed",
        eventType: "task",
        action: "completed",
        taskId: "task-issue120-room-02-monitoring-001",
        minute: 67,
        scheduledMinute: 20,
        startMinute: 55,
        completedMinute: 67,
        durationMinutes: 12
      },
      {
        eventId: "task-task-issue120-room-02-followup-001-ready",
        eventType: "task",
        action: "ready",
        taskId: "task-issue120-room-02-followup-001",
        minute: 35,
        scheduledMinute: 35
      },
      {
        eventId: "task-task-issue120-room-02-followup-001-unassigned",
        eventType: "task",
        action: "unassigned",
        taskId: "task-issue120-room-02-followup-001",
        minute: 50,
        scheduledMinute: 35,
        nurseId: "nurse-alpha"
      },
      {
        eventId: "task-task-issue120-room-03-check-001-ready",
        eventType: "task",
        action: "ready",
        taskId: "task-issue120-room-03-check-001",
        minute: 60,
        scheduledMinute: 60
      },
      {
        eventId: "task-task-issue120-room-03-check-001-started",
        eventType: "task",
        action: "started",
        taskId: "task-issue120-room-03-check-001",
        minute: 120,
        scheduledMinute: 60,
        startMinute: 120
      },
      {
        eventId: "task-task-issue120-room-03-check-001-delayed",
        eventType: "task",
        action: "delayed",
        taskId: "task-issue120-room-03-check-001",
        minute: 123,
        scheduledMinute: 60,
        delayMinutes: 1,
        startMinute: 120
      },
      {
        eventId: "task-task-issue120-room-03-check-001-completed",
        eventType: "task",
        action: "completed",
        taskId: "task-issue120-room-03-check-001",
        minute: 134,
        scheduledMinute: 60,
        startMinute: 120,
        completedMinute: 134,
        durationMinutes: 14
      }
    ],
    summary: {
      totalTasks: 4,
      completedTaskCount: 3,
      delayedTaskCount: 3,
      missedTaskCount: 0,
      unassignedTaskCount: 1
    },
    limitations: ["Issue 120 low proxy fixture."]
  };
}

function buildHighDelayRun() {
  const high = buildFixtureRun();
  high.simulationRunId = "simulation-run-issue-120-high-delay";
  high.events = high.events.map((event) => {
    if (event.eventType === "task" && event.action === "started" && event.taskId === "task-issue120-room-02-monitoring-001") {
      return {
        ...event,
        minute: 140,
        startMinute: 140
      };
    }
    if (event.eventType === "task" && event.action === "delayed" && event.taskId === "task-issue120-room-02-monitoring-001") {
      return {
        ...event,
        delayMinutes: 20
      };
    }
    if (event.eventType === "task" && event.action === "completed" && event.taskId === "task-issue120-room-02-monitoring-001") {
      return {
        ...event,
        minute: 152,
        completedMinute: 152
      };
    }
    if (event.eventType === "task" && event.action === "unassigned" && event.taskId === "task-issue120-room-02-followup-001") {
      return {
        ...event,
        minute: 120
      };
    }
    return event;
  });
  return high;
}

test("buildPatientWaitIdleProxy adds deterministic patient-flow wait/idle proxy metrics", () => {
  const output = buildPatientWaitIdleProxy({
    simulationRun: buildFixtureRun(),
    generatedTaskSet: buildGeneratedTaskSet()
  });
  const fixture = readFixture("outcomes/patient-wait-idle-proxy-basic.json");

  assert.deepEqual(output, fixture);
  assert.equal(validateOperationalMetricContracts(output.metrics).length, output.metrics.length);
  assert.equal(
    output.metrics.some((metric) => metric.metricId === "patient_flow_wait_idle_by_room_room-02"),
    true
  );
  assert.equal(
    output.metrics.some((metric) => metric.metricId === "projected_missed_task_pressure_minutes"),
    true
  );
});

test("buildPatientWaitIdleProxy produces higher patient-flow pressure for high-delay run", () => {
  const low = buildPatientWaitIdleProxy({
    simulationRun: buildFixtureRun(),
    generatedTaskSet: buildGeneratedTaskSet()
  });
  const high = buildPatientWaitIdleProxy({
    simulationRun: buildHighDelayRun(),
    generatedTaskSet: buildGeneratedTaskSet()
  });

  const lowTotal = low.metrics.find((metric) => metric.metricId === "patient_flow_wait_idle_minutes");
  const highTotal = high.metrics.find((metric) => metric.metricId === "patient_flow_wait_idle_minutes");

  assert.equal(typeof lowTotal?.value, "number");
  assert.equal(typeof highTotal?.value, "number");
  assert.equal(highTotal.value > lowTotal.value, true);
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import {
  buildTaskTimeQueueSummary,
  validateOperationalMetricContracts
} from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));

function readFixture(name) {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8"));
}

function buildFixtureRun() {
  return {
    schemaVersion: "1.0.0",
    simulationRunId: "simulation-run-issue-119",
    scenarioId: "shift-scenario-basic",
    generatedTaskSetId: "generated-task-set-issue-119-basic",
    assignmentSetId: "nurse-task-assignment-basic",
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
        minute: 1,
        startMinute: 1,
        scheduledMinute: 0
      },
      {
        eventId: "queue-task-basic-room-01-medication-001-started-from-queue",
        eventType: "queue",
        action: "started_from_queue",
        nurseId: "nurse-alpha",
        taskId: "task-basic-room-01-medication-001",
        minute: 2,
        originalReadyMinute: 0,
        enteredQueueMinute: 2,
        startedMinute: 2,
        waitMinutes: 4,
        orderingReason: "ready_time"
      },
      {
        eventId: "task-task-basic-room-01-medication-001-completed",
        eventType: "task",
        action: "completed",
        taskId: "task-basic-room-01-medication-001",
        minute: 10,
        scheduledMinute: 0,
        startMinute: 1,
        completedMinute: 10,
        durationMinutes: 12,
        nurseId: "nurse-alpha",
        travelMinutes: 5,
        queueWaitMinutes: 4
      },
      {
        eventId: "nurse-nurse-alpha-task-basic-room-01-medication-001-started-task",
        eventType: "nurse",
        action: "started_task",
        nurseId: "nurse-alpha",
        taskId: "task-basic-room-01-medication-001",
        minute: 1,
        durationMinutes: 12,
        busyUntilMinute: 12
      },
      {
        eventId: "nurse-nurse-alpha-task-basic-room-01-medication-001-completed-task",
        eventType: "nurse",
        action: "completed_task",
        nurseId: "nurse-alpha",
        taskId: "task-basic-room-01-medication-001",
        minute: 10,
        durationMinutes: 12,
        busyUntilMinute: 10
      },
      {
        eventId: "task-task-basic-room-02-monitoring-001-ready",
        eventType: "task",
        action: "ready",
        taskId: "task-basic-room-02-monitoring-001",
        minute: 20,
        scheduledMinute: 20
      },
      {
        eventId: "task-task-basic-room-02-monitoring-001-started",
        eventType: "task",
        action: "started",
        taskId: "task-basic-room-02-monitoring-001",
        nurseId: "nurse-bravo",
        minute: 20,
        startMinute: 20,
        scheduledMinute: 20
      },
      {
        eventId: "task-task-basic-room-02-monitoring-001-completed",
        eventType: "task",
        action: "completed",
        taskId: "task-basic-room-02-monitoring-001",
        minute: 40,
        scheduledMinute: 20,
        startMinute: 20,
        completedMinute: 40,
        durationMinutes: null,
        queueWaitMinutes: 1,
        travelMinutes: 2
      },
      {
        eventId: "nurse-nurse-bravo-task-basic-room-02-monitoring-001-completed-task",
        eventType: "nurse",
        action: "completed_task",
        nurseId: "nurse-bravo",
        taskId: "task-basic-room-02-monitoring-001",
        minute: 40,
        durationMinutes: 7,
        busyUntilMinute: 40
      },
      {
        eventId: "task-task-basic-room-03-lab-001-ready",
        eventType: "task",
        action: "ready",
        taskId: "task-basic-room-03-lab-001",
        minute: 65,
        scheduledMinute: 65
      },
      {
        eventId: "task-task-basic-room-03-lab-001-started",
        eventType: "task",
        action: "started",
        taskId: "task-basic-room-03-lab-001",
        minute: 70,
        startMinute: 70,
        scheduledMinute: 65,
        nurseId: "nurse-charlie"
      },
      {
        eventId: "task-task-basic-room-03-lab-001-delayed",
        eventType: "task",
        action: "delayed",
        taskId: "task-basic-room-03-lab-001",
        minute: 75,
        scheduledMinute: 65,
        delayMinutes: 6,
        startMinute: 70
      },
      {
        eventId: "task-task-basic-room-03-lab-001-delayed-repeat",
        eventType: "task",
        action: "delayed",
        taskId: "task-basic-room-03-lab-001",
        minute: 78,
        scheduledMinute: 65,
        delayMinutes: 2,
        startMinute: 74
      },
      {
        eventId: "task-task-basic-room-04-imaging-001-ready",
        eventType: "task",
        action: "ready",
        taskId: "task-basic-room-04-imaging-001",
        minute: 130,
        scheduledMinute: 130
      },
      {
        eventId: "task-task-basic-room-04-imaging-001-missed",
        eventType: "task",
        action: "missed",
        taskId: "task-basic-room-04-imaging-001",
        minute: 150,
        scheduledMinute: 130,
        missReason: "not_started_shift_window_exceeded",
        projectedStartMinute: 160,
        projectedTravelMinutes: 0,
        projectedCompletionMinute: 175,
        shiftDurationMinutes: 150,
        queueWaitMinutes: 11,
        travelMinutes: 0
      },
      {
        eventId: "travel-task-basic-room-01-medication-001-alpha",
        eventType: "travel",
        action: "travel_calculated",
        nurseId: "nurse-alpha",
        taskId: "task-basic-room-01-medication-001",
        minute: 3,
        originNodeId: "room-01",
        destinationNodeId: "room-02",
        routeNodeIds: ["room-01", "hall-01", "room-02"],
        routeEdgeIds: ["edge-01", "edge-02"],
        travelSeconds: 300,
        travelMinutes: 5,
        warnings: []
      },
      {
        eventId: "travel-task-basic-room-02-monitoring-001-bravo",
        eventType: "travel",
        action: "travel_calculated",
        nurseId: "nurse-bravo",
        taskId: "task-basic-room-02-monitoring-001",
        minute: 4,
        originNodeId: "room-02",
        destinationNodeId: "room-03",
        routeNodeIds: ["room-02", "hall-01", "room-03"],
        routeEdgeIds: ["edge-03", "edge-04"],
        travelSeconds: 120,
        travelMinutes: 2,
        warnings: []
      },
      {
        eventId: "travel-task-basic-room-04-imaging-001-bravo-unreachable",
        eventType: "travel",
        action: "travel_unreachable",
        nurseId: "nurse-bravo",
        taskId: "task-basic-room-04-imaging-001",
        minute: 5,
        originNodeId: "room-03",
        destinationNodeId: "room-04",
        routeNodeIds: ["room-03", "hall-01"],
        routeEdgeIds: ["edge-05"],
        travelSeconds: 60,
        travelMinutes: 3,
        warnings: ["No direct route available"]
      }
    ],
    summary: {
      totalTasks: 4,
      completedTaskCount: 2,
      delayedTaskCount: 1,
      missedTaskCount: 1,
      unassignedTaskCount: 0
    },
    limitations: ["Operational task-time and queue-delay fixture."]
  };
}

test("buildTaskTimeQueueSummary derives operational task time and queue-delay metrics from events", () => {
  const output = buildTaskTimeQueueSummary({ simulationRun: buildFixtureRun() });
  const fixture = readFixture("outcomes/task-time-queue-summary-basic.json");

  assert.deepEqual(output, fixture);
  assert.equal(validateOperationalMetricContracts(output.metrics).length, output.metrics.length);
  assert.equal(
    output.metrics.every((metric) => !metric.metricId.includes("_by_task_")),
    true
  );
});

test("buildTaskTimeQueueSummary uses deterministic buckets and task/nurse/travel event sources", () => {
  const simulationRun = buildFixtureRun();
  simulationRun.events.push(
    {
      eventId: "queue-task-basic-room-03-lab-001-started-from-queue",
      eventType: "queue",
      action: "started_from_queue",
      nurseId: "nurse-charlie",
      taskId: "task-basic-room-03-lab-001",
      minute: 71,
      originalReadyMinute: 65,
      enteredQueueMinute: 71,
      startedMinute: 71,
      waitMinutes: 2,
      orderingReason: "delay_recovery"
    },
    {
      eventId: "task-task-basic-room-03-lab-001-unrelated-task",
      eventType: "task",
      action: "ready",
      taskId: "task-basic-room-03-lab-001",
      minute: 72,
      scheduledMinute: 72
    }
  );
  simulationRun.events.push({
    eventId: "task-task-basic-room-02-monitoring-001-ready-duplicate",
    eventType: "task",
    action: "ready",
    taskId: "task-basic-room-02-monitoring-001",
    minute: 21,
    scheduledMinute: 21
  });
  simulationRun.events.push({
    eventId: "travel-task-basic-room-03-lab-001-charlie",
    eventType: "travel",
    action: "travel_calculated",
    nurseId: "nurse-charlie",
    taskId: "task-basic-room-03-lab-001",
    minute: 76,
    originNodeId: "room-03",
    destinationNodeId: "room-01",
    routeNodeIds: ["room-03", "hall-01", "room-01"],
    routeEdgeIds: ["edge-06", "edge-07"],
    travelSeconds: 90,
    travelMinutes: 1,
    warnings: []
  });

  const output = buildTaskTimeQueueSummary({
    simulationRun,
    densityBucketMinutes: 45
  });

  const metricById = Object.fromEntries(
    output.metrics.map((metric) => [metric.metricId, metric.value])
  );

  assert.equal(metricById.direct_task_minutes, 19);
  assert.equal(metricById.queue_wait_minutes, 6);
  assert.equal(metricById.task_delay_minutes, 8);
  assert.equal(metricById.travel_to_task_minutes, 11);
  assert.equal(metricById.missed_task_count, 1);
  assert.equal(metricById.task_density_bucket_0000, 2);
  assert.equal(metricById.task_density_bucket_0045, 1);
  assert.equal(metricById.task_density_bucket_0090, 1);
  assert.equal(
    output.metrics.some((metric) => metric.metricId === "task_density_bucket_0060"),
    false
  );
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import {
  buildNurseTaskBurdenSummary,
  validateOperationalMetricContracts
} from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));

function readFixture(name) {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8"));
}

function buildFixtureRun() {
  return {
    schemaVersion: "1.0.0",
    simulationRunId: "simulation-run-issue-131",
    scenarioId: "shift-scenario-basic",
    generatedTaskSetId: "generated-task-set-issue-131-basic",
    assignmentSetId: "nurse-task-assignment-issue-131",
    events: [
      {
        eventId: "task-med-alpha-ready",
        eventType: "task",
        action: "ready",
        taskId: "task-med-alpha",
        minute: 0,
        scheduledMinute: 0
      },
      {
        eventId: "task-med-alpha-started",
        eventType: "task",
        action: "started",
        taskId: "task-med-alpha",
        nurseId: "nurse-alpha",
        minute: 3,
        scheduledMinute: 0,
        startMinute: 3
      },
      {
        eventId: "task-med-alpha-delayed",
        eventType: "task",
        action: "delayed",
        taskId: "task-med-alpha",
        nurseId: "nurse-alpha",
        minute: 4,
        scheduledMinute: 0,
        startMinute: 3,
        delayMinutes: 4
      },
      {
        eventId: "queue-med-alpha-started",
        eventType: "queue",
        action: "started_from_queue",
        nurseId: "nurse-alpha",
        taskId: "task-med-alpha",
        minute: 4,
        originalReadyMinute: 0,
        enteredQueueMinute: 0,
        startedMinute: 4,
        waitMinutes: 4,
        orderingReason: "ready_time"
      },
      {
        eventId: "task-med-alpha-completed",
        eventType: "task",
        action: "completed",
        taskId: "task-med-alpha",
        nurseId: "nurse-alpha",
        minute: 13,
        scheduledMinute: 0,
        startMinute: 3,
        completedMinute: 13,
        durationMinutes: 10,
        queueWaitMinutes: 4
      },
      {
        eventId: "task-missed-alpha-ready",
        eventType: "task",
        action: "ready",
        taskId: "task-missed-alpha",
        minute: 20,
        scheduledMinute: 20
      },
      {
        eventId: "task-missed-alpha-missed",
        eventType: "task",
        action: "missed",
        taskId: "task-missed-alpha",
        nurseId: "nurse-alpha",
        minute: 60,
        scheduledMinute: 20,
        missReason: "not_started_shift_window_exceeded",
        projectedStartMinute: 65,
        projectedTravelMinutes: 5,
        projectedCompletionMinute: 80,
        shiftDurationMinutes: 60
      },
      {
        eventId: "task-monitor-bravo-ready",
        eventType: "task",
        action: "ready",
        taskId: "task-monitor-bravo",
        minute: 30,
        scheduledMinute: 30
      },
      {
        eventId: "task-monitor-bravo-started",
        eventType: "task",
        action: "started",
        taskId: "task-monitor-bravo",
        nurseId: "nurse-bravo",
        minute: 31,
        scheduledMinute: 30,
        startMinute: 31
      },
      {
        eventId: "task-monitor-bravo-completed",
        eventType: "task",
        action: "completed",
        taskId: "task-monitor-bravo",
        nurseId: "nurse-bravo",
        minute: 38,
        scheduledMinute: 30,
        startMinute: 31,
        completedMinute: 38,
        durationMinutes: 7
      }
    ],
    summary: {
      totalTasks: 3,
      completedTaskCount: 2,
      delayedTaskCount: 1,
      missedTaskCount: 1,
      unassignedTaskCount: 0
    },
    limitations: ["Operational nurse task burden fixture."]
  };
}

test("buildNurseTaskBurdenSummary derives nurse-level task burden from simulation events", () => {
  const output = buildNurseTaskBurdenSummary({ simulationRun: buildFixtureRun() });
  const fixture = readFixture("outcomes/nurse-task-burden-summary-basic.json");

  assert.deepEqual(output, fixture);
  assert.equal(validateOperationalMetricContracts(output.metrics).length, output.metrics.length);
  assert.equal(output.metrics.every((metric) => metric.group === "nurse"), true);
  assert.equal(output.metrics.every((metric) => metric.scope === "nurse"), true);
});

test("buildNurseTaskBurdenSummary keeps assigned counts event-derived and nurse-scoped", () => {
  const output = buildNurseTaskBurdenSummary({ simulationRun: buildFixtureRun() });
  const metricById = Object.fromEntries(
    output.metrics.map((metric) => [metric.metricId, metric.value])
  );

  assert.equal(metricById["direct_task_minutes_by_nurse_nurse-alpha"], 10);
  assert.equal(metricById["completed_task_count_by_nurse_nurse-alpha"], 1);
  assert.equal(metricById["delayed_task_count_by_nurse_nurse-alpha"], 1);
  assert.equal(metricById["missed_task_count_by_nurse_nurse-alpha"], 1);
  assert.equal(metricById["queue_wait_minutes_by_nurse_nurse-alpha"], 4);
  assert.equal(metricById["assigned_task_count_by_nurse_nurse-alpha"], 2);

  assert.equal(metricById["direct_task_minutes_by_nurse_nurse-bravo"], 7);
  assert.equal(metricById["completed_task_count_by_nurse_nurse-bravo"], 1);
  assert.equal(metricById["delayed_task_count_by_nurse_nurse-bravo"], 0);
  assert.equal(metricById["missed_task_count_by_nurse_nurse-bravo"], 0);
  assert.equal(metricById["queue_wait_minutes_by_nurse_nurse-bravo"], 0);
  assert.equal(metricById["assigned_task_count_by_nurse_nurse-bravo"], 1);
});

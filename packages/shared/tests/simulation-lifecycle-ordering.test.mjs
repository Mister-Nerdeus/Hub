import assert from "node:assert/strict";
import test from "node:test";

import { validateSimulationRunContract } from "../dist/index.js";

function runWithTaskEvents(events, summaryOverrides = {}) {
  return {
    schemaVersion: "1.0.0",
    simulationRunId: "simulation-lifecycle-ordering",
    scenarioId: "shift-scenario-lifecycle-ordering",
    generatedTaskSetId: "generated-task-set-lifecycle-ordering",
    assignmentSetId: "assignment-set-lifecycle-ordering",
    events,
    summary: {
      totalTasks: 1,
      completedTaskCount: 0,
      delayedTaskCount: 0,
      missedTaskCount: 0,
      unassignedTaskCount: 0,
      ...summaryOverrides
    },
    limitations: ["Operational-only lifecycle ordering validation payload."]
  };
}

function ready(taskId = "task-alpha", minute = 0) {
  return {
    eventId: `${taskId}-ready`,
    eventType: "task",
    action: "ready",
    taskId,
    minute,
    scheduledMinute: minute
  };
}

function started(taskId = "task-alpha", minute = 0) {
  return {
    eventId: `${taskId}-started-${minute}`,
    eventType: "task",
    action: "started",
    taskId,
    nurseId: "nurse-alpha",
    minute,
    scheduledMinute: 0,
    startMinute: minute,
    durationMinutes: 5
  };
}

function completed(taskId = "task-alpha", startMinute = 0, completedMinute = 5) {
  return {
    eventId: `${taskId}-completed-${completedMinute}`,
    eventType: "task",
    action: "completed",
    taskId,
    nurseId: "nurse-alpha",
    minute: completedMinute,
    scheduledMinute: 0,
    startMinute,
    completedMinute,
    durationMinutes: 5
  };
}

function missed(taskId = "task-alpha", minute = 5) {
  return {
    eventId: `${taskId}-missed`,
    eventType: "task",
    action: "missed",
    taskId,
    minute,
    scheduledMinute: 0,
    missReason: "not_started_shift_window_exceeded",
    projectedStartMinute: minute,
    projectedTravelMinutes: 0,
    projectedCompletionMinute: minute + 5,
    shiftDurationMinutes: minute + 4
  };
}

function unassigned(taskId = "task-alpha") {
  return {
    eventId: `${taskId}-unassigned`,
    eventType: "task",
    action: "unassigned",
    taskId,
    minute: 0,
    scheduledMinute: 0,
    missReason: "unassigned"
  };
}

function delayed(taskId = "task-alpha", minute = 5) {
  return {
    eventId: `${taskId}-delayed`,
    eventType: "task",
    action: "delayed",
    taskId,
    nurseId: "nurse-alpha",
    minute,
    scheduledMinute: 0,
    startMinute: minute,
    delayMinutes: minute,
    queueWaitMinutes: minute,
    travelMinutes: 0
  };
}

function assertRejectsLifecycle(events, summaryOverrides = {}) {
  assert.throws(
    () => validateSimulationRunContract(runWithTaskEvents(events, summaryOverrides)),
    /lifecycle|terminal|started|ready|delayed/i
  );
}

test("rejects completed tasks without a started task event", () => {
  assertRejectsLifecycle([ready(), completed()], { completedTaskCount: 1 });
});

test("rejects started tasks without a ready task event", () => {
  assertRejectsLifecycle([started()], {});
});

test("rejects completed tasks before their started minute", () => {
  assertRejectsLifecycle([ready(), started("task-alpha", 10), completed("task-alpha", 10, 5)], {
    completedTaskCount: 1
  });
});

test("rejects started tasks before their ready minute", () => {
  assertRejectsLifecycle([ready("task-alpha", 10), started("task-alpha", 5)], {});
});

test("rejects missed and completed terminal conflict", () => {
  assertRejectsLifecycle([ready(), started(), completed(), missed()], {
    completedTaskCount: 1,
    missedTaskCount: 1
  });
});

test("rejects unassigned and completed terminal conflict", () => {
  assertRejectsLifecycle([ready(), started(), completed(), unassigned()], {
    completedTaskCount: 1,
    unassignedTaskCount: 1
  });
});

test("rejects multiple terminal states", () => {
  assertRejectsLifecycle([ready(), missed(), unassigned()], {
    missedTaskCount: 1,
    unassignedTaskCount: 1
  });
});

test("rejects delayed tasks without a later start or miss outcome", () => {
  assertRejectsLifecycle([ready(), delayed()], { delayedTaskCount: 1 });
});

test("accepts coherent ready-start-delayed-completed lifecycle", () => {
  const run = runWithTaskEvents(
    [ready(), delayed("task-alpha", 5), started("task-alpha", 5), completed("task-alpha", 5, 10)],
    {
      completedTaskCount: 1,
      delayedTaskCount: 1
    }
  );

  assert.equal(validateSimulationRunContract(run).summary.completedTaskCount, 1);
});

test("accepts delayed task that later misses", () => {
  const run = runWithTaskEvents([ready(), delayed("task-alpha", 5), missed("task-alpha", 10)], {
    delayedTaskCount: 1,
    missedTaskCount: 1
  });

  assert.equal(validateSimulationRunContract(run).summary.missedTaskCount, 1);
});

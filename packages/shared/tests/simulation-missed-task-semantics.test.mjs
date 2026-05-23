import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import {
  buildSimulationRun,
  buildSimulationScore,
  validateSimulationRunContract,
  validateSimulationTaskEventContract
} from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));
const taskFixturesDir = join(fixturesDir, "tasks");

function readFixture(name) {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8"));
}

function readTaskFixture(name) {
  return JSON.parse(readFileSync(join(taskFixturesDir, name), "utf8"));
}

function baseInput() {
  return {
    simulationRunId: "simulation-run-missed-not-started",
    scenario: readFixture("shift-scenario-basic.json"),
    generatedTaskSet: readTaskFixture("generated-task-set-basic.json"),
    nurseTaskAssignmentSet: readFixture("nurse-task-assignment-basic.json"),
    manualAssignmentSet: readFixture("manual-assignment-basic.json"),
    shiftDurationMinutes: 20
  };
}

function notStartedInput() {
  const input = baseInput();
  const task = {
    ...input.generatedTaskSet.generatedTasks[0],
    id: "task-missed-not-started",
    scheduledMinute: 15,
    estimatedDurationMinutes: 6
  };

  input.generatedTaskSet = {
    ...input.generatedTaskSet,
    generatedTasks: [task],
    taskCount: 1
  };
  input.nurseTaskAssignmentSet = {
    ...input.nurseTaskAssignmentSet,
    taskAssignments: [
      {
        id: "nurse-task-task-missed-not-started",
        taskId: task.id,
        nurseId: "nurse-alpha",
        assignmentReason: "manual_room_coverage",
        minute: 15
      }
    ]
  };
  return input;
}

function missedTaskEvent(reason) {
  return {
    eventId: "task-task-missed-not-started-missed",
    eventType: "task",
    action: "missed",
    taskId: "task-missed-not-started",
    nurseId: "nurse-alpha",
    minute: 15,
    scheduledMinute: 15,
    missReason: reason,
    projectedStartMinute: 15,
    projectedTravelMinutes: 0,
    projectedCompletionMinute: 21,
    shiftDurationMinutes: 20
  };
}

test("ambiguous shift-window missed reason is rejected", () => {
  assert.throws(
    () => validateSimulationTaskEventContract(missedTaskEvent("shift_window_exceeded")),
    /missReason/
  );
});

test("not-started shift-window missed reason is accepted", () => {
  const event = validateSimulationTaskEventContract(
    missedTaskEvent("not_started_shift_window_exceeded")
  );

  assert.equal(event.missReason, "not_started_shift_window_exceeded");
});

test("attempted-overrun missed reason remains deferred", () => {
  assert.throws(
    () => validateSimulationTaskEventContract(missedTaskEvent("attempted_shift_overrun")),
    /missReason/
  );
});

test("missed not-started task emits no started events", () => {
  const run = buildSimulationRun(notStartedInput());
  const missed = run.events.find(
    (event) => event.eventType === "task" && event.action === "missed"
  );

  assert.equal(missed?.missReason, "not_started_shift_window_exceeded");
  assert.equal(
    run.events.some((event) => event.eventType === "task" && event.action === "started"),
    false
  );
  assert.equal(
    run.events.some((event) => event.eventType === "nurse" && event.action === "started_task"),
    false
  );
});

test("missed not-started task consumes no nurse busy minutes", () => {
  const run = buildSimulationRun(notStartedInput());
  const score = buildSimulationScore(run);

  assert.equal(score.metrics.missedTaskCount, 1);
  assert.equal(score.metrics.totalNurseBusyMinutes, 0);
  assert.deepEqual(score.metrics.nurseBusyMinutes, {});
});

test("missed count is derived from missed events", () => {
  const run = buildSimulationRun(notStartedInput());
  const missedEventCount = run.events.filter(
    (event) => event.eventType === "task" && event.action === "missed"
  ).length;
  const score = buildSimulationScore(run);

  assert.equal(run.summary.missedTaskCount, missedEventCount);
  assert.equal(score.metrics.missedTaskCount, missedEventCount);
});

test("missed not-started fixture validates", () => {
  const fixture = readFixture("simulation-missed-not-started.json");

  assert.doesNotThrow(() => validateSimulationRunContract(fixture));
});

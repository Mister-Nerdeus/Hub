import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  buildSimulationRun,
  buildSimulationScore,
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

function notStartedInput() {
  const scenario = readFixture("shift-scenario-basic.json");
  const generatedTaskSet = readTaskFixture("generated-task-set-basic.json");
  const nurseTaskAssignmentSet = readFixture("nurse-task-assignment-basic.json");
  const task = {
    ...generatedTaskSet.generatedTasks[0],
    id: "task-missed-not-started-explanation",
    scheduledMinute: 15,
    estimatedDurationMinutes: 6
  };

  return {
    simulationRunId: "simulation-run-missed-explanation",
    scenario,
    generatedTaskSet: {
      ...generatedTaskSet,
      generatedTasks: [task],
      taskCount: 1
    },
    nurseTaskAssignmentSet: {
      ...nurseTaskAssignmentSet,
      taskAssignments: [
        {
          id: "nurse-task-task-missed-not-started-explanation",
          taskId: task.id,
          nurseId: "nurse-alpha",
          assignmentReason: "manual_room_coverage",
          minute: 15
        }
      ]
    },
    manualAssignmentSet: readFixture("manual-assignment-basic.json"),
    shiftDurationMinutes: 20
  };
}

function missedEventWithoutProjectedFields() {
  return {
    eventId: "task-task-missed-not-started-explanation-missed",
    eventType: "task",
    action: "missed",
    taskId: "task-missed-not-started-explanation",
    nurseId: "nurse-alpha",
    minute: 15,
    scheduledMinute: 15,
    missReason: "not_started_shift_window_exceeded"
  };
}

function missedEvents(run) {
  return run.events.filter((event) => event.eventType === "task" && event.action === "missed");
}

test("not-started missed task event requires projected timing explanation fields", () => {
  assert.throws(
    () => validateSimulationTaskEventContract(missedEventWithoutProjectedFields()),
    /projectedStartMinute|projected timing/i
  );
});

test("missed not-started task exposes deterministic projected timing fields", () => {
  const first = buildSimulationRun(notStartedInput());
  const second = buildSimulationRun(notStartedInput());
  const [missed] = missedEvents(first);

  assert.deepEqual(first, second);
  assert.deepEqual(
    {
      projectedStartMinute: missed.projectedStartMinute,
      projectedTravelMinutes: missed.projectedTravelMinutes,
      projectedCompletionMinute: missed.projectedCompletionMinute,
      shiftDurationMinutes: missed.shiftDurationMinutes
    },
    {
      projectedStartMinute: 15,
      projectedTravelMinutes: 0,
      projectedCompletionMinute: 21,
      shiftDurationMinutes: 20
    }
  );
});

test("missed not-started task still emits no started events", () => {
  const run = buildSimulationRun(notStartedInput());

  assert.equal(
    run.events.some((event) => event.eventType === "task" && event.action === "started"),
    false
  );
  assert.equal(
    run.events.some((event) => event.eventType === "nurse" && event.action === "started_task"),
    false
  );
});

test("missed not-started task still consumes no nurse busy minutes", () => {
  const run = buildSimulationRun(notStartedInput());
  const score = buildSimulationScore(run);

  assert.equal(score.metrics.totalNurseBusyMinutes, 0);
  assert.deepEqual(score.metrics.nurseBusyMinutes, {});
});

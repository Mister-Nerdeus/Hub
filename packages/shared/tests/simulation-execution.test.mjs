import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import {
  buildSimulationRun,
  validateSimulationRunContract
} from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));
const taskFixturesDir = join(fixturesDir, "tasks");

function readFixture(name) {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8"));
}

function readTaskFixture(name) {
  return JSON.parse(readFileSync(join(taskFixturesDir, name), "utf8"));
}

function buildInput() {
  return {
    simulationRunId: "simulation-run-basic",
    scenario: readFixture("shift-scenario-basic.json"),
    generatedTaskSet: readTaskFixture("generated-task-set-basic.json"),
    nurseTaskAssignmentSet: readFixture("nurse-task-assignment-basic.json"),
    manualAssignmentSet: readFixture("manual-assignment-basic.json")
  };
}

function buildSurgeInput() {
  const input = buildInput();
  input.simulationRunId = "simulation-run-surge";
  input.generatedTaskSet = structuredClone(input.generatedTaskSet);
  input.nurseTaskAssignmentSet = structuredClone(input.nurseTaskAssignmentSet);
  input.generatedTaskSet.generatedTasks.push({
    id: "task-surge-room-03-procedure-001",
    taskType: "procedure_support",
    roomId: "room-03",
    sourceTemplateId: "template-procedure-support",
    scheduledMinute: 0,
    estimatedDurationMinutes: 20,
    burdenCategory: "procedure",
    interruptive: false,
    requiresRoomPresence: true
  });
  input.generatedTaskSet.taskCount = input.generatedTaskSet.generatedTasks.length;
  input.nurseTaskAssignmentSet.taskAssignments.push({
    id: "nurse-task-task-surge-room-03-procedure-001",
    taskId: "task-surge-room-03-procedure-001",
    nurseId: "nurse-alpha",
    assignmentReason: "manual_room_coverage",
    minute: 0
  });
  return input;
}

test("basic simulation is deterministic", () => {
  const first = buildSimulationRun(buildInput());
  const second = buildSimulationRun(buildInput());

  assert.deepEqual(first, second);
});

test("surge simulation is deterministic", () => {
  const input = buildSurgeInput();
  const first = buildSimulationRun({ ...input, shiftDurationMinutes: 20 });
  const second = buildSimulationRun({ ...input, shiftDurationMinutes: 20 });

  assert.deepEqual(first, second);
});

test("task cannot complete before ready minute", () => {
  const run = buildSimulationRun(buildInput());
  const completedEvents = run.events.filter(
    (event) => event.eventType === "task" && event.action === "completed"
  );

  assert.ok(
    completedEvents.every((event) => event.completedMinute >= event.scheduledMinute),
    "completed events must not precede scheduled minute"
  );
});

test("nurse cannot overlap tasks", () => {
  const run = buildSimulationRun(buildSurgeInput());
  const intervalsByNurse = new Map();
  for (const event of run.events) {
    if (event.eventType !== "nurse" || event.action !== "started_task") {
      continue;
    }
    const intervals = intervalsByNurse.get(event.nurseId) ?? [];
    intervals.push([event.minute, event.busyUntilMinute]);
    intervalsByNurse.set(event.nurseId, intervals);
  }

  for (const intervals of intervalsByNurse.values()) {
    intervals.sort((left, right) => left[0] - right[0]);
    for (let index = 1; index < intervals.length; index += 1) {
      assert.ok(intervals[index][0] >= intervals[index - 1][1]);
    }
  }
});

test("unassigned tasks remain visible", () => {
  const run = buildSimulationRun(buildInput());

  assert.ok(
    run.events.some(
      (event) =>
        event.eventType === "task" &&
        event.action === "unassigned" &&
        event.taskId === "task-basic-hall-bed-01-turnover-001"
    )
  );
});

test("missed tasks are counted", () => {
  const run = buildSimulationRun({ ...buildSurgeInput(), shiftDurationMinutes: 20 });

  assert.ok(run.summary.missedTaskCount > 0);
  assert.ok(
    run.events
      .filter((event) => event.eventType === "task" && event.action === "missed")
      .every((event) => typeof event.missReason === "string")
  );
});

test("delayed tasks are counted", () => {
  const run = buildSimulationRun(buildSurgeInput());

  assert.ok(run.summary.delayedTaskCount > 0);
  assert.ok(
    run.events
      .filter((event) => event.eventType === "task" && event.action === "delayed")
      .every((event) => event.delayMinutes > 0)
  );
});

test("output validates through validateSimulationRunContract", () => {
  const run = buildSimulationRun(buildSurgeInput());

  assert.doesNotThrow(() => validateSimulationRunContract(run));
});

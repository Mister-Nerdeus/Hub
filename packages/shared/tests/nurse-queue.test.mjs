import assert from "node:assert/strict";
import test from "node:test";

import {
  buildNurseQueue,
  buildSimulationRun,
  validateNurseQueueContract
} from "../dist/index.js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));
const taskFixturesDir = join(fixturesDir, "tasks");

function readFixture(name) {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8"));
}

function readTaskFixture(name) {
  return JSON.parse(readFileSync(join(taskFixturesDir, name), "utf8"));
}

function queueTasks() {
  return [
    {
      id: "task-low",
      scheduledMinute: 0,
      estimatedDurationMinutes: 10,
      burdenCategory: "monitoring",
      interruptive: false
    },
    {
      id: "task-high",
      scheduledMinute: 0,
      estimatedDurationMinutes: 5,
      burdenCategory: "procedure",
      interruptive: false
    }
  ];
}

function overlappingSimulationInput() {
  const generatedTaskSet = readTaskFixture("generated-task-set-basic.json");
  const assignmentSet = readFixture("nurse-task-assignment-basic.json");
  generatedTaskSet.generatedTasks.push({
    id: "task-queue-room-03-procedure-001",
    taskType: "procedure_support",
    roomId: "room-03",
    sourceTemplateId: "template-procedure-support",
    scheduledMinute: 0,
    estimatedDurationMinutes: 20,
    burdenCategory: "procedure",
    interruptive: false,
    requiresRoomPresence: true
  });
  generatedTaskSet.taskCount = generatedTaskSet.generatedTasks.length;
  assignmentSet.taskAssignments.push({
    id: "nurse-task-task-queue-room-03-procedure-001",
    taskId: "task-queue-room-03-procedure-001",
    nurseId: "nurse-alpha",
    assignmentReason: "manual_room_coverage",
    minute: 0
  });
  return {
    simulationRunId: "simulation-run-queue",
    scenario: readFixture("shift-scenario-basic.json"),
    generatedTaskSet,
    nurseTaskAssignmentSet: assignmentSet,
    manualAssignmentSet: readFixture("manual-assignment-basic.json")
  };
}

test("simultaneous tasks are queued deterministically", () => {
  const queue = buildNurseQueue({
    queueId: "queue-alpha",
    nurseId: "nurse-alpha",
    tasks: queueTasks()
  });

  assert.deepEqual(queue.taskIdsInQueueOrder, ["task-high", "task-low"]);
});

test("queue order is stable", () => {
  const first = buildNurseQueue({ queueId: "queue-alpha", nurseId: "nurse-alpha", tasks: queueTasks() });
  const second = buildNurseQueue({
    queueId: "queue-alpha",
    nurseId: "nurse-alpha",
    tasks: [...queueTasks()].reverse()
  });

  assert.deepEqual(first, second);
  assert.doesNotThrow(() => validateNurseQueueContract(first));
});

test("non-interruptible task is not paused", () => {
  const run = buildSimulationRun(overlappingSimulationInput());

  assert.equal(run.events.some((event) => event.eventType === "queue" && event.action === "paused"), false);
});

test("interruptible task may be paused only if explicitly marked", () => {
  const queue = buildNurseQueue({
    queueId: "queue-interruptible",
    nurseId: "nurse-alpha",
    tasks: [{ ...queueTasks()[0], id: "task-interruptible", interruptive: true }]
  });

  assert.equal(queue.items[0].interruptible, true);
});

test("completed task releases nurse", () => {
  const run = buildSimulationRun(overlappingSimulationInput());

  assert.ok(run.events.some((event) => event.eventType === "queue" && event.action === "released"));
});

test("no duplicate task execution", () => {
  const run = buildSimulationRun(overlappingSimulationInput());
  const completedTaskIds = run.events
    .filter((event) => event.eventType === "task" && event.action === "completed")
    .map((event) => event.taskId);

  assert.equal(new Set(completedTaskIds).size, completedTaskIds.length);
});

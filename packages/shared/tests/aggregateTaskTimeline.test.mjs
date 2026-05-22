import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import { aggregateTaskTimeline, validateShiftScenarioContract } from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));
const taskFixturesDir = join(fixturesDir, "tasks");

function readFixture(name) {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8"));
}

function readTaskFixture(name) {
  return JSON.parse(readFileSync(join(taskFixturesDir, name), "utf8"));
}

test("aggregateTaskTimeline groups generated tasks by deterministic timestep buckets", () => {
  const scenario = validateShiftScenarioContract(readFixture("shift-scenario-basic.json"));
  const taskSet = readTaskFixture("generated-task-set-basic.json");
  const summary = aggregateTaskTimeline(scenario, taskSet);

  assert.deepEqual(summary, readTaskFixture("task-timeline-basic.json"));
});

test("aggregateTaskTimeline sorts task IDs and room IDs within buckets", () => {
  const scenario = validateShiftScenarioContract(readFixture("shift-scenario-basic.json"));
  const taskSet = readTaskFixture("generated-task-set-basic.json");
  taskSet.generatedTasks.reverse();
  const summary = aggregateTaskTimeline(scenario, taskSet);

  assert.deepEqual(
    summary.buckets.map((bucket) => bucket.minute),
    [0, 15, 30, 45]
  );
  assert.deepEqual(summary.buckets[0].taskIds, [
    "task-basic-room-01-medication-001",
    "task-basic-room-02-monitoring-001"
  ]);
  assert.deepEqual(summary.buckets[0].roomIds, ["room-01", "room-02"]);
});

test("aggregateTaskTimeline validates the generated task set before aggregating", () => {
  const scenario = validateShiftScenarioContract(readFixture("shift-scenario-basic.json"));
  const taskSet = readTaskFixture("generated-task-set-basic.json");
  taskSet.generatedTasks[0].scheduledMinute = 7;

  assert.throws(() => aggregateTaskTimeline(scenario, taskSet), /timestepMinutes/);
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import {
  validateSimulationRunContract
} from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));

function readFixture(name) {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8"));
}

function validRun() {
  return readFixture("simulation-run-contract-basic.json");
}

test("validateSimulationRunContract is exported", () => {
  assert.equal(typeof validateSimulationRunContract, "function");
});

test("accepts valid minimal simulation run", () => {
  const run = validateSimulationRunContract(validRun());

  assert.equal(run.simulationRunId, "simulation-run-basic");
  assert.deepEqual(run.summary, {
    totalTasks: 0,
    completedTaskCount: 0,
    delayedTaskCount: 0,
    missedTaskCount: 0,
    unassignedTaskCount: 0
  });
});

test("rejects missing IDs", () => {
  const run = validRun();
  delete run.simulationRunId;

  assert.throws(() => validateSimulationRunContract(run), /simulationRunId/);
});

test("rejects invalid event minute", () => {
  const run = validRun();
  run.events.push({
    eventId: "event-invalid-minute",
    eventType: "task",
    action: "ready",
    taskId: "task-basic",
    minute: -1,
    scheduledMinute: 0
  });
  run.summary.totalTasks = 1;

  assert.throws(() => validateSimulationRunContract(run), /minute/);
});

test("rejects PHI-like keys", () => {
  const run = validRun();
  run.events.push({
    eventId: "event-phi-key",
    eventType: "task",
    action: "ready",
    taskId: "task-basic",
    minute: 0,
    scheduledMinute: 0,
    diagnosis: "not allowed"
  });

  assert.throws(() => validateSimulationRunContract(run), /not allowed/);
});

test("rejects clinical/recommendation language", () => {
  const run = validRun();
  run.limitations = ["Recommended operational output"];

  assert.throws(() => validateSimulationRunContract(run), /recommended/i);
});

test("rejects summary/event mismatch where applicable", () => {
  const run = validRun();
  run.events.push({
    eventId: "event-task-ready",
    eventType: "task",
    action: "ready",
    taskId: "task-basic",
    minute: 0,
    scheduledMinute: 0
  });

  assert.throws(() => validateSimulationRunContract(run), /totalTasks/);
});

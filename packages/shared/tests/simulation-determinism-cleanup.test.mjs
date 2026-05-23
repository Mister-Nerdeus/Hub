import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  buildBaselineAssignmentOptimizer,
  buildSimulationRun
} from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));
const taskFixturesDir = join(fixturesDir, "tasks");
const sourceDir = fileURLToPath(new URL("../src/", import.meta.url));

function readFixture(name) {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8"));
}

function readTaskFixture(name) {
  return JSON.parse(readFileSync(join(taskFixturesDir, name), "utf8"));
}

function buildBasicSimulationInput() {
  return {
    simulationRunId: "simulation-run-basic",
    scenario: readFixture("shift-scenario-basic.json"),
    generatedTaskSet: readTaskFixture("generated-task-set-basic.json"),
    nurseTaskAssignmentSet: readFixture("nurse-task-assignment-basic.json"),
    manualAssignmentSet: readFixture("manual-assignment-basic.json")
  };
}

function buildSurgeSimulationInput() {
  const input = buildBasicSimulationInput();
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
  return { ...input, shiftDurationMinutes: 20 };
}

function optimizerInput() {
  return {
    optimizerRunId: "baseline-optimizer-basic",
    scenario: readFixture("shift-scenario-basic.json"),
    generatedTaskSet: readTaskFixture("generated-task-set-basic.json"),
    baseNurseTaskAssignmentSet: readFixture("nurse-task-assignment-basic.json")
  };
}

test("simulation execution source has no known no-op cleanup pattern", () => {
  const source = readFileSync(join(sourceDir, "simulation", "simulationExecution.ts"), "utf8");

  assert.equal(source.includes("plan == null ? undefined : undefined"), false);
  assert.equal(source.includes("void nurse;"), false);
});

test("basic simulation output remains fixture-stable", () => {
  assert.deepEqual(buildSimulationRun(buildBasicSimulationInput()), readFixture("simulation-run-basic.json"));
});

test("surge simulation output is byte-stable for repeated input", () => {
  const first = JSON.stringify(buildSimulationRun(buildSurgeSimulationInput()));
  const second = JSON.stringify(buildSimulationRun(buildSurgeSimulationInput()));

  assert.equal(first, second);
});

test("optimizer output is byte-stable for repeated input", () => {
  const first = JSON.stringify(buildBaselineAssignmentOptimizer(optimizerInput()));
  const second = JSON.stringify(buildBaselineAssignmentOptimizer(optimizerInput()));

  assert.equal(first, second);
});

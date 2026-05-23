import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import {
  buildSimulationRun,
  buildSimulationScore,
  validateSimulationScoreContract
} from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));
const taskFixturesDir = join(fixturesDir, "tasks");

function readFixture(name) {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8"));
}

function readTaskFixture(name) {
  return JSON.parse(readFileSync(join(taskFixturesDir, name), "utf8"));
}

function runInput() {
  return {
    simulationRunId: "simulation-run-score-basic",
    scenario: readFixture("shift-scenario-basic.json"),
    generatedTaskSet: readTaskFixture("generated-task-set-basic.json"),
    nurseTaskAssignmentSet: readFixture("nurse-task-assignment-basic.json"),
    manualAssignmentSet: readFixture("manual-assignment-basic.json")
  };
}

function surgeRunInput() {
  const input = runInput();
  input.simulationRunId = "simulation-run-score-surge";
  input.generatedTaskSet.generatedTasks.push({
    id: "task-score-surge-room-03-procedure-001",
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
    id: "nurse-task-task-score-surge-room-03-procedure-001",
    taskId: "task-score-surge-room-03-procedure-001",
    nurseId: "nurse-alpha",
    assignmentReason: "manual_room_coverage",
    minute: 0
  });
  return input;
}

test("score derives from events", () => {
  const run = buildSimulationRun(surgeRunInput());
  const score = buildSimulationScore(run);

  assert.equal(score.metrics.delayedTaskCount, run.summary.delayedTaskCount);
  assert.equal(score.metrics.unassignedTaskCount, run.summary.unassignedTaskCount);
  assert.ok(score.definitions.length > 0);
});

test("altered summary fails validation", () => {
  const run = buildSimulationRun(runInput());
  const score = buildSimulationScore(run);
  score.metrics.completedTaskCount += 1;

  assert.throws(() => validateSimulationScoreContract(score, run), /completedTaskCount/);
});

test("surge score exceeds basic burden where expected", () => {
  const basicScore = buildSimulationScore(buildSimulationRun(runInput()));
  const surgeScore = buildSimulationScore(buildSimulationRun(surgeRunInput()));

  assert.ok(surgeScore.metrics.operationalBurdenScore > basicScore.metrics.operationalBurdenScore);
});

test("repeated scoring is deterministic", () => {
  const run = buildSimulationRun(surgeRunInput());

  assert.deepEqual(buildSimulationScore(run), buildSimulationScore(run));
});

test("limitations are required", () => {
  const run = buildSimulationRun(runInput());
  const score = buildSimulationScore(run);
  score.limitations = [];

  assert.throws(() => validateSimulationScoreContract(score, run), /limitations/);
});

test("clinical safety language is rejected", () => {
  const run = buildSimulationRun(runInput());
  const score = buildSimulationScore(run);
  score.limitations = ["This is safe"];

  assert.throws(() => validateSimulationScoreContract(score, run), /safe/);
});

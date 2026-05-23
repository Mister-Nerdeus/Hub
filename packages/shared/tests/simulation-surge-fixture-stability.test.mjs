import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
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

function buildHardenedSurgeSimulationInput() {
  const input = {
    simulationRunId: "simulation-run-surge-hardened",
    scenario: readFixture("shift-scenario-basic.json"),
    generatedTaskSet: structuredClone(readTaskFixture("generated-task-set-basic.json")),
    nurseTaskAssignmentSet: structuredClone(readFixture("nurse-task-assignment-basic.json")),
    manualAssignmentSet: readFixture("manual-assignment-basic.json"),
    shiftDurationMinutes: 20
  };
  input.generatedTaskSet.generatedTasks.push({
    id: "task-surge-hardened-room-03-procedure-001",
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
    id: "nurse-task-task-surge-hardened-room-03-procedure-001",
    taskId: "task-surge-hardened-room-03-procedure-001",
    nurseId: "nurse-alpha",
    assignmentReason: "manual_room_coverage",
    minute: 0
  });
  return input;
}

function buildHardenedSurgeSimulationRun() {
  return buildSimulationRun(buildHardenedSurgeSimulationInput());
}

test("hardened surge simulation output remains fixture-stable", () => {
  assert.deepEqual(
    buildHardenedSurgeSimulationRun(),
    readFixture("simulation-run-surge-hardened.json")
  );
});

test("hardened surge simulation fixture validates and includes stress outcome", () => {
  const run = readFixture("simulation-run-surge-hardened.json");
  validateSimulationRunContract(run);
  assert.ok(
    run.events.some((event) => event.eventType === "task" && (event.action === "delayed" || event.action === "missed")),
    "hardened surge fixture should include a delayed or missed operational outcome"
  );
});

test("hardened surge simulation builder deep-equals committed fixture", () => {
  const fixture = readFixture("simulation-run-surge-hardened.json");
  const rebuilt = buildHardenedSurgeSimulationRun();

  assert.deepEqual(rebuilt, fixture);
  assert.equal(JSON.stringify(rebuilt), JSON.stringify(fixture));
});

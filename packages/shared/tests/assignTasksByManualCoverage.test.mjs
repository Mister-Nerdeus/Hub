import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import {
  assignTasksByManualCoverage,
  validateManualAssignmentContract,
  validateNurseTaskAssignmentContract,
  validatePlanContract,
  validateRoomLoads
} from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));
const taskFixturesDir = join(fixturesDir, "tasks");

function readFixture(name) {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8"));
}

function readTaskFixture(name) {
  return JSON.parse(readFileSync(join(taskFixturesDir, name), "utf8"));
}

function buildInput(overrides = {}) {
  const plan = validatePlanContract(readFixture("plan-er-pod-phase2.json"));
  const roomLoads = validateRoomLoads(readFixture("room-loads-basic.json"), plan);
  const assignmentSet = validateManualAssignmentContract(
    readFixture("manual-assignment-basic.json"),
    plan
  );
  const generatedTaskSet = readTaskFixture("generated-task-set-basic.json");

  return {
    plan,
    roomLoads,
    assignmentSet,
    generatedTaskSet,
    ...overrides
  };
}

test("assignTasksByManualCoverage assigns covered-room tasks and validates output contract", () => {
  const result = assignTasksByManualCoverage(buildInput());
  const expectedAssignmentSet = readFixture("nurse-task-assignment-basic.json");
  const expectedResult = readTaskFixture("nurse-task-assignments-basic.json");

  assert.deepEqual(JSON.parse(JSON.stringify(result)), expectedResult);
  assert.deepEqual(result.assignmentSet, expectedAssignmentSet);
  assert.equal(result.assignedTaskCount, 5);
  assert.equal(result.unassignedTaskCount, 1);
  assert.deepEqual(result.perNurseTaskCounts, {
    "nurse-alpha": 2,
    "nurse-bravo": 1,
    "nurse-charlie": 2
  });
  assert.deepEqual(result.perNurseEstimatedMinutes, {
    "nurse-alpha": 18,
    "nurse-bravo": 15,
    "nurse-charlie": 25
  });
  assert.doesNotThrow(() =>
    validateNurseTaskAssignmentContract(
      result.assignmentSet,
      undefined,
      buildInput().assignmentSet,
      buildInput().generatedTaskSet
    )
  );
});

test("assignTasksByManualCoverage leaves uncovered rooms unassigned with warnings", () => {
  const result = assignTasksByManualCoverage(buildInput());
  const hallTask = result.assignmentSet.taskAssignments.find((assignment) =>
    assignment.taskId.includes("hall-bed-01")
  );

  assert.equal(hallTask.assignmentReason, "unassigned");
  assert.equal(hallTask.nurseId, null);
  assert.ok(result.warnings.some((warning) => warning.taskIds?.includes(hallTask.taskId)));
});

test("assignTasksByManualCoverage treats duplicate room coverage as invalid coverage", () => {
  const input = buildInput();
  input.assignmentSet.assignments.push({
    id: "assignment-duplicate-room-01",
    nurseId: "nurse-bravo",
    roomIds: ["room-01"],
    assignmentType: "manual",
    startMinute: 0,
    endMinute: null
  });

  const result = assignTasksByManualCoverage(input);
  const roomOneAssignment = result.assignmentSet.taskAssignments.find(
    (assignment) => assignment.taskId === "task-basic-room-01-medication-001"
  );

  assert.equal(roomOneAssignment.assignmentReason, "unassigned");
  assert.equal(result.perNurseTaskCounts["nurse-alpha"], 1);
  assert.ok(result.warnings.some((warning) => warning.severity === "critical"));
});

test("assignTasksByManualCoverage leaves unknown-room tasks unassigned with warning", () => {
  const input = buildInput();
  input.generatedTaskSet.generatedTasks.push({
    id: "task-basic-unknown-room-001",
    taskType: "monitoring_check",
    roomId: "room-unknown",
    sourceTemplateId: "template-monitoring-check",
    scheduledMinute: 60,
    estimatedDurationMinutes: 5,
    burdenCategory: "monitoring",
    interruptive: false,
    requiresRoomPresence: true
  });
  input.generatedTaskSet.taskCount += 1;

  const result = assignTasksByManualCoverage(input);
  const unknownRoomAssignment = result.assignmentSet.taskAssignments.find(
    (assignment) => assignment.taskId === "task-basic-unknown-room-001"
  );

  assert.equal(unknownRoomAssignment.assignmentReason, "unassigned");
  assert.ok(result.warnings.some((warning) => warning.code === "UNKNOWN_ROOM"));
});

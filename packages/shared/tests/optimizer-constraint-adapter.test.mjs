import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  buildBaselineAssignmentOptimizer,
  constrainOptimizerCandidateAssignments,
  validateNurseTaskAssignmentContract
} from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));
const taskFixturesDir = join(fixturesDir, "tasks");
const baseUnassignedTaskId = "task-basic-hall-bed-01-turnover-001";

function readFixture(name) {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8"));
}

function readTaskFixture(name) {
  return JSON.parse(readFileSync(join(taskFixturesDir, name), "utf8"));
}

function optimizerInput() {
  return {
    optimizerRunId: "baseline-optimizer-constraint",
    scenario: readFixture("shift-scenario-basic.json"),
    generatedTaskSet: readTaskFixture("generated-task-set-basic.json"),
    baseNurseTaskAssignmentSet: readFixture("nurse-task-assignment-basic.json")
  };
}

function assignedCandidateAssignments(input = optimizerInput()) {
  return input.generatedTaskSet.generatedTasks.map((task, index) => ({
    id: `candidate-assignment-${task.id}`,
    taskId: task.id,
    nurseId: ["nurse-alpha", "nurse-bravo", "nurse-charlie"][index % 3],
    assignmentReason: "manual_room_coverage",
    minute: task.scheduledMinute
  }));
}

function adapterInput(overrides = {}) {
  const input = optimizerInput();
  return {
    generatedTaskIds: input.generatedTaskSet.generatedTasks.map((task) => task.id),
    allowedNurseIds: ["nurse-alpha", "nurse-bravo", "nurse-charlie"],
    baseAssignments: input.baseNurseTaskAssignmentSet.taskAssignments,
    candidateAssignments: assignedCandidateAssignments(input),
    ...overrides
  };
}

test("constraint adapter rejects unknown nurse candidates", () => {
  const candidateAssignments = assignedCandidateAssignments();
  candidateAssignments[0] = {
    ...candidateAssignments[0],
    nurseId: "nurse-unknown"
  };

  assert.throws(
    () => constrainOptimizerCandidateAssignments(adapterInput({ candidateAssignments })),
    /unknown nurse/
  );
});

test("constraint adapter rejects unknown task candidates", () => {
  const input = optimizerInput();
  const candidateAssignments = [
    ...assignedCandidateAssignments(input),
    {
      id: "candidate-assignment-task-unknown",
      taskId: "task-unknown",
      nurseId: "nurse-alpha",
      assignmentReason: "manual_room_coverage",
      minute: 0
    }
  ];

  assert.throws(
    () => constrainOptimizerCandidateAssignments(adapterInput({ candidateAssignments })),
    /unknown task/
  );
});

test("constraint adapter preserves base unassigned tasks", () => {
  const output = constrainOptimizerCandidateAssignments(adapterInput());
  const preserved = output.taskAssignments.find(
    (assignment) => assignment.taskId === baseUnassignedTaskId
  );

  assert.deepEqual(output.preservedUnassignedTaskIds, [baseUnassignedTaskId]);
  assert.equal(preserved?.assignmentReason, "unassigned");
  assert.equal(preserved?.nurseId, null);
});

test("constrained candidate still passes assignment validation", () => {
  const input = optimizerInput();
  const output = constrainOptimizerCandidateAssignments(adapterInput());

  const validated = validateNurseTaskAssignmentContract(
    {
      ...input.baseNurseTaskAssignmentSet,
      nurseTaskAssignmentSetId: "nurse-task-assignment-constrained-candidate",
      assignmentSetId: "manual-assignment-basic-constrained-candidate",
      taskAssignments: output.taskAssignments
    },
    input.scenario,
    undefined,
    input.generatedTaskSet
  );

  assert.equal(validated.taskAssignments.length, input.generatedTaskSet.generatedTasks.length);
});

test("optimizer candidates preserve base unassigned tasks", () => {
  const output = buildBaselineAssignmentOptimizer(optimizerInput());

  assert.equal(output.candidates.length, 3);
  for (const variant of output.variantRun.variants) {
    assert.ok(
      variant.simulationRun.events.some(
        (event) =>
          event.eventType === "task" &&
          event.action === "unassigned" &&
          event.taskId === baseUnassignedTaskId
      ),
      `${variant.variantId} must leave ${baseUnassignedTaskId} unassigned`
    );
  }
});

test("optimizer still produces deterministic candidates through shared scoring", () => {
  const first = buildBaselineAssignmentOptimizer(optimizerInput());
  const second = buildBaselineAssignmentOptimizer(optimizerInput());

  assert.deepEqual(first, second);
  assert.equal(first.executionPath, "assignment_variant_runner");
  assert.equal(first.variantRun.variants.length, first.candidates.length);
  for (const candidate of first.candidates) {
    assert.ok(candidate.simulationRunId.length > 0);
    assert.ok(candidate.simulationScoreId.length > 0);
    assert.equal(typeof candidate.operationalBurdenScore, "number");
  }
});

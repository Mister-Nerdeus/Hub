import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  buildBaselineAssignmentOptimizer,
  constrainOptimizerCandidateAssignments,
  runAssignmentVariants,
  validateNurseTaskAssignmentContract
} from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));
const taskFixturesDir = join(fixturesDir, "tasks");

function readFixture(name) {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8"));
}

function readTaskFixture(name) {
  return JSON.parse(readFileSync(join(taskFixturesDir, name), "utf8"));
}

function optimizerInput() {
  return {
    optimizerRunId: "baseline-optimizer-assignment-reason",
    scenario: readFixture("shift-scenario-basic.json"),
    generatedTaskSet: readTaskFixture("generated-task-set-basic.json"),
    baseNurseTaskAssignmentSet: readFixture("nurse-task-assignment-basic.json")
  };
}

function generatedCandidateAssignments(input = optimizerInput()) {
  return input.generatedTaskSet.generatedTasks.map((task, index) => ({
    id: `generated-candidate-${task.id}`,
    taskId: task.id,
    nurseId: ["nurse-alpha", "nurse-bravo", "nurse-charlie"][index % 3],
    assignmentReason: "manual_room_coverage",
    minute: task.scheduledMinute
  }));
}

function constrainedOptimizerAssignments(input = optimizerInput()) {
  return constrainOptimizerCandidateAssignments({
    generatedTaskIds: input.generatedTaskSet.generatedTasks.map((task) => task.id),
    allowedNurseIds: ["nurse-alpha", "nurse-bravo", "nurse-charlie"],
    baseAssignments: input.baseNurseTaskAssignmentSet.taskAssignments,
    candidateAssignments: generatedCandidateAssignments(input)
  }).taskAssignments;
}

test("manual assignment reason still validates", () => {
  const input = optimizerInput();
  const validated = validateNurseTaskAssignmentContract(
    input.baseNurseTaskAssignmentSet,
    input.scenario,
    undefined,
    input.generatedTaskSet
  );

  assert.ok(
    validated.taskAssignments.some(
      (assignment) => assignment.assignmentReason === "manual_room_coverage"
    )
  );
});

test("optimizer candidate uses optimizer_candidate reason", () => {
  const assignments = constrainedOptimizerAssignments();

  assert.ok(
    assignments
      .filter((assignment) => assignment.assignmentReason !== "unassigned")
      .every((assignment) => assignment.assignmentReason === "optimizer_candidate")
  );
});

test("optimizer candidate does not use manual room coverage reason", () => {
  const assignments = constrainedOptimizerAssignments();

  assert.equal(
    assignments.some((assignment) => assignment.assignmentReason === "manual_room_coverage"),
    false
  );
});

test("constraint adapter can preserve original manual assignment reason", () => {
  const input = optimizerInput();
  const assignments = constrainOptimizerCandidateAssignments({
    generatedTaskIds: input.generatedTaskSet.generatedTasks.map((task) => task.id),
    allowedNurseIds: ["nurse-alpha", "nurse-bravo", "nurse-charlie"],
    baseAssignments: input.baseNurseTaskAssignmentSet.taskAssignments,
    candidateAssignments: input.baseNurseTaskAssignmentSet.taskAssignments,
    assignedCandidateReason: "preserve"
  }).taskAssignments;

  assert.ok(
    assignments.some((assignment) => assignment.assignmentReason === "manual_room_coverage")
  );
});

test("variant runner accepts optimizer candidate assignments", () => {
  const input = optimizerInput();
  const assignmentSet = validateNurseTaskAssignmentContract(
    {
      ...input.baseNurseTaskAssignmentSet,
      nurseTaskAssignmentSetId: "nurse-task-assignment-optimizer-candidate-reason",
      assignmentSetId: "optimizer-candidate-assignment-reason",
      taskAssignments: constrainedOptimizerAssignments(input)
    },
    input.scenario,
    undefined,
    input.generatedTaskSet
  );

  const run = runAssignmentVariants({
    variantRunId: "variant-run-optimizer-candidate-reason",
    scenario: input.scenario,
    generatedTaskSet: input.generatedTaskSet,
    variants: [
      {
        variantId: "optimizer-candidate-reason",
        label: "Optimizer candidate reason",
        nurseTaskAssignmentSet: assignmentSet
      }
    ]
  });

  assert.equal(run.variants.length, 1);
});

test("optimizer output remains deterministic", () => {
  assert.deepEqual(
    buildBaselineAssignmentOptimizer(optimizerInput()),
    buildBaselineAssignmentOptimizer(optimizerInput())
  );
});

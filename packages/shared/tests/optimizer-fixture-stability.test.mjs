import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  buildBaselineAssignmentOptimizer,
  constrainOptimizerCandidateAssignments
} from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));
const taskFixturesDir = join(fixturesDir, "tasks");
const expectedCandidateIds = [
  "candidate-original",
  "candidate-room-count-balanced",
  "candidate-task-minute-balanced"
];

function readFixture(name) {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8"));
}

function readTaskFixture(name) {
  return JSON.parse(readFileSync(join(taskFixturesDir, name), "utf8"));
}

function optimizerInput() {
  return {
    optimizerRunId: "baseline-optimizer-hardened",
    scenario: readFixture("shift-scenario-basic.json"),
    generatedTaskSet: readTaskFixture("generated-task-set-basic.json"),
    baseNurseTaskAssignmentSet: readFixture("nurse-task-assignment-basic.json")
  };
}

function buildHardenedOptimizerOutput() {
  return buildBaselineAssignmentOptimizer(optimizerInput());
}

function generatedCandidateAssignments(input = optimizerInput()) {
  return input.generatedTaskSet.generatedTasks.map((task, index) => ({
    id: `hardened-candidate-${task.id}`,
    taskId: task.id,
    nurseId: ["nurse-alpha", "nurse-bravo", "nurse-charlie"][index % 3],
    assignmentReason: "manual_room_coverage",
    minute: task.scheduledMinute
  }));
}

test("hardened optimizer output remains fixture-stable", () => {
  assert.deepEqual(
    buildHardenedOptimizerOutput(),
    readFixture("baseline-optimizer-hardened-output.json")
  );
});

test("hardened optimizer candidate IDs and order are stable", () => {
  const output = readFixture("baseline-optimizer-hardened-output.json");

  assert.deepEqual(
    output.candidates.map((candidate) => candidate.candidateId),
    expectedCandidateIds
  );
});

test("hardened optimizer candidates reference shared simulation score IDs", () => {
  const output = readFixture("baseline-optimizer-hardened-output.json");

  for (const candidate of output.candidates) {
    assert.equal(candidate.simulationScoreId, `simulation-score-${candidate.simulationRunId}`);
    const variant = output.variantRun.variants.find((entry) => entry.variantId === candidate.candidateId);
    assert.ok(variant, `missing variant for ${candidate.candidateId}`);
    assert.equal(variant.simulationScore.simulationScoreId, candidate.simulationScoreId);
  }
});

test("generated optimizer candidates use optimizer assignment reason", () => {
  const input = optimizerInput();
  const assignments = constrainOptimizerCandidateAssignments({
    generatedTaskIds: input.generatedTaskSet.generatedTasks.map((task) => task.id),
    allowedNurseIds: ["nurse-alpha", "nurse-bravo", "nurse-charlie"],
    baseAssignments: input.baseNurseTaskAssignmentSet.taskAssignments,
    candidateAssignments: generatedCandidateAssignments(input)
  }).taskAssignments;

  assert.ok(
    assignments
      .filter((assignment) => assignment.assignmentReason !== "unassigned")
      .every((assignment) => assignment.assignmentReason === "optimizer_candidate")
  );
});

test("hardened optimizer builder byte-stable output matches fixture", () => {
  const fixture = readFixture("baseline-optimizer-hardened-output.json");
  const rebuilt = buildHardenedOptimizerOutput();

  assert.deepEqual(rebuilt, fixture);
  assert.equal(JSON.stringify(rebuilt), JSON.stringify(fixture));
});

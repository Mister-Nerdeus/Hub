import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import {
  buildBaselineAssignmentOptimizer
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
    optimizerRunId: "baseline-optimizer-basic",
    scenario: readFixture("shift-scenario-basic.json"),
    generatedTaskSet: readTaskFixture("generated-task-set-basic.json"),
    baseNurseTaskAssignmentSet: readFixture("nurse-task-assignment-basic.json")
  };
}

test("at least three candidates generated", () => {
  const output = buildBaselineAssignmentOptimizer(optimizerInput());

  assert.ok(output.candidates.length >= 3);
});

test("all candidates use shared runner", () => {
  const output = buildBaselineAssignmentOptimizer(optimizerInput());

  assert.equal(output.executionPath, "assignment_variant_runner");
  assert.equal(output.variantRun.variants.length, output.candidates.length);
});

test("selected candidate uses deterministic tie-breaker", () => {
  const output = buildBaselineAssignmentOptimizer(optimizerInput());
  const expected = [...output.candidates].sort((left, right) => {
    const burdenDelta = left.operationalBurdenScore - right.operationalBurdenScore;
    if (burdenDelta !== 0) {
      return burdenDelta;
    }
    return left.candidateId.localeCompare(right.candidateId);
  })[0].candidateId;

  assert.equal(output.lowestOperationalBurdenCandidateId, expected);
});

test("same input produces identical output", () => {
  assert.deepEqual(
    buildBaselineAssignmentOptimizer(optimizerInput()),
    buildBaselineAssignmentOptimizer(optimizerInput())
  );
});

test("recommendation wording rejected by contract boundary", () => {
  const output = buildBaselineAssignmentOptimizer(optimizerInput());

  assert.equal(output.limitations.some((limitation) => /recommended/i.test(limitation)), false);
});

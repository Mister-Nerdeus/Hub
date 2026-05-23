import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import {
  buildBaselineAssignmentOptimizer,
  buildOptimizerAuditTrail,
  validateOptimizerAuditTrailContract
} from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));
const taskFixturesDir = join(fixturesDir, "tasks");

function readFixture(name) {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8"));
}

function readTaskFixture(name) {
  return JSON.parse(readFileSync(join(taskFixturesDir, name), "utf8"));
}

function optimizerOutput() {
  return buildBaselineAssignmentOptimizer({
    optimizerRunId: "baseline-optimizer-audit",
    scenario: readFixture("shift-scenario-basic.json"),
    generatedTaskSet: readTaskFixture("generated-task-set-basic.json"),
    baseNurseTaskAssignmentSet: readFixture("nurse-task-assignment-basic.json")
  });
}

test("all candidates appear in audit", () => {
  const output = optimizerOutput();
  const audit = buildOptimizerAuditTrail(output);

  assert.deepEqual(
    audit.candidates.map((candidate) => candidate.candidateId).sort(),
    output.candidates.map((candidate) => candidate.candidateId).sort()
  );
});

test("selected candidate matches optimizer output", () => {
  const output = optimizerOutput();
  const audit = buildOptimizerAuditTrail(output);

  assert.equal(audit.selectedOperationalCandidateId, output.lowestOperationalBurdenCandidateId);
});

test("missing candidate audit fails", () => {
  const output = optimizerOutput();
  const audit = buildOptimizerAuditTrail(output);
  audit.candidates.pop();

  assert.throws(
    () => validateOptimizerAuditTrailContract(audit, output),
    /orderedCandidateIds|every optimizer candidate/
  );
});

test("altered tie-breaker fails", () => {
  const output = optimizerOutput();
  const audit = buildOptimizerAuditTrail(output);
  audit.reconstruction.orderedCandidateIds.reverse();

  assert.throws(() => validateOptimizerAuditTrailContract(audit, output), /orderedCandidateIds/);
});

test("forbidden wording rejected", () => {
  const output = optimizerOutput();
  const audit = buildOptimizerAuditTrail(output);
  audit.limitations = ["recommended candidate"];

  assert.throws(() => validateOptimizerAuditTrailContract(audit, output), /recommended/);
});

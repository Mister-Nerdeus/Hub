import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import {
  runAssignmentVariants,
  validateAssignmentVariantRunContract
} from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));
const taskFixturesDir = join(fixturesDir, "tasks");

function readFixture(name) {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8"));
}

function readTaskFixture(name) {
  return JSON.parse(readFileSync(join(taskFixturesDir, name), "utf8"));
}

function baseInput() {
  const baseAssignment = readFixture("nurse-task-assignment-basic.json");
  const alternateAssignment = structuredClone(baseAssignment);
  alternateAssignment.nurseTaskAssignmentSetId = "nurse-task-assignment-alternate";
  alternateAssignment.taskAssignments = alternateAssignment.taskAssignments.map((assignment) =>
    assignment.nurseId == null ? assignment : { ...assignment, nurseId: "nurse-alpha" }
  );
  return {
    variantRunId: "assignment-variant-run-basic",
    scenario: readFixture("shift-scenario-basic.json"),
    generatedTaskSet: readTaskFixture("generated-task-set-basic.json"),
    manualAssignmentSet: readFixture("manual-assignment-basic.json"),
    variants: [
      {
        variantId: "variant-b",
        label: "Alternate assignment",
        nurseTaskAssignmentSet: alternateAssignment
      },
      {
        variantId: "variant-a",
        label: "Original assignment",
        nurseTaskAssignmentSet: baseAssignment
      }
    ]
  };
}

test("two variants produce two outputs", () => {
  const output = runAssignmentVariants(baseInput());

  assert.equal(output.variants.length, 2);
  assert.doesNotThrow(() => validateAssignmentVariantRunContract(output));
});

test("duplicate variant IDs fail", () => {
  const input = baseInput();
  input.variants[1].variantId = input.variants[0].variantId;

  assert.throws(() => runAssignmentVariants(input), /duplicate/);
});

test("output order is deterministic", () => {
  const output = runAssignmentVariants(baseInput());

  assert.deepEqual(output.variants.map((variant) => variant.variantId), ["variant-a", "variant-b"]);
});

test("same input produces identical output", () => {
  assert.deepEqual(runAssignmentVariants(baseInput()), runAssignmentVariants(baseInput()));
});

test("forbidden wording rejected", () => {
  const output = runAssignmentVariants(baseInput());
  output.limitations = ["best assignment"];

  assert.throws(() => validateAssignmentVariantRunContract(output), /best/);
});

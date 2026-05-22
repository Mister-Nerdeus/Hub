import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import {
  validateGeneratedOperationalTask,
  validateGeneratedOperationalTasks,
  validateGeneratedOperationalTaskSet,
  validatePlanContract,
  validateShiftScenarioContract,
  validateTaskTemplateContract
} from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));
const taskFixturesDir = join(fixturesDir, "tasks");
const invalidTaskFixturesDir = join(taskFixturesDir, "invalid");

function readFixture(name) {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8"));
}

function readTaskFixture(name) {
  return JSON.parse(readFileSync(join(taskFixturesDir, name), "utf8"));
}

function readInvalidTaskFixture(name) {
  return JSON.parse(readFileSync(join(invalidTaskFixturesDir, name), "utf8"));
}

function buildReferences() {
  const plan = validatePlanContract(readFixture("plan-er-pod-phase2.json"));
  const taskTemplates = validateTaskTemplateContract(readFixture("task-templates-basic.json"));
  const scenario = validateShiftScenarioContract(readFixture("shift-scenario-basic.json"), {
    plan,
    taskTemplates
  });
  return { plan, scenario, taskTemplates };
}

test("generated task validator is publicly exported", () => {
  const { scenario, taskTemplates } = buildReferences();
  const [task] = readTaskFixture("generated-task-set-basic.json").generatedTasks;

  assert.equal(
    validateGeneratedOperationalTask(task, scenario, taskTemplates).id,
    "task-basic-room-01-medication-001"
  );
});

test("generated task array validator remains public and rejects duplicate IDs", () => {
  const { scenario } = buildReferences();
  const taskSet = readInvalidTaskFixture("generated-task-duplicate-id.json");

  assert.throws(() => validateGeneratedOperationalTasks(taskSet.generatedTasks, scenario));
});

test("valid generated operational task set fixture validates with references", () => {
  const { plan, scenario, taskTemplates } = buildReferences();
  const taskSet = validateGeneratedOperationalTaskSet(
    readTaskFixture("generated-task-set-basic.json"),
    scenario,
    taskTemplates,
    plan
  );

  assert.equal(taskSet.generatedTaskSetId, "generated-task-set-basic");
  assert.equal(taskSet.taskCount, taskSet.generatedTasks.length);
});

test("generated task set rejects taskCount mismatch", () => {
  const { scenario } = buildReferences();
  const taskSet = readTaskFixture("generated-task-set-basic.json");
  taskSet.taskCount += 1;

  assert.throws(() => validateGeneratedOperationalTaskSet(taskSet, scenario), /taskCount/);
});

for (const fixtureName of [
  "generated-task-bad-minute.json",
  "generated-task-bad-duration.json",
  "generated-task-unknown-room.json",
  "generated-task-duplicate-id.json",
  "generated-task-set-mismatched-scenario.json"
]) {
  test(`${fixtureName} is rejected by generated task-set validator`, () => {
    const { scenario, taskTemplates } = buildReferences();

    assert.throws(() =>
      validateGeneratedOperationalTaskSet(
        readInvalidTaskFixture(fixtureName),
        scenario,
        taskTemplates
      )
    );
  });
}

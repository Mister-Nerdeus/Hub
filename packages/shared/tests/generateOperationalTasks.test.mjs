import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import {
  generateOperationalTasks,
  validateAssumptionsRegisterContract,
  validateDayProfileContract,
  validateGeneratedOperationalTasks,
  validateShiftScenarioContract,
  validateTaskTemplateContract
} from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));
const taskFixturesDir = join(fixturesDir, "tasks");

function readFixture(name) {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8"));
}

function readTaskFixture(name) {
  return JSON.parse(readFileSync(join(taskFixturesDir, name), "utf8"));
}

function buildInput(dayProfileName = "day-profile-typical.json") {
  const assumptions = validateAssumptionsRegisterContract(readFixture("assumptions-basic.json"));
  const taskTemplates = validateTaskTemplateContract(readFixture("task-templates-basic.json"));
  const dayProfile = validateDayProfileContract(readFixture(dayProfileName));
  const scenarioFixture = readFixture("shift-scenario-basic.json");
  const scenario = validateShiftScenarioContract(
    {
      ...scenarioFixture,
      scenarioId:
        dayProfile.dayProfileId === "day-profile-slammed"
          ? "shift-scenario-slammed"
          : scenarioFixture.scenarioId,
      dayProfileId: dayProfile.dayProfileId
    },
    {
      assumptions,
      taskTemplates,
      dayProfile
    }
  );

  return {
    scenario,
    assumptions,
    taskTemplates,
    dayProfile
  };
}

test("generateOperationalTasks returns deterministic typical output", () => {
  const input = buildInput();
  const first = generateOperationalTasks(input);
  const second = generateOperationalTasks(input);

  assert.deepEqual(first, second);
  assert.deepEqual(first, readTaskFixture("generated-tasks-basic.json"));
});

test("generateOperationalTasks returns deterministic slammed output", () => {
  const input = buildInput("day-profile-slammed.json");
  const tasks = generateOperationalTasks(input);

  assert.deepEqual(tasks, readTaskFixture("generated-tasks-slammed.json"));
});

test("different seed produces controlled timing differences", () => {
  const input = buildInput();
  const baseline = generateOperationalTasks(input);
  const differentSeed = generateOperationalTasks({
    ...input,
    scenario: {
      ...input.scenario,
      seed: input.scenario.seed + 1
    }
  });

  assert.equal(differentSeed.length, baseline.length);
  assert.notDeepEqual(
    differentSeed.map((task) => task.scheduledMinute),
    baseline.map((task) => task.scheduledMinute)
  );
});

test("slammed day profile changes generated task volume", () => {
  const typical = generateOperationalTasks(buildInput());
  const slammed = generateOperationalTasks(buildInput("day-profile-slammed.json"));

  assert.ok(slammed.length > typical.length);
});

test("generated tasks validate and stay within shift bounds", () => {
  const input = buildInput();
  const tasks = generateOperationalTasks(input);
  const validatedTasks = validateGeneratedOperationalTasks(tasks, input.scenario);

  assert.equal(validatedTasks.length, tasks.length);
  assert.ok(tasks.every((task) => task.scheduledMinute >= 0));
  assert.ok(tasks.every((task) => task.scheduledMinute < input.scenario.shiftLengthMinutes));
  assert.ok(tasks.every((task) => task.estimatedDurationMinutes > 0));
});

test("generated task IDs are deterministic and do not assign work to nurses", () => {
  const tasks = generateOperationalTasks(buildInput());
  const taskIds = tasks.map((task) => task.id);

  assert.equal(new Set(taskIds).size, taskIds.length);
  assert.ok(taskIds.every((taskId) => taskId.startsWith("task-shift-scenario-basic-")));
  assert.ok(tasks.every((task) => Object.hasOwn(task, "nurseId") === false));
});

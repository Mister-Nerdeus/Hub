import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  PLAN_1_REQUIRED_TASK_TEMPLATE_IDS,
  validatePlan1TaskTemplates
} from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));
const fixture = readJson("scenarios/plan-1/task-templates.json");
const forbiddenField = ["patient", "Name"].join("");

test("Plan 1 task templates validate required synthetic operational templates", () => {
  const templates = validatePlan1TaskTemplates(fixture);
  assert.deepEqual(templates.map((template) => template.templateId), [...PLAN_1_REQUIRED_TASK_TEMPLATE_IDS]);
  assert.ok(templates.every((template) => template.syntheticDataOnly));
  assert.ok(templates.some((template) => template.requiresWalkingRoute));
  assert.ok(templates.some((template) => template.taskCategory === "trauma_response"));
});

test("Plan 1 task templates reject invalid categories, timing, and synthetic flags", () => {
  const unsupported = structuredClone(fixture);
  unsupported.taskTemplates[0].taskCategory = "unsupported";
  assert.throws(() => validatePlan1TaskTemplates(unsupported), /taskCategory/u);

  const negativeDuration = structuredClone(fixture);
  negativeDuration.taskTemplates[0].baseDurationMinutes = -1;
  assert.throws(() => validatePlan1TaskTemplates(negativeDuration), /positive/u);

  const negativeFrequency = structuredClone(fixture);
  negativeFrequency.taskTemplates[0].baseFrequencyPerHour = -1;
  assert.throws(() => validatePlan1TaskTemplates(negativeFrequency), /non-negative/u);

  const nonSynthetic = structuredClone(fixture);
  nonSynthetic.taskTemplates[0].syntheticDataOnly = false;
  assert.throws(() => validatePlan1TaskTemplates(nonSynthetic), /syntheticDataOnly/u);
});

test("Plan 1 task templates reject PHI-like and clinical-action fields", () => {
  const invalid = structuredClone(fixture);
  invalid.taskTemplates[0][forbiddenField] = "blocked";
  assert.throws(() => validatePlan1TaskTemplates(invalid), /forbidden/u);

  const noLimitations = structuredClone(fixture);
  noLimitations.taskTemplates[0].limitations = [];
  assert.throws(() => validatePlan1TaskTemplates(noLimitations), /limitations/u);

  const noNonClaims = structuredClone(fixture);
  noNonClaims.taskTemplates[0].nonClaims = [];
  assert.throws(() => validatePlan1TaskTemplates(noNonClaims), /nonClaims|not be empty/u);
});

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(fixturesDir, relativePath), "utf8"));
}

import assert from "node:assert/strict";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import {
  NO_PHI_RUNTIME_REJECTION_CODE,
  validateDayProfileContract,
  validateManualAssignmentContract,
  validateOperationalReportContract,
  validatePlanContract,
  validateReportExportBundleContract,
  validateShiftScenarioContract,
  validateSimulationRunContract,
  validateTaskTemplateContract
} from "../dist/index.js";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const fixturesDir = join(repoRoot, "packages", "shared", "fixtures");
const negativeDir = join(fixturesDir, "no-phi-negative");
const positiveDir = join(fixturesDir, "no-phi-positive");
const evidenceDir = join(repoRoot, "docs", "verification", "issues", "issue-190");

const validators = {
  plan: validatePlanContract,
  scenario: validateShiftScenarioContract,
  manualAssignment: validateManualAssignmentContract,
  simulationRun: validateSimulationRunContract,
  report: validateOperationalReportContract,
  exportBundle: validateReportExportBundleContract,
  taskTemplate: validateTaskTemplateContract,
  dayProfile: validateDayProfileContract
};

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function readFixture(relativePath) {
  return readJson(join(fixturesDir, relativePath));
}

function readNegativeFixtures() {
  return readdirSync(negativeDir)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => ({ name, ...readJson(join(negativeDir, name)) }));
}

function applyMutation(source, path, value) {
  const target = structuredClone(source);
  let cursor = target;
  for (const segment of path.slice(0, -1)) {
    cursor = cursor[segment];
  }
  cursor[path.at(-1)] = value;
  return target;
}

function validateFixture(objectType, value) {
  const validator = validators[objectType];
  assert.equal(typeof validator, "function", `missing validator for ${objectType}`);
  return validator(value);
}

function writeEvidence(name, payload) {
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(join(evidenceDir, name), `${JSON.stringify(payload, null, 2)}\n`);
}

test("no-PHI negative object fixtures fail deterministically", () => {
  const fixtures = readNegativeFixtures();
  const objectTypes = [];

  for (const fixture of fixtures) {
    const mutated = applyMutation(
      readFixture(fixture.sourceFixture),
      fixture.mutationPath,
      fixture.rejectedValue
    );
    assert.throws(
      () => validateFixture(fixture.objectType, mutated),
      (error) => {
        assert.match(error.message, new RegExp(fixture.expectedCode));
        assert.equal(error.message.includes(fixture.rejectedValue), false);
        return true;
      },
      `${fixture.name} must reject without echoing the fixture value`
    );
    objectTypes.push(fixture.objectType);
  }

  writeEvidence("no-phi-negative-fixtures-output.json", {
    issue: "190",
    status: "passed",
    fixtureCount: fixtures.length,
    objectTypes: objectTypes.sort(),
    rejectionCode: NO_PHI_RUNTIME_REJECTION_CODE,
    rejectedValuesEchoed: false
  });
});

test("no-PHI positive object fixtures pass", () => {
  const fixtures = readJson(join(positiveDir, "object-fixtures.json"));

  for (const fixture of fixtures) {
    assert.doesNotThrow(() =>
      validateFixture(fixture.objectType, readFixture(fixture.sourceFixture))
    );
  }

  writeEvidence("no-phi-positive-fixtures-output.json", {
    issue: "190",
    status: "passed",
    fixtureCount: fixtures.length,
    objectTypes: fixtures.map((fixture) => fixture.objectType).sort()
  });
});

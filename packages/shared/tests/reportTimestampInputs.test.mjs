import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import {
  buildNurseWorkloadReport,
  buildOperationalSummaryReport,
  buildUnassignedTaskReport,
  buildWarningReport,
  OPERATIONAL_REPORT_CREATED_AT
} from "../dist/index.js";

const fixturesDir = fileURLToPath(new URL("../fixtures/", import.meta.url));
const taskFixturesDir = join(fixturesDir, "tasks");
const contractsDir = fileURLToPath(new URL("../../../docs/contracts/", import.meta.url));

function readFixture(name) {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8"));
}

function readTaskFixture(name) {
  return JSON.parse(readFileSync(join(taskFixturesDir, name), "utf8"));
}

function buildInput(overrides = {}) {
  return {
    scenario: readFixture("shift-scenario-basic.json"),
    generatedTaskSet: readTaskFixture("generated-task-set-basic.json"),
    timelineSummary: readTaskFixture("task-timeline-basic.json"),
    nurseTaskAssignmentResult: readTaskFixture("nurse-task-assignments-basic.json"),
    manualAssignmentSet: readFixture("manual-assignment-basic.json"),
    ...overrides
  };
}

const builders = [
  ["operational summary", buildOperationalSummaryReport],
  ["nurse workload", buildNurseWorkloadReport],
  ["unassigned task", buildUnassignedTaskReport],
  ["warning", buildWarningReport]
];

for (const [label, builder] of builders) {
  test(`${label} report builder uses deterministic proof timestamp by default`, () => {
    const report = builder(buildInput());

    assert.equal(report.createdAt, OPERATIONAL_REPORT_CREATED_AT);
  });

  test(`${label} report builder accepts explicit createdAt input`, () => {
    const createdAt = "2026-05-23T12:34:56Z";
    const report = builder(buildInput({ createdAt }));

    assert.equal(report.createdAt, createdAt);
  });

  test(`${label} report builder rejects invalid createdAt input`, () => {
    assert.throws(() => builder(buildInput({ createdAt: "not-a-timestamp" })), /createdAt/);
  });
}

test("deterministic timestamp contract documents proof defaults and explicit inputs", () => {
  const contractPath = join(contractsDir, "deterministic-timestamp-contract.md");

  assert.equal(existsSync(contractPath), true);

  const contract = readFileSync(contractPath, "utf8").toLowerCase();
  assert.match(contract, /deterministic proof default/);
  assert.match(contract, /explicit createdat input/);
  assert.match(contract, /no automatic current-time/);
});

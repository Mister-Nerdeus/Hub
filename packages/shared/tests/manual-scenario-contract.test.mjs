import test from "node:test";
import assert from "node:assert/strict";

import {
  manualScenarioIdFor,
  validateManualScenarioContract
} from "../dist/index.js";

const validScenario = {
  scenarioId: manualScenarioIdFor({
    floorplanId: "floorplan-alpha",
    assignmentSetId: "assignment-set-alpha",
    label: "Manual Scenario Alpha"
  }),
  label: "Manual Scenario Alpha",
  description: "Reference set for a synthetic operational walkthrough",
  floorplanId: "floorplan-alpha",
  assignmentSetId: "assignment-set-alpha",
  staffRosterId: "staff-roster-alpha",
  createdAtIso: "2026-06-01T00:00:00.000Z",
  updatedAtIso: "2026-06-01T00:00:00.000Z",
  mode: "manual"
};

test("manual scenario contract accepts manual reference records", () => {
  const scenario = validateManualScenarioContract(validScenario);
  assert.equal(scenario.mode, "manual");
  assert.equal(scenario.floorplanId, "floorplan-alpha");
  assert.equal(scenario.assignmentSetId, "assignment-set-alpha");
  assert.equal(scenario.staffRosterId, "staff-roster-alpha");
});

test("manual scenario id helper is deterministic", () => {
  assert.equal(
    manualScenarioIdFor({
      floorplanId: "Floorplan Alpha",
      assignmentSetId: "Assignment Set Alpha",
      label: "Manual Scenario Alpha"
    }),
    "manual-scenario:floorplan-alpha:assignment-set-alpha:manual-scenario-alpha"
  );
});

test("manual scenario contract rejects forbidden scenario fields", () => {
  for (const field of [
    "score",
    "recommendation",
    "burden",
    "workload",
    "simulationResult",
    "optimizerOutput",
    "safetyStatus",
    "complianceStatus",
    "patientOutcome"
  ]) {
    assert.throws(
      () => validateManualScenarioContract({ ...validScenario, [field]: "blocked" }),
      new RegExp(`manualScenario\\.${field} is not allowed`)
    );
  }
});

test("manual scenario labels and descriptions reject overclaim text", () => {
  assert.throws(
    () => validateManualScenarioContract({
      ...validScenario,
      scenarioId: manualScenarioIdFor({
        floorplanId: validScenario.floorplanId,
        assignmentSetId: validScenario.assignmentSetId,
        label: "Best scenario"
      }),
      label: "Best scenario"
    }),
    /overclaim language|NO_PHI_RUNTIME_REJECTION/u
  );
  assert.throws(
    () => validateManualScenarioContract({
      ...validScenario,
      description: "Recommended setup"
    }),
    /overclaim language|NO_PHI_RUNTIME_REJECTION/u
  );
});

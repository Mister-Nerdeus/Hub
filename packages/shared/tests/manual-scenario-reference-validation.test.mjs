import test from "node:test";
import assert from "node:assert/strict";

import {
  manualScenarioIdFor,
  validateManualAssignmentSetContract,
  validateManualScenarioContract,
  validateManualScenarioReferenceReadiness,
  validateManualScenarioReferences
} from "../dist/index.js";

const floorplanId = "floorplan-alpha";
const scenario = validateManualScenarioContract({
  scenarioId: manualScenarioIdFor({ stableSeed: "scenario-alpha" }),
  label: "Manual Scenario Alpha",
  floorplanId,
  assignmentSetId: "assignment-set-alpha",
  staffRosterId: "staff-roster-alpha",
  createdAtIso: "2026-06-01T00:00:00.000Z",
  updatedAtIso: "2026-06-01T00:00:00.000Z",
  mode: "manual"
});
const assignmentSet = validateManualAssignmentSetContract({
  assignmentSetId: "assignment-set-alpha",
  floorplanId,
  label: "Manual assignment set",
  createdAtIso: "2026-06-01T00:00:00.000Z",
  updatedAtIso: "2026-06-01T00:00:00.000Z",
  assignments: [],
  mode: "manual"
});

test("manual scenario reference validation passes for matching references", () => {
  const result = validateManualScenarioReferences({
    scenario,
    floorplanIds: [floorplanId],
    assignmentSets: [assignmentSet],
    staffRosterIds: ["staff-roster-alpha"]
  });
  assert.equal(result.status, "passed");
  assert.deepEqual(result.issues, []);
});

test("manual scenario reference validation reports missing references", () => {
  const result = validateManualScenarioReferences({
    scenario,
    floorplanIds: [],
    assignmentSets: [],
    staffRosterIds: []
  });
  assert.equal(result.status, "failed");
  assert.deepEqual(result.issues.map((issue) => issue.message), [
    "Missing floorplan",
    "Missing assignment set",
    "Missing staff roster"
  ]);
  assert.deepEqual(result.issues.map((issue) => issue.severity), ["error", "error", "error"]);
});

test("manual scenario reference validation reports assignment set floorplan mismatch", () => {
  const result = validateManualScenarioReferences({
    scenario,
    floorplanIds: [floorplanId],
    assignmentSets: [{ ...assignmentSet, floorplanId: "other-floorplan" }],
    staffRosterIds: ["staff-roster-alpha"]
  });
  assert.equal(result.status, "failed");
  assert.equal(result.issues[0]?.message, "Assignment set does not match floorplan");
});

test("manual scenario reference readiness requires floorplan assignment set and staff roster", () => {
  assert.deepEqual(validateManualScenarioReferenceReadiness({
    floorplanId,
    assignmentSetId: null,
    staffRosterId: null
  }), {
    status: "failed",
    issues: [
      { severity: "error", code: "missing_assignment_set", message: "Missing assignment set" },
      { severity: "error", code: "missing_staff_roster", message: "Missing staff roster" }
    ]
  });
  assert.deepEqual(validateManualScenarioReferenceReadiness({
    floorplanId,
    assignmentSetId: "assignment-set-alpha",
    staffRosterId: null
  }), {
    status: "failed",
    issues: [
      { severity: "error", code: "missing_staff_roster", message: "Missing staff roster" }
    ]
  });
  assert.equal(validateManualScenarioReferenceReadiness({
    floorplanId,
    assignmentSetId: "assignment-set-alpha",
    staffRosterId: "staff-roster-alpha"
  }).status, "passed");
});

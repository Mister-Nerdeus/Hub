import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildManualComparisonReferenceMatrix,
  manualComparisonSetIdFor,
  projectReadinessStatusFixture,
  validateManualComparisonSetContract,
  validateProjectReadinessStatusContract
} from "../dist/index.js";

describe("manual comparison contracts", () => {
  it("validates a manual comparison set", () => {
    const set = validateManualComparisonSetContract({
      comparisonSetId: manualComparisonSetIdFor({ stableSeed: "comparison" }),
      label: "Manual Comparison",
      scenarioIds: ["scenario-a", "scenario-b"],
      createdAtIso: "2026-01-01T00:00:00.000Z",
      updatedAtIso: "2026-01-01T00:00:00.000Z",
      mode: "manual_comparison"
    });
    assert.deepEqual(set.scenarioIds, ["scenario-a", "scenario-b"]);
  });

  it("builds a reference matrix", () => {
    const rows = buildManualComparisonReferenceMatrix({
      scenarios: [{
        scenarioId: "scenario-a",
        label: "Scenario A",
        floorplanId: "floorplan-a",
        assignmentSetId: "assignment-set-a",
        staffRosterId: "staff-roster-a",
        createdAtIso: "2026-01-01T00:00:00.000Z",
        updatedAtIso: "2026-01-01T00:00:00.000Z",
        mode: "manual"
      }],
      summaries: [{
        scenarioId: "scenario-a",
        floorplanId: "floorplan-a",
        staffRosterId: "staff-roster-a",
        assignmentSetId: "assignment-set-a",
        snapshotStatus: "present",
        referenceIssues: []
      }],
      notesByScenarioId: { "scenario-a": [{}] }
    });
    assert.equal(rows[0].scenario, "Scenario A");
    assert.equal(rows[0].manualNotesCount, 1);
  });
});

describe("project readiness contracts", () => {
  it("keeps readiness scoped to project milestones", () => {
    assert.equal(projectReadinessStatusFixture.length, 9);
    for (const item of projectReadinessStatusFixture) {
      assert.equal(validateProjectReadinessStatusContract(item).scope, "project_readiness_only");
    }
  });
});

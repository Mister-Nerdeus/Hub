import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildManualComparisonReferenceMatrix,
  manualComparisonSetIdFor,
  projectReadinessStatusFixture,
  validateManualComparisonCollection,
  validateManualComparisonSetContract,
  validateProjectReadinessStatusContract
} from "../dist/index.js";

describe("manual comparison contracts", () => {
  it("validates a manual comparison set", () => {
    const set = validateManualComparisonSetContract({
      comparisonSetId: manualComparisonSetIdFor({ stableSeed: "comparison" }),
      label: "Manual Comparison",
      scenarioIds: ["manual-scenario:a", "manual-scenario:b"],
      createdAtIso: "2026-01-01T00:00:00.000Z",
      updatedAtIso: "2026-01-01T00:00:00.000Z",
      mode: "manual_comparison"
    });
    assert.deepEqual(set.scenarioIds, ["manual-scenario:a", "manual-scenario:b"]);
  });

  it("rejects invalid manual comparison sets", () => {
    const valid = {
      comparisonSetId: manualComparisonSetIdFor({ stableSeed: "comparison" }),
      label: "Manual comparison set",
      scenarioIds: ["manual-scenario:a", "manual-scenario:b"],
      createdAtIso: "2026-01-01T00:00:00.000Z",
      updatedAtIso: "2026-01-01T00:00:00.000Z",
      mode: "manual_comparison"
    };
    assert.throws(() => validateManualComparisonSetContract({ ...valid, scenarioIds: ["manual-scenario:a", "manual-scenario:a"] }));
    assert.throws(() => validateManualComparisonSetContract({ ...valid, scenarioIds: [] }));
    assert.throws(() => validateManualComparisonSetContract({ ...valid, scenarioIds: ["manual-scenario:a"] }));
    assert.throws(() => validateManualComparisonSetContract({ ...valid, label: "Safe assignment claim" }));
    assert.throws(() => validateManualComparisonSetContract({ ...valid, label: "Better scenario claim" }));
    assert.throws(() => validateManualComparisonSetContract({ ...valid, score: 1 }));
    assert.throws(() => validateManualComparisonSetContract({ ...valid, recommendation: "Choose this" }));
    assert.throws(() => validateManualComparisonSetContract({ ...valid, simulation: true }));
  });

  it("validates manual comparison collections", () => {
    const valid = {
      comparisonSetId: manualComparisonSetIdFor({ stableSeed: "collection" }),
      label: "Reference review set",
      scenarioIds: ["manual-scenario:a", "manual-scenario:b"],
      createdAtIso: "2026-01-01T00:00:00.000Z",
      updatedAtIso: "2026-01-01T00:00:00.000Z",
      mode: "manual_comparison"
    };
    const collection = validateManualComparisonCollection({
      comparisonSets: [valid],
      scenarioIds: ["manual-scenario:a", "manual-scenario:b"],
      selectedComparisonSetId: valid.comparisonSetId
    });
    assert.equal(collection.selectedComparisonSetId, valid.comparisonSetId);
    assert.throws(() => validateManualComparisonCollection({ comparisonSets: [valid, valid] }));
    assert.throws(() => validateManualComparisonCollection({
      comparisonSets: [valid],
      scenarioIds: ["manual-scenario:a"],
      selectedComparisonSetId: valid.comparisonSetId
    }));
    assert.throws(() => validateManualComparisonCollection({
      comparisonSets: [valid],
      selectedComparisonSetId: "manual-comparison-set:missing"
    }));
  });

  it("builds a reference matrix", () => {
    const rows = buildManualComparisonReferenceMatrix({
      scenarios: [{
        scenarioId: "manual-scenario:a",
        label: "Scenario A",
        floorplanId: "floorplan-a",
        assignmentSetId: "assignment-set-a",
        staffRosterId: "staff-roster-a",
        createdAtIso: "2026-01-01T00:00:00.000Z",
        updatedAtIso: "2026-01-01T00:00:00.000Z",
        mode: "manual"
      }],
      summaries: [{
        scenarioId: "manual-scenario:a",
        floorplanId: "floorplan-a",
        staffRosterId: "staff-roster-a",
        assignmentSetId: "assignment-set-a",
        snapshotStatus: "present",
        referenceIssues: []
      }],
      notesByScenarioId: { "manual-scenario:a": [{}] }
    });
    assert.equal(rows[0].scenarioId, "manual-scenario:a");
    assert.equal(rows[0].scenarioLabel, "Scenario A");
    assert.equal(rows[0].manualNotesCount, 1);
  });
});

describe("project readiness contracts", () => {
  it("keeps readiness scoped to project milestones", () => {
    assert.equal(projectReadinessStatusFixture.length, 12);
    for (const item of projectReadinessStatusFixture) {
      assert.equal(validateProjectReadinessStatusContract(item).scope, "project_readiness_only");
    }
  });
});

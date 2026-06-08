import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildManualScenarioReviewSummary,
  classifyManualScenarioReferenceIssues,
  createManualScenarioReview,
  manualScenarioIdFor,
  manualScenarioSnapshotIdFor,
  validateManualScenarioReviewContract
} from "../dist/index.js";

describe("manual scenario review contracts", () => {
  it("creates a manual review record that references scenario identity", () => {
    const scenarioId = manualScenarioIdFor({ stableSeed: "review-contract" });
    const review = createManualScenarioReview({
      scenarioId,
      floorplanId: "floorplan-a",
      assignmentSetId: "assignment-set-a",
      staffRosterId: "staff-roster-a",
      createdAtIso: "2026-01-01T00:00:00.000Z",
      status: "ready_for_manual_review"
    });
    assert.equal(review.reviewId, `manual-scenario-review:${scenarioId.replace(/[^a-z0-9]+/gu, "-").replace(/^-|-$/gu, "")}`);
    assert.equal(validateManualScenarioReviewContract(review).mode, "manual_review");
  });

  it("rejects extra fields in review records", () => {
    const scenarioId = manualScenarioIdFor({ stableSeed: "review-extra" });
    assert.throws(() => validateManualScenarioReviewContract({
      reviewId: "manual-scenario-review:manual-scenario-review-extra",
      scenarioId,
      floorplanId: "floorplan-a",
      assignmentSetId: "assignment-set-a",
      staffRosterId: "staff-roster-a",
      createdAtIso: "2026-01-01T00:00:00.000Z",
      updatedAtIso: "2026-01-01T00:00:00.000Z",
      status: "draft",
      mode: "manual_review",
      recommendation: "not allowed"
    }), /not allowed/u);
  });

  it("classifies reference issues without value judgment types", () => {
    const issues = classifyManualScenarioReferenceIssues({
      scenario: null,
      floorplanId: null,
      assignmentSetId: null,
      staffRosterId: null
    });
    assert.deepEqual(issues.map((issue) => issue.type), [
      "missing_floorplan",
      "missing_assignment_set",
      "missing_staff_roster"
    ]);
  });

  it("summarizes linked references and snapshot state", () => {
    const scenarioId = manualScenarioIdFor({ stableSeed: "summary" });
    const scenario = {
      scenarioId,
      label: "Manual Scenario",
      floorplanId: "floorplan-a",
      assignmentSetId: "assignment-set-a",
      staffRosterId: "staff-roster-a",
      createdAtIso: "2026-01-01T00:00:00.000Z",
      updatedAtIso: "2026-01-01T00:00:00.000Z",
      mode: "manual"
    };
    const summary = buildManualScenarioReviewSummary({
      scenario,
      snapshots: [{
        scenarioSnapshotId: manualScenarioSnapshotIdFor({
          scenarioId,
          floorplanId: "floorplan-a",
          assignmentSetId: "assignment-set-a",
          staffRosterId: "staff-roster-a"
        }),
        scenarioId,
        floorplanId: "floorplan-a",
        assignmentSetId: "assignment-set-a",
        staffRosterId: "staff-roster-a",
        createdAtIso: "2026-01-01T00:00:00.000Z",
        mode: "manual_snapshot"
      }]
    });
    assert.equal(summary.floorplanId, "floorplan-a");
    assert.equal(summary.staffRosterId, "staff-roster-a");
    assert.equal(summary.assignmentSetId, "assignment-set-a");
    assert.equal(summary.snapshotStatus, "present");
    assert.equal(summary.referenceIssues.length, 0);
  });
});

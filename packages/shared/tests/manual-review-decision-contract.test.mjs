import assert from "node:assert/strict";
import test from "node:test";
import { validateManualReviewDecisionRecord } from "../dist/index.js";

function record(overrides = {}) {
  return {
    recordVersion: "1.0.0",
    planId: "plan-2",
    sourceDefaultPlanId: "default-er-layout-plan-2",
    reviewRecordKind: "manual_visual_review_decision",
    sampleRecord: false,
    codexClaimedApproval: false,
    reviewerDecisionSource: "none",
    manualReviewStatus: "manual_review_required",
    reviewScope: "operational_layout_plausibility_only",
    promotionAuthorization: "none",
    defaultFixturePromotionRequested: false,
    reviewedArtifactPaths: ["docs/manual-review/plan-2-review-packet.md"],
    reviewDimensions: {
      roomPlacementPlausibility: "not_reviewed",
      doorPlacementPlausibility: "not_reviewed",
      hallwayPathConnectivityPlausibility: "not_reviewed",
      stationPlacementPlausibility: "not_reviewed",
      labelsReadability: "not_reviewed",
      knownLimitationsAccepted: "not_reviewed"
    },
    blockingIssues: [],
    reviewerNotes: [],
    limitations: ["Manual review required."],
    nonClaims: ["No default fixture promotion."],
    ...overrides
  };
}

test("decision contract accepts approved with notes from explicit reviewer artifact", () => {
  const validated = validateManualReviewDecisionRecord(record({
    reviewerDecisionSource: "explicit_manual_artifact",
    manualReviewStatus: "approved_with_notes",
    promotionAuthorization: "future_promotion_review_consideration_only",
    reviewDimensions: {
      roomPlacementPlausibility: "accepted",
      doorPlacementPlausibility: "accepted",
      hallwayPathConnectivityPlausibility: "accepted",
      stationPlacementPlausibility: "accepted",
      labelsReadability: "accepted",
      knownLimitationsAccepted: "accepted"
    }
  }));
  assert.equal(validated.manualReviewStatus, "approved_with_notes");
});

test("decision contract rejects forbidden approval drift", () => {
  assert.throws(() => validateManualReviewDecisionRecord(record({
    codexClaimedApproval: true
  })), /codexClaimedApproval/u);
  assert.throws(() => validateManualReviewDecisionRecord(record({
    sampleRecord: true,
    reviewerDecisionSource: "explicit_manual_artifact",
    manualReviewStatus: "approved_for_promotion_review",
    promotionAuthorization: "future_promotion_review_consideration_only"
  })), /sample/u);
  assert.throws(() => validateManualReviewDecisionRecord(record({
    reviewerNotes: ["exact CAD match"]
  })), /forbidden claim/u);
  assert.throws(() => validateManualReviewDecisionRecord(record({
    reviewerNotes: ["clinical safety approval"]
  })), /forbidden claim/u);
  assert.throws(() => validateManualReviewDecisionRecord(record({
    defaultFixturePromotionRequested: true
  })), /defaultFixturePromotionRequested/u);
});

import assert from "node:assert/strict";
import test from "node:test";
import { validateSubmittedHumanReviewRecord } from "../dist/index.js";

function validRecord(overrides = {}) {
  return {
    recordVersion: "1.0.0",
    planId: "plan-2",
    reviewRecordKind: "human_visual_review_decision",
    sampleRecord: false,
    codexClaimedApproval: false,
    reviewerDecisionSource: "explicit_manual_artifact",
    reviewerIdentity: {
      reviewerHandle: "layout_owner",
      reviewerRole: "owner",
      reviewerAuthorityScope: "promotion_review_consideration"
    },
    reviewedAt: "2026-05-26T00:00:00Z",
    reviewMethod: "manual_packet_review",
    manualReviewStatus: "approved_for_promotion_review",
    reviewScope: "operational_layout_plausibility_only",
    promotionAuthorization: "future_promotion_review_consideration_only",
    defaultFixturePromotionRequested: false,
    reviewedArtifactPaths: ["docs/manual-review/plan-2-review-packet.md"],
    reviewDimensions: {
      roomPlacementPlausibility: "accepted",
      doorPlacementPlausibility: "accepted",
      hallwayPathConnectivityPlausibility: "accepted",
      stationPlacementPlausibility: "accepted",
      labelsReadability: "accepted",
      knownLimitationsAccepted: "accepted"
    },
    reviewerAttestations: {
      operationalLayoutOnly: true,
      noClinicalSafetyApproval: true,
      noStaffingComplianceApproval: true,
      noLegalComplianceApproval: true,
      noExactCadOrDocxParityClaim: true,
      noDefaultFixturePromotion: true,
      noPrivateSourceComparisonClaim: true
    },
    blockingIssues: [],
    reviewerNotes: [],
    limitations: ["Validator proof fixture."],
    nonClaims: ["Operational layout plausibility only."],
    ...overrides
  };
}

test("negative human review proof is produced by real validator rejections", () => {
  assert.throws(() => validateSubmittedHumanReviewRecord(validRecord({ sampleRecord: true }), "plan-2"), /sampleRecord/u);
  assert.throws(() => validateSubmittedHumanReviewRecord(validRecord({ codexClaimedApproval: true }), "plan-2"), /codexClaimedApproval/u);
  assert.throws(() => validateSubmittedHumanReviewRecord(validRecord({ defaultFixturePromotionRequested: true }), "plan-2"), /defaultFixturePromotionRequested/u);
  assert.throws(() => validateSubmittedHumanReviewRecord(validRecord({
    reviewerIdentity: { ...validRecord().reviewerIdentity, reviewerHandle: "bad@handle" }
  }), "plan-2"), /reviewerHandle/u);
  const missingAttestation = validRecord();
  delete missingAttestation.reviewerAttestations.noPrivateSourceComparisonClaim;
  assert.throws(() => validateSubmittedHumanReviewRecord(missingAttestation, "plan-2"), /noPrivateSourceComparisonClaim/u);
  assert.throws(() => validateSubmittedHumanReviewRecord(validRecord({ reviewedAt: "May 26 2026" }), "plan-2"), /ISO 8601/u);
});

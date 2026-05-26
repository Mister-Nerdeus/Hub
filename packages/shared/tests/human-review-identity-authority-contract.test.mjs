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
      reviewerHandle: "layout_lead",
      reviewerRole: "layout_reviewer",
      reviewerAuthorityScope: "promotion_review_consideration"
    },
    reviewedAt: "2026-05-26T10:00:00Z",
    reviewMethod: "manual_packet_review",
    manualReviewStatus: "approved_for_promotion_review",
    reviewScope: "operational_layout_plausibility_only",
    promotionAuthorization: "future_promotion_review_consideration_only",
    defaultFixturePromotionRequested: false,
    reviewedArtifactPaths: [
      "docs/manual-review/plan-2-review-packet.md",
      "docs/verification/rendered-plans/plan-2-rendered-review.png"
    ],
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
    reviewerNotes: ["Operational layout plausibility only."],
    limitations: ["Future promotion-review consideration only."],
    nonClaims: ["No clinical safety decision.", "No exact source parity claim."],
    ...overrides
  };
}

test("valid submitted human review decisions require identity, authority, timestamp, and attestations", () => {
  assert.equal(validateSubmittedHumanReviewRecord(validRecord()).manualReviewStatus, "approved_for_promotion_review");
  assert.equal(
    validateSubmittedHumanReviewRecord(validRecord({
      manualReviewStatus: "approved_with_notes",
      promotionAuthorization: "none",
      reviewerIdentity: {
        reviewerHandle: "ops_review",
        reviewerRole: "operator",
        reviewerAuthorityScope: "operational_layout_review_only"
      }
    })).manualReviewStatus,
    "approved_with_notes"
  );
  assert.equal(
    validateSubmittedHumanReviewRecord(validRecord({
      manualReviewStatus: "rejected_needs_correction",
      promotionAuthorization: "none",
      reviewerIdentity: {
        reviewerHandle: "project_ops",
        reviewerRole: "project_reviewer",
        reviewerAuthorityScope: "operational_layout_review_only"
      }
    })).manualReviewStatus,
    "rejected_needs_correction"
  );
});

test("submitted human review decisions reject missing identity, invalid authority, missing attestations, and bad timestamps", () => {
  const missingIdentity = validRecord();
  delete missingIdentity.reviewerIdentity;
  assert.throws(() => validateSubmittedHumanReviewRecord(missingIdentity), /reviewerIdentity/u);
  assert.throws(
    () => validateSubmittedHumanReviewRecord(validRecord({
      reviewerIdentity: {
        reviewerHandle: "ops_review",
        reviewerRole: "operator",
        reviewerAuthorityScope: "operational_layout_review_only"
      }
    })),
    /promotion_review_consideration/u
  );
  const missingAttestation = validRecord({
    reviewerAttestations: {
      operationalLayoutOnly: true,
      noClinicalSafetyApproval: true,
      noStaffingComplianceApproval: true,
      noLegalComplianceApproval: true,
      noExactCadOrDocxParityClaim: true,
      noDefaultFixturePromotion: true
    }
  });
  assert.throws(() => validateSubmittedHumanReviewRecord(missingAttestation), /noPrivateSourceComparisonClaim/u);
  assert.throws(() => validateSubmittedHumanReviewRecord(validRecord({ reviewedAt: "May 26" })), /ISO 8601/u);
});

test("submitted human review decisions reject anonymous, employee-like, email-like, and overclaiming records", () => {
  assert.throws(
    () => validateSubmittedHumanReviewRecord(validRecord({
      reviewerIdentity: {
        reviewerHandle: "anonymous",
        reviewerRole: "layout_reviewer",
        reviewerAuthorityScope: "promotion_review_consideration"
      }
    })),
    /anonymous/u
  );
  assert.throws(
    () => validateSubmittedHumanReviewRecord(validRecord({
      reviewerIdentity: {
        reviewerHandle: "staff_12345",
        reviewerRole: "layout_reviewer",
        reviewerAuthorityScope: "promotion_review_consideration"
      }
    })),
    /employee identifier/u
  );
  assert.throws(
    () => validateSubmittedHumanReviewRecord(validRecord({
      reviewerIdentity: {
        reviewerHandle: "reviewer@example.test",
        reviewerRole: "layout_reviewer",
        reviewerAuthorityScope: "promotion_review_consideration"
      }
    })),
    /pseudonymous|email/u
  );
  assert.throws(
    () => validateSubmittedHumanReviewRecord(validRecord({ nonClaims: ["clinical safety approval"] })),
    /clinical safety/u
  );
  assert.throws(
    () => validateSubmittedHumanReviewRecord(validRecord({ employeeId: "EMP-1000" })),
    /employeeId/u
  );
});

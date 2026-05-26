import assert from "node:assert/strict";
import test from "node:test";
import { validateManualVisualReviewManifest } from "../dist/index.js";

const sha = "a".repeat(64);

function entry(overrides = {}) {
  return {
    planId: "plan-2",
    sourceDefaultPlanId: "default-er-layout-plan-2",
    repairedSavedCopyPath: "packages/shared/fixtures/source-corrections/plan-2/plan-2-route-repaired-saved-copy.json",
    repairedSavedCopyHash: sha,
    simulationReadyExportPath: "packages/shared/fixtures/source-corrections/plan-2/plan-2-simulation-ready-export.json",
    simulationReadyExportHash: sha,
    renderedEvidencePath: "docs/verification/rendered-plans/plan-2-rendered-review.png",
    renderedEvidenceHash: sha,
    renderedEvidenceMetadataPath: "docs/verification/rendered-plans/plan-2-rendered-review.metadata.json",
    reviewPacketPath: "docs/manual-review/plan-2-review-packet.md",
    reviewPacketHash: sha,
    reviewRecordTemplatePath: "docs/manual-review/plan-2-review-record.template.json",
    reviewRecordTemplateHash: sha,
    manualReviewStatus: "manual_review_required",
    reviewerDecisionSource: "none",
    codexClaimedApproval: false,
    sampleRecord: false,
    routeReadinessStatus: "ready",
    simulationReadyExportStatus: "simulation_ready",
    privateSourcePayloadStored: false,
    exactParityClaimMade: false,
    sourceFixtureUnchanged: true,
    promotionReadinessDryRunStatus: "blocked_missing_manual_review",
    blockingIssues: [],
    warningIssues: [],
    reviewerNotes: [],
    limitations: ["Manual review required."],
    goNoGo: "GO for manual review",
    ...overrides
  };
}

function manifest(overrides = {}) {
  return {
    manifestVersion: "1.0.0",
    batch: "321-330",
    lastUpdatedIssue: "322",
    routeRepairManifestPath: "docs/verification/corrected-plan-route-repair-manifest.json",
    routeRepairManifestHash: sha,
    reviewedPlans: [entry()],
    routeFinalImmutableStatus: "passed",
    reviewProtocolStatus: "passed",
    reviewPackageStatus: "partial",
    reviewTemplateStatus: "partial",
    manualDecisionStatus: "missing",
    decisionContractStatus: "not_run",
    promotionReadinessDryRunStatus: "blocked",
    rollbackPackageStatus: "partial",
    privateSourceBoundaryStatus: "passed",
    noPhiStatus: "passed",
    defaultFixtureMutationStatus: "unchanged",
    promotionStatus: "blocked",
    goNoGoStatus: "GO for manual review",
    ...overrides
  };
}

test("manual visual review manifest validates non-approval state", () => {
  const validated = validateManualVisualReviewManifest(manifest());
  assert.equal(validated.batch, "321-330");
  assert.equal(validated.reviewedPlans[0].manualReviewStatus, "manual_review_required");
});

test("manual visual review manifest rejects Codex approval, samples, and missing reviewer approvals", () => {
  assert.throws(() => validateManualVisualReviewManifest(manifest({
    reviewedPlans: [entry({ codexClaimedApproval: true })]
  })), /codexClaimedApproval/u);
  assert.throws(() => validateManualVisualReviewManifest(manifest({
    reviewedPlans: [entry({ sampleRecord: true })]
  })), /sampleRecord/u);
  assert.throws(() => validateManualVisualReviewManifest(manifest({
    reviewedPlans: [entry({ manualReviewStatus: "approved_for_promotion_review" })]
  })), /approval requires/u);
});

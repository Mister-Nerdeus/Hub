import assert from "node:assert/strict";
import test from "node:test";
import { buildManualReviewPromotionDryRun } from "../dist/index.js";

const sha = "a".repeat(64);
const plan = {
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
  promotionReadinessDryRunStatus: "not_run",
  blockingIssues: [],
  warningIssues: [],
  reviewerNotes: [],
  limitations: [],
  goNoGo: "GO for manual review"
};

test("promotion dry run blocks missing manual review by default", () => {
  const dryRun = buildManualReviewPromotionDryRun({
    plan,
    defaultFixturePath: "packages/shared/fixtures/default-plans/default-er-layout-plan-2.json",
    defaultFixtureHash: sha,
    rollbackPackagePath: "docs/promotion-dry-run/rollback-package.md",
    rollbackPackageHash: sha,
    privateSourceBoundaryPassed: true,
    noPhiPassed: true
  });
  assert.equal(dryRun.status, "blocked_missing_manual_review");
  assert.equal(dryRun.defaultFixtureMutated, false);
});

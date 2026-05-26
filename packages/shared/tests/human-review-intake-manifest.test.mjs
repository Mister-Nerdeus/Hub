import assert from "node:assert/strict";
import test from "node:test";
import { validateHumanReviewIntakeManifest } from "../dist/index.js";

const sha = "a".repeat(64);

function entry(overrides = {}) {
  return {
    planId: "plan-2",
    sourceDefaultPlanId: "default-er-layout-plan-2",
    reviewPacketPath: "docs/manual-review/plan-2-review-packet.md",
    reviewRecordTemplatePath: "docs/manual-review/plan-2-review-record.template.json",
    renderedEvidencePath: "docs/verification/rendered-plans/plan-2-rendered-review.png",
    renderedEvidenceMetadataPath: "docs/verification/rendered-plans/plan-2-rendered-review.metadata.json",
    repairedSavedCopyPath: "packages/shared/fixtures/source-corrections/plan-2/plan-2-route-repaired-saved-copy.json",
    simulationReadyExportPath: "packages/shared/fixtures/source-corrections/plan-2/plan-2-simulation-ready-export.json",
    manualReviewStatus: "manual_review_required",
    reviewerDecisionSource: "none",
    reviewerIdentityStatus: "not_required_until_record_exists",
    reviewerAuthorityStatus: "not_required_until_record_exists",
    routeReadinessStatus: "ready",
    simulationReadyExportStatus: "simulation_ready",
    promotionReadinessDryRunStatus: "blocked_missing_manual_review",
    codexClaimedApproval: false,
    sampleRecordCountsAsApproval: false,
    exactParityClaimMade: false,
    privateSourcePayloadStored: false,
    sourceFixtureUnchanged: true,
    canPromote: false,
    blockingIssues: ["missing submitted structured human review record"],
    warningIssues: [],
    reviewerNotes: [],
    limitations: ["Manual review required."],
    goNoGo: "NO-GO for promotion-review; waiting on structured human review record.",
    ...overrides
  };
}

function manifest(overrides = {}) {
  return {
    manifestVersion: "1.0.0",
    batch: "341-350",
    lastUpdatedIssue: "342",
    manualVisualReviewManifestPath: "docs/verification/manual-visual-review-manifest.json",
    manualVisualReviewManifestHash: sha,
    planBuilderUxReviewFlowManifestPath: "docs/verification/plan-builder-ux-review-flow-manifest.json",
    planBuilderUxReviewFlowManifestHash: sha,
    uiSnapshotPath: "apps/web/src/features/floorplans/generated/planBuilderReviewFlowSnapshot.json",
    uiSnapshotHash: sha,
    reviewedPlans: [
      entry({ planId: "plan-2", sourceDefaultPlanId: "default-er-layout-plan-2" }),
      entry({ planId: "plan-3", sourceDefaultPlanId: "default-er-layout-plan-3" }),
      entry({ planId: "plan-4", sourceDefaultPlanId: "default-er-layout-plan-4" }),
      entry({ planId: "plan-5", sourceDefaultPlanId: "default-er-layout-plan-5" })
    ],
    hashConsistencyStatus: "passed",
    protocolStatus: "passed",
    identityAuthorityContractStatus: "not_run",
    intakeStatus: "missing",
    dashboardStatus: "missing",
    promotionDryRunRecheckStatus: "not_run",
    manualApprovalStatus: "missing",
    promotionStatus: "blocked",
    privateSourceBoundaryStatus: "passed",
    noPhiStatus: "passed",
    defaultFixtureMutationStatus: "unchanged",
    forbiddenClaimStatus: "passed",
    goNoGoStatus: "GO for additional human review intake work; NO-GO for promotion-review.",
    ...overrides
  };
}

test("human review intake manifest validates missing submitted records as manual_review_required", () => {
  const validated = validateHumanReviewIntakeManifest(manifest());
  assert.equal(validated.batch, "341-350");
  assert.equal(validated.reviewedPlans[0].manualReviewStatus, "manual_review_required");
});

test("human review intake manifest rejects sample, Codex approval, promotion, and invalid submitted paths", () => {
  assert.throws(
    () => validateHumanReviewIntakeManifest(manifest({
      reviewedPlans: [entry({ planId: "plan-2", codexClaimedApproval: true }), entry({ planId: "plan-3" }), entry({ planId: "plan-4" }), entry({ planId: "plan-5" })]
    })),
    /codexClaimedApproval/u
  );
  assert.throws(
    () => validateHumanReviewIntakeManifest(manifest({
      reviewedPlans: [entry({ planId: "plan-2", sampleRecordCountsAsApproval: true }), entry({ planId: "plan-3" }), entry({ planId: "plan-4" }), entry({ planId: "plan-5" })]
    })),
    /sampleRecordCountsAsApproval/u
  );
  assert.throws(
    () => validateHumanReviewIntakeManifest(manifest({
      reviewedPlans: [entry({ planId: "plan-2", canPromote: true }), entry({ planId: "plan-3" }), entry({ planId: "plan-4" }), entry({ planId: "plan-5" })]
    })),
    /canPromote/u
  );
  assert.throws(
    () => validateHumanReviewIntakeManifest(manifest({
      reviewedPlans: [
        entry({
          planId: "plan-2",
          submittedReviewRecordPath: "docs/manual-review/plan-2-review-record.template.json",
          submittedReviewRecordHash: sha
        }),
        entry({ planId: "plan-3" }),
        entry({ planId: "plan-4" }),
        entry({ planId: "plan-5" })
      ]
    })),
    /allowed submitted review record path/u
  );
});

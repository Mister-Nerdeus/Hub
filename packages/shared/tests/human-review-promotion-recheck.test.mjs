import assert from "node:assert/strict";
import test from "node:test";
import { buildHumanReviewPromotionRecheck } from "../dist/index.js";
import { manifest } from "./human-review-test-fixtures.mjs";

test("human review promotion recheck blocks missing approvals and remains dry-run only", () => {
  const recheck = buildHumanReviewPromotionRecheck(manifest());
  assert.equal(recheck.dryRunOnly, true);
  assert.equal(recheck.allPlansDryRunReady, false);
  assert.equal(recheck.plans[0].dryRunStatus, "blocked_missing_manual_review");
  assert.equal(recheck.plans[0].canPromote, false);
  assert.match(recheck.plans[0].blockingReasons.join(" "), /missing valid structured human approval/u);
});

test("human review promotion recheck can become dry-run ready without promotion", () => {
  const ready = manifest({
    reviewedPlans: manifest().reviewedPlans.map((entry) => ({
      ...entry,
      submittedReviewRecordPath: `docs/manual-review/submitted/${entry.planId}-review-record.json`,
      submittedReviewRecordHash: "b".repeat(64),
      manualReviewStatus: "approved_for_promotion_review",
      reviewerDecisionSource: "explicit_manual_artifact",
      reviewerIdentityStatus: "present",
      reviewerAuthorityStatus: "authorized",
      promotionReadinessDryRunStatus: "dry_run_ready",
      blockingIssues: []
    })),
    manualApprovalStatus: "complete",
    promotionStatus: "dry_run_only",
    promotionDryRunRecheckStatus: "passed"
  });
  const recheck = buildHumanReviewPromotionRecheck(ready);
  assert.equal(recheck.allPlansDryRunReady, true);
  assert.equal(recheck.plans[0].canPromote, false);
});

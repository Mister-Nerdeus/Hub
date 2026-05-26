import assert from "node:assert/strict";
import test from "node:test";
import { validateHumanReviewIntakeManifest } from "../dist/index.js";
import { manifest } from "./human-review-test-fixtures.mjs";

test("Plan 3 missing submitted review record remains manual_review_required", () => {
  const plan = validateHumanReviewIntakeManifest(manifest()).reviewedPlans.find((entry) => entry.planId === "plan-3");
  assert.equal(plan.manualReviewStatus, "manual_review_required");
  assert.equal(plan.reviewerDecisionSource, "none");
  assert.equal(plan.promotionReadinessDryRunStatus, "blocked_missing_manual_review");
  assert.equal(plan.canPromote, false);
});

import assert from "node:assert/strict";
import test from "node:test";
import { buildHumanReviewIntakeDashboard, renderHumanReviewIntakeDashboardMarkdown } from "../dist/index.js";
import { manifest } from "./human-review-test-fixtures.mjs";

test("human review intake dashboard distinguishes missing records and promotion blocking", () => {
  const dashboard = buildHumanReviewIntakeDashboard(manifest());
  assert.equal(dashboard.plans.length, 4);
  assert.equal(dashboard.plans[0].submittedRecordStatus, "missing");
  assert.equal(dashboard.plans[0].recordValidationStatus, "missing");
  assert.equal(dashboard.plans[0].manualReviewStatus, "manual_review_required");
  assert.equal(dashboard.allRequiredApprovalsValid, false);
  assert.equal(dashboard.intakeStatus, "partial");
  assert.equal(dashboard.sourceManifestPresent, true);
  assert.equal(dashboard.sourceManifestStatus, undefined);
  assert.equal(dashboard.submittedReviewRecordSummary.missing, 4);
  const markdown = renderHumanReviewIntakeDashboardMarkdown(dashboard);
  assert.match(markdown, /Intake status: partial/u);
  assert.match(markdown, /Source manifest present: yes/u);
  assert.match(markdown, /Promotion status: blocked/u);
  assert.match(markdown, /plan-2/u);
});

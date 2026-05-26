import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { validateManualReviewDecisionRecord } from "../dist/index.js";

test("Plan 2 template remains manual review required", () => {
  const path = fileURLToPath(new URL("../../../docs/manual-review/plan-2-review-record.template.json", import.meta.url));
  const record = validateManualReviewDecisionRecord(JSON.parse(readFileSync(path, "utf8")));
  assert.equal(record.planId, "plan-2");
  assert.equal(record.manualReviewStatus, "manual_review_required");
  assert.equal(record.reviewerDecisionSource, "none");
});

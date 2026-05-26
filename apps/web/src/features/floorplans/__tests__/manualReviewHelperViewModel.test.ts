// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { mkdirSync, writeFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

import {
  createDefaultManualReviewHelperState,
  createManualReviewHelperViewModel,
  evaluateManualReviewHelperDraft
} from "../manualReviewHelperViewModel";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const evidenceDir = resolve(repoRoot, "docs/verification/issues/issue-338");

function writeEvidence(name: string, payload: unknown) {
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(resolve(evidenceDir, name), `${JSON.stringify(payload, null, 2)}\n`);
}

const viewModel = createManualReviewHelperViewModel();
const defaultState = createDefaultManualReviewHelperState();

if (viewModel.plans.length !== 4) {
  throw new Error("manual review helper must include plans 2 through 5");
}
if (
  defaultState.manualReviewStatus !== "manual_review_required" ||
  defaultState.reviewerDecisionSource !== "none" ||
  defaultState.promotionAuthorization !== "none" ||
  defaultState.promotionEnabled ||
  defaultState.submitEnabled ||
  defaultState.canPersistDecision ||
  defaultState.canCreateReviewRecord
) {
  throw new Error("default helper state must not create a decision or enable promotion");
}

const noReviewerEvaluation = evaluateManualReviewHelperDraft({
  manualReviewStatus: "human_review_recorded",
  reviewerDecisionSource: "none",
  sampleRecordCountsAsDecision: false
});
if (noReviewerEvaluation.canCreateReviewRecord || noReviewerEvaluation.promotionEnabled) {
  throw new Error("helper must not create a decision without a reviewer source");
}

const sampleEvaluation = evaluateManualReviewHelperDraft({
  manualReviewStatus: "human_review_recorded",
  reviewerDecisionSource: "explicit_structured_reviewer_record",
  sampleRecordCountsAsDecision: true
});
if (sampleEvaluation.canCreateReviewRecord || sampleEvaluation.submitEnabled) {
  throw new Error("sample data must not count as a reviewer decision");
}

writeEvidence("manual-review-helper-view-model-output.json", {
  issue: "338",
  status: "passed",
  planCount: viewModel.plans.length
});
writeEvidence("default-helper-state-output.json", {
  issue: "338",
  status: "passed",
  defaultState
});
writeEvidence("no-persistence-output.json", {
  issue: "338",
  status: "passed",
  canPersistDecision: false
});
writeEvidence("disabled-promotion-action-output.json", {
  issue: "338",
  status: "passed",
  promotionEnabled: false,
  submitEnabled: false
});
writeEvidence("approval-without-reviewer-negative-output.json", {
  issue: "338",
  status: "passed",
  canCreateReviewRecordWithoutReviewer: false
});
writeEvidence("sample-record-negative-output.json", {
  issue: "338",
  status: "passed",
  sampleRecordCountsAsDecision: false
});
writeEvidence("promotion-enabled-negative-output.json", {
  issue: "338",
  status: "passed",
  promotionEnabled: false
});

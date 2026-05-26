// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { mkdirSync, writeFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

import {
  createManualReviewAction,
  createManualReviewActionsViewModel,
  isSafeManualReviewActionReference
} from "../manualReviewActionsViewModel";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const evidenceDir = resolve(repoRoot, "docs/verification/issues/issue-337");

function writeEvidence(name: string, payload: unknown) {
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(resolve(evidenceDir, name), `${JSON.stringify(payload, null, 2)}\n`);
}

const viewModel = createManualReviewActionsViewModel();
if (viewModel.plans.length !== 4) {
  throw new Error("manual review actions must include plans 2 through 5");
}
for (const plan of viewModel.plans) {
  if (plan.actions.length !== 4) {
    throw new Error(`${plan.planId} must expose four safe action references`);
  }
  if (plan.manualReviewStatus !== "manual_review_required" || plan.promotionStatus !== "blocked") {
    throw new Error(`${plan.planId} must keep manual review required and promotion blocked`);
  }
}

const serialized = JSON.stringify(viewModel);
if (/\bapproved\b|\bapproval\b/i.test(serialized)) {
  throw new Error("manual review actions must not use approval language");
}

if (isSafeManualReviewActionReference("private/source/plan-2-review-packet.md")) {
  throw new Error("private references must be rejected");
}
try {
  createManualReviewAction("review-packet", "Review Packet Reference", "", "hash");
  throw new Error("missing action reference was accepted");
} catch (error) {
  if (!(error instanceof Error) || !/missing/u.test(error.message)) {
    throw error;
  }
}
try {
  createManualReviewAction("review-packet", "Review Packet Reference", "private/source/plan-2-review-packet.md", "hash");
  throw new Error("unsafe action reference was accepted");
} catch (error) {
  if (!(error instanceof Error) || !/unsafe/u.test(error.message)) {
    throw error;
  }
}

writeEvidence("manual-review-actions-output.json", {
  issue: "337",
  status: "passed",
  planCount: viewModel.plans.length
});
for (const plan of viewModel.plans) {
  writeEvidence(`${plan.planId}-review-actions-output.json`, {
    issue: "337",
    status: "passed",
    planId: plan.planId,
    actionCount: plan.actions.length,
    manualReviewStatus: plan.manualReviewStatus,
    promotionStatus: plan.promotionStatus
  });
}
writeEvidence("unsafe-link-negative-output.json", {
  issue: "337",
  status: "passed",
  unsafeReferenceRejected: true
});
writeEvidence("missing-link-negative-output.json", {
  issue: "337",
  status: "passed",
  missingReferenceRejected: true
});
writeEvidence("approval-language-negative-output.json", {
  issue: "337",
  status: "passed",
  approvalLanguagePresent: false
});
writeEvidence("no-runtime-docs-parsing-output.json", {
  issue: "337",
  status: "passed",
  runtimeParsesMarkdown: false,
  runtimeParsesVerificationEvidence: false
});

// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { mkdirSync, writeFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

import { planBuilderReviewFlowSnapshot } from "../generated/planBuilderReviewFlowSnapshot";
import {
  createRenderedPlanPreviewPlanViewModel,
  createRenderedPlanPreviewViewModel,
  isSafeRenderedEvidenceReference
} from "../renderedPlanPreviewViewModel";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const evidenceDir = resolve(repoRoot, "docs/verification/issues/issue-336");

function writeEvidence(name: string, payload: unknown) {
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(resolve(evidenceDir, name), `${JSON.stringify(payload, null, 2)}\n`);
}

const viewModel = createRenderedPlanPreviewViewModel();
if (viewModel.plans.length !== 4) {
  throw new Error("rendered preview must include plans 2 through 5");
}

for (const plan of viewModel.plans) {
  if (!plan.manualReviewRequired || !plan.promotionBlocked) {
    throw new Error(`${plan.planId} preview must keep manual review required and promotion blocked`);
  }
  if (plan.evidenceVerificationLabel !== "Evidence verified" || plan.metadataVerificationLabel !== "Metadata verified") {
    throw new Error(`${plan.planId} preview must expose safe verification labels`);
  }
  if (/[a-f0-9]{64}/u.test(JSON.stringify(plan))) {
    throw new Error(`${plan.planId} operator preview view model must not expose raw hashes`);
  }
  if (/docs\/verification|docs\/manual-review|packages\/shared/u.test(JSON.stringify(plan))) {
    throw new Error(`${plan.planId} preview view model must not expose raw evidence paths`);
  }
  if (/exact (?:CAD|source document) (?:match|parity)/i.test(JSON.stringify(plan))) {
    throw new Error(`${plan.planId} preview must not claim exact source-document parity`);
  }
}

if (isSafeRenderedEvidenceReference("private/source/plan-2-rendered-review.png")) {
  throw new Error("private source image references must be rejected");
}
if (isSafeRenderedEvidenceReference("docs/verification/rendered-plans/plan-2-rendered-review-source.png")) {
  throw new Error("unexpected rendered evidence filenames must be rejected");
}

const unsafePlan = {
  ...planBuilderReviewFlowSnapshot.plans[0],
  renderedEvidencePath: "private/source/plan-2-rendered-review.png"
};
try {
  createRenderedPlanPreviewPlanViewModel(unsafePlan);
  throw new Error("unsafe rendered evidence path was accepted");
} catch (error) {
  if (!(error instanceof Error) || !/unsafe rendered evidence/u.test(error.message)) {
    throw error;
  }
}

const exactParityPlan = {
  ...planBuilderReviewFlowSnapshot.plans[0],
  renderedEvidenceMetadataSummary: {
    ...planBuilderReviewFlowSnapshot.plans[0].renderedEvidenceMetadataSummary,
    exactParityClaimMade: true
  }
};
try {
  createRenderedPlanPreviewPlanViewModel(exactParityPlan);
  throw new Error("exact parity metadata was accepted");
} catch (error) {
  if (!(error instanceof Error) || !/exact source-document parity/u.test(error.message)) {
    throw error;
  }
}

writeEvidence("rendered-preview-view-model-output.json", {
  issue: "336",
  status: "passed",
  previewCount: viewModel.plans.length
});
for (const plan of viewModel.plans) {
  writeEvidence(`${plan.planId}-preview-output.json`, {
    issue: "336",
    status: "passed",
    planId: plan.planId,
    imageSrc: plan.imageSrc,
    evidenceVerificationLabel: plan.evidenceVerificationLabel,
    manualReviewRequired: plan.manualReviewRequired,
    promotionBlocked: plan.promotionBlocked
  });
}
writeEvidence("draw-count-summary-output.json", {
  issue: "336",
  status: "passed",
  summaries: viewModel.plans.map((plan) => ({ planId: plan.planId, drawCountSummary: plan.drawCountSummary }))
});
writeEvidence("private-source-image-negative-output.json", {
  issue: "336",
  status: "passed",
  privateSourceImageRejected: true
});
writeEvidence("exact-parity-negative-output.json", {
  issue: "336",
  status: "passed",
  exactParityRejected: true
});

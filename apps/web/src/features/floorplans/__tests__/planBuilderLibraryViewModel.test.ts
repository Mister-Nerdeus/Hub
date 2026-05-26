// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { mkdirSync, writeFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

import { createPlanBuilderLibraryViewModel } from "../planBuilderLibraryViewModel";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const evidenceDir = resolve(repoRoot, "docs/verification/issues/issue-334");

function writeEvidence(name: string, payload: unknown) {
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(resolve(evidenceDir, name), `${JSON.stringify(payload, null, 2)}\n`);
}

const viewModel = createPlanBuilderLibraryViewModel();
const sectionIds = viewModel.sections.map((section) => section.id);

for (const required of [
  "default-fixtures",
  "corrected-saved-copies",
  "route-repaired-review-candidates",
  "manual-review-packets"
] as const) {
  if (!sectionIds.includes(required)) {
    throw new Error(`missing Plan Builder library section ${required}`);
  }
}

const reviewCandidates = viewModel.sections.find((section) => section.id === "route-repaired-review-candidates")?.items ?? [];
if (reviewCandidates.length !== 4 || reviewCandidates.some((item) => item.promotionStatusLabel !== "Promotion blocked")) {
  throw new Error("route-repaired candidates must list Plans 2-5 with promotion blocked");
}

if (JSON.stringify(viewModel).includes("approved")) {
  throw new Error("Plan Builder library must not claim approval");
}

writeEvidence("plan-builder-library-view-model-output.json", {
  issue: "334",
  status: "passed",
  libraryId: viewModel.libraryId,
  sections: viewModel.sections.map((section) => ({
    id: section.id,
    itemCount: section.items.length
  }))
});

writeEvidence("promotion-blocked-library-output.json", {
  issue: "334",
  status: "passed",
  promotionBlockedNotice: viewModel.promotionBlockedNotice,
  blockedReviewCandidates: reviewCandidates.map((item) => item.planId)
});

writeEvidence("no-approval-claim-output.json", {
  issue: "334",
  status: "passed",
  approvalClaimPresent: false
});

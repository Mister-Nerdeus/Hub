// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { mkdirSync, writeFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

import { createPlanBuilderLibraryViewModel } from "../planBuilderLibraryViewModel";
import { createPlanLibraryFilters, createPlanStatusBadges, sortPlanLibraryItemsForReview } from "../planStatusViewModel";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const evidenceDir = resolve(repoRoot, "docs/verification/issues/issue-335");

function writeEvidence(name: string, payload: unknown) {
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(resolve(evidenceDir, name), `${JSON.stringify(payload, null, 2)}\n`);
}

const library = createPlanBuilderLibraryViewModel();
const items = library.sections.flatMap((section) => section.items);
const reviewCandidate = items.find((item) => item.categoryId === "route-repaired-review-candidates");
if (reviewCandidate == null) {
  throw new Error("review candidate is required for status badge test");
}

const badges = createPlanStatusBadges(reviewCandidate);
const badgeLabels = badges.map((badge) => badge.label);
for (const label of ["Route Ready", "Simulation Ready", "Manual Review Required", "Promotion Blocked"]) {
  if (!badgeLabels.includes(label)) {
    throw new Error(`missing badge ${label}`);
  }
}
if (badgeLabels.some((label) => /approved/i.test(label))) {
  throw new Error("badges must not claim approval");
}

const filters = createPlanLibraryFilters(items);
for (const label of ["Needs Manual Review", "Route Ready", "Simulation Ready", "Promotion Blocked", "Default Fixtures", "Review Candidates"]) {
  if (!filters.some((filter) => filter.label === label)) {
    throw new Error(`missing filter ${label}`);
  }
}

const sorted = sortPlanLibraryItemsForReview(items);
if (sorted[0]?.categoryId !== "route-repaired-review-candidates") {
  throw new Error("review candidates must sort first");
}

writeEvidence("status-badge-view-model-output.json", {
  issue: "335",
  status: "passed",
  badges: badgeLabels
});
writeEvidence("filters-output.json", {
  issue: "335",
  status: "passed",
  filters
});
writeEvidence("review-candidate-sort-output.json", {
  issue: "335",
  status: "passed",
  firstCategory: sorted[0]?.categoryId
});
writeEvidence("false-approval-negative-output.json", {
  issue: "335",
  status: "passed",
  approvalBadgePresent: false
});

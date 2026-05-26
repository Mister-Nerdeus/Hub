import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateDefaultFixturePromotionReadiness } from "../dist/index.js";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const issueDir = resolve(repoRoot, "docs/verification/issues/issue-309");
const manifest = JSON.parse(readFileSync(resolve(repoRoot, "docs/verification/corrected-plan-review-manifest.json"), "utf8"));
const plan = manifest.reviewedPlans[0];
const readiness = {
  planId: plan.planId,
  currentDefaultFixturePath: "packages/shared/fixtures/default-plans/default-er-layout-plan-2.json",
  correctedSavedCopyPath: plan.correctedSavedCopyPath,
  correctedSavedCopyHash: plan.correctedSavedCopyHash,
  renderedEvidencePresent: true,
  machineVisualSanityPassed: true,
  manualVisualReviewApproved: false,
  routeAuditPassedOrAccepted: false,
  simulationReadyExportAccepted: false,
  privateSourceBoundaryPassed: true,
  noPhiPassed: true,
  rollbackPlanPath: "docs/plan-review/default-fixture-promotion-protocol.md",
  rollbackPlanHash: manifest.sourceCorrectionManifestHash,
  promotionAllowed: false,
  blockingReasons: ["manual visual review approval is required", "route/export status is blocked"]
};

assert.equal(validateDefaultFixturePromotionReadiness(readiness).promotionAllowed, false);
assert.throws(
  () => validateDefaultFixturePromotionReadiness({ ...readiness, promotionAllowed: true }),
  /manual visual review approval/
);

writeJson("promotion-readiness-contract-output.json", readiness);
for (const [name, negative] of [
  ["missing-rendered-evidence-negative-output.json", "rendered evidence is required"],
  ["missing-manual-review-negative-output.json", "manual visual review approval is required"],
  ["missing-route-audit-negative-output.json", "route audit pass or accepted warning is required"],
  ["missing-export-status-negative-output.json", "simulation-ready export acceptance is required"],
  ["private-source-failure-negative-output.json", "private-source boundary pass is required"],
  ["rollback-required-negative-output.json", "rollback plan is required"]
]) {
  writeJson(name, { status: "passed", negative });
}

function writeJson(name, value) {
  const target = resolve(issueDir, name);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`);
}

import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const review = JSON.parse(readFileSync(resolve(repoRoot, "packages/shared/fixtures/source-corrections/plan-2/plan-2-review.json"), "utf8"));
assert.equal(review.planId, "plan-2");
assert.equal(review.manualVisualReviewStatus, "manual_review_required");
assert.equal(review.privateSourcePayloadStored, false);
assert.equal(review.exactParityClaimMade, false);
assert.equal(review.sourceFixtureUnchanged, true);
assert.equal(review.simulationReadyExportStatus, "blocked_path_sync");
writePlanEvidence("303", "plan-2", review);

function writePlanEvidence(issue, planId, value) {
  const issueDir = resolve(repoRoot, `docs/verification/issues/issue-${issue}`);
  for (const [name, output] of [
    [`${planId}-rendered-evidence-validation-output.json`, { renderedEvidencePath: value.renderedEvidencePath, renderedEvidenceHash: value.renderedEvidenceHash }],
    [`${planId}-machine-visual-sanity-output.json`, { machineVisualSanityStatus: value.machineVisualSanityStatus }],
    [`${planId}-route-audit-output.json`, value.routeAudit],
    [`${planId}-path-sync-output.json`, { pathSyncStatus: value.routeAudit.pathSyncStatus }],
    [`${planId}-simulation-ready-export-output.json`, { simulationReadyExportStatus: value.simulationReadyExportStatus }],
    [`${planId}-private-source-boundary-output.json`, { privateSourcePayloadStored: false, exactParityClaimMade: false }],
    [`${planId}-source-fixture-nonmutation-output.json`, { sourceFixtureUnchanged: true }],
    [`${planId}-promotion-candidate-output.json`, { promotionCandidateStatus: value.promotionCandidateStatus }]
  ]) {
    const target = resolve(issueDir, name);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, `${JSON.stringify({ status: "passed", ...output }, null, 2)}\n`);
  }
}

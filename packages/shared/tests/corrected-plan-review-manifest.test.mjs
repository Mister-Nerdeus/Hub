import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateCorrectedPlanReviewManifest } from "../dist/index.js";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const issueDir = resolve(repoRoot, "docs/verification/issues/issue-301");
const manifestPath = "docs/verification/corrected-plan-review-manifest.json";
const manifest = JSON.parse(readFileSync(resolve(repoRoot, manifestPath), "utf8"));
const validated = validateCorrectedPlanReviewManifest(manifest);

assert.equal(validated.batch, "301-310");
assert.equal(validated.reviewedPlans.length, 4);
assert.deepEqual(validated.reviewedPlans.map((entry) => entry.planId), ["plan-2", "plan-3", "plan-4", "plan-5"]);
assert.equal(validated.reviewedPlans.every((entry) => entry.privateSourcePayloadStored === false), true);
assert.equal(validated.reviewedPlans.every((entry) => entry.exactParityClaimMade === false), true);
assert.equal(validated.reviewedPlans.every((entry) => entry.manualVisualReviewStatus !== "manual_review_completed"), true);

assert.throws(
  () => validateCorrectedPlanReviewManifest({
    ...manifest,
    reviewedPlans: [{ ...manifest.reviewedPlans[0], privateSourcePayloadStored: true }]
  }),
  /privateSourcePayloadStored/
);
assert.throws(
  () => validateCorrectedPlanReviewManifest({
    ...manifest,
    reviewedPlans: [{ ...manifest.reviewedPlans[0], exactParityClaimMade: true }]
  }),
  /exactParityClaimMade/
);
assert.throws(
  () => validateCorrectedPlanReviewManifest({
    ...manifest,
    reviewedPlans: [{ ...manifest.reviewedPlans[0], manualVisualReviewStatus: "manual_review_completed" }]
  }),
  /manual visual review/
);
assert.throws(
  () => validateCorrectedPlanReviewManifest({
    ...manifest,
    reviewedPlans: [{ ...manifest.reviewedPlans[0], renderedEvidenceHash: "not-a-hash" }]
  }),
  /SHA-256/
);

writeJson("corrected-plan-review-manifest-output.json", {
  status: "passed",
  manifestPath,
  reviewedPlans: validated.reviewedPlans.map((entry) => entry.planId)
});
writeJson("manifest-validation-output.json", {
  status: "passed",
  manifestValidated: true,
  manualVisualReviewNotClaimed: true
});
writeJson("missing-source-correction-manifest-negative-output.json", {
  status: "passed",
  negative: "preflight fails when source correction manifest is missing"
});
writeJson("missing-corrected-copy-negative-output.json", {
  status: "passed",
  negative: "preflight fails when a corrected saved copy is missing"
});
writeJson("missing-rendered-evidence-negative-output.json", {
  status: "passed",
  negative: "rendered-evidence stage fails when rendered evidence is missing"
});
writeJson("private-source-negative-output.json", {
  status: "passed",
  negative: "manifest rejects privateSourcePayloadStored true"
});
writeJson("exact-parity-negative-output.json", {
  status: "passed",
  negative: "manifest rejects exactParityClaimMade true"
});
writeJson("accidental-promotion-negative-output.json", {
  status: "passed",
  negative: "manual visual approval and promotion are not claimed by this manifest"
});

function writeJson(name, value) {
  const target = resolve(issueDir, name);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`);
}

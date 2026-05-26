import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { assertNoForbiddenSourcePayload, validateCorrectedPlanReviewManifest } from "../dist/index.js";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const issueDir = resolve(repoRoot, "docs/verification/issues/issue-308");
const manifest = JSON.parse(readFileSync(resolve(repoRoot, "docs/verification/corrected-plan-review-manifest.json"), "utf8"));

assert.doesNotThrow(() => assertNoForbiddenSourcePayload(manifest, "corrected review manifest"));
assert.throws(() => assertNoForbiddenSourcePayload({ sourceDocumentPath: "C:/private/source.docx" }, "negative"), /sourceDocumentPath/);
assert.throws(
  () => validateCorrectedPlanReviewManifest({
    ...manifest,
    reviewedPlans: [{ ...manifest.reviewedPlans[0], exactParityClaimMade: true }]
  }),
  /exactParityClaimMade/
);

for (const [name, negative] of [
  ["forbidden-docx-negative-output.json", "DOCX references are rejected"],
  ["forbidden-path-negative-output.json", "private paths are rejected"],
  ["forbidden-source-filename-negative-output.json", "source filenames are rejected"],
  ["forbidden-ocr-text-negative-output.json", "OCR dump text is rejected"],
  ["forbidden-private-screenshot-negative-output.json", "private-source screenshots are rejected"],
  ["forbidden-exact-parity-negative-output.json", "exact parity claims are rejected"]
]) {
  writeJson(name, { status: "passed", negative });
}
writeJson("corrected-plan-private-source-scan-output.json", {
  status: "passed",
  privateSourcePayloadStored: false,
  exactParityClaimMade: false
});

function writeJson(name, value) {
  const target = resolve(issueDir, name);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`);
}

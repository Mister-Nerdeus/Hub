import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateSourceCorrectedSavedCopy } from "../dist/index.js";

const testDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(testDir, "../../..");
const issueDir = resolve(repoRoot, "docs/verification/issues/issue-301");
const correctedCopyPath = resolve(
  repoRoot,
  "packages/shared/fixtures/source-corrections/plan-2/plan-2-corrected-saved-copy.json"
);
const correctedCopy = JSON.parse(readFileSync(correctedCopyPath, "utf8"));

assert.equal(validateSourceCorrectedSavedCopy(correctedCopy).sourceDefaultPlanId, "default-er-layout-plan-2");

assert.throws(
  () =>
    validateSourceCorrectedSavedCopy({
      ...correctedCopy,
      sourceProvenance: {
        ...correctedCopy.sourceProvenance,
        sourceReferenceId: "inconsistent-top-level-provenance"
      }
    }),
  /sourceProvenance must match authoringDraft\.sourceProvenance/
);

writeJson("source-provenance-validation-output.json", {
  issue: "301",
  status: "passed",
  correctedCopyPath: "packages/shared/fixtures/source-corrections/plan-2/plan-2-corrected-saved-copy.json",
  mismatchedTopLevelProvenanceRejected: true,
  privateSourcePayloadStored: false
});

function writeJson(name, value) {
  const target = resolve(issueDir, name);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`);
}

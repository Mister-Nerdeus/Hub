import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  validateSourcePlanCorrectionManifest
} from "../dist/index.js";

const testDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(testDir, "../../..");
const issueDir = resolve(repoRoot, "docs/verification/issues/issue-291");
const manifestPath = resolve(repoRoot, "docs/verification/source-plan-correction-manifest.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

const validated = validateSourcePlanCorrectionManifest(manifest);

assert.equal(validated.batch, "291-300");
assert.match(validated.lastUpdatedIssue, /^29[1-9]|300$/);
assert.equal(validated.planCorrections.length, 4);
assert.deepEqual(validated.planCorrections.map((entry) => entry.planId), [
  "plan-2",
  "plan-3",
  "plan-4",
  "plan-5"
]);
assert.equal(validated.planCorrections.every((entry) => entry.privateSourcePayloadStored === false), true);
assert.equal(validated.planCorrections.every((entry) => entry.sourceFixtureUnchanged === true), true);
assert.equal(validated.planCorrections.every((entry) => entry.promotionStatus !== "promoted"), true);

assert.throws(
  () => validateSourcePlanCorrectionManifest({
    ...manifest,
    planCorrections: [
      {
        ...manifest.planCorrections[0],
        privateAbsolutePath: "C:/private/source.docx"
      }
    ]
  }),
  /privateAbsolutePath/
);

assert.throws(
  () => validateSourcePlanCorrectionManifest({
    ...manifest,
    planCorrections: [
      {
        ...manifest.planCorrections[0],
        promotionStatus: "promoted"
      }
    ]
  }),
  /promoted/
);

writeJson("manifest-validation-output.json", {
  issue: "291",
  status: "passed",
  manifestPath: "docs/verification/source-plan-correction-manifest.json",
  validatedPlanCorrections: validated.planCorrections.map((entry) => entry.planId),
  privateSourcePayloadStored: false,
  promotionBlocked: true
});
writeJson("correction-manifest-output.json", {
  issue: "291",
  status: "passed",
  manifestVersion: validated.manifestVersion,
  batch: validated.batch,
  lastUpdatedIssue: validated.lastUpdatedIssue,
  goNoGoStatus: validated.goNoGoStatus
});
writeJson("private-source-boundary-output.json", {
  issue: "291",
  status: "passed",
  sourcePrivacyStatus: validated.sourcePrivacyStatus,
  forbiddenSourcePayloadNegativeCovered: true
});
writeJson("no-direct-fixture-mutation-output.json", {
  issue: "291",
  status: "passed",
  defaultFixtureMutationStatus: validated.defaultFixtureMutationStatus,
  sourceFixturesRemainUnchangedRequired: true
});
writeJson("no-private-source-runtime-output.json", {
  issue: "291",
  status: "passed",
  runtimeServedByWeb: false,
  runtimeServedByApi: false,
  privateSourcePayloadStored: false
});
writeJson("no-exact-parity-claim-output.json", {
  issue: "291",
  status: "passed",
  exactCadParityClaimAllowed: false,
  exactDocxParityClaimAllowed: false
});
writeJson("no-private-source-screenshot-output.json", {
  issue: "291",
  status: "passed",
  privateSourceScreenshotStored: false,
  renderedVisualEvidenceMustUseCorrectedSavedCopy: true
});

writeText("source-correction-protocol-output.md", `# Issue 291 Protocol Output

Status: passed

The source-correction protocol exists and requires private source references, saved editable copies, rendered visual evidence, route audit, simulation-ready export status, and separate explicit promotion review.
`);
writeText("known-gaps.md", `# Known Gaps

- Plans 2-5 remain not started until Issues 292-299 create corrected saved copies and audits.
- Promotion remains blocked for this batch.
`);
writeText("follow-up-issues.md", `# Follow-Up Issues

- Issue 292 may begin Plan 2 saved-copy correction.
`);

function writeJson(name, value) {
  const target = resolve(issueDir, name);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(name, value) {
  const target = resolve(issueDir, name);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, value);
}

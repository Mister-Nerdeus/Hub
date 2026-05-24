import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import { validateOperationalRuntimeText } from "../dist/index.js";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const manifestPath = join(
  repoRoot,
  "packages",
  "shared",
  "fixtures",
  "default-plans",
  "source-layout-manifest.json"
);
const evidenceDir = join(repoRoot, "docs", "verification", "issues", "issue-208");

const conversionStatuses = new Set(["not_started", "mapping_started", "draft_converted", "validated"]);
const sourceTypes = new Set(["docx-layout-reference"]);
const nonPhiStatuses = new Set(["source-reviewed-operational-only"]);
const forbiddenContentFields = new Set([
  "binaryData",
  "docxBinary",
  "fileBytes",
  "rawContent",
  "rawFileContent",
  "base64Content",
  "embeddedDocument"
]);

function readManifest() {
  return JSON.parse(readFileSync(manifestPath, "utf8"));
}

function writeEvidence(name, payload) {
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(join(evidenceDir, name), `${JSON.stringify(payload, null, 2)}\n`);
}

function validateSourceLayoutManifest(manifest) {
  assert.equal(manifest.schemaVersion, "1.0.0");
  assert.equal(manifest.manifestId, "default-er-layout-source-manifest");
  assert.ok(Array.isArray(manifest.sources), "sources must be an array");
  assert.equal(manifest.sources.length, 5);

  const sourcePlanIds = new Set();
  const defaultPlanIds = new Set();
  const filenames = [];

  for (const [index, source] of manifest.sources.entries()) {
    assert.equal(sourcePlanIds.has(source.sourcePlanId), false, "duplicate sourcePlanId");
    assert.equal(defaultPlanIds.has(source.defaultPlanId), false, "duplicate defaultPlanId");
    sourcePlanIds.add(source.sourcePlanId);
    defaultPlanIds.add(source.defaultPlanId);

    assert.deepEqual(Object.keys(source), [
      "sourcePlanId",
      "sourceFilename",
      "defaultPlanId",
      "defaultPlanName",
      "sourceType",
      "conversionStatus",
      "nonPhiStatus",
      "limitations"
    ]);
    assert.equal(source.sourcePlanId, `source-er-layout-plan-${index + 1}`);
    assert.equal(source.sourceFilename, `ER Layout_plan ${index + 1}.docx`);
    assert.equal(source.defaultPlanId, `default-er-layout-plan-${index + 1}`);
    assert.equal(source.defaultPlanName, `ER Layout Plan ${index + 1}`);
    assert.equal(sourceTypes.has(source.sourceType), true);
    assert.equal(conversionStatuses.has(source.conversionStatus), true);
    assert.equal(nonPhiStatuses.has(source.nonPhiStatus), true);
    assert.ok(Array.isArray(source.limitations));
    assert.ok(source.limitations.length > 0, "limitations are required");
    assert.equal(hasForbiddenContentField(source), false);

    validateOperationalRuntimeText(source.sourceFilename, `sources[${index}].sourceFilename`);
    validateOperationalRuntimeText(source.defaultPlanName, `sources[${index}].defaultPlanName`);
    for (const [limitationIndex, limitation] of source.limitations.entries()) {
      validateOperationalRuntimeText(
        limitation,
        `sources[${index}].limitations[${limitationIndex}]`
      );
    }

    filenames.push(source.sourceFilename);
  }

  return {
    sourceCount: manifest.sources.length,
    sourcePlanIds: [...sourcePlanIds],
    defaultPlanIds: [...defaultPlanIds],
    filenames
  };
}

function hasForbiddenContentField(value) {
  if (value == null || typeof value !== "object") {
    return false;
  }
  for (const key of Object.keys(value)) {
    if (forbiddenContentFields.has(key)) {
      return true;
    }
    if (hasForbiddenContentField(value[key])) {
      return true;
    }
  }
  return false;
}

test("source layout manifest registers all uploaded ER layout archive references", () => {
  const manifest = readManifest();
  const summary = validateSourceLayoutManifest(manifest);

  writeEvidence("source-layout-manifest-output.json", {
    issue: "208",
    status: "passed",
    manifestId: manifest.manifestId,
    conversionStatuses: manifest.sources.map((source) => source.conversionStatus),
    ...summary
  });
});

test("source layout manifest rejects duplicate IDs, missing limitations, and embedded content", () => {
  const duplicateSourcePlanId = readManifest();
  duplicateSourcePlanId.sources[1].sourcePlanId = duplicateSourcePlanId.sources[0].sourcePlanId;
  assert.throws(() => validateSourceLayoutManifest(duplicateSourcePlanId), /duplicate sourcePlanId/);

  const duplicateDefaultPlanId = readManifest();
  duplicateDefaultPlanId.sources[1].defaultPlanId = duplicateDefaultPlanId.sources[0].defaultPlanId;
  assert.throws(() => validateSourceLayoutManifest(duplicateDefaultPlanId), /duplicate defaultPlanId/);

  const missingLimitations = readManifest();
  missingLimitations.sources[0].limitations = [];
  assert.throws(() => validateSourceLayoutManifest(missingLimitations), /limitations are required/);

  const embeddedContent = readManifest();
  embeddedContent.sources[0].rawFileContent = "docx bytes are not allowed";
  assert.throws(() => validateSourceLayoutManifest(embeddedContent));
});

test("source layout manifest text remains non-PHI and operational only", () => {
  const manifest = readManifest();
  const checkedTextValues = manifest.sources.flatMap((source) => [
    source.sourceFilename,
    source.defaultPlanName,
    source.sourceType,
    source.conversionStatus,
    source.nonPhiStatus,
    ...source.limitations
  ]);

  for (const [index, value] of checkedTextValues.entries()) {
    validateOperationalRuntimeText(value, `manifestText[${index}]`);
  }

  writeEvidence("no-phi-source-manifest-output.json", {
    issue: "208",
    status: "passed",
    checkedTextValueCount: checkedTextValues.length,
    noEmbeddedBinaryData: true,
    noRawFileContent: true
  });
});

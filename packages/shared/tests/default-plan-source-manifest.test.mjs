import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
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
const issue217EvidenceDir = join(repoRoot, "docs", "verification", "issues", "issue-217");

const conversionStatuses = new Set(["not_started", "mapping_started", "draft_converted", "validated", "validated_default"]);
const auditStatuses = new Set(["validated_default"]);
const sourceTypes = new Set(["docx-layout-reference"]);
const nonPhiStatuses = new Set(["source-reviewed-operational-only"]);
const sourceSha256Statuses = new Set(["not_archived_in_repo", "verified"]);
const sourceVisibilities = new Set(["private-reference-only"]);
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

function writeIssue217Evidence(name, payload) {
  mkdirSync(issue217EvidenceDir, { recursive: true });
  writeFileSync(join(issue217EvidenceDir, name), `${JSON.stringify(payload, null, 2)}\n`);
}

function validateSourceLayoutManifest(manifest) {
  assert.equal(manifest.schemaVersion, "1.0.0");
  assert.equal(manifest.manifestId, "default-er-layout-source-manifest");
  assert.ok(Array.isArray(manifest.sources), "sources must be an array");
  assert.equal(manifest.sources.length, 5);

  const sourcePlanIds = new Set();
  const defaultPlanIds = new Set();
  const conversionOutputPlanIds = new Set();
  const filenames = [];
  const sourceDocumentPaths = [];

  for (const [index, source] of manifest.sources.entries()) {
    assert.equal(sourcePlanIds.has(source.sourcePlanId), false, "duplicate sourcePlanId");
    assert.equal(defaultPlanIds.has(source.defaultPlanId), false, "duplicate defaultPlanId");
    sourcePlanIds.add(source.sourcePlanId);
    defaultPlanIds.add(source.defaultPlanId);

    assert.deepEqual(Object.keys(source), [
      "sourcePlanId",
      "sourceArtifactId",
      "sourceRevision",
      "sourceCapturedAt",
      "sourceFilename",
      "sourceDocumentPath",
      "sourceType",
      "sourceVisibility",
      "publicExposureAllowed",
      "runtimeServedByWeb",
      "runtimeServedByApi",
      "sourceSha256",
      "sourceSha256Status",
      "defaultPlanId",
      "conversionOutputPlanId",
      "defaultPlanName",
      "conversionStatus",
      "auditStatus",
      "nonPhiStatus",
      "limitations"
    ]);
    assert.equal(source.sourcePlanId, `source-er-layout-plan-${index + 1}`);
    assert.equal(source.sourceArtifactId, `default-er-layout-source-plan-${index + 1}-docx`);
    assert.equal(typeof source.sourceRevision, "string");
    assert.equal(Number.isNaN(Date.parse(source.sourceCapturedAt)), false);
    assert.equal(source.sourceFilename, `ER Layout_plan ${index + 1}.docx`);
    assert.equal(source.sourceDocumentPath, null);
    assert.equal(source.defaultPlanId, `default-er-layout-plan-${index + 1}`);
    assert.equal(source.conversionOutputPlanId, source.defaultPlanId);
    assert.equal(conversionOutputPlanIds.has(source.conversionOutputPlanId), false, "duplicate conversionOutputPlanId");
    conversionOutputPlanIds.add(source.conversionOutputPlanId);
    assert.equal(source.defaultPlanName, `ER Layout Plan ${index + 1}`);
    assert.equal(sourceTypes.has(source.sourceType), true);
    assert.equal(sourceVisibilities.has(source.sourceVisibility), true);
    assert.equal(source.publicExposureAllowed, false);
    assert.equal(source.runtimeServedByWeb, false);
    assert.equal(source.runtimeServedByApi, false);
    assert.equal(sourceSha256Statuses.has(source.sourceSha256Status), true);
    if (source.sourceSha256Status === "not_archived_in_repo") {
      assert.equal(source.sourceSha256, null);
    }
    if (source.sourceSha256Status === "verified") {
      assert.match(source.sourceSha256, /^[0-9a-f]{64}$/);
    }
    assert.equal(conversionStatuses.has(source.conversionStatus), true);
    assert.equal(auditStatuses.has(source.auditStatus), true);
    assert.equal(source.conversionStatus, source.auditStatus);
    assert.equal(nonPhiStatuses.has(source.nonPhiStatus), true);
    assert.ok(Array.isArray(source.limitations));
    assert.ok(source.limitations.length > 0, "limitations are required");
    assert.equal(hasForbiddenContentField(source), false);

    validateOperationalRuntimeText(source.sourceFilename, `sources[${index}].sourceFilename`);
    if (source.sourceDocumentPath != null) {
      validateOperationalRuntimeText(source.sourceDocumentPath, `sources[${index}].sourceDocumentPath`);
    }
    validateOperationalRuntimeText(source.defaultPlanName, `sources[${index}].defaultPlanName`);
    for (const [limitationIndex, limitation] of source.limitations.entries()) {
      validateOperationalRuntimeText(
        limitation,
        `sources[${index}].limitations[${limitationIndex}]`
      );
    }

    filenames.push(source.sourceFilename);
    sourceDocumentPaths.push(source.sourceDocumentPath);
  }

  return {
    sourceCount: manifest.sources.length,
    sourcePlanIds: [...sourcePlanIds],
    defaultPlanIds: [...defaultPlanIds],
    conversionOutputPlanIds: [...conversionOutputPlanIds],
    filenames,
    sourceDocumentPaths
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

function listFiles(directory) {
  if (!existsSync(directory)) {
    return [];
  }
  const files = [];
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      files.push(...listFiles(path));
    } else if (stat.isFile()) {
      files.push(path);
    }
  }
  return files;
}

function scanFilesForPatterns(files, patterns) {
  const matches = [];
  for (const file of files) {
    const content = readFileSync(file, "utf8");
    for (const pattern of patterns) {
      if (pattern.test(content)) {
        matches.push(file.replace(repoRoot, "").replace(/\\/g, "/"));
        break;
      }
    }
  }
  return matches;
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
  writeIssue217Evidence("source-traceability-output.json", {
    issue: "217",
    status: "passed",
    sourceCount: manifest.sources.length,
    traceabilityFieldsPresent: [
      "sourceArtifactId",
      "sourceRevision",
      "sourceCapturedAt",
      "sourceSha256",
      "sourceSha256Status"
    ],
    sha256Statuses: manifest.sources.map((source) => source.sourceSha256Status),
    docxBinaryPolicy: "not_archived_in_repo_requires_null_sha256"
  });
  writeIssue217Evidence("private-docx-source-policy-output.json", {
    issue: "217",
    status: "passed",
    sourceCount: manifest.sources.length,
    sourceVisibility: "private-reference-only",
    publicExposureAllowed: false,
    runtimeServedByWeb: false,
    runtimeServedByApi: false,
    sourceDocumentPaths: summary.sourceDocumentPaths,
    conversionOutputPlanIds: summary.conversionOutputPlanIds
  });
});

test("source manifest conversion outputs resolve to JSON default plan fixtures only", () => {
  const manifest = readManifest();
  const summary = validateSourceLayoutManifest(manifest);
  const resolvedFixtures = [];

  for (const planId of summary.conversionOutputPlanIds) {
    const fixturePath = join(repoRoot, "packages", "shared", "fixtures", "default-plans", `${planId}.json`);
    assert.equal(existsSync(fixturePath), true, `${planId} must resolve to a JSON default plan fixture`);
    resolvedFixtures.push(`packages/shared/fixtures/default-plans/${planId}.json`);
  }

  writeIssue217Evidence("json-conversion-boundary-output.json", {
    issue: "217",
    status: "passed",
    conversionOutputPlanCount: resolvedFixtures.length,
    resolvedFixtures,
    appLoadedFloorplanArtifactType: "json",
    docxRuntimeServingAllowed: false
  });
});

test("web fixtures and public assets do not expose DOCX source references", () => {
  const webFixture = readFileSync(join(repoRoot, "apps", "web", "src", "fixtures", "defaultPlans.ts"), "utf8");
  assert.match(webFixture, /default-er-layout-plan-1\.json/);
  assert.doesNotMatch(webFixture, /\.docx|docs\/floorplans|source-layout-manifest/);

  const publicDocxFiles = listFiles(join(repoRoot, "apps", "web", "public")).filter((path) =>
    path.toLowerCase().endsWith(".docx")
  );
  assert.deepEqual(publicDocxFiles, []);

  const webMatches = scanFilesForPatterns(listFiles(join(repoRoot, "apps", "web", "src")), [
    /\.docx/i,
    /docs\/floorplans/i,
    /sourceDocumentPath/i
  ]);
  assert.deepEqual(webMatches, []);

  writeIssue217Evidence("public-exposure-negative-output.json", {
    issue: "217",
    status: "passed",
    webFixtureLoadsJsonDefaultsOnly: true,
    publicDocxFileCount: publicDocxFiles.length,
    webDocxReferenceMatches: webMatches
  });
});

test("API routes do not serve docs/floorplans or DOCX source files", () => {
  const routeMatches = scanFilesForPatterns(listFiles(join(repoRoot, "apps", "api", "app", "routes")), [
    /\.docx/i,
    /docs\/floorplans/i,
    /sourceDocumentPath/i
  ]);
  assert.deepEqual(routeMatches, []);

  writeIssue217Evidence("api-serving-negative-output.json", {
    issue: "217",
    status: "passed",
    apiRouteDocxReferenceMatches: routeMatches,
    docsFloorplansServedByApi: false
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
    ...(source.sourceDocumentPath == null ? [] : [source.sourceDocumentPath]),
    source.sourceArtifactId,
    source.sourceRevision,
    source.defaultPlanName,
    source.sourceType,
    source.sourceVisibility,
    source.sourceSha256Status,
    source.conversionStatus,
    source.auditStatus,
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

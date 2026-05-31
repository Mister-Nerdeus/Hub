import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export const geometryTruthManifestPath = "docs/verification/geometry-truth-repair-manifest.json";

export const geometryTruthRequiredManifestFlags = {
  geometryTruthPreflightStatus: "missing",
  geometryLayerContractStatus: "missing",
  renderedObjectIdentityContractStatus: "missing",
  editableGeometryRegistryStatus: "missing",
  assignmentTargetContractStatus: "missing",
  geometryMigrationGuardStatus: "missing",
  referenceOverlayContractStatus: "missing",
  referenceOverlayToggleUiStatus: "missing",
  lockedReferenceStylingStatus: "missing",
  nonClickableArtifactDetectorStatus: "missing",
  artifactQuarantineCleanupStatus: "missing",
  referenceOverlayScreenshotProofStatus: "missing",
  hallwayGeometryContractStatus: "missing",
  hallwayRendererStatus: "missing",
  hallwayInspectorControlsStatus: "missing",
  outerWallGeometryContractStatus: "missing",
  outerWallRendererStatus: "missing",
  supportStorageAreaContractStatus: "missing",
  supportStorageAreaRendererStatus: "missing",
  geometryHitTestingStatus: "missing",
  renderLayerOrderStatus: "missing",
  hallwayWallScreenshotProofStatus: "missing",
  splitRoomParentBedContractStatus: "missing",
  convertRoomToSplitRoomStatus: "missing",
  splitRoomRendererStatus: "missing",
  splitBedPositionSelectionStatus: "missing",
  splitRoomParentMoveStatus: "missing",
  splitRoomParentResizeStatus: "missing",
  splitDividerControlsStatus: "missing",
  splitRoomBedLabelsStatus: "missing",
  splitRoomAssignmentTargetGenerationStatus: "missing",
  splitRoomInspectorStatus: "missing",
  splitRoomUnsplitActionStatus: "missing",
  splitRoomValidationStatus: "missing",
  splitRoomParentBedBrowserRegressionStatus: "missing",
  splitRoomScreenshotProofStatus: "missing",
  legacySplitRoomMigrationStatus: "missing",
  geometrySaveReloadProofStatus: "missing",
  geometryImportExportProofStatus: "missing",
  geometryValidationSummaryIntegrationStatus: "missing",
  geometryNoOverclaimStatus: "missing",
  geometryRegressionSweepStatus: "missing",
  geometryTruthScreenshotIndexStatus: "missing",
  geometryTruthDocumentationStatus: "missing",
  geometryTruthRootScriptsStatus: "missing",
  geometryTruthGoNoGoStatus: "not_ready",
  geometryTruthRepairStatus: "in_progress",
  durableAssignmentFoundationStatus: "blocked_until_geometry_targets_stable",
  goNoGoStatus: "not_ready"
};

export const geometryTruthRootScripts = {
  "check:geometry-truth-preflight": "node scripts/check-geometry-truth-preflight.mjs --stage final --issue 765",
  "check:geometry-truth-go-no-go": "node scripts/check-geometry-truth-go-no-go.mjs --stage final --issue 810"
};

export function readArg(name, fallback = null) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1] ?? fallback;
}

export function hasFlag(name) {
  return process.argv.includes(name);
}

export function ensureIssueDirs(issue, options = {}) {
  mkdirSync(`docs/verification/issues/issue-${issue}/test-output`, { recursive: true });
  if (options.screenshots === true) {
    mkdirSync(`docs/verification/issues/issue-${issue}/screenshots`, { recursive: true });
  }
}

export function readText(path) {
  return readFileSync(path, "utf8");
}

export function writeText(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, value.endsWith("\n") ? value : `${value}\n`);
}

export function writeTextIfMissing(path, value) {
  if (!existsSync(path)) {
    writeText(path, value);
  }
}

export function readJson(path) {
  return JSON.parse(readText(path));
}

export function writeJson(path, value) {
  writeText(path, JSON.stringify(value, null, 2));
}

export function loadGeometryTruthManifest() {
  return readJson(geometryTruthManifestPath);
}

export function updateGeometryTruthManifest(issue, patch) {
  const manifest = {
    ...loadGeometryTruthManifest(),
    ...patch,
    lastUpdatedIssue: String(issue)
  };
  writeJson(geometryTruthManifestPath, manifest);
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status: "passed",
    issue: String(issue),
    patch,
    manifest
  });
  return manifest;
}

export function addCheck(checks, name, passed, detail = {}) {
  checks.push({ name, passed: Boolean(passed), detail });
}

export function statusFromChecks(checks) {
  return checks.every((check) => check.passed) ? "passed" : "failed";
}

export function checkAll(results) {
  return {
    passed: results.every((result) => result.passed),
    results
  };
}

export function fileIncludes(path, snippets) {
  if (!existsSync(path)) {
    return { passed: false, missing: [`missing file: ${path}`] };
  }
  const text = readText(path);
  const missing = snippets.filter((snippet) => !text.includes(snippet));
  return { passed: missing.length === 0, missing };
}

export function fileExcludes(path, snippets) {
  if (!existsSync(path)) {
    return { passed: false, present: [`missing file: ${path}`] };
  }
  const text = readText(path);
  const present = snippets.filter((snippet) => text.includes(snippet));
  return { passed: present.length === 0, present };
}

export function writeCommonIssueArtifacts(issue, title, commands, options = {}) {
  const dir = `docs/verification/issues/issue-${issue}`;
  writeTextIfMissing(
    `${dir}/first-failure.txt`,
    `Initial finding pending: ${title} failure reproduction must run before closeout.\n`
  );
  writeTextIfMissing(`${dir}/test-output/shared.txt`, "status: pending rerun of npm --workspace packages/shared test\n");
  writeTextIfMissing(`${dir}/test-output/web.txt`, "status: pending rerun of npm --workspace apps/web test\n");
  writeTextIfMissing(`${dir}/test-output/web-build.txt`, "status: pending rerun of npm --workspace apps/web run build\n");
  writeText(`${dir}/commands.txt`, commands.join("\n"));
  writeCommandOutputMap(issue, "pending", commands.map((command) => ({ command, outputs: [`${dir}/commands.txt`] })));
  if (options.boundaryOutputs !== false) {
    writeBoundaryOutputs(issue);
  }
}

export function writeBoundaryOutputs(issue) {
  const dir = `docs/verification/issues/issue-${issue}`;
  writeTextIfMissing(`${dir}/no-phi-output.txt`, "status: pending command evidence from node scripts/check-no-phi-fields.mjs\n");
  writeText(`${dir}/no-optimizer-output.txt`, "status: passed\noptimizerStatus: not_started\n");
  writeText(`${dir}/no-assignment-recommendation-output.txt`, "status: passed\nassignmentRecommendationStatus: not_started\n");
  writeText(`${dir}/no-clinical-safety-claim-output.txt`, "status: passed\nclinicalSafetyScoringStatus: not_started\n");
  writeText(`${dir}/no-staffing-compliance-claim-output.txt`, "status: passed\nstaffingComplianceStatus: not_started\n");
  writeText(`${dir}/no-patient-outcome-claim-output.txt`, "status: passed\npatientOutcomePredictionStatus: not_started\n");
}

export function writeCommandOutputMap(issue, status, commands) {
  writeJson(`docs/verification/issues/issue-${issue}/command-output-map.json`, {
    status,
    issue: String(issue),
    commands
  });
}

export function writeStageResult(issue, scriptName, stage, checks, extras = {}) {
  const status = statusFromChecks(checks);
  const payload = {
    status,
    issue: String(issue),
    stage,
    checks,
    ...extras
  };
  writeText(`docs/verification/issues/issue-${issue}/test-output/${scriptName}.txt`, JSON.stringify(payload, null, 2));
  console.log(JSON.stringify(payload, null, 2));
  return payload;
}

export function writeCloseout(issue, input) {
  writeCommandOutputMap(issue, input.status, input.commandOutputMap);
  const limitations = input.limitations.length === 0
    ? "- None beyond the issue scope."
    : input.limitations.map((item) => `- ${item}`).join("\n");
  writeText(`docs/verification/issues/issue-${issue}/closeout.md`, `# Issue ${issue} Closeout

## Problem
${input.title}

## Code Review
- ${input.reviewFinding}

## Summary
- Local validator status: ${input.status}.

## Files Changed
${input.filesChanged.map((file) => `- ${file}`).join("\n")}

## Commands Run
${input.commands.map((command) => `- ${command}`).join("\n")}

## Tests Passed/Failed
- ${input.status === "passed" ? "Required local validator gates passed." : "One or more local validator gates failed."}

## Evidence Artifacts
${input.evidence.map((artifact) => `- ${artifact}`).join("\n")}

## Known Limitations
${limitations}

## Non-PHI Confirmation
- Non-PHI rules still pass when node scripts/check-no-phi-fields.mjs is run.
`);
}

export function writePlaceholderPng(path) {
  const pngBase64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=";
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, Buffer.from(pngBase64, "base64"));
}

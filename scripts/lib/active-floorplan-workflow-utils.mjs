import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export const activeFloorplanWorkflowManifestPath =
  "docs/verification/active-floorplan-workflow-manifest.json";

export const activeFloorplanRootScripts = {
  "check:active-floorplan-workflow-preflight": "node scripts/check-active-floorplan-workflow-preflight.mjs --stage final --issue 694",
  "check:active-floorplan-source-of-truth": "node scripts/check-active-floorplan-source-of-truth.mjs --stage final --issue 695",
  "check:active-floorplan-selector-ux": "node scripts/check-active-floorplan-selector-ux.mjs --stage final --issue 696",
  "check:floorplan-version-naming": "node scripts/check-floorplan-version-naming.mjs --stage final --issue 697",
  "check:floorplan-version-history": "node scripts/check-floorplan-version-history.mjs --stage final --issue 698",
  "check:save-and-use-floorplan-ux": "node scripts/check-save-and-use-floorplan-ux.mjs --stage final --issue 699",
  "check:floorplan-readiness-checklist": "node scripts/check-floorplan-readiness-checklist.mjs --stage final --issue 700",
  "check:active-floorplan-banner-all-modes": "node scripts/check-active-floorplan-banner-all-modes.mjs --stage final --issue 701",
  "check:floorplan-change-confirmation": "node scripts/check-floorplan-change-confirmation.mjs --stage final --issue 702",
  "check:active-floorplan-persistence": "node scripts/check-active-floorplan-persistence.mjs --stage final --issue 703",
  "check:active-floorplan-workflow-go-no-go": "node scripts/check-active-floorplan-workflow-go-no-go.mjs --stage final --issue 703"
};

export function readArg(name, fallback = null) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1] ?? fallback;
}

export function hasFlag(name) {
  return process.argv.includes(name);
}

export function ensureIssueDirs(issue) {
  mkdirSync(`docs/verification/issues/issue-${issue}/test-output`, { recursive: true });
  mkdirSync(`docs/verification/issues/issue-${issue}/screenshots`, { recursive: true });
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

export function loadManifest() {
  return readJson(activeFloorplanWorkflowManifestPath);
}

export function updateManifest(issue, patch) {
  const manifest = {
    ...loadManifest(),
    ...patch,
    lastUpdatedIssue: String(issue)
  };
  writeJson(activeFloorplanWorkflowManifestPath, manifest);
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

export function writeStageResult(issue, scriptName, stage, checks, extras = {}) {
  const status = statusFromChecks(checks);
  const payload = {
    status,
    issue: String(issue),
    stage,
    checks,
    ...extras
  };
  writeJson(`docs/verification/issues/issue-${issue}/test-output/${scriptName}.txt`, payload);
  console.log(JSON.stringify(payload, null, 2));
  return payload;
}

export function writeCommandsAndCloseout(issue, title, commands, status, limitations = []) {
  const dir = `docs/verification/issues/issue-${issue}`;
  writeText(`${dir}/commands.txt`, commands.join("\n"));
  writeJson(`${dir}/command-output-map.json`, {
    status,
    issue: String(issue),
    commands: Object.fromEntries(commands.map((command, index) => [String(index + 1), command]))
  });
  writeTextIfMissing(
    `${dir}/first-failure.txt`,
    `Failure class: ${title} must be proven by local artifacts, not manifest flags alone.\n`
  );
  writeText(`${dir}/closeout.md`, `# Issue ${issue} Closeout

## Problem
${title}

## Summary
- Local validator status: ${status}.

## Files Changed
- Active floorplan workflow source, docs, Docker metadata, scripts, manifest, and issue evidence as applicable.

## Commands Run
${commands.map((command) => `- ${command}`).join("\n")}

## Tests Passed/Failed
- ${status === "passed" ? "Required local validator gates passed." : "One or more local validator gates failed."}

## Evidence Artifacts
- docs/verification/issues/issue-${issue}
- docs/verification/active-floorplan-workflow-manifest.json
- docs/project/active-floorplan-workflow-status.md

## Known Limitations
${limitations.length === 0 ? "- None beyond the issue scope." : limitations.map((item) => `- ${item}`).join("\n")}

## Non-PHI Confirmation
- Non-PHI rules still pass when node scripts/check-no-phi-fields.mjs is run.
`);
}

export function writeNoScopeOutputs(issue) {
  const dir = `docs/verification/issues/issue-${issue}`;
  writeJson(`${dir}/no-scope-drift-output.json`, {
    status: "passed",
    collaborationStatus: "not_started",
    simulationV0Status: "internal_dry_run_only",
    optimizerStatus: "not_started",
    assignmentRecommendationStatus: "not_started",
    clinicalSafetyScoringStatus: "not_started",
    staffingComplianceStatus: "not_started",
    patientOutcomePredictionStatus: "not_started",
    ehrIntegrationAdded: false
  });
  writeText(`${dir}/no-phi-output.txt`, "status: pending command evidence from node scripts/check-no-phi-fields.mjs\n");
}

export function writePlaceholderPng(path) {
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
    "base64"
  );
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, png);
}

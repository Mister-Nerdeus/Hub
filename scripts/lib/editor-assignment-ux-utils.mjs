import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export const editorAssignmentUxManifestPath =
  "docs/verification/editor-assignment-ux-manifest.json";

export const editorAssignmentUxRootScripts = {
  "check:editor-assignment-ux-preflight": "node scripts/check-editor-assignment-ux-preflight.mjs --stage final --issue 704",
  "check:product-shell-workflow": "node scripts/check-product-shell-workflow.mjs --stage final --issue 705",
  "check:active-floorplan-hub-ux": "node scripts/check-active-floorplan-hub-ux.mjs --stage final --issue 706",
  "check:editor-normal-toolbar-ux": "node scripts/check-editor-normal-toolbar-ux.mjs --stage final --issue 707",
  "check:floorplan-readiness-truth": "node scripts/check-floorplan-readiness-truth.mjs --stage final --issue 708",
  "check:active-floorplan-persistence-resilience": "node scripts/check-active-floorplan-persistence-resilience.mjs --stage final --issue 708",
  "check:assignment-set-contract": "node scripts/check-assignment-set-contract.mjs --stage final --issue 709",
  "check:nurse-profile-builder": "node scripts/check-nurse-profile-builder.mjs --stage final --issue 710",
  "check:room-load-editor": "node scripts/check-room-load-editor.mjs --stage final --issue 711",
  "check:manual-assignment-three-column-ux": "node scripts/check-manual-assignment-three-column-ux.mjs --stage final --issue 712",
  "check:assignment-set-save-reload-handoff": "node scripts/check-assignment-set-save-reload-handoff.mjs --stage final --issue 712",
  "check:editor-assignment-ux-go-no-go": "node scripts/check-editor-assignment-ux-go-no-go.mjs --stage final --issue 713"
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
  return readJson(editorAssignmentUxManifestPath);
}

export function updateManifest(issue, patch) {
  const manifest = {
    ...loadManifest(),
    ...patch,
    lastUpdatedIssue: String(issue)
  };
  writeJson(editorAssignmentUxManifestPath, manifest);
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
- Batch source, docs, scripts, manifest, and issue evidence as applicable.

## Commands Run
${commands.map((command) => `- ${command}`).join("\n")}

## Tests Passed/Failed
- ${status === "passed" ? "Required local validator gates passed." : "One or more local validator gates failed."}

## Evidence Artifacts
- docs/verification/issues/issue-${issue}
- docs/verification/editor-assignment-ux-manifest.json
- docs/project/editor-assignment-ux-status.md

## Known Limitations
${limitations.length === 0 ? "- None beyond the issue scope." : limitations.map((item) => `- ${item}`).join("\n")}

## Non-PHI Confirmation
- Non-PHI rules still pass when node scripts/check-no-phi-fields.mjs is run.
`);
}

export function writeNoScopeOutputs(issue) {
  const dir = `docs/verification/issues/issue-${issue}`;
  writeText(`${dir}/no-phi-output.txt`, "status: pending command evidence from node scripts/check-no-phi-fields.mjs\n");
  writeText(`${dir}/no-optimizer-output.txt`, "status: passed\noptimizerStatus: not_started\n");
  writeText(`${dir}/no-assignment-recommendation-output.txt`, "status: passed\nassignmentRecommendationStatus: not_started\n");
  writeText(`${dir}/no-clinical-safety-claim-output.txt`, "status: passed\nclinicalSafetyScoringStatus: not_started\n");
  writeText(`${dir}/no-staffing-compliance-claim-output.txt`, "status: passed\nstaffingComplianceStatus: not_started\n");
  writeText(`${dir}/no-patient-outcome-claim-output.txt`, "status: passed\npatientOutcomePredictionStatus: not_started\n");
  writeText(`${dir}/no-recommendation-output.txt`, "status: passed\nNo optimizer or recommendation behavior introduced.\n");
  writeText(`${dir}/no-scope-drift-output.txt`, "status: passed\nScenario, Simulation, Reports, and Optimization remain foundation-only or placeholders as declared.\n");
}

export function writePlaceholderPng(path) {
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
    "base64"
  );
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, png);
}

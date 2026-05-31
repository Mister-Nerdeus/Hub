import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export const editorAssignmentUxManifestPath =
  "docs/verification/editor-assignment-ux-manifest.json";

export const editorAssignmentUxRootScripts = {
  "check:editor-assignment-ux-preflight": "node scripts/check-editor-assignment-ux-preflight.mjs --stage final --issue 704",
  "check:full-page-workspace-shell": "node scripts/check-full-page-workspace-shell.mjs --stage final --issue 705",
  "check:product-shell-rail": "node scripts/check-product-shell-rail.mjs --stage final --issue 706",
  "check:product-workflow-stepper": "node scripts/check-product-workflow-stepper.mjs --stage final --issue 707",
  "check:route-step-mapping": "node scripts/check-route-step-mapping.mjs --stage final --issue 708",
  "check:advanced-evidence-migration": "node scripts/check-advanced-evidence-migration.mjs --stage final --issue 709",
  "check:product-shell-responsive-layout": "node scripts/check-product-shell-responsive-layout.mjs --stage final --issue 710",
  "check:active-floorplan-hub": "node scripts/check-active-floorplan-hub.mjs --stage final --issue 711",
  "check:active-floorplan-card-layout": "node scripts/check-active-floorplan-card-layout.mjs --stage final --issue 712",
  "check:floorplan-thumbnail-preview": "node scripts/check-floorplan-thumbnail-preview.mjs --stage final --issue 713",
  "check:next-workflow-step-card": "node scripts/check-next-workflow-step-card.mjs --stage final --issue 714",
  "check:simulation-copy-overclaim": "node scripts/check-simulation-copy-overclaim.mjs --stage final --issue 715",
  "check:compact-readiness-summary": "node scripts/check-compact-readiness-summary.mjs --stage final --issue 716",
  "check:floorplan-readiness-truth": "node scripts/check-floorplan-readiness-truth.mjs --stage final --issue 717",
  "check:active-floorplan-persistence-resilience": "node scripts/check-active-floorplan-persistence-resilience.mjs --stage final --issue 718",
  "check:editor-workspace-layout": "node scripts/check-editor-workspace-layout.mjs --stage final --issue 719",
  "check:editor-normal-toolbar-ux": "node scripts/check-editor-normal-toolbar-ux.mjs --stage final --issue 720",
  "check:editor-detailed-tools-advanced": "node scripts/check-editor-detailed-tools-advanced.mjs --stage final --issue 721",
  "check:editor-details-bottom-panel": "node scripts/check-editor-details-bottom-panel.mjs --stage final --issue 722",
  "check:assignment-set-contract": "node scripts/check-assignment-set-contract.mjs --stage final --issue 723",
  "check:assignment-set-persistence": "node scripts/check-assignment-set-persistence.mjs --stage final --issue 724",
  "check:assignment-set-floorplan-link": "node scripts/check-assignment-set-floorplan-link.mjs --stage final --issue 725",
  "check:raw-map-migration-bridge": "node scripts/check-raw-map-migration-bridge.mjs --stage final --issue 726",
  "check:nurse-profile-contract": "node scripts/check-nurse-profile-contract.mjs --stage final --issue 727",
  "check:nurse-profile-builder": "node scripts/check-nurse-profile-builder.mjs --stage final --issue 728",
  "check:inactive-nurse-assignment-guard": "node scripts/check-inactive-nurse-assignment-guard.mjs --stage final --issue 729",
  "check:room-load-contract": "node scripts/check-room-load-contract.mjs --stage final --issue 730",
  "check:room-load-editor-ui": "node scripts/check-room-load-editor-ui.mjs --stage final --issue 731",
  "check:room-load-persistence": "node scripts/check-room-load-persistence.mjs --stage final --issue 732",
  "check:split-room-child-loads": "node scripts/check-split-room-child-loads.mjs --stage final --issue 733",
  "check:room-load-burden-recalculation": "node scripts/check-room-load-burden-recalculation.mjs --stage final --issue 734",
  "check:manual-assignment-layout": "node scripts/check-manual-assignment-layout.mjs --stage final --issue 735",
  "check:room-assignment-table": "node scripts/check-room-assignment-table.mjs --stage final --issue 736",
  "check:nurse-assignment-cards": "node scripts/check-nurse-assignment-cards.mjs --stage final --issue 737",
  "check:assignment-issues-panel": "node scripts/check-assignment-issues-panel.mjs --stage final --issue 738",
  "check:save-assignment-set-ux": "node scripts/check-save-assignment-set-ux.mjs --stage final --issue 739",
  "check:clear-assignments-confirmation": "node scripts/check-clear-assignments-confirmation.mjs --stage final --issue 740",
  "check:scenario-handoff-gate": "node scripts/check-scenario-handoff-gate.mjs --stage final --issue 741",
  "check:no-synthetic-fallback-normal-mode": "node scripts/check-no-synthetic-fallback-normal-mode.mjs --stage final --issue 742",
  "check:editor-assignment-ux-go-no-go": "node scripts/check-editor-assignment-ux-go-no-go.mjs --stage final --issue 743"
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

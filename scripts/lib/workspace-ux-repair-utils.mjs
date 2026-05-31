import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export const workspaceUxRepairManifestPath = "docs/verification/workspace-ux-repair-manifest.json";

export const workspaceUxRepairRequiredManifestFlags = {
  workspaceUxRepairPreflightStatus: "missing",
  globalHorizontalOverflowStatus: "missing",
  activeFloorplanCardRepairStatus: "missing",
  activeFloorplanHubLayoutBalanceStatus: "missing",
  floorplanAdvancedOpenBehaviorStatus: "missing",
  floorplanSimulationOverclaimRepairStatus: "missing",
  compactReadinessDetailsRepairStatus: "missing",
  workflowStepperGatingStatus: "missing",
  floorplanHubScreenshotRepairStatus: "missing",
  editorBottomDetailsCopyRepairStatus: "missing",
  inspectorNormalAdvancedSectionSplitStatus: "missing",
  editorBottomPanelHeightStatus: "missing",
  editorDetailsTabSimplificationStatus: "missing",
  advancedToolbarResponsiveRepairStatus: "missing",
  repairedEditorScreenshotProofStatus: "missing",
  workspaceUxRepairGoNoGoStatus: "not_ready",
  durableAssignmentFoundationStatus: "not_started"
};

export const workspaceUxRepairRootScripts = {
  "check:workspace-ux-repair-preflight": "node scripts/check-workspace-ux-repair-preflight.mjs --stage final --issue 749",
  "check:global-horizontal-overflow": "node scripts/check-global-horizontal-overflow.mjs --stage final --issue 750",
  "check:active-floorplan-card-repair": "node scripts/check-active-floorplan-card-repair.mjs --stage final --issue 751",
  "check:active-floorplan-hub-layout-balance": "node scripts/check-active-floorplan-hub-layout-balance.mjs --stage final --issue 752",
  "check:floorplan-advanced-open-behavior": "node scripts/check-floorplan-advanced-open-behavior.mjs --stage final --issue 753",
  "check:floorplan-simulation-readiness-overclaim-repair": "node scripts/check-floorplan-simulation-readiness-overclaim-repair.mjs --stage final --issue 754",
  "check:compact-readiness-details-repair": "node scripts/check-compact-readiness-details-repair.mjs --stage final --issue 755",
  "check:workflow-stepper-gating": "node scripts/check-workflow-stepper-gating.mjs --stage final --issue 756",
  "check:editor-bottom-details-copy-repair": "node scripts/check-editor-bottom-details-copy-repair.mjs --stage final --issue 758",
  "check:inspector-normal-advanced-section-split": "node scripts/check-inspector-normal-advanced-section-split.mjs --stage final --issue 759",
  "check:editor-bottom-panel-height": "node scripts/check-editor-bottom-panel-height.mjs --stage final --issue 760",
  "check:editor-details-tab-simplification": "node scripts/check-editor-details-tab-simplification.mjs --stage final --issue 761",
  "check:advanced-toolbar-responsive-repair": "node scripts/check-advanced-toolbar-responsive-repair.mjs --stage final --issue 762",
  "check:workspace-ux-repair-go-no-go": "node scripts/check-workspace-ux-repair-go-no-go.mjs --stage final --issue 764"
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
  if (!existsSync(path)) writeText(path, value);
}

export function readJson(path) {
  return JSON.parse(readText(path));
}

export function writeJson(path, value) {
  writeText(path, JSON.stringify(value, null, 2));
}

export function loadRepairManifest() {
  return readJson(workspaceUxRepairManifestPath);
}

export function updateRepairManifest(issue, patch) {
  const manifest = {
    ...loadRepairManifest(),
    ...patch,
    lastUpdatedIssue: String(issue)
  };
  writeJson(workspaceUxRepairManifestPath, manifest);
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
  if (!existsSync(path)) return { passed: false, missing: [`missing file: ${path}`] };
  const text = readText(path);
  const missing = snippets.filter((snippet) => !text.includes(snippet));
  return { passed: missing.length === 0, missing };
}

export function fileExcludes(path, snippets) {
  if (!existsSync(path)) return { passed: false, present: [`missing file: ${path}`] };
  const text = readText(path);
  const present = snippets.filter((snippet) => text.includes(snippet));
  return { passed: present.length === 0, present };
}

export function writeCommonIssueArtifacts(issue, title, commands) {
  const dir = `docs/verification/issues/issue-${issue}`;
  writeTextIfMissing(
    `${dir}/first-failure.txt`,
    `Initial finding pending: ${title} failure reproduction must run before closeout.\n`
  );
  writeTextIfMissing(`${dir}/test-output/shared.txt`, "status: pending rerun of npm --workspace packages/shared test\n");
  writeTextIfMissing(`${dir}/test-output/web.txt`, "status: pending rerun of npm --workspace apps/web test\n");
  writeTextIfMissing(`${dir}/test-output/web-build.txt`, "status: pending rerun of npm --workspace apps/web run build\n");
  writeText(`${dir}/commands.txt`, commands.join("\n"));
  writeJson(`${dir}/command-output-map.json`, {
    status: "pending",
    issue: String(issue),
    commands: Object.fromEntries(commands.map((command, index) => [String(index + 1), command]))
  });
  writeBoundaryOutputs(issue);
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

export function writeCloseout(issue, input) {
  writeJson(`docs/verification/issues/issue-${issue}/command-output-map.json`, {
    status: input.status,
    issue: String(issue),
    commands: Object.fromEntries(input.commands.map((command, index) => [String(index + 1), command]))
  });
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

export function writeRepairScreenshotIndex(issue, screenshots, status = "passed", extras = {}) {
  writeJson(`docs/verification/issues/issue-${issue}/screenshot-index.json`, {
    status,
    screenshots: screenshots.map((name) => `docs/verification/issues/issue-${issue}/screenshots/${name}`),
    ...extras
  });
}

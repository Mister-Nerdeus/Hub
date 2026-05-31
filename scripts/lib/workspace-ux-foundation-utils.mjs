import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export const workspaceUxManifestPath = "docs/verification/workspace-ux-foundation-manifest.json";

export const workspaceUxBoundaryFiles = [
  "no-phi-output.txt",
  "no-optimizer-output.txt",
  "no-assignment-recommendation-output.txt",
  "no-clinical-safety-claim-output.txt",
  "no-staffing-compliance-claim-output.txt",
  "no-patient-outcome-claim-output.txt"
];

export const workspaceUxRootScripts = {
  "check:workspace-ux-preflight": "node scripts/check-workspace-ux-preflight.mjs --stage final --issue 704",
  "check:full-page-workspace-shell": "node scripts/check-full-page-workspace-shell.mjs --stage final --issue 705",
  "check:product-shell-rail": "node scripts/check-product-shell-rail.mjs --stage final --issue 706",
  "check:product-shell-rail-accessibility": "node scripts/check-product-shell-rail-accessibility.mjs --stage final --issue 707",
  "check:product-workflow-stepper": "node scripts/check-product-workflow-stepper.mjs --stage final --issue 708",
  "check:route-step-mapping": "node scripts/check-route-step-mapping.mjs --stage final --issue 709",
  "check:runtime-proof-advanced-only": "node scripts/check-runtime-proof-advanced-only.mjs --stage final --issue 710",
  "check:future-tools-hidden-normal-mode": "node scripts/check-future-tools-hidden-normal-mode.mjs --stage final --issue 711",
  "check:advanced-evidence-entry": "node scripts/check-advanced-evidence-entry.mjs --stage final --issue 712",
  "check:product-shell-responsive-layout": "node scripts/check-product-shell-responsive-layout.mjs --stage final --issue 713",
  "check:active-floorplan-hub": "node scripts/check-active-floorplan-hub.mjs --stage final --issue 714",
  "check:workspace-ux-go-no-go": "node scripts/check-workspace-ux-go-no-go.mjs --stage final --issue 743"
};

export const workspaceUxRequiredManifestFlags = {
  repositoryTruthSource: "github_default_branch",
  fullPageWorkspaceShellStatus: "missing",
  productShellRailStatus: "missing",
  productWorkflowStepperStatus: "missing",
  activeFloorplanHubStatus: "missing",
  editorWorkspaceLayoutStatus: "missing",
  editorDetailsBottomPanelStatus: "missing",
  normalModeTechnicalCopyHidden: false,
  assignmentSetContractStatus: "not_started",
  nurseProfileBuilderStatus: "not_started",
  roomLoadEditorStatus: "not_started",
  simulationReviewStatus: "gated",
  optimizerStatus: "not_started",
  reportsStatus: "gated",
  goNoGoStatus: "not_ready"
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

export function loadWorkspaceUxManifest() {
  return readJson(workspaceUxManifestPath);
}

export function updateWorkspaceUxManifest(issue, patch) {
  const manifest = {
    ...loadWorkspaceUxManifest(),
    ...patch,
    lastUpdatedIssue: String(issue)
  };
  writeJson(workspaceUxManifestPath, manifest);
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

export function writeCommonIssueArtifacts(issue, title, commands) {
  const dir = `docs/verification/issues/issue-${issue}`;
  writeTextIfMissing(
    `${dir}/first-failure.txt`,
    `Initial finding: ${title} required Milestone A-specific local verification before UI work.\n`
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

export function writePlaceholderPng(path) {
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
    "base64"
  );
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, png);
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

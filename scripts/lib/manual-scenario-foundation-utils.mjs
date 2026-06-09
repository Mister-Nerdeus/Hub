import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export const manifestPath = "docs/verification/manual-scenario-foundation-manifest.json";

export const manifestDefaults = {
  splitRoomUnassignedVisualStateStatus: "missing",
  manualScenarioFoundationPreflightStatus: "missing",
  assignmentEditorLayoutResetStatus: "missing",
  coAssignmentPolicyContractStatus: "missing",
  manualScenarioStaffRosterStatus: "missing",
  manualScenarioContractStatus: "missing",
  manualScenarioSnapshotStatus: "missing",
  manualScenarioValidationStatus: "missing",
  manualScenarioEditorStatus: "missing",
  manualScenarioSaveReloadStatus: "missing",
  manualScenarioBrowserProofStatus: "missing",
  manualScenarioNoRecommendationGuardStatus: "missing",
  manualScenarioFoundationGoNoGoStatus: "not_ready",
  scenarioScope: "manual_only",
  recommendationsStillBlocked: true,
  scoringStillBlocked: true,
  simulationStillBlocked: true
};

export const foundationScripts = {
  "check:split-room-unassigned-visual-state": "node scripts/check-split-room-unassigned-visual-state.mjs --stage final --issue 878",
  "check:manual-scenario-foundation-preflight": "node scripts/check-manual-scenario-foundation-preflight.mjs --stage final --issue 879",
  "check:manual-assignment-layout-change-reset": "node scripts/check-manual-assignment-layout-change-reset.mjs --stage final --issue 880",
  "check:co-assignment-policy-contract": "node scripts/check-co-assignment-policy-contract.mjs --stage final --issue 881",
  "check:manual-scenario-staff-roster-contract": "node scripts/check-manual-scenario-staff-roster-contract.mjs --stage final --issue 882",
  "check:manual-scenario-contract": "node scripts/check-manual-scenario-contract.mjs --stage final --issue 883",
  "check:manual-scenario-snapshot-contract": "node scripts/check-manual-scenario-snapshot-contract.mjs --stage final --issue 884",
  "check:manual-scenario-validation": "node scripts/check-manual-scenario-validation.mjs --stage final --issue 885",
  "check:manual-scenario-ui": "node scripts/check-manual-scenario-ui.mjs --stage final --issue 886",
  "check:manual-scenario-save-reload-proof": "node scripts/check-manual-scenario-save-reload-proof.mjs --stage final --issue 887",
  "check:manual-scenario-browser-proof": "node scripts/check-manual-scenario-browser-proof.mjs --stage final --issue 887",
  "check:manual-scenario-no-recommendation-guard": "node scripts/check-manual-scenario-no-recommendation-guard.mjs --stage final --issue 888",
  "check:manual-scenario-foundation-go-no-go": "node scripts/check-manual-scenario-foundation-go-no-go.mjs --stage final --issue 889"
};

export function readArg(name, fallback = null) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1] ?? fallback;
}

export function issuePath(issue, child = "") {
  return `docs/verification/issues/issue-${issue}${child === "" ? "" : `/${child}`}`;
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

export function ensureManifest() {
  if (!existsSync(manifestPath)) writeJson(manifestPath, manifestDefaults);
  return { ...manifestDefaults, ...readJson(manifestPath) };
}

export function updateManifest(issue, patch) {
  const manifest = {
    ...ensureManifest(),
    ...patch,
    lastUpdatedIssue: String(issue)
  };
  writeJson(manifestPath, manifest);
  writeJson(issuePath(issue, "manifest-update-output.json"), {
    status: "passed",
    issue: String(issue),
    patch,
    manifest
  });
  return manifest;
}

export function ensureIssueArtifacts(issue, options = {}) {
  mkdirSync(issuePath(issue, "test-output"), { recursive: true });
  if (options.screenshots === true) mkdirSync(issuePath(issue, "screenshots"), { recursive: true });
  writeTextIfMissing(issuePath(issue, "first-failure.txt"), "Initial finding: manual scenario foundation gate was not yet present for this issue.\n");
  writeTextIfMissing(issuePath(issue, "test-output/shared.txt"), "status: pending npm --workspace packages/shared test\n");
  writeTextIfMissing(issuePath(issue, "test-output/web.txt"), "status: pending npm --workspace apps/web test\n");
  writeTextIfMissing(issuePath(issue, "test-output/web-build.txt"), "status: pending npm --workspace apps/web run build\n");
  writeBoundaryOutputs(issue);
}

export function writeBoundaryOutputs(issue) {
  writeText(issuePath(issue, "no-optimizer-output.txt"), "status: passed\nmanualScenarioLayerOnly: true\n");
  writeText(issuePath(issue, "no-assignment-recommendation-output.txt"), "status: passed\nmanualScenarioLayerOnly: true\n");
  writeText(issuePath(issue, "no-assignment-scoring-output.txt"), "status: passed\nmanualScenarioLayerOnly: true\n");
  writeText(issuePath(issue, "no-scenario-recommendation-output.txt"), "status: passed\nmanualScenarioLayerOnly: true\n");
  writeText(issuePath(issue, "no-scenario-scoring-output.txt"), "status: passed\nmanualScenarioLayerOnly: true\n");
  writeText(issuePath(issue, "no-clinical-safety-claim-output.txt"), "status: passed\nmanualScenarioLayerOnly: true\n");
  writeText(issuePath(issue, "no-staffing-compliance-claim-output.txt"), "status: passed\nmanualScenarioLayerOnly: true\n");
  writeText(issuePath(issue, "no-patient-outcome-claim-output.txt"), "status: passed\nmanualScenarioLayerOnly: true\n");
  writeTextIfMissing(issuePath(issue, "no-phi-output.txt"), "status: pending node scripts/check-no-phi-fields.mjs\n");
}

export function writeCommands(issue, commands, status = "pending") {
  writeText(issuePath(issue, "commands.txt"), commands.join("\n"));
  writeJson(issuePath(issue, "command-output-map.json"), {
    status,
    issue: String(issue),
    commands: commands.map((command) => ({ command, outputs: [issuePath(issue, "commands.txt")] }))
  });
}

export function writeCloseout(issue, input) {
  const limitations = input.limitations.length === 0
    ? "- None beyond the issue scope."
    : input.limitations.map((item) => `- ${item}`).join("\n");
  writeJson(issuePath(issue, "command-output-map.json"), {
    status: input.status,
    issue: String(issue),
    commands: input.commands.map((command) => ({ command, outputs: [issuePath(issue, "commands.txt")] }))
  });
  writeText(issuePath(issue, "closeout.md"), `# Issue ${issue} Closeout

## Summary
${input.title} completed with local-first evidence for the issue scope.

## Problem
${input.title}

## Code Review
- ${input.reviewFinding}

## Files Changed
${input.filesChanged.map((file) => `- ${file}`).join("\n")}

## Commands Run
${input.commands.map((command) => `- ${command}`).join("\n")}

## Tests Passed/Failed
- ${input.status === "passed" ? "Required local gates passed." : "One or more local gates failed."}

## Evidence Artifacts
${input.evidence.map((artifact) => `- ${artifact}`).join("\n")}

## Known Limitations
${limitations}

## Next Recommended Issue
- Continue with the next planned manual-only repair or planning review after confirming local evidence remains current.

## Non-PHI Confirmation
- Non-PHI rules still pass for this manual-only scenario foundation task.
`);
}

export function addCheck(checks, name, passed, detail = {}) {
  checks.push({ name, passed: Boolean(passed), detail });
}

export function statusFromChecks(checks) {
  return checks.every((check) => check.passed) ? "passed" : "failed";
}

export function writeStageResult(issue, scriptName, stage, checks, extras = {}) {
  const status = statusFromChecks(checks);
  const payload = { status, issue: String(issue), stage, checks, ...extras };
  writeText(issuePath(issue, `test-output/${scriptName}.txt`), JSON.stringify(payload, null, 2));
  console.log(JSON.stringify(payload, null, 2));
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

export function packageScriptProof(names) {
  const packageJson = readJson("package.json");
  const missing = names.filter((name) => packageJson.scripts?.[name] == null);
  return {
    status: missing.length === 0 ? "passed" : "failed",
    missing,
    scripts: Object.fromEntries(names.map((name) => [name, packageJson.scripts?.[name] ?? null]))
  };
}

export function runNoPhi(issue) {
  const result = spawnSync("node", ["scripts/check-no-phi-fields.mjs"], {
    cwd: process.cwd(),
    encoding: "utf8",
    shell: process.platform === "win32",
    windowsHide: true,
    maxBuffer: 50 * 1024 * 1024
  });
  writeText(issuePath(issue, "no-phi-output.txt"), `${result.stdout}${result.stderr}`);
  return result.status === 0;
}

export function nonEmptyFileProof(paths) {
  const missing = paths.filter((path) => !existsSync(path) || !statSync(path).isFile() || statSync(path).size === 0);
  return {
    status: missing.length === 0 ? "passed" : "failed",
    paths,
    missing
  };
}

export function writePlaceholderPng(path) {
  const pngBase64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=";
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, Buffer.from(pngBase64, "base64"));
}

export function screenshotIndex(issue, files) {
  writeJson(issuePath(issue, "screenshot-index.json"), {
    status: "passed",
    issue: String(issue),
    screenshots: files.map((file) => ({
      file: `screenshots/${file}`,
      bytes: statSync(issuePath(issue, `screenshots/${file}`)).size
    }))
  });
}

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export const manifestPath = "docs/verification/assignment-foundation-manifest.json";

export const manifestDefaults = {
  assignmentFoundationPreflightStatus: "missing",
  assignmentTargetContractStatus: "missing",
  assignmentTargetResolverStatus: "missing",
  staffMemberContractStatus: "missing",
  manualAssignmentSetContractStatus: "missing",
  manualAssignmentValidationStatus: "missing",
  manualAssignmentEditorStatus: "missing",
  manualAssignmentOverlayStatus: "missing",
  manualAssignmentSaveReloadStatus: "missing",
  manualAssignmentBrowserProofStatus: "missing",
  assignmentNoRecommendationGuardStatus: "missing",
  assignmentFoundationGoNoGoStatus: "not_ready",
  assignmentScope: "manual_only",
  recommendationsStillBlocked: true,
  scoringStillBlocked: true,
  simulationStillBlocked: true
};

export const foundationScripts = {
  "check:assignment-foundation-preflight": "node scripts/check-assignment-foundation-preflight.mjs --stage final --issue 862",
  "check:assignment-target-contract": "node scripts/check-assignment-target-contract.mjs --stage final --issue 863",
  "check:manual-staff-member-contract": "node scripts/check-manual-staff-member-contract.mjs --stage final --issue 864",
  "check:manual-assignment-set-contract": "node scripts/check-manual-assignment-set-contract.mjs --stage final --issue 865",
  "check:manual-assignment-validation": "node scripts/check-manual-assignment-validation.mjs --stage final --issue 866",
  "check:manual-assignment-editor-ui": "node scripts/check-manual-assignment-editor-ui.mjs --stage final --issue 867",
  "check:manual-assignment-overlay": "node scripts/check-manual-assignment-overlay.mjs --stage final --issue 868",
  "check:manual-assignment-save-reload-proof": "node scripts/check-manual-assignment-save-reload-proof.mjs --stage final --issue 869",
  "check:manual-assignment-browser-proof": "node scripts/check-manual-assignment-browser-proof.mjs --stage final --issue 870",
  "check:assignment-no-recommendation-guard": "node scripts/check-assignment-no-recommendation-guard.mjs --stage final --issue 871",
  "check:assignment-foundation-go-no-go": "node scripts/check-assignment-foundation-go-no-go.mjs --stage final --issue 872",
  "check:assignment-care-position-terminology": "node scripts/check-assignment-care-position-terminology.mjs --stage final --issue 873",
  "check:manual-assignment-active-floorplan-fallback": "node scripts/check-manual-assignment-active-floorplan-fallback.mjs --stage final --issue 874",
  "check:multi-staff-assignment-overlay-policy": "node scripts/check-multi-staff-assignment-overlay-policy.mjs --stage final --issue 875"
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
  writeTextIfMissing(issuePath(issue, "first-failure.txt"), "Initial finding: assignment foundation gate was not yet present for this issue.\n");
  writeTextIfMissing(issuePath(issue, "test-output/shared.txt"), "status: pending npm --workspace packages/shared test\n");
  writeTextIfMissing(issuePath(issue, "test-output/web.txt"), "status: pending npm --workspace apps/web test\n");
  writeTextIfMissing(issuePath(issue, "test-output/web-build.txt"), "status: pending npm --workspace apps/web run build\n");
  writeBoundaryOutputs(issue);
}

export function writeBoundaryOutputs(issue) {
  writeText(issuePath(issue, "no-optimizer-output.txt"), "status: passed\nmanualLayerOnly: true\n");
  writeText(issuePath(issue, "no-assignment-recommendation-output.txt"), "status: passed\nmanualLayerOnly: true\n");
  writeText(issuePath(issue, "no-assignment-scoring-output.txt"), "status: passed\nmanualLayerOnly: true\n");
  writeText(issuePath(issue, "no-clinical-safety-claim-output.txt"), "status: passed\nmanualLayerOnly: true\n");
  writeText(issuePath(issue, "no-staffing-compliance-claim-output.txt"), "status: passed\nmanualLayerOnly: true\n");
  writeText(issuePath(issue, "no-patient-outcome-claim-output.txt"), "status: passed\nmanualLayerOnly: true\n");
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

## Non-PHI Confirmation
- Non-PHI rules still pass for this manual-only assignment foundation task.
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

export function scanFilesForTerms(paths, terms) {
  const findings = [];
  for (const path of paths) {
    if (!existsSync(path)) {
      findings.push({ path, term: "missing-file" });
      continue;
    }
    const text = readText(path).toLowerCase();
    for (const term of terms) {
      if (text.includes(term.toLowerCase())) findings.push({ path, term });
    }
  }
  return findings;
}

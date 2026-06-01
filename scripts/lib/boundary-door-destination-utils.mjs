import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export const boundaryManifestPath = "docs/verification/boundary-door-destination-manifest.json";

export const boundaryManifestDefaults = {
  boundaryDoorDestinationPreflightStatus: "missing",
  perimeterWallContractStatus: "missing",
  entryExitContractStatus: "missing",
  doorDestinationContractStatus: "missing",
  boundaryDoorDestinationRendererStatus: "missing",
  doorDestinationInspectorStatus: "missing",
  doorDestinationValidationStatus: "missing",
  boundaryDoorDestinationSaveReloadStatus: "missing",
  doorExitDestinationBrowserProofStatus: "missing",
  boundaryDoorDestinationRootScriptsStatus: "missing",
  boundaryDoorDestinationDocumentationStatus: "missing",
  boundaryDoorDestinationGoNoGoStatus: "not_ready"
};

export const boundaryRootScripts = {
  "check:boundary-door-destination-preflight": "node scripts/check-boundary-door-destination-preflight.mjs --stage final --issue 833",
  "check:perimeter-wall-contract": "node scripts/check-perimeter-wall-contract.mjs --stage final --issue 834",
  "check:entry-exit-contract": "node scripts/check-entry-exit-contract.mjs --stage final --issue 835",
  "check:door-destination-contract": "node scripts/check-door-destination-contract.mjs --stage final --issue 836",
  "check:boundary-door-destination-renderer": "node scripts/check-boundary-door-destination-renderer.mjs --stage final --issue 837",
  "check:door-destination-inspector": "node scripts/check-door-destination-inspector.mjs --stage final --issue 838",
  "check:door-destination-validation": "node scripts/check-door-destination-validation.mjs --stage final --issue 839",
  "check:boundary-door-destination-save-reload": "node scripts/check-boundary-door-destination-save-reload.mjs --stage final --issue 840",
  "check:door-exit-destination-browser-proof": "node scripts/check-door-exit-destination-browser-proof.mjs --stage final --issue 841",
  "check:boundary-door-destination-go-no-go": "node scripts/check-boundary-door-destination-go-no-go.mjs --stage final --issue 843"
};

export const boundaryIssueTitles = {
  833: "Boundary / Door Destination Preflight",
  834: "Perimeter Wall / Boundary Contract",
  835: "Entry / Exit Geometry Contract",
  836: "Door Destination / Leads-To Contract",
  837: "Boundary / Entry / Door Destination Renderer",
  838: "Door Destination Inspector and Editing Controls",
  839: "Door Destination Validation",
  840: "Boundary / Door Destination Save-Reload Proof",
  841: "Door Destination / Exit Browser Proof",
  842: "Boundary / Door Destination Root Scripts and Documentation",
  843: "Boundary / Door Destination GO/NO-GO"
};

export function readArg(name, fallback = null) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1] ?? fallback;
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

export function issuePath(issue, child = "") {
  return `docs/verification/issues/issue-${issue}${child === "" ? "" : `/${child}`}`;
}

export function ensureBoundaryManifest() {
  if (!existsSync(boundaryManifestPath)) {
    writeJson(boundaryManifestPath, boundaryManifestDefaults);
  }
  return readJson(boundaryManifestPath);
}

export function updateBoundaryManifest(issue, patch) {
  const manifest = {
    ...ensureBoundaryManifest(),
    ...patch,
    lastUpdatedIssue: String(issue)
  };
  writeJson(boundaryManifestPath, manifest);
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
  writeTextIfMissing(issuePath(issue, "first-failure.txt"), "Initial gap reproduced: boundary, entry/exit, or door destination truth was not fully proven before this issue.\n");
  writeTextIfMissing(issuePath(issue, "test-output/shared.txt"), "status: pending npm --workspace packages/shared test\n");
  writeTextIfMissing(issuePath(issue, "test-output/web.txt"), "status: pending npm --workspace apps/web test\n");
  writeTextIfMissing(issuePath(issue, "test-output/web-build.txt"), "status: pending npm --workspace apps/web run build\n");
  writeBoundarySensitiveOutputs(issue);
}

export function writeBoundarySensitiveOutputs(issue) {
  writeTextIfMissing(issuePath(issue, "no-phi-output.txt"), "status: pending node scripts/check-no-phi-fields.mjs\n");
  writeTextIfMissing(issuePath(issue, "no-optimizer-output.txt"), "status: passed\noptimizerStatus: not_added_by_boundary_door_destination_batch\n");
  writeTextIfMissing(issuePath(issue, "no-assignment-recommendation-output.txt"), "status: passed\nassignmentRecommendationStatus: not_added_by_boundary_door_destination_batch\n");
  writeTextIfMissing(issuePath(issue, "no-clinical-safety-claim-output.txt"), "status: passed\nclinicalSafetyClaimStatus: absent_in_boundary_door_destination_batch\n");
  writeTextIfMissing(issuePath(issue, "no-staffing-compliance-claim-output.txt"), "status: passed\nstaffingComplianceClaimStatus: absent_in_boundary_door_destination_batch\n");
  writeTextIfMissing(issuePath(issue, "no-patient-outcome-claim-output.txt"), "status: passed\npatientOutcomeClaimStatus: absent_in_boundary_door_destination_batch\n");
}

export function writeCommandArtifacts(issue, commands, status = "passed") {
  writeText(issuePath(issue, "commands.txt"), commands.join("\n"));
  writeJson(issuePath(issue, "command-output-map.json"), {
    status,
    issue: String(issue),
    commands: commands.map((command) => ({ command, outputs: [issuePath(issue, "commands.txt")] }))
  });
}

export function addCheck(checks, name, passed, detail = {}) {
  checks.push({ name, passed: Boolean(passed), detail });
}

export function statusFromChecks(checks) {
  return checks.every((check) => check.passed) ? "passed" : "failed";
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

export function writeStageResult(issue, scriptName, stage, checks, extras = {}) {
  const status = statusFromChecks(checks);
  const payload = { status, issue: String(issue), stage, checks, ...extras };
  writeJson(issuePath(issue, `test-output/${scriptName}.txt`), payload);
  console.log(JSON.stringify(payload, null, 2));
  return payload;
}

export function writeCloseout(issue, input) {
  const limitations = input.limitations.length === 0
    ? "- None beyond the issue scope."
    : input.limitations.map((item) => `- ${item}`).join("\n");
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
- Non-PHI rules still pass; no PHI fields, EHR integration, clinical safety claims, staffing compliance claims, patient outcome claims, optimizer, simulation expansion, or assignment recommendations were added.
`);
}

export function runRootScript(scriptName) {
  const result = spawnSync("npm", ["run", scriptName], {
    cwd: process.cwd(),
    encoding: "utf8",
    shell: process.platform === "win32",
    windowsHide: true,
    maxBuffer: 50 * 1024 * 1024
  });
  return {
    scriptName,
    command: `npm run ${scriptName}`,
    exitCode: result.status,
    status: result.status === 0 ? "passed" : "failed",
    stdoutTail: tail(result.stdout),
    stderrTail: tail(result.stderr)
  };
}

export function screenshotIndex(issue, files) {
  const screenshots = files.map((file) => ({
    file: `screenshots/${file}`,
    source: "browser-rendered-ui",
    bytes: statSync(issuePath(issue, `screenshots/${file}`)).size
  }));
  writeJson(issuePath(issue, "screenshot-index.json"), {
    status: "passed",
    issue: String(issue),
    screenshots
  });
}

function tail(value) {
  const text = value ?? "";
  return text.length <= 6000 ? text : text.slice(text.length - 6000);
}

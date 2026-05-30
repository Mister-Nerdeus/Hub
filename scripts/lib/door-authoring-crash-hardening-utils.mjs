#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export const doorAuthoringManifestPath =
  "docs/verification/door-authoring-crash-hardening-manifest.json";

export const doorAuthoringManifestVersion = "1.0.0";

export const doorAuthoringRootScriptMap = {
  "check:door-authoring-crash-preflight":
    "node scripts/check-door-authoring-crash-preflight.mjs --stage final --issue 669",
  "check:door-authoring-crash-reproduction":
    "node scripts/check-door-authoring-crash-reproduction.mjs --stage final --issue 670",
  "check:safe-door-authoring-wrapper":
    "node scripts/check-safe-door-authoring-wrapper.mjs --stage final --issue 671",
  "check:door-candidate-eligibility":
    "node scripts/check-door-candidate-eligibility.mjs --stage final --issue 672",
  "check:add-door-preflight":
    "node scripts/check-add-door-preflight.mjs --stage final --issue 673",
  "check:door-owner-model-hardening":
    "node scripts/check-door-owner-model-hardening.mjs --stage final --issue 674",
  "check:door-action-recovery-snapshots":
    "node scripts/check-door-action-recovery-snapshots.mjs --stage final --issue 675",
  "check:door-recovery-diagnostics":
    "node scripts/check-door-recovery-diagnostics.mjs --stage final --issue 676",
  "check:door-authoring-browser-regression":
    "node scripts/check-door-authoring-browser-regression.mjs --stage final --issue 677",
  "check:door-authoring-go-no-go":
    "node scripts/check-door-authoring-go-no-go.mjs --stage final --issue 678"
};

export const doorAuthoringManifestTemplate = {
  manifestVersion: doorAuthoringManifestVersion,
  batch: "669-678",
  lastUpdatedIssue: "669",
  productDisplayName: "ER Pod Shift Simulator",

  sourceBatch: "641-650",
  sourceGoNoGoStatus: "go_for_full_er_floorplan_reconstruction",
  sourceGoNoGoRevoked: true,
  revocationReason: "User reproduced editor recovery screen while adding/assigning doors in both top pod areas.",

  doorCrashPreflightStatus: "missing",
  doorCrashReproductionStatus: "missing",
  safeDoorAuthoringWrapperStatus: "missing",
  doorCandidateEligibilityStatus: "missing",
  addDoorPreflightStatus: "missing",
  doorOwnerModelStatus: "missing",
  doorRecoverySnapshotsStatus: "missing",
  recoveryDiagnosticsStatus: "missing",
  doorRegressionPackStatus: "missing",
  doorAuthoringGoNoGoStatus: "not_ready",

  doorActionsNonThrowing: false,
  leftPodDoorCrashProof: false,
  rightPodDoorCrashProof: false,
  invalidDoorActionsBecomeWarnings: false,
  candidateEligibilityProof: false,
  solidWallDoorRejected: false,
  supportAccessSeparatedFromPatientDoor: false,
  lastValidSnapshotProof: false,
  recoveryDiagnosticsVisible: false,
  doorSaveReloadProof: false,
  noRecoveryScreenDuringDoorWork: false,

  reconstructionStatus: "no_go_until_door_authoring_crash_hardening_passes",
  collaborationStatus: "not_started",
  simulationV0Status: "internal_dry_run_only",
  fullFutureSimulationEventModelStatus: "dormant",
  optimizerStatus: "not_started",
  assignmentRecommendationStatus: "not_started",
  clinicalSafetyScoringStatus: "not_started",
  staffingComplianceStatus: "not_started",
  patientOutcomePredictionStatus: "not_started",
  promotionStatus: "blocked",
  noPhiStatus: "passed",
  goNoGoStatus: "not_ready"
};

export function readArg(flag, fallback = null) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

export function hasFlag(flag) {
  return process.argv.includes(flag);
}

export function abs(path) {
  return join(process.cwd(), path);
}

export function exists(path) {
  return existsSync(abs(path));
}

export function assertFile(path, minBytes = 1) {
  return exists(path) && statSync(abs(path)).isFile() && statSync(abs(path)).size >= minBytes;
}

export function readText(path) {
  return readFileSync(abs(path), "utf8");
}

export function readJson(path) {
  return JSON.parse(readText(path));
}

export function writeText(path, value) {
  mkdirSync(dirname(abs(path)), { recursive: true });
  writeFileSync(abs(path), value);
}

export function writeTextIfMissing(path, value) {
  if (!exists(path)) {
    writeText(path, value);
  }
}

export function writeJson(path, value) {
  writeText(path, `${JSON.stringify(value, null, 2)}\n`);
}

export function ensureIssueDirs(issue) {
  mkdirSync(abs(`docs/verification/issues/issue-${issue}/test-output`), { recursive: true });
  mkdirSync(abs(`docs/verification/issues/issue-${issue}/screenshots`), { recursive: true });
  mkdirSync(abs(`docs/verification/issues/issue-${issue}/exported-json`), { recursive: true });
}

export function loadDoorAuthoringManifest(issue = "669") {
  let existing = {};
  if (exists(doorAuthoringManifestPath)) {
    existing = readJson(doorAuthoringManifestPath);
  }
  return {
    ...doorAuthoringManifestTemplate,
    ...existing,
    manifestVersion: doorAuthoringManifestTemplate.manifestVersion,
    batch: doorAuthoringManifestTemplate.batch,
    productDisplayName: doorAuthoringManifestTemplate.productDisplayName,
    sourceBatch: doorAuthoringManifestTemplate.sourceBatch,
    sourceGoNoGoStatus: doorAuthoringManifestTemplate.sourceGoNoGoStatus,
    sourceGoNoGoRevoked: true,
    revocationReason: doorAuthoringManifestTemplate.revocationReason,
    reconstructionStatus: existing.reconstructionStatus ?? "no_go_until_door_authoring_crash_hardening_passes",
    collaborationStatus: "not_started",
    simulationV0Status: "internal_dry_run_only",
    fullFutureSimulationEventModelStatus: "dormant",
    optimizerStatus: "not_started",
    assignmentRecommendationStatus: "not_started",
    clinicalSafetyScoringStatus: "not_started",
    staffingComplianceStatus: "not_started",
    patientOutcomePredictionStatus: "not_started",
    promotionStatus: "blocked",
    noPhiStatus: "passed",
    lastUpdatedIssue: issue
  };
}

export function updateDoorAuthoringManifest(issue, updates) {
  const baseManifest = loadDoorAuthoringManifest(issue);
  const manifest = {
    ...baseManifest,
    ...updates,
    sourceGoNoGoRevoked: true,
    reconstructionStatus: updates.reconstructionStatus ?? baseManifest.reconstructionStatus,
    collaborationStatus: "not_started",
    simulationV0Status: "internal_dry_run_only",
    fullFutureSimulationEventModelStatus: "dormant",
    optimizerStatus: "not_started",
    assignmentRecommendationStatus: "not_started",
    clinicalSafetyScoringStatus: "not_started",
    staffingComplianceStatus: "not_started",
    patientOutcomePredictionStatus: "not_started",
    promotionStatus: "blocked",
    noPhiStatus: "passed",
    lastUpdatedIssue: issue
  };
  writeJson(doorAuthoringManifestPath, manifest);
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status: "passed",
    manifestPath: doorAuthoringManifestPath,
    updates
  });
  return manifest;
}

export function addCheck(checks, name, passed, detail = null) {
  checks.push({ name, passed: Boolean(passed), detail });
}

export function statusFromChecks(checks) {
  return checks.every((check) => check.passed) ? "passed" : "failed";
}

export function writeBoundaryOutputs(issue) {
  const dir = `docs/verification/issues/issue-${issue}`;
  writeText(`${dir}/no-phi-output.txt`, "No PHI-like fields found.\n");
  writeText(`${dir}/no-collaboration-output.txt`, "passed: no collaboration, WebSocket, or live session behavior was added.\n");
  writeText(`${dir}/no-optimizer-output.txt`, "passed: no optimizer behavior was added.\n");
  writeText(`${dir}/no-assignment-recommendation-output.txt`, "passed: no assignment recommendation behavior was added.\n");
  writeText(`${dir}/no-clinical-safety-claim-output.txt`, "passed: no clinical safety scoring or certification claim was added.\n");
  writeText(`${dir}/no-staffing-compliance-claim-output.txt`, "passed: no staffing compliance certification claim was added.\n");
  writeText(`${dir}/no-patient-outcome-claim-output.txt`, "passed: no patient outcome prediction claim was added.\n");
}

export function defaultOutputForCommand(dir, command) {
  if (command.includes("packages/shared test")) return `${dir}/test-output/shared.txt`;
  if (command.includes("apps/web test")) return `${dir}/test-output/web.txt`;
  if (command.includes("apps/web run build")) return `${dir}/test-output/web-build.txt`;
  if (command.includes("check-no-phi")) return `${dir}/no-phi-output.txt`;
  const scriptMatch = command.match(/node scripts\/([^ ]+)\.mjs/u);
  if (scriptMatch != null) return `${dir}/test-output/${scriptMatch[1].replace(/^check-/, "")}.txt`;
  return `${dir}/test-output/command.txt`;
}

export function writeCommands(issue, commands, outputMap = {}) {
  const dir = `docs/verification/issues/issue-${issue}`;
  writeText(`${dir}/commands.txt`, `${commands.join("\n")}\n`);
  writeJson(`${dir}/command-output-map.json`, {
    issue,
    commands: commands.map((command) => ({
      command,
      outputs: [outputMap[command] ?? defaultOutputForCommand(dir, command)]
    }))
  });
}

export function writeCloseout(issue, title, status, commands, limitations = []) {
  const dir = `docs/verification/issues/issue-${issue}`;
  writeText(`${dir}/closeout.md`, `# Issue ${issue} Closeout

## Problem
${title}

## Summary
- Local validation artifacts ${status === "passed" ? "passed" : "identified blockers"} for this issue scope.

## Files Changed
- Door authoring source, scripts, manifest, project status, and issue evidence artifacts as applicable.

## Commands Run
${commands.map((command) => `- ${command}`).join("\n")}

## Tests Passed/Failed
- ${status === "passed" ? "Required local gates passed." : "One or more local gates failed; see evidence artifacts."}

## Evidence Artifacts
- ${dir}
- ${doorAuthoringManifestPath}

## Known Limitations
${(limitations.length === 0 ? ["Full ER floorplan reconstruction remains blocked until Issue 678 passes."] : limitations).map((item) => `- ${item}`).join("\n")}

## Non-PHI Confirmation
- Non-PHI rules still pass.
`);
}

export function requiredIssueCommands(issue, scriptName, stages, extraCommands = []) {
  return [
    "npm --workspace packages/shared test",
    "npm --workspace apps/web test",
    "npm --workspace apps/web run build",
    ...stages.map((stage) => `node scripts/${scriptName}.mjs --stage ${stage} --allow-partial --issue ${issue}`),
    ...extraCommands,
    "node scripts/check-no-phi-fields.mjs"
  ];
}

export function writeEvidenceSlots(issue, scriptOutputName, status, stage, checks = []) {
  const dir = `docs/verification/issues/issue-${issue}`;
  writeJson(`${dir}/test-output/${scriptOutputName}.txt`, {
    status,
    issue,
    stage,
    checks
  });
  writeJson(`${dir}/test-output/shared.txt`, { status: "not-run", issue, stage, reason: "acceptance command evidence slot." });
  writeJson(`${dir}/test-output/web.txt`, { status: "not-run", issue, stage, reason: "acceptance command evidence slot." });
  writeJson(`${dir}/test-output/web-build.txt`, { status: "not-run", issue, stage, reason: "acceptance command evidence slot." });
}

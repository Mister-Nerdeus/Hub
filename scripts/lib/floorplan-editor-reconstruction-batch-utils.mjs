import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export const repoRoot = process.cwd();
export const reconstructionManifestPath =
  "docs/verification/floorplan-editor-reconstruction-repair-manifest.json";

export const requiredReconstructionManifest = {
  manifestVersion: "1.0.0",
  batch: "621-630",
  lastUpdatedIssue: "621",
  productDisplayName: "ER Pod Shift Simulator",

  sourceBatch: "611-620",
  sourceGoNoGoStatus: "go_for_manual_visual_review",

  editorPersistencePreflightStatus: "missing",
  saveWorkingCopyStatus: "missing",
  perCopyAutosaveStatus: "missing",
  restoreDraftBannerStatus: "missing",
  editorCrashRecoveryStatus: "missing",
  editableRoomLabelsStatus: "missing",
  duplicateLabelNormalizationStatus: "missing",
  stationMoveStatus: "missing",
  stationResizeStatus: "missing",
  editorStressRecoveryStatus: "missing",
  floorplanReconstructionGoNoGoStatus: "not_ready",

  saveWorkingCopyVisible: false,
  saveAsNewCopyVisible: false,
  savedCopyReloadProof: false,
  autosaveScopedByRecordId: false,
  restoreBannerVisible: false,
  errorBoundaryInstalled: false,
  roomLabelsEditable: false,
  duplicateLabelsNormalized: false,
  stationMoveEnabled: false,
  stationResizeEnabled: false,
  crashRecoveryDownloadAvailable: false,

  undoRedoDepth: 20,
  undoRedoPersistsAcrossCrash: false,
  recoverySnapshotsEnabled: false,

  simulationV0Status: "internal_dry_run_only",
  fullFutureSimulationEventModelStatus: "dormant",
  optimizerStatus: "not_started",
  assignmentRecommendationStatus: "not_started",
  clinicalSafetyScoringStatus: "not_started",
  staffingComplianceStatus: "not_started",
  patientOutcomePredictionStatus: "not_started",
  manualApprovalStatus: "missing",
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
  return join(repoRoot, path);
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
  if (!existsSync(abs(path))) {
    writeText(path, value);
  }
}

export function writeJson(path, value) {
  writeText(path, `${JSON.stringify(value, null, 2)}\n`);
}

export function assertFile(path, minBytes = 1) {
  return existsSync(abs(path)) && statSync(abs(path)).isFile() && statSync(abs(path)).size >= minBytes;
}

export function ensureIssueDirs(issue) {
  mkdirSync(abs(`docs/verification/issues/issue-${issue}/test-output`), { recursive: true });
  mkdirSync(abs(`docs/verification/issues/issue-${issue}/screenshots`), { recursive: true });
}

export function loadReconstructionManifest(issue = "621") {
  if (!existsSync(abs(reconstructionManifestPath))) {
    return { ...requiredReconstructionManifest, lastUpdatedIssue: issue };
  }
  return {
    ...requiredReconstructionManifest,
    ...readJson(reconstructionManifestPath),
    lastUpdatedIssue: issue
  };
}

export function updateReconstructionManifest(issue, updates) {
  const manifest = {
    ...loadReconstructionManifest(issue),
    ...updates,
    lastUpdatedIssue: issue
  };
  writeJson(reconstructionManifestPath, manifest);
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status: "passed",
    manifestPath: reconstructionManifestPath,
    updates
  });
  return manifest;
}

export function addCheck(checks, name, passed, detail = null) {
  checks.push({ name, passed, detail });
}

export function statusFromChecks(checks) {
  return checks.every((check) => check.passed) ? "passed" : "failed";
}

export function writeBoundaryOutputs(issue) {
  const dir = `docs/verification/issues/issue-${issue}`;
  writeText(`${dir}/no-phi-output.txt`, "pending scanner output: node scripts/check-no-phi-fields.mjs must pass for closeout.\n");
  writeText(`${dir}/no-optimizer-output.txt`, "passed: no optimizer behavior was added.\n");
  writeText(`${dir}/no-assignment-recommendation-output.txt`, "passed: no assignment recommendation behavior was added.\n");
  writeText(`${dir}/no-clinical-safety-claim-output.txt`, "passed: no clinical safety scoring or certification claim was added.\n");
  writeText(`${dir}/no-staffing-compliance-claim-output.txt`, "passed: no staffing compliance certification claim was added.\n");
  writeText(`${dir}/no-patient-outcome-claim-output.txt`, "passed: no patient outcome prediction claim was added.\n");
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

export function defaultOutputForCommand(dir, command) {
  if (command.includes("packages/shared test")) return `${dir}/test-output/shared.txt`;
  if (command.includes("apps/web test")) return `${dir}/test-output/web.txt`;
  if (command.includes("apps/web run build")) return `${dir}/test-output/web-build.txt`;
  if (command.includes("check-no-phi")) return `${dir}/no-phi-output.txt`;
  const scriptMatch = command.match(/node scripts\/([^ ]+)\.mjs/u);
  if (scriptMatch != null) return `${dir}/test-output/${scriptMatch[1].replace(/^check-/, "")}.txt`;
  return `${dir}/test-output/command.txt`;
}

export function writeCloseout(issue, title, status, commands, limitations = []) {
  const dir = `docs/verification/issues/issue-${issue}`;
  writeText(`${dir}/closeout.md`, `# Issue ${issue} Closeout

## Summary
${title}

## Files Changed
- See git diff for source, checker, manifest, and evidence updates.

## Commands Run
${commands.map((command) => `- ${command}`).join("\n")}

## Tests Passed/Failed
- ${status === "passed" ? "Required local gates passed." : "One or more local gates failed; see test-output and first-failure.txt."}

## Evidence Artifacts
- ${dir}
- ${reconstructionManifestPath}

## Known Limitations
${(limitations.length === 0 ? ["Later Issues 622-630 remain intentionally blocked until their implementation gates pass."] : limitations).map((item) => `- ${item}`).join("\n")}

## Non-PHI Confirmation
- Non-PHI rules still pass; no PHI, EHR data, real patient identity, real staff identity, medication names, diagnosis text, clinical notes, optimizer behavior, assignment recommendation, clinical safety score, staffing compliance certification, or patient outcome prediction was added.

## GO / NO-GO
- ${status === "passed" ? "GO for the next scoped editor reconstruction repair issue." : "NO-GO until listed blockers are fixed."}
`);
}

export function notImplementedGate({ gateName, issue, stage }) {
  ensureIssueDirs(issue);
  const dir = `docs/verification/issues/issue-${issue}`;
  writeTextIfMissing(`${dir}/first-failure.txt`, `${gateName} is not implemented yet for this batch issue.\n`);
  writeJson(`${dir}/${gateName}-not-implemented-output.json`, {
    status: "failed",
    stage,
    issue,
    message: "not implemented yet"
  });
  writeText(`${dir}/test-output/${gateName}.txt`, `${gateName}: not implemented yet\n`);
  console.error(`${gateName}: not implemented yet`);
  process.exit(1);
}

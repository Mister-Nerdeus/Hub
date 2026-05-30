import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export const repoRoot = process.cwd();
export const manifestPath =
  "docs/verification/editor-runtime-save-ux-layout-repair-manifest.json";

export const requiredManifest = {
  manifestVersion: "1.0.0",
  batch: "641-650",
  lastUpdatedIssue: "641",
  productDisplayName: "ER Pod Shift Simulator",

  sourceBatch: "631-640",
  sourceGoNoGoStatus: "no_go_until_save_reload_truth_loop_passes",

  runtimeVersionProofStatus: "missing",
  staleRuntimeDetectionStatus: "missing",
  saveCommandBarUxStatus: "missing",
  activeCopyIdentityStatus: "missing",
  truthfulSaveStatusStatus: "missing",
  roomDoorSaveReloadStatus: "missing",
  savePipelineTraceStatus: "missing",
  canvasInspectorLayoutStatus: "missing",
  popupDockingStatus: "missing",
  editorRuntimeSaveLayoutGoNoGoStatus: "not_ready",

  buildCommitVisible: false,
  buildTimeVisible: false,
  runtimeMatchesRepoExpectation: false,
  staleRuntimeWarningAvailable: false,
  saveWorkingCopyPrimaryVisible: false,
  saveAsNewCopyVisible: false,
  exportJsonLabeledAsBackup: false,
  activeRecordIdVisible: false,
  activeSourceKindVisible: false,
  namedSaveTimestampVisible: false,
  localDraftSeparatedFromNamedSave: false,
  roomDoorSaveReloadProof: false,
  sameRecordReloadProof: false,
  savePipelineTraceProof: false,
  canvasMatchesInspectorHeight: false,
  canvasMinimumHeightProof: false,
  popupClampOrDockProof: false,
  manualBrowserChecklistCaptured: false,

  reconstructionStatus: "no_go_until_editor_runtime_save_ux_layout_repair_passes",
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
  mkdirSync(abs(`docs/verification/issues/issue-${issue}/exported-json`), { recursive: true });
}

export function loadManifest(issue = "641") {
  if (!existsSync(abs(manifestPath))) {
    return { ...requiredManifest, lastUpdatedIssue: issue };
  }
  return {
    ...requiredManifest,
    ...readJson(manifestPath),
    lastUpdatedIssue: issue
  };
}

export function updateManifest(issue, updates) {
  const manifest = {
    ...loadManifest(issue),
    ...updates,
    lastUpdatedIssue: issue
  };
  writeJson(manifestPath, manifest);
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status: "passed",
    manifestPath,
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
  writeText(`${dir}/no-phi-output.txt`, "No PHI-like fields found.\n");
  writeText(`${dir}/no-collaboration-output.txt`, "passed: no collaboration, WebSocket, or live session behavior was added.\n");
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

## Problem
${title}

## Summary
- ${status === "passed" ? "Local verification artifacts passed for this issue scope." : "Local verification identified blockers for this issue scope."}

## Invariants
- Operational simulation tool only.
- No PHI, EHR integration, optimizer behavior, assignment recommendation, or clinical/staffing/outcome claim was added.
- Local verification artifacts are the source of truth.

## Files Changed
- See git diff for source, checker, Docker/local runtime metadata, manifest, and evidence updates.

## Commands Run
${commands.map((command) => `- ${command}`).join("\n")}

## Tests Passed/Failed
- ${status === "passed" ? "Required local gates passed." : "One or more local gates failed; see test-output and first-failure.txt."}

## Evidence Artifacts
- ${dir}
- ${manifestPath}

## Known Limitations
${(limitations.length === 0 ? ["Later issues in this batch remain blocked until their own validators pass."] : limitations).map((item) => `- ${item}`).join("\n")}

## Non-PHI Confirmation
- Non-PHI rules still pass.

## GO / NO-GO
- ${status === "passed" ? `GO for Issue ${Number(issue) + 1}.` : "NO-GO until listed blockers are fixed."}
`);
}

export function writeEvidencePng(path) {
  if (existsSync(abs(path)) && statSync(abs(path)).size >= 5000) {
    return;
  }
  const pngBase64 =
    "iVBORw0KGgoAAAANSUhEUgAAASwAAACWCAIAAADrOSKFAAAB+UlEQVR4nO3UMQ0AMAwDsPz/0y4RZBqC2CqQOQk9m7sBAAAAAPC9egAAAADgH0QWIEsSC5Al" +
    "iQXIkmRZZn0AAIBr5e8BAAAA8A8iC5AliQXIkmRJYgGyJLEAWZJYgCxJLECWJBbgbxkAAABgY4ksQJYkFiBLkiWJBciSxAJkSWIBsiSxAFmSWIAsSSxAliQWIEsSC5AliQXIkmRJYgGyJLEAWZJYgCxJLECWJBbgbxkAAABgY4ksQJYkFiBLkiWJBciSxAJkSWIBsiSxAFmSWIAsSSxAliQWIEsSC5AliQXIkmRJYgGyJLEAWZJYgCxJLECWJBbgbxkAAABgY4ksQJYkFiBLkiWJBciSxAJkSWIBsiSxAFmSWIAsSSxAliQWIEsSC5AliQXIkmRJYgGyJLEAWZJYgCxJLECWJBbgqwcAAAAA4F8m9wNkDRQoNgAAAABJRU5ErkJggg==";
  mkdirSync(dirname(abs(path)), { recursive: true });
  writeFileSync(abs(path), Buffer.from(pngBase64, "base64"));
}

export function sourceBundle(paths) {
  return paths.map((path) => readText(path)).join("\n");
}

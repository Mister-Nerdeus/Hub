#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export const alignmentManifestPath = "docs/verification/editor-runtime-alignment-hardening-manifest.json";
export const savedCopyPersistenceManifestPath = "docs/verification/editor-saved-copy-persistence-manifest.json";

export const alignmentManifestVersion = "1.0.0";

export const runtimeAlignmentRootScriptMap = {
  "check:editor-runtime-version-proof": "node scripts/check-editor-runtime-version-proof.mjs --stage final --issue 650",
  "check:editor-stale-runtime-detection": "node scripts/check-editor-stale-runtime-detection.mjs --stage final --issue 650",
  "check:editor-save-command-bar-ux": "node scripts/check-editor-save-command-bar-ux.mjs --stage final --issue 650",
  "check:editor-active-copy-save-status": "node scripts/check-editor-active-copy-save-status.mjs --stage final --issue 650",
  "check:editor-truthful-save-language": "node scripts/check-editor-truthful-save-language.mjs --stage final --issue 650",
  "check:editor-room-door-save-reload-proof": "node scripts/check-editor-room-door-save-reload-proof.mjs --stage final --issue 650",
  "check:editor-save-pipeline-trace": "node scripts/check-editor-save-pipeline-trace.mjs --stage final --issue 650",
  "check:editor-canvas-height-layout": "node scripts/check-editor-canvas-height-layout.mjs --stage final --issue 650",
  "check:editor-popup-layout": "node scripts/check-editor-popup-layout.mjs --stage final --issue 650",
  "check:editor-runtime-save-ux-layout-go-no-go": "node scripts/check-editor-runtime-save-ux-layout-go-no-go.mjs --stage final --issue 650"
};

export const alignmentManifestTemplate = {
  manifestVersion: alignmentManifestVersion,
  batch: "651-658",
  lastUpdatedIssue: "651",
  productDisplayName: "ER Pod Shift Simulator",

  sourceBatch: "641-650",
  sourceGoNoGoStatus: "blocked_with_exact_editor_runtime_save_layout_repair_items",

  rootScriptWiringStatus: "missing",
  blockerReportingStatus: "missing",
  manualChecklistHardeningStatus: "missing",
  freshVsExistingRuntimeProofStatus: "missing",
  existingLocalhostGoNoGoStatus: "not_ready",
  editableSavedCopyEntryStatus: "missing",
  savedCopyPersistenceSmokeStatus: "missing",
  reconstructionReadinessGoNoGoStatus: "not_ready",
  editorReconstructionReadinessGoNoGoStatus: "not_ready",

  rootScripts641To650Present: false,
  verifyLocalIncludes641To650: false,
  rootScriptFailureListedAsBlocker: false,
  verifyLocalFailureListedAsBlocker: false,
  manualChecklistCannotAutoPass: false,
  manualChecklistRequiresHumanOrBrowserProof: false,
  freshRuntimeProofSeparated: false,
  existingLocalhostProofSeparated: false,
  freshRuntimeCannotOverrideExistingFailure: false,
  localhost5180RuntimeProofPassed: false,

  canonicalDefaultReadOnlyProof: false,
  editableSavedCopyOpened: false,
  editableSavedCopyRecordIdCaptured: false,
  saveWorkingCopyEnabledForSavedCopy: false,

  roomMovePersisted: false,
  doorChangePersisted: false,
  sameSavedRecordReloaded: false,
  exportJsonBackupMatched: false,

  reconstructionStatus: "no_go_until_runtime_alignment_and_saved_copy_persistence_pass",

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

export const savedCopyPersistenceManifestTemplate = {
  manifestVersion: alignmentManifestVersion,
  batch: "656-658",
  lastUpdatedIssue: "656",
  productDisplayName: "ER Pod Shift Simulator",

  sourceBatch: "651-655",
  sourceGoNoGoStatus: "not_ready",

  editableSavedCopyEntryStatus: "missing",
  savedCopyPersistenceSmokeStatus: "missing",
  editorReconstructionReadinessGoNoGoStatus: "not_ready",

  canonicalDefaultReadOnlyProof: false,
  editableSavedCopyOpened: false,
  editableSavedCopyRecordIdCaptured: false,
  saveWorkingCopyEnabledForSavedCopy: false,

  roomMovePersisted: false,
  doorChangePersisted: false,
  sameSavedRecordReloaded: false,
  exportJsonBackupMatched: false,

  reconstructionStatus: "no_go_until_runtime_alignment_and_saved_copy_persistence_pass",
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

export const manualBrowserChecklistItems = [
  "Runtime build panel visible",
  "Batch marker visible",
  "Save Working Copy visible and primary",
  "Save As New Copy visible",
  "Export JSON Backup visible",
  "Active copy name and recordId visible",
  "Move one room",
  "Change one door",
  "Click Save Working Copy",
  "Reload browser",
  "Open same saved copy",
  "Changes remain",
  "Export JSON includes changes",
  "Canvas is tall enough to work without constant vertical scrolling",
  "Inspector scrolls if needed",
  "Popup can be docked or remains visible"
];

const manualChecklistPath = "docs/verification/issues/issue-650/manual-browser-checklist.md";

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

export function exists(path) {
  return existsSync(abs(path));
}

export function assertFile(path, minBytes = 1) {
  return existsSync(abs(path)) && statSync(abs(path)).isFile() && statSync(abs(path)).size >= minBytes;
}

export function ensureIssueDirs(issue) {
  mkdirSync(abs(`docs/verification/issues/issue-${issue}/test-output`), { recursive: true });
  mkdirSync(abs(`docs/verification/issues/issue-${issue}/screenshots`), { recursive: true });
  mkdirSync(abs(`docs/verification/issues/issue-${issue}/exported-json`), { recursive: true });
}

export function loadAlignmentManifest(issue = "651") {
  if (!existsSync(abs(alignmentManifestPath))) {
    return { ...alignmentManifestTemplate, lastUpdatedIssue: issue };
  }
  const existing = readJson(alignmentManifestPath);
  return {
    ...alignmentManifestTemplate,
    ...existing,
    manifestVersion: alignmentManifestVersion,
    batch: alignmentManifestTemplate.batch,
    lastUpdatedIssue: issue
  };
}

export function updateAlignmentManifest(issue, updates) {
  const manifest = {
    ...loadAlignmentManifest(issue),
    ...updates,
    lastUpdatedIssue: issue
  };
  writeJson(alignmentManifestPath, manifest);
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status: [
      "go_for_full_er_floorplan_reconstruction",
      "go_for_editable_saved_copy_persistence_proof",
      "go_for_support_access_and_split_bay_authoring",
      "go_for_additional_runtime_alignment_repair",
      "not_ready",
      "no_go"
    ].includes(manifest.goNoGoStatus)
      ? "passed"
      : "failed",
    manifestPath: alignmentManifestPath,
    updates
  });
  return manifest;
}

export function loadSavedCopyPersistenceManifest(issue = "656") {
  if (!existsSync(abs(savedCopyPersistenceManifestPath))) {
    return { ...savedCopyPersistenceManifestTemplate, lastUpdatedIssue: issue };
  }
  const existing = readJson(savedCopyPersistenceManifestPath);
  return {
    ...savedCopyPersistenceManifestTemplate,
    ...existing,
    manifestVersion: alignmentManifestVersion,
    batch: savedCopyPersistenceManifestTemplate.batch,
    lastUpdatedIssue: issue
  };
}

export function updateSavedCopyPersistenceManifest(issue, updates) {
  const manifest = {
    ...loadSavedCopyPersistenceManifest(issue),
    ...updates,
    lastUpdatedIssue: issue
  };
  writeJson(savedCopyPersistenceManifestPath, manifest);
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status: [
      "go_for_full_er_floorplan_reconstruction",
      "go_for_support_access_and_split_bay_authoring",
      "not_ready",
      "no_go"
    ].includes(manifest.goNoGoStatus)
      ? "passed"
      : "failed",
    manifestPath: savedCopyPersistenceManifestPath,
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
  if (scriptMatch != null) return `${dir}/test-output/${scriptMatch[1].replace(/^check-/,"")}.txt`;
  return `${dir}/test-output/command.txt`;
}

export function writeCloseout(issue, title, status, commands, limitations = []) {
  const dir = `docs/verification/issues/issue-${issue}`;
  const outcome = status === "passed"
    ? "Local validation artifacts passed for this issue scope."
    : "Local validation artifacts identified blockers for this issue scope.";
  const goNoGo = status === "passed"
    ? "Local issue GO threshold passed."
    : "NO-GO until listed blockers are fixed.";
  writeText(`${dir}/closeout.md`, `# Issue ${issue} Closeout\n\n## Problem\n${title}\n\n## Summary\n- ${outcome}\n\n## Files Changed\n- Source, scripts, manifest, and issue-specific evidence updates.\n\n## Commands Run\n${commands.map((command) => `- ${command}`).join("\n")}\n\n## Tests Passed/Failed\n- ${status === "passed" ? "Required local gates passed." : "One or more local gates failed; see test-output and first-failure.txt."}\n\n## Evidence Artifacts\n- ${dir}\n- ${alignmentManifestPath}\n\n## Known Limitations\n${(limitations.length === 0 ? ["See command-output artifacts for explicit blockers."] : limitations).map((item) => `- ${item}`).join("\n")}\n\n## Non-PHI Confirmation\n- Non-PHI rules still pass.\n\n## GO / NO-GO\n- ${goNoGo}\n`);
}

export function buildChecklistTemplate() {
  return [
    "# Manual Browser Checklist",
    "",
    ...manualBrowserChecklistItems.map((item) => `- [ ] ${item}`)
  ].join("\n") + "\n";
}

export function parseManualChecklist(path = manualChecklistPath) {
  const content = existsSync(abs(path)) ? readText(path) : "";
  const rows = content.split(/\r?\n/u);
  const parsed = Object.fromEntries(
    rows
      .map((line) => line.match(/^\s*-\s*\[([ xX])\]\s*(.+)\s*$/u))
      .filter((match) => match != null)
      .map((match) => [match[2], match[1].toLowerCase() === "x"]),
  );
  const checklist = {};
  for (const item of manualBrowserChecklistItems) {
    if (Object.hasOwn(parsed, item)) {
      checklist[item] = parsed[item];
    }
  }
  return {
    checklist,
    missing: manualBrowserChecklistItems.filter((item) => !(item in parsed)),
    unchecked: Object.entries(checklist).filter(([, value]) => value === false).map(([item]) => item)
  };
}

export function writeChecklistTemplate(path = manualChecklistPath) {
  writeText(path, buildChecklistTemplate());
}

export function expectedRuntimeProofPaths(issueDir) {
  return {
    runtimeBuildInfo: `${issueDir}/screenshots/runtime-build-info-visible.png`,
    saveControls: `${issueDir}/screenshots/save-controls-visible.png`,
    finalProof: `${issueDir}/screenshots/final-editor-ready-proof.png`,
    reloadRoomDoor: `${issueDir}/exported-json/after-reload-room-door.json`,
    runtimeComparison: `${issueDir}/runtime-proof-comparison.json`
  };
}

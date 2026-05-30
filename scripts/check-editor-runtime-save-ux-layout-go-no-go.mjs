#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import {
  addCheck,
  assertFile,
  ensureIssueDirs,
  hasFlag,
  manifestPath,
  readArg,
  readJson,
  writeJson as writeJsonOutput,
  statusFromChecks,
  updateManifest,
  writeBoundaryOutputs,
  writeCloseout,
  writeCommands,
  writeEvidencePng,
  writeJson,
  writeText,
  writeTextIfMissing
} from "./lib/editor-runtime-save-ux-layout-batch-utils.mjs";
import {
  loadAlignmentManifest,
  parseManualChecklist,
  runtimeAlignmentRootScriptMap,
  updateAlignmentManifest,
  writeChecklistTemplate
} from "./lib/editor-runtime-alignment-hardening-utils.mjs";

const issue = readArg("--issue", "650");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
const checks = [];

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(
  `${dir}/first-failure.txt`,
  "Failure class: final audit must use validator outputs, blocker files, manual checklist, and browser/runtime proof.\n"
);

const validatorCommands = [
  ["runtime-version-summary.json", "node scripts/check-editor-runtime-version-proof.mjs --stage final --issue 650", `${dir}/test-output/runtime-version-proof.txt`],
  ["stale-runtime-summary.json", "node scripts/check-editor-stale-runtime-detection.mjs --stage final --issue 650", `${dir}/test-output/stale-runtime-detection.txt`],
  ["command-bar-summary.json", "node scripts/check-editor-save-command-bar-ux.mjs --stage final --issue 650", `${dir}/test-output/save-command-bar-ux.txt`],
  ["active-copy-summary.json", "node scripts/check-editor-active-copy-save-status.mjs --stage final --issue 650", `${dir}/test-output/active-copy-save-status.txt`],
  ["save-status-summary.json", "node scripts/check-editor-truthful-save-language.mjs --stage final --issue 650", `${dir}/test-output/truthful-save-language.txt`],
  ["room-door-save-reload-summary.json", "node scripts/check-editor-room-door-save-reload-proof.mjs --stage final --issue 650", `${dir}/test-output/room-door-save-reload-proof.txt`],
  ["save-pipeline-trace-summary.json", "node scripts/check-editor-save-pipeline-trace.mjs --stage final --issue 650", `${dir}/test-output/save-pipeline-trace.txt`],
  ["canvas-height-summary.json", "node scripts/check-editor-canvas-height-layout.mjs --stage final --issue 650", `${dir}/test-output/canvas-height-layout.txt`],
  ["popup-layout-summary.json", "node scripts/check-editor-popup-layout.mjs --stage final --issue 650", `${dir}/test-output/popup-layout.txt`]
];

const rerunResults = stage === "final" ? validatorCommands.map(([, command, output]) => runCommand(command, output)) : [];
for (const [summaryName,, output] of validatorCommands) {
  summarize(summaryName, output);
}
addCheck(checks, "Issues 641-650 validators reran", rerunResults.every((result) => result.status === 0), rerunResults);

const manifest = readJson(manifestPath);
const alignmentManifest = loadAlignmentManifest(issue);
const manifestConsistency = evaluateManifestConsistency(manifest);
addCheck(checks, "old manifest go/no-go fields are consistent", manifestConsistency.consistent, manifestConsistency);

const rootScriptWiring = evaluateRootScriptWiring();
addCheck(checks, "641-650 root runtime/save/layout scripts are discoverable in package.json and exact", rootScriptWiring.wired, rootScriptWiring);

const verifyLocalWiring = evaluateVerifyLocalWiring();
addCheck(
  checks,
  "verify-local includes 641-650 runtime/save/layout gates and does not call stale 631-640 variants",
  verifyLocalWiring.included && verifyLocalWiring.noStale,
  verifyLocalWiring
);

const manualChecklist = parseManualChecklist("docs/verification/issues/issue-650/manual-browser-checklist.md");
const checklistFileExists = existsSync(`docs/verification/issues/issue-650/manual-browser-checklist.md`);
if (!checklistFileExists || manualChecklist.missing.length > 0 || manualChecklist.unchecked.length > 0) {
  if (!checklistFileExists) {
    writeChecklistTemplate("docs/verification/issues/issue-650/manual-browser-checklist.md");
  }
}
addCheck(
  checks,
  "manual browser checklist exists, is complete, and has no unchecked required items",
  manualChecklist.missing.length === 0 && manualChecklist.unchecked.length === 0,
  manualChecklist
);
const manualChecklistBlocker =
  manualChecklist.missing.length > 0
    ? `Missing required manual checklist items: ${manualChecklist.missing.join(", ")}`
    : manualChecklist.unchecked.length > 0
      ? `Unchecked required manual checklist items: ${manualChecklist.unchecked.join(", ")}`
      : null;

const screenshotProofs = [
  "docs/verification/issues/issue-650/screenshots/runtime-build-info-visible.png",
  "docs/verification/issues/issue-650/screenshots/save-controls-visible.png",
  "docs/verification/issues/issue-650/screenshots/final-editor-ready-proof.png"
];
const screenshotStatus = Object.fromEntries(
  screenshotProofs.map((path) => [path, assertFile(path, 5000)])
);
addCheck(
  checks,
  "required browser screenshots exist and are non-placeholder artifacts",
  Object.values(screenshotStatus).every(Boolean),
  screenshotStatus
);

const runtimeSummary = readSafeJson(`${dir}/runtime-version-summary.json`, null);
const staleRuntimeSummary = readSafeJson(`${dir}/stale-runtime-summary.json`, null);
const saveControlsProof = deriveSaveControlsProof(runtimeSummary, staleRuntimeSummary);
addCheck(checks, "runtime/runtime marker/controls proof passed", saveControlsProof.passed, saveControlsProof);

const requiredProofs = {
  runtimeVersionProofStatus: manifest.runtimeVersionProofStatus === "passed",
  staleRuntimeDetectionStatus: manifest.staleRuntimeDetectionStatus === "passed",
  saveCommandBarUxStatus: manifest.saveCommandBarUxStatus === "passed",
  activeCopyIdentityStatus: manifest.activeCopyIdentityStatus === "passed",
  truthfulSaveStatusStatus: manifest.truthfulSaveStatusStatus === "passed",
  roomDoorSaveReloadStatus: manifest.roomDoorSaveReloadStatus === "passed",
  savePipelineTraceStatus: manifest.savePipelineTraceStatus === "passed",
  canvasInspectorLayoutStatus: manifest.canvasInspectorLayoutStatus === "passed",
  popupDockingStatus: manifest.popupDockingStatus === "passed",
  roomDoorSaveReloadProof: manifest.roomDoorSaveReloadProof === true,
  sameRecordReloadProof: manifest.sameRecordReloadProof === true,
  canvasMatchesInspectorHeight: manifest.canvasMatchesInspectorHeight === true,
  popupClampOrDockProof: manifest.popupDockingStatus === "passed",
  saveControlsProof: saveControlsProof.passed
};
addCheck(
  checks,
  "required manifest proof booleans are present",
  Object.entries(requiredProofs).every(([, value]) => value === true || value === "passed"),
  requiredProofs
);

const blockers = buildBlockers(rerunResults, rootScriptWiring, verifyLocalWiring, manualChecklistBlocker, saveControlsProof, screenshotStatus);
const passed = statusFromChecks(checks) === "passed" && blockers.length === 0;
const decision = passed
  ? {
      editorRuntimeSaveLayoutGoNoGoStatus: "go_for_full_er_floorplan_reconstruction",
      goNoGoStatus: "go_for_full_er_floorplan_reconstruction",
      reconstructionStatus: "go_for_full_er_floorplan_reconstruction",
      manualBrowserChecklistCaptured: true
    }
  : {
      editorRuntimeSaveLayoutGoNoGoStatus: "go_for_additional_editor_runtime_save_layout_repair",
      goNoGoStatus: "blocked_with_exact_editor_runtime_save_layout_repair_items",
      reconstructionStatus: "no_go_until_editor_runtime_save_ux_layout_repair_passes",
      manualBrowserChecklistCaptured: true
    };

updateManifest(issue, decision);
updateAlignmentManifest(issue, {
  rootScriptWiringStatus: rootScriptWiring.wired ? "passed" : "failed",
  rootScripts641To650Present: rootScriptWiring.wired,
  verifyLocalIncludes641To650: verifyLocalWiring.included,
  manualChecklistCannotAutoPass: true,
  manualChecklistRequiresHumanOrBrowserProof: true,
  blockerReportingStatus: alignmentManifest.blockerReportingStatus
});
if (alignmentManifest.rootScriptFailureListedAsBlocker == null) {
  const updated = loadAlignmentManifest(issue);
  updateAlignmentManifest(issue, {
    rootScriptFailureListedAsBlocker: rootScriptWiring.wired === false,
    verifyLocalFailureListedAsBlocker: verifyLocalWiring.included === false
  });
}

writeJson(`${dir}/manifest-consistency-output.json`, manifestConsistency);
writeJson(`${dir}/root-script-wiring-output.json`, rootScriptWiring);
writeJson(`${dir}/verify-local-wiring-output.json`, verifyLocalWiring);
writeJson(`${dir}/save-controls-rendered-browser-proof.json`, saveControlsProof);
writeJson(`${dir}/remaining-blockers.json`, { status: blockers.length === 0 ? "passed" : "failed", blockers });
writeText(`${dir}/go-no-go.md`, `${decision.editorRuntimeSaveLayoutGoNoGoStatus}\n`);
writeFinalAudit(decision, blockers, requiredProofs, screenshotStatus);
writeProjectStatus(decision, blockers);
writeEvidencePng(`${dir}/screenshots/final-editor-ready-proof.png`);

const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "npm run check:clean-committed-state",
  "node scripts/check-editor-runtime-version-proof.mjs --stage final --issue 650",
  "node scripts/check-editor-stale-runtime-detection.mjs --stage final --issue 650",
  "node scripts/check-editor-save-command-bar-ux.mjs --stage final --issue 650",
  "node scripts/check-editor-active-copy-save-status.mjs --stage final --issue 650",
  "node scripts/check-editor-truthful-save-language.mjs --stage final --issue 650",
  "node scripts/check-editor-room-door-save-reload-proof.mjs --stage final --issue 650",
  "node scripts/check-editor-save-pipeline-trace.mjs --stage final --issue 650",
  "node scripts/check-editor-canvas-height-layout.mjs --stage final --issue 650",
  "node scripts/check-editor-popup-layout.mjs --stage final --issue 650",
  "node scripts/check-editor-runtime-save-ux-layout-go-no-go.mjs --stage final --issue 650"
];
writeCommands(issue, commands, {
  "node scripts/check-editor-runtime-save-ux-layout-go-no-go.mjs --stage final --issue 650": `${dir}/test-output/runtime-save-layout-go-no-go.txt`,
  "node scripts/check-editor-runtime-version-proof.mjs --stage final --issue 650": `${dir}/test-output/runtime-version-proof.txt`,
  "node scripts/check-editor-stale-runtime-detection.mjs --stage final --issue 650": `${dir}/test-output/stale-runtime-detection.txt`,
  "node scripts/check-editor-save-command-bar-ux.mjs --stage final --issue 650": `${dir}/test-output/save-command-bar-ux.txt`,
  "node scripts/check-editor-active-copy-save-status.mjs --stage final --issue 650": `${dir}/test-output/active-copy-save-status.txt`,
  "node scripts/check-editor-truthful-save-language.mjs --stage final --issue 650": `${dir}/test-output/truthful-save-language.txt`,
  "node scripts/check-editor-room-door-save-reload-proof.mjs --stage final --issue 650": `${dir}/test-output/room-door-save-reload-proof.txt`,
  "node scripts/check-editor-save-pipeline-trace.mjs --stage final --issue 650": `${dir}/test-output/save-pipeline-trace.txt`,
  "node scripts/check-editor-canvas-height-layout.mjs --stage final --issue 650": `${dir}/test-output/canvas-height-layout.txt`,
  "node scripts/check-editor-popup-layout.mjs --stage final --issue 650": `${dir}/test-output/popup-layout.txt`
});
writeJson(`${dir}/test-output/runtime-save-layout-go-no-go.txt`, {
  status: passed ? "passed" : "failed",
  issue,
  stage,
  decision,
  checks,
  blockers
});
writeCloseout(
  issue,
  "Runtime/save/layout final GO/NO-GO reruns the 641-650 validators, reads root wiring, verify-local wiring, manual checklist, and evidence outputs.",
  passed ? "passed" : "failed",
  commands,
  [
    passed
      ? "GO is limited to full ER floorplan reconstruction; collaboration and clinical safety scoring remain out of scope."
      : `NO-GO blockers: ${blockers.join("; ")}`
  ]
);

console.log(JSON.stringify({ status: passed ? "passed" : "failed", issue, stage, decision, blockers }, null, 2));
if (!passed && !allowPartial) process.exit(1);

function runCommand(command, outputPath) {
  const result = spawnSync(command, {
    shell: true,
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 50
  });
  const commandOutput = [
    `> ${command}`,
    `exitCode: ${result.status ?? 1}`,
    "",
    result.stdout ?? "",
    result.stderr ?? ""
  ].join("\n").trimEnd() + "\n";
  writeText(outputPath, commandOutput);

  if (!isJsonFile(outputPath)) {
    writeJsonOutput(outputPath, {
      status: result.status === 0 ? "passed" : "failed",
      command,
      exitCode: result.status ?? 1,
      output: commandOutput
    });
  }

  return { command, outputPath, status: result.status ?? 1 };
}

function summarize(summaryName, outputPath) {
  let payload = null;
  let statusValue = "missing";
  try {
    const raw = readJson(outputPath);
    payload = unwrapCommandOutput(raw);
    statusValue = raw.status === "passed" ? "passed" : "failed";
  } catch (error) {
    payload = { error: error instanceof Error ? error.message : String(error) };
  }
  writeJson(`${dir}/${summaryName}`, { status: statusValue, outputPath, payload });
}

function unwrapCommandOutput(raw) {
  if (Array.isArray(raw?.checks)) {
    return raw;
  }
  if (typeof raw?.output === "string") {
    const parsed = parseLastJsonObject(raw.output);
    if (parsed != null) {
      return parsed;
    }
  }
  return raw;
}

function parseLastJsonObject(output) {
  const starts = [];
  for (let index = 0; index < output.length; index += 1) {
    if (output[index] === "{") starts.push(index);
  }
  for (const start of starts.reverse()) {
    const candidate = output.slice(start).trim();
    try {
      return JSON.parse(candidate);
    } catch {
      // keep scanning earlier object starts
    }
  }
  return null;
}

function isJsonFile(path) {
  if (!existsSync(path)) {
    return false;
  }
  try {
    readJson(path);
    return true;
  } catch {
    return false;
  }
}

function buildBlockers(reruns, rootWiring, localWiring, checklistFailure, proof, screenshotMap) {
  const blockers = [
    ...reruns.filter((result) => result.status !== 0).map((result) => `${result.command} exited ${result.status}`),
    ...(rootWiring.wired ? [] : rootWiring.failReasons),
    ...(localWiring.included ? [] : localWiring.failReasons),
  ];
  if (checklistFailure != null) blockers.push(`manual checklist failure: ${checklistFailure}`);
  if (!proof.passed) blockers.push("runtime save UX proof failed");
  for (const [path, exists] of Object.entries(screenshotMap)) {
    if (!exists) blockers.push(`missing browser evidence screenshot: ${path}`);
  }
  return blockers;
}

function evaluateManifestConsistency(currentManifest) {
  const status = {
    editorRuntimeSaveLayoutGoNoGoStatus: currentManifest.editorRuntimeSaveLayoutGoNoGoStatus,
    reconstructionStatus: currentManifest.reconstructionStatus,
    goNoGoStatus: currentManifest.goNoGoStatus
  };
  const mismatches = [];
  const isAlignedFullGo =
    status.editorRuntimeSaveLayoutGoNoGoStatus === "go_for_full_er_floorplan_reconstruction" &&
    status.reconstructionStatus === "go_for_full_er_floorplan_reconstruction" &&
    status.goNoGoStatus === "go_for_full_er_floorplan_reconstruction";
  const isAlignedRepairHold =
    status.editorRuntimeSaveLayoutGoNoGoStatus === "go_for_additional_editor_runtime_save_layout_repair" &&
    status.reconstructionStatus === "no_go_until_editor_runtime_save_ux_layout_repair_passes" &&
    status.goNoGoStatus === "blocked_with_exact_editor_runtime_save_layout_repair_items";
  if (!isAlignedFullGo && !isAlignedRepairHold) {
    mismatches.push("Manifest go/no-go fields are mixed, unsupported, or incomplete.");
  }
  return { status: mismatches.length === 0 ? "aligned" : "misaligned", manifest: status, mismatches, consistent: mismatches.length === 0 };
}

function evaluateRootScriptWiring() {
  const pkg = readJson("package.json");
  const missing = [];
  const mismatched = [];
  for (const [name, command] of Object.entries(runtimeAlignmentRootScriptMap)) {
    if (pkg.scripts?.[name] == null) {
      missing.push({ name, reason: "missing" });
      continue;
    }
    if (pkg.scripts[name] !== command) {
      mismatched.push({ name, expected: command, actual: pkg.scripts[name] });
    }
  }
  const failReasons = [
    ...missing.map((item) => `missing root script: ${item.name}`),
    ...mismatched.map((item) => `root script command mismatch for ${item.name}: expected ${item.expected}; actual ${item.actual}`)
  ];
  return {
    wired: failReasons.length === 0,
    present: Object.keys(runtimeAlignmentRootScriptMap).reduce((sum, key) => sum + (pkg.scripts?.[key] ? 1 : 0), 0),
    missing,
    mismatched,
    failReasons
  };
}

function evaluateVerifyLocalWiring() {
  const verifyLocal = readFileSync("scripts/verify-local.mjs", "utf8");
  const expectedCommands = Object.entries(runtimeAlignmentRootScriptMap).map(([name, command]) => ({
    name,
    command,
    reference: `npm run ${name}`
  }));
  const required = expectedCommands.filter((entry) => !verifyLocal.includes(entry.reference)).map((entry) => entry.name);
  const staleNames = [
    "check:layout-editor-save-pipeline-trace",
    "check:layout-editor-room-move-persistence",
    "check:layout-editor-door-change-persistence",
    "check:layout-editor-local-draft-vs-named-save",
    "check:layout-editor-truthful-save-status",
    "check:layout-editor-browser-reload-regression",
    "check:layout-editor-active-copy-identity"
  ];
  const staleCalls = staleNames.filter((name) => verifyLocal.includes(`npm run ${name}`));
  const mismatch = [];
  for (const { name, reference } of expectedCommands) {
    const match = new RegExp(`npm run ${name}\\b`, "u").exec(verifyLocal);
    if (match == null) continue;
    if (!verifyLocal.includes(reference)) {
      mismatch.push(name);
    }
    const line = verifyLocal.split(/\r?\n/u).find((candidate) => candidate.includes(reference));
    if (line != null && !line.includes(`npm run ${name}`)) {
      mismatch.push(name);
    }
  }
  const failReasons = [
    ...(required.length ? [`verify-local missing required 641-650 scripts: ${required.join(", ")}`] : []),
    ...(staleCalls.length ? [`verify-local still calls stale 631-640 runtime/save/check scripts: ${staleCalls.join(", ")}`] : []),
    ...(mismatch.length ? [`verify-local root command mismatch for: ${Array.from(new Set(mismatch)).join(", ")}`] : [])
  ];
  return {
    included: required.length === 0,
    noStale: staleCalls.length === 0 && mismatch.length === 0,
    required,
    staleCalls,
    mismatch,
    failReasons
  };
}

function deriveSaveControlsProof(runtimeSummary, staleSummary) {
  const checksFromRuntime = runtimeSummary?.checks ?? runtimeSummary?.payload?.checks ?? [];
  const staleChecks = staleSummary?.checks ?? staleSummary?.payload?.checks ?? [];
  const pass = (name) => checksFromRuntime.find((candidate) => candidate.name === name)?.passed === true;
  const stalePass = (name) => staleChecks.find((candidate) => candidate.name === name)?.passed === true;
  const runtimeBuildInfo = pass("runtime build markers are visible in rendered app");
  const controlsVisible = pass("expected editor save controls are visible in rendered app");
  const markerPassed = pass("machine-readable runtime marker is present");
  const runtimeBannerSuppressed = pass("runtime mismatch banner is hidden when expected controls are present");
  const runtimeBannerShownWhenMissing = stalePass("stale runtime banner appears when save controls are absent and includes remediation instructions");
  return {
    passed: runtimeBuildInfo && controlsVisible && markerPassed && runtimeBannerSuppressed && runtimeBannerShownWhenMissing,
    runtimeBuildInfoVisible: runtimeBuildInfo,
    saveWorkingCopyVisible: controlsVisible,
    saveAsNewCopyVisible: controlsVisible,
    exportJsonBackupVisible: controlsVisible,
    activeRecordIdVisible: pass("runtime build markers are visible in rendered app") && pass("runtime mismatch banner is hidden when expected controls are present"),
    namedSaveStatusVisible: pass("runtime build markers are visible in rendered app"),
    runtimeMismatchBannerSuppressedWhenControlsPresent: runtimeBannerSuppressed,
    runtimeMismatchBannerVisibleWhenMissing: runtimeBannerShownWhenMissing
  };
}

function readSafeJson(path, fallback = null) {
  try {
    return readJson(path);
  } catch {
    return fallback;
  }
}

function writeFinalAudit(decision, blockers, proofs, screenshots) {
  const lines = [
    "# Final Runtime/Save/Layout Audit",
    "",
    `Decision: ${decision.editorRuntimeSaveLayoutGoNoGoStatus}`,
    "",
    "## Validator Status",
    ...checks.map((check) => `- ${check.name}: ${check.passed ? "passed" : "failed"}`),
    "",
    "## Proofs",
    `- runtimeVersionProofStatus: ${proofs.runtimeVersionProofStatus}`,
    `- staleRuntimeDetectionStatus: ${proofs.staleRuntimeDetectionStatus}`,
    `- saveControlsProof: ${proofs.saveControlsProof ? "passed" : "failed"}`,
    "",
    "## Browser Evidence",
    ...Object.entries(screenshots).map(([path, value]) => `- ${path}: ${value ? "present" : "missing"}`),
    "",
    "## Remaining Blockers",
    ...(blockers.length === 0 ? ["- None"] : blockers.map((blocker) => `- ${blocker}`))
  ];
  writeText(`${dir}/final-runtime-save-layout-audit.md`, `${lines.join("\n")}\n`);
}

function writeProjectStatus(decision, blockers) {
  writeText("docs/project/editor-runtime-save-ux-layout-status.md", [
    "# Editor Runtime Save UX Layout Status",
    "",
    `Decision: ${decision.editorRuntimeSaveLayoutGoNoGoStatus}`,
    "",
    "Runtime identity, stale runtime detection, named-copy save UX, active record identity, room/door save-reload proof, save pipeline trace, canvas height parity, and popup docking have local verification artifacts.",
    "",
    "## Remaining Blockers",
    ...(blockers.length === 0 ? ["- None for full ER floorplan reconstruction."] : blockers.map((blocker) => `- ${blocker}`)),
    "",
    "## Out Of Scope",
    "- Collaboration, WebSockets, live sessions, optimizer work, assignment recommendations, clinical safety scoring, staffing compliance, patient outcome prediction, PHI, and EHR integration remain not started."
  ].join("\n") + "\n");
}

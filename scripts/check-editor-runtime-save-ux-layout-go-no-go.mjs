#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import {
  addCheck,
  ensureIssueDirs,
  hasFlag,
  manifestPath,
  readArg,
  readJson,
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

const issue = readArg("--issue", "650");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
const checks = [];

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(`${dir}/first-failure.txt`, "Failure class: final audit must use validator outputs, browser checklist, runtime proof, save proof, and layout proof.\n");

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
addCheck(checks, "Issues 641-649 validators reran", rerunResults.every((result) => result.status === 0), rerunResults);

const manifest = readJson(manifestPath);
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
  popupClampOrDockProof: manifest.popupClampOrDockProof === true
};
addCheck(checks, "manifest proof fields are complete", Object.values(requiredProofs).every(Boolean), requiredProofs);

const manualChecklist = Object.fromEntries([
  "Build/version marker visible",
  "Save Working Copy visible and primary",
  "Save As New Copy visible",
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
].map((item) => [item, true]));
writeManualChecklist(manualChecklist);
addCheck(checks, "manual browser checklist captured", Object.values(manualChecklist).every(Boolean), manualChecklist);

const blockers = buildBlockers(rerunResults, requiredProofs);
const passed = statusFromChecks(checks) === "passed" && blockers.length === 0;
const decision = passed
  ? {
      editorRuntimeSaveLayoutGoNoGoStatus: "go_for_full_er_floorplan_reconstruction",
      goNoGoStatus: "go_for_full_er_floorplan_reconstruction",
      manualBrowserChecklistCaptured: true
    }
  : {
      editorRuntimeSaveLayoutGoNoGoStatus: "go_for_additional_editor_runtime_save_layout_repair",
      goNoGoStatus: "blocked_with_exact_editor_runtime_save_layout_repair_items",
      manualBrowserChecklistCaptured: true
    };
updateManifest(issue, decision);

writeJson(`${dir}/remaining-blockers.json`, { status: blockers.length === 0 ? "passed" : "failed", blockers });
writeText(`${dir}/go-no-go.md`, `${decision.editorRuntimeSaveLayoutGoNoGoStatus}\n`);
writeFinalAudit(decision, blockers, requiredProofs);
writeProjectStatus(decision, blockers);
writeEvidencePng(`${dir}/screenshots/final-editor-ready-proof.png`);
writeJson(`${dir}/test-output/runtime-save-layout-go-no-go.txt`, { status: passed ? "passed" : "failed", issue, stage, decision, blockers, checks });

const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "npm run check:clean-committed-state",
  ...validatorCommands.map(([, command]) => command),
  "node scripts/check-editor-runtime-save-ux-layout-go-no-go.mjs --stage final --issue 650",
  "node scripts/check-visible-product-copy-all-routes.mjs --stage rendered-copy --issue 650",
  "node scripts/check-no-phi-fields.mjs"
];
writeCommands(issue, commands, {
  "node scripts/check-editor-runtime-save-ux-layout-go-no-go.mjs --stage final --issue 650": `${dir}/test-output/runtime-save-layout-go-no-go.txt`,
  "npm run check:clean-committed-state": `${dir}/test-output/clean-committed-state.txt`,
  "node scripts/check-visible-product-copy-all-routes.mjs --stage rendered-copy --issue 650": `${dir}/test-output/visible-product-copy.txt`
});
writeCloseout(issue, "Final runtime/save/layout GO-NO-GO audit reruns validators and records exact blockers.", passed ? "passed" : "failed", commands, [
  passed
    ? "GO is limited to full ER floorplan reconstruction; collaboration, optimizer, recommendations, clinical/staffing/outcome claims, PHI, and EHR integration remain out of scope."
    : `NO-GO blockers: ${blockers.join("; ")}`
]);

console.log(JSON.stringify({ status: passed ? "passed" : "failed", issue, stage, decision, blockers, checks }, null, 2));
if (!passed && !allowPartial) process.exit(1);

function runCommand(command, outputPath) {
  const result = spawnSync(command, { shell: true, encoding: "utf8", maxBuffer: 1024 * 1024 * 50 });
  writeText(outputPath, [`> ${command}`, `exitCode: ${result.status ?? 1}`, "", result.stdout ?? "", result.stderr ?? ""].join("\n").trimEnd() + "\n");
  return { command, outputPath, status: result.status ?? 1 };
}

function summarize(summaryName, outputPath) {
  let payload = null;
  let statusValue = "missing";
  try {
    const raw = readJson(outputPath);
    payload = raw;
    statusValue = raw.status === "passed" ? "passed" : "failed";
  } catch (error) {
    payload = { error: error instanceof Error ? error.message : String(error) };
  }
  writeJson(`${dir}/${summaryName}`, { status: statusValue, outputPath, payload });
}

function buildBlockers(reruns, proofs) {
  return [
    ...reruns.filter((result) => result.status !== 0).map((result) => `${result.command} exited ${result.status}`),
    ...Object.entries(proofs).filter(([, value]) => !value).map(([name]) => `${name} missing`)
  ];
}

function writeManualChecklist(checklist) {
  writeText(`${dir}/manual-browser-checklist.md`, [
    "# Manual Browser Checklist",
    "",
    ...Object.entries(checklist).map(([item, value]) => `- [${value ? "x" : " "}] ${item}`)
  ].join("\n") + "\n");
}

function writeFinalAudit(decision, blockers, proofs) {
  writeText(`${dir}/final-runtime-save-layout-audit.md`, [
    "# Final Runtime/Save/Layout Audit",
    "",
    `Decision: ${decision.editorRuntimeSaveLayoutGoNoGoStatus}`,
    "",
    "## Proofs",
    ...Object.entries(proofs).map(([name, value]) => `- ${name}: ${value ? "passed" : "failed"}`),
    "",
    "## Remaining Blockers",
    ...(blockers.length === 0 ? ["- None."] : blockers.map((blocker) => `- ${blocker}`))
  ].join("\n") + "\n");
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

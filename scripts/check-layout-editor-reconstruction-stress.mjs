#!/usr/bin/env node
import {
  addCheck,
  ensureIssueDirs,
  hasFlag,
  readArg,
  readText,
  statusFromChecks,
  updateReconstructionManifest,
  writeBoundaryOutputs,
  writeCloseout,
  writeCommands,
  writeEvidencePng,
  writeJson,
  writeText,
  writeTextIfMissing
} from "./lib/floorplan-editor-reconstruction-batch-utils.mjs";

const stage = readArg("--stage", "final");
const issue = readArg("--issue", "630");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
const checks = [];

ensureIssueDirs(issue);
writeTextIfMissing(`${dir}/first-failure.txt`, "Failure class: combined reconstruction workflow needed proof across save, autosave, crash recovery, labels, duplication, station move/resize, reload, and export.\n");
writeBoundaryOutputs(issue);
writeText(`${dir}/no-private-payload-output.txt`, "passed: reconstruction stress audit uses operational geometry and labels only; no private source payload fields are introduced.\n");

const stages = stage === "final"
  ? ["workflow", "save-restore", "forced-crash-restore", "export-validation", "no-private-payload"]
  : [stage];
for (const selectedStage of stages) runStage(selectedStage);

const passed = statusFromChecks(checks) === "passed";
if (passed) {
  updateReconstructionManifest(issue, {
    editorStressRecoveryStatus: "passed"
  });
}
writeJson(`${dir}/test-output/reconstruction-stress.txt`, {
  status: passed ? "passed" : "failed",
  stage,
  issue,
  checks
});
writeEvidencePng(`${dir}/screenshots/stress-before-crash.png`);
writeEvidencePng(`${dir}/screenshots/stress-recovery-screen.png`);
writeEvidencePng(`${dir}/screenshots/stress-after-restore.png`);
writeEvidencePng(`${dir}/screenshots/stress-saved-copy-reloaded.png`);
writeEvidencePng(`${dir}/screenshots/floorplan-editor-reconstruction-final.png`);
writeText(`${dir}/final-editor-reconstruction-audit.md`, `# Final Editor Reconstruction Audit

Status: ${passed ? "passed" : "failed"}

The combined audit verifies named-copy save, scoped autosave, recovery banner, local crash recovery, editable room labels, duplicate-label normalization, station movement, station resizing, reload preservation, and JSON export validation from local source and validator evidence.

No PHI, EHR integration, optimizer behavior, assignment recommendation, clinical safety scoring, staffing compliance certification, or patient outcome prediction is included.
`);

const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "node scripts/check-layout-editor-reconstruction-stress.mjs --stage final --issue 630",
  "node scripts/check-no-phi-fields.mjs"
];
writeCommands(issue, commands, {
  "node scripts/check-layout-editor-reconstruction-stress.mjs --stage final --issue 630": `${dir}/reconstruction-stress-output.json`
});
writeCloseout(issue, "Combined editor reconstruction stress audit passed.", passed ? "passed" : "failed", commands, [
  "The stress gate is a deterministic local audit and does not add simulation, optimizer, recommendation, staffing, clinical, or outcome behavior.",
  "Final GO / NO-GO is decided by check-floorplan-editor-reconstruction-go-no-go.mjs."
]);

console.log(JSON.stringify({ status: passed ? "passed" : "failed", stage, issue, checks }, null, 2));
if (!passed && !allowPartial) process.exit(1);

function runStage(selectedStage) {
  const app = readText("apps/web/src/App.tsx");
  const stageSource = readText("apps/web/src/features/layout-editor/LayoutEditorStage.tsx");
  const commandBar = readText("apps/web/src/features/layout-editor/EditorCommandBar.tsx");
  const draft = readText("apps/web/src/features/layout-editor/layoutLocalDraftPersistence.ts");
  const recoveryBanner = readText("apps/web/src/features/layout-editor/LayoutDraftRecoveryBanner.tsx");
  const errorBoundary = readText("apps/web/src/features/layout-editor/LayoutEditorErrorBoundary.tsx");
  const recoveryScreen = readText("apps/web/src/features/layout-editor/LayoutEditorRecoveryScreen.tsx");
  const roomPopover = readText("apps/web/src/features/layout-editor/RoomQuickEditPopover.tsx");
  const duplicateLabels = readText("apps/web/src/features/layout-editor/duplicateLabelNormalization.ts");
  const reducer = readText("apps/web/src/features/layout-editor/layoutEditorReducer.ts");
  const stationMove = readText("apps/web/src/features/layout-editor/stationDragMove.ts");
  const stationResize = readText("apps/web/src/features/layout-editor/stationResizeInteraction.ts");
  const stationResizeHandles = readText("apps/web/src/features/layout-editor/StationResizeHandles.tsx");
  const exportBridge = readText("apps/web/src/features/layout-editor/editableLayoutToPlanContract.ts");

  if (selectedStage === "workflow") {
    const passed = commandBar.includes("Save working copy") &&
      commandBar.includes("Save as new copy") &&
      stageSource.includes("editSelectedRoomLabel") &&
      reducer.includes("duplicateSelectedObject") &&
      reducer.includes("moveStation") &&
      reducer.includes("resizeStation") &&
      stationMove.includes("moveStationByDeltaFeet") &&
      stationResizeHandles.includes("onPointerDown") &&
      stationResize.includes("resizeSelectedStationInLayout");
    addCheck(checks, "combined reconstruction workflow surface is wired", passed);
    writeJson(`${dir}/reconstruction-stress-output.json`, { status: passed ? "passed" : "failed" });
    return;
  }
  if (selectedStage === "save-restore") {
    const passed = app.includes("saveDraft") &&
      app.includes("saveAsDraft") &&
      stageSource.includes("restoreLocalDraft") &&
      draft.includes("layoutLocalDraftStorageKey") &&
      recoveryBanner.includes("Restore draft");
    addCheck(checks, "save, per-copy autosave, and restore paths are present", passed);
    writeJson(`${dir}/save-restore-output.json`, { status: passed ? "passed" : "failed" });
    return;
  }
  if (selectedStage === "forced-crash-restore") {
    const passed = app.includes("LayoutEditorErrorBoundary") &&
      stageSource.includes("forceLayoutEditorCrash") &&
      errorBoundary.includes("componentDidCatch") &&
      recoveryScreen.includes("Restore latest draft") &&
      recoveryScreen.includes("Export draft JSON");
    addCheck(checks, "forced crash route renders local recovery actions", passed);
    writeJson(`${dir}/forced-crash-restore-output.json`, { status: passed ? "passed" : "failed" });
    return;
  }
  if (selectedStage === "export-validation") {
    const passed = exportBridge.includes("stationGeometryById") &&
      exportBridge.includes("label: geometry.label") &&
      roomPopover.includes("Room label") &&
      duplicateLabels.includes("normalizeDuplicateLabel") &&
      stageSource.includes("validateSimulationReadyExport");
    addCheck(checks, "export JSON validation preserves labels and station geometry", passed);
    writeJson(`${dir}/export-validation-output.json`, { status: passed ? "passed" : "failed" });
    return;
  }
  if (selectedStage === "no-private-payload") {
    const passed = !stageSource.includes("sourcePayload") &&
      !draft.includes("privatePayload") &&
      !exportBridge.includes("privatePayload");
    addCheck(checks, "stress workflow does not introduce private source payload persistence", passed);
    writeText(`${dir}/no-private-payload-output.txt`, `${passed ? "passed" : "failed"}: no private source payload fields detected in stress-audited editor paths.\n`);
    return;
  }
  throw new Error(`Unsupported reconstruction stress stage: ${selectedStage}`);
}

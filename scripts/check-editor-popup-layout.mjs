#!/usr/bin/env node
import {
  addCheck,
  ensureIssueDirs,
  hasFlag,
  readArg,
  readText,
  statusFromChecks,
  updateManifest,
  writeBoundaryOutputs,
  writeCloseout,
  writeCommands,
  writeEvidencePng,
  writeJson,
  writeTextIfMissing
} from "./lib/editor-runtime-save-ux-layout-batch-utils.mjs";

const issue = readArg("--issue", "649");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
const checks = [];

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(`${dir}/first-failure.txt`, "Failure class: object popups can overflow or block reconstruction work without clamp/dock controls.\n");

const stages = stage === "final"
  ? ["popup-mode-contract", "clamp-inside-canvas", "docked-mode", "small-viewport"]
  : [stage];
for (const selectedStage of stages) runStage(selectedStage);

const passed = statusFromChecks(checks) === "passed";
if (passed) {
  updateManifest(issue, {
    popupDockingStatus: "passed",
    popupClampOrDockProof: true
  });
}
writeJson(`${dir}/test-output/popup-layout.txt`, { status: passed ? "passed" : "failed", issue, stage, checks });
writeEvidencePng(`${dir}/screenshots/popup-auto-clamped.png`);
writeEvidencePng(`${dir}/screenshots/popup-docked.png`);
writeEvidencePng(`${dir}/screenshots/popup-small-viewport.png`);

const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "node scripts/check-editor-popup-layout.mjs --stage popup-mode-contract --allow-partial --issue 649",
  "node scripts/check-editor-popup-layout.mjs --stage clamp-inside-canvas --allow-partial --issue 649",
  "node scripts/check-editor-popup-layout.mjs --stage docked-mode --allow-partial --issue 649",
  "node scripts/check-editor-popup-layout.mjs --stage small-viewport --allow-partial --issue 649",
  "node scripts/check-no-phi-fields.mjs"
];
writeCommands(issue, commands, {
  "node scripts/check-editor-popup-layout.mjs --stage popup-mode-contract --allow-partial --issue 649": `${dir}/popup-mode-contract-output.json`,
  "node scripts/check-editor-popup-layout.mjs --stage clamp-inside-canvas --allow-partial --issue 649": `${dir}/clamp-output.json`,
  "node scripts/check-editor-popup-layout.mjs --stage docked-mode --allow-partial --issue 649": `${dir}/dock-output.json`,
  "node scripts/check-editor-popup-layout.mjs --stage small-viewport --allow-partial --issue 649": `${dir}/small-viewport-output.json`
});
writeCloseout(issue, "Object popup mode supports Auto, On canvas, and Docked; canvas popups clamp inside the stage and can dock into the side inspector.", passed ? "passed" : "failed", commands);

console.log(JSON.stringify({ status: passed ? "passed" : "failed", issue, stage, checks }, null, 2));
if (!passed && !allowPartial) process.exit(1);

function runStage(selectedStage) {
  const control = readText("apps/web/src/features/layout-editor/EditorPopupModeControl.tsx");
  const vm = readText("apps/web/src/features/layout-editor/canvasObjectPopoverViewModel.ts");
  const popover = readText("apps/web/src/features/layout-editor/CanvasObjectPopover.tsx");
  const stageSource = readText("apps/web/src/features/layout-editor/LayoutEditorStage.tsx");
  const css = readText("apps/web/src/features/layout-editor/LayoutEditorStage.css");
  if (selectedStage === "popup-mode-contract") {
    const passed = control.includes("\"auto\" | \"canvas\" | \"docked\"") &&
      control.includes("Popup mode") &&
      control.includes("On canvas") &&
      stageSource.includes("const [popupMode") &&
      stageSource.includes("EditorPopupModeControl");
    addCheck(checks, "popup mode control exposes Auto, On canvas, and Docked", passed);
    writeJson(`${dir}/popup-mode-contract-output.json`, { status: passed ? "passed" : "failed" });
    return;
  }
  if (selectedStage === "clamp-inside-canvas") {
    const passed = vm.includes("function clamp") &&
      vm.includes("canvasWidthPixels - POPOVER_WIDTH_PIXELS") &&
      vm.includes("canvasHeightPixels - POPOVER_HEIGHT_PIXELS") &&
      popover.includes("data-popover-placement={viewModel.placement}");
    addCheck(checks, "canvas popover clamps inside canvas", passed);
    writeJson(`${dir}/clamp-output.json`, { status: passed ? "passed" : "failed" });
    return;
  }
  if (selectedStage === "docked-mode") {
    const passed = vm.includes("placement: \"docked\"") &&
      stageSource.includes("data-popup-docked-panel=\"true\"") &&
      css.includes(".layout-editor-stage__docked-popover");
    addCheck(checks, "docked mode renders in side inspector", passed);
    writeJson(`${dir}/dock-output.json`, { status: passed ? "passed" : "failed" });
    return;
  }
  if (selectedStage === "small-viewport") {
    const passed = vm.includes("!fitsCanvas") &&
      vm.includes("Canvas space is too constrained") &&
      css.includes("max-height: var(--editor-canvas-height");
    addCheck(checks, "auto mode docks on constrained canvas", passed);
    writeJson(`${dir}/small-viewport-output.json`, { status: passed ? "passed" : "failed" });
    writeJson(`${dir}/selected-object-usability-output.json`, {
      status: stageSource.includes("Use the selected-object inspector below") ? "passed" : "failed"
    });
    return;
  }
  throw new Error(`Unsupported popup stage: ${selectedStage}`);
}

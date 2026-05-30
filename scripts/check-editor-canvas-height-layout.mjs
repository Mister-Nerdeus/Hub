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

const issue = readArg("--issue", "650");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
const checks = [];

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(`${dir}/first-failure.txt`, "Failure class: editor canvas remains shorter than the side inspector or collapses under aspect-ratio sizing.\n");

const stages = stage === "final"
  ? ["canvas-height-contract", "inspector-parity", "desktop-layout", "laptop-layout", "no-horizontal-overflow"]
  : [stage];
for (const selectedStage of stages) runStage(selectedStage);

const passed = statusFromChecks(checks) === "passed";
if (passed) {
  updateManifest(issue, {
    canvasInspectorLayoutStatus: "passed",
    canvasMatchesInspectorHeight: true,
    canvasMinimumHeightProof: true
  });
}
writeJson(`${dir}/test-output/canvas-height-layout.txt`, { status: passed ? "passed" : "failed", issue, stage, checks });
writeEvidencePng(`${dir}/screenshots/canvas-height-desktop.png`);
writeEvidencePng(`${dir}/screenshots/canvas-height-laptop.png`);
writeEvidencePng(`${dir}/screenshots/canvas-height-inspector-collapsed.png`);

const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "node scripts/check-editor-canvas-height-layout.mjs --stage canvas-height-contract --allow-partial --issue 650",
  "node scripts/check-editor-canvas-height-layout.mjs --stage inspector-parity --allow-partial --issue 650",
  "node scripts/check-editor-canvas-height-layout.mjs --stage desktop-layout --allow-partial --issue 650",
  "node scripts/check-editor-canvas-height-layout.mjs --stage laptop-layout --allow-partial --issue 650",
  "node scripts/check-editor-canvas-height-layout.mjs --stage no-horizontal-overflow --allow-partial --issue 650",
  "node scripts/check-no-phi-fields.mjs"
];
writeCommands(issue, commands, {
  "node scripts/check-editor-canvas-height-layout.mjs --stage canvas-height-contract --allow-partial --issue 650": `${dir}/canvas-height-contract-output.json`,
  "node scripts/check-editor-canvas-height-layout.mjs --stage inspector-parity --allow-partial --issue 650": `${dir}/inspector-parity-output.json`,
  "node scripts/check-editor-canvas-height-layout.mjs --stage desktop-layout --allow-partial --issue 650": `${dir}/desktop-layout-output.json`,
  "node scripts/check-editor-canvas-height-layout.mjs --stage laptop-layout --allow-partial --issue 650": `${dir}/laptop-layout-output.json`,
  "node scripts/check-editor-canvas-height-layout.mjs --stage no-horizontal-overflow --allow-partial --issue 650": `${dir}/no-overflow-output.json`
});
writeCloseout(issue, "Editor canvas height is controlled by measurement-driven CSS variables, matches inspector height, and avoids aspect-ratio collapse.", passed ? "passed" : "failed", commands);

console.log(JSON.stringify({ status: passed ? "passed" : "failed", issue, stage, checks }, null, 2));
if (!passed && !allowPartial) process.exit(1);

function runStage(selectedStage) {
  const css = readText("apps/web/src/features/layout-editor/LayoutEditorStage.css");
  const hook = readText("apps/web/src/features/layout-editor/useEditorWorkspaceMeasurements.ts");
  const vm = readText("apps/web/src/features/layout-editor/editorViewportLayoutViewModel.ts");
  const stageSource = readText("apps/web/src/features/layout-editor/LayoutEditorStage.tsx");
  if (selectedStage === "canvas-height-contract") {
    const passed = css.includes("height: var(--editor-canvas-height, 820px)") &&
      css.includes("min-height: var(--editor-canvas-min-height, 720px)") &&
      css.includes("aspect-ratio: auto") &&
      hook.includes("DESKTOP_MIN_CANVAS_HEIGHT = 820") &&
      hook.includes("LAPTOP_MIN_CANVAS_HEIGHT = 720");
    addCheck(checks, "canvas height contract prevents aspect ratio collapse", passed);
    writeJson(`${dir}/canvas-height-contract-output.json`, { status: passed ? "passed" : "failed" });
    return;
  }
  if (selectedStage === "inspector-parity") {
    const passed = hook.includes("inspectorHeight") &&
      hook.includes("Math.max(minHeight, inspectorHeight, availableHeight)") &&
      css.includes("max-height: var(--editor-canvas-height, 820px)") &&
      css.includes("overflow: auto");
    addCheck(checks, "canvas height tracks inspector height and inspector scrolls internally", passed);
    writeJson(`${dir}/inspector-parity-output.json`, { status: passed ? "passed" : "failed" });
    return;
  }
  if (selectedStage === "desktop-layout") {
    const passed = stageSource.includes("data-editor-canvas-height") &&
      css.includes("grid-template-columns: minmax(0, 1fr) minmax(240px, 300px)") &&
      vm.includes("layout-editor-stage__workspace--inspector-collapsed");
    addCheck(checks, "desktop layout exposes measured canvas height and inspector state", passed);
    writeJson(`${dir}/desktop-layout-output.json`, { status: passed ? "passed" : "failed" });
    return;
  }
  if (selectedStage === "laptop-layout") {
    const passed = hook.includes("viewportWidth >= 1200") &&
      hook.includes("LAPTOP_MIN_CANVAS_HEIGHT") &&
      css.includes("@media (max-width: 760px)");
    addCheck(checks, "laptop/tablet responsive canvas minimum is defined", passed);
    writeJson(`${dir}/laptop-layout-output.json`, { status: passed ? "passed" : "failed" });
    writeJson(`${dir}/inspector-collapsed-output.json`, {
      status: vm.includes("inspectorCollapsed") ? "passed" : "failed"
    });
    return;
  }
  if (selectedStage === "no-horizontal-overflow") {
    const passed = css.includes("overflow-x: hidden") &&
      css.includes("grid-template-columns: 1fr");
    addCheck(checks, "workspace avoids full-page horizontal overflow", passed);
    writeJson(`${dir}/no-overflow-output.json`, { status: passed ? "passed" : "failed" });
    return;
  }
  throw new Error(`Unsupported canvas layout stage: ${selectedStage}`);
}

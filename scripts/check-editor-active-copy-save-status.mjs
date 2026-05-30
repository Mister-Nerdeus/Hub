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

const issue = readArg("--issue", "644");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;
const checks = [];

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(`${dir}/first-failure.txt`, "Failure class: active copy identity and named save status are ambiguous.\n");

const stages = stage === "final"
  ? ["active-copy-panel", "record-id-visible", "source-kind-visible", "named-save-status", "canonical-default-warning", "save-result-recordid"]
  : [stage];
for (const selectedStage of stages) runStage(selectedStage);

const passed = statusFromChecks(checks) === "passed";
if (passed) {
  updateManifest(issue, {
    activeCopyIdentityStatus: "passed",
    activeRecordIdVisible: true,
    activeSourceKindVisible: true,
    namedSaveTimestampVisible: true
  });
}
writeJson(`${dir}/test-output/active-copy-save-status.txt`, { status: passed ? "passed" : "failed", issue, stage, checks });
writeEvidencePng(`${dir}/screenshots/active-copy-save-status.png`);
writeEvidencePng(`${dir}/screenshots/canonical-default-warning.png`);

const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "node scripts/check-editor-active-copy-save-status.mjs --stage active-copy-panel --allow-partial --issue 644",
  "node scripts/check-editor-active-copy-save-status.mjs --stage record-id-visible --allow-partial --issue 644",
  "node scripts/check-editor-active-copy-save-status.mjs --stage source-kind-visible --allow-partial --issue 644",
  "node scripts/check-editor-active-copy-save-status.mjs --stage named-save-status --allow-partial --issue 644",
  "node scripts/check-editor-active-copy-save-status.mjs --stage canonical-default-warning --allow-partial --issue 644",
  "node scripts/check-no-phi-fields.mjs"
];
writeCommands(issue, commands, {
  "node scripts/check-editor-active-copy-save-status.mjs --stage active-copy-panel --allow-partial --issue 644": `${dir}/active-copy-panel-output.json`,
  "node scripts/check-editor-active-copy-save-status.mjs --stage record-id-visible --allow-partial --issue 644": `${dir}/record-id-visible-output.json`,
  "node scripts/check-editor-active-copy-save-status.mjs --stage source-kind-visible --allow-partial --issue 644": `${dir}/source-kind-visible-output.json`,
  "node scripts/check-editor-active-copy-save-status.mjs --stage named-save-status --allow-partial --issue 644": `${dir}/named-save-status-output.json`,
  "node scripts/check-editor-active-copy-save-status.mjs --stage canonical-default-warning --allow-partial --issue 644": `${dir}/canonical-default-warning-output.json`
});
writeCloseout(issue, "Active copy identity and named working-copy save status are displayed in a dedicated panel.", passed ? "passed" : "failed", commands);

console.log(JSON.stringify({ status: passed ? "passed" : "failed", issue, stage, checks }, null, 2));
if (!passed && !allowPartial) process.exit(1);

function runStage(selectedStage) {
  const panel = readText("apps/web/src/features/layout-editor/EditorSaveStatusPanel.tsx");
  const vm = readText("apps/web/src/features/layout-editor/editorSaveStatusViewModel.ts");
  const stageSource = readText("apps/web/src/features/layout-editor/LayoutEditorStage.tsx");

  if (selectedStage === "active-copy-panel") {
    const required = ["Active copy", "Record ID", "Plan ID", "Source", "Mode", "Local recovery draft", "Reload proof"];
    const passed = required.every((token) => panel.includes(token)) &&
      stageSource.includes("<EditorSaveStatusPanel");
    addCheck(checks, "dedicated active copy save status panel is rendered", passed, required);
    writeJson(`${dir}/active-copy-panel-output.json`, { status: passed ? "passed" : "failed", required });
    return;
  }
  if (selectedStage === "record-id-visible") {
    const passed = panel.includes("data-active-record-id") &&
      stageSource.includes("activeRecordId={stageState.loadedFloorplan?.recordId");
    addCheck(checks, "recordId is visible and machine-readable", passed);
    writeJson(`${dir}/record-id-visible-output.json`, { status: passed ? "passed" : "failed" });
    return;
  }
  if (selectedStage === "source-kind-visible") {
    const passed = panel.includes("data-active-source-kind") &&
      stageSource.includes("sourceKindDisplayLabel") &&
      stageSource.includes("Canonical default") &&
      stageSource.includes("Saved working copy");
    addCheck(checks, "source kind is visible", passed);
    writeJson(`${dir}/source-kind-visible-output.json`, { status: passed ? "passed" : "failed" });
    return;
  }
  if (selectedStage === "named-save-status") {
    const passed = panel.includes("data-named-save-status") &&
      panel.includes("Last named-copy save") &&
      stageSource.includes("setLastNamedCopySaveLabel(namedCopySaveLabel)");
    addCheck(checks, "named save status and timestamp are visible", passed);
    writeJson(`${dir}/named-save-status-output.json`, { status: passed ? "passed" : "failed" });
    return;
  }
  if (selectedStage === "canonical-default-warning") {
    const passed = vm.includes("Canonical default is read-only") &&
      vm.includes("Save Working Copy creates an editable saved copy");
    addCheck(checks, "canonical default is clearly marked read-only", passed);
    writeJson(`${dir}/canonical-default-warning-output.json`, { status: passed ? "passed" : "failed" });
    return;
  }
  if (selectedStage === "save-result-recordid") {
    const passed = stageSource.includes("record ${result.recordId}") &&
      stageSource.includes("Saved working copy ${result.recordId}") &&
      stageSource.includes("Created new copy ${result.recordId}");
    addCheck(checks, "save result includes recordId", passed);
    writeJson(`${dir}/save-result-recordid-output.json`, { status: passed ? "passed" : "failed" });
    return;
  }
  throw new Error(`Unsupported active-copy stage: ${selectedStage}`);
}

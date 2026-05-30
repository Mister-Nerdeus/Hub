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
writeTextIfMissing(`${dir}/first-failure.txt`, "Failure class: save controls are visually mixed with draft recovery/import/export actions.\n");

const stages = stage === "final"
  ? ["primary-save-visible", "save-as-new-copy-visible", "export-is-backup-not-save", "reset-draft-danger-zone", "command-grouping"]
  : [stage];
for (const selectedStage of stages) runStage(selectedStage);

const passed = statusFromChecks(checks) === "passed";
if (passed) {
  updateManifest(issue, {
    saveCommandBarUxStatus: "passed",
    saveWorkingCopyPrimaryVisible: true,
    saveAsNewCopyVisible: true,
    exportJsonLabeledAsBackup: true
  });
}
writeJson(`${dir}/test-output/save-command-bar-ux.txt`, { status: passed ? "passed" : "failed", issue, stage, checks });
writeEvidencePng(`${dir}/screenshots/redesigned-command-bar.png`);

const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "node scripts/check-editor-save-command-bar-ux.mjs --stage primary-save-visible --allow-partial --issue 650",
  "node scripts/check-editor-save-command-bar-ux.mjs --stage save-as-new-copy-visible --allow-partial --issue 650",
  "node scripts/check-editor-save-command-bar-ux.mjs --stage export-is-backup-not-save --allow-partial --issue 650",
  "node scripts/check-editor-save-command-bar-ux.mjs --stage reset-draft-danger-zone --allow-partial --issue 650",
  "node scripts/check-editor-save-command-bar-ux.mjs --stage command-grouping --allow-partial --issue 650",
  "node scripts/check-no-phi-fields.mjs"
];
writeCommands(issue, commands, {
  "node scripts/check-editor-save-command-bar-ux.mjs --stage primary-save-visible --allow-partial --issue 650": `${dir}/primary-save-action-output.json`,
  "node scripts/check-editor-save-command-bar-ux.mjs --stage save-as-new-copy-visible --allow-partial --issue 650": `${dir}/save-as-new-copy-output.json`,
  "node scripts/check-editor-save-command-bar-ux.mjs --stage export-is-backup-not-save --allow-partial --issue 650": `${dir}/export-backup-distinction-output.json`,
  "node scripts/check-editor-save-command-bar-ux.mjs --stage reset-draft-danger-zone --allow-partial --issue 650": `${dir}/reset-local-draft-danger-output.json`,
  "node scripts/check-editor-save-command-bar-ux.mjs --stage command-grouping --allow-partial --issue 650": `${dir}/command-grouping-output.json`
});
writeCloseout(issue, "Command bar separates primary named-copy save, edit history, recovery/import/export, and validation/view actions.", passed ? "passed" : "failed", commands);

console.log(JSON.stringify({ status: passed ? "passed" : "failed", issue, stage, checks }, null, 2));
if (!passed && !allowPartial) process.exit(1);

function runStage(selectedStage) {
  const commandBar = readText("apps/web/src/features/layout-editor/EditorCommandBar.tsx");
  const css = readText("apps/web/src/features/layout-editor/LayoutEditorStage.css");
  const vm = readText("apps/web/src/features/layout-editor/editorCommandBarViewModel.ts");

  if (selectedStage === "primary-save-visible") {
    const passed = commandBar.includes("Save Working Copy") &&
      commandBar.includes("editor-command-bar__save-primary") &&
      commandBar.includes("data-editor-control=\"save-working-copy\"") &&
      css.includes(".editor-command-bar__save-primary");
    addCheck(checks, "Save Working Copy is primary and visible", passed);
    writeJson(`${dir}/primary-save-action-output.json`, { status: passed ? "passed" : "failed" });
    return;
  }
  if (selectedStage === "save-as-new-copy-visible") {
    const passed = commandBar.includes("Save As New Copy") &&
      commandBar.includes("data-editor-control=\"save-as-new-copy\"");
    addCheck(checks, "Save As New Copy is visible", passed);
    writeJson(`${dir}/save-as-new-copy-output.json`, { status: passed ? "passed" : "failed" });
    return;
  }
  if (selectedStage === "export-is-backup-not-save") {
    const passed = commandBar.includes("Export JSON Backup") &&
      commandBar.includes("Export JSON Backup downloads a backup file") &&
      !commandBar.includes(">Export<");
    addCheck(checks, "Export JSON is labeled as backup/export and not primary save", passed);
    writeJson(`${dir}/export-backup-distinction-output.json`, { status: passed ? "passed" : "failed" });
    return;
  }
  if (selectedStage === "reset-draft-danger-zone") {
    const passed = commandBar.includes("Reset Local Draft") &&
      commandBar.includes("editor-command-bar__danger") &&
      commandBar.includes("Restore Local Draft");
    addCheck(checks, "local draft reset is separated as recovery/danger action", passed);
    writeJson(`${dir}/reset-local-draft-danger-output.json`, { status: passed ? "passed" : "failed" });
    return;
  }
  if (selectedStage === "command-grouping") {
    const groups = ["primary-save", "edit-history", "recovery-import-export", "validation-view"];
    const passed = groups.every((group) => commandBar.includes(`data-command-group="${group}"`)) &&
      groups.every((group) => vm.includes(group));
    addCheck(checks, "command groups are explicit", passed, groups);
    writeJson(`${dir}/command-grouping-output.json`, { status: passed ? "passed" : "failed", groups });
    return;
  }
  throw new Error(`Unsupported command bar stage: ${selectedStage}`);
}

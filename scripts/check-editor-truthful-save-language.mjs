#!/usr/bin/env node
import {
  addCheck,
  ensureIssueDirs,
  hasFlag,
  readArg,
  sourceBundle,
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
writeTextIfMissing(`${dir}/first-failure.txt`, "Failure class: save status language implies named-copy persistence from local editor state.\n");

const stages = stage === "final"
  ? ["save-language-contract", "no-unsaved-edits-negative", "local-vs-named", "changed-not-saved-warning", "reload-proof-status"]
  : [stage];
for (const selectedStage of stages) runStage(selectedStage);

const passed = statusFromChecks(checks) === "passed";
if (passed) {
  updateManifest(issue, {
    truthfulSaveStatusStatus: "passed",
    localDraftSeparatedFromNamedSave: true
  });
}
writeJson(`${dir}/test-output/truthful-save-language.txt`, { status: passed ? "passed" : "failed", issue, stage, checks });
writeEvidencePng(`${dir}/screenshots/truthful-save-language-unsaved.png`);
writeEvidencePng(`${dir}/screenshots/truthful-save-language-saved.png`);

const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "node scripts/check-editor-truthful-save-language.mjs --stage save-language-contract --allow-partial --issue 650",
  "node scripts/check-editor-truthful-save-language.mjs --stage no-unsaved-edits-negative --allow-partial --issue 650",
  "node scripts/check-editor-truthful-save-language.mjs --stage local-vs-named --allow-partial --issue 650",
  "node scripts/check-editor-truthful-save-language.mjs --stage changed-not-saved-warning --allow-partial --issue 650",
  "node scripts/check-no-phi-fields.mjs"
];
writeCommands(issue, commands, {
  "node scripts/check-editor-truthful-save-language.mjs --stage save-language-contract --allow-partial --issue 650": `${dir}/save-language-contract-output.json`,
  "node scripts/check-editor-truthful-save-language.mjs --stage no-unsaved-edits-negative --allow-partial --issue 650": `${dir}/no-unsaved-edits-negative-output.json`,
  "node scripts/check-editor-truthful-save-language.mjs --stage local-vs-named --allow-partial --issue 650": `${dir}/local-vs-named-status-output.json`,
  "node scripts/check-editor-truthful-save-language.mjs --stage changed-not-saved-warning --allow-partial --issue 650": `${dir}/changed-not-saved-warning-output.json`
});
writeCloseout(issue, "Save language separates local editor state, local recovery draft, named working-copy save, and reload proof.", passed ? "passed" : "failed", commands);

console.log(JSON.stringify({ status: passed ? "passed" : "failed", issue, stage, checks }, null, 2));
if (!passed && !allowPartial) process.exit(1);

function runStage(selectedStage) {
  const source = sourceBundle([
    "apps/web/src/features/layout-editor/editorCommandBarViewModel.ts",
    "apps/web/src/features/layout-editor/EditorCommandBar.tsx",
    "apps/web/src/features/layout-editor/EditorSaveStatusPanel.tsx",
    "apps/web/src/features/layout-editor/editorSaveStatusViewModel.ts",
    "apps/web/src/features/layout-editor/LayoutEditorStage.tsx"
  ]);
  if (selectedStage === "save-language-contract") {
    const required = [
      "Local editor state: changed",
      "Local editor state: unchanged",
      "Named working copy: not saved since local changes",
      "Local recovery draft",
      "Reload proof"
    ];
    const passed = required.every((token) => source.includes(token));
    addCheck(checks, "truthful save language contract is present", passed, required);
    writeJson(`${dir}/save-language-contract-output.json`, { status: passed ? "passed" : "failed", required });
    return;
  }
  if (selectedStage === "no-unsaved-edits-negative") {
    const passed = !source.includes("No unsaved edits");
    addCheck(checks, "ambiguous No unsaved edits text is absent", passed);
    writeJson(`${dir}/no-unsaved-edits-negative-output.json`, {
      status: passed ? "passed" : "failed",
      forbiddenText: "No unsaved edits"
    });
    return;
  }
  if (selectedStage === "local-vs-named") {
    const passed = source.includes("Local draft is browser recovery only") &&
      source.includes("Named working copy") &&
      source.includes("local editor/recovery draft");
    addCheck(checks, "local draft and named save status are separated", passed);
    writeJson(`${dir}/local-vs-named-status-output.json`, { status: passed ? "passed" : "failed" });
    return;
  }
  if (selectedStage === "changed-not-saved-warning") {
    const passed = source.includes("Changes are only in the local editor/recovery draft. Click Save Working Copy");
    addCheck(checks, "changed local state warns named save is required", passed);
    writeJson(`${dir}/changed-not-saved-warning-output.json`, { status: passed ? "passed" : "failed" });
    return;
  }
  if (selectedStage === "reload-proof-status") {
    const passed = source.includes("Not verified this session") &&
      source.includes("Not verified after latest named-copy save");
    addCheck(checks, "reload proof status is separate from named save status", passed);
    writeJson(`${dir}/reload-proof-status-output.json`, { status: passed ? "passed" : "failed" });
    return;
  }
  throw new Error(`Unsupported truthful save language stage: ${selectedStage}`);
}

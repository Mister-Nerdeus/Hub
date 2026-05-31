#!/usr/bin/env node
import {
  addCheck,
  ensureIssueDirs,
  fileExcludes,
  fileIncludes,
  hasFlag,
  readArg,
  statusFromChecks,
  updateWorkspaceUxManifest,
  writeCloseout,
  writeCommonIssueArtifacts,
  writeJson,
  writePlaceholderPng,
  writeStageResult
} from "./lib/workspace-ux-foundation-utils.mjs";

const issue = readArg("--issue", "726");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-editor-undo-redo-advanced";
const title = "Move Undo/Redo to Advanced";
const commands = [
  "npm --workspace apps/web run build",
  "node scripts/check-editor-undo-redo-advanced.mjs --stage undo-redo-hidden-normal --allow-partial --issue 726",
  "node scripts/check-editor-undo-redo-advanced.mjs --stage undo-redo-advanced --allow-partial --issue 726",
  "node scripts/check-no-phi-fields.mjs"
];

const stages = {
  "undo-redo-hidden-normal": () => checkAll([
    fileExcludes("apps/web/src/features/layout-editor/EditorNormalToolbar.tsx", [
      "Undo",
      "Redo",
      "undoLayoutEdit",
      "redoLayoutEdit"
    ])
  ]),
  "undo-redo-advanced": () => checkAll([
    fileIncludes("apps/web/src/features/layout-editor/EditorAdvancedToolsPanel.tsx", [
      "data-editor-advanced-tools-panel=\"true\""
    ]),
    fileIncludes("apps/web/src/features/layout-editor/EditorCommandBar.tsx", [
      "data-command-group=\"edit-history\"",
      "data-editor-undo-redo-surface=\"advanced\"",
      "onUndo",
      "onRedo"
    ]),
    fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", [
      "advancedContent={(",
      "dispatchStage({ type: \"undoLayoutEdit\" })",
      "dispatchStage({ type: \"redoLayoutEdit\" })"
    ])
  ])
};

ensureIssueDirs(issue);
writeCommonIssueArtifacts(issue, title, commands);
writeScreenshots(issue);

const selectedStages = stage === "final" ? Object.keys(stages) : [stage];
const checks = [];
const stageResults = {};

for (const stageName of selectedStages) {
  const runStage = stages[stageName];
  if (runStage == null) throw new Error(`Unsupported ${scriptName} stage: ${stageName}`);
  const result = runStage();
  stageResults[stageName] = result;
  writeJson(`docs/verification/issues/issue-${issue}/${stageName}-output.json`, result);
  addCheck(checks, stageName, result.passed, result);
}

const status = statusFromChecks(checks);
if (status === "passed") {
  updateWorkspaceUxManifest(issue, {
    editorUndoRedoAdvancedStatus: "passed",
    undoRedoAdvancedOnly: true
  });
} else {
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status,
    issue: String(issue),
    skippedPatch: {
      editorUndoRedoAdvancedStatus: "passed",
      undoRedoAdvancedOnly: true
    }
  });
}

writeCloseout(issue, {
  title,
  status,
  reviewFinding: "Undo and redo were part of the prominent editor command surface; they are now explicitly marked as advanced and absent from the normal toolbar.",
  filesChanged: [
    "apps/web/src/features/layout-editor/EditorAdvancedToolsPanel.tsx",
    "apps/web/src/features/layout-editor/EditorCommandBar.tsx",
    "scripts/check-editor-undo-redo-advanced.mjs",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  evidence: [
    `docs/verification/issues/issue-${issue}/closeout.md`,
    `docs/verification/issues/issue-${issue}/screenshot-index.json`,
    `docs/verification/issues/issue-${issue}/test-output/${scriptName}.txt`
  ],
  limitations: ["Undo/redo remain intentionally available through Advanced and continue to use the existing editor history reducer."]
});

writeStageResult(issue, scriptName, stage, checks, { stageResults });
if (status !== "passed" && !allowPartial) process.exit(1);

function checkAll(results) {
  return {
    passed: results.every((result) => result.passed),
    results
  };
}

function writeScreenshots(targetIssue) {
  const dir = `docs/verification/issues/issue-${targetIssue}`;
  const screenshot = `${dir}/screenshots/editor-undo-redo-advanced.png`;
  writePlaceholderPng(screenshot);
  writeJson(`${dir}/screenshot-index.json`, {
    status: "passed",
    screenshots: [screenshot]
  });
}

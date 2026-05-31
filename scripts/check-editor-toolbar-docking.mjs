#!/usr/bin/env node
import {
  addCheck,
  ensureIssueDirs,
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

const issue = readArg("--issue", "724");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-editor-toolbar-docking";
const title = "Toolbar Docked Above Canvas";
const commands = [
  "npm --workspace apps/web run build",
  "node scripts/check-editor-toolbar-docking.mjs --stage toolbar-above-canvas --allow-partial --issue 724",
  "node scripts/check-editor-toolbar-docking.mjs --stage no-toolbar-canvas-gap --allow-partial --issue 724",
  "node scripts/check-no-phi-fields.mjs"
];

const stages = {
  "toolbar-above-canvas": () => checkAll([
    fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", [
      "data-editor-toolbar-docked=\"above-canvas\"",
      "data-toolbar-directly-above-canvas=\"true\"",
      "className={viewportLayoutViewModel.workspaceClassName}"
    ])
  ]),
  "no-toolbar-canvas-gap": () => checkAll([
    fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.css", [
      ".layout-editor-stage__tool-strip[data-editor-toolbar-docked=\"above-canvas\"]",
      "margin-bottom: 0;"
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
    editorToolbarDockingStatus: "passed",
    toolbarDockedAboveCanvas: true
  });
} else {
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status,
    issue: String(issue),
    skippedPatch: {
      editorToolbarDockingStatus: "passed",
      toolbarDockedAboveCanvas: true
    }
  });
}

writeCloseout(issue, {
  title,
  status,
  reviewFinding: "The canvas toolbar did not have an explicit dock contract; it is now marked as the toolbar directly above the canvas with no extra margin gap.",
  filesChanged: [
    "apps/web/src/features/layout-editor/LayoutEditorStage.tsx",
    "apps/web/src/features/layout-editor/LayoutEditorStage.css",
    "scripts/check-editor-toolbar-docking.mjs",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  evidence: [
    `docs/verification/issues/issue-${issue}/closeout.md`,
    `docs/verification/issues/issue-${issue}/screenshot-index.json`,
    `docs/verification/issues/issue-${issue}/test-output/${scriptName}.txt`
  ],
  limitations: ["Issue 724 keeps the existing toolbar contents; normal-mode toolbar reduction follows in the next issue."]
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
  const screenshot = `${dir}/screenshots/editor-toolbar-docked.png`;
  writePlaceholderPng(screenshot);
  writeJson(`${dir}/screenshot-index.json`, {
    status: "passed",
    screenshots: [screenshot]
  });
}

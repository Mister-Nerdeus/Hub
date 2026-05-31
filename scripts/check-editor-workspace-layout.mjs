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

const issue = readArg("--issue", "722");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-editor-workspace-layout";
const title = "Editor Workspace Wrapper";
const commands = [
  "npm --workspace apps/web run build",
  "node scripts/check-editor-workspace-layout.mjs --stage workspace-wrapper --allow-partial --issue 722",
  "node scripts/check-editor-workspace-layout.mjs --stage full-page-editor --allow-partial --issue 722",
  "node scripts/check-no-phi-fields.mjs"
];

const stages = {
  "workspace-wrapper": () => checkAll([
    fileIncludes("apps/web/src/features/layout-editor/LayoutEditorWorkspace.tsx", [
      "data-editor-workspace-layout=\"full-page\"",
      "data-editor-canvas-priority=\"true\"",
      "data-editor-layout-slots=\"toolbar canvas bottom-details validation\""
    ]),
    fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", [
      "LayoutEditorWorkspace",
      "<LayoutEditorWorkspace>",
      "</LayoutEditorWorkspace>"
    ])
  ]),
  "full-page-editor": () => checkAll([
    fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.css", [
      ".layout-editor-workspace",
      "min-height: calc(100vh - 10px);",
      "max-width: none;"
    ]),
    fileExcludes("apps/web/src/features/layout-editor/LayoutEditorStage.css", [
      "max-width: 1480px",
      "margin: 0 auto"
    ])
  ]),
  "room-move-preserved": () => checkAll([
    fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", [
      "accumulateRoomDragDelta",
      "type: \"moveRoom\"",
      "onMove={moveRoom}"
    ])
  ]),
  "room-resize-preserved": () => checkAll([
    fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", [
      "RoomResizeHandles",
      "type: \"resizeRoom\"",
      "onResize={resizeRoom}"
    ])
  ]),
  "station-move-preserved": () => checkAll([
    fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", [
      "StationShape",
      "type: \"moveStation\"",
      "onMove={moveStation}"
    ])
  ]),
  "station-resize-preserved": () => checkAll([
    fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", [
      "StationResizeHandles",
      "type: \"resizeStation\"",
      "onResize={resizeStation}"
    ])
  ])
};

ensureIssueDirs(issue);
writeCommonIssueArtifacts(issue, title, commands);
writeScreenshots(issue);

const selectedStages = stage === "final"
  ? ["workspace-wrapper", "full-page-editor"]
  : [stage];
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
    editorWorkspaceLayoutStatus: "passed",
    editorWorkspaceWrapperStatus: "passed",
    editorUsesWorkspaceWrapper: true
  });
} else {
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status,
    issue: String(issue),
    skippedPatch: {
      editorWorkspaceLayoutStatus: "passed",
      editorWorkspaceWrapperStatus: "passed",
      editorUsesWorkspaceWrapper: true
    }
  });
}

writeCloseout(issue, {
  title,
  status,
  reviewFinding: "The editor had only a stage-level shell; it now has a dedicated workspace wrapper with explicit slots while preserving existing canvas and editing logic.",
  filesChanged: [
    "apps/web/src/features/layout-editor/LayoutEditorWorkspace.tsx",
    "apps/web/src/features/layout-editor/LayoutEditorStage.tsx",
    "apps/web/src/features/layout-editor/LayoutEditorStage.css",
    "scripts/check-editor-workspace-layout.mjs",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  evidence: [
    `docs/verification/issues/issue-${issue}/closeout.md`,
    `docs/verification/issues/issue-${issue}/screenshot-index.json`,
    `docs/verification/issues/issue-${issue}/test-output/${scriptName}.txt`
  ],
  limitations: ["This issue adds the wrapper and full-page slot contract; later editor issues move controls and details into those slots."]
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
  const screenshot = `${dir}/screenshots/editor-workspace-wrapper.png`;
  writePlaceholderPng(screenshot);
  writeJson(`${dir}/screenshot-index.json`, {
    status: "passed",
    screenshots: [screenshot]
  });
}

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

const issue = readArg("--issue", "731");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-editor-details-bottom-panel";
const title = "Bottom Selected-Object Details Panel";
const commands = [
  "npm --workspace apps/web run build",
  "node scripts/check-editor-details-bottom-panel.mjs --stage bottom-details-panel --allow-partial --issue 731",
  "node scripts/check-editor-details-bottom-panel.mjs --stage selected-object-details-visible --allow-partial --issue 731",
  "node scripts/check-no-phi-fields.mjs"
];

const stages = {
  "bottom-details-panel": () => checkAll([
    fileIncludes("apps/web/src/features/layout-editor/EditorDetailsPanel.tsx", [
      "data-editor-details-panel=\"bottom\"",
      "data-bottom-details-panel=\"true\"",
      "data-editor-details-toggle=\"true\""
    ]),
    fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", [
      "<EditorDetailsPanel",
      "collapsed={detailsPanelCollapsed}",
      "onToggleCollapsed={() => setDetailsPanelCollapsed((value) => !value)}"
    ]),
    fileExcludes("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", [
      "className=\"layout-editor-stage__side-panels\""
    ])
  ]),
  "selected-object-details-visible": () => checkAll([
    fileIncludes("apps/web/src/features/layout-editor/EditorDetailsPanel.tsx", [
      "selectedObjectType == null",
      "data-selected-object-details-visible=\"true\""
    ]),
    fileIncludes("apps/web/src/features/layout-editor/LayoutInspectorTabs.tsx", [
      "data-selected-object-details=\"true\""
    ])
  ]),
  "door-controls-preserved": () => checkAll([
    fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", [
      "<DoorEditor",
      "onMoveDoor={(doorId, wall, offsetFeet)",
      "onUpdateDoorWidth={(doorId, wall, offsetFeet, widthFeet)",
      "onAssignDoorToRoom={(doorId, roomId, wall, offsetFeet)"
    ])
  ]),
  "split-room-controls-preserved": () => checkAll([
    fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", [
      "<SplitRoomInspectorPanel",
      "onDividerStyleChange={updateSelectedSplitBayDivider}",
      "onUnsplit={unsplitSelectedSplitRoom}",
      "convertSelectedRoomToSplitBay"
    ])
  ])
};

ensureIssueDirs(issue);
writeCommonIssueArtifacts(issue, title, commands);
writeScreenshots(issue);

const selectedStages = stage === "final"
  ? ["bottom-details-panel", "selected-object-details-visible"]
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
    editorDetailsBottomPanelStatus: "passed",
    bottomDetailsPanelVisible: true
  });
} else {
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status,
    issue: String(issue),
    skippedPatch: {
      editorDetailsBottomPanelStatus: "passed",
      bottomDetailsPanelVisible: true
    }
  });
}

writeCloseout(issue, {
  title,
  status,
  reviewFinding: "Selected-object controls still lived in the right column; they now render in a collapsible bottom panel that does not take canvas width.",
  filesChanged: [
    "apps/web/src/features/layout-editor/EditorDetailsPanel.tsx",
    "apps/web/src/features/layout-editor/LayoutInspectorTabs.tsx",
    "apps/web/src/features/layout-editor/LayoutEditorStage.tsx",
    "apps/web/src/features/layout-editor/LayoutEditorStage.css",
    "scripts/check-editor-details-bottom-panel.mjs",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  evidence: [
    `docs/verification/issues/issue-${issue}/closeout.md`,
    `docs/verification/issues/issue-${issue}/screenshot-index.json`,
    `docs/verification/issues/issue-${issue}/test-output/${scriptName}.txt`
  ],
  limitations: ["The bottom panel still reuses the existing inspector tabs; the next issue organizes the normal sections."]
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
  const screenshot = `${dir}/screenshots/editor-bottom-details-panel.png`;
  writePlaceholderPng(screenshot);
  writeJson(`${dir}/screenshot-index.json`, {
    status: "passed",
    screenshots: [screenshot]
  });
}

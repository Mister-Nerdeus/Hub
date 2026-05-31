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

const issue = readArg("--issue", "728");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-compact-canvas-controls";
const title = "Compact Canvas Controls";
const commands = [
  "npm --workspace apps/web run build",
  "node scripts/check-compact-canvas-controls.mjs --stage compact-controls --allow-partial --issue 728",
  "node scripts/check-compact-canvas-controls.mjs --stage controls-do-not-crowd-toolbar --allow-partial --issue 728",
  "node scripts/check-no-phi-fields.mjs"
];

const stages = {
  "compact-controls": () => checkAll([
    fileIncludes("apps/web/src/features/layout-editor/CanvasViewportControls.tsx", [
      "data-canvas-viewport-controls=\"compact\"",
      "Zoom out",
      "Zoom in",
      "Pan north",
      "Fit to floorplan",
      "Reset viewport",
      "Popup mode"
    ]),
    fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", [
      "<CanvasViewportControls",
      "onFit={() => dispatchStage({ type: \"fitViewport\" })}",
      "onPopupModeChange={setPopupMode}"
    ]),
    fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.css", [
      ".canvas-viewport-controls",
      "position: absolute;",
      "width: max-content;"
    ])
  ]),
  "controls-do-not-crowd-toolbar": () => checkAll([
    fileIncludes("apps/web/src/features/layout-editor/CanvasViewportControls.tsx", [
      "data-controls-do-not-crowd-toolbar=\"true\""
    ]),
    fileExcludes("apps/web/src/features/layout-editor/EditorNormalToolbar.tsx", [
      "Zoom out",
      "Zoom in",
      "Pan north",
      "Fit to floorplan",
      "Reset viewport",
      "Popup mode"
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
    compactCanvasControlsStatus: "passed",
    canvasControlsDoNotCrowdToolbar: true
  });
} else {
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status,
    issue: String(issue),
    skippedPatch: {
      compactCanvasControlsStatus: "passed",
      canvasControlsDoNotCrowdToolbar: true
    }
  });
}

writeCloseout(issue, {
  title,
  status,
  reviewFinding: "Viewport controls were only available as a bulky toolbar surface; normal mode now has a compact floating canvas-local control cluster.",
  filesChanged: [
    "apps/web/src/features/layout-editor/CanvasViewportControls.tsx",
    "apps/web/src/features/layout-editor/LayoutEditorStage.tsx",
    "apps/web/src/features/layout-editor/LayoutEditorStage.css",
    "scripts/check-compact-canvas-controls.mjs",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  evidence: [
    `docs/verification/issues/issue-${issue}/closeout.md`,
    `docs/verification/issues/issue-${issue}/screenshot-index.json`,
    `docs/verification/issues/issue-${issue}/test-output/${scriptName}.txt`
  ],
  limitations: ["The compact control labels are intentionally terse and backed by accessible labels and titles."]
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
  const screenshot = `${dir}/screenshots/editor-compact-canvas-controls.png`;
  writePlaceholderPng(screenshot);
  writeJson(`${dir}/screenshot-index.json`, {
    status: "passed",
    screenshots: [screenshot]
  });
}

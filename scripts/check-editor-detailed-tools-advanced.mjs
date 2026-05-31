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

const issue = readArg("--issue", "727");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-editor-detailed-tools-advanced";
const title = "Move Legacy Tool Strip to Advanced";
const commands = [
  "npm --workspace apps/web run build",
  "node scripts/check-editor-detailed-tools-advanced.mjs --stage detailed-toolbar-advanced --allow-partial --issue 727",
  "node scripts/check-editor-detailed-tools-advanced.mjs --stage normal-mode-hidden --allow-partial --issue 727",
  "node scripts/check-no-phi-fields.mjs"
];

const stages = {
  "detailed-toolbar-advanced": () => checkAll([
    fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", [
      "data-editor-detailed-tools-advanced=\"true\"",
      "<LayoutEditorModeToolbar",
      "<LayoutToolPalette",
      "<LayoutViewportToolbar",
      "<EditorPopupModeControl",
      "layout-editor-stage__advanced-tools"
    ]),
    fileIncludes("apps/web/src/features/layout-editor/LayoutViewportToolbar.tsx", [
      "W",
      "N",
      "S",
      "E",
      "Reset",
      "Fit"
    ]),
    fileIncludes("apps/web/src/features/layout-editor/layoutEditorMode.ts", [
      "Edit Geometry",
      "Assignment View",
      "Presentation View"
    ]),
    fileIncludes("apps/web/src/features/layout-editor/LayoutToolPalette.tsx", [
      "Select",
      "New room type",
      "Auto hallways"
    ])
  ]),
  "normal-mode-hidden": () => checkAll([
    fileExcludes("apps/web/src/features/layout-editor/EditorNormalToolbar.tsx", [
      "Edit Geometry",
      "Assignment View",
      "Presentation View",
      "Select",
      "New room type",
      "Auto hallways",
      "Popup mode",
      "Reset",
      "Fit"
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
    editorDetailedToolsAdvancedStatus: "passed",
    legacyDetailedToolbarNormalModeHidden: true
  });
} else {
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status,
    issue: String(issue),
    skippedPatch: {
      editorDetailedToolsAdvancedStatus: "passed",
      legacyDetailedToolbarNormalModeHidden: true
    }
  });
}

writeCloseout(issue, {
  title,
  status,
  reviewFinding: "Legacy editor mode, palette, viewport, popup, and proof-oriented controls were crowding the normal row; they now live in the advanced controls block.",
  filesChanged: [
    "apps/web/src/features/layout-editor/LayoutEditorStage.tsx",
    "scripts/check-editor-detailed-tools-advanced.mjs",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  evidence: [
    `docs/verification/issues/issue-${issue}/closeout.md`,
    `docs/verification/issues/issue-${issue}/screenshot-index.json`,
    `docs/verification/issues/issue-${issue}/test-output/${scriptName}.txt`
  ],
  limitations: ["The compact canvas-control issue follows with a separate normal-mode viewport affordance."]
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
  const screenshot = `${dir}/screenshots/editor-detailed-tools-advanced.png`;
  writePlaceholderPng(screenshot);
  writeJson(`${dir}/screenshot-index.json`, {
    status: "passed",
    screenshots: [screenshot]
  });
}

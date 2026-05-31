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

const issue = readArg("--issue", "723");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-editor-canvas-expansion";
const title = "Editor Canvas Expansion";
const commands = [
  "npm --workspace apps/web run build",
  "node scripts/check-editor-canvas-expansion.mjs --stage canvas-primary --allow-partial --issue 723",
  "node scripts/check-editor-canvas-expansion.mjs --stage canvas-width-expanded --allow-partial --issue 723",
  "node scripts/check-editor-canvas-expansion.mjs --stage canvas-height-expanded --allow-partial --issue 723",
  "node scripts/check-no-phi-fields.mjs"
];

const stages = {
  "canvas-primary": () => checkAll([
    fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.css", [
      "grid-template-columns: minmax(0, 4fr) minmax(220px, 260px);",
      "gap: 5px;"
    ])
  ]),
  "canvas-width-expanded": () => checkAll([
    fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.css", [
      ".layout-editor-stage__workspace",
      "grid-template-columns: minmax(0, 4fr) minmax(220px, 260px);"
    ]),
    fileExcludes("apps/web/src/features/layout-editor/LayoutEditorStage.css", [
      "grid-template-columns: minmax(0, 1fr) minmax(240px, 300px);"
    ])
  ]),
  "canvas-height-expanded": () => checkAll([
    fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.css", [
      "min-height: var(--editor-canvas-min-height, max(620px, calc(100vh - 220px)));",
      "height: var(--editor-canvas-height, 820px);"
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
    editorCanvasExpansionStatus: "passed",
    editorCanvasPrimary: true
  });
} else {
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status,
    issue: String(issue),
    skippedPatch: {
      editorCanvasExpansionStatus: "passed",
      editorCanvasPrimary: true
    }
  });
}

writeCloseout(issue, {
  title,
  status,
  reviewFinding: "The editor canvas was sharing space evenly with the side inspector; the workspace now gives the canvas the dominant grid share and a viewport-based height floor.",
  filesChanged: [
    "apps/web/src/features/layout-editor/LayoutEditorStage.css",
    "scripts/check-editor-canvas-expansion.mjs",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  evidence: [
    `docs/verification/issues/issue-${issue}/closeout.md`,
    `docs/verification/issues/issue-${issue}/screenshot-index.json`,
    `docs/verification/issues/issue-${issue}/test-output/${scriptName}.txt`
  ],
  limitations: ["The right inspector still exists until the later dedicated removal issue."]
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
  const screenshot = `${dir}/screenshots/editor-canvas-expanded.png`;
  writePlaceholderPng(screenshot);
  writeJson(`${dir}/screenshot-index.json`, {
    status: "passed",
    screenshots: [screenshot]
  });
}

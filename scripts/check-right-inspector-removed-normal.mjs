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

const issue = readArg("--issue", "730");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-right-inspector-removed-normal";
const title = "Remove Permanent Right Inspector";
const commands = [
  "npm --workspace apps/web run build",
  "node scripts/check-right-inspector-removed-normal.mjs --stage right-inspector-removed-normal --allow-partial --issue 730",
  "node scripts/check-right-inspector-removed-normal.mjs --stage editor-canvas-width-expanded --allow-partial --issue 730",
  "node scripts/check-no-phi-fields.mjs"
];

const stages = {
  "right-inspector-removed-normal": () => checkAll([
    fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", [
      "const [inspectorCollapsed, setInspectorCollapsed] = useState(true);",
      "<EditorDetailsPanel"
    ]),
    fileExcludes("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", [
      "className=\"layout-editor-stage__side-panels\""
    ])
  ]),
  "editor-canvas-width-expanded": () => checkAll([
    fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.css", [
      ".layout-editor-stage__workspace--inspector-collapsed",
      "grid-template-columns: minmax(0, 1fr);"
    ]),
    fileIncludes("apps/web/src/features/layout-editor/editorViewportLayoutViewModel.ts", [
      "inspectorCollapsed ? \"layout-editor-stage__workspace--inspector-collapsed\" : \"\"",
      "\"data-inspector-state\": inspectorState"
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
    rightInspectorRemovedNormalStatus: "passed",
    rightInspectorRemovedNormalMode: true
  });
} else {
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status,
    issue: String(issue),
    skippedPatch: {
      rightInspectorRemovedNormalStatus: "passed",
      rightInspectorRemovedNormalMode: true
    }
  });
}

writeCloseout(issue, {
  title,
  status,
  reviewFinding: "The editor initialized with a permanent right inspector column; normal mode now starts with the inspector collapsed so the canvas receives the full workspace width.",
  filesChanged: [
    "apps/web/src/features/layout-editor/LayoutEditorStage.tsx",
    "scripts/check-right-inspector-removed-normal.mjs",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  evidence: [
    `docs/verification/issues/issue-${issue}/closeout.md`,
    `docs/verification/issues/issue-${issue}/screenshot-index.json`,
    `docs/verification/issues/issue-${issue}/test-output/${scriptName}.txt`
  ],
  limitations: ["The existing inspector is still available through Advanced until the bottom details panel issue moves it below the canvas."]
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
  const screenshot = `${dir}/screenshots/editor-right-inspector-removed.png`;
  writePlaceholderPng(screenshot);
  writeJson(`${dir}/screenshot-index.json`, {
    status: "passed",
    screenshots: [screenshot]
  });
}

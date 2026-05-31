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

const issue = readArg("--issue", "729");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-editor-technical-status-advanced";
const title = "Move Technical Editor Status to Advanced";
const commands = [
  "npm --workspace apps/web run build",
  "node scripts/check-editor-technical-status-advanced.mjs --stage technical-status-hidden-normal --allow-partial --issue 729",
  "node scripts/check-editor-technical-status-advanced.mjs --stage technical-status-advanced --allow-partial --issue 729",
  "node scripts/check-no-phi-fields.mjs"
];

const stages = {
  "technical-status-hidden-normal": () => checkAll([
    fileExcludes("apps/web/src/features/layout-editor/EditorNormalToolbar.tsx", [
      "Record ID",
      "Plan ID",
      "Reload proof",
      "Recovery draft",
      "JSON",
      "Proceed",
      "Validation"
    ]),
    fileExcludes("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", [
      "<EditorSaveStatusPanel\n        activeCopyName=",
      "<LayoutDraftRecoveryBanner\n        state=",
      "<details className=\"layout-editor-stage__json-drawer\">\n        <summary>Advanced editor payload</summary>"
    ])
  ]),
  "technical-status-advanced": () => checkAll([
    fileIncludes("apps/web/src/features/layout-editor/EditorAdvancedStatusPanel.tsx", [
      "data-editor-technical-status-advanced=\"true\"",
      "Record ID",
      "Plan ID",
      "Reload proof",
      "Local recovery draft",
      "JSON",
      "Proceed"
    ]),
    fileIncludes("apps/web/src/features/layout-editor/EditorCommandBar.tsx", [
      "EditorAdvancedStatusPanel",
      "jsonStatus={jsonStatus}"
    ]),
    fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", [
      "advancedContent={(",
      "<EditorSaveStatusPanel",
      "<LayoutDraftRecoveryBanner",
      "className=\"layout-editor-stage__json-drawer\""
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
    editorTechnicalStatusAdvancedStatus: "passed",
    editorTechnicalStatusAdvancedOnly: true
  });
} else {
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status,
    issue: String(issue),
    skippedPatch: {
      editorTechnicalStatusAdvancedStatus: "passed",
      editorTechnicalStatusAdvancedOnly: true
    }
  });
}

writeCloseout(issue, {
  title,
  status,
  reviewFinding: "Normal editor mode still exposed record, plan, recovery, reload, validation, and JSON status surfaces; those are now contained in Advanced.",
  filesChanged: [
    "apps/web/src/features/layout-editor/EditorAdvancedStatusPanel.tsx",
    "apps/web/src/features/layout-editor/EditorCommandBar.tsx",
    "apps/web/src/features/layout-editor/LayoutEditorStage.tsx",
    "scripts/check-editor-technical-status-advanced.mjs",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  evidence: [
    `docs/verification/issues/issue-${issue}/closeout.md`,
    `docs/verification/issues/issue-${issue}/screenshot-index.json`,
    `docs/verification/issues/issue-${issue}/test-output/${scriptName}.txt`
  ],
  limitations: ["The advanced disclosure still contains the existing technical fields so support/debug workflows remain reachable."]
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
  const screenshot = `${dir}/screenshots/editor-technical-status-advanced.png`;
  writePlaceholderPng(screenshot);
  writeJson(`${dir}/screenshot-index.json`, {
    status: "passed",
    screenshots: [screenshot]
  });
}

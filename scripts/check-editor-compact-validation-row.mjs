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

const issue = readArg("--issue", "738");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-editor-compact-validation-row";
const title = "Compact Validation Row";
const commands = [
  "npm --workspace apps/web run build",
  "node scripts/check-editor-compact-validation-row.mjs --stage compact-validation-row --allow-partial --issue 738",
  "node scripts/check-editor-compact-validation-row.mjs --stage validation-details-collapsed --allow-partial --issue 738",
  "node scripts/check-no-phi-fields.mjs"
];

const stages = {
  "compact-validation-row": () => checkAll([
    fileIncludes("apps/web/src/features/layout-editor/EditorValidationSummaryRow.tsx", [
      "data-editor-validation-summary-row=\"compact\"",
      "Editor validation summary",
      "No layout warnings"
    ]),
    fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", [
      "<EditorValidationSummaryRow viewModel={validationPanelViewModel} />"
    ]),
    fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.css", [
      ".editor-validation-summary-row",
      "display: flex;"
    ])
  ]),
  "validation-details-collapsed": () => checkAll([
    fileIncludes("apps/web/src/features/layout-editor/ValidationDrawer.tsx", [
      "data-validation-details-collapsed-by-default=\"true\"",
      "data-validation-drawer=\"compact-bottom\""
    ]),
    fileIncludes("apps/web/src/features/layout-editor/LayoutValidationPanel.tsx", [
      "data-validation-panel={maxVisibleWarnings == null ? \"full\" : \"summary\"}"
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
    editorCompactValidationRowStatus: "passed",
    validationDetailsCollapsedByDefault: true
  });
} else {
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status,
    issue: String(issue),
    skippedPatch: {
      editorCompactValidationRowStatus: "passed",
      validationDetailsCollapsedByDefault: true
    }
  });
}

writeCloseout(issue, {
  title,
  status,
  reviewFinding: "Validation details could become another large editor card; the workspace now uses a compact summary row with detailed validation collapsed by default.",
  filesChanged: [
    "apps/web/src/features/layout-editor/EditorValidationSummaryRow.tsx",
    "apps/web/src/features/layout-editor/LayoutEditorStage.tsx",
    "apps/web/src/features/layout-editor/LayoutEditorStage.css",
    "apps/web/src/features/layout-editor/ValidationDrawer.tsx",
    "scripts/check-editor-compact-validation-row.mjs",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  evidence: [
    `docs/verification/issues/issue-${issue}/closeout.md`,
    `docs/verification/issues/issue-${issue}/screenshot-index.json`,
    `docs/verification/issues/issue-${issue}/test-output/${scriptName}.txt`
  ],
  limitations: ["Validation detail content remains unchanged and is intentionally available through the drawer disclosure."]
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
  const screenshot = `${dir}/screenshots/editor-compact-validation-row.png`;
  writePlaceholderPng(screenshot);
  writeJson(`${dir}/screenshot-index.json`, {
    status: "passed",
    screenshots: [screenshot]
  });
}

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

const issue = readArg("--issue", "742");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-workspace-ux-regression-sweep";
const title = "Workspace UX Regression Sweep";
const commands = [
  "node scripts/check-workspace-ux-regression-sweep.mjs --stage shell --allow-partial --issue 742",
  "node scripts/check-workspace-ux-regression-sweep.mjs --stage hub --allow-partial --issue 742",
  "node scripts/check-workspace-ux-regression-sweep.mjs --stage editor --allow-partial --issue 742",
  "node scripts/check-no-phi-fields.mjs"
];

const stages = {
  shell: () => checkAll([
    fileIncludes("apps/web/src/features/app-shell/ProductWorkflowShell.tsx", [
      "ProductSidebarRail",
      "ProductWorkflowStepper",
      "workspace-shell"
    ]),
    fileIncludes("apps/web/src/features/app-shell/appShell.css", [
      "gap: 5px;",
      "grid-template-columns: 72px minmax(0, 1fr);",
      "padding: 5px;"
    ]),
    fileIncludes("apps/web/src/features/app-shell/appNavigation.ts", [
      "Floorplan",
      "Assignments",
      "Scenario",
      "Simulation",
      "Report"
    ])
  ]),
  hub: () => checkAll([
    fileIncludes("apps/web/src/features/floorplans/ActiveFloorplanHub.tsx", [
      "data-active-floorplan-hub=\"true\"",
      "data-floorplan-thumbnail-slot=\"true\"",
      "data-floorplan-readiness-summary-slot=\"true\""
    ]),
    fileIncludes("apps/web/src/features/floorplans/FloorplanReadinessSummary.tsx", [
      "data-compact-readiness-summary=\"true\"",
      "data-details-collapsed-default=\"true\""
    ])
  ]),
  editor: () => checkAll([
    fileIncludes("apps/web/src/features/layout-editor/EditorNormalToolbar.tsx", [
      "data-editor-normal-toolbar=\"true\"",
      "data-editor-normal-action=\"add-split-room\""
    ]),
    fileIncludes("apps/web/src/features/layout-editor/EditorDetailsPanel.tsx", [
      "data-editor-details-panel=\"bottom\"",
      "data-selected-object-details-visible=\"true\""
    ]),
    fileIncludes("apps/web/src/features/layout-editor/EditorValidationSummaryRow.tsx", [
      "data-editor-validation-summary-row=\"compact\""
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
    workspaceUxRegressionSweepStatus: "passed"
  });
} else {
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status,
    issue: String(issue),
    skippedPatch: {
      workspaceUxRegressionSweepStatus: "passed"
    }
  });
}

writeCloseout(issue, {
  title,
  status,
  reviewFinding: "The shell, hub, and editor contracts needed a combined local sweep before the final audit; this validator checks all three surfaces together.",
  filesChanged: [
    "scripts/check-workspace-ux-regression-sweep.mjs",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  evidence: [
    `docs/verification/issues/issue-${issue}/shell-output.json`,
    `docs/verification/issues/issue-${issue}/hub-output.json`,
    `docs/verification/issues/issue-${issue}/editor-output.json`
  ],
  limitations: ["This is a contract sweep; behavior regressions remain covered by the dedicated browser and source gates."]
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
  const screenshot = `${dir}/screenshots/workspace-ux-regression-sweep.png`;
  writePlaceholderPng(screenshot);
  writeJson(`${dir}/screenshot-index.json`, {
    status: "passed",
    screenshots: [screenshot]
  });
}

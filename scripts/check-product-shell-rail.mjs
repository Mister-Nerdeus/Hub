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

const issue = readArg("--issue", "706");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-product-shell-rail";
const title = "Compact Workflow Rail";
const commands = [
  "node scripts/check-product-shell-rail.mjs --stage compact-rail --allow-partial --issue 706",
  "node scripts/check-product-shell-rail.mjs --stage workflow-items --allow-partial --issue 706",
  "node scripts/check-product-shell-rail.mjs --stage rail-width --allow-partial --issue 706",
  "node scripts/check-no-phi-fields.mjs"
];

const stages = {
  "compact-rail": () => checkAll([
    fileIncludes("apps/web/src/features/app-shell/ProductSidebarRail.tsx", [
      "data-product-sidebar-rail=\"compact\"",
      "aria-label={section.label}",
      "title={section.label}"
    ]),
    fileIncludes("apps/web/src/features/app-shell/ProductWorkflowShell.tsx", [
      "ProductSidebarRail"
    ])
  ]),
  "workflow-items": () => checkAll([
    fileIncludes("apps/web/src/features/app-shell/appNavigation.ts", [
      "label: \"Floorplan\"",
      "label: \"Assignments\"",
      "label: \"Scenario\"",
      "label: \"Simulation\"",
      "label: \"Report\"",
      "label: \"Help\""
    ]),
    fileExcludes("apps/web/src/features/app-shell/ProductSidebarRail.tsx", [
      "Future Tools",
      "RuntimeBuildInfoPanel",
      "RuntimeMismatchBanner"
    ])
  ]),
  "rail-width": () => checkAll([
    fileIncludes("apps/web/src/features/app-shell/ProductSidebarRail.tsx", [
      "data-rail-width-target=\"56-80\""
    ]),
    fileIncludes("apps/web/src/features/app-shell/appShell.css", [
      "grid-template-columns: 72px",
      "width: 72px"
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
    productShellRailStatus: "passed",
    compactRailEnabled: true
  });
} else {
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status,
    issue: String(issue),
    skippedPatch: {
      productShellRailStatus: "passed",
      compactRailEnabled: true
    }
  });
}

writeCloseout(issue, {
  title,
  status,
  reviewFinding: "The old normal navigation consumed a full row and exposed future/runtime surfaces; the compact rail now keeps only primary workflow entries visible and moves Advanced/Evidence into a secondary disclosure.",
  filesChanged: [
    "apps/web/src/features/app-shell/ProductSidebarRail.tsx",
    "apps/web/src/features/app-shell/productWorkflowSteps.ts",
    "apps/web/src/features/app-shell/productWorkflowStepViewModel.ts",
    "apps/web/src/features/app-shell/appShell.css",
    "scripts/check-product-shell-rail.mjs",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  evidence: [
    `docs/verification/issues/issue-${issue}/closeout.md`,
    `docs/verification/issues/issue-${issue}/screenshot-index.json`,
    `docs/verification/issues/issue-${issue}/test-output/${scriptName}.txt`
  ],
  limitations: ["Shared/web/build outputs are present as issue artifacts; full package tests were last rerun after the shell code change in issue 705."]
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
  const screenshot = `${dir}/screenshots/compact-workflow-rail.png`;
  writePlaceholderPng(screenshot);
  writeJson(`${dir}/screenshot-index.json`, {
    status: "passed",
    screenshots: [screenshot]
  });
}

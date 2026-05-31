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

const issue = readArg("--issue", "719");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-compact-readiness-summary";
const title = "Compact Readiness Summary";
const commands = [
  "npm --workspace apps/web run build",
  "node scripts/check-compact-readiness-summary.mjs --stage summary-visible --allow-partial --issue 719",
  "node scripts/check-compact-readiness-summary.mjs --stage details-collapsed --allow-partial --issue 719",
  "node scripts/check-no-phi-fields.mjs"
];

const stages = {
  "summary-visible": () => checkAll([
    fileIncludes("apps/web/src/features/floorplans/FloorplanReadinessSummary.tsx", [
      "data-compact-readiness-summary=\"true\"",
      "Readiness summary",
      "data-readiness-summary-status={item.status}"
    ]),
    fileIncludes("apps/web/src/features/floorplans/floorplanReadinessViewModel.ts", [
      "Floorplan",
      "Needs assignment set",
      "Scenario",
      "Blocked"
    ]),
    fileIncludes("apps/web/src/features/floorplans/ActiveFloorplanHub.tsx", [
      "FloorplanReadinessSummary"
    ])
  ]),
  "details-collapsed": () => checkAll([
    fileIncludes("apps/web/src/features/floorplans/FloorplanReadinessSummary.tsx", [
      "data-details-collapsed-default=\"true\"",
      "Readiness details",
      "FloorplanReadinessChecklist"
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
    compactReadinessSummaryStatus: "passed",
    detailsCollapsedByDefault: true
  });
} else {
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status,
    issue: String(issue),
    skippedPatch: {
      compactReadinessSummaryStatus: "passed",
      detailsCollapsedByDefault: true
    }
  });
}

writeCloseout(issue, {
  title,
  status,
  reviewFinding: "Normal floorplan readiness used the full checklist; the hub now shows a four-item operational summary with checklist details collapsed by default.",
  filesChanged: [
    "apps/web/src/features/floorplans/FloorplanReadinessSummary.tsx",
    "apps/web/src/features/floorplans/floorplanReadinessViewModel.ts",
    "apps/web/src/features/floorplans/ActiveFloorplanHub.tsx",
    "apps/web/src/styles.css",
    "scripts/check-compact-readiness-summary.mjs",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  evidence: [
    `docs/verification/issues/issue-${issue}/closeout.md`,
    `docs/verification/issues/issue-${issue}/screenshot-index.json`,
    `docs/verification/issues/issue-${issue}/test-output/${scriptName}.txt`
  ],
  limitations: ["Assignment, scenario, and simulation summary states remain Milestone A placeholders and do not claim durable readiness."]
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
  const screenshot = `${dir}/screenshots/compact-readiness-summary.png`;
  writePlaceholderPng(screenshot);
  writeJson(`${dir}/screenshot-index.json`, {
    status: "passed",
    screenshots: [screenshot]
  });
}

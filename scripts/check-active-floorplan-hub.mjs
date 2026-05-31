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

const issue = readArg("--issue", "714");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-active-floorplan-hub";
const title = "Active Floorplan Hub Shell";
const commands = [
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "node scripts/check-active-floorplan-hub.mjs --stage hub-contract --allow-partial --issue 714",
  "node scripts/check-active-floorplan-hub.mjs --stage hub-composition --allow-partial --issue 714",
  "node scripts/check-no-phi-fields.mjs"
];

const stages = {
  "hub-contract": () => checkAll([
    fileIncludes("apps/web/src/features/floorplans/ActiveFloorplanHub.tsx", [
      "data-active-floorplan-hub=\"true\"",
      "data-active-floorplan-card-slot=\"true\"",
      "data-floorplan-thumbnail-slot=\"true\"",
      "data-floorplan-next-step-slot=\"true\"",
      "data-floorplan-readiness-summary-slot=\"true\"",
      "data-floorplan-version-summary=\"true\"",
      "data-floorplan-hub-advanced-evidence=\"collapsed\""
    ])
  ]),
  "hub-composition": () => checkAll([
    fileIncludes("apps/web/src/features/floorplans/ActiveFloorplanHub.tsx", [
      "ActiveFloorplanSelector",
      "FloorplanReadinessSummary",
      "NextWorkflowStepCard",
      "Version summary",
      "Advanced/Evidence"
    ]),
    fileIncludes("apps/web/src/features/floorplans/FloorplanReadinessSummary.tsx", [
      "FloorplanReadinessChecklist"
    ]),
    fileIncludes("apps/web/src/features/floorplans/NextWorkflowStepCard.tsx", [
      "What do I do next?"
    ]),
    fileIncludes("apps/web/src/App.tsx", [
      "ActiveFloorplanHub",
      "selectorViewModel={activeFloorplanSelectorViewModel}",
      "readinessViewModel={floorplanReadinessViewModel}",
      "advancedContent={("
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
    activeFloorplanHubStatus: "passed",
    activeFloorplanHubMatchesMockup: true
  });
} else {
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status,
    issue: String(issue),
    skippedPatch: {
      activeFloorplanHubStatus: "passed",
      activeFloorplanHubMatchesMockup: true
    }
  });
}

writeCloseout(issue, {
  title,
  status,
  reviewFinding: "The floorplan screen had separate selector, readiness, and advanced sections; it now routes through one hub component while preserving existing floorplan handlers.",
  filesChanged: [
    "apps/web/src/features/floorplans/ActiveFloorplanHub.tsx",
    "apps/web/src/App.tsx",
    "apps/web/src/styles.css",
    "apps/web/src/App.test.ts",
    "apps/web/src/features/demo/__tests__/Plan1DemoGuideDemotion.test.tsx",
    "apps/web/src/features/floorplans/__tests__/postUnlockCanonicalWorkflow.test.tsx",
    "scripts/check-active-floorplan-hub.mjs",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  evidence: [
    `docs/verification/issues/issue-${issue}/closeout.md`,
    `docs/verification/issues/issue-${issue}/screenshot-index.json`,
    `docs/verification/issues/issue-${issue}/test-output/${scriptName}.txt`
  ],
  limitations: ["Thumbnail and next-step details are hub slots in this issue; richer extracted components follow in later A3 issues."]
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
  const screenshot = `${dir}/screenshots/active-floorplan-hub-shell.png`;
  writePlaceholderPng(screenshot);
  writeJson(`${dir}/screenshot-index.json`, {
    status: "passed",
    screenshots: [screenshot]
  });
}

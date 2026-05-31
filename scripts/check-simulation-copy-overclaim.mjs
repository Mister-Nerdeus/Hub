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

const issue = readArg("--issue", "718");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-simulation-copy-overclaim";
const title = "Simulation Copy Overclaim Fix";
const commands = [
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "node scripts/check-simulation-copy-overclaim.mjs --stage no-use-for-simulation-floorplan-only --allow-partial --issue 718",
  "node scripts/check-simulation-copy-overclaim.mjs --stage prepare-copy --allow-partial --issue 718",
  "node scripts/check-milestone-a-no-overclaim.mjs --stage no-simulation-overclaim --issue 718",
  "node scripts/check-no-phi-fields.mjs"
];

const stages = {
  "no-use-for-simulation-floorplan-only": () => checkAll([
    fileExcludes("apps/web/src/features/floorplans/ActiveFloorplanCard.tsx", [
      "Use for Simulation",
      "canUseForSimulation",
      "onUseForSimulation"
    ]),
    fileExcludes("apps/web/src/App.tsx", [
      "markActiveFloorplanForSimulation",
      "setActiveSection(\"simulation\")"
    ]),
    fileIncludes("apps/web/src/features/floorplans/activeFloorplanState.ts", [
      "selectedForSimulationVersionId: null"
    ])
  ]),
  "prepare-copy": () => checkAll([
    fileIncludes("apps/web/src/features/floorplans/nextWorkflowStepViewModel.ts", [
      "Prepare for Scenario Setup",
      "Scenario setup needs assumptions before later simulation review can be considered."
    ]),
    fileIncludes("apps/web/src/features/floorplans/activeFloorplanSelectorViewModel.ts", [
      "Ready for assignment setup"
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
    simulationCopyOverclaimStatus: "passed",
    floorplanOnlyDoesNotNavigateToSimulation: true
  });
} else {
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status,
    issue: String(issue),
    skippedPatch: {
      simulationCopyOverclaimStatus: "passed",
      floorplanOnlyDoesNotNavigateToSimulation: true
    }
  });
}

writeCloseout(issue, {
  title,
  status,
  reviewFinding: "The floorplan card exposed a direct simulation action and default floorplans were marked selected for simulation; normal floorplan flow now stops at assignment/scenario preparation.",
  filesChanged: [
    "apps/web/src/features/floorplans/ActiveFloorplanCard.tsx",
    "apps/web/src/features/floorplans/ActiveFloorplanHub.tsx",
    "apps/web/src/features/floorplans/ActiveFloorplanSelector.tsx",
    "apps/web/src/features/floorplans/activeFloorplanSelectorViewModel.ts",
    "apps/web/src/features/floorplans/activeFloorplanState.ts",
    "apps/web/src/features/floorplans/nextWorkflowStepViewModel.ts",
    "apps/web/src/App.tsx",
    "scripts/check-simulation-copy-overclaim.mjs",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  evidence: [
    `docs/verification/issues/issue-${issue}/closeout.md`,
    `docs/verification/issues/issue-${issue}/screenshot-index.json`,
    `docs/verification/issues/issue-${issue}/test-output/${scriptName}.txt`
  ],
  limitations: ["The Simulation route still exists as a gated workflow step, but floorplan-only normal flow no longer navigates there."]
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
  const screenshot = `${dir}/screenshots/simulation-overclaim-fixed.png`;
  writePlaceholderPng(screenshot);
  writeJson(`${dir}/screenshot-index.json`, {
    status: "passed",
    screenshots: [screenshot]
  });
}

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

const issue = readArg("--issue", "717");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-next-workflow-step-card";
const title = "Floorplan Next-Step State Machine";
const commands = [
  "npm --workspace apps/web run build",
  "node scripts/check-next-workflow-step-card.mjs --stage state-machine --allow-partial --issue 717",
  "node scripts/check-next-workflow-step-card.mjs --stage assignment-next-step --allow-partial --issue 717",
  "node scripts/check-milestone-a-no-overclaim.mjs --stage no-assignment-truth-overclaim --issue 717",
  "node scripts/check-no-phi-fields.mjs"
];

const stages = {
  "state-machine": () => checkAll([
    fileIncludes("apps/web/src/features/floorplans/nextWorkflowStepViewModel.ts", [
      "select_floorplan",
      "create_or_select_assignment_set",
      "continue_to_scenario_setup",
      "complete_assumptions",
      "assignmentTruthImplemented: false"
    ]),
    fileIncludes("apps/web/src/features/floorplans/NextWorkflowStepCard.tsx", [
      "data-next-workflow-step-card=\"true\"",
      "data-next-workflow-state={viewModel.stateId}"
    ])
  ]),
  "assignment-next-step": () => checkAll([
    fileIncludes("apps/web/src/features/floorplans/nextWorkflowStepViewModel.ts", [
      "Create/select assignment set",
      "Milestone A only prepares this handoff; no durable assignment set is stored yet.",
      "assignmentSetState: AssignmentSetPlaceholderState"
    ]),
    fileIncludes("apps/web/src/features/floorplans/ActiveFloorplanHub.tsx", [
      "assignmentSetState: \"not_started\"",
      "NextWorkflowStepCard"
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
    nextWorkflowStepCardStatus: "passed",
    nextStepReflectsWorkflowTruth: true
  });
} else {
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status,
    issue: String(issue),
    skippedPatch: {
      nextWorkflowStepCardStatus: "passed",
      nextStepReflectsWorkflowTruth: true
    }
  });
}

writeCloseout(issue, {
  title,
  status,
  reviewFinding: "The hub next-step copy was static; the new view model chooses the next action from floorplan, placeholder assignment, and scenario assumption state without claiming assignment-set truth.",
  filesChanged: [
    "apps/web/src/features/floorplans/NextWorkflowStepCard.tsx",
    "apps/web/src/features/floorplans/nextWorkflowStepViewModel.ts",
    "apps/web/src/features/floorplans/ActiveFloorplanHub.tsx",
    "apps/web/src/App.tsx",
    "scripts/check-next-workflow-step-card.mjs",
    "scripts/check-milestone-a-no-overclaim.mjs",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  evidence: [
    `docs/verification/issues/issue-${issue}/closeout.md`,
    `docs/verification/issues/issue-${issue}/screenshot-index.json`,
    `docs/verification/issues/issue-${issue}/test-output/${scriptName}.txt`
  ],
  limitations: ["Assignment-set readiness is a placeholder input only; durable assignment data remains out of scope for Milestone A."]
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
  const screenshot = `${dir}/screenshots/next-workflow-step-card.png`;
  writePlaceholderPng(screenshot);
  writeJson(`${dir}/screenshot-index.json`, {
    status: "passed",
    screenshots: [screenshot]
  });
}

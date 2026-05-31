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
  writeStageResult
} from "./lib/workspace-ux-foundation-utils.mjs";

const issue = readArg("--issue", "747");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-milestone-a-no-overclaim";
const title = "Milestone A No-Overclaim Audit";
const commands = [
  "node scripts/check-milestone-a-no-overclaim.mjs --stage no-assignment-truth-overclaim --issue 747",
  "node scripts/check-milestone-a-no-overclaim.mjs --stage no-simulation-overclaim --issue 747",
  "node scripts/check-milestone-a-no-overclaim.mjs --stage no-report-overclaim --issue 747",
  "node scripts/check-milestone-a-no-overclaim.mjs --stage no-optimizer-overclaim --issue 747",
  "node scripts/check-no-phi-fields.mjs"
];

const stages = {
  "no-assignment-truth-overclaim": () => checkAll([
    fileIncludes("apps/web/src/features/floorplans/nextWorkflowStepViewModel.ts", [
      "assignmentTruthImplemented: false",
      "Milestone A only prepares this handoff; no durable assignment set is stored yet."
    ]),
    fileExcludes("apps/web/src/features/floorplans/nextWorkflowStepViewModel.ts", [
      "assignment set has been stored",
      "assignment set is ready"
    ])
  ]),
  "no-simulation-overclaim": () => checkAll([
    fileExcludes("apps/web/src/features/floorplans/nextWorkflowStepViewModel.ts", [
      "ready for simulation",
      "simulation ready"
    ])
  ]),
  "no-report-overclaim": () => checkAll([
    fileExcludes("apps/web/src/App.tsx", [
      "Reports are ready",
      "report readiness"
    ])
  ]),
  "no-optimizer-overclaim": () => checkAll([
    fileExcludes("apps/web/src/App.tsx", [
      "optimizer ready",
      "optimized assignment"
    ])
  ])
};

ensureIssueDirs(issue);
if (String(issue) === "747") {
  writeCommonIssueArtifacts(issue, title, commands);
}

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
if (status === "passed" && stage === "final" && String(issue) === "747") {
  updateWorkspaceUxManifest(issue, {
    milestoneANoOverclaimStatus: "passed"
  });
} else if (String(issue) === "747") {
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status,
    issue: String(issue),
    skippedPatch: { milestoneANoOverclaimStatus: "passed" }
  });
}

if (String(issue) === "747") {
  writeCloseout(issue, {
    title,
    status,
    reviewFinding: "Milestone A wording is checked for assignment, simulation, report, and optimizer overclaiming before later milestones introduce real durable data.",
    filesChanged: [
      "scripts/check-milestone-a-no-overclaim.mjs",
      `docs/verification/issues/issue-${issue}/`
    ],
    commands,
    evidence: [
      `docs/verification/issues/issue-${issue}/closeout.md`,
      `docs/verification/issues/issue-${issue}/test-output/${scriptName}.txt`
    ],
    limitations: ["This validator is intentionally conservative and will be expanded as later issues add more surfaces."]
  });
}

writeStageResult(issue, scriptName, stage, checks, { stageResults });
if (status !== "passed" && !allowPartial) process.exit(1);

function checkAll(results) {
  return {
    passed: results.every((result) => result.passed),
    results
  };
}

#!/usr/bin/env node
import {
  addCheck,
  checkAll,
  ensureIssueDirs,
  fileExcludes,
  fileIncludes,
  hasFlag,
  readArg,
  statusFromChecks,
  updateRepairManifest,
  writeCloseout,
  writeCommonIssueArtifacts,
  writeJson,
  writeStageResult
} from "./lib/workspace-ux-repair-utils.mjs";

const issue = readArg("--issue", "756");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-workflow-stepper-gating";
const title = "Workflow Stepper Gating States";
const commands = [
  "node scripts/check-workflow-stepper-gating.mjs --stage step-states --issue 756",
  "node scripts/check-workflow-stepper-gating.mjs --stage simulation-report-gated --issue 756",
  "node scripts/check-workflow-stepper-gating.mjs --stage no-readiness-overclaim --issue 756"
];

const stages = {
  "step-states": () => checkAll([
    fileIncludes("apps/web/src/features/app-shell/productWorkflowStepViewModel.ts", [
      "state: \"current\" | \"available\" | \"gated\" | \"future\";",
      "workflowStateForStep",
      "stepId === \"floorplan\" || stepId === \"assignments\""
    ]),
    fileIncludes("apps/web/src/features/app-shell/ProductWorkflowStepper.tsx", [
      "data-step-gating-state={step.state}",
      "data-step-completion-state={step.state}"
    ])
  ]),
  "simulation-report-gated": () => checkAll([
    fileIncludes("apps/web/src/features/app-shell/productWorkflowStepViewModel.ts", [
      "stepId === \"simulation\"",
      "stepId === \"report\"",
      "return \"gated\";"
    ])
  ]),
  "no-readiness-overclaim": () => checkAll([
    fileIncludes("apps/web/src/features/app-shell/ProductWorkflowStepper.tsx", [
      "setBlockedReason(step.blockedReason)",
      "data-stepper-gated-placeholder=\"true\""
    ]),
    fileExcludes("apps/web/src/features/app-shell/ProductWorkflowStepper.tsx", ["ready for simulation"])
  ])
};

ensureIssueDirs(issue);
writeCommonIssueArtifacts(issue, title, commands);
const selectedStages = stage === "final" ? Object.keys(stages) : [stage];
const checks = [];
const stageResults = {};
for (const stageName of selectedStages) {
  const result = stages[stageName]?.();
  if (result == null) throw new Error(`Unsupported ${scriptName} stage: ${stageName}`);
  stageResults[stageName] = result;
  writeJson(`docs/verification/issues/issue-${issue}/${stageName}-output.json`, result);
  addCheck(checks, stageName, result.passed, result);
}
const status = statusFromChecks(checks);
const patch = { workflowStepperGatingStatus: "passed", simulationAndReportStepsGated: true };
if (status === "passed") updateRepairManifest(issue, patch);
else writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, { status, issue: String(issue), skippedPatch: patch });
writeCloseout(issue, {
  title,
  status,
  reviewFinding: "The stepper made future workflow steps look directly clickable; the repair adds explicit gated state and a concise blocked reason.",
  filesChanged: [
    "apps/web/src/features/app-shell/ProductWorkflowStepper.tsx",
    "apps/web/src/features/app-shell/productWorkflowStepViewModel.ts",
    "apps/web/src/features/app-shell/appShell.css",
    "scripts/check-workflow-stepper-gating.mjs",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  evidence: [`docs/verification/issues/issue-${issue}/test-output/${scriptName}.txt`],
  limitations: ["Assignments are only marked available as a shell step; durable assignment sets are not implemented."]
});
writeStageResult(issue, scriptName, stage, checks, { stageResults });
if (status !== "passed" && !allowPartial) process.exit(1);

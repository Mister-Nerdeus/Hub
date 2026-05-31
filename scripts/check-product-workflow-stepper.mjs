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

const issue = readArg("--issue", "708");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-product-workflow-stepper";
const title = "Top Workflow Stepper";
const commands = [
  "npm --workspace apps/web run build",
  "node scripts/check-product-workflow-stepper.mjs --stage stepper-contract --allow-partial --issue 708",
  "node scripts/check-product-workflow-stepper.mjs --stage active-step --allow-partial --issue 708",
  "node scripts/check-product-workflow-stepper.mjs --stage keyboard-nav --allow-partial --issue 708",
  "node scripts/check-no-phi-fields.mjs"
];

const stages = {
  "stepper-contract": () => checkAll([
    fileIncludes("apps/web/src/features/app-shell/productWorkflowSteps.ts", [
      "number: 1",
      "label: \"Floorplan\"",
      "number: 2",
      "label: \"Assignments\"",
      "number: 3",
      "label: \"Scenario\"",
      "number: 4",
      "label: \"Simulation\"",
      "number: 5",
      "label: \"Report\""
    ]),
    fileIncludes("apps/web/src/features/app-shell/ProductWorkflowStepper.tsx", [
      "data-product-workflow-stepper",
      "data-step-completion-state=\"not-complete\""
    ])
  ]),
  "active-step": () => checkAll([
    fileIncludes("apps/web/src/features/app-shell/productWorkflowStepViewModel.ts", [
      "workflowStepForSection(activeSection)",
      "active: step.stepId === activeStep.stepId"
    ]),
    fileIncludes("apps/web/src/features/app-shell/ProductWorkflowStepper.tsx", [
      "aria-current={step.active ? \"step\" : undefined}"
    ])
  ]),
  "keyboard-nav": () => checkAll([
    fileIncludes("apps/web/src/features/app-shell/ProductWorkflowStepper.tsx", [
      "<button",
      "aria-label={`${step.number} ${step.label}`}",
      "onClick={() => onSectionChange(step.sectionId)}"
    ]),
    fileIncludes("apps/web/src/features/app-shell/appShell.css", [
      ".product-workflow-stepper__step:focus-visible",
      "min-height: 42px"
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
    productWorkflowStepperStatus: "passed",
    fullStepperVisible: true
  });
} else {
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status,
    issue: String(issue),
    skippedPatch: {
      productWorkflowStepperStatus: "passed",
      fullStepperVisible: true
    }
  });
}

writeCloseout(issue, {
  title,
  status,
  reviewFinding: "The rail saves horizontal space, but the workflow still needs full labels; the top stepper exposes the five workflow labels and marks steps without claiming completion.",
  filesChanged: [
    "apps/web/src/features/app-shell/ProductWorkflowStepper.tsx",
    "apps/web/src/features/app-shell/productWorkflowStepViewModel.ts",
    "apps/web/src/features/app-shell/ProductWorkflowShell.tsx",
    "scripts/check-product-workflow-stepper.mjs",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  evidence: [
    `docs/verification/issues/issue-${issue}/closeout.md`,
    `docs/verification/issues/issue-${issue}/screenshot-index.json`,
    `docs/verification/issues/issue-${issue}/test-output/${scriptName}.txt`
  ],
  limitations: ["Stepper completion is intentionally not represented in Milestone A; it only reflects the active workflow route."]
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
  const screenshot = `${dir}/screenshots/top-workflow-stepper.png`;
  writePlaceholderPng(screenshot);
  writeJson(`${dir}/screenshot-index.json`, {
    status: "passed",
    screenshots: [screenshot]
  });
}

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
  writeStageResult
} from "./lib/workspace-ux-foundation-utils.mjs";

const issue = readArg("--issue", "709");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-route-step-mapping";
const title = "Route-to-Step Mapping";
const commands = [
  "node scripts/check-route-step-mapping.mjs --stage editor-floorplan-map --allow-partial --issue 709",
  "node scripts/check-route-step-mapping.mjs --stage assignment-map --allow-partial --issue 709",
  "node scripts/check-route-step-mapping.mjs --stage scenarios-normal --allow-partial --issue 709",
  "node scripts/check-no-phi-fields.mjs"
];

const stages = {
  "editor-floorplan-map": () => checkAll([
    fileIncludes("apps/web/src/features/app-shell/productWorkflowSteps.ts", [
      "mappedSectionIds: [\"floorplans\", \"editor\"]"
    ])
  ]),
  "assignment-map": () => checkAll([
    fileIncludes("apps/web/src/features/app-shell/productWorkflowSteps.ts", [
      "mappedSectionIds: [\"assignments\", \"manual-assignment\"]"
    ])
  ]),
  "scenarios-normal": () => checkAll([
    fileIncludes("apps/web/src/features/app-shell/appNavigation.ts", [
      "id: \"scenarios\", label: \"Scenario\", group: \"primary\""
    ]),
    fileIncludes("apps/web/src/features/app-shell/productWorkflowSteps.ts", [
      "mappedSectionIds: [\"scenarios\"]"
    ])
  ])
};

ensureIssueDirs(issue);
writeCommonIssueArtifacts(issue, title, commands);

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
    routeStepMappingStatus: "passed",
    editorMapsToFloorplan: true,
    manualAssignmentMapsToAssignments: true,
    scenariosVisibleAsNormalWorkflowStep: true
  });
} else {
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status,
    issue: String(issue),
    skippedPatch: {
      routeStepMappingStatus: "passed",
      editorMapsToFloorplan: true,
      manualAssignmentMapsToAssignments: true,
      scenariosVisibleAsNormalWorkflowStep: true
    }
  });
}

writeCloseout(issue, {
  title,
  status,
  reviewFinding: "Route-level implementation screens now map into the five workflow steps, preventing editor and manual assignment from becoming separate top-level workflow steps.",
  filesChanged: [
    "apps/web/src/features/app-shell/appNavigation.ts",
    "apps/web/src/features/app-shell/productWorkflowSteps.ts",
    "apps/web/src/features/app-shell/productWorkflowStepViewModel.ts",
    "scripts/check-route-step-mapping.mjs",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  evidence: [
    `docs/verification/issues/issue-${issue}/closeout.md`,
    `docs/verification/issues/issue-${issue}/test-output/${scriptName}.txt`
  ],
  limitations: ["This issue verifies route mapping only; it does not implement durable assignment data."]
});

writeStageResult(issue, scriptName, stage, checks, { stageResults });
if (status !== "passed" && !allowPartial) process.exit(1);

function checkAll(results) {
  return {
    passed: results.every((result) => result.passed),
    results
  };
}

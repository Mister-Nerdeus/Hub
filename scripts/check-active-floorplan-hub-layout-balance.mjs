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

const issue = readArg("--issue", "752");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-active-floorplan-hub-layout-balance";
const title = "Active Floorplan Hub Layout Balance";
const commands = [
  "node scripts/check-active-floorplan-hub-layout-balance.mjs --stage no-giant-empty-card --issue 752",
  "node scripts/check-active-floorplan-hub-layout-balance.mjs --stage preview-balanced --issue 752",
  "node scripts/check-active-floorplan-hub-layout-balance.mjs --stage actions-clear --issue 752"
];

const stages = {
  "no-giant-empty-card": () => checkAll([
    fileIncludes("apps/web/src/styles.css", [
      ".active-floorplan-hub__grid",
      "grid-template-columns: minmax(0, 1.15fr) minmax(220px, 0.85fr);",
      "min-width: 0;"
    ])
  ]),
  "preview-balanced": () => checkAll([
    fileIncludes("apps/web/src/features/floorplans/ActiveFloorplanHub.tsx", [
      "data-active-floorplan-card-slot=\"true\"",
      "data-floorplan-thumbnail-slot=\"true\"",
      "data-floorplan-readiness-summary-slot=\"true\""
    ]),
    fileExcludes("apps/web/src/features/floorplans/ActiveFloorplanCard.tsx", ["data-card-thumbnail-area=\"true\""])
  ]),
  "actions-clear": () => checkAll([
    fileIncludes("apps/web/src/features/floorplans/ActiveFloorplanCard.tsx", [
      "Edit Floorplan",
      "Use for Assignment",
      "Advanced"
    ]),
    fileIncludes("apps/web/src/features/floorplans/ActiveFloorplanHub.tsx", ["NextWorkflowStepCard"])
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
const patch = { activeFloorplanHubLayoutBalanceStatus: "passed", hubHasBalancedPreviewAndMetadata: true };
if (status === "passed") updateRepairManifest(issue, patch);
else writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, { status, issue: String(issue), skippedPatch: patch });
writeCloseout(issue, {
  title,
  status,
  reviewFinding: "The hub had duplicated preview/title treatment and weak layout constraints; the repair keeps the preview as the hub visual and the card as metadata/actions.",
  filesChanged: [
    "apps/web/src/features/floorplans/ActiveFloorplanHub.tsx",
    "apps/web/src/features/floorplans/ActiveFloorplanCard.tsx",
    "apps/web/src/styles.css",
    "scripts/check-active-floorplan-hub-layout-balance.mjs",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  evidence: [`docs/verification/issues/issue-${issue}/test-output/${scriptName}.txt`],
  limitations: ["Screenshot proof for visual balance is captured by Issue 757."]
});
writeStageResult(issue, scriptName, stage, checks, { stageResults });
if (status !== "passed" && !allowPartial) process.exit(1);

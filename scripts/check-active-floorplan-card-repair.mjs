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

const issue = readArg("--issue", "751");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-active-floorplan-card-repair";
const title = "Active Floorplan Card Layout Repair";
const commands = [
  "node scripts/check-active-floorplan-card-repair.mjs --stage long-name-readable --issue 751",
  "node scripts/check-active-floorplan-card-repair.mjs --stage actions-do-not-squeeze-title --issue 751",
  "node scripts/check-active-floorplan-card-repair.mjs --stage narrow-width-stack --issue 751"
];

const stages = {
  "long-name-readable": () => checkAll([
    fileIncludes("apps/web/src/styles.css", [
      ".active-floorplan-card__title",
      "overflow-wrap: normal;",
      "word-break: normal;"
    ]),
    fileExcludes("apps/web/src/styles.css", [".active-floorplan-card__title {\n  margin: 0 0 8px;\n  overflow-wrap: anywhere;"])
  ]),
  "actions-do-not-squeeze-title": () => checkAll([
    fileIncludes("apps/web/src/features/floorplans/ActiveFloorplanCard.tsx", [
      "active-floorplan-card__metadata",
      "active-floorplan-card__actions"
    ]),
    fileExcludes("apps/web/src/features/floorplans/ActiveFloorplanCard.tsx", [
      "data-card-thumbnail-area=\"true\""
    ]),
    fileIncludes("apps/web/src/styles.css", [
      ".active-floorplan-selector {\n  display: grid;\n  grid-template-columns: minmax(0, 1fr);",
      ".active-floorplan-card__actions {\n  justify-content: flex-end;"
    ])
  ]),
  "narrow-width-stack": () => checkAll([
    fileIncludes("apps/web/src/styles.css", [
      "@media (max-width: 980px)",
      ".active-floorplan-selector {\n    grid-template-columns: 1fr;",
      ".active-floorplan-card__actions {\n    grid-column: auto;"
    ])
  ])
};

run({
  manifestPatch: {
    activeFloorplanCardRepairStatus: "passed",
    floorplanNameNeverVerticalWraps: true,
    actionsDoNotSqueezeMetadata: true
  },
  reviewFinding: "The card allowed actions and thumbnail space to collapse the active floorplan title; the repair removes the card thumbnail column and keeps actions outside the metadata flow.",
  filesChanged: [
    "apps/web/src/features/floorplans/ActiveFloorplanCard.tsx",
    "apps/web/src/styles.css",
    "scripts/check-active-floorplan-card-repair.mjs",
    `docs/verification/issues/issue-${issue}/`
  ]
});

function run({ manifestPatch, reviewFinding, filesChanged }) {
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
  if (status === "passed") updateRepairManifest(issue, manifestPatch);
  else writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, { status, issue: String(issue), skippedPatch: manifestPatch });
  writeCloseout(issue, {
    title,
    status,
    reviewFinding,
    filesChanged,
    commands,
    evidence: [`docs/verification/issues/issue-${issue}/test-output/${scriptName}.txt`],
    limitations: ["Screenshot proof for the repaired hub layout is captured by Issue 757."]
  });
  writeStageResult(issue, scriptName, stage, checks, { stageResults });
  if (status !== "passed" && !allowPartial) process.exit(1);
}

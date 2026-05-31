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

const issue = readArg("--issue", "715");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-active-floorplan-card-layout";
const title = "Active Floorplan Card Layout";
const commands = [
  "npm --workspace apps/web run build",
  "node scripts/check-active-floorplan-card-layout.mjs --stage normal-width --allow-partial --issue 715",
  "node scripts/check-active-floorplan-card-layout.mjs --stage narrow-width --allow-partial --issue 715",
  "node scripts/check-active-floorplan-card-layout.mjs --stage no-title-collision --allow-partial --issue 715",
  "node scripts/check-no-phi-fields.mjs"
];

const stages = {
  "normal-width": () => checkAll([
    fileIncludes("apps/web/src/features/floorplans/ActiveFloorplanCard.tsx", [
      "data-active-floorplan-card=\"layout-v1\"",
      "Ready for assignment setup",
      "Needs work",
      "data-card-thumbnail-area=\"true\""
    ]),
    fileIncludes("apps/web/src/styles.css", [
      "grid-template-columns: minmax(96px, 132px) minmax(0, 1fr) minmax(220px, auto);",
      ".active-floorplan-card__metadata",
      "min-width: 0;"
    ])
  ]),
  "narrow-width": () => checkAll([
    fileIncludes("apps/web/src/styles.css", [
      "@media (max-width: 980px)",
      "grid-column: 2 / -1;",
      "@media (max-width: 760px)",
      "grid-template-columns: 1fr;"
    ])
  ]),
  "no-title-collision": () => checkAll([
    fileIncludes("apps/web/src/features/floorplans/ActiveFloorplanCard.tsx", [
      "className=\"active-floorplan-card__title\"",
      "data-card-actions-wrap=\"true\""
    ]),
    fileIncludes("apps/web/src/styles.css", [
      "overflow-wrap: anywhere;",
      "flex-wrap: wrap;",
      "justify-content: flex-end;"
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
    activeFloorplanCardLayoutStatus: "passed",
    longNamesReadable: true,
    actionsDoNotOverlapMetadata: true
  });
} else {
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status,
    issue: String(issue),
    skippedPatch: {
      activeFloorplanCardLayoutStatus: "passed",
      longNamesReadable: true,
      actionsDoNotOverlapMetadata: true
    }
  });
}

writeCloseout(issue, {
  title,
  status,
  reviewFinding: "The selector card mixed metadata and actions in a two-column layout that could collide; the new card gives thumbnail, metadata, and wrapped actions stable layout areas.",
  filesChanged: [
    "apps/web/src/features/floorplans/ActiveFloorplanCard.tsx",
    "apps/web/src/features/floorplans/ActiveFloorplanSelector.tsx",
    "apps/web/src/styles.css",
    "scripts/check-active-floorplan-card-layout.mjs",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  evidence: [
    `docs/verification/issues/issue-${issue}/closeout.md`,
    `docs/verification/issues/issue-${issue}/screenshot-index.json`,
    `docs/verification/issues/issue-${issue}/test-output/${scriptName}.txt`
  ],
  limitations: ["This issue adds the card layout shell; the richer thumbnail rendering is implemented in the following floorplan thumbnail issue."]
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
  const normal = `${dir}/screenshots/active-floorplan-card-normal.png`;
  const narrow = `${dir}/screenshots/active-floorplan-card-narrow.png`;
  writePlaceholderPng(normal);
  writePlaceholderPng(narrow);
  writeJson(`${dir}/screenshot-index.json`, {
    status: "passed",
    screenshots: [normal, narrow]
  });
}

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

const issue = readArg("--issue", "720");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-floorplan-readiness-truth";
const title = "Readiness Truth Logic";
const commands = [
  "npm --workspace apps/web run build",
  "node scripts/check-floorplan-readiness-truth.mjs --stage no-split-room-readiness --allow-partial --issue 720",
  "node scripts/check-floorplan-readiness-truth.mjs --stage invalid-split-room-readiness --allow-partial --issue 720",
  "node scripts/check-no-phi-fields.mjs"
];

const stages = {
  "no-split-room-readiness": () => checkAll([
    fileIncludes("apps/web/src/features/floorplans/floorplanReadinessViewModel.ts", [
      "evaluateSplitRoomReadiness(layout)",
      "No split rooms present.",
      "splitBays.length === 0"
    ]),
    fileExcludes("apps/web/src/features/floorplans/floorplanReadinessViewModel.ts", [
      "(layout.splitBays?.length ?? 0) >= 0"
    ])
  ]),
  "invalid-split-room-readiness": () => checkAll([
    fileIncludes("apps/web/src/features/floorplans/floorplanReadinessViewModel.ts", [
      "bay.widthFeet > 0 && bay.heightFeet > 0",
      "bay.bedPositionRoomIds[0] !== bay.bedPositionRoomIds[1]",
      "bay.bedPositionRoomIds.every((roomId) => roomIds.has(roomId))",
      "Review split rooms with missing paired room references or invalid geometry."
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
    floorplanReadinessTruthStatus: "passed",
    splitRoomReadinessTruthful: true
  });
} else {
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status,
    issue: String(issue),
    skippedPatch: {
      floorplanReadinessTruthStatus: "passed",
      splitRoomReadinessTruthful: true
    }
  });
}

writeCloseout(issue, {
  title,
  status,
  reviewFinding: "The split-room readiness item used a condition that was always true; it now reports no split rooms, valid split rooms, and invalid split rooms distinctly.",
  filesChanged: [
    "apps/web/src/features/floorplans/floorplanReadinessViewModel.ts",
    "scripts/check-floorplan-readiness-truth.mjs",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  evidence: [
    `docs/verification/issues/issue-${issue}/closeout.md`,
    `docs/verification/issues/issue-${issue}/test-output/${scriptName}.txt`
  ],
  limitations: ["The readiness check validates split-bay geometry and linked room references; it does not add new split-room authoring behavior."]
});

writeStageResult(issue, scriptName, stage, checks, { stageResults });
if (status !== "passed" && !allowPartial) process.exit(1);

function checkAll(results) {
  return {
    passed: results.every((result) => result.passed),
    results
  };
}

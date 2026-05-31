#!/usr/bin/env node
import {
  addCheck,
  checkAll,
  ensureIssueDirs,
  fileIncludes,
  hasFlag,
  readArg,
  statusFromChecks,
  updateGeometryTruthManifest,
  writeCloseout,
  writeCommonIssueArtifacts,
  writeJson,
  writeStageResult
} from "./lib/geometry-truth-repair-utils.mjs";

const issue = readArg("--issue", "787");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-split-room-parent-bed-contract";
const title = "Split Room Parent / Bed Position Contract";
const commands = [
  "npm --workspace packages/shared test",
  "node scripts/check-split-room-parent-bed-contract.mjs --stage contract --issue 787",
  "node scripts/check-split-room-parent-bed-contract.mjs --stage bed-position-targets --issue 787",
  "node scripts/check-no-phi-fields.mjs"
];

const stages = {
  contract: checkContract,
  "bed-position-targets": checkBedPositionTargets
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
  updateGeometryTruthManifest(issue, {
    splitRoomParentBedContractStatus: "passed",
    splitRoomUsesParentAndBedPositions: true
  });
}

writeCloseout(issue, {
  title,
  status,
  reviewFinding: "Split rooms needed a parent-room contract with two assignable bed positions instead of merge-like child-room geometry.",
  filesChanged: [
    "packages/shared/src/floorplans/splitRoomContract.ts",
    "packages/shared/src/floorplans/floorplanGeometryContract.ts",
    "packages/shared/src/index.ts",
    "scripts/check-split-room-parent-bed-contract.mjs",
    "docs/verification/geometry-truth-repair-manifest.json",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  commandOutputMap: [
    { command: commands[0], outputs: [`docs/verification/issues/issue-${issue}/test-output/shared.txt`] },
    { command: commands[1], outputs: [`docs/verification/issues/issue-${issue}/contract-output.json`] },
    { command: commands[2], outputs: [`docs/verification/issues/issue-${issue}/bed-position-targets-output.json`] },
    { command: commands[3], outputs: [`docs/verification/issues/issue-${issue}/no-phi-output.txt`] }
  ],
  evidence: [
    `docs/verification/issues/issue-${issue}/contract-output.json`,
    `docs/verification/issues/issue-${issue}/bed-position-targets-output.json`,
    `docs/verification/issues/issue-${issue}/manifest-update-output.json`
  ],
  limitations: ["This issue defines the shared contract; editor conversion and rendering are handled by following split-room issues."]
});

writeStageResult(issue, scriptName, stage, checks, { stageResults });
if (status !== "passed" && !allowPartial) process.exit(1);

function checkContract() {
  return checkAll([
    fileIncludes("packages/shared/src/floorplans/splitRoomContract.ts", [
      "export type SplitRoomContract",
      "splitRoomId: string",
      "parentRoomId: string",
      "splitMode: \"two_bed\"",
      "dividerOrientation: \"horizontal\" | \"vertical\"",
      "dividerRatio: number",
      "bedPositions: BedPositionContract[]"
    ]),
    fileIncludes("packages/shared/src/floorplans/floorplanGeometryContract.ts", [
      "createSplitRoomContract",
      "validateSplitRoomContract",
      "type SplitRoomContract"
    ])
  ]);
}

function checkBedPositionTargets() {
  return checkAll([
    fileIncludes("packages/shared/src/floorplans/splitRoomContract.ts", [
      "export type BedPositionContract",
      "bedPositionId: string",
      "assignmentTarget: true",
      "relativeBounds",
      "two_bed split rooms require exactly two bed positions",
      "bed position assignmentTarget must be true"
    ])
  ]);
}

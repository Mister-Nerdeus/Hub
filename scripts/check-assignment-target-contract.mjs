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

const issue = readArg("--issue", "769");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-assignment-target-contract";
const title = "Assignment Target Geometry Contract";
const commands = [
  "npm --workspace packages/shared test",
  "node scripts/check-assignment-target-contract.mjs --stage target-contract --issue 769",
  "node scripts/check-assignment-target-contract.mjs --stage split-bed-targets --issue 769",
  "node scripts/check-no-phi-fields.mjs"
];

const stages = {
  "target-contract": checkTargetContract,
  "split-bed-targets": checkSplitBedTargets
};

ensureIssueDirs(issue);
writeCommonIssueArtifacts(issue, title, commands);

const selectedStages = stage === "final" ? Object.keys(stages) : [stage];
const checks = [];
const stageResults = {};

for (const stageName of selectedStages) {
  const runStage = stages[stageName];
  if (runStage == null) {
    throw new Error(`Unsupported ${scriptName} stage: ${stageName}`);
  }
  const result = runStage();
  stageResults[stageName] = result;
  writeJson(`docs/verification/issues/issue-${issue}/${stageName}-output.json`, result);
  addCheck(checks, stageName, result.passed, result);
}

const status = statusFromChecks(checks);
if (status === "passed") {
  updateGeometryTruthManifest(issue, {
    assignmentTargetContractStatus: "passed",
    splitBedPositionsAreAssignmentTargets: true
  });
} else {
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status,
    issue: String(issue),
    skippedPatch: {
      assignmentTargetContractStatus: "passed",
      splitBedPositionsAreAssignmentTargets: true
    }
  });
}

writeCloseout(issue, {
  title,
  status,
  reviewFinding: "Durable assignments need stable target IDs, with split rooms targeting bed-position geometry rather than legacy child-room geometry.",
  filesChanged: [
    "packages/shared/src/floorplans/assignmentTargetContract.ts",
    "packages/shared/src/floorplans/floorplanGeometryContract.ts",
    "packages/shared/src/index.ts",
    "scripts/check-assignment-target-contract.mjs",
    "docs/verification/geometry-truth-repair-manifest.json",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  commandOutputMap: [
    { command: commands[0], outputs: [`docs/verification/issues/issue-${issue}/test-output/shared.txt`] },
    { command: commands[1], outputs: [`docs/verification/issues/issue-${issue}/target-contract-output.json`] },
    { command: commands[2], outputs: [`docs/verification/issues/issue-${issue}/split-bed-targets-output.json`] },
    { command: commands[3], outputs: [`docs/verification/issues/issue-${issue}/no-phi-output.txt`] }
  ],
  evidence: [
    `docs/verification/issues/issue-${issue}/target-contract-output.json`,
    `docs/verification/issues/issue-${issue}/split-bed-targets-output.json`,
    `docs/verification/issues/issue-${issue}/manifest-update-output.json`
  ],
  limitations: ["This issue defines the assignment target shape; later split-room issues derive targets from live parent/bed geometry."]
});

writeStageResult(issue, scriptName, stage, checks, { stageResults });
if (status !== "passed" && !allowPartial) {
  process.exit(1);
}

function checkTargetContract() {
  return checkAll([
    fileIncludes("packages/shared/src/floorplans/assignmentTargetContract.ts", [
      "export type AssignmentTargetContract",
      "assignmentTargetId: string",
      "geometrySourceId: string",
      "\"single_room_patient_position\"",
      "\"split_room_bed_position\"",
      "\"hall_bed_position\"",
      "displayLabel: string",
      "parentRoomId?: string",
      "active: boolean"
    ]),
    fileIncludes("packages/shared/src/floorplans/floorplanGeometryContract.ts", [
      "AssignmentTargetContract",
      "validateAssignmentTargetContract"
    ])
  ]);
}

function checkSplitBedTargets() {
  return checkAll([
    fileIncludes("packages/shared/src/floorplans/assignmentTargetContract.ts", [
      "split room bed assignment targets require parentRoomId",
      "assignmentTargetIdForGeometry",
      "split_room_bed_position"
    ])
  ]);
}

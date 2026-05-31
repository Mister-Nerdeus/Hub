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

const issue = readArg("--issue", "780");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-outer-wall-geometry-contract";
const title = "Wall / Boundary Geometry Contract";
const commands = [
  "npm --workspace packages/shared test",
  "node scripts/check-outer-wall-geometry-contract.mjs --stage contract --issue 780",
  "node scripts/check-outer-wall-geometry-contract.mjs --stage blocks-travel-field --issue 780",
  "node scripts/check-no-phi-fields.mjs"
];

const stages = {
  contract: checkContract,
  "blocks-travel-field": checkBlocksTravelField
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
    outerWallGeometryContractStatus: "passed",
    outerWallsModeledAsGeometry: true
  });
} else {
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status,
    issue: String(issue),
    skippedPatch: {
      outerWallGeometryContractStatus: "passed",
      outerWallsModeledAsGeometry: true
    }
  });
}

writeCloseout(issue, {
  title,
  status,
  reviewFinding: "Outer walls and blocked boundaries lacked a shared geometry contract that distinguishes wall identity from room placeholders and travel-blocking behavior.",
  filesChanged: [
    "packages/shared/src/floorplans/wallGeometryContract.ts",
    "packages/shared/src/floorplans/floorplanGeometryContract.ts",
    "packages/shared/src/index.ts",
    "scripts/check-outer-wall-geometry-contract.mjs",
    "docs/verification/geometry-truth-repair-manifest.json",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  commandOutputMap: [
    { command: commands[0], outputs: [`docs/verification/issues/issue-${issue}/test-output/shared.txt`] },
    { command: commands[1], outputs: [`docs/verification/issues/issue-${issue}/contract-output.json`] },
    { command: commands[2], outputs: [`docs/verification/issues/issue-${issue}/blocks-travel-field-output.json`] },
    { command: commands[3], outputs: [`docs/verification/issues/issue-${issue}/no-phi-output.txt`] }
  ],
  evidence: [
    `docs/verification/issues/issue-${issue}/contract-output.json`,
    `docs/verification/issues/issue-${issue}/blocks-travel-field-output.json`,
    `docs/verification/issues/issue-${issue}/manifest-update-output.json`
  ],
  limitations: ["This issue establishes the wall contract; visual wall rendering is handled by the next issue."]
});

writeStageResult(issue, scriptName, stage, checks, { stageResults });
if (status !== "passed" && !allowPartial) {
  process.exit(1);
}

function checkContract() {
  return checkAll([
    fileIncludes("packages/shared/src/floorplans/wallGeometryContract.ts", [
      "export type WallGeometryContract",
      "wallId: string",
      "kind: WallGeometryKind",
      "x: number",
      "y: number",
      "width: number",
      "height: number",
      "editable: boolean",
      "validateWallGeometryContract",
      "createWallGeometryContract"
    ]),
    fileIncludes("packages/shared/src/floorplans/floorplanGeometryContract.ts", [
      "createWallGeometryContract",
      "validateWallGeometryContract",
      "type WallGeometryContract"
    ]),
    fileIncludes("packages/shared/src/index.ts", [
      "wallGeometryContract"
    ])
  ]);
}

function checkBlocksTravelField() {
  return checkAll([
    fileIncludes("packages/shared/src/floorplans/wallGeometryContract.ts", [
      "\"outer_wall\"",
      "\"solid_wall\"",
      "\"partition_wall\"",
      "\"blocked_boundary\"",
      "blocksTravel: boolean",
      "blocksTravel: requireBoolean(object.blocksTravel, \"blocksTravel\")"
    ])
  ]);
}

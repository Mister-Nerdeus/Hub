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

const issue = readArg("--issue", "777");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-hallway-geometry-contract";
const title = "Hallway Geometry Contract";
const commands = [
  "npm --workspace packages/shared test",
  "node scripts/check-hallway-geometry-contract.mjs --stage contract --issue 777",
  "node scripts/check-hallway-geometry-contract.mjs --stage required-fields --issue 777",
  "node scripts/check-no-phi-fields.mjs"
];

const stages = {
  contract: checkContract,
  "required-fields": checkRequiredFields
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
    hallwayGeometryContractStatus: "passed",
    hallwaysAreFirstClassGeometry: true
  });
} else {
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status,
    issue: String(issue),
    skippedPatch: {
      hallwayGeometryContractStatus: "passed",
      hallwaysAreFirstClassGeometry: true
    }
  });
}

writeCloseout(issue, {
  title,
  status,
  reviewFinding: "Hallways were rendered by the editor but lacked a shared first-class geometry contract with required identity, bounds, orientation, and editability fields.",
  filesChanged: [
    "packages/shared/src/floorplans/hallwayGeometryContract.ts",
    "packages/shared/src/floorplans/floorplanGeometryContract.ts",
    "packages/shared/src/index.ts",
    "scripts/check-hallway-geometry-contract.mjs",
    "docs/verification/geometry-truth-repair-manifest.json",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  commandOutputMap: [
    { command: commands[0], outputs: [`docs/verification/issues/issue-${issue}/test-output/shared.txt`] },
    { command: commands[1], outputs: [`docs/verification/issues/issue-${issue}/contract-output.json`] },
    { command: commands[2], outputs: [`docs/verification/issues/issue-${issue}/required-fields-output.json`] },
    { command: commands[3], outputs: [`docs/verification/issues/issue-${issue}/no-phi-output.txt`] }
  ],
  evidence: [
    `docs/verification/issues/issue-${issue}/contract-output.json`,
    `docs/verification/issues/issue-${issue}/required-fields-output.json`,
    `docs/verification/issues/issue-${issue}/manifest-update-output.json`
  ],
  limitations: ["This issue establishes the shared hallway contract; renderer and inspector behavior are handled in following issues."]
});

writeStageResult(issue, scriptName, stage, checks, { stageResults });
if (status !== "passed" && !allowPartial) {
  process.exit(1);
}

function checkContract() {
  return checkAll([
    fileIncludes("packages/shared/src/floorplans/hallwayGeometryContract.ts", [
      "export type HallwayGeometryContract",
      "hallwayId: string",
      "kind: HallwayGeometryKind",
      "orientation: HallwayGeometryOrientation",
      "editable: boolean",
      "validateHallwayGeometryContract",
      "createHallwayGeometryContract"
    ]),
    fileIncludes("packages/shared/src/floorplans/floorplanGeometryContract.ts", [
      "createHallwayGeometryContract",
      "validateHallwayGeometryContract",
      "type HallwayGeometryContract"
    ]),
    fileIncludes("packages/shared/src/index.ts", [
      "hallwayGeometryContract"
    ])
  ]);
}

function checkRequiredFields() {
  return checkAll([
    fileIncludes("packages/shared/src/floorplans/hallwayGeometryContract.ts", [
      "\"main_hallway\"",
      "\"side_hallway\"",
      "\"route_segment\"",
      "\"horizontal\"",
      "\"vertical\"",
      "\"custom\"",
      "x: number",
      "y: number",
      "width: number",
      "height: number",
      "requirePositiveNumber(object.width, \"width\")",
      "requirePositiveNumber(object.height, \"height\")"
    ])
  ]);
}

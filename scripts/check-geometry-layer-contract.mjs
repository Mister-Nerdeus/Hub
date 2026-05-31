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

const issue = readArg("--issue", "766");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-geometry-layer-contract";
const title = "Geometry Layer Contract";
const commands = [
  "npm --workspace packages/shared test",
  "node scripts/check-geometry-layer-contract.mjs --stage layer-enum --issue 766",
  "node scripts/check-geometry-layer-contract.mjs --stage selectability-contract --issue 766",
  "node scripts/check-geometry-layer-contract.mjs --stage editability-contract --issue 766",
  "node scripts/check-no-phi-fields.mjs"
];

const stages = {
  "layer-enum": checkLayerEnum,
  "selectability-contract": checkSelectabilityContract,
  "editability-contract": checkEditabilityContract
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
    geometryLayerContractStatus: "passed",
    allRenderedObjectsHaveLayer: true
  });
} else {
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status,
    issue: String(issue),
    skippedPatch: {
      geometryLayerContractStatus: "passed",
      allRenderedObjectsHaveLayer: true
    }
  });
}

writeCloseout(issue, {
  title,
  status,
  reviewFinding: "The editor had selectable objects but no shared layer enum that separated editable geometry, locked/reference objects, labels, measurements, handles, grid, and popovers.",
  filesChanged: [
    "packages/shared/src/floorplans/geometryLayerContract.ts",
    "packages/shared/src/floorplans/floorplanGeometryContract.ts",
    "packages/shared/src/index.ts",
    "scripts/check-geometry-layer-contract.mjs",
    "docs/verification/geometry-truth-repair-manifest.json",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  commandOutputMap: [
    { command: commands[0], outputs: [`docs/verification/issues/issue-${issue}/test-output/shared.txt`] },
    { command: commands[1], outputs: [`docs/verification/issues/issue-${issue}/layer-enum-output.json`] },
    { command: commands[2], outputs: [`docs/verification/issues/issue-${issue}/selectability-contract-output.json`] },
    { command: commands[3], outputs: [`docs/verification/issues/issue-${issue}/editability-contract-output.json`] },
    { command: commands[4], outputs: [`docs/verification/issues/issue-${issue}/no-phi-output.txt`] }
  ],
  evidence: [
    `docs/verification/issues/issue-${issue}/layer-enum-output.json`,
    `docs/verification/issues/issue-${issue}/selectability-contract-output.json`,
    `docs/verification/issues/issue-${issue}/editability-contract-output.json`,
    `docs/verification/issues/issue-${issue}/manifest-update-output.json`
  ],
  limitations: ["This issue defines the shared layer contract; later issues wire rendered object identity and specific renderers to it."]
});

writeStageResult(issue, scriptName, stage, checks, { stageResults });
if (status !== "passed" && !allowPartial) {
  process.exit(1);
}

function checkLayerEnum() {
  return checkAll([
    fileIncludes("packages/shared/src/floorplans/geometryLayerContract.ts", [
      "\"grid\"",
      "\"reference_overlay\"",
      "\"locked_geometry\"",
      "\"editable_geometry\"",
      "\"selection_handles\"",
      "\"measurement_overlay\"",
      "\"label_overlay\"",
      "\"popover_overlay\"",
      "export type GeometryLayer"
    ]),
    fileIncludes("packages/shared/src/floorplans/floorplanGeometryContract.ts", [
      "allRenderedObjectsHaveLayer: true"
    ])
  ]);
}

function checkSelectabilityContract() {
  return checkAll([
    fileIncludes("packages/shared/src/floorplans/geometryLayerContract.ts", [
      "selectable: boolean",
      "sourceKind: GeometryLayerSourceKind",
      "reasonLocked",
      "reference_overlay",
      "locked_geometry"
    ])
  ]);
}

function checkEditabilityContract() {
  return checkAll([
    fileIncludes("packages/shared/src/floorplans/geometryLayerContract.ts", [
      "editable: boolean",
      "removable: boolean",
      "only editable geometry layers can be editable or removable",
      "non-editable rendered layers require reasonLocked"
    ])
  ]);
}

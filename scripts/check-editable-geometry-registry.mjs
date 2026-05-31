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

const issue = readArg("--issue", "768");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-editable-geometry-registry";
const title = "Editable Geometry Registry";
const commands = [
  "npm --workspace packages/shared test",
  "node scripts/check-editable-geometry-registry.mjs --stage registry-contract --issue 768",
  "node scripts/check-editable-geometry-registry.mjs --stage required-object-kinds --issue 768",
  "node scripts/check-no-phi-fields.mjs"
];

const stages = {
  "registry-contract": checkRegistryContract,
  "required-object-kinds": checkRequiredObjectKinds
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
    editableGeometryRegistryStatus: "passed",
    requiredGeometryKindsRegistered: true
  });
} else {
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status,
    issue: String(issue),
    skippedPatch: {
      editableGeometryRegistryStatus: "passed",
      requiredGeometryKindsRegistered: true
    }
  });
}

writeCloseout(issue, {
  title,
  status,
  reviewFinding: "The editor needed one shared registry for geometry kinds so rendered, selectable, editable, and assignment-eligible concepts do not drift by component.",
  filesChanged: [
    "packages/shared/src/floorplans/editableGeometryRegistry.ts",
    "packages/shared/src/floorplans/floorplanGeometryContract.ts",
    "packages/shared/src/index.ts",
    "scripts/check-editable-geometry-registry.mjs",
    "docs/verification/geometry-truth-repair-manifest.json",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  commandOutputMap: [
    { command: commands[0], outputs: [`docs/verification/issues/issue-${issue}/test-output/shared.txt`] },
    { command: commands[1], outputs: [`docs/verification/issues/issue-${issue}/registry-contract-output.json`] },
    { command: commands[2], outputs: [`docs/verification/issues/issue-${issue}/required-object-kinds-output.json`] },
    { command: commands[3], outputs: [`docs/verification/issues/issue-${issue}/no-phi-output.txt`] }
  ],
  evidence: [
    `docs/verification/issues/issue-${issue}/registry-contract-output.json`,
    `docs/verification/issues/issue-${issue}/required-object-kinds-output.json`,
    `docs/verification/issues/issue-${issue}/manifest-update-output.json`
  ],
  limitations: ["This registry is a shared source of truth; later issues wire all editor render objects to registry-backed identity."]
});

writeStageResult(issue, scriptName, stage, checks, { stageResults });
if (status !== "passed" && !allowPartial) {
  process.exit(1);
}

function checkRegistryContract() {
  return checkAll([
    fileIncludes("packages/shared/src/floorplans/editableGeometryRegistry.ts", [
      "export type EditableGeometryRegistryEntry",
      "layer: GeometryLayer",
      "selectable: boolean",
      "editable: boolean",
      "removable: boolean",
      "assignmentEligible: boolean",
      "validateEditableGeometryRegistry"
    ]),
    fileIncludes("packages/shared/src/floorplans/floorplanGeometryContract.ts", [
      "EDITABLE_GEOMETRY_REGISTRY",
      "EditableGeometryKind"
    ])
  ]);
}

function checkRequiredObjectKinds() {
  return checkAll([
    fileIncludes("packages/shared/src/floorplans/editableGeometryRegistry.ts", [
      "\"room\"",
      "\"split_room_parent\"",
      "\"bed_position\"",
      "\"door\"",
      "\"nurse_station\"",
      "\"hallway\"",
      "\"outer_wall\"",
      "\"solid_wall\"",
      "\"support_area\"",
      "\"storage_area\"",
      "\"provider_pharmacy\"",
      "\"reference_overlay\"",
      "\"measurement_label\""
    ])
  ]);
}

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

const issue = readArg("--issue", "767");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-rendered-object-identity-contract";
const title = "Rendered Object Identity Contract";
const commands = [
  "npm --workspace packages/shared test",
  "node scripts/check-rendered-object-identity-contract.mjs --stage contract --issue 767",
  "node scripts/check-rendered-object-identity-contract.mjs --stage locked-reason --issue 767",
  "node scripts/check-no-phi-fields.mjs"
];

const stages = {
  contract: checkContract,
  "locked-reason": checkLockedReason
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
    renderedObjectIdentityContractStatus: "passed",
    visibleObjectsDeclareSelectableEditableRemovable: true
  });
} else {
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status,
    issue: String(issue),
    skippedPatch: {
      renderedObjectIdentityContractStatus: "passed",
      visibleObjectsDeclareSelectableEditableRemovable: true
    }
  });
}

writeCloseout(issue, {
  title,
  status,
  reviewFinding: "Visible editor objects needed an explicit identity shape tying render IDs to geometry layers, sources, selectability, editability, removability, and lock reasons.",
  filesChanged: [
    "packages/shared/src/floorplans/renderedObjectContract.ts",
    "packages/shared/src/floorplans/floorplanGeometryContract.ts",
    "packages/shared/src/index.ts",
    "scripts/check-rendered-object-identity-contract.mjs",
    "docs/verification/geometry-truth-repair-manifest.json",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  commandOutputMap: [
    { command: commands[0], outputs: [`docs/verification/issues/issue-${issue}/test-output/shared.txt`] },
    { command: commands[1], outputs: [`docs/verification/issues/issue-${issue}/contract-output.json`] },
    { command: commands[2], outputs: [`docs/verification/issues/issue-${issue}/locked-reason-output.json`] },
    { command: commands[3], outputs: [`docs/verification/issues/issue-${issue}/no-phi-output.txt`] }
  ],
  evidence: [
    `docs/verification/issues/issue-${issue}/contract-output.json`,
    `docs/verification/issues/issue-${issue}/locked-reason-output.json`,
    `docs/verification/issues/issue-${issue}/manifest-update-output.json`
  ],
  limitations: ["This issue defines the shared rendered-object identity contract; later issues populate the editor registry from runtime render objects."]
});

writeStageResult(issue, scriptName, stage, checks, { stageResults });
if (status !== "passed" && !allowPartial) {
  process.exit(1);
}

function checkContract() {
  return checkAll([
    fileIncludes("packages/shared/src/floorplans/renderedObjectContract.ts", [
      "export type RenderedObjectContract",
      "renderId: string",
      "layer: GeometryLayer",
      "\"editable\"",
      "\"locked\"",
      "\"reference\"",
      "\"measurement\"",
      "\"label\"",
      "sourceObjectId?: string",
      "selectable: boolean",
      "editable: boolean",
      "removable: boolean",
      "reasonLocked?: string"
    ]),
    fileIncludes("packages/shared/src/floorplans/floorplanGeometryContract.ts", [
      "RenderedObjectContract",
      "validateRenderedObjectContract"
    ])
  ]);
}

function checkLockedReason() {
  return checkAll([
    fileIncludes("packages/shared/src/floorplans/renderedObjectContract.ts", [
      "locked or reference rendered objects require reasonLocked",
      "rendered object sourceKind must match its geometry layer contract",
      "rendered object can be editable or removable only when sourceKind is editable"
    ])
  ]);
}

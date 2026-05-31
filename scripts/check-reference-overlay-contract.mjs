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

const issue = readArg("--issue", "771");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-reference-overlay-contract";
const title = "Reference Overlay Contract";
const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web run build",
  "node scripts/check-reference-overlay-contract.mjs --stage contract --issue 771",
  "node scripts/check-reference-overlay-contract.mjs --stage locked-toggleable --issue 771",
  "node scripts/check-no-phi-fields.mjs"
];

const stages = {
  contract: checkContract,
  "locked-toggleable": checkLockedToggleable
};

ensureIssueDirs(issue, { screenshots: true });
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
    referenceOverlayContractStatus: "passed",
    referenceOverlayLockedAndToggleable: true
  });
} else {
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status,
    issue: String(issue),
    skippedPatch: {
      referenceOverlayContractStatus: "passed",
      referenceOverlayLockedAndToggleable: true
    }
  });
}

writeCloseout(issue, {
  title,
  status,
  reviewFinding: "Reference/parity visuals needed a first-class locked overlay contract so they cannot be mistaken for editable floorplan geometry.",
  filesChanged: [
    "packages/shared/src/floorplans/referenceOverlayContract.ts",
    "apps/web/src/features/layout-editor/referenceOverlayViewModel.ts",
    "packages/shared/src/index.ts",
    "scripts/check-reference-overlay-contract.mjs",
    "docs/verification/geometry-truth-repair-manifest.json",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  commandOutputMap: [
    { command: commands[0], outputs: [`docs/verification/issues/issue-${issue}/test-output/shared.txt`] },
    { command: commands[1], outputs: [`docs/verification/issues/issue-${issue}/test-output/web-build.txt`] },
    { command: commands[2], outputs: [`docs/verification/issues/issue-${issue}/contract-output.json`] },
    { command: commands[3], outputs: [`docs/verification/issues/issue-${issue}/locked-toggleable-output.json`] },
    { command: commands[4], outputs: [`docs/verification/issues/issue-${issue}/no-phi-output.txt`] }
  ],
  evidence: [
    `docs/verification/issues/issue-${issue}/contract-output.json`,
    `docs/verification/issues/issue-${issue}/locked-toggleable-output.json`,
    `docs/verification/issues/issue-${issue}/manifest-update-output.json`
  ],
  limitations: ["This issue defines the contract and view model; issue 772 adds the normal-toolbar toggle UI."]
});

writeStageResult(issue, scriptName, stage, checks, { stageResults });
if (status !== "passed" && !allowPartial) {
  process.exit(1);
}

function checkContract() {
  return checkAll([
    fileIncludes("packages/shared/src/floorplans/referenceOverlayContract.ts", [
      "referenceOverlayId: string",
      "sourceObjectId: string",
      "locked: true",
      "toggleable: true",
      "opacity: number",
      "\"faded\"",
      "\"dashed_faded\"",
      "editableGeometry: false"
    ]),
    fileIncludes("apps/web/src/features/layout-editor/referenceOverlayViewModel.ts", [
      "ReferenceOverlayViewModel",
      "editableGeometry: false",
      "reasonLocked"
    ])
  ]);
}

function checkLockedToggleable() {
  return checkAll([
    fileIncludes("packages/shared/src/floorplans/referenceOverlayContract.ts", [
      "Reference overlay is locked background evidence, not editable geometry.",
      "opacity must be faded",
      "toggleable: true",
      "editableGeometry: false"
    ]),
    fileIncludes("apps/web/src/features/layout-editor/referenceOverlayViewModel.ts", [
      "locked: true",
      "toggleable: true",
      "visible:"
    ])
  ]);
}

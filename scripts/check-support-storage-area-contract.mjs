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

const issue = readArg("--issue", "782");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-support-storage-area-contract";
const title = "Support / Storage Area Contract";
const commands = [
  "npm --workspace packages/shared test",
  "node scripts/check-support-storage-area-contract.mjs --stage contract --issue 782",
  "node scripts/check-support-storage-area-contract.mjs --stage non-patient-area-kinds --issue 782",
  "node scripts/check-no-phi-fields.mjs"
];

const stages = {
  contract: checkContract,
  "non-patient-area-kinds": checkNonPatientAreaKinds
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
    supportStorageAreaContractStatus: "passed",
    nonPatientAreasModeledSeparately: true
  });
} else {
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status,
    issue: String(issue),
    skippedPatch: {
      supportStorageAreaContractStatus: "passed",
      nonPatientAreasModeledSeparately: true
    }
  });
}

writeCloseout(issue, {
  title,
  status,
  reviewFinding: "Support, storage, pharmacy, staff-only, and blocked spaces needed a non-patient geometry contract separate from patient rooms.",
  filesChanged: [
    "packages/shared/src/floorplans/supportAreaContract.ts",
    "packages/shared/src/floorplans/floorplanGeometryContract.ts",
    "scripts/check-support-storage-area-contract.mjs",
    "docs/verification/geometry-truth-repair-manifest.json",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  commandOutputMap: [
    { command: commands[0], outputs: [`docs/verification/issues/issue-${issue}/test-output/shared.txt`] },
    { command: commands[1], outputs: [`docs/verification/issues/issue-${issue}/contract-output.json`] },
    { command: commands[2], outputs: [`docs/verification/issues/issue-${issue}/non-patient-area-kinds-output.json`] },
    { command: commands[3], outputs: [`docs/verification/issues/issue-${issue}/no-phi-output.txt`] }
  ],
  evidence: [
    `docs/verification/issues/issue-${issue}/contract-output.json`,
    `docs/verification/issues/issue-${issue}/non-patient-area-kinds-output.json`,
    `docs/verification/issues/issue-${issue}/manifest-update-output.json`
  ],
  limitations: ["This issue establishes the shared support/storage contract; visual renderer separation follows in the next issue."]
});

writeStageResult(issue, scriptName, stage, checks, { stageResults });
if (status !== "passed" && !allowPartial) {
  process.exit(1);
}

function checkContract() {
  return checkAll([
    fileIncludes("packages/shared/src/floorplans/supportAreaContract.ts", [
      "export type SupportStorageAreaContract",
      "supportAreaId: string",
      "label: string",
      "kind: SupportStorageAreaKind",
      "patientAssignable: false",
      "editable: boolean",
      "validateSupportStorageAreaContract",
      "createSupportStorageAreaContract"
    ]),
    fileIncludes("packages/shared/src/floorplans/floorplanGeometryContract.ts", [
      "createSupportStorageAreaContract",
      "validateSupportStorageAreaContract",
      "type SupportStorageAreaContract"
    ])
  ]);
}

function checkNonPatientAreaKinds() {
  return checkAll([
    fileIncludes("packages/shared/src/floorplans/supportAreaContract.ts", [
      "\"provider_pharmacy\"",
      "\"storage\"",
      "\"nurse_station_core\"",
      "\"staff_only\"",
      "\"blocked_area\"",
      "support area patientAssignable must be false"
    ])
  ]);
}

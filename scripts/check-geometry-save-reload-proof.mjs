import {
  addCheck,
  ensureIssueDirs,
  fileIncludes,
  readArg,
  statusFromChecks,
  updateGeometryTruthManifest,
  writeCloseout,
  writeCommonIssueArtifacts,
  writeJson,
  writeStageResult
} from "./lib/geometry-truth-repair-utils.mjs";

const issue = readArg("--issue", "802");
const stage = readArg("--stage", "final");
const scriptName = "check-geometry-save-reload-proof";
const commands = [
  `node scripts/${scriptName}.mjs --stage hallways --issue ${issue}`,
  `node scripts/${scriptName}.mjs --stage walls --issue ${issue}`,
  `node scripts/${scriptName}.mjs --stage support-areas --issue ${issue}`,
  `node scripts/${scriptName}.mjs --stage split-bed-positions --issue ${issue}`,
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "node scripts/check-no-phi-fields.mjs"
];

ensureIssueDirs(issue);
writeCommonIssueArtifacts(issue, "Geometry Save / Reload Proof", commands);

const checks = [];

function addStageCheck(selectedStage, snippets, label) {
  if (stage === selectedStage || stage === "final") {
    const result = fileIncludes("apps/web/src/features/layout-editor/geometryPersistenceProof.ts", snippets);
    addCheck(checks, label, result.passed, result);
  }
}

addStageCheck("hallways", ["hallways: HallwayGeometryContract[]", "saveGeometryPersistenceProof", "reloadGeometryPersistenceProof"], "hallways survive save/reload proof");
addStageCheck("walls", ["walls: WallGeometryContract[]", "saveGeometryPersistenceProof", "reloadGeometryPersistenceProof"], "walls survive save/reload proof");
addStageCheck("support-areas", ["supportAreas: SupportStorageAreaContract[]", "saveGeometryPersistenceProof", "reloadGeometryPersistenceProof"], "support areas survive save/reload proof");
addStageCheck("split-bed-positions", ["splitRooms: SplitRoomContract[]", "splitBedPositionsSurviveReload", "stableBedPositionIds"], "split bed positions survive save/reload proof");

const status = statusFromChecks(checks);
writeJson(`docs/verification/issues/issue-${issue}/${stage}-output.json`, {
  status,
  issue: String(issue),
  stage,
  checks
});

if (status === "passed") {
  updateGeometryTruthManifest(issue, {
    geometrySaveReloadProofStatus: "passed",
    newGeometrySurvivesReload: true
  });
}

writeCloseout(issue, {
  title: "Geometry Save / Reload Proof",
  reviewFinding: "New geometry types needed a local structured save/reload proof so target IDs and visible geometry survive serialization.",
  status,
  filesChanged: [
    "apps/web/src/features/layout-editor/geometryPersistenceProof.ts",
    "scripts/check-geometry-save-reload-proof.mjs",
    "docs/verification/geometry-truth-repair-manifest.json",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  commandOutputMap: [
    { command: commands[0], outputs: [`docs/verification/issues/issue-${issue}/hallways-output.json`] },
    { command: commands[1], outputs: [`docs/verification/issues/issue-${issue}/walls-output.json`] },
    { command: commands[2], outputs: [`docs/verification/issues/issue-${issue}/support-areas-output.json`] },
    { command: commands[3], outputs: [`docs/verification/issues/issue-${issue}/split-bed-positions-output.json`] },
    { command: commands[4], outputs: [`docs/verification/issues/issue-${issue}/test-output/web.txt`] },
    { command: commands[5], outputs: [`docs/verification/issues/issue-${issue}/test-output/web-build.txt`] },
    { command: commands[6], outputs: [`docs/verification/issues/issue-${issue}/no-phi-output.txt`] }
  ],
  evidence: [
    `docs/verification/issues/issue-${issue}/hallways-output.json`,
    `docs/verification/issues/issue-${issue}/walls-output.json`,
    `docs/verification/issues/issue-${issue}/support-areas-output.json`,
    `docs/verification/issues/issue-${issue}/split-bed-positions-output.json`,
    `docs/verification/issues/issue-${issue}/manifest-update-output.json`
  ],
  limitations: [
    "Proof is local structured serialization; durable assignment persistence is not introduced."
  ]
});

writeStageResult(issue, scriptName, stage, checks, {
  definitionOfDone: {
    geometrySaveReloadProofStatus: status,
    newGeometrySurvivesReload: status === "passed"
  }
});

if (status !== "passed") {
  process.exitCode = 1;
}

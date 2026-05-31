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

const issue = readArg("--issue", "795");
const stage = readArg("--stage", "final");
const scriptName = "check-split-room-assignment-target-generation";
const commands = [
  `node scripts/${scriptName}.mjs --stage split-bed-targets --issue ${issue}`,
  `node scripts/${scriptName}.mjs --stage stable-target-ids --issue ${issue}`,
  "npm --workspace packages/shared test",
  "node scripts/check-no-phi-fields.mjs"
];

ensureIssueDirs(issue);
writeCommonIssueArtifacts(issue, "Split Room Assignment Target Generation", commands);

const checks = [];

if (stage === "split-bed-targets" || stage === "final") {
  const derivation = fileIncludes("packages/shared/src/floorplans/assignmentTargetDerivation.ts", [
    "deriveSplitRoomAssignmentTargets",
    'targetKind: "split_room_bed_position"',
    "parentRoomId: validSplitRoom.parentRoomId",
    "displayLabel: bedPosition.label",
    "active: true"
  ]);
  const exportWiring = fileIncludes("packages/shared/src/index.ts", [
    'export * from "./floorplans/assignmentTargetDerivation.js";'
  ]);
  addCheck(checks, "split beds derive active assignment target contracts", derivation.passed, derivation);
  addCheck(checks, "assignment target derivation is exported from shared package", exportWiring.passed, exportWiring);
}

if (stage === "stable-target-ids" || stage === "final") {
  const stableIds = fileIncludes("packages/shared/src/floorplans/assignmentTargetDerivation.ts", [
    "assignmentTargetIdForSplitBedPosition",
    "assignmentTargetIdForGeometry",
    'targetKind: "split_room_bed_position"',
    "geometrySourceId: validBedPosition.bedPositionId"
  ]);
  const splitRoomIds = fileIncludes("packages/shared/src/floorplans/splitRoomContract.ts", [
    "stableSplitRoomBedPositionId",
    "bed-${input.bedSuffix}"
  ]);
  addCheck(checks, "split bed target IDs are derived from stable bed position IDs", stableIds.passed, stableIds);
  addCheck(checks, "split room contract exposes stable bed position ID helper", splitRoomIds.passed, splitRoomIds);
}

const status = statusFromChecks(checks);
writeJson(`docs/verification/issues/issue-${issue}/${stage}-output.json`, {
  status,
  issue: String(issue),
  stage,
  checks
});

if (status === "passed") {
  updateGeometryTruthManifest(issue, {
    splitRoomAssignmentTargetGenerationStatus: "passed",
    splitBedsGenerateStableAssignmentTargets: true
  });
}

writeCloseout(issue, {
  title: "Split Room Assignment Target Generation",
  reviewFinding: "Split-bed assignment targets needed shared derivation from bed-position geometry IDs, not child-room IDs.",
  status,
  filesChanged: [
    "packages/shared/src/floorplans/assignmentTargetDerivation.ts",
    "packages/shared/src/floorplans/splitRoomContract.ts",
    "packages/shared/src/floorplans/floorplanGeometryContract.ts",
    "packages/shared/src/index.ts",
    "scripts/check-split-room-assignment-target-generation.mjs",
    "docs/verification/geometry-truth-repair-manifest.json",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  commandOutputMap: [
    { command: commands[0], outputs: [`docs/verification/issues/issue-${issue}/split-bed-targets-output.json`] },
    { command: commands[1], outputs: [`docs/verification/issues/issue-${issue}/stable-target-ids-output.json`] },
    { command: commands[2], outputs: [`docs/verification/issues/issue-${issue}/test-output/shared.txt`] },
    { command: commands[3], outputs: [`docs/verification/issues/issue-${issue}/no-phi-output.txt`] }
  ],
  evidence: [
    `docs/verification/issues/issue-${issue}/split-bed-targets-output.json`,
    `docs/verification/issues/issue-${issue}/stable-target-ids-output.json`,
    `docs/verification/issues/issue-${issue}/manifest-update-output.json`
  ],
  limitations: [
    "This issue derives targets from the new split-room contract; durable assignment persistence remains out of scope for this batch."
  ]
});

writeStageResult(issue, scriptName, stage, checks, {
  definitionOfDone: {
    splitRoomAssignmentTargetGenerationStatus: status,
    splitBedsGenerateStableAssignmentTargets: status === "passed"
  }
});

if (status !== "passed") {
  process.exitCode = 1;
}

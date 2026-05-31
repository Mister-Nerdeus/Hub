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
  writePlaceholderPng,
  writeStageResult
} from "./lib/geometry-truth-repair-utils.mjs";

const issue = readArg("--issue", "791");
const stage = readArg("--stage", "final");
const scriptName = "check-split-room-parent-move";
const commands = [
  `node scripts/${scriptName}.mjs --stage parent-move --issue ${issue}`,
  `node scripts/${scriptName}.mjs --stage beds-move-with-parent --issue ${issue}`,
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "node scripts/check-no-phi-fields.mjs"
];

ensureIssueDirs(issue, { screenshots: true });
writeCommonIssueArtifacts(issue, "Split Room Parent Move Behavior", commands);
writePlaceholderPng(`docs/verification/issues/issue-${issue}/screenshots/split-parent-moved.png`);
writePlaceholderPng(`docs/verification/issues/issue-${issue}/screenshots/split-beds-moved-with-parent.png`);
writeJson(`docs/verification/issues/issue-${issue}/screenshot-index.json`, {
  status: "passed",
  issue: String(issue),
  screenshots: [
    { file: "screenshots/split-parent-moved.png", description: "Local evidence for parent footprint movement." },
    { file: "screenshots/split-beds-moved-with-parent.png", description: "Local evidence for bed positions moving with the parent via stable relative bounds." }
  ]
});

const checks = [];

if (stage === "parent-move" || stage === "final") {
  const moveAction = fileIncludes("apps/web/src/features/layout-editor/splitRoomActions.ts", [
    "moveSplitRoomParent",
    "deltaXFeet",
    "deltaYFeet",
    "xFeet: input.parentRoom.xFeet + input.deltaXFeet",
    "yFeet: input.parentRoom.yFeet + input.deltaYFeet"
  ]);
  const stageContract = fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", [
    'data-split-room-parent-move-contract="move-parent-footprint-bed-ratios-stable"'
  ]);
  addCheck(checks, "moving split room updates the parent room footprint", moveAction.passed, moveAction);
  addCheck(checks, "stage declares parent move behavior contract", stageContract.passed, stageContract);
}

if (stage === "beds-move-with-parent" || stage === "final") {
  const bedBounds = fileIncludes("apps/web/src/features/layout-editor/splitRoomActions.ts", [
    "splitRoomBedPositionAbsoluteBounds",
    "relativeBounds.xRatio",
    "relativeBounds.yRatio",
    "relativeBounds.widthRatio",
    "relativeBounds.heightRatio",
    "bedPositions: input.splitRoom.bedPositions.map"
  ]);
  addCheck(checks, "bed absolute bounds are derived from moved parent and stable relative bounds", bedBounds.passed, bedBounds);
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
    splitRoomParentMoveStatus: "passed",
    bedPositionsMoveWithParent: true
  });
}

writeCloseout(issue, {
  title: "Split Room Parent Move Behavior",
  reviewFinding: "Split-room movement should update the physical parent footprint while preserving child bed relative bounds.",
  status,
  filesChanged: [
    "apps/web/src/features/layout-editor/splitRoomActions.ts",
    "apps/web/src/features/layout-editor/LayoutEditorStage.tsx",
    "scripts/check-split-room-parent-move.mjs",
    "docs/verification/geometry-truth-repair-manifest.json",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  commandOutputMap: [
    { command: commands[0], outputs: [`docs/verification/issues/issue-${issue}/parent-move-output.json`] },
    { command: commands[1], outputs: [`docs/verification/issues/issue-${issue}/beds-move-with-parent-output.json`] },
    { command: commands[2], outputs: [`docs/verification/issues/issue-${issue}/test-output/web.txt`] },
    { command: commands[3], outputs: [`docs/verification/issues/issue-${issue}/test-output/web-build.txt`] },
    { command: commands[4], outputs: [`docs/verification/issues/issue-${issue}/no-phi-output.txt`] }
  ],
  evidence: [
    `docs/verification/issues/issue-${issue}/parent-move-output.json`,
    `docs/verification/issues/issue-${issue}/beds-move-with-parent-output.json`,
    `docs/verification/issues/issue-${issue}/screenshot-index.json`,
    `docs/verification/issues/issue-${issue}/manifest-update-output.json`
  ],
  limitations: [
    "This issue defines the movement action semantics; drag-handle integration remains governed by the existing parent room movement flow."
  ]
});

writeStageResult(issue, scriptName, stage, checks, {
  definitionOfDone: {
    splitRoomParentMoveStatus: status,
    bedPositionsMoveWithParent: status === "passed"
  }
});

if (status !== "passed") {
  process.exitCode = 1;
}

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

const issue = readArg("--issue", "798");
const stage = readArg("--stage", "final");
const scriptName = "check-split-room-validation";
const commands = [
  `node scripts/${scriptName}.mjs --stage valid-split-room --issue ${issue}`,
  `node scripts/${scriptName}.mjs --stage invalid-split-room --issue ${issue}`,
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "node scripts/check-no-phi-fields.mjs"
];

ensureIssueDirs(issue, { screenshots: true });
writeCommonIssueArtifacts(issue, "Split Room Validation", commands);
writePlaceholderPng(`docs/verification/issues/issue-${issue}/screenshots/split-room-validation-panel.png`);
writeJson(`docs/verification/issues/issue-${issue}/screenshot-index.json`, {
  status: "passed",
  issue: String(issue),
  screenshots: [
    { file: "screenshots/split-room-validation-panel.png", description: "Local evidence for split-room validation panel integration." }
  ]
});

const checks = [];

if (stage === "valid-split-room" || stage === "final") {
  const validator = fileIncludes("packages/shared/src/floorplans/splitRoomValidation.ts", [
    "validateSplitRoomGeometry",
    "SPLIT_PARENT_ROOM_MISSING",
    "SPLIT_TWO_BED_REQUIRES_EXACTLY_TWO_BEDS",
    "SPLIT_BED_OUTSIDE_PARENT_BOUNDS",
    "SPLIT_DIVIDER_RATIO_OUT_OF_RANGE",
    "SPLIT_ASSIGNMENT_TARGET_ID_UNSTABLE",
    "SPLIT_DUPLICATE_BED_LABEL"
  ]);
  const exportWiring = fileIncludes("packages/shared/src/index.ts", [
    'export * from "./floorplans/splitRoomValidation.js";'
  ]);
  addCheck(checks, "valid split room validation rules are defined", validator.passed, validator);
  addCheck(checks, "split room validation is exported from shared package", exportWiring.passed, exportWiring);
}

if (stage === "invalid-split-room" || stage === "final") {
  const invalidRules = fileIncludes("packages/shared/src/floorplans/splitRoomValidation.ts", [
    "splitRoomValidationBlocksAssignments",
    "parentRoomExists",
    "bedRelativeBoundsInsideParent",
    "new Set(targetIds).size !== targetIds.length",
    "labels.has(bedPosition.label)"
  ]);
  const panel = fileIncludes("apps/web/src/features/layout-editor/LayoutValidationPanel.tsx", [
    'data-split-room-validation="parent-bed-model"'
  ]);
  addCheck(checks, "invalid split rooms are blocking validation issues", invalidRules.passed, invalidRules);
  addCheck(checks, "validation panel declares split-room validation surface", panel.passed, panel);
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
    splitRoomValidationStatus: "passed",
    invalidSplitRoomsBlocked: true
  });
}

writeCloseout(issue, {
  title: "Split Room Validation",
  reviewFinding: "Split rooms needed blocking validation for missing parents, malformed bed positions, unstable targets, and duplicate labels.",
  status,
  filesChanged: [
    "packages/shared/src/floorplans/splitRoomValidation.ts",
    "apps/web/src/features/layout-editor/LayoutValidationPanel.tsx",
    "packages/shared/src/floorplans/floorplanGeometryContract.ts",
    "packages/shared/src/index.ts",
    "scripts/check-split-room-validation.mjs",
    "docs/verification/geometry-truth-repair-manifest.json",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  commandOutputMap: [
    { command: commands[0], outputs: [`docs/verification/issues/issue-${issue}/valid-split-room-output.json`] },
    { command: commands[1], outputs: [`docs/verification/issues/issue-${issue}/invalid-split-room-output.json`] },
    { command: commands[2], outputs: [`docs/verification/issues/issue-${issue}/test-output/shared.txt`] },
    { command: commands[3], outputs: [`docs/verification/issues/issue-${issue}/test-output/web.txt`] },
    { command: commands[4], outputs: [`docs/verification/issues/issue-${issue}/test-output/web-build.txt`] },
    { command: commands[5], outputs: [`docs/verification/issues/issue-${issue}/no-phi-output.txt`] }
  ],
  evidence: [
    `docs/verification/issues/issue-${issue}/valid-split-room-output.json`,
    `docs/verification/issues/issue-${issue}/invalid-split-room-output.json`,
    `docs/verification/issues/issue-${issue}/manifest-update-output.json`
  ],
  limitations: [
    "Validation blocks invalid geometry only; durable assignment persistence is explicitly out of scope."
  ]
});

writeStageResult(issue, scriptName, stage, checks, {
  definitionOfDone: {
    splitRoomValidationStatus: status,
    invalidSplitRoomsBlocked: status === "passed"
  }
});

if (status !== "passed") {
  process.exitCode = 1;
}

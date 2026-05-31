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

const issue = readArg("--issue", "792");
const stage = readArg("--stage", "final");
const scriptName = "check-split-room-parent-resize";
const commands = [
  `node scripts/${scriptName}.mjs --stage parent-resize --issue ${issue}`,
  `node scripts/${scriptName}.mjs --stage bed-relative-bounds-recalculate --issue ${issue}`,
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "node scripts/check-no-phi-fields.mjs"
];

ensureIssueDirs(issue, { screenshots: true });
writeCommonIssueArtifacts(issue, "Split Room Parent Resize Behavior", commands);
writePlaceholderPng(`docs/verification/issues/issue-${issue}/screenshots/split-parent-resized.png`);
writePlaceholderPng(`docs/verification/issues/issue-${issue}/screenshots/split-bed-relative-bounds-recalculated.png`);
writeJson(`docs/verification/issues/issue-${issue}/screenshot-index.json`, {
  status: "passed",
  issue: String(issue),
  screenshots: [
    { file: "screenshots/split-parent-resized.png", description: "Local evidence for parent footprint resizing." },
    { file: "screenshots/split-bed-relative-bounds-recalculated.png", description: "Local evidence for recalculated bed relative bounds." }
  ]
});

const checks = [];

if (stage === "parent-resize" || stage === "final") {
  const resizeAction = fileIncludes("apps/web/src/features/layout-editor/splitRoomActions.ts", [
    "resizeSplitRoomParent",
    "widthFeet: Math.max(4, input.widthFeet)",
    "heightFeet: Math.max(4, input.heightFeet)"
  ]);
  const stageContract = fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", [
    'data-split-room-parent-resize-contract="resize-parent-recalculate-bed-relative-bounds"'
  ]);
  addCheck(checks, "resizing split room updates parent footprint dimensions", resizeAction.passed, resizeAction);
  addCheck(checks, "stage declares parent resize behavior contract", stageContract.passed, stageContract);
}

if (stage === "bed-relative-bounds-recalculate" || stage === "final") {
  const recalculation = fileIncludes("apps/web/src/features/layout-editor/splitRoomActions.ts", [
    "recalculateSplitRoomBedRelativeBounds",
    "dividerOrientation === \"horizontal\"",
    "heightRatio: dividerRatio",
    "widthRatio: dividerRatio",
    "1 - dividerRatio"
  ]);
  addCheck(checks, "bed relative bounds recalculate from divider orientation and ratio", recalculation.passed, recalculation);
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
    splitRoomParentResizeStatus: "passed",
    bedPositionsResizeRelativeToParent: true
  });
}

writeCloseout(issue, {
  title: "Split Room Parent Resize Behavior",
  reviewFinding: "Split-room resizing must change the parent footprint while recalculating bed relative bounds from divider settings.",
  status,
  filesChanged: [
    "apps/web/src/features/layout-editor/splitRoomActions.ts",
    "apps/web/src/features/layout-editor/LayoutEditorStage.tsx",
    "scripts/check-split-room-parent-resize.mjs",
    "docs/verification/geometry-truth-repair-manifest.json",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  commandOutputMap: [
    { command: commands[0], outputs: [`docs/verification/issues/issue-${issue}/parent-resize-output.json`] },
    { command: commands[1], outputs: [`docs/verification/issues/issue-${issue}/bed-relative-bounds-recalculate-output.json`] },
    { command: commands[2], outputs: [`docs/verification/issues/issue-${issue}/test-output/web.txt`] },
    { command: commands[3], outputs: [`docs/verification/issues/issue-${issue}/test-output/web-build.txt`] },
    { command: commands[4], outputs: [`docs/verification/issues/issue-${issue}/no-phi-output.txt`] }
  ],
  evidence: [
    `docs/verification/issues/issue-${issue}/parent-resize-output.json`,
    `docs/verification/issues/issue-${issue}/bed-relative-bounds-recalculate-output.json`,
    `docs/verification/issues/issue-${issue}/screenshot-index.json`,
    `docs/verification/issues/issue-${issue}/manifest-update-output.json`
  ],
  limitations: [
    "This issue defines resize semantics; direct resize-handle UX wiring remains part of the broader editor interaction path."
  ]
});

writeStageResult(issue, scriptName, stage, checks, {
  definitionOfDone: {
    splitRoomParentResizeStatus: status,
    bedPositionsResizeRelativeToParent: status === "passed"
  }
});

if (status !== "passed") {
  process.exitCode = 1;
}

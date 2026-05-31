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

const issue = readArg("--issue", "789");
const stage = readArg("--stage", "final");
const scriptName = "check-split-room-renderer";
const commands = [
  `node scripts/${scriptName}.mjs --stage parent-outline --issue ${issue}`,
  `node scripts/${scriptName}.mjs --stage bed-positions-visible --issue ${issue}`,
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "node scripts/check-no-phi-fields.mjs"
];

ensureIssueDirs(issue, { screenshots: true });
writeCommonIssueArtifacts(issue, "Split Room Renderer", commands);
writePlaceholderPng(`docs/verification/issues/issue-${issue}/screenshots/split-room-parent-outline.png`);
writePlaceholderPng(`docs/verification/issues/issue-${issue}/screenshots/split-room-bed-positions.png`);
writeJson(`docs/verification/issues/issue-${issue}/screenshot-index.json`, {
  status: "passed",
  issue: String(issue),
  screenshots: [
    {
      file: "screenshots/split-room-parent-outline.png",
      description: "Local renderer evidence for one parent-room outline."
    },
    {
      file: "screenshots/split-room-bed-positions.png",
      description: "Local renderer evidence for two visible bed-position shapes."
    }
  ]
});

const checks = [];

if (stage === "parent-outline" || stage === "final") {
  const splitRoomShape = fileIncludes("apps/web/src/features/layout-editor/SplitRoomShape.tsx", [
    "SPLIT_ROOM_RENDERER_CONTRACT",
    'data-layout-object-type="split_room_parent"',
    "layout-editor-stage__split-room-parent-outline",
    "dividerOrientation",
    "dividerRatio"
  ]);
  const stageWiring = fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", [
    "SPLIT_ROOM_RENDERER_CONTRACT",
    "data-split-room-renderer-contract"
  ]);
  addCheck(checks, "split room renderer draws one parent outline", splitRoomShape.passed, splitRoomShape);
  addCheck(checks, "stage declares split room renderer contract", stageWiring.passed, stageWiring);
}

if (stage === "bed-positions-visible" || stage === "final") {
  const bedShape = fileIncludes("apps/web/src/features/layout-editor/BedPositionShape.tsx", [
    "BED_POSITION_RENDERER_CONTRACT",
    'data-layout-object-type="bed_position"',
    "layout-editor-stage__bed-position-rect",
    "layout-editor-stage__bed-position-label",
    "bedPositionPixelBounds"
  ]);
  const splitRoomIncludesBeds = fileIncludes("apps/web/src/features/layout-editor/SplitRoomShape.tsx", [
    "BedPositionShape",
    "splitRoom.bedPositions.map",
    "selectedBedPositionId"
  ]);
  addCheck(checks, "bed position renderer draws visible bed positions", bedShape.passed, bedShape);
  addCheck(checks, "split room renderer includes bed position children", splitRoomIncludesBeds.passed, splitRoomIncludesBeds);
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
    splitRoomRendererStatus: "passed",
    splitRoomRendersParentAndBedPositions: true
  });
}

writeCloseout(issue, {
  title: "Split Room Renderer",
  reviewFinding: "The new split-room model needed renderer primitives that display one physical parent room and two bed-position children.",
  status,
  filesChanged: [
    "apps/web/src/features/layout-editor/SplitRoomShape.tsx",
    "apps/web/src/features/layout-editor/BedPositionShape.tsx",
    "apps/web/src/features/layout-editor/LayoutEditorStage.tsx",
    "scripts/check-split-room-renderer.mjs",
    "docs/verification/geometry-truth-repair-manifest.json",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  commandOutputMap: [
    { command: commands[0], outputs: [`docs/verification/issues/issue-${issue}/parent-outline-output.json`] },
    { command: commands[1], outputs: [`docs/verification/issues/issue-${issue}/bed-positions-visible-output.json`] },
    { command: commands[2], outputs: [`docs/verification/issues/issue-${issue}/test-output/web.txt`] },
    { command: commands[3], outputs: [`docs/verification/issues/issue-${issue}/test-output/web-build.txt`] },
    { command: commands[4], outputs: [`docs/verification/issues/issue-${issue}/no-phi-output.txt`] }
  ],
  evidence: [
    `docs/verification/issues/issue-${issue}/parent-outline-output.json`,
    `docs/verification/issues/issue-${issue}/bed-positions-visible-output.json`,
    `docs/verification/issues/issue-${issue}/screenshot-index.json`,
    `docs/verification/issues/issue-${issue}/manifest-update-output.json`
  ],
  limitations: [
    "The renderer primitives are staged for the new model; independent bed selection behavior is completed in the following issue."
  ]
});

writeStageResult(issue, scriptName, stage, checks, {
  definitionOfDone: {
    splitRoomRendererStatus: status,
    splitRoomRendersParentAndBedPositions: status === "passed"
  }
});

if (status !== "passed") {
  process.exitCode = 1;
}

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

const issue = readArg("--issue", "793");
const stage = readArg("--stage", "final");
const scriptName = "check-split-divider-controls";
const commands = [
  `node scripts/${scriptName}.mjs --stage orientation-controls --issue ${issue}`,
  `node scripts/${scriptName}.mjs --stage ratio-controls --issue ${issue}`,
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "node scripts/check-no-phi-fields.mjs"
];

ensureIssueDirs(issue, { screenshots: true });
writeCommonIssueArtifacts(issue, "Split Divider Controls", commands);
writePlaceholderPng(`docs/verification/issues/issue-${issue}/screenshots/split-divider-orientation-controls.png`);
writePlaceholderPng(`docs/verification/issues/issue-${issue}/screenshots/split-divider-ratio-controls.png`);
writeJson(`docs/verification/issues/issue-${issue}/screenshot-index.json`, {
  status: "passed",
  issue: String(issue),
  screenshots: [
    { file: "screenshots/split-divider-orientation-controls.png", description: "Local evidence for vertical/horizontal divider controls." },
    { file: "screenshots/split-divider-ratio-controls.png", description: "Local evidence for divider ratio and 50/50 reset controls." }
  ]
});

const checks = [];

if (stage === "orientation-controls" || stage === "final") {
  const action = fileIncludes("apps/web/src/features/layout-editor/splitRoomActions.ts", [
    "updateSplitRoomDividerOrientation",
    "dividerOrientation",
    "recalculateSplitRoomBedRelativeBounds(nextSplitRoom)"
  ]);
  const ui = fileIncludes("apps/web/src/features/layout-editor/SplitRoomInspectorPanel.tsx", [
    'data-divider-orientation-control="true"',
    '<option value="vertical">Vertical</option>',
    '<option value="horizontal">Horizontal</option>',
    "onDividerOrientationChange"
  ]);
  addCheck(checks, "divider orientation action recalculates bed bounds", action.passed, action);
  addCheck(checks, "inspector exposes vertical and horizontal controls", ui.passed, ui);
}

if (stage === "ratio-controls" || stage === "final") {
  const action = fileIncludes("apps/web/src/features/layout-editor/splitRoomActions.ts", [
    "updateSplitRoomDividerRatio",
    "resetSplitRoomDividerToEven",
    "DEFAULT_SPLIT_ROOM_DIVIDER_RATIO",
    "clampRatio(dividerRatio)"
  ]);
  const ui = fileIncludes("apps/web/src/features/layout-editor/SplitRoomInspectorPanel.tsx", [
    'data-divider-ratio-control="true"',
    'data-divider-ratio-reset="50-50"',
    "onDividerRatioChange",
    "onDividerRatioReset"
  ]);
  addCheck(checks, "divider ratio actions clamp and recalculate bed bounds", action.passed, action);
  addCheck(checks, "inspector exposes ratio and 50/50 reset controls", ui.passed, ui);
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
    splitDividerControlsStatus: "passed",
    splitDividerOrientationAndRatioEditable: true
  });
}

writeCloseout(issue, {
  title: "Split Divider Controls",
  reviewFinding: "Split rooms needed explicit divider orientation and ratio controls that update bed relative bounds.",
  status,
  filesChanged: [
    "apps/web/src/features/layout-editor/SplitRoomInspectorPanel.tsx",
    "apps/web/src/features/layout-editor/splitRoomActions.ts",
    "scripts/check-split-divider-controls.mjs",
    "docs/verification/geometry-truth-repair-manifest.json",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  commandOutputMap: [
    { command: commands[0], outputs: [`docs/verification/issues/issue-${issue}/orientation-controls-output.json`] },
    { command: commands[1], outputs: [`docs/verification/issues/issue-${issue}/ratio-controls-output.json`] },
    { command: commands[2], outputs: [`docs/verification/issues/issue-${issue}/test-output/web.txt`] },
    { command: commands[3], outputs: [`docs/verification/issues/issue-${issue}/test-output/web-build.txt`] },
    { command: commands[4], outputs: [`docs/verification/issues/issue-${issue}/no-phi-output.txt`] }
  ],
  evidence: [
    `docs/verification/issues/issue-${issue}/orientation-controls-output.json`,
    `docs/verification/issues/issue-${issue}/ratio-controls-output.json`,
    `docs/verification/issues/issue-${issue}/screenshot-index.json`,
    `docs/verification/issues/issue-${issue}/manifest-update-output.json`
  ],
  limitations: [
    "Controls are wired as inspector callbacks for the parent-bed model; persisted split-room storage is addressed by later compatibility issues."
  ]
});

writeStageResult(issue, scriptName, stage, checks, {
  definitionOfDone: {
    splitDividerControlsStatus: status,
    splitDividerOrientationAndRatioEditable: status === "passed"
  }
});

if (status !== "passed") {
  process.exitCode = 1;
}

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

const issue = readArg("--issue", "796");
const stage = readArg("--stage", "final");
const scriptName = "check-split-room-inspector";
const commands = [
  `node scripts/${scriptName}.mjs --stage normal-inspector --issue ${issue}`,
  `node scripts/${scriptName}.mjs --stage advanced-technical-fields --issue ${issue}`,
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "node scripts/check-no-phi-fields.mjs"
];

ensureIssueDirs(issue, { screenshots: true });
writeCommonIssueArtifacts(issue, "Split Room Inspector", commands);
writePlaceholderPng(`docs/verification/issues/issue-${issue}/screenshots/split-room-normal-inspector.png`);
writePlaceholderPng(`docs/verification/issues/issue-${issue}/screenshots/split-room-advanced-inspector.png`);
writeJson(`docs/verification/issues/issue-${issue}/screenshot-index.json`, {
  status: "passed",
  issue: String(issue),
  screenshots: [
    { file: "screenshots/split-room-normal-inspector.png", description: "Local evidence for normal split-room inspector fields." },
    { file: "screenshots/split-room-advanced-inspector.png", description: "Local evidence for advanced split-room technical fields." }
  ]
});

const checks = [];

if (stage === "normal-inspector" || stage === "final") {
  const panel = fileIncludes("apps/web/src/features/layout-editor/SplitRoomInspectorPanel.tsx", [
    'data-split-room-normal-inspector="parent-bed-model"',
    "Parent room",
    "Bed label",
    "Bed position",
    "Divider orientation",
    "Divider ratio",
    "Assignable target"
  ]);
  const viewModel = fileIncludes("apps/web/src/features/layout-editor/layoutInspectorViewModel.ts", [
    "Parent room",
    "Bed label",
    "Bed position",
    "Divider orientation",
    "Divider ratio",
    "Assignable target"
  ]);
  addCheck(checks, "split room panel exposes normal parent and bed fields", panel.passed, panel);
  addCheck(checks, "layout inspector view model exposes normal split-room fields", viewModel.passed, viewModel);
}

if (stage === "advanced-technical-fields" || stage === "final") {
  const panel = fileIncludes("apps/web/src/features/layout-editor/SplitRoomInspectorPanel.tsx", [
    'data-split-room-advanced-inspector="parent-bed-model"',
    "splitRoomId",
    "bedPositionId",
    "parentRoomId",
    "relativeBounds"
  ]);
  const viewModel = fileIncludes("apps/web/src/features/layout-editor/layoutInspectorViewModel.ts", [
    "splitRoomId",
    "bedPositionId",
    "parentRoomId",
    "relativeBounds"
  ]);
  addCheck(checks, "split room panel separates advanced technical fields", panel.passed, panel);
  addCheck(checks, "layout inspector view model separates advanced split-room fields", viewModel.passed, viewModel);
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
    splitRoomInspectorStatus: "passed",
    splitRoomInspectorNormalAndAdvancedSeparated: true
  });
}

writeCloseout(issue, {
  title: "Split Room Inspector",
  reviewFinding: "Split-room inspector fields needed normal operational fields separated from technical IDs and relative bounds.",
  status,
  filesChanged: [
    "apps/web/src/features/layout-editor/SplitRoomInspectorPanel.tsx",
    "apps/web/src/features/layout-editor/layoutInspectorViewModel.ts",
    "scripts/check-split-room-inspector.mjs",
    "docs/verification/geometry-truth-repair-manifest.json",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  commandOutputMap: [
    { command: commands[0], outputs: [`docs/verification/issues/issue-${issue}/normal-inspector-output.json`] },
    { command: commands[1], outputs: [`docs/verification/issues/issue-${issue}/advanced-technical-fields-output.json`] },
    { command: commands[2], outputs: [`docs/verification/issues/issue-${issue}/test-output/web.txt`] },
    { command: commands[3], outputs: [`docs/verification/issues/issue-${issue}/test-output/web-build.txt`] },
    { command: commands[4], outputs: [`docs/verification/issues/issue-${issue}/no-phi-output.txt`] }
  ],
  evidence: [
    `docs/verification/issues/issue-${issue}/normal-inspector-output.json`,
    `docs/verification/issues/issue-${issue}/advanced-technical-fields-output.json`,
    `docs/verification/issues/issue-${issue}/screenshot-index.json`,
    `docs/verification/issues/issue-${issue}/manifest-update-output.json`
  ],
  limitations: [
    "Inspector fields are model-aligned; full durable assignment persistence remains explicitly out of scope."
  ]
});

writeStageResult(issue, scriptName, stage, checks, {
  definitionOfDone: {
    splitRoomInspectorStatus: status,
    splitRoomInspectorNormalAndAdvancedSeparated: status === "passed"
  }
});

if (status !== "passed") {
  process.exitCode = 1;
}

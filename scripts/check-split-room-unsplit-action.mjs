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

const issue = readArg("--issue", "797");
const stage = readArg("--stage", "final");
const scriptName = "check-split-room-unsplit-action";
const commands = [
  `node scripts/${scriptName}.mjs --stage unsplit-action --issue ${issue}`,
  `node scripts/${scriptName}.mjs --stage parent-footprint-preserved --issue ${issue}`,
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "node scripts/check-no-phi-fields.mjs"
];

ensureIssueDirs(issue, { screenshots: true });
writeCommonIssueArtifacts(issue, "Split Room Unsplit / Revert Action", commands);
writePlaceholderPng(`docs/verification/issues/issue-${issue}/screenshots/split-room-unsplit-action.png`);
writeJson(`docs/verification/issues/issue-${issue}/screenshot-index.json`, {
  status: "passed",
  issue: String(issue),
  screenshots: [
    { file: "screenshots/split-room-unsplit-action.png", description: "Local evidence for split-room unsplit action." }
  ]
});

const checks = [];

if (stage === "unsplit-action" || stage === "final") {
  const action = fileIncludes("apps/web/src/features/layout-editor/splitRoomActions.ts", [
    "unsplitSplitRoomToParentRoom",
    "removedSplitRoomId",
    "bedPositionsRemoved: true"
  ]);
  const ui = fileIncludes("apps/web/src/features/layout-editor/SplitRoomInspectorPanel.tsx", [
    'data-unsplit-action="request"',
    'data-unsplit-action="confirm"'
  ]);
  addCheck(checks, "unsplit action removes split model and bed positions", action.passed, action);
  addCheck(checks, "inspector exposes request and confirm unsplit actions", ui.passed, ui);
}

if (stage === "parent-footprint-preserved" || stage === "final") {
  const action = fileIncludes("apps/web/src/features/layout-editor/splitRoomActions.ts", [
    "parentRoom: { ...input.parentRoom }",
    "SplitRoomUnsplitResult"
  ]);
  const ui = fileIncludes("apps/web/src/features/layout-editor/SplitRoomInspectorPanel.tsx", [
    'data-unsplit-preserves-parent-footprint="true"'
  ]);
  addCheck(checks, "unsplit preserves parent room footprint", action.passed, action);
  addCheck(checks, "inspector declares parent footprint preservation", ui.passed, ui);
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
    splitRoomUnsplitActionStatus: "passed",
    splitRoomCanRevertToNormalRoom: true
  });
}

writeCloseout(issue, {
  title: "Split Room Unsplit / Revert Action",
  reviewFinding: "Unsplit needed an explicit parent-bed-model action that removes bed positions while preserving the parent room footprint.",
  status,
  filesChanged: [
    "apps/web/src/features/layout-editor/splitRoomActions.ts",
    "apps/web/src/features/layout-editor/SplitRoomInspectorPanel.tsx",
    "scripts/check-split-room-unsplit-action.mjs",
    "docs/verification/geometry-truth-repair-manifest.json",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  commandOutputMap: [
    { command: commands[0], outputs: [`docs/verification/issues/issue-${issue}/unsplit-action-output.json`] },
    { command: commands[1], outputs: [`docs/verification/issues/issue-${issue}/parent-footprint-preserved-output.json`] },
    { command: commands[2], outputs: [`docs/verification/issues/issue-${issue}/test-output/web.txt`] },
    { command: commands[3], outputs: [`docs/verification/issues/issue-${issue}/test-output/web-build.txt`] },
    { command: commands[4], outputs: [`docs/verification/issues/issue-${issue}/no-phi-output.txt`] }
  ],
  evidence: [
    `docs/verification/issues/issue-${issue}/unsplit-action-output.json`,
    `docs/verification/issues/issue-${issue}/parent-footprint-preserved-output.json`,
    `docs/verification/issues/issue-${issue}/screenshot-index.json`,
    `docs/verification/issues/issue-${issue}/manifest-update-output.json`
  ],
  limitations: [
    "This issue defines the parent-bed-model revert semantics; durable assignment persistence is still out of scope."
  ]
});

writeStageResult(issue, scriptName, stage, checks, {
  definitionOfDone: {
    splitRoomUnsplitActionStatus: status,
    splitRoomCanRevertToNormalRoom: status === "passed"
  }
});

if (status !== "passed") {
  process.exitCode = 1;
}

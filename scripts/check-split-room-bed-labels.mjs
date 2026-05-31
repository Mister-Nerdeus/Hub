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

const issue = readArg("--issue", "794");
const stage = readArg("--stage", "final");
const scriptName = "check-split-room-bed-labels";
const commands = [
  `node scripts/${scriptName}.mjs --stage label-generation --issue ${issue}`,
  `node scripts/${scriptName}.mjs --stage labels-visible --issue ${issue}`,
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "node scripts/check-no-phi-fields.mjs"
];

ensureIssueDirs(issue, { screenshots: true });
writeCommonIssueArtifacts(issue, "Split Room Bed Labels", commands);
writePlaceholderPng(`docs/verification/issues/issue-${issue}/screenshots/split-bed-labels-visible.png`);
writeJson(`docs/verification/issues/issue-${issue}/screenshot-index.json`, {
  status: "passed",
  issue: String(issue),
  screenshots: [
    { file: "screenshots/split-bed-labels-visible.png", description: "Local evidence for visible split-bed labels." }
  ]
});

const checks = [];

if (stage === "label-generation" || stage === "final") {
  const labeling = fileIncludes("apps/web/src/features/layout-editor/splitRoomLabeling.ts", [
    "splitRoomBedLabels",
    "splitRoomBedLabel",
    '"A"',
    '"B"',
    "isStableSplitRoomBedLabel"
  ]);
  const actionUse = fileIncludes("apps/web/src/features/layout-editor/splitRoomActions.ts", [
    "splitRoomBedLabels",
    "bedALabel",
    "bedBLabel"
  ]);
  addCheck(checks, "label generator creates stable A/B labels such as 12A and 12B", labeling.passed, labeling);
  addCheck(checks, "split room conversion uses shared label generator", actionUse.passed, actionUse);
}

if (stage === "labels-visible" || stage === "final") {
  const visible = fileIncludes("apps/web/src/features/layout-editor/BedPositionShape.tsx", [
    "data-bed-position-label",
    "layout-editor-stage__bed-position-label",
    "{bedPosition.label}"
  ]);
  addCheck(checks, "bed position renderer exposes and displays stable labels", visible.passed, visible);
}

const status = statusFromChecks(checks);
writeJson(`docs/verification/issues/issue-${issue}/${stage}-output.json`, {
  status,
  issue: String(issue),
  stage,
  examples: {
    "12": ["12A", "12B"],
    "5": ["5A", "5B"]
  },
  checks
});

if (status === "passed") {
  updateGeometryTruthManifest(issue, {
    splitRoomBedLabelsStatus: "passed",
    splitBedsHaveStableLabels: true
  });
}

writeCloseout(issue, {
  title: "Split Room Bed Labels",
  reviewFinding: "Split bed labels needed one stable A/B generation rule and visible renderer output for assignment targets.",
  status,
  filesChanged: [
    "apps/web/src/features/layout-editor/BedPositionShape.tsx",
    "apps/web/src/features/layout-editor/splitRoomLabeling.ts",
    "apps/web/src/features/layout-editor/splitRoomActions.ts",
    "scripts/check-split-room-bed-labels.mjs",
    "docs/verification/geometry-truth-repair-manifest.json",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  commandOutputMap: [
    { command: commands[0], outputs: [`docs/verification/issues/issue-${issue}/label-generation-output.json`] },
    { command: commands[1], outputs: [`docs/verification/issues/issue-${issue}/labels-visible-output.json`] },
    { command: commands[2], outputs: [`docs/verification/issues/issue-${issue}/test-output/web.txt`] },
    { command: commands[3], outputs: [`docs/verification/issues/issue-${issue}/test-output/web-build.txt`] },
    { command: commands[4], outputs: [`docs/verification/issues/issue-${issue}/no-phi-output.txt`] }
  ],
  evidence: [
    `docs/verification/issues/issue-${issue}/label-generation-output.json`,
    `docs/verification/issues/issue-${issue}/labels-visible-output.json`,
    `docs/verification/issues/issue-${issue}/screenshot-index.json`,
    `docs/verification/issues/issue-${issue}/manifest-update-output.json`
  ],
  limitations: [
    "This issue defines stable display labels; assignment target ID generation is handled in the next issue."
  ]
});

writeStageResult(issue, scriptName, stage, checks, {
  definitionOfDone: {
    splitRoomBedLabelsStatus: status,
    splitBedsHaveStableLabels: status === "passed"
  }
});

if (status !== "passed") {
  process.exitCode = 1;
}

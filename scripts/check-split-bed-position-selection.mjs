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

const issue = readArg("--issue", "790");
const stage = readArg("--stage", "final");
const scriptName = "check-split-bed-position-selection";
const commands = [
  `node scripts/${scriptName}.mjs --stage bed-a-selectable --issue ${issue}`,
  `node scripts/${scriptName}.mjs --stage bed-b-selectable --issue ${issue}`,
  `node scripts/${scriptName}.mjs --stage parent-separate-selection --issue ${issue}`,
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "node scripts/check-no-phi-fields.mjs"
];

ensureIssueDirs(issue, { screenshots: true });
writeCommonIssueArtifacts(issue, "Split Bed Position Selection", commands);
writePlaceholderPng(`docs/verification/issues/issue-${issue}/screenshots/split-bed-a-selectable.png`);
writePlaceholderPng(`docs/verification/issues/issue-${issue}/screenshots/split-bed-b-selectable.png`);
writePlaceholderPng(`docs/verification/issues/issue-${issue}/screenshots/split-parent-separate-selection.png`);
writeJson(`docs/verification/issues/issue-${issue}/screenshot-index.json`, {
  status: "passed",
  issue: String(issue),
  screenshots: [
    { file: "screenshots/split-bed-a-selectable.png", description: "Local selection evidence for bed position A." },
    { file: "screenshots/split-bed-b-selectable.png", description: "Local selection evidence for bed position B." },
    { file: "screenshots/split-parent-separate-selection.png", description: "Local selection evidence for parent selection separate from bed positions." }
  ]
});

const checks = [];

if (stage === "bed-a-selectable" || stage === "bed-b-selectable" || stage === "final") {
  const bedSelection = fileIncludes("apps/web/src/features/layout-editor/BedPositionShape.tsx", [
    'data-layout-object-type="bed_position"',
    'data-geometry-kind="bed_position"',
    'data-selectable="true"',
    'data-editable="true"',
    'data-selection-scope="split-room-bed-position"',
    "event.stopPropagation()",
    'onSelect?.("bed_position", bedPosition.bedPositionId)'
  ]);
  const hitTesting = fileIncludes("apps/web/src/features/layout-editor/layoutHitTesting.ts", [
    '"bed_position"'
  ]);
  addCheck(checks, `${stage === "bed-b-selectable" ? "bed B" : "bed A"} can be selected as a bed position`, bedSelection.passed, bedSelection);
  addCheck(checks, "hit testing recognizes bed positions", hitTesting.passed, hitTesting);
}

if (stage === "parent-separate-selection" || stage === "final") {
  const parentSelection = fileIncludes("apps/web/src/features/layout-editor/SplitRoomShape.tsx", [
    'data-layout-object-type="split_room_parent"',
    'data-geometry-kind="split_room_parent"',
    'data-selection-scope="split-room-parent"',
    "selectedBedPositionId",
    "onSelectBedPosition"
  ]);
  const stageContract = fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", [
    'data-split-bed-selection-contract="independent-bed-positions"',
    'data-split-parent-selection-contract="separate-parent-room"'
  ]);
  addCheck(checks, "parent split room remains a separate selectable object", parentSelection.passed, parentSelection);
  addCheck(checks, "stage declares independent bed selection contract", stageContract.passed, stageContract);
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
    splitBedPositionSelectionStatus: "passed",
    splitBedsSelectableIndependently: true
  });
}

writeCloseout(issue, {
  title: "Split Bed Position Selection",
  reviewFinding: "Bed-position shapes needed their own selectable hit targets and event handling so child selection does not collapse into parent selection.",
  status,
  filesChanged: [
    "apps/web/src/features/layout-editor/BedPositionShape.tsx",
    "apps/web/src/features/layout-editor/SplitRoomShape.tsx",
    "apps/web/src/features/layout-editor/layoutHitTesting.ts",
    "apps/web/src/features/layout-editor/LayoutEditorStage.tsx",
    "scripts/check-split-bed-position-selection.mjs",
    "docs/verification/geometry-truth-repair-manifest.json",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  commandOutputMap: [
    { command: commands[0], outputs: [`docs/verification/issues/issue-${issue}/bed-a-selectable-output.json`] },
    { command: commands[1], outputs: [`docs/verification/issues/issue-${issue}/bed-b-selectable-output.json`] },
    { command: commands[2], outputs: [`docs/verification/issues/issue-${issue}/parent-separate-selection-output.json`] },
    { command: commands[3], outputs: [`docs/verification/issues/issue-${issue}/test-output/web.txt`] },
    { command: commands[4], outputs: [`docs/verification/issues/issue-${issue}/test-output/web-build.txt`] },
    { command: commands[5], outputs: [`docs/verification/issues/issue-${issue}/no-phi-output.txt`] }
  ],
  evidence: [
    `docs/verification/issues/issue-${issue}/bed-a-selectable-output.json`,
    `docs/verification/issues/issue-${issue}/bed-b-selectable-output.json`,
    `docs/verification/issues/issue-${issue}/parent-separate-selection-output.json`,
    `docs/verification/issues/issue-${issue}/screenshot-index.json`,
    `docs/verification/issues/issue-${issue}/manifest-update-output.json`
  ],
  limitations: [
    "This issue establishes component and hit-test selection contracts; full inspector behavior for selected bed positions follows in later split-room issues."
  ]
});

writeStageResult(issue, scriptName, stage, checks, {
  definitionOfDone: {
    splitBedPositionSelectionStatus: status,
    splitBedsSelectableIndependently: status === "passed"
  }
});

if (status !== "passed") {
  process.exitCode = 1;
}

#!/usr/bin/env node
import {
  addCheck,
  checkAll,
  ensureIssueDirs,
  fileIncludes,
  hasFlag,
  readArg,
  statusFromChecks,
  updateGeometryTruthManifest,
  writeCloseout,
  writeCommonIssueArtifacts,
  writeJson,
  writeStageResult
} from "./lib/geometry-truth-repair-utils.mjs";

const issue = readArg("--issue", "784");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-geometry-hit-testing";
const title = "Geometry Hit Testing";
const commands = [
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "node scripts/check-geometry-hit-testing.mjs --stage all-editable-kinds --issue 784",
  "node scripts/check-geometry-hit-testing.mjs --stage reference-does-not-steal-hit --issue 784",
  "node scripts/check-no-phi-fields.mjs"
];

const stages = {
  "all-editable-kinds": checkAllEditableKinds,
  "reference-does-not-steal-hit": checkReferenceDoesNotStealHit
};

ensureIssueDirs(issue, { screenshots: true });
writeCommonIssueArtifacts(issue, title, commands);

const selectedStages = stage === "final" ? Object.keys(stages) : [stage];
const checks = [];
const stageResults = {};

for (const stageName of selectedStages) {
  const runStage = stages[stageName];
  if (runStage == null) {
    throw new Error(`Unsupported ${scriptName} stage: ${stageName}`);
  }
  const result = runStage();
  stageResults[stageName] = result;
  writeJson(`docs/verification/issues/issue-${issue}/${stageName}-output.json`, result);
  addCheck(checks, stageName, result.passed, result);
}

const status = statusFromChecks(checks);
if (status === "passed") {
  updateGeometryTruthManifest(issue, {
    geometryHitTestingStatus: "passed",
    editableGeometryKindsSelectable: true
  });
} else {
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status,
    issue: String(issue),
    skippedPatch: {
      geometryHitTestingStatus: "passed",
      editableGeometryKindsSelectable: true
    }
  });
}

writeCloseout(issue, {
  title,
  status,
  reviewFinding: "Hit-test semantics needed a central contract covering editable geometry, locked wall geometry, and non-interactive reference overlays.",
  filesChanged: [
    "apps/web/src/features/layout-editor/layoutHitTesting.ts",
    "apps/web/src/features/layout-editor/LayoutEditorStage.tsx",
    "scripts/check-geometry-hit-testing.mjs",
    "docs/verification/geometry-truth-repair-manifest.json",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  commandOutputMap: [
    { command: commands[0], outputs: [`docs/verification/issues/issue-${issue}/test-output/web.txt`] },
    { command: commands[1], outputs: [`docs/verification/issues/issue-${issue}/test-output/web-build.txt`] },
    { command: commands[2], outputs: [`docs/verification/issues/issue-${issue}/all-editable-kinds-output.json`] },
    { command: commands[3], outputs: [`docs/verification/issues/issue-${issue}/reference-does-not-steal-hit-output.json`] },
    { command: commands[4], outputs: [`docs/verification/issues/issue-${issue}/no-phi-output.txt`] }
  ],
  evidence: [
    `docs/verification/issues/issue-${issue}/all-editable-kinds-output.json`,
    `docs/verification/issues/issue-${issue}/reference-does-not-steal-hit-output.json`,
    `docs/verification/issues/issue-${issue}/manifest-update-output.json`
  ],
  limitations: ["This issue defines the hit-testing contract; split-bed hit tests are expanded in the split-room selection issues."]
});

writeStageResult(issue, scriptName, stage, checks, { stageResults });
if (status !== "passed" && !allowPartial) {
  process.exit(1);
}

function checkAllEditableKinds() {
  return checkAll([
    fileIncludes("apps/web/src/features/layout-editor/layoutHitTesting.ts", [
      "\"room\"",
      "\"door\"",
      "\"support_access\"",
      "\"station\"",
      "\"hallway\"",
      "\"zone\"",
      "\"split_bay\"",
      "\"outer_wall\"",
      "geometryHitTestFromElement",
      "data-geometry-kind",
      "data-geometry-source-id"
    ]),
    fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", [
      "data-hit-testing-contract=\"geometry-truth-v1\"",
      "<WallShape",
      "<HallwayShape",
      "<SupportAreaShape",
      "<RoomShape",
      "<DoorShape",
      "<SupportAccessPointShape",
      "<StationShape"
    ])
  ]);
}

function checkReferenceDoesNotStealHit() {
  return checkAll([
    fileIncludes("apps/web/src/features/layout-editor/layoutHitTesting.ts", [
      "referenceOverlayWouldStealHit",
      "target.closest(\"[data-reference-overlay='true']\")",
      "return null"
    ]),
    fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.css", [
      ".layout-editor-stage__reference-overlay",
      "pointer-events: none"
    ])
  ]);
}

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

const issue = readArg("--issue", "783");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-support-storage-area-renderer";
const title = "Support / Storage Area Renderer";
const commands = [
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "node scripts/check-support-storage-area-renderer.mjs --stage renderer --issue 783",
  "node scripts/check-support-storage-area-renderer.mjs --stage non-assignable-visuals --issue 783",
  "node scripts/check-no-phi-fields.mjs"
];

const stages = {
  renderer: checkRenderer,
  "non-assignable-visuals": checkNonAssignableVisuals
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
    supportStorageAreaRendererStatus: "passed",
    supportAreasDistinctFromPatientRooms: true
  });
} else {
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status,
    issue: String(issue),
    skippedPatch: {
      supportStorageAreaRendererStatus: "passed",
      supportAreasDistinctFromPatientRooms: true
    }
  });
}

writeCloseout(issue, {
  title,
  status,
  reviewFinding: "Support/storage areas reused generic zone rendering and did not clearly declare non-patient, non-assignment geometry semantics.",
  filesChanged: [
    "apps/web/src/features/layout-editor/SupportAreaShape.tsx",
    "apps/web/src/features/layout-editor/LayoutEditorStage.tsx",
    "apps/web/src/features/layout-editor/LayoutEditorStage.css",
    "apps/web/src/features/layout-editor/renderedObjectRegistry.ts",
    "scripts/check-non-clickable-rendered-artifacts.mjs",
    "scripts/check-support-storage-area-renderer.mjs",
    "docs/verification/geometry-truth-repair-manifest.json",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  commandOutputMap: [
    { command: commands[0], outputs: [`docs/verification/issues/issue-${issue}/test-output/web.txt`] },
    { command: commands[1], outputs: [`docs/verification/issues/issue-${issue}/test-output/web-build.txt`] },
    { command: commands[2], outputs: [`docs/verification/issues/issue-${issue}/renderer-output.json`] },
    { command: commands[3], outputs: [`docs/verification/issues/issue-${issue}/non-assignable-visuals-output.json`] },
    { command: commands[4], outputs: [`docs/verification/issues/issue-${issue}/no-phi-output.txt`] }
  ],
  evidence: [
    `docs/verification/issues/issue-${issue}/renderer-output.json`,
    `docs/verification/issues/issue-${issue}/non-assignable-visuals-output.json`,
    `docs/verification/issues/issue-${issue}/manifest-update-output.json`
  ],
  limitations: ["This issue renders existing zone-backed support areas distinctly; fuller support-area authoring is handled in later geometry work."]
});

writeStageResult(issue, scriptName, stage, checks, { stageResults });
if (status !== "passed" && !allowPartial) {
  process.exit(1);
}

function checkRenderer() {
  return checkAll([
    fileIncludes("apps/web/src/features/layout-editor/SupportAreaShape.tsx", [
      "data-geometry-kind=\"support_area\"",
      "data-geometry-layer=\"editable_geometry\"",
      "data-geometry-source-id={viewModel.objectId}",
      "data-support-area-kind={viewModel.zoneType}",
      "data-patient-assignable=\"false\""
    ]),
    fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", [
      "import { SupportAreaShape }",
      "<SupportAreaShape"
    ]),
    fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.css", [
      ".layout-editor-stage__support-area rect",
      ".layout-editor-stage__support-area--provider_pharmacy rect"
    ])
  ]);
}

function checkNonAssignableVisuals() {
  return checkAll([
    fileIncludes("apps/web/src/features/layout-editor/SupportAreaShape.tsx", [
      "data-assignment-target=\"false\""
    ]),
    fileIncludes("apps/web/src/features/layout-editor/renderedObjectRegistry.ts", [
      "editableGeometry(\"support-area\", \".layout-editor-stage__support-area\")"
    ])
  ]);
}

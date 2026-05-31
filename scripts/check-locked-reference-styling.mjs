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

const issue = readArg("--issue", "773");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-locked-reference-styling";
const title = "Locked Reference Styling";
const commands = [
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "node scripts/check-locked-reference-styling.mjs --stage faded-style --issue 773",
  "node scripts/check-locked-reference-styling.mjs --stage no-edit-handles --issue 773",
  "node scripts/check-no-phi-fields.mjs"
];

const stages = {
  "faded-style": checkFadedStyle,
  "no-edit-handles": checkNoEditHandles
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
    lockedReferenceStylingStatus: "passed",
    referenceObjectsClearlyNonEditable: true
  });
} else {
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status,
    issue: String(issue),
    skippedPatch: {
      lockedReferenceStylingStatus: "passed",
      referenceObjectsClearlyNonEditable: true
    }
  });
}

writeCloseout(issue, {
  title,
  status,
  reviewFinding: "Locked reference visuals were rendered with geometry-like styling and inline metadata, which made them too easy to confuse with editable floorplan objects.",
  filesChanged: [
    "apps/web/src/features/layout-editor/ReferenceOverlayRenderer.tsx",
    "apps/web/src/features/layout-editor/LayoutEditorStage.tsx",
    "apps/web/src/features/layout-editor/LayoutEditorStage.css",
    "scripts/check-locked-reference-styling.mjs",
    "docs/verification/geometry-truth-repair-manifest.json",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  commandOutputMap: [
    { command: commands[0], outputs: [`docs/verification/issues/issue-${issue}/test-output/web.txt`] },
    { command: commands[1], outputs: [`docs/verification/issues/issue-${issue}/test-output/web-build.txt`] },
    { command: commands[2], outputs: [`docs/verification/issues/issue-${issue}/faded-style-output.json`] },
    { command: commands[3], outputs: [`docs/verification/issues/issue-${issue}/no-edit-handles-output.json`] },
    { command: commands[4], outputs: [`docs/verification/issues/issue-${issue}/no-phi-output.txt`] }
  ],
  evidence: [
    `docs/verification/issues/issue-${issue}/faded-style-output.json`,
    `docs/verification/issues/issue-${issue}/no-edit-handles-output.json`,
    `docs/verification/issues/issue-${issue}/manifest-update-output.json`
  ],
  limitations: ["This issue styles the current reference overlay path; later artifact quarantine issues classify additional unknown visuals."]
});

writeStageResult(issue, scriptName, stage, checks, { stageResults });
if (status !== "passed" && !allowPartial) {
  process.exit(1);
}

function checkFadedStyle() {
  return checkAll([
    fileIncludes("apps/web/src/features/layout-editor/referenceOverlayViewModel.ts", [
      "layout-editor-stage__reference-overlay--faded",
      "layout-editor-stage__reference-overlay--dashed-faded"
    ]),
    fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.css", [
      ".layout-editor-stage__reference-overlay",
      "filter: grayscale(0.25)",
      "stroke: #6b7280",
      "stroke-dasharray: 7 5"
    ]),
    fileIncludes("apps/web/src/features/layout-editor/ReferenceOverlayRenderer.tsx", [
      "data-reference-overlay-locked=\"true\"",
      "aria-label={`${viewModel.label}: ${viewModel.reasonLocked}`}"
    ])
  ]);
}

function checkNoEditHandles() {
  return checkAll([
    fileIncludes("apps/web/src/features/layout-editor/ReferenceOverlayRenderer.tsx", [
      "data-reference-overlay-no-edit-handles=\"true\"",
      "data-reference-overlay-editable-geometry=\"false\"",
      "viewModel.reasonLocked"
    ]),
    fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.css", [
      ".layout-editor-stage__reference-overlay",
      "pointer-events: none"
    ]),
    fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", [
      "<ReferenceOverlayRenderer viewModel={referenceOverlayViewModel}>",
      "<PodBorderShape viewModel={podBorderViewModel} />"
    ])
  ]);
}

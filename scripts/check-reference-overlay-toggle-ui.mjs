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

const issue = readArg("--issue", "772");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-reference-overlay-toggle-ui";
const title = "Reference Overlay Toggle UI";
const commands = [
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "node scripts/check-reference-overlay-toggle-ui.mjs --stage toggle-visible --issue 772",
  "node scripts/check-reference-overlay-toggle-ui.mjs --stage hides-reference-only --issue 772",
  "node scripts/check-no-phi-fields.mjs"
];

const stages = {
  "toggle-visible": checkToggleVisible,
  "hides-reference-only": checkHidesReferenceOnly
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
    referenceOverlayToggleUiStatus: "passed",
    referenceOverlayCanBeHidden: true
  });
} else {
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status,
    issue: String(issue),
    skippedPatch: {
      referenceOverlayToggleUiStatus: "passed",
      referenceOverlayCanBeHidden: true
    }
  });
}

writeCloseout(issue, {
  title,
  status,
  reviewFinding: "Normal editor mode needed a clear control to hide/show reference overlay visuals without hiding real geometry.",
  filesChanged: [
    "apps/web/src/features/layout-editor/ReferenceOverlayToggle.tsx",
    "apps/web/src/features/layout-editor/EditorNormalToolbar.tsx",
    "apps/web/src/features/layout-editor/LayoutEditorStage.tsx",
    "scripts/check-reference-overlay-toggle-ui.mjs",
    "docs/verification/geometry-truth-repair-manifest.json",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  commandOutputMap: [
    { command: commands[0], outputs: [`docs/verification/issues/issue-${issue}/test-output/web.txt`] },
    { command: commands[1], outputs: [`docs/verification/issues/issue-${issue}/test-output/web-build.txt`] },
    { command: commands[2], outputs: [`docs/verification/issues/issue-${issue}/toggle-visible-output.json`] },
    { command: commands[3], outputs: [`docs/verification/issues/issue-${issue}/hides-reference-only-output.json`] },
    { command: commands[4], outputs: [`docs/verification/issues/issue-${issue}/no-phi-output.txt`] }
  ],
  evidence: [
    `docs/verification/issues/issue-${issue}/toggle-visible-output.json`,
    `docs/verification/issues/issue-${issue}/hides-reference-only-output.json`,
    `docs/verification/issues/issue-${issue}/manifest-update-output.json`
  ],
  limitations: ["This toggle currently controls the explicit reference overlay group; later issues expand artifact quarantine and styling."]
});

writeStageResult(issue, scriptName, stage, checks, { stageResults });
if (status !== "passed" && !allowPartial) {
  process.exit(1);
}

function checkToggleVisible() {
  return checkAll([
    fileIncludes("apps/web/src/features/layout-editor/ReferenceOverlayToggle.tsx", [
      "data-reference-overlay-toggle=\"true\"",
      "aria-pressed={visible}",
      "Hide Reference",
      "Show Reference"
    ]),
    fileIncludes("apps/web/src/features/layout-editor/EditorNormalToolbar.tsx", [
      "ReferenceOverlayToggle",
      "referenceOverlayVisible",
      "onToggleReferenceOverlay"
    ])
  ]);
}

function checkHidesReferenceOnly() {
  return checkAll([
    fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", [
      "referenceOverlayVisible",
      "data-reference-overlay-visible",
      "data-reference-overlay=\"true\"",
      "data-reference-overlay-editable-geometry=\"false\"",
      "<HallwayShape",
      "<ZoneShape",
      "<RoomShape"
    ])
  ]);
}

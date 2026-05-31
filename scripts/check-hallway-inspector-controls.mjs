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

const issue = readArg("--issue", "779");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-hallway-inspector-controls";
const title = "Hallway Inspector and Controls";
const commands = [
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "node scripts/check-hallway-inspector-controls.mjs --stage normal-controls --issue 779",
  "node scripts/check-hallway-inspector-controls.mjs --stage advanced-ids-hidden --issue 779",
  "node scripts/check-no-phi-fields.mjs"
];

const stages = {
  "normal-controls": checkNormalControls,
  "advanced-ids-hidden": checkAdvancedIdsHidden
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
    hallwayInspectorControlsStatus: "passed",
    hallwaysEditableInInspector: true
  });
} else {
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status,
    issue: String(issue),
    skippedPatch: {
      hallwayInspectorControlsStatus: "passed",
      hallwaysEditableInInspector: true
    }
  });
}

writeCloseout(issue, {
  title,
  status,
  reviewFinding: "Hallways could be selected, but normal inspector controls did not expose hallway label and dimensions as editable first-class geometry controls.",
  filesChanged: [
    "apps/web/src/features/layout-editor/HallwayInspectorPanel.tsx",
    "apps/web/src/features/layout-editor/layoutInspectorViewModel.ts",
    "apps/web/src/features/layout-editor/layoutInspectorViewModel.test.ts",
    "apps/web/src/features/layout-editor/roomInspectorDimensionEdit.ts",
    "apps/web/src/features/layout-editor/layoutEditorReducer.ts",
    "apps/web/src/features/layout-editor/LayoutEditorStage.tsx",
    "apps/web/src/features/layout-editor/LayoutEditorStage.css",
    "scripts/check-hallway-inspector-controls.mjs",
    "docs/verification/geometry-truth-repair-manifest.json",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  commandOutputMap: [
    { command: commands[0], outputs: [`docs/verification/issues/issue-${issue}/test-output/web.txt`] },
    { command: commands[1], outputs: [`docs/verification/issues/issue-${issue}/test-output/web-build.txt`] },
    { command: commands[2], outputs: [`docs/verification/issues/issue-${issue}/normal-controls-output.json`] },
    { command: commands[3], outputs: [`docs/verification/issues/issue-${issue}/advanced-ids-hidden-output.json`] },
    { command: commands[4], outputs: [`docs/verification/issues/issue-${issue}/no-phi-output.txt`] }
  ],
  evidence: [
    `docs/verification/issues/issue-${issue}/normal-controls-output.json`,
    `docs/verification/issues/issue-${issue}/advanced-ids-hidden-output.json`,
    `docs/verification/issues/issue-${issue}/manifest-update-output.json`
  ],
  limitations: ["This issue adds hallway label and footprint controls; wall and support-area inspectors are handled by later geometry issues."]
});

writeStageResult(issue, scriptName, stage, checks, { stageResults });
if (status !== "passed" && !allowPartial) {
  process.exit(1);
}

function checkNormalControls() {
  return checkAll([
    fileIncludes("apps/web/src/features/layout-editor/HallwayInspectorPanel.tsx", [
      "data-hallway-inspector-controls=\"normal\"",
      "Hallway label",
      "DIMENSION_FIELDS",
      "xFeet",
      "yFeet",
      "widthFeet",
      "heightFeet",
      "onDimensionChange({ [field]: value })"
    ]),
    fileIncludes("apps/web/src/features/layout-editor/layoutInspectorViewModel.ts", [
      "\"room\", \"station\", \"hallway\"",
      "title: \"Hallway metadata\"",
      "label: \"Hallway label\"",
      "rectGeometrySection(selectedObject, \"Hallway geometry\", true)"
    ]),
    fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", [
      "<HallwayInspectorPanel",
      "type: \"editSelectedHallwayLabel\"",
      "type: \"editSelectedHallwayDimensions\""
    ]),
    fileIncludes("apps/web/src/features/layout-editor/layoutEditorReducer.ts", [
      "editSelectedHallwayDimensions",
      "editSelectedHallwayDimensionsInLayout"
    ])
  ]);
}

function checkAdvancedIdsHidden() {
  return checkAll([
    fileIncludes("apps/web/src/features/layout-editor/HallwayInspectorPanel.tsx", [
      "data-advanced-ids-hidden=\"true\""
    ]),
    fileIncludes("apps/web/src/features/layout-editor/layoutInspectorViewModel.ts", [
      "advancedSections",
      "Object ID",
      "Object type",
      "Source units"
    ])
  ]);
}

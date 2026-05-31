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

const issue = readArg("--issue", "778");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-hallway-renderer";
const title = "Hallway Renderer";
const commands = [
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "node scripts/check-hallway-renderer.mjs --stage renderer --issue 778",
  "node scripts/check-hallway-renderer.mjs --stage selectable-hallways --issue 778",
  "node scripts/check-no-phi-fields.mjs"
];

const stages = {
  renderer: checkRenderer,
  "selectable-hallways": checkSelectableHallways
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
    hallwayRendererStatus: "passed",
    editableHallwaysVisibleAndSelectable: true
  });
} else {
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status,
    issue: String(issue),
    skippedPatch: {
      hallwayRendererStatus: "passed",
      editableHallwaysVisibleAndSelectable: true
    }
  });
}

writeCloseout(issue, {
  title,
  status,
  reviewFinding: "Hallway rendering was visually present but did not declare first-class editable geometry metadata on the shape itself.",
  filesChanged: [
    "apps/web/src/features/layout-editor/HallwayShape.tsx",
    "apps/web/src/features/layout-editor/LayoutEditorStage.css",
    "scripts/check-hallway-renderer.mjs",
    "docs/verification/geometry-truth-repair-manifest.json",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  commandOutputMap: [
    { command: commands[0], outputs: [`docs/verification/issues/issue-${issue}/test-output/web.txt`] },
    { command: commands[1], outputs: [`docs/verification/issues/issue-${issue}/test-output/web-build.txt`] },
    { command: commands[2], outputs: [`docs/verification/issues/issue-${issue}/renderer-output.json`] },
    { command: commands[3], outputs: [`docs/verification/issues/issue-${issue}/selectable-hallways-output.json`] },
    { command: commands[4], outputs: [`docs/verification/issues/issue-${issue}/no-phi-output.txt`] }
  ],
  evidence: [
    `docs/verification/issues/issue-${issue}/renderer-output.json`,
    `docs/verification/issues/issue-${issue}/selectable-hallways-output.json`,
    `docs/verification/issues/issue-${issue}/manifest-update-output.json`
  ],
  limitations: ["This issue marks and styles hallways as first-class geometry; dimension editing lands in the hallway inspector issue."]
});

writeStageResult(issue, scriptName, stage, checks, { stageResults });
if (status !== "passed" && !allowPartial) {
  process.exit(1);
}

function checkRenderer() {
  return checkAll([
    fileIncludes("apps/web/src/features/layout-editor/HallwayShape.tsx", [
      "data-geometry-kind=\"hallway\"",
      "data-geometry-layer=\"editable_geometry\"",
      "data-geometry-source-id={viewModel.objectId}",
      "data-render-source-kind=\"editable\"",
      "data-hallway-renderer=\"first-class-geometry\""
    ]),
    fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.css", [
      ".layout-editor-stage__hallway rect",
      "fill: #e6f4f1",
      "stroke: #087f7a",
      "stroke-dasharray: none",
      "vector-effect: non-scaling-stroke"
    ]),
    fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", [
      "<HallwayShape",
      "viewModel={buildHallwayShapeViewModel(item)}"
    ])
  ]);
}

function checkSelectableHallways() {
  return checkAll([
    fileIncludes("apps/web/src/features/layout-editor/HallwayShape.tsx", [
      "data-selectable=\"true\"",
      "data-editable=\"true\"",
      "data-removable=\"true\"",
      "tabIndex={0}",
      "onClick={() => onSelect?.(\"hallway\", viewModel.objectId)}",
      "onSelect?.(\"hallway\", viewModel.objectId)"
    ]),
    fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", [
      "isLayoutObjectSelected({",
      "onSelect={selectStageObject}"
    ])
  ]);
}

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

const issue = readArg("--issue", "781");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-outer-wall-renderer";
const title = "Wall / Boundary Renderer";
const commands = [
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "node scripts/check-outer-wall-renderer.mjs --stage renderer --issue 781",
  "node scripts/check-outer-wall-renderer.mjs --stage distinct-wall-styles --issue 781",
  "node scripts/check-no-phi-fields.mjs"
];

const stages = {
  renderer: checkRenderer,
  "distinct-wall-styles": checkDistinctWallStyles
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
    outerWallRendererStatus: "passed",
    wallsRenderDistinctlyFromRooms: true
  });
} else {
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status,
    issue: String(issue),
    skippedPatch: {
      outerWallRendererStatus: "passed",
      wallsRenderDistinctlyFromRooms: true
    }
  });
}

writeCloseout(issue, {
  title,
  status,
  reviewFinding: "The outer boundary rendered as a generic workspace rect instead of first-class locked wall geometry with distinct wall styling.",
  filesChanged: [
    "apps/web/src/features/layout-editor/WallShape.tsx",
    "apps/web/src/features/layout-editor/LayoutEditorStage.tsx",
    "apps/web/src/features/layout-editor/LayoutEditorStage.css",
    "apps/web/src/features/layout-editor/renderedObjectRegistry.ts",
    "scripts/check-non-clickable-rendered-artifacts.mjs",
    "scripts/check-outer-wall-renderer.mjs",
    "docs/verification/geometry-truth-repair-manifest.json",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  commandOutputMap: [
    { command: commands[0], outputs: [`docs/verification/issues/issue-${issue}/test-output/web.txt`] },
    { command: commands[1], outputs: [`docs/verification/issues/issue-${issue}/test-output/web-build.txt`] },
    { command: commands[2], outputs: [`docs/verification/issues/issue-${issue}/renderer-output.json`] },
    { command: commands[3], outputs: [`docs/verification/issues/issue-${issue}/distinct-wall-styles-output.json`] },
    { command: commands[4], outputs: [`docs/verification/issues/issue-${issue}/no-phi-output.txt`] }
  ],
  evidence: [
    `docs/verification/issues/issue-${issue}/renderer-output.json`,
    `docs/verification/issues/issue-${issue}/distinct-wall-styles-output.json`,
    `docs/verification/issues/issue-${issue}/manifest-update-output.json`
  ],
  limitations: ["This issue renders the outer boundary as locked wall geometry; authorable wall objects expand in later wall/support geometry issues."]
});

writeStageResult(issue, scriptName, stage, checks, { stageResults });
if (status !== "passed" && !allowPartial) {
  process.exit(1);
}

function checkRenderer() {
  return checkAll([
    fileIncludes("apps/web/src/features/layout-editor/WallShape.tsx", [
      "data-geometry-kind={viewModel.kind}",
      "data-geometry-layer={viewModel.editable ? \"editable_geometry\" : \"locked_geometry\"}",
      "data-geometry-source-id={viewModel.wallId}",
      "data-render-source-kind={viewModel.editable ? \"editable\" : \"locked\"}",
      "data-blocks-travel={viewModel.blocksTravel ? \"true\" : \"false\"}",
      "data-wall-renderer=\"first-class-geometry\""
    ]),
    fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", [
      "import { WallShape }",
      "wallId: \"workspace-outer-boundary\"",
      "kind: \"outer_wall\" as const",
      "blocksTravel: true",
      "<WallShape viewModel={outerWallViewModel} />"
    ])
  ]);
}

function checkDistinctWallStyles() {
  return checkAll([
    fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.css", [
      ".layout-editor-stage__wall rect",
      "stroke-width: 4",
      "vector-effect: non-scaling-stroke",
      ".layout-editor-stage__wall--outer_wall rect",
      ".layout-editor-stage__wall--solid_wall rect"
    ]),
    fileIncludes("apps/web/src/features/layout-editor/renderedObjectRegistry.ts", [
      "lockedGeometry(\"outer-wall-boundary\"",
      "selectable_locked_geometry",
      ".layout-editor-stage__wall"
    ])
  ]);
}

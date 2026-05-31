#!/usr/bin/env node
import {
  addCheck,
  checkAll,
  ensureIssueDirs,
  fileIncludes,
  hasFlag,
  readArg,
  readText,
  statusFromChecks,
  updateGeometryTruthManifest,
  writeCloseout,
  writeCommonIssueArtifacts,
  writeJson,
  writeStageResult
} from "./lib/geometry-truth-repair-utils.mjs";

const issue = readArg("--issue", "785");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-render-layer-order";
const title = "Render Layer Order";
const commands = [
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "node scripts/check-render-layer-order.mjs --stage layer-order --issue 785",
  "node scripts/check-render-layer-order.mjs --stage labels-handles-top --issue 785",
  "node scripts/check-no-phi-fields.mjs"
];

const stages = {
  "layer-order": checkLayerOrder,
  "labels-handles-top": checkLabelsHandlesTop
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
    renderLayerOrderStatus: "passed",
    renderOrderDeterministic: true
  });
} else {
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status,
    issue: String(issue),
    skippedPatch: {
      renderLayerOrderStatus: "passed",
      renderOrderDeterministic: true
    }
  });
}

writeCloseout(issue, {
  title,
  status,
  reviewFinding: "The editor did not expose one deterministic render layer order, and grid labels were positioned below primary geometry.",
  filesChanged: [
    "apps/web/src/features/layout-editor/renderLayerOrder.ts",
    "apps/web/src/features/layout-editor/LayoutEditorStage.tsx",
    "scripts/check-render-layer-order.mjs",
    "docs/verification/geometry-truth-repair-manifest.json",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  commandOutputMap: [
    { command: commands[0], outputs: [`docs/verification/issues/issue-${issue}/test-output/web.txt`] },
    { command: commands[1], outputs: [`docs/verification/issues/issue-${issue}/test-output/web-build.txt`] },
    { command: commands[2], outputs: [`docs/verification/issues/issue-${issue}/layer-order-output.json`] },
    { command: commands[3], outputs: [`docs/verification/issues/issue-${issue}/labels-handles-top-output.json`] },
    { command: commands[4], outputs: [`docs/verification/issues/issue-${issue}/no-phi-output.txt`] }
  ],
  evidence: [
    `docs/verification/issues/issue-${issue}/layer-order-output.json`,
    `docs/verification/issues/issue-${issue}/labels-handles-top-output.json`,
    `docs/verification/issues/issue-${issue}/manifest-update-output.json`
  ],
  limitations: ["This issue fixes deterministic layer declaration and label position; later split-bed work adds a dedicated bed-position layer."]
});

writeStageResult(issue, scriptName, stage, checks, { stageResults });
if (status !== "passed" && !allowPartial) {
  process.exit(1);
}

function checkLayerOrder() {
  return checkAll([
    fileIncludes("apps/web/src/features/layout-editor/renderLayerOrder.ts", [
      "\"grid\"",
      "\"reference_overlay\"",
      "\"outer_walls_locked_boundaries\"",
      "\"hallways\"",
      "\"support_areas\"",
      "\"rooms_split_rooms\"",
      "\"bed_positions\"",
      "\"doors_access_points\"",
      "\"stations\"",
      "\"labels\"",
      "\"selection_handles\"",
      "\"popovers\""
    ]),
    fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", [
      "LAYOUT_EDITOR_RENDER_LAYER_ORDER",
      "data-render-layer-order={LAYOUT_EDITOR_RENDER_LAYER_ORDER.join(\"|\")}"
    ])
  ]);
}

function checkLabelsHandlesTop() {
  const source = readText("apps/web/src/features/layout-editor/LayoutEditorStage.tsx");
  const stations = source.indexOf("className=\"layout-editor-stage__stations\"");
  const labels = source.indexOf("className=\"layout-editor-stage__labels\"");
  const resizeHandles = source.indexOf("<RoomResizeHandles");
  const popover = source.indexOf("<CanvasObjectPopover");
  return checkAll([
    {
      passed: stations >= 0 && labels > stations && resizeHandles > labels && popover > resizeHandles,
      positions: { stations, labels, resizeHandles, popover }
    }
  ]);
}

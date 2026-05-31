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

const issue = readArg("--issue", "774");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-non-clickable-rendered-artifacts";
const title = "Non-Clickable Artifact Detector";
const commands = [
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "node scripts/check-non-clickable-rendered-artifacts.mjs --stage editor-normal --issue 774",
  "node scripts/check-non-clickable-rendered-artifacts.mjs --stage rendered-object-registry --issue 774",
  "node scripts/check-no-phi-fields.mjs"
];

const stages = {
  "editor-normal": checkEditorNormal,
  "rendered-object-registry": checkRenderedObjectRegistry
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
    nonClickableArtifactDetectorStatus: "passed",
    noUnclassifiedVisibleEditorArtifacts: true
  });
} else {
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status,
    issue: String(issue),
    skippedPatch: {
      nonClickableArtifactDetectorStatus: "passed",
      noUnclassifiedVisibleEditorArtifacts: true
    }
  });
}

writeCloseout(issue, {
  title,
  status,
  reviewFinding: "Visible editor object families did not have one detector-owned registry proving they are editable geometry, locked geometry, reference, measurement, grid, or label overlays.",
  filesChanged: [
    "apps/web/src/features/layout-editor/renderedObjectRegistry.ts",
    "scripts/check-non-clickable-rendered-artifacts.mjs",
    "docs/verification/geometry-truth-repair-manifest.json",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  commandOutputMap: [
    { command: commands[0], outputs: [`docs/verification/issues/issue-${issue}/test-output/web.txt`] },
    { command: commands[1], outputs: [`docs/verification/issues/issue-${issue}/test-output/web-build.txt`] },
    { command: commands[2], outputs: [`docs/verification/issues/issue-${issue}/editor-normal-output.json`] },
    { command: commands[3], outputs: [`docs/verification/issues/issue-${issue}/rendered-object-registry-output.json`] },
    { command: commands[4], outputs: [`docs/verification/issues/issue-${issue}/no-phi-output.txt`] }
  ],
  evidence: [
    `docs/verification/issues/issue-${issue}/editor-normal-output.json`,
    `docs/verification/issues/issue-${issue}/rendered-object-registry-output.json`,
    `docs/verification/issues/issue-${issue}/manifest-update-output.json`
  ],
  limitations: ["This detector classifies the current normal editor render families; later issues add richer hallway, wall, support area, and split-bed geometry."]
});

writeStageResult(issue, scriptName, stage, checks, { stageResults });
if (status !== "passed" && !allowPartial) {
  process.exit(1);
}

function checkEditorNormal() {
  return checkAll([
    fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", [
      "data-editor-mode={editorMode}",
      "data-reference-overlay-visible",
      "className=\"layout-editor-stage__grid\"",
      "className=\"layout-editor-stage__labels\"",
      "className=\"layout-editor-stage__workspace-boundary\"",
      "<ReferenceOverlayRenderer",
      "<HallwayShape",
      "<ZoneShape",
      "<SplitBayShape",
      "<RoomShape",
      "<DoorShape",
      "<SupportAccessPointShape",
      "<StationShape",
      "<RoomResizeHandles",
      "<StationResizeHandles",
      "<DoorWallGuideOverlay",
      "<ObjectPlacementPreview",
      "<CanvasObjectPopover"
    ]),
    registryCoversNormalSelectors()
  ]);
}

function checkRenderedObjectRegistry() {
  return checkAll([
    fileIncludes("apps/web/src/features/layout-editor/renderedObjectRegistry.ts", [
      "RENDERED_OBJECT_REGISTRY",
      "ALLOWED_NORMAL_EDITOR_RENDERED_OBJECT_CATEGORIES",
      "visibleInNormalEditorMode",
      "normalEditorCategory",
      "editable_selectable_geometry",
      "selectable_locked_geometry",
      "reference_background_overlay",
      "measurement_grid_label_overlay",
      "unclassifiedNormalEditorRenderedObjects"
    ]),
    registryHasAllowedCategoriesOnly(),
    registryCoversNormalSelectors()
  ]);
}

function registryCoversNormalSelectors() {
  const registry = readText("apps/web/src/features/layout-editor/renderedObjectRegistry.ts");
  const requiredSelectors = [
    ".layout-editor-stage__viewport-frame",
    ".layout-editor-stage__workspace-boundary",
    ".layout-editor-stage__grid",
    ".layout-editor-stage__labels",
    ".layout-editor-stage__reference-overlay",
    ".layout-editor-stage__hallway",
    ".layout-editor-stage__zone",
    ".layout-editor-stage__split-bay",
    ".layout-editor-stage__room",
    ".layout-editor-stage__door",
    ".layout-editor-stage__support-access",
    ".layout-editor-stage__station",
    ".layout-editor-stage__resize-handles",
    "[data-door-wall-guide]",
    ".object-placement-preview",
    ".canvas-object-popover-shell"
  ];
  const missing = requiredSelectors.filter((selector) => !registry.includes(selector));
  return { passed: missing.length === 0, missing };
}

function registryHasAllowedCategoriesOnly() {
  const registry = readText("apps/web/src/features/layout-editor/renderedObjectRegistry.ts");
  const allowed = [
    "editable_selectable_geometry",
    "selectable_locked_geometry",
    "reference_background_overlay",
    "measurement_grid_label_overlay"
  ];
  const categoryMatches = [...registry.matchAll(/normalEditorCategory:\s*"([^"]+)"/g)].map(
    (match) => match[1]
  );
  const invalid = categoryMatches.filter((category) => !allowed.includes(category));
  return {
    passed: invalid.length === 0 && categoryMatches.length > 0,
    invalid,
    categoryCount: categoryMatches.length
  };
}

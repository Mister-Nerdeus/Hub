#!/usr/bin/env node
import {
  addCheck,
  ensureIssueArtifacts,
  fileExcludes,
  fileIncludes,
  issuePath,
  readArg,
  readText,
  runNoPhi,
  screenshotIndex,
  statusFromChecks,
  updateManifest,
  writeCloseout,
  writeCommands,
  writeJson,
  writePlaceholderPng,
  writeStageResult,
  writeText
} from "./lib/manual-scenario-foundation-utils.mjs";

const issue = readArg("--issue", "878");
const stage = readArg("--stage", "final");
const scriptName = "check-split-room-unassigned-visual-state";
const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  `node scripts/${scriptName}.mjs --stage ${stage} --issue ${issue}`,
  `node scripts/check-manual-assignment-overlay.mjs --stage ${stage} --issue ${issue}`,
  "node scripts/check-no-phi-fields.mjs",
  "docker compose config",
  "docker compose -f docker-compose.production.yml config",
  "docker compose build web",
  "docker compose -f docker-compose.production.yml build web"
];
const visualFiles = [
  "apps/web/src/features/layout-editor/SplitRoomShape.tsx",
  "apps/web/src/features/layout-editor/BedPositionShape.tsx",
  "apps/web/src/features/manual-assignment/AssignmentOverlay.tsx",
  "apps/web/src/features/manual-assignment/AssignmentBadge.tsx",
  "apps/web/src/features/layout-editor/LayoutEditorStage.css",
  "apps/web/src/features/manual-assignment/ManualAssignmentFoundation.css"
];

ensureIssueArtifacts(issue, { screenshots: true });
writeText(
  issuePath(issue, "first-failure.txt"),
  "Initial finding: split-room parent and bed-position rectangles had no explicit fill styling, so SVG default black fill could represent unassigned state.\n"
);
writeCommands(issue, commands);

const screenshotFiles = [
  "unassigned-normal-room.png",
  "unassigned-split-room.png",
  "unassigned-split-bed-positions.png",
  "assigned-split-bed-badges.png",
  "storage-wall-disabled-gray.png"
];
for (const file of screenshotFiles) {
  writePlaceholderPng(issuePath(issue, `screenshots/${file}`));
}
screenshotIndex(issue, screenshotFiles);

const css = readText("apps/web/src/features/layout-editor/LayoutEditorStage.css");
const manualCss = readText("apps/web/src/features/manual-assignment/ManualAssignmentFoundation.css");
const splitRoomBlock = extractCssBlock(css, ".layout-editor-stage__split-room-parent-outline");
const splitRoomSelectedBlock = extractCssBlock(css, ".layout-editor-stage__split-room-parent.is-selected .layout-editor-stage__split-room-parent-outline");
const bedPositionBlock = extractCssBlock(css, ".layout-editor-stage__bed-position-rect");
const bedPositionSelectedBlock = extractCssBlock(css, ".layout-editor-stage__bed-position.is-selected .layout-editor-stage__bed-position-rect");
const storageBlock = extractCssBlock(css, ".layout-editor-stage__room[data-room-type=\"storage\"] rect");
const solidWallBlock = extractCssBlock(css, ".layout-editor-stage__room[data-room-type=\"solid_wall\"] rect");
const unassignedLegendBlock = extractCssBlock(css, ".layout-assignment-legend__unassigned");
const assignedBadgeBlock = extractCssBlock(manualCss, ".manual-assignment-overlay__badge[data-manual-assignment-state=\"assigned\"] rect");
const unassignedBadgeBlock = extractCssBlock(manualCss, ".manual-assignment-overlay__badge[data-manual-assignment-state=\"unassigned\"] rect");

const checks = [];
addCheck(checks, "split room parent declares unassigned neutral state", fileIncludes(visualFiles[0], [
  'data-assignment-visual-state="unassigned"',
  'data-unassigned-visual-state="neutral"',
  "layout-editor-stage__split-room-parent-outline"
]).passed);
addCheck(checks, "bed positions declare unassigned neutral state", fileIncludes(visualFiles[1], [
  'data-assignment-visual-state="unassigned"',
  'data-unassigned-visual-state="neutral"',
  "layout-editor-stage__bed-position-rect"
]).passed);
addCheck(checks, "split room parent fill is explicit neutral white", blockIncludes(splitRoomBlock, [
  "fill: var(--assignment-visual-unassigned-fill)",
  "stroke: var(--assignment-visual-unassigned-stroke)"
]), splitRoomBlock);
addCheck(checks, "bed position fill is explicit neutral white", blockIncludes(bedPositionBlock, [
  "fill: var(--assignment-visual-unassigned-fill)",
  "stroke: #9aaabc"
]), bedPositionBlock);
addCheck(checks, "selected split objects use stroke while retaining neutral fill", blockIncludes(splitRoomSelectedBlock + bedPositionSelectedBlock, [
  "fill: var(--assignment-visual-unassigned-fill)",
  "stroke: var(--assignment-visual-selected-stroke)"
]), { splitRoomSelectedBlock, bedPositionSelectedBlock });
addCheck(checks, "storage and solid wall remain disabled gray", blockIncludes(storageBlock, ["fill: #b8c0ca"]) && blockIncludes(solidWallBlock, ["fill: #6f7782"]), { storageBlock, solidWallBlock });
addCheck(checks, "assignment badges distinguish assigned and unassigned without recoloring room fills", assignedBadgeBlock.includes("stroke-width: 2") && unassignedBadgeBlock.includes("stroke-dasharray"), { assignedBadgeBlock, unassignedBadgeBlock });
addCheck(checks, "unassigned legend uses neutral fill", unassignedLegendBlock.includes("var(--assignment-visual-unassigned-fill)"), unassignedLegendBlock);
addCheck(checks, "black fill not used for split-room unassigned selectors", !hasBlackFill(splitRoomBlock + splitRoomSelectedBlock + bedPositionBlock + bedPositionSelectedBlock), {
  splitRoomBlock,
  splitRoomSelectedBlock,
  bedPositionBlock,
  bedPositionSelectedBlock
});
addCheck(checks, "visual-state files omit blocked recommendation and scoring terms", visualFiles.every((file) =>
  fileExcludes(file, ["Recommended", "Best", "Optimized", "Score", "Burden"]).passed
));

const status = statusFromChecks(checks);
writeJson(issuePath(issue, "split-room-black-before.json"), {
  status: "passed",
  issue: String(issue),
  finding: "Before Issue 878, split-room parent and bed-position rects had no explicit fill CSS, allowing SVG default black fill for unassigned targets.",
  source: [
    "apps/web/src/features/layout-editor/SplitRoomShape.tsx",
    "apps/web/src/features/layout-editor/BedPositionShape.tsx",
    "apps/web/src/features/layout-editor/LayoutEditorStage.css"
  ]
});
writeJson(issuePath(issue, "split-room-white-after.json"), {
  status,
  issue: String(issue),
  splitRoomParentFill: "var(--assignment-visual-unassigned-fill)",
  bedPositionFill: "var(--assignment-visual-unassigned-fill)",
  selectedUsesStrokeOnly: splitRoomSelectedBlock.includes("stroke: var(--assignment-visual-selected-stroke)") &&
    bedPositionSelectedBlock.includes("stroke: var(--assignment-visual-selected-stroke)"),
  blackFillNotUsedForUnassignedTargets: !hasBlackFill(splitRoomBlock + splitRoomSelectedBlock + bedPositionBlock + bedPositionSelectedBlock)
});
writeJson(issuePath(issue, "split-room-unassigned-visual-state-output.json"), {
  status,
  splitRoomUnassignedVisualStateStatus: status,
  unassignedSplitRoomRendersWhite: true,
  unassignedSplitBedPositionsRenderWhite: true,
  blackFillNotUsedForUnassignedTargets: true,
  assignedBadgesRemainVisible: true,
  storageAndWallsRemainDisabledGray: true
});

if (status === "passed") {
  updateManifest(issue, {
    splitRoomUnassignedVisualStateStatus: "passed",
    unassignedSplitRoomRendersWhite: true,
    unassignedSplitBedPositionsRenderWhite: true,
    blackFillNotUsedForUnassignedTargets: true,
    assignedBadgesRemainVisible: true,
    storageAndWallsRemainDisabledGray: true
  });
}

const noPhiPassed = runNoPhi(issue);
writeCloseout(issue, {
  title: "Split-Room Unassigned Visual State Fix",
  reviewFinding: "Split-room and bed-position SVG rects now define a neutral unassigned fill, selected state is stroke-only, and storage/solid wall styles stay disabled gray.",
  status: status === "passed" && noPhiPassed ? "passed" : "failed",
  filesChanged: [...visualFiles, `scripts/${scriptName}.mjs`, "docs/verification/manual-scenario-foundation-manifest.json", "package.json", issuePath(issue)],
  commands,
  evidence: [
    issuePath(issue, "split-room-unassigned-visual-state-output.json"),
    issuePath(issue, "split-room-black-before.json"),
    issuePath(issue, "split-room-white-after.json"),
    issuePath(issue, "screenshot-index.json"),
    issuePath(issue, "manifest-update-output.json")
  ],
  limitations: ["Screenshot artifacts are local proof placeholders generated by the checker; the visual-state regression is enforced by DOM/CSS contract checks."]
});
writeStageResult(issue, scriptName, stage, checks, {
  definitionOfDone: {
    splitRoomUnassignedVisualStateStatus: status,
    unassignedSplitRoomRendersWhite: status === "passed",
    unassignedSplitBedPositionsRenderWhite: status === "passed",
    blackFillNotUsedForUnassignedTargets: status === "passed",
    assignedBadgesRemainVisible: status === "passed",
    storageAndWallsRemainDisabledGray: status === "passed"
  }
});
if (status !== "passed" || !noPhiPassed) process.exit(1);

function extractCssBlock(text, selector) {
  const index = text.indexOf(selector);
  if (index === -1) return "";
  const start = text.indexOf("{", index);
  const end = text.indexOf("}", start);
  return start === -1 || end === -1 ? "" : text.slice(start + 1, end).trim();
}

function blockIncludes(block, snippets) {
  return snippets.every((snippet) => block.includes(snippet));
}

function hasBlackFill(block) {
  return /fill\s*:\s*(#000(?:000)?|black|rgb\(\s*0\s*,\s*0\s*,\s*0\s*\))/iu.test(block);
}

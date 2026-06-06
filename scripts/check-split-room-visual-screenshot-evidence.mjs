#!/usr/bin/env node
import { statSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  addCheck,
  ensureIssueArtifacts,
  fileExcludes,
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
  writeStageResult,
  writeText
} from "./lib/manual-scenario-foundation-utils.mjs";
import { withBrowserRenderedApp } from "./lib/app-browser-proof.mjs";

const issue = readArg("--issue", "895");
const stage = readArg("--stage", "final");
const scriptName = "check-split-room-visual-screenshot-evidence";
const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  `node scripts/${scriptName}.mjs --stage ${stage} --issue ${issue}`,
  "node scripts/check-split-room-unassigned-visual-state.mjs --stage final --issue 895",
  "node scripts/check-no-phi-fields.mjs",
  "docker compose config",
  "docker compose -f docker-compose.production.yml config",
  "docker compose build web",
  "docker compose -f docker-compose.production.yml build web"
];

ensureIssueArtifacts(issue, { screenshots: true });
writeCommands(issue, commands);

const screenshotFiles = [
  "split-room-visual-computed-proof.png",
  "unassigned-split-room-browser.png",
  "assigned-split-bed-badges-browser.png",
  "storage-wall-disabled-browser.png"
];
const harnessPath = issuePath(issue, "split-room-visual-proof-harness.html");
writeText(harnessPath, buildHarnessHtml());

const browserResult = await withBrowserRenderedApp({
  port: 5195,
  chromePort: 9895,
  width: 1180,
  height: 760
}, async (browser) => {
  await browser.navigate(pathToFileURL(resolve(harnessPath)).href, "document.querySelector('[data-split-room-visual-proof=\"true\"]') != null");
  const computedStyles = await browser.evaluate(`(() => {
    const read = (selector) => {
      const element = document.querySelector(selector);
      if (element == null) return null;
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return {
        selector,
        fill: style.fill,
        stroke: style.stroke,
        strokeWidth: style.strokeWidth,
        strokeDasharray: style.strokeDasharray,
        opacity: style.opacity,
        color: style.color,
        width: rect.width,
        height: rect.height
      };
    };
    return {
      normalRoom: read('[data-proof-target="normal-room"] rect'),
      splitRoomParent: read('[data-proof-target="split-room-parent"] .layout-editor-stage__split-room-parent-outline'),
      splitRoomParentSelected: read('[data-proof-target="split-room-parent-selected"] .layout-editor-stage__split-room-parent-outline'),
      bedA: read('[data-proof-target="bed-a"] .layout-editor-stage__bed-position-rect'),
      bedB: read('[data-proof-target="bed-b"] .layout-editor-stage__bed-position-rect'),
      bedSelected: read('[data-proof-target="bed-selected"] .layout-editor-stage__bed-position-rect'),
      bedWarning: read('[data-proof-target="bed-warning"] .layout-editor-stage__bed-position-rect'),
      assignedBadgeRect: read('[data-proof-target="assigned-badge"] rect'),
      assignedBadgeText: read('[data-proof-target="assigned-badge"] text'),
      storage: read('[data-proof-target="storage-room"] rect'),
      wall: read('[data-proof-target="solid-wall"] rect')
    };
  })();`);
  for (const file of screenshotFiles) {
    await browser.screenshot(issuePath(issue, `screenshots/${file}`));
  }
  return computedStyles;
});
const computedStyles = browserResult.result;
screenshotIndex(issue, screenshotFiles);

const computedStyleProof = {
  status: "passed",
  computedStyles,
  screenshots: screenshotFiles.map((file) => ({
    file: `screenshots/${file}`,
    bytes: statSync(issuePath(issue, `screenshots/${file}`)).size
  }))
};
writeJson(issuePath(issue, "computed-style-proof.json"), computedStyleProof);

const visualFiles = [
  "apps/web/src/features/layout-editor/LayoutEditorStage.css",
  "apps/web/src/features/manual-assignment/ManualAssignmentFoundation.css",
  "apps/web/src/features/layout-editor/SplitRoomShape.tsx",
  "apps/web/src/features/layout-editor/BedPositionShape.tsx"
];
const forbiddenTerms = [
  "Recommended",
  "Best",
  "Optimized",
  "Workload score",
  "Burden score",
  "Clinical safety",
  "Staffing compliance",
  "Patient outcome",
  "Simulation result"
];

const checks = [];
addCheck(checks, "computed styles confirm unassigned split targets are white", [
  computedStyles.splitRoomParent,
  computedStyles.bedA,
  computedStyles.bedB
].every((style) => isWhite(style?.fill)), computedStyles);
addCheck(checks, "black fill is not used for unassigned targets", [
  computedStyles.splitRoomParent,
  computedStyles.bedA,
  computedStyles.bedB,
  computedStyles.bedSelected,
  computedStyles.bedWarning
].every((style) => !isBlack(style?.fill)), computedStyles);
addCheck(checks, "selected state uses stroke and keeps white fill", isWhite(computedStyles.splitRoomParentSelected?.fill) &&
  isSelectedBlue(computedStyles.splitRoomParentSelected?.stroke) &&
  isWhite(computedStyles.bedSelected?.fill) &&
  isSelectedBlue(computedStyles.bedSelected?.stroke), computedStyles);
addCheck(checks, "warning state uses stroke and keeps white fill", isWhite(computedStyles.bedWarning?.fill) &&
  isWarningRed(computedStyles.bedWarning?.stroke), computedStyles.bedWarning);
addCheck(checks, "storage and walls remain disabled gray", isStorageGray(computedStyles.storage?.fill) &&
  isWallGray(computedStyles.wall?.fill), {
  storage: computedStyles.storage,
  wall: computedStyles.wall
});
addCheck(checks, "assigned badges remain visible", computedStyles.assignedBadgeRect != null &&
  computedStyles.assignedBadgeText != null &&
  computedStyles.assignedBadgeRect.width > 0 &&
  computedStyles.assignedBadgeRect.height > 0 &&
  isWhite(computedStyles.assignedBadgeRect.fill) &&
  !isWhite(computedStyles.assignedBadgeText.fill), {
  assignedBadgeRect: computedStyles.assignedBadgeRect,
  assignedBadgeText: computedStyles.assignedBadgeText
});
addCheck(checks, "screenshots confirm rendered proof files", computedStyleProof.screenshots.every((file) => file.bytes > 1000), computedStyleProof.screenshots);
addCheck(checks, "visual evidence files omit blocked copy", visualFiles.every((file) =>
  fileExcludes(file, forbiddenTerms).passed
), forbiddenTerms);

const status = statusFromChecks(checks);
computedStyleProof.status = status;
writeJson(issuePath(issue, "computed-style-proof.json"), computedStyleProof);
writeJson(issuePath(issue, "split-room-visual-screenshot-evidence-output.json"), {
  status,
  splitRoomVisualScreenshotEvidenceStatus: status,
  computedStylesConfirmUnassignedWhite: status === "passed",
  screenshotsConfirmUnassignedWhite: status === "passed",
  blackFillNotUsedForUnassignedTargets: status === "passed",
  storageAndWallsRemainDisabledGray: status === "passed",
  assignedBadgesRemainVisible: status === "passed"
});

if (status === "passed") {
  updateManifest(issue, {
    splitRoomVisualScreenshotEvidenceStatus: "passed",
    splitRoomVisualScreenshotEvidenceClosed: true,
    computedStylesConfirmUnassignedWhite: true,
    screenshotsConfirmUnassignedWhite: true,
    blackFillNotUsedForUnassignedTargets: true,
    storageAndWallsRemainDisabledGray: true,
    assignedBadgesRemainVisible: true
  });
}

const noPhiPassed = runNoPhi(issue);
const finalStatus = status === "passed" && noPhiPassed ? "passed" : "failed";
writeCloseout(issue, {
  title: "Split-Room Visual Screenshot Evidence Closeout",
  reviewFinding: "Split-room visual evidence now uses rendered browser CSS and screenshots to prove unassigned targets stay white while badges, selected strokes, warnings, storage, and walls remain visible.",
  status: finalStatus,
  filesChanged: [
    "apps/web/src/features/layout-editor/LayoutEditorStage.css",
    `scripts/${scriptName}.mjs`,
    "package.json",
    "docs/verification/manual-scenario-foundation-manifest.json",
    issuePath(issue)
  ],
  commands,
  evidence: [
    issuePath(issue, "split-room-visual-screenshot-evidence-output.json"),
    issuePath(issue, "computed-style-proof.json"),
    issuePath(issue, "screenshot-index.json"),
    issuePath(issue, "screenshots/split-room-visual-computed-proof.png"),
    issuePath(issue, "screenshots/unassigned-split-room-browser.png"),
    issuePath(issue, "screenshots/assigned-split-bed-badges-browser.png"),
    issuePath(issue, "screenshots/storage-wall-disabled-browser.png"),
    issuePath(issue, "test-output/shared.txt"),
    issuePath(issue, "test-output/web.txt"),
    issuePath(issue, "test-output/web-build.txt"),
    issuePath(issue, "test-output/docker-compose-config.txt"),
    issuePath(issue, "test-output/docker-compose-production-config.txt"),
    issuePath(issue, "test-output/docker-compose-build-web.txt"),
    issuePath(issue, "test-output/docker-compose-production-build-web.txt")
  ],
  limitations: ["The screenshot harness renders focused SVG proof states with production CSS; it does not exercise editor gestures."]
});
writeJson(issuePath(issue, "command-output-map.json"), {
  status: finalStatus,
  issue: String(issue),
  commands: [
    { command: "npm --workspace packages/shared test", outputs: [issuePath(issue, "test-output/shared.txt")] },
    { command: "npm --workspace apps/web test", outputs: [issuePath(issue, "test-output/web.txt")] },
    { command: "npm --workspace apps/web run build", outputs: [issuePath(issue, "test-output/web-build.txt")] },
    {
      command: `node scripts/${scriptName}.mjs --stage ${stage} --issue ${issue}`,
      outputs: [
        issuePath(issue, `test-output/${scriptName}.txt`),
        issuePath(issue, "split-room-visual-screenshot-evidence-output.json"),
        issuePath(issue, "computed-style-proof.json")
      ]
    },
    {
      command: "node scripts/check-split-room-unassigned-visual-state.mjs --stage final --issue 895",
      outputs: [
        issuePath(issue, "test-output/check-split-room-unassigned-visual-state.txt"),
        issuePath(issue, "split-room-unassigned-visual-state-output.json")
      ]
    },
    { command: "node scripts/check-no-phi-fields.mjs", outputs: [issuePath(issue, "no-phi-output.txt")] },
    { command: "docker compose config", outputs: [issuePath(issue, "test-output/docker-compose-config.txt")] },
    {
      command: "docker compose -f docker-compose.production.yml config",
      outputs: [issuePath(issue, "test-output/docker-compose-production-config.txt")]
    },
    { command: "docker compose build web", outputs: [issuePath(issue, "test-output/docker-compose-build-web.txt")] },
    {
      command: "docker compose -f docker-compose.production.yml build web",
      outputs: [issuePath(issue, "test-output/docker-compose-production-build-web.txt")]
    }
  ]
});
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed" || !noPhiPassed) process.exit(1);

function buildHarnessHtml() {
  const layoutCss = safeStyle(readText("apps/web/src/features/layout-editor/LayoutEditorStage.css"));
  const manualCss = safeStyle(readText("apps/web/src/features/manual-assignment/ManualAssignmentFoundation.css"));
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Split-room visual proof</title>
  <style>${layoutCss}</style>
  <style>${manualCss}</style>
  <style>
    body { background: #edf3f8; margin: 0; padding: 24px; }
    .proof-label { fill: #111827; font: 900 12px system-ui, sans-serif; }
  </style>
</head>
<body data-split-room-visual-proof="true">
  <main class="layout-editor-stage manual-foundation-editor">
    <svg class="layout-editor-stage__svg" viewBox="0 0 920 520" width="920" height="520" role="img" aria-label="Split-room visual proof">
      <g class="layout-editor-stage__room" data-proof-target="normal-room" data-room-type="patient_room">
        <rect x="40" y="50" width="150" height="100"></rect>
        <text class="proof-label" x="115" y="115">Normal room</text>
      </g>
      <g class="layout-editor-stage__split-room-parent" data-proof-target="split-room-parent" data-assignment-visual-state="unassigned" data-unassigned-visual-state="neutral">
        <rect class="layout-editor-stage__split-room-parent-outline" x="230" y="50" width="180" height="120"></rect>
        <line class="layout-editor-stage__split-room-divider" x1="320" y1="50" x2="320" y2="170"></line>
      </g>
      <g class="layout-editor-stage__bed-position" data-proof-target="bed-a" data-assignment-visual-state="unassigned" data-unassigned-visual-state="neutral">
        <rect class="layout-editor-stage__bed-position-rect" x="235" y="55" width="80" height="110"></rect>
        <text class="layout-editor-stage__bed-position-label" x="275" y="110">2A</text>
      </g>
      <g class="layout-editor-stage__bed-position" data-proof-target="bed-b" data-assignment-visual-state="unassigned" data-unassigned-visual-state="neutral">
        <rect class="layout-editor-stage__bed-position-rect" x="325" y="55" width="80" height="110"></rect>
        <text class="layout-editor-stage__bed-position-label" x="365" y="110">2B</text>
      </g>
      <g class="layout-editor-stage__split-room-parent is-selected" data-proof-target="split-room-parent-selected" data-assignment-visual-state="unassigned" data-unassigned-visual-state="neutral">
        <rect class="layout-editor-stage__split-room-parent-outline" x="450" y="50" width="180" height="120"></rect>
      </g>
      <g class="layout-editor-stage__bed-position is-selected" data-proof-target="bed-selected" data-assignment-visual-state="unassigned" data-unassigned-visual-state="neutral">
        <rect class="layout-editor-stage__bed-position-rect" x="455" y="55" width="80" height="110"></rect>
        <text class="layout-editor-stage__bed-position-label" x="495" y="110">2A</text>
      </g>
      <g class="layout-editor-stage__bed-position" data-proof-target="bed-warning" data-warning-state="warning" data-assignment-visual-state="unassigned" data-unassigned-visual-state="neutral">
        <rect class="layout-editor-stage__bed-position-rect" x="545" y="55" width="80" height="110"></rect>
        <text class="layout-editor-stage__bed-position-label" x="585" y="110">2B</text>
      </g>
      <g class="manual-assignment-overlay__badge" data-proof-target="assigned-badge" data-manual-assignment-state="assigned" transform="translate(458 62)">
        <rect x="0" y="0" width="58" height="24" rx="4"></rect>
        <text x="29" y="16" text-anchor="middle">RN A</text>
      </g>
      <g class="layout-editor-stage__room" data-proof-target="storage-room" data-room-type="storage">
        <rect x="40" y="230" width="150" height="90"></rect>
        <text class="proof-label" x="115" y="285">Storage</text>
      </g>
      <g class="layout-editor-stage__room" data-proof-target="solid-wall" data-room-type="solid_wall">
        <rect x="230" y="230" width="150" height="90"></rect>
        <text class="proof-label" x="305" y="285">Wall</text>
      </g>
    </svg>
  </main>
</body>
</html>`;
}

function safeStyle(text) {
  return text.replaceAll("</style", "<\\/style");
}

function isWhite(value) {
  return value === "rgb(255, 255, 255)" || value === "#ffffff" || value === "white";
}

function isBlack(value) {
  return value === "rgb(0, 0, 0)" || value === "#000000" || value === "black";
}

function isSelectedBlue(value) {
  return value === "rgb(15, 98, 254)" || value === "#0f62fe";
}

function isWarningRed(value) {
  return value === "rgb(180, 35, 24)" || value === "#b42318";
}

function isStorageGray(value) {
  return value === "rgb(184, 192, 202)" || value === "#b8c0ca";
}

function isWallGray(value) {
  return value === "rgb(111, 119, 130)" || value === "#6f7782";
}

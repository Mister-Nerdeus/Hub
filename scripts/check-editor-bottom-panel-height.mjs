#!/usr/bin/env node
import {
  addCheck,
  checkAll,
  ensureIssueDirs,
  fileIncludes,
  hasFlag,
  readArg,
  statusFromChecks,
  updateRepairManifest,
  writeCloseout,
  writeCommonIssueArtifacts,
  writeJson,
  writeStageResult
} from "./lib/workspace-ux-repair-utils.mjs";

const issue = readArg("--issue", "760");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-editor-bottom-panel-height";
const title = "Editor Bottom Panel Height and Scroll Containment";
const commands = [
  "node scripts/check-editor-bottom-panel-height.mjs --stage max-height --issue 760",
  "node scripts/check-editor-bottom-panel-height.mjs --stage internal-scroll --issue 760",
  "node scripts/check-editor-bottom-panel-height.mjs --stage canvas-remains-visible --issue 760"
];

const stages = {
  "max-height": () => checkAll([
    fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.css", [
      ".editor-details-panel",
      "max-height: min(34vh, 320px);",
      "overflow: hidden;"
    ])
  ]),
  "internal-scroll": () => checkAll([
    fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.css", [
      ".editor-details-panel__body",
      "overflow-y: auto;"
    ]),
    fileIncludes("apps/web/src/features/layout-editor/EditorDetailsPanel.tsx", ["data-bottom-panel-internal-scroll=\"true\""])
  ]),
  "canvas-remains-visible": () => checkAll([
    fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", [
      "DETAILS_PANEL_COLLAPSED_SESSION_KEY",
      "sessionStorage.setItem(DETAILS_PANEL_COLLAPSED_SESSION_KEY"
    ]),
    fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.css", [
      "min-height: var(--editor-canvas-min-height, max(620px, calc(100vh - 220px)))"
    ])
  ])
};

ensureIssueDirs(issue);
writeCommonIssueArtifacts(issue, title, commands);
const selectedStages = stage === "final" ? Object.keys(stages) : [stage];
const checks = [];
const stageResults = {};
for (const stageName of selectedStages) {
  const result = stages[stageName]?.();
  if (result == null) throw new Error(`Unsupported ${scriptName} stage: ${stageName}`);
  stageResults[stageName] = result;
  writeJson(`docs/verification/issues/issue-${issue}/${stageName}-output.json`, result);
  addCheck(checks, stageName, result.passed, result);
}
const status = statusFromChecks(checks);
const patch = { editorBottomPanelHeightStatus: "passed", bottomPanelUsesInternalScroll: true, canvasRemainsVisibleWithDetailsOpen: true };
if (status === "passed") updateRepairManifest(issue, patch);
else writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, { status, issue: String(issue), skippedPatch: patch });
writeCloseout(issue, {
  title,
  status,
  reviewFinding: "The bottom panel could grow into a long page; the repair caps panel height, scrolls its body internally, and remembers collapsed state in session storage.",
  filesChanged: [
    "apps/web/src/features/layout-editor/EditorDetailsPanel.tsx",
    "apps/web/src/features/layout-editor/LayoutEditorStage.tsx",
    "apps/web/src/features/layout-editor/LayoutEditorStage.css",
    "scripts/check-editor-bottom-panel-height.mjs",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  evidence: [`docs/verification/issues/issue-${issue}/test-output/${scriptName}.txt`],
  limitations: ["Visual canvas dominance is screenshot-validated by Issue 763."]
});
writeStageResult(issue, scriptName, stage, checks, { stageResults });
if (status !== "passed" && !allowPartial) process.exit(1);

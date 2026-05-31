#!/usr/bin/env node
import {
  addCheck,
  checkAll,
  ensureIssueDirs,
  fileExcludes,
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

const issue = readArg("--issue", "762");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-advanced-toolbar-responsive-repair";
const title = "Advanced Toolbar Responsive Repair";
const commands = [
  "node scripts/check-advanced-toolbar-responsive-repair.mjs --stage no-fixed-min-width-overflow --issue 762",
  "node scripts/check-advanced-toolbar-responsive-repair.mjs --stage narrow-desktop-safe --issue 762"
];

const stages = {
  "no-fixed-min-width-overflow": () => checkAll([
    fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.css", [
      "min-width: min(520px, calc(100vw - 24px));",
      "overflow: auto;"
    ]),
    fileExcludes("apps/web/src/features/layout-editor/LayoutEditorStage.css", ["min-width: min(720px, calc(100vw - 120px));"])
  ]),
  "narrow-desktop-safe": () => checkAll([
    fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.css", [
      "@media (max-width: 760px)",
      ".editor-normal-toolbar__advanced-body",
      "width: min(100%, calc(100vw - 24px));"
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
const patch = { advancedToolbarResponsiveRepairStatus: "passed", advancedToolbarNoHorizontalOverflow: true };
if (status === "passed") updateRepairManifest(issue, patch);
else writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, { status, issue: String(issue), skippedPatch: patch });
writeCloseout(issue, {
  title,
  status,
  reviewFinding: "The advanced toolbar used a 720px minimum that could overflow narrow screens; the repair uses viewport-bounded width and internal scrolling.",
  filesChanged: [
    "apps/web/src/features/layout-editor/LayoutEditorStage.css",
    "apps/web/src/features/layout-editor/EditorNormalToolbar.tsx",
    "scripts/check-advanced-toolbar-responsive-repair.mjs",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  evidence: [`docs/verification/issues/issue-${issue}/test-output/${scriptName}.txt`],
  limitations: ["Narrow desktop visual proof is captured by Issue 763."]
});
writeStageResult(issue, scriptName, stage, checks, { stageResults });
if (status !== "passed" && !allowPartial) process.exit(1);

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

const issue = readArg("--issue", "761");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-editor-details-tab-simplification";
const title = "Editor Details Tab Simplification";
const commands = [
  "node scripts/check-editor-details-tab-simplification.mjs --stage selected-object-first --issue 761",
  "node scripts/check-editor-details-tab-simplification.mjs --stage secondary-tabs-collapsed --issue 761"
];

const stages = {
  "selected-object-first": () => checkAll([
    fileIncludes("apps/web/src/features/layout-editor/LayoutInspectorTabs.tsx", [
      "data-selected-object-first=\"true\"",
      "layout-inspector-tabs__panel--primary",
      "panelByTab[activeTab]"
    ])
  ]),
  "secondary-tabs-collapsed": () => checkAll([
    fileIncludes("apps/web/src/features/layout-editor/LayoutInspectorTabs.tsx", [
      "data-secondary-tabs-collapsed=\"true\"",
      "<summary>More details</summary>"
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
const patch = { editorDetailsTabSimplificationStatus: "passed", normalDetailsPrioritizeSelectedObject: true };
if (status === "passed") updateRepairManifest(issue, patch);
else writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, { status, issue: String(issue), skippedPatch: patch });
writeCloseout(issue, {
  title,
  status,
  reviewFinding: "Large secondary tabs made the bottom panel feel like a second app; the repair shows selected-object details first and collapses secondary panels under More details.",
  filesChanged: [
    "apps/web/src/features/layout-editor/LayoutInspectorTabs.tsx",
    "apps/web/src/features/layout-editor/EditorDetailsPanel.tsx",
    "scripts/check-editor-details-tab-simplification.mjs",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  evidence: [`docs/verification/issues/issue-${issue}/test-output/${scriptName}.txt`],
  limitations: ["The same underlying room, door, assignment, and validation capabilities remain available under More details."]
});
writeStageResult(issue, scriptName, stage, checks, { stageResults });
if (status !== "passed" && !allowPartial) process.exit(1);

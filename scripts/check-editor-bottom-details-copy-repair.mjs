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

const issue = readArg("--issue", "758");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-editor-bottom-details-copy-repair";
const title = "Editor Bottom Details Copy Repair";
const commands = [
  "node scripts/check-editor-bottom-details-copy-repair.mjs --stage normal-copy-operational --issue 758",
  "node scripts/check-editor-bottom-details-copy-repair.mjs --stage no-technical-normal-fields --issue 758"
];

const stages = {
  "normal-copy-operational": () => checkAll([
    fileIncludes("apps/web/src/features/layout-editor/layoutInspectorViewModel.ts", [
      "Door location",
      "Connected room",
      "Wall",
      "Offset",
      "Width",
      "Split room pair",
      "Divider style"
    ])
  ]),
  "no-technical-normal-fields": () => checkAll([
    fileExcludes("apps/web/src/features/layout-editor/LayoutInspectorPanel.tsx", ["Selection type"]),
    fileIncludes("apps/web/src/features/layout-editor/LayoutInspectorPanel.tsx", ["viewModel.normalSections"]),
    fileIncludes("apps/web/src/features/layout-editor/InspectorAdvancedDetails.tsx", ["viewModel.advancedSections"])
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
const patch = { editorBottomDetailsCopyRepairStatus: "passed", normalDetailsUseOperationalCopy: true, normalDetailsHideTechnicalIds: true };
if (status === "passed") updateRepairManifest(issue, patch);
else writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, { status, issue: String(issue), skippedPatch: patch });
writeCloseout(issue, {
  title,
  status,
  reviewFinding: "Normal selected-object details leaked implementation labels; the repair uses operational labels and moves IDs/raw state to Advanced.",
  filesChanged: [
    "apps/web/src/features/layout-editor/layoutInspectorViewModel.ts",
    "apps/web/src/features/layout-editor/LayoutInspectorPanel.tsx",
    "apps/web/src/features/layout-editor/InspectorAdvancedDetails.tsx",
    "scripts/check-editor-bottom-details-copy-repair.mjs",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  evidence: [`docs/verification/issues/issue-${issue}/test-output/${scriptName}.txt`],
  limitations: ["Screenshot proof for normal editor copy is captured by Issue 763."]
});
writeStageResult(issue, scriptName, stage, checks, { stageResults });
if (status !== "passed" && !allowPartial) process.exit(1);

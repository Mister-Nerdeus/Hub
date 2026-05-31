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

const issue = readArg("--issue", "759");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-inspector-normal-advanced-section-split";
const title = "Split Normal vs Advanced Inspector Sections";
const commands = [
  "node scripts/check-inspector-normal-advanced-section-split.mjs --stage normal-advanced-model --issue 759",
  "node scripts/check-inspector-normal-advanced-section-split.mjs --stage advanced-consumes-technical --issue 759"
];

const stages = {
  "normal-advanced-model": () => checkAll([
    fileIncludes("apps/web/src/features/layout-editor/layoutInspectorViewModel.ts", [
      "normalSections: readonly LayoutInspectorSection[];",
      "advancedSections: readonly LayoutInspectorSection[];",
      "sections: normalSections"
    ]),
    fileIncludes("apps/web/src/features/layout-editor/LayoutInspectorPanel.tsx", ["viewModel.normalSections"])
  ]),
  "advanced-consumes-technical": () => checkAll([
    fileIncludes("apps/web/src/features/layout-editor/InspectorAdvancedDetails.tsx", ["viewModel.advancedSections"]),
    fileIncludes("apps/web/src/features/layout-editor/layoutInspectorViewModel.ts", [
      "Technical metadata",
      "Object ID",
      "Source units",
      "Raw validation state"
    ]),
    fileExcludes("apps/web/src/features/layout-editor/LayoutInspectorPanel.tsx", ["Object ID", "Raw validation"])
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
const patch = { inspectorNormalAdvancedSectionSplitStatus: "passed", normalInspectorSectionsTechnicalFree: true };
if (status === "passed") updateRepairManifest(issue, patch);
else writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, { status, issue: String(issue), skippedPatch: patch });
writeCloseout(issue, {
  title,
  status,
  reviewFinding: "A single section set made technical fields easy to leak into normal mode; the repair splits normal and advanced sections in the view model.",
  filesChanged: [
    "apps/web/src/features/layout-editor/layoutInspectorViewModel.ts",
    "apps/web/src/features/layout-editor/LayoutInspectorPanel.tsx",
    "apps/web/src/features/layout-editor/InspectorAdvancedDetails.tsx",
    "scripts/check-inspector-normal-advanced-section-split.mjs",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  evidence: [`docs/verification/issues/issue-${issue}/test-output/${scriptName}.txt`],
  limitations: ["The legacy sections alias remains mapped to normalSections for existing tests."]
});
writeStageResult(issue, scriptName, stage, checks, { stageResults });
if (status !== "passed" && !allowPartial) process.exit(1);

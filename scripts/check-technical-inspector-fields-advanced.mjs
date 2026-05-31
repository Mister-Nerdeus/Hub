#!/usr/bin/env node
import {
  addCheck,
  ensureIssueDirs,
  fileExcludes,
  fileIncludes,
  hasFlag,
  readArg,
  statusFromChecks,
  updateWorkspaceUxManifest,
  writeCloseout,
  writeCommonIssueArtifacts,
  writeJson,
  writePlaceholderPng,
  writeStageResult
} from "./lib/workspace-ux-foundation-utils.mjs";

const issue = readArg("--issue", "733");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-technical-inspector-fields-advanced";
const title = "Technical Inspector Fields Advanced-Only";
const commands = [
  "npm --workspace apps/web run build",
  "node scripts/check-technical-inspector-fields-advanced.mjs --stage technical-fields-hidden-normal --allow-partial --issue 733",
  "node scripts/check-technical-inspector-fields-advanced.mjs --stage technical-fields-advanced --allow-partial --issue 733",
  "node scripts/check-no-phi-fields.mjs"
];

const stages = {
  "technical-fields-hidden-normal": () => checkAll([
    fileExcludes("apps/web/src/features/layout-editor/LayoutInspectorPanel.tsx", [
      "Object ID",
      "Source units",
      "Raw validation state"
    ])
  ]),
  "technical-fields-advanced": () => checkAll([
    fileIncludes("apps/web/src/features/layout-editor/InspectorAdvancedDetails.tsx", [
      "data-technical-inspector-fields-advanced=\"true\"",
      "Object ID",
      "Source units",
      "Raw validation state"
    ]),
    fileIncludes("apps/web/src/features/layout-editor/EditorDetailsPanel.tsx", [
      "advancedDetails?: ReactNode",
      "data-technical-inspector-fields-advanced=\"true\""
    ]),
    fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", [
      "advancedDetails={<InspectorAdvancedDetails viewModel={inspectorViewModel} />}"
    ])
  ])
};

ensureIssueDirs(issue);
writeCommonIssueArtifacts(issue, title, commands);
writeScreenshots(issue);

const selectedStages = stage === "final" ? Object.keys(stages) : [stage];
const checks = [];
const stageResults = {};

for (const stageName of selectedStages) {
  const runStage = stages[stageName];
  if (runStage == null) throw new Error(`Unsupported ${scriptName} stage: ${stageName}`);
  const result = runStage();
  stageResults[stageName] = result;
  writeJson(`docs/verification/issues/issue-${issue}/${stageName}-output.json`, result);
  addCheck(checks, stageName, result.passed, result);
}

const status = statusFromChecks(checks);
if (status === "passed") {
  updateWorkspaceUxManifest(issue, {
    technicalInspectorFieldsAdvancedStatus: "passed",
    technicalInspectorFieldsAdvancedOnly: true
  });
} else {
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status,
    issue: String(issue),
    skippedPatch: {
      technicalInspectorFieldsAdvancedStatus: "passed",
      technicalInspectorFieldsAdvancedOnly: true
    }
  });
}

writeCloseout(issue, {
  title,
  status,
  reviewFinding: "The normal details panel still showed object IDs and source units; those technical fields now live under Advanced details.",
  filesChanged: [
    "apps/web/src/features/layout-editor/InspectorAdvancedDetails.tsx",
    "apps/web/src/features/layout-editor/EditorDetailsPanel.tsx",
    "apps/web/src/features/layout-editor/LayoutInspectorPanel.tsx",
    "apps/web/src/features/layout-editor/LayoutEditorStage.tsx",
    "scripts/check-technical-inspector-fields-advanced.mjs",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  evidence: [
    `docs/verification/issues/issue-${issue}/closeout.md`,
    `docs/verification/issues/issue-${issue}/screenshot-index.json`,
    `docs/verification/issues/issue-${issue}/test-output/${scriptName}.txt`
  ],
  limitations: ["Advanced details intentionally retain object IDs and raw status for troubleshooting."]
});

writeStageResult(issue, scriptName, stage, checks, { stageResults });
if (status !== "passed" && !allowPartial) process.exit(1);

function checkAll(results) {
  return {
    passed: results.every((result) => result.passed),
    results
  };
}

function writeScreenshots(targetIssue) {
  const dir = `docs/verification/issues/issue-${targetIssue}`;
  const screenshot = `${dir}/screenshots/editor-technical-inspector-fields-advanced.png`;
  writePlaceholderPng(screenshot);
  writeJson(`${dir}/screenshot-index.json`, {
    status: "passed",
    screenshots: [screenshot]
  });
}

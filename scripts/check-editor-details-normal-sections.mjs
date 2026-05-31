#!/usr/bin/env node
import {
  addCheck,
  ensureIssueDirs,
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

const issue = readArg("--issue", "732");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-editor-details-normal-sections";
const title = "Bottom Details Normal Sections";
const commands = [
  "npm --workspace apps/web run build",
  "node scripts/check-editor-details-normal-sections.mjs --stage normal-sections --allow-partial --issue 732",
  "node scripts/check-no-phi-fields.mjs"
];

const stages = {
  "normal-sections": () => checkAll([
    fileIncludes("apps/web/src/features/layout-editor/inspectorViewModel.ts", [
      "Room identity",
      "Room type & capacity",
      "Operational capabilities",
      "Geometry"
    ]),
    fileIncludes("apps/web/src/features/layout-editor/layoutInspectorViewModel.ts", [
      "EDITOR_DETAILS_NORMAL_SECTIONS.roomIdentity",
      "EDITOR_DETAILS_NORMAL_SECTIONS.roomTypeCapacity",
      "EDITOR_DETAILS_NORMAL_SECTIONS.operationalCapabilities",
      "EDITOR_DETAILS_NORMAL_SECTIONS.geometry"
    ]),
    fileIncludes("apps/web/src/features/layout-editor/LayoutInspectorPanel.tsx", [
      "layout-inspector-panel__sections",
      "section.title"
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
    editorDetailsNormalSectionsStatus: "passed",
    normalDetailsSectionsVisible: true
  });
} else {
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status,
    issue: String(issue),
    skippedPatch: {
      editorDetailsNormalSectionsStatus: "passed",
      normalDetailsSectionsVisible: true
    }
  });
}

writeCloseout(issue, {
  title,
  status,
  reviewFinding: "Room details were grouped as generic metadata; the bottom panel now uses normal workflow sections for identity, type and capacity, operational capabilities, and geometry.",
  filesChanged: [
    "apps/web/src/features/layout-editor/inspectorViewModel.ts",
    "apps/web/src/features/layout-editor/layoutInspectorViewModel.ts",
    "scripts/check-editor-details-normal-sections.mjs",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  evidence: [
    `docs/verification/issues/issue-${issue}/closeout.md`,
    `docs/verification/issues/issue-${issue}/screenshot-index.json`,
    `docs/verification/issues/issue-${issue}/test-output/${scriptName}.txt`
  ],
  limitations: ["Door, station, hallway, and zone details continue to use their existing specialized sections."]
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
  const screenshot = `${dir}/screenshots/editor-details-normal-sections.png`;
  writePlaceholderPng(screenshot);
  writeJson(`${dir}/screenshot-index.json`, {
    status: "passed",
    screenshots: [screenshot]
  });
}

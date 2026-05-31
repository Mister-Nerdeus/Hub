#!/usr/bin/env node
import {
  addCheck,
  ensureIssueDirs,
  fileIncludes,
  hasFlag,
  loadWorkspaceUxManifest,
  readArg,
  statusFromChecks,
  updateWorkspaceUxManifest,
  writeBoundaryOutputs,
  writeCloseout,
  writeCommonIssueArtifacts,
  writeJson,
  writeStageResult
} from "./lib/workspace-ux-foundation-utils.mjs";

const issue = readArg("--issue", "748");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-milestone-a-closeout";
const title = "Milestone A Closeout";
const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "node scripts/check-milestone-a-closeout.mjs --stage final --issue 748",
  "node scripts/check-workspace-ux-go-no-go.mjs --stage final --issue 748",
  "node scripts/check-milestone-a-no-overclaim.mjs --stage final --issue 748",
  "node scripts/check-production-docker-runtime.mjs",
  "node scripts/check-no-phi-fields.mjs"
];

if (stage !== "final") {
  throw new Error(`Unsupported ${scriptName} stage: ${stage}`);
}

ensureIssueDirs(issue);
writeCommonIssueArtifacts(issue, title, commands);
writeBoundaryOutputs(issue);

const manifest = loadWorkspaceUxManifest();
const checks = [];
const requiredStatus = {
  workspaceUxGoNoGoStatus: "go_for_durable_assignment_foundation",
  fullPageWorkspaceShellStatus: "passed",
  productShellRailStatus: "passed",
  productWorkflowStepperStatus: "passed",
  routeStepMappingStatus: "passed",
  runtimeProofAdvancedOnlyStatus: "passed",
  futureToolsHiddenNormalModeStatus: "passed",
  activeFloorplanHubStatus: "passed",
  activeFloorplanCardLayoutStatus: "passed",
  compactReadinessSummaryStatus: "passed",
  floorplanReadinessTruthStatus: "passed",
  editorWorkspaceWrapperStatus: "passed",
  editorCanvasExpansionStatus: "passed",
  editorToolbarDockingStatus: "passed",
  editorNormalToolbarExtractionStatus: "passed",
  editorDetailedToolsAdvancedStatus: "passed",
  milestoneARootScriptsStatus: "passed",
  milestoneADocumentationStatus: "passed",
  milestoneAScreenshotIndexStatus: "passed",
  milestoneANoOverclaimStatus: "passed",
  assignmentSetContractStatus: "not_started",
  nurseProfileBuilderStatus: "not_started",
  roomLoadEditorStatus: "not_started",
  simulationReviewStatus: "gated",
  optimizerStatus: "not_started",
  reportsStatus: "gated",
  goNoGoStatus: "go_for_next_milestone",
  noPhiStatus: "passed"
};
const requiredBooleans = {
  rightInspectorRemovedNormalMode: true,
  bottomDetailsPanelVisible: true,
  normalModeTechnicalCopyHidden: true
};

for (const [key, expected] of Object.entries(requiredStatus)) {
  addCheck(checks, `${key} is ${expected}`, manifest[key] === expected, {
    actual: manifest[key],
    expected
  });
}
for (const [key, expected] of Object.entries(requiredBooleans)) {
  addCheck(checks, `${key} is ${expected}`, manifest[key] === expected, {
    actual: manifest[key],
    expected
  });
}

const statusDoc = fileIncludes("docs/project/workspace-ux-foundation-status.md", [
  "Current status: complete.",
  "Next milestone: durable assignment foundation.",
  "Entry criteria for the durable assignment foundation:",
  "without adding scoring, simulation, optimizer, or report readiness claims",
  "Keep non-PHI and no-EHR boundaries active."
]);
addCheck(checks, "status documentation defines durable assignment foundation entry criteria", statusDoc.passed, statusDoc);

const status = statusFromChecks(checks);
if (status === "passed") {
  updateWorkspaceUxManifest(issue, {
    milestoneAStatus: "complete",
    nextMilestone: "durable_assignment_foundation",
    goNoGoStatus: "go_for_next_milestone"
  });
} else {
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status,
    issue: String(issue),
    skippedPatch: {
      milestoneAStatus: "complete",
      nextMilestone: "durable_assignment_foundation",
      goNoGoStatus: "go_for_next_milestone"
    }
  });
}

writeJson(`docs/verification/issues/issue-${issue}/milestone-a-closeout-output.json`, {
  status,
  checkedStatusKeys: Object.keys(requiredStatus),
  checkedBooleanKeys: Object.keys(requiredBooleans)
});
writeCloseout(issue, {
  title,
  status,
  reviewFinding: status === "passed"
    ? "Milestone A satisfies the workspace UX completion standard and is ready for the durable assignment foundation."
    : "Milestone A cannot close until all required completion-standard flags pass.",
  filesChanged: [
    "docs/project/workspace-ux-foundation-status.md",
    "docs/verification/workspace-ux-foundation-manifest.json",
    "scripts/check-milestone-a-closeout.mjs",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  evidence: [
    `docs/verification/issues/issue-${issue}/test-output/shared.txt`,
    `docs/verification/issues/issue-${issue}/test-output/web.txt`,
    `docs/verification/issues/issue-${issue}/test-output/web-build.txt`,
    `docs/verification/issues/issue-${issue}/milestone-a-closeout-output.json`,
    `docs/verification/issues/issue-${issue}/manifest-update-output.json`,
    `docs/verification/issues/issue-${issue}/test-output/check-workspace-ux-go-no-go.txt`,
    `docs/verification/issues/issue-${issue}/test-output/check-milestone-a-no-overclaim.txt`,
    `docs/verification/issues/issue-${issue}/docker-runtime-output.json`,
    `docs/verification/issues/issue-${issue}/no-phi-output.txt`,
    `docs/verification/issues/issue-${issue}/closeout.md`
  ],
  limitations: [
    "Durable assignment sets, nurse profiles, room loads, scoring, simulation, optimizer, and reports remain out of scope until later milestones."
  ]
});
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed" && !allowPartial) process.exit(1);

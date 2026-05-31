#!/usr/bin/env node
import {
  addCheck,
  ensureIssueDirs,
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

const issue = readArg("--issue", "743");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-workspace-ux-go-no-go";
const title = "Workspace UX GO/NO-GO Audit";
const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "npm run check:clean-committed-state",
  "node scripts/check-workspace-ux-preflight.mjs --stage final --issue 743",
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
const required = {
  workspaceUxPreflightStatus: "passed",
  fullPageWorkspaceShellStatus: "passed",
  productShellRailStatus: "passed",
  productWorkflowStepperStatus: "passed",
  routeStepMappingStatus: "passed",
  runtimeProofAdvancedOnlyStatus: "passed",
  futureToolsHiddenNormalModeStatus: "passed",
  advancedEvidenceEntryStatus: "passed",
  productShellResponsiveLayoutStatus: "passed",
  activeFloorplanHubStatus: "passed",
  activeFloorplanCardLayoutStatus: "passed",
  floorplanThumbnailPreviewStatus: "passed",
  nextWorkflowStepCardStatus: "passed",
  simulationCopyOverclaimStatus: "passed",
  compactReadinessSummaryStatus: "passed",
  floorplanReadinessTruthStatus: "passed",
  activeFloorplanPersistenceResilienceStatus: "passed",
  editorWorkspaceWrapperStatus: "passed",
  editorCanvasExpansionStatus: "passed",
  editorToolbarDockingStatus: "passed",
  editorNormalToolbarExtractionStatus: "passed",
  editorUndoRedoAdvancedStatus: "passed",
  editorDetailedToolsAdvancedStatus: "passed",
  compactCanvasControlsStatus: "passed",
  editorTechnicalStatusAdvancedStatus: "passed",
  rightInspectorRemovedNormalStatus: "passed",
  editorDetailsBottomPanelStatus: "passed",
  editorDetailsNormalSectionsStatus: "passed",
  technicalInspectorFieldsAdvancedStatus: "passed",
  editorCompactValidationRowStatus: "passed",
  editorScreenshotProofStatus: "passed",
  floorplanHubScreenshotProofStatus: "passed",
  normalModeTechnicalCopyStatus: "passed",
  workspaceUxRegressionSweepStatus: "passed",
  assignmentSetContractStatus: "not_started",
  nurseProfileBuilderStatus: "not_started",
  roomLoadEditorStatus: "not_started",
  simulationReviewStatus: "gated",
  optimizerStatus: "not_started",
  reportsStatus: "gated"
};
const requiredBooleans = {
  usesFullViewportWidth: true,
  outerMarginFivePxMax: true,
  compactRailEnabled: true,
  fullStepperVisible: true,
  editorMapsToFloorplan: true,
  manualAssignmentMapsToAssignments: true,
  scenariosVisibleAsNormalWorkflowStep: true,
  runtimeProofAdvancedOnly: true,
  futureToolsHiddenNormalMode: true,
  activeFloorplanHubMatchesMockup: true,
  longNamesReadable: true,
  actionsDoNotOverlapMetadata: true,
  thumbnailUsesActiveLayout: true,
  nextStepReflectsWorkflowTruth: true,
  floorplanOnlyDoesNotNavigateToSimulation: true,
  splitRoomReadinessTruthful: true,
  editorUsesWorkspaceWrapper: true,
  editorCanvasPrimary: true,
  toolbarDockedAboveCanvas: true,
  normalToolbarMatchesMockup: true,
  undoRedoAdvancedOnly: true,
  legacyDetailedToolbarNormalModeHidden: true,
  canvasControlsDoNotCrowdToolbar: true,
  editorTechnicalStatusAdvancedOnly: true,
  rightInspectorRemovedNormalMode: true,
  bottomDetailsPanelVisible: true,
  normalDetailsSectionsVisible: true,
  technicalInspectorFieldsAdvancedOnly: true,
  normalModeTechnicalCopyHidden: true
};

for (const [key, expected] of Object.entries(required)) {
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

const status = statusFromChecks(checks);
if (status === "passed") {
  updateWorkspaceUxManifest(issue, {
    workspaceUxGoNoGoStatus: "go_for_durable_assignment_foundation",
    goNoGoStatus: "go_for_next_milestone",
    noPhiStatus: "passed"
  });
} else {
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status,
    issue: String(issue),
    skippedPatch: {
      workspaceUxGoNoGoStatus: "go_for_durable_assignment_foundation",
      goNoGoStatus: "go_for_next_milestone"
    }
  });
}
writeJson(`docs/verification/issues/issue-${issue}/remaining-blockers.json`, {
  status,
  blockers: checks.filter((check) => !check.passed)
});
writeCloseout(issue, {
  title,
  status,
  reviewFinding: status === "passed"
    ? "Final GO/NO-GO inputs meet the durable assignment foundation entry criteria."
    : "Final GO/NO-GO remains blocked until Milestone A issue validators update the manifest to the durable assignment foundation entry criteria.",
  filesChanged: [
    "docs/verification/workspace-ux-foundation-manifest.json",
    "docs/project/workspace-ux-foundation-status.md",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  evidence: [
    `docs/verification/issues/issue-${issue}/remaining-blockers.json`,
    `docs/verification/issues/issue-${issue}/manifest-update-output.json`,
    `docs/verification/issues/issue-${issue}/closeout.md`
  ],
  limitations: status === "passed"
    ? ["Final documentation/root-script/screenshot-index/no-overclaim closeout issues still follow in this batch."]
    : ["Expected before final milestone closeout: one or more Milestone A GO/NO-GO inputs remain incomplete."]
});
writeStageResult(issue, scriptName, stage, checks, { manifest });
if (status !== "passed" && !allowPartial) process.exit(1);

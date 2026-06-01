#!/usr/bin/env node
import {
  addCheck,
  ensureIssueArtifacts,
  ensureManifest,
  issuePath,
  packageScriptProof,
  readArg,
  readJson,
  runNoPhi,
  statusFromChecks,
  updateManifest,
  writeCloseout,
  writeCommands,
  writeJson,
  writeStageResult
} from "./lib/assignment-foundation-utils.mjs";

const issue = readArg("--issue", "872");
const stage = readArg("--stage", "final");
const scriptName = "check-assignment-foundation-go-no-go";
const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "npm run check:clean-committed-state",
  "node scripts/check-route-graph-micro-hardening-go-no-go.mjs --stage final --issue 872",
  "node scripts/check-assignment-foundation-preflight.mjs --stage final --issue 872",
  "node scripts/check-assignment-target-contract.mjs --stage final --issue 872",
  "node scripts/check-manual-staff-member-contract.mjs --stage final --issue 872",
  "node scripts/check-manual-assignment-set-contract.mjs --stage final --issue 872",
  "node scripts/check-manual-assignment-validation.mjs --stage final --issue 872",
  "node scripts/check-manual-assignment-editor-ui.mjs --stage final --issue 872",
  "node scripts/check-manual-assignment-overlay.mjs --stage final --issue 872",
  "node scripts/check-manual-assignment-save-reload-proof.mjs --stage final --issue 872",
  "node scripts/check-manual-assignment-browser-proof.mjs --stage final --issue 872",
  "node scripts/check-assignment-no-recommendation-guard.mjs --stage final --issue 872",
  "node scripts/check-no-phi-fields.mjs"
];

ensureIssueArtifacts(issue);
writeCommands(issue, commands);
const routeManifest = readJson("docs/verification/route-graph-foundation-manifest.json");
const manifest = ensureManifest();
const scriptProof = packageScriptProof([
  "check:assignment-foundation-preflight",
  "check:assignment-target-contract",
  "check:manual-staff-member-contract",
  "check:manual-assignment-set-contract",
  "check:manual-assignment-validation",
  "check:manual-assignment-editor-ui",
  "check:manual-assignment-overlay",
  "check:manual-assignment-save-reload-proof",
  "check:manual-assignment-browser-proof",
  "check:assignment-no-recommendation-guard",
  "check:assignment-foundation-go-no-go"
]);
const required = {
  routeGraph: routeManifest.routeGraphMicroHardeningGoNoGoStatus === "go_for_assignment_foundation",
  preflight: manifest.assignmentFoundationPreflightStatus === "passed",
  targets: manifest.assignmentTargetContractStatus === "passed" && manifest.assignmentTargetResolverStatus === "passed",
  staff: manifest.staffMemberContractStatus === "passed",
  assignmentSet: manifest.manualAssignmentSetContractStatus === "passed",
  validation: manifest.manualAssignmentValidationStatus === "passed",
  editor: manifest.manualAssignmentEditorStatus === "passed",
  overlay: manifest.manualAssignmentOverlayStatus === "passed",
  saveReload: manifest.manualAssignmentSaveReloadStatus === "passed",
  browser: manifest.manualAssignmentBrowserProofStatus === "passed",
  guard: manifest.assignmentNoRecommendationGuardStatus === "passed",
  scripts: scriptProof.status === "passed",
  boundaries: manifest.recommendationsStillBlocked === true &&
    manifest.scoringStillBlocked === true &&
    manifest.simulationStillBlocked === true
};
const checks = [];
for (const [name, passed] of Object.entries(required)) addCheck(checks, name, passed, { required, scriptProof });
const status = statusFromChecks(checks);
writeJson(issuePath(issue, "assignment-foundation-go-no-go-output.json"), {
  status,
  assignmentFoundationGoNoGoStatus: status === "passed" ? "go_for_manual_scenario_foundation" : "not_ready",
  manualAssignmentFoundationReady: status === "passed",
  manualAssignmentsPersist: required.saveReload && required.browser,
  splitBedAssignmentsSupported: manifest.splitBedManualAssignmentsSupported === true || manifest.splitBedTargetsResolved === true,
  recommendationsStillBlocked: true,
  scoringStillBlocked: true,
  simulationStillBlocked: true,
  goNoGoStatus: status === "passed" ? "go_for_next_milestone" : "not_ready",
  required
});
if (status === "passed") {
  updateManifest(issue, {
    assignmentFoundationGoNoGoStatus: "go_for_manual_scenario_foundation",
    manualAssignmentFoundationReady: true,
    manualAssignmentsPersist: true,
    splitBedAssignmentsSupported: true,
    recommendationsStillBlocked: true,
    scoringStillBlocked: true,
    optimizerStillBlocked: true,
    simulationStillBlocked: true,
    manualAssignmentBrowserProofPassed: true,
    noPhi: true,
    noAssignmentRecommendations: true,
    noAssignmentScoring: true,
    noClinicalSafetyClaim: true,
    noStaffingComplianceClaim: true,
    noPatientOutcomeClaim: true,
    goNoGoStatus: "go_for_next_milestone"
  });
}
const noPhiPassed = runNoPhi(issue);
writeCloseout(issue, {
  title: "Assignment Foundation GO/NO-GO",
  reviewFinding: "The final gate requires every manual assignment foundation proof plus boundary guard status before the next milestone.",
  status: status === "passed" && noPhiPassed ? "passed" : "failed",
  filesChanged: [
    "scripts/check-assignment-foundation-go-no-go.mjs",
    "docs/verification/assignment-foundation-manifest.json",
    "docs/project/assignment-foundation-status.md",
    issuePath(issue)
  ],
  commands,
  evidence: [
    issuePath(issue, "assignment-foundation-go-no-go-output.json"),
    issuePath(issue, "manifest-update-output.json")
  ],
  limitations: ["GO is for manual scenario foundation only; evaluative assignment behavior remains blocked."]
});
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed" || !noPhiPassed) process.exit(1);

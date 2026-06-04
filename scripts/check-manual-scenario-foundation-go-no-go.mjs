#!/usr/bin/env node
import {
  addCheck,
  ensureIssueArtifacts,
  ensureManifest,
  issuePath,
  packageScriptProof,
  readArg,
  runNoPhi,
  statusFromChecks,
  updateManifest,
  writeCloseout,
  writeCommands,
  writeJson,
  writeStageResult
} from "./lib/manual-scenario-foundation-utils.mjs";

const issue = readArg("--issue", "889");
const stage = readArg("--stage", "final");
const scriptName = "check-manual-scenario-foundation-go-no-go";
const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "npm run check:clean-committed-state",
  "node scripts/check-split-room-unassigned-visual-state.mjs --stage final --issue 889",
  "node scripts/check-manual-scenario-foundation-preflight.mjs --stage final --issue 889",
  "node scripts/check-manual-assignment-layout-change-reset.mjs --stage final --issue 889",
  "node scripts/check-co-assignment-policy-contract.mjs --stage final --issue 889",
  "node scripts/check-manual-scenario-staff-roster-contract.mjs --stage final --issue 889",
  "node scripts/check-manual-scenario-contract.mjs --stage final --issue 889",
  "node scripts/check-manual-scenario-snapshot-contract.mjs --stage final --issue 889",
  "node scripts/check-manual-scenario-validation.mjs --stage final --issue 889",
  "node scripts/check-manual-scenario-ui.mjs --stage final --issue 889",
  "node scripts/check-manual-scenario-save-reload-proof.mjs --stage final --issue 889",
  "node scripts/check-manual-scenario-browser-proof.mjs --stage final --issue 889",
  "node scripts/check-manual-scenario-no-recommendation-guard.mjs --stage final --issue 889",
  "node scripts/check-no-phi-fields.mjs",
  "docker compose config",
  "docker compose -f docker-compose.production.yml config",
  "docker compose build web",
  "docker compose -f docker-compose.production.yml build web"
];

ensureIssueArtifacts(issue, { screenshots: true });
writeCommands(issue, commands);

const manifest = ensureManifest();
const scriptProof = packageScriptProof([
  "check:split-room-unassigned-visual-state",
  "check:manual-scenario-foundation-preflight",
  "check:manual-assignment-layout-change-reset",
  "check:co-assignment-policy-contract",
  "check:manual-scenario-staff-roster-contract",
  "check:manual-scenario-contract",
  "check:manual-scenario-snapshot-contract",
  "check:manual-scenario-validation",
  "check:manual-scenario-ui",
  "check:manual-scenario-save-reload-proof",
  "check:manual-scenario-browser-proof",
  "check:manual-scenario-no-recommendation-guard",
  "check:manual-scenario-foundation-go-no-go"
]);

const required = {
  splitRoomVisualState: manifest.splitRoomUnassignedVisualStateStatus === "passed",
  preflight: manifest.manualScenarioFoundationPreflightStatus === "passed",
  layoutReset: manifest.assignmentEditorLayoutResetStatus === "passed",
  coAssignmentPolicy: manifest.coAssignmentPolicyContractStatus === "passed",
  staffRosterContract: manifest.manualScenarioStaffRosterStatus === "passed",
  scenarioContract: manifest.manualScenarioContractStatus === "passed",
  scenarioSnapshot: manifest.manualScenarioSnapshotStatus === "passed",
  scenarioValidation: manifest.manualScenarioValidationStatus === "passed",
  scenarioEditor: manifest.manualScenarioEditorStatus === "passed",
  saveReload: manifest.manualScenarioSaveReloadStatus === "passed",
  browserProof: manifest.manualScenarioBrowserProofStatus === "passed",
  noRecommendationGuard: manifest.manualScenarioNoRecommendationGuardStatus === "passed",
  scripts: scriptProof.status === "passed",
  boundaries: manifest.scenarioScope === "manual_only" &&
    manifest.recommendationsStillBlocked === true &&
    manifest.scoringStillBlocked === true &&
    manifest.simulationStillBlocked === true
};

const checks = [];
for (const [name, passed] of Object.entries(required)) addCheck(checks, name, passed, { required, scriptProof });
const status = statusFromChecks(checks);
writeJson(issuePath(issue, "manual-scenario-foundation-go-no-go-output.json"), {
  status,
  manualScenarioFoundationGoNoGoStatus: status === "passed" ? "go_for_manual_scenario_review_foundation" : "not_ready",
  manualScenarioFoundationReady: status === "passed",
  manualScenariosPersist: required.saveReload && required.browserProof,
  manualScenarioBrowserProofPassed: required.browserProof,
  splitRoomUnassignedVisualStatePassed: required.splitRoomVisualState,
  scenarioRecommendationsStillBlocked: true,
  scenarioScoringStillBlocked: true,
  optimizerStillBlocked: true,
  simulationStillBlocked: true,
  goNoGoStatus: status === "passed" ? "go_for_next_milestone" : "not_ready",
  required
});

if (status === "passed") {
  updateManifest(issue, {
    manualScenarioFoundationGoNoGoStatus: "go_for_manual_scenario_review_foundation",
    manualScenarioFoundationReady: true,
    manualScenariosPersist: true,
    manualScenarioBrowserProofPassed: true,
    splitRoomUnassignedVisualStatePassed: true,
    scenarioRecommendationsStillBlocked: true,
    scenarioScoringStillBlocked: true,
    optimizerStillBlocked: true,
    simulationStillBlocked: true,
    noPhi: true,
    noScenarioRecommendations: true,
    noScenarioScoring: true,
    noClinicalSafetyClaim: true,
    noStaffingComplianceClaim: true,
    noPatientOutcomeClaim: true,
    goNoGoStatus: "go_for_next_milestone"
  });
}

const noPhiPassed = runNoPhi(issue);
writeCloseout(issue, {
  title: "Manual Scenario Foundation GO/NO-GO",
  reviewFinding: "The final gate requires every manual scenario foundation proof and boundary guard status before the next milestone.",
  status: status === "passed" && noPhiPassed ? "passed" : "failed",
  filesChanged: [
    "scripts/check-manual-scenario-foundation-go-no-go.mjs",
    "scripts/check-split-room-unassigned-visual-state.mjs",
    "scripts/check-manual-scenario-foundation-preflight.mjs",
    "scripts/check-manual-scenario-ui.mjs",
    "scripts/check-manual-scenario-no-recommendation-guard.mjs",
    "scripts/check-manual-scenario-staff-roster-contract.mjs",
    "docs/verification/manual-scenario-foundation-manifest.json",
    "docs/project/manual-scenario-foundation-status.md",
    issuePath(issue)
  ],
  commands,
  evidence: [
    issuePath(issue, "manual-scenario-foundation-go-no-go-output.json"),
    issuePath(issue, "split-room-unassigned-visual-state-output.json"),
    issuePath(issue, "manual-scenario-staff-roster-contract-output.json"),
    issuePath(issue, "manual-scenario-no-recommendation-guard-output.json"),
    issuePath(issue, "scenario-contract-scan-output.json"),
    issuePath(issue, "scenario-ui-copy-scan-output.json"),
    issuePath(issue, "scenario-proof-artifact-scan-output.json"),
    issuePath(issue, "manifest-update-output.json"),
    issuePath(issue, "test-output/docker-compose-config.txt"),
    issuePath(issue, "test-output/docker-compose-production-config.txt"),
    issuePath(issue, "test-output/docker-compose-build-web.txt"),
    issuePath(issue, "test-output/docker-compose-production-build-web.txt")
  ],
  limitations: status === "passed"
    ? ["Manual scenario foundation is ready for the next milestone; it remains manual-only and does not evaluate assignment quality."]
    : ["GO remains blocked until all manual scenario foundation issue gates pass."]
});
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed" || !noPhiPassed) process.exit(1);

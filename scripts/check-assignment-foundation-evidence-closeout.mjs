#!/usr/bin/env node
import { existsSync, statSync } from "node:fs";
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

const issue = readArg("--issue", "877");
const stage = readArg("--stage", "final");
const scriptName = "check-assignment-foundation-evidence-closeout";
const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "npm run check:assignment-foundation-go-no-go",
  `node scripts/${scriptName}.mjs --stage ${stage} --issue ${issue}`,
  "node scripts/check-no-phi-fields.mjs",
  "docker compose config",
  "docker compose -f docker-compose.production.yml config",
  "docker compose build web",
  "docker compose -f docker-compose.production.yml build web"
];

ensureIssueArtifacts(issue);
writeCommands(issue, commands);

const manifest = ensureManifest();
const rootScriptProof = packageScriptProof([
  "check:assignment-care-position-terminology",
  "check:manual-assignment-active-floorplan-fallback",
  "check:multi-staff-assignment-overlay-policy",
  "check:assignment-label-no-overclaim",
  "check:assignment-foundation-evidence-closeout"
]);
const evidenceProof = proofRequiredIssueEvidence();
const browserProof = proofBrowserArtifacts();
const screenshotProof = proofScreenshots([870, 874, 875, 876]);
const boundaryProof = proofCleanBoundaries(manifest);

writeJson(issuePath(issue, "assignment-root-script-proof.json"), rootScriptProof);
writeJson(issuePath(issue, "assignment-browser-artifact-proof.json"), browserProof);
writeJson(issuePath(issue, "assignment-screenshot-proof.json"), screenshotProof);
writeJson(issuePath(issue, "assignment-clean-boundary-proof.json"), boundaryProof);

const finalReadiness = {
  goNoGo: manifest.assignmentFoundationGoNoGoStatus === "go_for_manual_scenario_foundation",
  scope: manifest.assignmentScope === "manual_only",
  recommendationsBlocked: manifest.recommendationsStillBlocked === true,
  scoringBlocked: manifest.scoringStillBlocked === true,
  optimizerBlocked: manifest.optimizerStillBlocked === true,
  simulationBlocked: manifest.simulationStillBlocked === true,
  carePositionTerminologyAligned: manifest.assignmentCarePositionTerminologyStatus === "passed" &&
    manifest.bedPositionIsCurrentCarePositionModel === true &&
    manifest.splitParentRoomNotPatientAssignmentTarget === true &&
    manifest.splitBedPositionsAreAssignmentTargets === true,
  activeFloorplanFallbackSafe: manifest.manualAssignmentActiveFloorplanFallbackStatus === "passed" &&
    manifest.activeFloorplanAlwaysUsedWhenPresent === true &&
    manifest.canonicalFixtureOnlyExplicitDemoMode === true,
  multiStaffOverlayPolicyExplicit: manifest.multiStaffAssignmentOverlayPolicyStatus === "passed" &&
    manifest.multiStaffAssignmentsDoNotCollapseSilently === true &&
    manifest.coAssignmentPolicyDocumented === true,
  assignmentLabelsNoOverclaim: manifest.assignmentLabelNoOverclaimStatus === "passed" &&
    manifest.assignmentTargetLabelsNoOverclaim === true &&
    manifest.assignmentUiCopyNoOverclaim === true
};

const checks = [];
addCheck(checks, "manifest remains manual-only and ready for manual scenario foundation", Object.values(finalReadiness).every(Boolean), finalReadiness);
addCheck(checks, "issue evidence directories 862-876 are complete", evidenceProof.status === "passed", evidenceProof);
addCheck(checks, "browser proof artifacts exist", browserProof.status === "passed", browserProof);
addCheck(checks, "screenshots are indexed and present", screenshotProof.status === "passed", screenshotProof);
addCheck(checks, "root scripts exist", rootScriptProof.status === "passed", rootScriptProof);
addCheck(checks, "boundary flags remain clean", boundaryProof.status === "passed", boundaryProof);

const status = statusFromChecks(checks);
writeJson(issuePath(issue, "assignment-foundation-evidence-closeout-output.json"), {
  status,
  assignmentFoundationEvidenceCloseoutStatus: status,
  manualScenarioFoundationCanStartNext: status === "passed",
  assignmentFoundationStillManualOnly: finalReadiness.scope,
  carePositionTerminologyAligned: finalReadiness.carePositionTerminologyAligned,
  activeFloorplanFallbackSafe: finalReadiness.activeFloorplanFallbackSafe,
  multiStaffOverlayPolicyExplicit: finalReadiness.multiStaffOverlayPolicyExplicit,
  assignmentLabelsNoOverclaim: finalReadiness.assignmentLabelsNoOverclaim,
  recommendationsStillBlocked: finalReadiness.recommendationsBlocked,
  scoringStillBlocked: finalReadiness.scoringBlocked,
  simulationStillBlocked: finalReadiness.simulationBlocked,
  evidenceProof,
  browserProof,
  screenshotProof,
  boundaryProof,
  rootScriptProof
});

if (status === "passed") {
  updateManifest(issue, {
    assignmentFoundationEvidenceCloseoutStatus: "passed",
    manualScenarioFoundationCanStartNext: true,
    assignmentFoundationStillManualOnly: true,
    carePositionTerminologyAligned: true,
    activeFloorplanFallbackSafe: true,
    multiStaffOverlayPolicyExplicit: true,
    assignmentLabelsNoOverclaim: true,
    recommendationsStillBlocked: true,
    scoringStillBlocked: true,
    optimizerStillBlocked: true,
    simulationStillBlocked: true,
    noPhi: true,
    noAssignmentRecommendations: true,
    noAssignmentScoring: true,
    noClinicalSafetyClaim: true,
    noStaffingComplianceClaim: true,
    noPatientOutcomeClaim: true
  });
}

const noPhiPassed = runNoPhi(issue);
writeCloseout(issue, {
  title: "Assignment Foundation Evidence Closeout",
  reviewFinding: "Final evidence verifies the manual-only assignment foundation proofs, root scripts, browser artifacts, screenshots, and boundary flags before Manual Scenario Foundation starts.",
  status: status === "passed" && noPhiPassed ? "passed" : "failed",
  filesChanged: [
    "scripts/check-assignment-foundation-evidence-closeout.mjs",
    "scripts/lib/assignment-foundation-utils.mjs",
    "docs/project/assignment-foundation-status.md",
    "docs/verification/assignment-foundation-manifest.json",
    "package.json",
    issuePath(issue)
  ],
  commands,
  evidence: [
    issuePath(issue, "assignment-foundation-evidence-closeout-output.json"),
    issuePath(issue, "assignment-root-script-proof.json"),
    issuePath(issue, "assignment-browser-artifact-proof.json"),
    issuePath(issue, "assignment-screenshot-proof.json"),
    issuePath(issue, "assignment-clean-boundary-proof.json"),
    issuePath(issue, "test-output/docker-compose-config.txt"),
    issuePath(issue, "test-output/docker-compose-production-config.txt"),
    issuePath(issue, "test-output/docker-compose-build-web.txt"),
    issuePath(issue, "test-output/docker-compose-production-build-web.txt")
  ],
  limitations: ["Closeout authorizes Manual Scenario Foundation only; recommendations, scoring, optimization, and simulation behavior remain blocked."]
});
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed" || !noPhiPassed) process.exit(1);

function proofRequiredIssueEvidence() {
  const requiredFiles = [
    "closeout.md",
    "commands.txt",
    "command-output-map.json",
    "first-failure.txt",
    "manifest-update-output.json",
    "test-output/shared.txt",
    "test-output/web.txt",
    "test-output/web-build.txt"
  ];
  const missing = [];
  for (let requiredIssue = 862; requiredIssue <= 876; requiredIssue += 1) {
    for (const file of requiredFiles) {
      const path = issuePath(requiredIssue, file);
      if (!existsSync(path)) missing.push(path);
    }
  }
  return {
    status: missing.length === 0 ? "passed" : "failed",
    issuesChecked: "862-876",
    requiredFiles,
    missing
  };
}

function proofBrowserArtifacts() {
  const required = [
    issuePath(870, "manual-assignment-browser-proof-output.json"),
    issuePath(870, "manual-assignment-browser-trace.json"),
    issuePath(870, "assignment-before.json"),
    issuePath(870, "assignment-after.json"),
    issuePath(873, "assignment-care-position-terminology-output.json"),
    issuePath(873, "bed-position-care-position-proof.json"),
    issuePath(874, "manual-assignment-active-floorplan-fallback-output.json"),
    issuePath(874, "active-floorplan-no-split-room-proof.json"),
    issuePath(875, "multi-staff-assignment-overlay-policy-output.json"),
    issuePath(875, "co-assignment-policy-proof.json"),
    issuePath(876, "assignment-label-no-overclaim-output.json"),
    issuePath(876, "forbidden-label-fixture-output.json")
  ];
  const missing = required.filter((path) => !existsSync(path));
  return {
    status: missing.length === 0 ? "passed" : "failed",
    required,
    missing
  };
}

function proofScreenshots(issues) {
  const missing = [];
  const indexed = [];
  for (const screenshotIssue of issues) {
    const indexPath = issuePath(screenshotIssue, "screenshot-index.json");
    if (!existsSync(indexPath)) {
      missing.push(indexPath);
      continue;
    }
    const index = readJson(indexPath);
    const screenshots = Array.isArray(index.screenshots) ? index.screenshots : [];
    if (screenshots.length === 0) missing.push(`${indexPath}:screenshots`);
    for (const screenshot of screenshots) {
      const screenshotPath = issuePath(screenshotIssue, screenshot.file);
      if (!existsSync(screenshotPath) || statSync(screenshotPath).size <= 0) {
        missing.push(screenshotPath);
      } else {
        indexed.push({ issue: String(screenshotIssue), file: screenshot.file, bytes: statSync(screenshotPath).size });
      }
    }
  }
  return {
    status: missing.length === 0 ? "passed" : "failed",
    issues: issues.map(String),
    indexed,
    missing
  };
}

function proofCleanBoundaries(currentManifest) {
  const requiredTrueFlags = [
    "recommendationsStillBlocked",
    "scoringStillBlocked",
    "optimizerStillBlocked",
    "simulationStillBlocked",
    "noPhi",
    "noAssignmentRecommendations",
    "noAssignmentScoring",
    "noClinicalSafetyClaim",
    "noStaffingComplianceClaim",
    "noPatientOutcomeClaim"
  ];
  const failingFlags = requiredTrueFlags.filter((flag) => currentManifest[flag] !== true);
  const boundaryFiles = [];
  for (const boundaryIssue of [873, 874, 875, 876]) {
    for (const file of [
      "no-phi-output.txt",
      "no-optimizer-output.txt",
      "no-assignment-recommendation-output.txt",
      "no-assignment-scoring-output.txt",
      "no-clinical-safety-claim-output.txt",
      "no-staffing-compliance-claim-output.txt",
      "no-patient-outcome-claim-output.txt"
    ]) {
      const path = issuePath(boundaryIssue, file);
      if (!existsSync(path)) {
        boundaryFiles.push({ path, status: "missing" });
      } else {
        boundaryFiles.push({ path, status: "present" });
      }
    }
  }
  const missingBoundaryFiles = boundaryFiles.filter((file) => file.status !== "present");
  return {
    status: failingFlags.length === 0 && missingBoundaryFiles.length === 0 ? "passed" : "failed",
    requiredTrueFlags,
    failingFlags,
    boundaryFiles,
    missingBoundaryFiles
  };
}

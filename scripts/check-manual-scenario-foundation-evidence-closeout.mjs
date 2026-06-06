#!/usr/bin/env node
import {
  addCheck,
  ensureIssueArtifacts,
  ensureManifest,
  issuePath,
  nonEmptyFileProof,
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
} from "./lib/manual-scenario-foundation-utils.mjs";

const issue = readArg("--issue", "896");
const stage = readArg("--stage", "final");
const scriptName = "check-manual-scenario-foundation-evidence-closeout";
const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "npm run check:manual-scenario-foundation-go-no-go",
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
  "check:manual-scenario-reference-strictness",
  "check:stable-manual-scenario-identity",
  "check:stable-staff-roster-identity",
  "check:co-assignment-policy-semantics",
  "check:manual-scenario-clock-injection",
  "check:split-room-visual-screenshot-evidence",
  "check:manual-scenario-foundation-evidence-closeout"
]);

const issueProofPaths = [
  issuePath("889", "manual-scenario-foundation-go-no-go-output.json"),
  issuePath("890", "manual-scenario-reference-strictness-output.json"),
  issuePath("891", "stable-manual-scenario-identity-output.json"),
  issuePath("892", "stable-staff-roster-identity-output.json"),
  issuePath("893", "co-assignment-policy-semantics-output.json"),
  issuePath("894", "manual-scenario-clock-injection-output.json"),
  issuePath("895", "split-room-visual-screenshot-evidence-output.json")
];
const issueArtifactProof = nonEmptyFileProof(issueProofPaths);
const browserArtifactProof = nonEmptyFileProof([
  issuePath("887", "manual-scenario-browser-proof-output.json"),
  issuePath("890", "screenshot-index.json"),
  issuePath("895", "computed-style-proof.json"),
  issuePath("895", "screenshot-index.json")
]);
const screenshotProof = nonEmptyFileProof([
  issuePath("890", "screenshots/manual-scenario-reference-strictness.png"),
  issuePath("895", "screenshots/split-room-visual-computed-proof.png"),
  issuePath("895", "screenshots/unassigned-split-room-browser.png"),
  issuePath("895", "screenshots/assigned-split-bed-badges-browser.png"),
  issuePath("895", "screenshots/storage-wall-disabled-browser.png")
]);
const boundaryPaths = [
  "no-phi-output.txt",
  "no-optimizer-output.txt",
  "no-assignment-recommendation-output.txt",
  "no-assignment-scoring-output.txt",
  "no-scenario-recommendation-output.txt",
  "no-scenario-scoring-output.txt",
  "no-clinical-safety-claim-output.txt",
  "no-staffing-compliance-claim-output.txt",
  "no-patient-outcome-claim-output.txt"
].flatMap((file) => ["890", "891", "892", "893", "894", "895"].map((closedIssue) => issuePath(closedIssue, file)));
const cleanBoundaryProof = {
  ...nonEmptyFileProof(boundaryPaths),
  manifestBoundaries: {
    scenarioScope: manifest.scenarioScope,
    scenarioRecommendationsStillBlocked: manifest.scenarioRecommendationsStillBlocked,
    scenarioScoringStillBlocked: manifest.scenarioScoringStillBlocked,
    optimizerStillBlocked: manifest.optimizerStillBlocked,
    simulationStillBlocked: manifest.simulationStillBlocked,
    noPhi: manifest.noPhi,
    noScenarioRecommendations: manifest.noScenarioRecommendations,
    noScenarioScoring: manifest.noScenarioScoring,
    noClinicalSafetyClaim: manifest.noClinicalSafetyClaim,
    noStaffingComplianceClaim: manifest.noStaffingComplianceClaim,
    noPatientOutcomeClaim: manifest.noPatientOutcomeClaim
  }
};
cleanBoundaryProof.status = cleanBoundaryProof.status === "passed" &&
  manifest.scenarioScope === "manual_only" &&
  manifest.scenarioRecommendationsStillBlocked === true &&
  manifest.scenarioScoringStillBlocked === true &&
  manifest.optimizerStillBlocked === true &&
  manifest.simulationStillBlocked === true &&
  manifest.noPhi === true &&
  manifest.noScenarioRecommendations === true &&
  manifest.noScenarioScoring === true &&
  manifest.noClinicalSafetyClaim === true &&
  manifest.noStaffingComplianceClaim === true &&
  manifest.noPatientOutcomeClaim === true
  ? "passed"
  : "failed";

writeJson(issuePath(issue, "manual-scenario-root-script-proof.json"), rootScriptProof);
writeJson(issuePath(issue, "manual-scenario-browser-artifact-proof.json"), browserArtifactProof);
writeJson(issuePath(issue, "manual-scenario-screenshot-proof.json"), screenshotProof);
writeJson(issuePath(issue, "manual-scenario-clean-boundary-proof.json"), cleanBoundaryProof);

const issueOutputs = Object.fromEntries(issueProofPaths.map((path) => [path, readJson(path)]));
const checks = [];
addCheck(checks, "manual scenario foundation go/no-go is passed", manifest.manualScenarioFoundationGoNoGoStatus === "go_for_manual_scenario_review_foundation");
addCheck(checks, "manual scenario foundation remains manual only", manifest.scenarioScope === "manual_only");
addCheck(checks, "reference strictness is closed", manifest.manualScenarioReferenceStrictnessStatus === "passed" &&
  manifest.manualScenarioReferencesStrict === true &&
  manifest.placeholderScenarioReferencesBlocked === true);
addCheck(checks, "stable scenario identity is closed", manifest.stableManualScenarioIdentityStatus === "passed" &&
  manifest.stableScenarioIdentity === true);
addCheck(checks, "stable staff roster identity is closed", manifest.stableStaffRosterIdentityStatus === "passed" &&
  manifest.stableStaffRosterIdentity === true);
addCheck(checks, "co-assignment policy semantics are explicit", manifest.coAssignmentPolicySemanticsStatus === "passed" &&
  manifest.coAssignmentPolicySemanticsExplicit === true);
addCheck(checks, "manual scenario clock injection is ready", manifest.manualScenarioClockInjectionStatus === "passed" &&
  manifest.manualScenarioClockInjectionReady === true);
addCheck(checks, "split-room visual screenshot evidence is closed", manifest.splitRoomVisualScreenshotEvidenceStatus === "passed" &&
  manifest.splitRoomVisualScreenshotEvidenceClosed === true);
addCheck(checks, "cleanup issue outputs exist and passed", issueArtifactProof.status === "passed" &&
  Object.values(issueOutputs).every((output) => output.status === "passed"), issueOutputs);
addCheck(checks, "root scripts exist", rootScriptProof.status === "passed", rootScriptProof);
addCheck(checks, "browser artifacts exist", browserArtifactProof.status === "passed", browserArtifactProof);
addCheck(checks, "screenshot artifacts exist", screenshotProof.status === "passed", screenshotProof);
addCheck(checks, "boundaries remain clean", cleanBoundaryProof.status === "passed", cleanBoundaryProof);

const status = statusFromChecks(checks);
writeJson(issuePath(issue, "manual-scenario-foundation-evidence-closeout-output.json"), {
  status,
  manualScenarioFoundationEvidenceCloseoutStatus: status,
  manualScenarioReviewFoundationCanStartNext: status === "passed",
  manualScenarioFoundationStillManualOnly: status === "passed",
  manualScenarioReferencesStrict: status === "passed",
  stableScenarioIdentity: status === "passed",
  stableStaffRosterIdentity: status === "passed",
  coAssignmentPolicySemanticsExplicit: status === "passed",
  manualScenarioClockInjectionReady: status === "passed",
  splitRoomVisualScreenshotEvidenceClosed: status === "passed",
  scenarioRecommendationsStillBlocked: status === "passed",
  scenarioScoringStillBlocked: status === "passed",
  simulationStillBlocked: status === "passed"
});

if (status === "passed") {
  updateManifest(issue, {
    manualScenarioFoundationEvidenceCloseoutStatus: "passed",
    manualScenarioReviewFoundationCanStartNext: true,
    manualScenarioFoundationStillManualOnly: true,
    manualScenarioReferencesStrict: true,
    placeholderScenarioReferencesBlocked: true,
    stableScenarioIdentity: true,
    stableStaffRosterIdentity: true,
    coAssignmentPolicySemanticsExplicit: true,
    manualScenarioClockInjectionReady: true,
    splitRoomVisualScreenshotEvidenceClosed: true,
    scenarioRecommendationsStillBlocked: true,
    scenarioScoringStillBlocked: true,
    optimizerStillBlocked: true,
    simulationStillBlocked: true,
    noPhi: true,
    noScenarioRecommendations: true,
    noScenarioScoring: true,
    noClinicalSafetyClaim: true,
    noStaffingComplianceClaim: true,
    noPatientOutcomeClaim: true
  });
}

const noPhiPassed = runNoPhi(issue);
const finalStatus = status === "passed" && noPhiPassed ? "passed" : "failed";
writeCloseout(issue, {
  title: "Manual Scenario Foundation Evidence Closeout",
  reviewFinding: "The manual scenario foundation evidence tree now closes issues 889-895 and keeps the next milestone gated to manual-only reference, identity, clock, visual, and boundary proofs.",
  status: finalStatus,
  filesChanged: [
    "docs/verification/manual-scenario-foundation-manifest.json",
    "docs/project/manual-scenario-foundation-status.md",
    `scripts/${scriptName}.mjs`,
    "package.json",
    issuePath(issue)
  ],
  commands,
  evidence: [
    issuePath(issue, "manual-scenario-foundation-evidence-closeout-output.json"),
    issuePath(issue, "manual-scenario-root-script-proof.json"),
    issuePath(issue, "manual-scenario-browser-artifact-proof.json"),
    issuePath(issue, "manual-scenario-screenshot-proof.json"),
    issuePath(issue, "manual-scenario-clean-boundary-proof.json"),
    issuePath(issue, "test-output/shared.txt"),
    issuePath(issue, "test-output/web.txt"),
    issuePath(issue, "test-output/web-build.txt"),
    issuePath(issue, "test-output/docker-compose-config.txt"),
    issuePath(issue, "test-output/docker-compose-production-config.txt"),
    issuePath(issue, "test-output/docker-compose-build-web.txt"),
    issuePath(issue, "test-output/docker-compose-production-build-web.txt")
  ],
  limitations: ["This is an evidence closeout only; it does not add Manual Scenario Review Foundation behavior."]
});
writeJson(issuePath(issue, "command-output-map.json"), {
  status: finalStatus,
  issue: String(issue),
  commands: [
    { command: "npm --workspace packages/shared test", outputs: [issuePath(issue, "test-output/shared.txt")] },
    { command: "npm --workspace apps/web test", outputs: [issuePath(issue, "test-output/web.txt")] },
    { command: "npm --workspace apps/web run build", outputs: [issuePath(issue, "test-output/web-build.txt")] },
    {
      command: "npm run check:manual-scenario-foundation-go-no-go",
      outputs: [issuePath(issue, "test-output/check-manual-scenario-foundation-go-no-go.txt")]
    },
    {
      command: `node scripts/${scriptName}.mjs --stage ${stage} --issue ${issue}`,
      outputs: [
        issuePath(issue, `test-output/${scriptName}.txt`),
        issuePath(issue, "manual-scenario-foundation-evidence-closeout-output.json")
      ]
    },
    { command: "node scripts/check-no-phi-fields.mjs", outputs: [issuePath(issue, "no-phi-output.txt")] },
    { command: "docker compose config", outputs: [issuePath(issue, "test-output/docker-compose-config.txt")] },
    {
      command: "docker compose -f docker-compose.production.yml config",
      outputs: [issuePath(issue, "test-output/docker-compose-production-config.txt")]
    },
    { command: "docker compose build web", outputs: [issuePath(issue, "test-output/docker-compose-build-web.txt")] },
    {
      command: "docker compose -f docker-compose.production.yml build web",
      outputs: [issuePath(issue, "test-output/docker-compose-production-build-web.txt")]
    }
  ]
});
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed" || !noPhiPassed) process.exit(1);

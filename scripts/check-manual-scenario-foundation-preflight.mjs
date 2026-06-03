#!/usr/bin/env node
import {
  addCheck,
  ensureIssueArtifacts,
  ensureManifest,
  fileIncludes,
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
} from "./lib/manual-scenario-foundation-utils.mjs";

const issue = readArg("--issue", "878");
const stage = readArg("--stage", "final");
const scriptName = "check-manual-scenario-foundation-preflight";
const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "npm run check:assignment-foundation-evidence-closeout",
  `node scripts/${scriptName}.mjs --stage ${stage} --issue ${issue}`,
  "node scripts/check-no-phi-fields.mjs",
  "docker compose config",
  "docker compose -f docker-compose.production.yml config",
  "docker compose build web",
  "docker compose -f docker-compose.production.yml build web"
];

ensureIssueArtifacts(issue);
writeCommands(issue, commands);

const assignmentManifest = readJson("docs/verification/assignment-foundation-manifest.json");
const manifest = ensureManifest();
const assignmentProof = {
  status: assignmentManifest.manualScenarioFoundationCanStartNext === true &&
    assignmentManifest.assignmentScope === "manual_only" &&
    assignmentManifest.recommendationsStillBlocked === true &&
    assignmentManifest.scoringStillBlocked === true &&
    assignmentManifest.simulationStillBlocked === true ? "passed" : "failed",
  manualScenarioFoundationCanStartNext: assignmentManifest.manualScenarioFoundationCanStartNext === true,
  assignmentScope: assignmentManifest.assignmentScope,
  recommendationsStillBlocked: assignmentManifest.recommendationsStillBlocked === true,
  scoringStillBlocked: assignmentManifest.scoringStillBlocked === true,
  simulationStillBlocked: assignmentManifest.simulationStillBlocked === true
};
writeJson(issuePath(issue, "assignment-foundation-dependency-proof.json"), assignmentProof);

const rootScriptProof = packageScriptProof([
  "check:manual-scenario-foundation-preflight",
  "check:manual-assignment-layout-change-reset",
  "check:co-assignment-policy-contract",
  "check:manual-scenario-contract",
  "check:manual-scenario-snapshot-contract",
  "check:manual-scenario-validation",
  "check:manual-scenario-ui",
  "check:manual-scenario-save-reload-proof",
  "check:manual-scenario-browser-proof",
  "check:manual-scenario-no-recommendation-guard",
  "check:manual-scenario-foundation-go-no-go"
]);
writeJson(issuePath(issue, "manual-scenario-root-script-proof.json"), rootScriptProof);

const requiredDefaults = {
  manualScenarioFoundationPreflightStatus: manifest.manualScenarioFoundationPreflightStatus,
  assignmentEditorLayoutResetStatus: manifest.assignmentEditorLayoutResetStatus,
  coAssignmentPolicyContractStatus: manifest.coAssignmentPolicyContractStatus,
  manualScenarioContractStatus: manifest.manualScenarioContractStatus,
  manualScenarioSnapshotStatus: manifest.manualScenarioSnapshotStatus,
  manualScenarioValidationStatus: manifest.manualScenarioValidationStatus,
  manualScenarioEditorStatus: manifest.manualScenarioEditorStatus,
  manualScenarioSaveReloadStatus: manifest.manualScenarioSaveReloadStatus,
  manualScenarioBrowserProofStatus: manifest.manualScenarioBrowserProofStatus,
  manualScenarioNoRecommendationGuardStatus: manifest.manualScenarioNoRecommendationGuardStatus,
  manualScenarioFoundationGoNoGoStatus: manifest.manualScenarioFoundationGoNoGoStatus,
  scenarioScope: manifest.scenarioScope,
  recommendationsStillBlocked: manifest.recommendationsStillBlocked,
  scoringStillBlocked: manifest.scoringStillBlocked,
  simulationStillBlocked: manifest.simulationStillBlocked
};

const statusDocProof = fileIncludes("docs/project/manual-scenario-foundation-status.md", [
  "manual_only",
  "preflight only",
  "not_ready",
  "reference and presentation records only"
]);

const checks = [];
addCheck(checks, "assignment foundation dependency allows manual scenarios", assignmentProof.status === "passed", assignmentProof);
addCheck(checks, "manual scenario manifest starts as manual-only preflight", manifest.scenarioScope === "manual_only" &&
  manifest.manualScenarioFoundationGoNoGoStatus === "not_ready" &&
  manifest.recommendationsStillBlocked === true &&
  manifest.scoringStillBlocked === true &&
  manifest.simulationStillBlocked === true, requiredDefaults);
addCheck(checks, "root scripts are wired for the manual scenario batch", rootScriptProof.status === "passed", rootScriptProof);
addCheck(checks, "status doc records the manual scenario boundary", statusDocProof.passed, statusDocProof);

const status = statusFromChecks(checks);
const output = {
  status,
  manualScenarioFoundationPreflightStatus: status,
  scenarioScope: "manual_only",
  assignmentFoundationDependencyVerified: assignmentProof.status === "passed",
  recommendationsStillBlocked: true,
  scoringStillBlocked: true,
  simulationStillBlocked: true,
  rootScriptProof
};
writeJson(issuePath(issue, "manual-scenario-foundation-preflight-output.json"), output);

if (status === "passed") {
  updateManifest(issue, {
    manualScenarioFoundationPreflightStatus: "passed",
    scenarioScope: "manual_only",
    assignmentFoundationDependencyVerified: true,
    recommendationsStillBlocked: true,
    scoringStillBlocked: true,
    simulationStillBlocked: true
  });
}

const noPhiPassed = runNoPhi(issue);
writeCloseout(issue, {
  title: "Manual Scenario Foundation Preflight",
  reviewFinding: "Preflight verifies assignment foundation readiness and creates a manual-only scenario foundation gate without adding scenario behavior.",
  status: status === "passed" && noPhiPassed ? "passed" : "failed",
  filesChanged: [
    "docs/verification/manual-scenario-foundation-manifest.json",
    "docs/project/manual-scenario-foundation-status.md",
    "scripts/lib/manual-scenario-foundation-utils.mjs",
    "scripts/check-manual-scenario-foundation-preflight.mjs",
    "scripts/check-manual-scenario-foundation-go-no-go.mjs",
    "package.json",
    issuePath(issue)
  ],
  commands,
  evidence: [
    issuePath(issue, "manual-scenario-foundation-preflight-output.json"),
    issuePath(issue, "assignment-foundation-dependency-proof.json"),
    issuePath(issue, "manual-scenario-root-script-proof.json"),
    issuePath(issue, "manifest-update-output.json"),
    issuePath(issue, "test-output/docker-compose-config.txt"),
    issuePath(issue, "test-output/docker-compose-production-config.txt"),
    issuePath(issue, "test-output/docker-compose-build-web.txt"),
    issuePath(issue, "test-output/docker-compose-production-build-web.txt")
  ],
  limitations: ["This issue is preflight only; the GO/NO-GO gate remains not_ready until later manual scenario issues pass."]
});
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed" || !noPhiPassed) process.exit(1);

#!/usr/bin/env node
import {
  addCheck,
  ensureIssueArtifacts,
  issuePath,
  readArg,
  readText,
  runNoPhi,
  statusFromChecks,
  updateManifest,
  writeCloseout,
  writeCommands,
  writeJson,
  writeStageResult
} from "./lib/manual-scenario-foundation-utils.mjs";

const issue = readArg("--issue", "888");
const stage = readArg("--stage", "final");
const scriptName = "check-manual-scenario-no-recommendation-guard";
const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  `node scripts/${scriptName}.mjs --stage ${stage} --issue ${issue}`,
  `node scripts/check-manual-scenario-browser-proof.mjs --stage ${stage} --issue ${issue}`,
  "node scripts/check-no-phi-fields.mjs",
  "docker compose config",
  "docker compose -f docker-compose.production.yml config",
  "docker compose build web",
  "docker compose -f docker-compose.production.yml build web"
];
const forbiddenTerms = [
  "recommended",
  "recommendation",
  "best",
  "optimal",
  "optimized",
  "optimizer",
  "score",
  "burden",
  "workload",
  "balanced",
  "fairness",
  "safer",
  "unsafe",
  "clinical safety",
  "staffing compliance",
  "patient outcome",
  "simulation result",
  "travel time"
];
const contractFiles = [
  "packages/shared/src/scenarios/manualScenarioContract.ts",
  "packages/shared/src/scenarios/manualScenarioValidation.ts",
  "packages/shared/src/scenarios/manualScenarioStaffRosterContract.ts",
  "packages/shared/src/scenarios/manualScenarioStaffRosterFixture.ts",
  "packages/shared/src/scenarios/manualScenarioSnapshotContract.ts",
  "packages/shared/src/scenarios/manualScenarioVersioning.ts",
  "packages/shared/src/scenarios/manualScenarioReferenceValidation.ts",
  "apps/web/src/features/manual-scenario/manualScenarioState.ts",
  "apps/web/src/features/manual-scenario/manualScenarioPersistence.ts",
  "apps/web/src/features/manual-scenario/manualScenarioStorage.ts"
];
const uiFiles = [
  "apps/web/src/features/manual-scenario/ManualScenarioPanel.tsx",
  "apps/web/src/features/manual-scenario/ManualScenarioControls.tsx",
  "apps/web/src/features/manual-scenario/ManualScenarioList.tsx",
  "apps/web/src/features/manual-scenario/ManualScenario.css"
];
const proofArtifactFiles = [
  "docs/verification/issues/issue-887/scenario-before.json",
  "docs/verification/issues/issue-887/scenario-after.json",
  "docs/verification/issues/issue-887/scenario-reference-stability-proof.json",
  "docs/verification/issues/issue-887/scenario-assignment-set-fixture.json",
  "docs/verification/issues/issue-887/manual-scenario-browser-trace.json",
  "docs/verification/issues/issue-888/manual-scenario-browser-trace.json"
];

ensureIssueArtifacts(issue);
writeCommands(issue, commands);

const contractScan = scanFiles(contractFiles, forbiddenTerms);
const uiCopyScan = scanFiles(uiFiles, forbiddenTerms);
const proofArtifactScan = scanFiles(proofArtifactFiles, forbiddenTerms);
writeJson(issuePath(issue, "scenario-contract-scan-output.json"), contractScan);
writeJson(issuePath(issue, "scenario-ui-copy-scan-output.json"), uiCopyScan);
writeJson(issuePath(issue, "scenario-proof-artifact-scan-output.json"), proofArtifactScan);

const checks = [];
addCheck(checks, "scenario contract files omit blocked terms", contractScan.status === "passed", contractScan);
addCheck(checks, "scenario UI copy omits blocked terms", uiCopyScan.status === "passed", uiCopyScan);
addCheck(checks, "scenario proof artifacts omit blocked terms", proofArtifactScan.status === "passed", proofArtifactScan);
const status = statusFromChecks(checks);
writeJson(issuePath(issue, "manual-scenario-no-recommendation-guard-output.json"), {
  status,
  manualScenarioNoRecommendationGuardStatus: status,
  scenarioRecommendationsStillBlocked: status === "passed",
  scenarioScoringStillBlocked: status === "passed",
  optimizerStillBlocked: status === "passed",
  simulationStillBlocked: status === "passed"
});
if (status === "passed") {
  updateManifest(issue, {
    manualScenarioNoRecommendationGuardStatus: "passed",
    scenarioRecommendationsStillBlocked: true,
    scenarioScoringStillBlocked: true,
    optimizerStillBlocked: true,
    simulationStillBlocked: true
  });
}
const noPhiPassed = runNoPhi(issue);
writeCloseout(issue, {
  title: "Manual Scenario No-Recommendation No-Scoring Guard",
  reviewFinding: "The guard scans manual scenario production contracts, UI copy, and reference proof artifacts for ranking, scoring, optimization, safety, compliance, outcome, and result-copy drift.",
  status: status === "passed" && noPhiPassed ? "passed" : "failed",
  filesChanged: [`scripts/${scriptName}.mjs`, "docs/verification/manual-scenario-foundation-manifest.json", issuePath(issue)],
  commands,
  evidence: [
    issuePath(issue, "manual-scenario-no-recommendation-guard-output.json"),
    issuePath(issue, "manual-scenario-browser-proof-output.json"),
    issuePath(issue, "scenario-contract-scan-output.json"),
    issuePath(issue, "scenario-ui-copy-scan-output.json"),
    issuePath(issue, "scenario-proof-artifact-scan-output.json")
  ],
  limitations: ["Guard scan is scoped to the manual scenario layer; legacy non-manual scenario modules remain outside this issue."]
});
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed" || !noPhiPassed) process.exit(1);

function scanFiles(files, terms) {
  const matches = [];
  for (const file of files) {
    const text = readText(file);
    for (const term of terms) {
      const pattern = term.includes(" ")
        ? new RegExp(escapeRegex(term), "iu")
        : new RegExp(`\\b${escapeRegex(term)}\\b`, "iu");
      if (pattern.test(text)) {
        matches.push({ file, term });
      }
    }
  }
  return {
    status: matches.length === 0 ? "passed" : "failed",
    files,
    terms,
    matches
  };
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

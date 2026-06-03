#!/usr/bin/env node
import {
  addCheck,
  ensureIssueArtifacts,
  fileExcludes,
  fileIncludes,
  issuePath,
  readArg,
  runNoPhi,
  statusFromChecks,
  updateManifest,
  writeCloseout,
  writeCommands,
  writeJson,
  writeStageResult
} from "./lib/manual-scenario-foundation-utils.mjs";
import {
  manualScenarioIdFor,
  validateManualScenarioContract
} from "../packages/shared/dist/index.js";

const issue = readArg("--issue", "881");
const stage = readArg("--stage", "final");
const scriptName = "check-manual-scenario-contract";
const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  `node scripts/${scriptName}.mjs --stage ${stage} --issue ${issue}`,
  "node scripts/check-no-phi-fields.mjs",
  "docker compose config",
  "docker compose -f docker-compose.production.yml config",
  "docker compose build web",
  "docker compose -f docker-compose.production.yml build web"
];

ensureIssueArtifacts(issue);
writeCommands(issue, commands);

const fixture = validateManualScenarioContract({
  scenarioId: manualScenarioIdFor({
    floorplanId: "manual-scenario-floorplan",
    assignmentSetId: "manual-scenario-assignment-set",
    label: "Manual Scenario"
  }),
  label: "Manual Scenario",
  description: "Reference set for synthetic manual assignment review",
  floorplanId: "manual-scenario-floorplan",
  assignmentSetId: "manual-scenario-assignment-set",
  staffRosterId: "manual-scenario-staff-roster",
  createdAtIso: "2026-06-01T00:00:00.000Z",
  updatedAtIso: "2026-06-01T00:00:00.000Z",
  mode: "manual"
});
writeJson(issuePath(issue, "manual-scenario-fixture.json"), {
  status: "passed",
  scenario: fixture
});

const forbiddenFields = [
  "score",
  "recommendation",
  "burden",
  "workload",
  "simulationResult",
  "optimizerOutput",
  "safetyStatus",
  "complianceStatus",
  "patientOutcome"
];
const forbiddenResults = forbiddenFields.map((field) => {
  try {
    validateManualScenarioContract({ ...fixture, [field]: "blocked" });
    return { field, rejected: false };
  } catch (error) {
    return {
      field,
      rejected: error instanceof Error && error.message.includes(`manualScenario.${field} is not allowed`)
    };
  }
});
const forbiddenProof = {
  status: forbiddenResults.every((result) => result.rejected) ? "passed" : "failed",
  results: forbiddenResults
};
writeJson(issuePath(issue, "forbidden-scenario-fields-proof.json"), forbiddenProof);

const blocked = [
  "Recommended Scenario",
  "Optimized Scenario",
  "Workload score",
  "Burden score",
  "Clinical safety",
  "Staffing compliance",
  "Patient outcome"
];
const scannedFiles = [
  "packages/shared/src/scenarios/manualScenarioContract.ts",
  "packages/shared/src/scenarios/manualScenarioValidation.ts",
  "packages/shared/tests/manual-scenario-contract.test.mjs"
];

const checks = [];
addCheck(checks, "manual scenario contract exists", fileIncludes(
  "packages/shared/src/scenarios/manualScenarioContract.ts",
  ["ManualScenarioContract", "manualScenarioIdFor", "mode: \"manual\""]
).passed);
addCheck(checks, "manual scenario validation requires references and manual mode", fileIncludes(
  "packages/shared/src/scenarios/manualScenarioValidation.ts",
  ["validateManualScenarioContract", "floorplanId", "assignmentSetId", "manualScenario.mode must be manual"]
).passed);
addCheck(checks, "manual scenario validation uses runtime and overclaim guards", fileIncludes(
  "packages/shared/src/scenarios/manualScenarioValidation.ts",
  ["validateOperationalRuntimeText", "validateAssignmentLabelNoOverclaim"]
).passed);
addCheck(checks, "shared regression test covers forbidden fields", fileIncludes(
  "packages/shared/tests/manual-scenario-contract.test.mjs",
  ["manual scenario contract rejects forbidden scenario fields", "score", "optimizerOutput", "patientOutcome"]
).passed);
addCheck(checks, "fixture validates as manual scenario reference record", fixture.mode === "manual" &&
  fixture.floorplanId.length > 0 &&
  fixture.assignmentSetId.length > 0);
addCheck(checks, "forbidden fields are rejected", forbiddenProof.status === "passed", forbiddenProof);
addCheck(checks, "contract files omit blocked UI copy", scannedFiles.every((file) => fileExcludes(file, blocked).passed), blocked);

const status = statusFromChecks(checks);
writeJson(issuePath(issue, "manual-scenario-contract-output.json"), {
  status,
  manualScenarioContractStatus: status,
  manualScenarioModeOnly: status === "passed",
  scenarioReferencesFloorplan: status === "passed",
  scenarioReferencesAssignmentSet: status === "passed",
  scenarioContainsNoSimulation: status === "passed",
  scenarioContainsNoScoring: status === "passed",
  scenarioContainsNoRecommendations: status === "passed"
});

if (status === "passed") {
  updateManifest(issue, {
    manualScenarioContractStatus: "passed",
    manualScenarioModeOnly: true,
    scenarioReferencesFloorplan: true,
    scenarioReferencesAssignmentSet: true,
    scenarioContainsNoSimulation: true,
    scenarioContainsNoScoring: true,
    scenarioContainsNoRecommendations: true
  });
}

const noPhiPassed = runNoPhi(issue);
writeCloseout(issue, {
  title: "Manual Scenario Contract",
  reviewFinding: "Manual scenarios are validated as manual reference records and reject evaluative, optimizer, simulation, staffing, clinical, and outcome fields.",
  status: status === "passed" && noPhiPassed ? "passed" : "failed",
  filesChanged: [
    "packages/shared/src/scenarios/manualScenarioContract.ts",
    "packages/shared/src/scenarios/manualScenarioValidation.ts",
    "packages/shared/src/index.ts",
    "packages/shared/tests/manual-scenario-contract.test.mjs",
    "scripts/check-manual-scenario-contract.mjs",
    "docs/verification/manual-scenario-foundation-manifest.json",
    issuePath(issue)
  ],
  commands,
  evidence: [
    issuePath(issue, "manual-scenario-contract-output.json"),
    issuePath(issue, "manual-scenario-fixture.json"),
    issuePath(issue, "forbidden-scenario-fields-proof.json"),
    issuePath(issue, "test-output/docker-compose-config.txt"),
    issuePath(issue, "test-output/docker-compose-production-config.txt"),
    issuePath(issue, "test-output/docker-compose-build-web.txt"),
    issuePath(issue, "test-output/docker-compose-production-build-web.txt")
  ],
  limitations: ["This issue defines the scenario record only; scenario reference validation is completed in a later issue."]
});
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed" || !noPhiPassed) process.exit(1);

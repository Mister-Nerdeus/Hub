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
  validateManualAssignmentSetContract,
  validateManualScenarioContract,
  validateManualScenarioReferences
} from "../packages/shared/dist/index.js";

const issue = readArg("--issue", "885");
const stage = readArg("--stage", "final");
const scriptName = "check-manual-scenario-validation";
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

const floorplanId = "manual-scenario-validation-floorplan";
const scenario = validateManualScenarioContract({
  scenarioId: manualScenarioIdFor({ stableSeed: "manual-scenario-validation" }),
  label: "Manual Scenario Validation",
  floorplanId,
  assignmentSetId: "manual-scenario-validation-assignment-set",
  staffRosterId: "manual-scenario-validation-roster",
  createdAtIso: "2026-06-01T00:00:00.000Z",
  updatedAtIso: "2026-06-01T00:00:00.000Z",
  mode: "manual"
});
const assignmentSet = validateManualAssignmentSetContract({
  assignmentSetId: scenario.assignmentSetId,
  floorplanId,
  label: "Manual assignment set",
  createdAtIso: "2026-06-01T00:00:00.000Z",
  updatedAtIso: "2026-06-01T00:00:00.000Z",
  assignments: [],
  mode: "manual"
});
const missingReferenceResult = validateManualScenarioReferences({
  scenario,
  floorplanIds: [],
  assignmentSets: [],
  staffRosterIds: []
});
const mismatchResult = validateManualScenarioReferences({
  scenario,
  floorplanIds: [floorplanId],
  assignmentSets: [{ ...assignmentSet, floorplanId: "other-floorplan" }],
  staffRosterIds: [scenario.staffRosterId]
});
const validResult = validateManualScenarioReferences({
  scenario,
  floorplanIds: [floorplanId],
  assignmentSets: [assignmentSet],
  staffRosterIds: [scenario.staffRosterId]
});
writeJson(issuePath(issue, "scenario-reference-validation-fixture.json"), {
  status: "passed",
  scenario,
  validResult,
  missingReferenceResult,
  mismatchResult
});

const blocked = [
  "Unsafe",
  "Safer",
  "Best",
  "Optimal",
  "Recommended",
  "Balanced",
  "Workload",
  "Burden",
  "Score",
  "Staffing compliance",
  "Clinical safety",
  "Patient outcome",
  "Simulation result"
];
const scannedFiles = [
  "packages/shared/src/scenarios/manualScenarioValidation.ts",
  "packages/shared/src/scenarios/manualScenarioReferenceValidation.ts",
  "packages/shared/tests/manual-scenario-reference-validation.test.mjs"
];

const missingMessages = missingReferenceResult.issues.map((entry) => entry.message);
const checks = [];
addCheck(checks, "reference validation file exists", fileIncludes(
  "packages/shared/src/scenarios/manualScenarioReferenceValidation.ts",
  ["validateManualScenarioReferences", "Missing floorplan", "Missing assignment set", "Assignment set does not match floorplan", "Missing staff roster"]
).passed);
addCheck(checks, "shared regression test covers reference validation", fileIncludes(
  "packages/shared/tests/manual-scenario-reference-validation.test.mjs",
  ["matching references", "missing references", "floorplan mismatch"]
).passed);
addCheck(checks, "missing floorplan creates error", missingMessages.includes("Missing floorplan"), missingReferenceResult);
addCheck(checks, "missing assignment set creates error", missingMessages.includes("Missing assignment set"), missingReferenceResult);
addCheck(checks, "floorplan assignment mismatch creates error", mismatchResult.issues.some((entry) =>
  entry.message === "Assignment set does not match floorplan"
), mismatchResult);
addCheck(checks, "missing staff roster creates error", missingReferenceResult.issues.some((entry) =>
  entry.message === "Missing staff roster" && entry.severity === "error"
), missingReferenceResult);
addCheck(checks, "valid scenario references pass", validResult.status === "passed", validResult);
addCheck(checks, "validation files omit blocked terms", scannedFiles.every((file) => fileExcludes(file, blocked).passed), blocked);

const status = statusFromChecks(checks);
writeJson(issuePath(issue, "manual-scenario-validation-output.json"), {
  status,
  manualScenarioValidationStatus: status,
  missingFloorplanErrors: status === "passed",
  missingAssignmentSetErrors: status === "passed",
  missingStaffRosterErrors: status === "passed",
  floorplanAssignmentMismatchErrors: status === "passed",
  scenarioValidationContainsNoScoring: status === "passed",
  scenarioValidationContainsNoRecommendations: status === "passed"
});

if (status === "passed") {
  updateManifest(issue, {
    manualScenarioValidationStatus: "passed",
    missingFloorplanErrors: true,
    missingAssignmentSetErrors: true,
    missingStaffRosterErrors: true,
    floorplanAssignmentMismatchErrors: true,
    scenarioValidationContainsNoScoring: true,
    scenarioValidationContainsNoRecommendations: true
  });
}

const noPhiPassed = runNoPhi(issue);
writeCloseout(issue, {
  title: "Manual Scenario Validation",
  reviewFinding: "Manual scenario reference validation reports missing or mismatched references with neutral messages only.",
  status: status === "passed" && noPhiPassed ? "passed" : "failed",
  filesChanged: [
    "packages/shared/src/scenarios/manualScenarioValidation.ts",
    "packages/shared/src/scenarios/manualScenarioReferenceValidation.ts",
    "packages/shared/src/index.ts",
    "packages/shared/tests/manual-scenario-reference-validation.test.mjs",
    "scripts/check-manual-scenario-validation.mjs",
    "docs/verification/manual-scenario-foundation-manifest.json",
    issuePath(issue)
  ],
  commands,
  evidence: [
    issuePath(issue, "manual-scenario-validation-output.json"),
    issuePath(issue, "scenario-reference-validation-fixture.json"),
    issuePath(issue, "test-output/docker-compose-config.txt"),
    issuePath(issue, "test-output/docker-compose-production-config.txt"),
    issuePath(issue, "test-output/docker-compose-build-web.txt"),
    issuePath(issue, "test-output/docker-compose-production-build-web.txt")
  ],
  limitations: ["Validation checks references only; it does not evaluate assignment quality."]
});
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed" || !noPhiPassed) process.exit(1);

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
  manualScenarioStaffRosterFixture,
  manualScenarioStaffRosterIdFor,
  validateManualScenarioStaffRosterContract
} from "../packages/shared/dist/index.js";

const issue = readArg("--issue", "882");
const stage = readArg("--stage", "final");
const scriptName = "check-manual-scenario-staff-roster-contract";
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

const roster = validateManualScenarioStaffRosterContract(manualScenarioStaffRosterFixture);
writeJson(issuePath(issue, "manual-scenario-staff-roster-fixture.json"), {
  status: "passed",
  roster
});

const forbiddenFields = [
  "competencyScore",
  "recommendationScore",
  "workloadScore",
  "staffingCompliance",
  "clinicalSafety",
  "patientOutcome"
];
const forbiddenResults = forbiddenFields.map((field) => {
  try {
    validateManualScenarioStaffRosterContract({ ...roster, [field]: "blocked" });
    return { field, rejected: false };
  } catch (error) {
    return {
      field,
      rejected: error instanceof Error && error.message.includes(`manualScenarioStaffRoster.${field} is not allowed`)
    };
  }
});
const forbiddenProof = {
  status: forbiddenResults.every((result) => result.rejected) ? "passed" : "failed",
  results: forbiddenResults
};
writeJson(issuePath(issue, "manual-scenario-staff-roster-forbidden-fields-proof.json"), forbiddenProof);

const duplicateRoster = {
  ...roster,
  staffRosterId: manualScenarioStaffRosterIdFor({ label: roster.label }),
  staffMembers: [roster.staffMembers[0], { ...roster.staffMembers[0] }]
};
let duplicateRejected = false;
try {
  validateManualScenarioStaffRosterContract(duplicateRoster);
} catch {
  duplicateRejected = true;
}

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
  "packages/shared/src/scenarios/manualScenarioStaffRosterContract.ts",
  "packages/shared/src/scenarios/manualScenarioStaffRosterFixture.ts",
  "packages/shared/tests/manual-scenario-staff-roster-contract.test.mjs"
];

const checks = [];
addCheck(checks, "manual scenario staff roster contract exists", fileIncludes(
  "packages/shared/src/scenarios/manualScenarioStaffRosterContract.ts",
  ["ManualScenarioStaffRosterContract", "manual_roster", "validateManualScenarioStaffRosterContract"]
).passed);
addCheck(checks, "manual scenario staff roster fixture exists", fileIncludes(
  "packages/shared/src/scenarios/manualScenarioStaffRosterFixture.ts",
  ["manualScenarioStaffRosterFixture", "Nurse Blue", "Tech Green"]
).passed);
addCheck(checks, "shared regression test covers roster validation", fileIncludes(
  "packages/shared/tests/manual-scenario-staff-roster-contract.test.mjs",
  ["manual scenario staff roster contract accepts manual roster records", "rejects duplicate staff member ids"]
).passed);
addCheck(checks, "fixture validates as manual roster", roster.mode === "manual_roster" && roster.staffMembers.length > 0, roster);
addCheck(checks, "duplicate staff member ids are rejected", duplicateRejected);
addCheck(checks, "forbidden roster fields are rejected", forbiddenProof.status === "passed", forbiddenProof);
addCheck(checks, "roster files omit blocked UI copy", scannedFiles.every((file) => fileExcludes(file, blocked).passed), blocked);

const status = statusFromChecks(checks);
writeJson(issuePath(issue, "manual-scenario-staff-roster-contract-output.json"), {
  status,
  manualScenarioStaffRosterStatus: status,
  manualStaffRosterModeOnly: status === "passed",
  staffRosterContainsNoPhi: status === "passed",
  staffRosterContainsNoScoring: status === "passed",
  staffRosterContainsNoRecommendations: status === "passed"
});

if (status === "passed") {
  updateManifest(issue, {
    manualScenarioStaffRosterStatus: "passed",
    manualStaffRosterModeOnly: true,
    staffRosterContainsNoPhi: true,
    staffRosterContainsNoScoring: true,
    staffRosterContainsNoRecommendations: true
  });
}

const noPhiPassed = runNoPhi(issue);
writeCloseout(issue, {
  title: "Manual Scenario Staff Roster Contract",
  reviewFinding: "Manual scenarios previously referenced a roster id without a durable roster object; the shared contract now validates manual roster mode, deterministic identity, unique staff ids, and blocked boundary fields.",
  status: status === "passed" && noPhiPassed ? "passed" : "failed",
  filesChanged: [
    "packages/shared/src/scenarios/manualScenarioStaffRosterContract.ts",
    "packages/shared/src/scenarios/manualScenarioStaffRosterFixture.ts",
    "packages/shared/src/index.ts",
    "packages/shared/tests/manual-scenario-staff-roster-contract.test.mjs",
    `scripts/${scriptName}.mjs`,
    "docs/verification/manual-scenario-foundation-manifest.json",
    issuePath(issue)
  ],
  commands,
  evidence: [
    issuePath(issue, "manual-scenario-staff-roster-contract-output.json"),
    issuePath(issue, "manual-scenario-staff-roster-fixture.json"),
    issuePath(issue, "manual-scenario-staff-roster-forbidden-fields-proof.json"),
    issuePath(issue, "test-output/docker-compose-config.txt"),
    issuePath(issue, "test-output/docker-compose-production-config.txt"),
    issuePath(issue, "test-output/docker-compose-build-web.txt"),
    issuePath(issue, "test-output/docker-compose-production-build-web.txt")
  ],
  limitations: ["This issue defines manual roster records only; it does not evaluate staff capability or assignment quality."]
});
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed" || !noPhiPassed) process.exit(1);

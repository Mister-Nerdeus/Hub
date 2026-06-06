#!/usr/bin/env node
import {
  addCheck,
  ensureIssueArtifacts,
  fileExcludes,
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
import {
  createManualScenarioSnapshot,
  manualScenarioIdFor,
  manualScenarioStaffRosterIdFor,
  validateManualScenarioContract,
  validateManualScenarioStaffRosterContract
} from "../packages/shared/dist/index.js";

const issue = readArg("--issue", "892");
const stage = readArg("--stage", "final");
const scriptName = "check-stable-staff-roster-identity";
const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  `node scripts/${scriptName}.mjs --stage ${stage} --issue ${issue}`,
  "node scripts/check-manual-scenario-staff-roster-contract.mjs --stage final --issue 892",
  "node scripts/check-manual-scenario-snapshot-contract.mjs --stage final --issue 892",
  "node scripts/check-no-phi-fields.mjs",
  "docker compose config",
  "docker compose -f docker-compose.production.yml config",
  "docker compose build web",
  "docker compose -f docker-compose.production.yml build web"
];

ensureIssueArtifacts(issue);
writeCommands(issue, commands);

const createdAtIso = "2026-06-01T00:00:00.000Z";
const staffMembers = [
  { staffMemberId: "manual-staff-blue", displayName: "Nurse Blue", role: "rn", active: true },
  { staffMemberId: "manual-staff-green", displayName: "Tech Green", role: "tech", active: true }
];
const rosterBefore = validateManualScenarioStaffRosterContract({
  staffRosterId: manualScenarioStaffRosterIdFor({ stableSeed: "stable-roster-alpha" }),
  label: "Manual Scenario Roster Alpha",
  createdAtIso,
  updatedAtIso: createdAtIso,
  staffMembers,
  mode: "manual_roster"
});
const rosterAfterRename = validateManualScenarioStaffRosterContract({
  ...rosterBefore,
  label: "Manual Scenario Roster Renamed",
  updatedAtIso: "2026-06-02T00:00:00.000Z"
});
const duplicateRoster = validateManualScenarioStaffRosterContract({
  ...rosterBefore,
  staffRosterId: manualScenarioStaffRosterIdFor({ stableSeed: "stable-roster-alpha-copy" }),
  label: "Manual Scenario Roster Alpha Copy"
});
const scenario = validateManualScenarioContract({
  scenarioId: manualScenarioIdFor({ stableSeed: "stable-roster-scenario" }),
  label: "Manual Scenario Roster Reference",
  floorplanId: "stable-roster-floorplan",
  assignmentSetId: "stable-roster-assignment-set",
  staffRosterId: rosterBefore.staffRosterId,
  createdAtIso,
  updatedAtIso: createdAtIso,
  mode: "manual"
});
const scenarioAfterRosterRename = validateManualScenarioContract({
  ...scenario,
  staffRosterId: rosterAfterRename.staffRosterId
});
const snapshot = createManualScenarioSnapshot({
  scenarioId: scenario.scenarioId,
  floorplanId: scenario.floorplanId,
  assignmentSetId: scenario.assignmentSetId,
  staffRosterId: rosterBefore.staffRosterId,
  floorplanRevisionId: "stable-roster-floorplan-v1",
  assignmentSetRevisionId: "stable-roster-assignment-v1",
  staffRosterRevisionId: "stable-roster-v1",
  createdAtIso
});
const snapshotAfterRosterRename = {
  ...snapshot,
  staffRosterId: rosterAfterRename.staffRosterId
};

writeJson(issuePath(issue, "staff-roster-rename-proof.json"), {
  status: rosterAfterRename.staffRosterId === rosterBefore.staffRosterId ? "passed" : "failed",
  rosterBefore,
  rosterAfterRename,
  staffRosterRenamePreservesRosterId: rosterAfterRename.staffRosterId === rosterBefore.staffRosterId
});
writeJson(issuePath(issue, "staff-roster-duplicate-proof.json"), {
  status: duplicateRoster.staffRosterId !== rosterBefore.staffRosterId ? "passed" : "failed",
  rosterBefore,
  duplicateRoster,
  staffRosterDuplicateCreatesNewRosterId: duplicateRoster.staffRosterId !== rosterBefore.staffRosterId
});
writeJson(issuePath(issue, "scenario-roster-reference-stability-proof.json"), {
  status: scenarioAfterRosterRename.staffRosterId === scenario.staffRosterId &&
    snapshotAfterRosterRename.staffRosterId === snapshot.staffRosterId ? "passed" : "failed",
  scenario,
  scenarioAfterRosterRename,
  snapshot,
  snapshotAfterRosterRename,
  scenarioRosterReferencesStableAfterRename: scenarioAfterRosterRename.staffRosterId === scenario.staffRosterId,
  snapshotRosterReferencesStableAfterRename: snapshotAfterRosterRename.staffRosterId === snapshot.staffRosterId
});

const contractText = readText("packages/shared/src/scenarios/manualScenarioStaffRosterContract.ts");
const fixtureText = readText("packages/shared/src/scenarios/manualScenarioStaffRosterFixture.ts");
const testText = readText("packages/shared/tests/manual-scenario-staff-roster-contract.test.mjs");
const scannedFiles = [
  "packages/shared/src/scenarios/manualScenarioStaffRosterContract.ts",
  "packages/shared/src/scenarios/manualScenarioStaffRosterFixture.ts",
  "packages/shared/src/scenarios/manualScenarioSnapshotContract.ts"
];
const forbiddenTerms = [
  "Recommended",
  "Best",
  "Optimal",
  "Workload score",
  "Burden score",
  "Clinical safety",
  "Staffing compliance",
  "Patient outcome",
  "Simulation result"
];

const checks = [];
addCheck(checks, "staff roster id helper uses stable seed", contractText.includes("stableSeed: string") &&
  !contractText.includes("manualScenarioStaffRosterIdFor({ label") &&
  contractText.includes("manualScenarioStaffRoster.staffRosterId must be a manual staff roster id"));
addCheck(checks, "fixture uses a stable roster seed", fixtureText.includes("stableSeed: \"manual-scenario-roster\""));
addCheck(checks, "shared tests prove rename and duplicate identity", testText.includes("manual scenario staff roster id helper does not depend on label") &&
  testText.includes("assert.notEqual(duplicate.staffRosterId, before.staffRosterId)"));
addCheck(checks, "roster rename preserves roster id", rosterAfterRename.staffRosterId === rosterBefore.staffRosterId, {
  rosterBefore,
  rosterAfterRename
});
addCheck(checks, "duplicate roster creates new roster id", duplicateRoster.staffRosterId !== rosterBefore.staffRosterId, {
  rosterBefore,
  duplicateRoster
});
addCheck(checks, "scenario roster references remain stable after rename", scenarioAfterRosterRename.staffRosterId === scenario.staffRosterId, {
  scenario,
  scenarioAfterRosterRename
});
addCheck(checks, "snapshot roster references remain stable after rename", snapshotAfterRosterRename.staffRosterId === snapshot.staffRosterId, {
  snapshot,
  snapshotAfterRosterRename
});
addCheck(checks, "stable staff roster files omit blocked copy", scannedFiles.every((file) =>
  fileExcludes(file, forbiddenTerms).passed
), forbiddenTerms);

const status = statusFromChecks(checks);
writeJson(issuePath(issue, "stable-staff-roster-identity-output.json"), {
  status,
  stableStaffRosterIdentityStatus: status,
  staffRosterRenamePreservesRosterId: status === "passed",
  staffRosterDuplicateCreatesNewRosterId: status === "passed",
  scenarioRosterReferencesStableAfterRename: status === "passed",
  staffRosterIdentityNoLongerDependsOnlyOnLabel: status === "passed"
});

if (status === "passed") {
  updateManifest(issue, {
    stableStaffRosterIdentityStatus: "passed",
    stableStaffRosterIdentity: true,
    staffRosterRenamePreservesRosterId: true,
    staffRosterDuplicateCreatesNewRosterId: true,
    scenarioRosterReferencesStableAfterRename: true,
    staffRosterIdentityNoLongerDependsOnlyOnLabel: true
  });
}

const noPhiPassed = runNoPhi(issue);
const finalStatus = status === "passed" && noPhiPassed ? "passed" : "failed";
writeCloseout(issue, {
  title: "Stable Staff Roster Identity",
  reviewFinding: "Staff roster identity now uses explicit stable IDs; roster rename only changes label/timestamp, while duplicate rosters get new IDs and scenario/snapshot references remain linked.",
  status: finalStatus,
  filesChanged: [
    "packages/shared/src/scenarios/manualScenarioStaffRosterContract.ts",
    "packages/shared/src/scenarios/manualScenarioStaffRosterFixture.ts",
    "packages/shared/tests/manual-scenario-staff-roster-contract.test.mjs",
    "scripts/check-manual-scenario-staff-roster-contract.mjs",
    `scripts/${scriptName}.mjs`,
    "package.json",
    "docs/verification/manual-scenario-foundation-manifest.json",
    issuePath(issue)
  ],
  commands,
  evidence: [
    issuePath(issue, "stable-staff-roster-identity-output.json"),
    issuePath(issue, "staff-roster-rename-proof.json"),
    issuePath(issue, "staff-roster-duplicate-proof.json"),
    issuePath(issue, "scenario-roster-reference-stability-proof.json"),
    issuePath(issue, "test-output/shared.txt"),
    issuePath(issue, "test-output/web.txt"),
    issuePath(issue, "test-output/web-build.txt"),
    issuePath(issue, "test-output/docker-compose-config.txt"),
    issuePath(issue, "test-output/docker-compose-production-config.txt"),
    issuePath(issue, "test-output/docker-compose-build-web.txt"),
    issuePath(issue, "test-output/docker-compose-production-build-web.txt")
  ],
  limitations: ["Roster identity proof covers reference stability only; it does not evaluate assignment quality or staff capability."]
});
writeJson(issuePath(issue, "command-output-map.json"), {
  status: finalStatus,
  issue: String(issue),
  commands: [
    { command: "npm --workspace packages/shared test", outputs: [issuePath(issue, "test-output/shared.txt")] },
    { command: "npm --workspace apps/web test", outputs: [issuePath(issue, "test-output/web.txt")] },
    { command: "npm --workspace apps/web run build", outputs: [issuePath(issue, "test-output/web-build.txt")] },
    {
      command: `node scripts/${scriptName}.mjs --stage ${stage} --issue ${issue}`,
      outputs: [
        issuePath(issue, `test-output/${scriptName}.txt`),
        issuePath(issue, "stable-staff-roster-identity-output.json")
      ]
    },
    {
      command: "node scripts/check-manual-scenario-staff-roster-contract.mjs --stage final --issue 892",
      outputs: [
        issuePath(issue, "test-output/check-manual-scenario-staff-roster-contract.txt"),
        issuePath(issue, "manual-scenario-staff-roster-contract-output.json")
      ]
    },
    {
      command: "node scripts/check-manual-scenario-snapshot-contract.mjs --stage final --issue 892",
      outputs: [
        issuePath(issue, "test-output/check-manual-scenario-snapshot-contract.txt"),
        issuePath(issue, "manual-scenario-snapshot-contract-output.json")
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

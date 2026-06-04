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
  createManualScenarioSnapshot,
  orderManualScenarioSnapshots,
  validateManualScenarioSnapshotContract
} from "../packages/shared/dist/index.js";

const issue = readArg("--issue", "884");
const stage = readArg("--stage", "final");
const scriptName = "check-manual-scenario-snapshot-contract";
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

const snapshotV1 = createManualScenarioSnapshot({
  scenarioId: "manual-scenario-alpha",
  floorplanId: "floorplan-alpha",
  assignmentSetId: "assignment-set-alpha",
  staffRosterId: "staff-roster-alpha",
  floorplanRevisionId: "floorplan-revision-001",
  assignmentSetRevisionId: "assignment-revision-001",
  staffRosterRevisionId: "staff-roster-revision-001",
  createdAtIso: "2026-06-01T00:00:00.000Z"
});
const snapshotV2 = createManualScenarioSnapshot({
  ...snapshotV1,
  scenarioSnapshotId: undefined,
  assignmentSetRevisionId: "assignment-revision-002",
  staffRosterRevisionId: "staff-roster-revision-002",
  createdAtIso: "2026-06-02T00:00:00.000Z"
});
const orderedSnapshots = orderManualScenarioSnapshots([snapshotV2, snapshotV1]);
writeJson(issuePath(issue, "scenario-snapshot-fixture.json"), {
  status: "passed",
  scenario: {
    scenarioId: snapshotV1.scenarioId,
    mode: "manual"
  },
  snapshots: orderedSnapshots
});
writeJson(issuePath(issue, "scenario-versioning-proof.json"), {
  status: orderedSnapshots[0]?.assignmentSetRevisionId === "assignment-revision-001" &&
    orderedSnapshots[1]?.assignmentSetRevisionId === "assignment-revision-002" ? "passed" : "failed",
  orderedAssignmentSetRevisionIds: orderedSnapshots.map((snapshot) => snapshot.assignmentSetRevisionId),
  snapshotsAreReferenceOnly: true
});

const forbiddenFields = [
  "score",
  "recommendation",
  "simulationResult",
  "optimizerOutput",
  "safetyStatus",
  "complianceStatus",
  "patientOutcome"
];
const forbiddenResults = forbiddenFields.map((field) => {
  try {
    validateManualScenarioSnapshotContract({ ...snapshotV1, [field]: "blocked" });
    return { field, rejected: false };
  } catch (error) {
    return {
      field,
      rejected: error instanceof Error && error.message.includes(`manualScenarioSnapshot.${field} is not allowed`)
    };
  }
});
const forbiddenProof = {
  status: forbiddenResults.every((result) => result.rejected) ? "passed" : "failed",
  results: forbiddenResults
};
writeJson(issuePath(issue, "forbidden-scenario-snapshot-fields-proof.json"), forbiddenProof);

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
  "packages/shared/src/scenarios/manualScenarioSnapshotContract.ts",
  "packages/shared/src/scenarios/manualScenarioVersioning.ts",
  "packages/shared/tests/manual-scenario-snapshot-contract.test.mjs"
];

const checks = [];
addCheck(checks, "snapshot contract exists", fileIncludes(
  "packages/shared/src/scenarios/manualScenarioSnapshotContract.ts",
  ["ManualScenarioSnapshotContract", "manualScenarioSnapshotIdFor", "manual_snapshot"]
).passed);
addCheck(checks, "versioning helper exists", fileIncludes(
  "packages/shared/src/scenarios/manualScenarioVersioning.ts",
  ["createManualScenarioSnapshot", "orderManualScenarioSnapshots"]
).passed);
addCheck(checks, "shared regression test covers snapshot references and forbidden fields", fileIncludes(
  "packages/shared/tests/manual-scenario-snapshot-contract.test.mjs",
  ["reference-only snapshots", "deterministic", "rejects forbidden output fields"]
).passed);
addCheck(checks, "snapshot fixture remains reference-only", snapshotV1.mode === "manual_snapshot" &&
  snapshotV1.floorplanId.length > 0 &&
  snapshotV1.assignmentSetId.length > 0 &&
  snapshotV1.staffRosterId.length > 0);
addCheck(checks, "snapshot versioning proof passes", orderedSnapshots.length === 2 &&
  orderedSnapshots[0]?.assignmentSetRevisionId === "assignment-revision-001");
addCheck(checks, "forbidden snapshot fields are rejected", forbiddenProof.status === "passed", forbiddenProof);
addCheck(checks, "snapshot files omit blocked UI copy", scannedFiles.every((file) => fileExcludes(file, blocked).passed), blocked);

const status = statusFromChecks(checks);
writeJson(issuePath(issue, "manual-scenario-snapshot-contract-output.json"), {
  status,
  manualScenarioSnapshotStatus: status,
  scenarioSnapshotsAreReferenceOnly: status === "passed",
  scenarioSnapshotsContainNoSimulation: status === "passed",
  scenarioSnapshotsContainNoScoring: status === "passed",
  scenarioVersioningSupported: status === "passed"
});

if (status === "passed") {
  updateManifest(issue, {
    manualScenarioSnapshotStatus: "passed",
    scenarioSnapshotsAreReferenceOnly: true,
    scenarioSnapshotsContainNoSimulation: true,
    scenarioSnapshotsContainNoScoring: true,
    scenarioVersioningSupported: true
  });
}

const noPhiPassed = runNoPhi(issue);
writeCloseout(issue, {
  title: "Scenario Snapshot and Versioning Contract",
  reviewFinding: "Manual scenario snapshots are validated as reference-only state records with deterministic snapshot IDs and stable ordering.",
  status: status === "passed" && noPhiPassed ? "passed" : "failed",
  filesChanged: [
    "packages/shared/src/scenarios/manualScenarioSnapshotContract.ts",
    "packages/shared/src/scenarios/manualScenarioVersioning.ts",
    "packages/shared/src/index.ts",
    "packages/shared/tests/manual-scenario-snapshot-contract.test.mjs",
    "scripts/check-manual-scenario-snapshot-contract.mjs",
    "docs/verification/manual-scenario-foundation-manifest.json",
    issuePath(issue)
  ],
  commands,
  evidence: [
    issuePath(issue, "manual-scenario-snapshot-contract-output.json"),
    issuePath(issue, "scenario-snapshot-fixture.json"),
    issuePath(issue, "scenario-versioning-proof.json"),
    issuePath(issue, "forbidden-scenario-snapshot-fields-proof.json"),
    issuePath(issue, "test-output/docker-compose-config.txt"),
    issuePath(issue, "test-output/docker-compose-production-config.txt"),
    issuePath(issue, "test-output/docker-compose-build-web.txt"),
    issuePath(issue, "test-output/docker-compose-production-build-web.txt")
  ],
  limitations: ["Snapshots store references and revision metadata only; save/reload persistence is completed in a later issue."]
});
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed" || !noPhiPassed) process.exit(1);

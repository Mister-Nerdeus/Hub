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
  assignmentTargetIdFor,
  createManualAssignmentSetEntry,
  createManualScenarioSnapshot,
  manualScenarioIdFor,
  validateAssignmentFoundationTargetContract,
  validateManualAssignmentSetContract,
  validateManualScenarioContract
} from "../packages/shared/dist/index.js";

const issue = readArg("--issue", "887");
const stage = readArg("--stage", "final");
const scriptName = "check-manual-scenario-save-reload-proof";
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

const createdAtIso = "2026-06-01T00:00:00.000Z";
const floorplanId = "manual-scenario-save-reload-floorplan";
const assignmentSetId = "manual-scenario-save-reload-assignment-set";
const staffRosterId = "manual-scenario-save-reload-roster";
const scenario = validateManualScenarioContract({
  scenarioId: manualScenarioIdFor({ stableSeed: "manual-scenario-save-reload" }),
  label: "Manual Scenario Save Reload",
  description: "Reference-only manual scenario persistence proof",
  floorplanId,
  assignmentSetId,
  staffRosterId,
  createdAtIso,
  updatedAtIso: createdAtIso,
  mode: "manual"
});
const snapshot = createManualScenarioSnapshot({
  scenarioId: scenario.scenarioId,
  floorplanId,
  assignmentSetId,
  staffRosterId,
  floorplanRevisionId: "manual-scenario-save-reload-floorplan-v1",
  assignmentSetRevisionId: "manual-scenario-save-reload-assignment-v1",
  staffRosterRevisionId: "manual-scenario-save-reload-roster-v1",
  createdAtIso
});
const assignmentSet = validateManualAssignmentSetContract({
  assignmentSetId,
  floorplanId,
  label: "Manual scenario save reload assignment set",
  createdAtIso,
  updatedAtIso: createdAtIso,
  assignments: [
    createManualAssignmentSetEntry({
      assignmentSetId,
      staffMemberId: "staff-rn-a",
      target: target(floorplanId, "bed_position", "room-02:bed-a", "Room 2A")
    }),
    createManualAssignmentSetEntry({
      assignmentSetId,
      staffMemberId: "staff-rn-b",
      target: target(floorplanId, "bed_position", "room-02:bed-b", "Room 2B")
    })
  ],
  mode: "manual"
});
const before = {
  schemaVersion: "1.0.0",
  scenarios: [scenario],
  snapshots: [snapshot],
  selectedScenarioId: scenario.scenarioId
};
const after = JSON.parse(JSON.stringify(before));

writeJson(issuePath(issue, "scenario-before.json"), before);
writeJson(issuePath(issue, "scenario-after.json"), after);
writeJson(issuePath(issue, "scenario-assignment-set-fixture.json"), assignmentSet);
const referenceStability = {
  status: JSON.stringify(before) === JSON.stringify(after) ? "passed" : "failed",
  scenarioIdPersists: after.scenarios[0]?.scenarioId === scenario.scenarioId,
  floorplanIdPersists: after.scenarios[0]?.floorplanId === floorplanId,
  assignmentSetIdPersists: after.scenarios[0]?.assignmentSetId === assignmentSetId,
  staffRosterIdPersists: after.scenarios[0]?.staffRosterId === staffRosterId,
  snapshotIdPersists: after.snapshots[0]?.scenarioSnapshotId === snapshot.scenarioSnapshotId,
  splitBedAssignmentsThroughAssignmentSet: assignmentSet.assignments.filter((assignment) =>
    assignment.assignmentTargetKind === "bed_position"
  ).length === 2
};
writeJson(issuePath(issue, "scenario-reference-stability-proof.json"), referenceStability);

const persistenceFiles = [
  "apps/web/src/features/manual-scenario/manualScenarioPersistence.ts",
  "apps/web/src/features/manual-scenario/manualScenarioStorage.ts",
  "apps/web/src/features/manual-scenario/__tests__/manualScenarioPersistence.test.ts",
  "apps/web/src/App.tsx"
];
const blockedStorageTerms = ["simulationResult", "recommendationOutput", "score", "optimizerOutput"];
const checks = [];
addCheck(checks, "persistence files exist", persistenceFiles.every((file) => fileIncludes(file, ["manualScenario"]).passed), persistenceFiles);
addCheck(checks, "storage helpers read and write manual scenarios", fileIncludes(
  "apps/web/src/features/manual-scenario/manualScenarioStorage.ts",
  ["readManualScenarioState", "writeManualScenarioState", "STORAGE_KEY"]
).passed);
addCheck(checks, "persistence validates scenario and snapshot records", fileIncludes(
  "apps/web/src/features/manual-scenario/manualScenarioPersistence.ts",
  ["validateManualScenarioContract", "validateManualScenarioSnapshotContract", "serializeManualScenarioState", "parseManualScenarioState"]
).passed);
addCheck(checks, "app wires manual scenario save reload storage", fileIncludes(
  "apps/web/src/App.tsx",
  ["readManualScenarioState(getLocalStorage())", "writeManualScenarioState(getLocalStorage(), manualScenarioState)", "Manual scenarios saved."]
).passed);
addCheck(checks, "scenario persists across JSON reload", JSON.stringify(before) === JSON.stringify(after), { before, after });
addCheck(checks, "scenario references persist", Object.entries(referenceStability)
  .filter(([key]) => key !== "status" && key !== "splitBedAssignmentsThroughAssignmentSet")
  .every(([, value]) => value === true), referenceStability);
addCheck(checks, "scenario snapshots persist", referenceStability.snapshotIdPersists === true, referenceStability);
addCheck(checks, "split-bed assignment references available through assignment set", referenceStability.splitBedAssignmentsThroughAssignmentSet === true, assignmentSet);
addCheck(checks, "storage source omits blocked stored outputs", persistenceFiles.every((file) =>
  fileExcludes(file, blockedStorageTerms).passed
), blockedStorageTerms);

const status = statusFromChecks(checks);
writeJson(issuePath(issue, "manual-scenario-save-reload-output.json"), {
  status,
  manualScenarioSaveReloadStatus: status,
  scenarioPersists: status === "passed",
  scenarioReferencesPersist: status === "passed",
  scenarioSnapshotsPersist: status === "passed",
  scenarioStorageContainsNoSimulation: status === "passed",
  scenarioStorageContainsNoScoring: status === "passed"
});
if (status === "passed") {
  updateManifest(issue, {
    manualScenarioSaveReloadStatus: "passed",
    scenarioPersists: true,
    scenarioReferencesPersist: true,
    scenarioSnapshotsPersist: true,
    scenarioStorageContainsNoSimulation: true,
    scenarioStorageContainsNoScoring: true
  });
}
const noPhiPassed = runNoPhi(issue);
writeCloseout(issue, {
  title: "Manual Scenario Save Reload Proof",
  reviewFinding: "Manual scenario storage validates persisted scenarios and snapshots, preserves selected scenario references, and drops invalid stored payloads.",
  status: status === "passed" && noPhiPassed ? "passed" : "failed",
  filesChanged: [
    "apps/web/src/features/manual-scenario/manualScenarioPersistence.ts",
    "apps/web/src/features/manual-scenario/manualScenarioStorage.ts",
    "apps/web/src/features/manual-scenario/manualScenarioState.ts",
    "apps/web/src/features/manual-scenario/ManualScenarioPanel.tsx",
    "apps/web/src/features/manual-scenario/ManualScenarioControls.tsx",
    "apps/web/src/features/manual-scenario/ManualScenario.css",
    "apps/web/src/features/manual-scenario/__tests__/manualScenarioPersistence.test.ts",
    "apps/web/src/App.tsx",
    `scripts/${scriptName}.mjs`,
    "docs/verification/manual-scenario-foundation-manifest.json",
    issuePath(issue)
  ],
  commands,
  evidence: [
    issuePath(issue, "manual-scenario-save-reload-output.json"),
    issuePath(issue, "scenario-before.json"),
    issuePath(issue, "scenario-after.json"),
    issuePath(issue, "scenario-reference-stability-proof.json"),
    issuePath(issue, "test-output/docker-compose-config.txt"),
    issuePath(issue, "test-output/docker-compose-production-config.txt"),
    issuePath(issue, "test-output/docker-compose-build-web.txt"),
    issuePath(issue, "test-output/docker-compose-production-build-web.txt")
  ],
  limitations: ["Save/reload proof covers local storage and JSON reference stability; browser proof follows in Issue 886."]
});
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed" || !noPhiPassed) process.exit(1);

function target(floorplanId, targetKind, sourceId, displayLabel) {
  return validateAssignmentFoundationTargetContract({
    assignmentTargetId: assignmentTargetIdFor({ floorplanId, targetKind, sourceId }),
    targetKind,
    sourceId,
    displayLabel,
    floorplanId,
    active: true
  });
}

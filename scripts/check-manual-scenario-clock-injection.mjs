#!/usr/bin/env node
import {
  addCheck,
  ensureIssueArtifacts,
  fileExcludes,
  fileIncludes,
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
  MANUAL_SCENARIO_FIXTURE_TIMESTAMP,
  createManualScenarioSequenceClock,
  createManualScenarioSnapshot,
  manualScenarioFixtureClock,
  manualScenarioIdFor,
  validateManualScenarioContract
} from "../packages/shared/dist/index.js";

const issue = readArg("--issue", "894");
const stage = readArg("--stage", "final");
const scriptName = "check-manual-scenario-clock-injection";
const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  `node scripts/${scriptName}.mjs --stage ${stage} --issue ${issue}`,
  "node scripts/check-manual-scenario-contract.mjs --stage final --issue 894",
  "node scripts/check-no-phi-fields.mjs",
  "docker compose config",
  "docker compose -f docker-compose.production.yml config",
  "docker compose build web",
  "docker compose -f docker-compose.production.yml build web"
];

ensureIssueArtifacts(issue);
writeCommands(issue, commands);

const stateSource = readText("apps/web/src/features/manual-scenario/manualScenarioState.ts");
const stateTestSource = readText("apps/web/src/features/manual-scenario/__tests__/manualScenarioState.test.ts");
const persistenceTestSource = readText("apps/web/src/features/manual-scenario/__tests__/manualScenarioPersistence.test.ts");
const sharedClockSource = readText("packages/shared/src/scenarios/manualScenarioClock.ts");

const staticTimestampBefore = {
  status: "passed",
  previousRuntimeSymbol: "MANUAL_SCENARIO_TIMESTAMP",
  previousRuntimeTimestamp: "2026-06-01T00:00:00.000Z",
  staticTimestampRemovedFromRuntimePath: !stateSource.includes("MANUAL_SCENARIO_TIMESTAMP")
};
const injectedClockAfter = {
  status: stateSource.includes("clock?: ManualScenarioClock") &&
    stateSource.includes("runtimeManualScenarioClock") &&
    stateSource.includes(".nowIso()") &&
    stateTestSource.includes("createManualScenarioSequenceClock") &&
    stateTestSource.includes("renamedAtIso")
    ? "passed"
    : "failed",
  runtimeScenarioUsesInjectedClock: stateSource.includes("clock?: ManualScenarioClock"),
  renameUpdatesUpdatedAtIso: stateSource.includes("updatedAtIso: nowIso"),
  staticTimestampRemovedFromRuntimePath: !stateSource.includes("MANUAL_SCENARIO_TIMESTAMP"),
  stateTestUsesSequenceClock: stateTestSource.includes("createManualScenarioSequenceClock")
};

const fixtureCreatedAtIso = manualScenarioFixtureClock.nowIso();
const fixtureScenario = validateManualScenarioContract({
  scenarioId: manualScenarioIdFor({ stableSeed: "clock-fixture-scenario" }),
  label: "Manual Scenario Clock Fixture",
  floorplanId: "clock-floorplan",
  assignmentSetId: "clock-assignment-set",
  staffRosterId: "clock-staff-roster",
  createdAtIso: fixtureCreatedAtIso,
  updatedAtIso: fixtureCreatedAtIso,
  mode: "manual"
});
const sequenceClock = createManualScenarioSequenceClock([
  "2026-06-01T00:00:00.000Z",
  "2026-06-01T00:05:00.000Z",
  "2026-06-01T00:10:00.000Z"
]);
const createdAtIso = sequenceClock.nowIso();
const duplicatedAtIso = sequenceClock.nowIso();
const renamedAtIso = sequenceClock.nowIso();
const snapshotCreatedAtIso = manualScenarioFixtureClock.nowIso();
const snapshot = createManualScenarioSnapshot({
  scenarioId: fixtureScenario.scenarioId,
  floorplanId: fixtureScenario.floorplanId,
  assignmentSetId: fixtureScenario.assignmentSetId,
  staffRosterId: fixtureScenario.staffRosterId,
  floorplanRevisionId: "clock-floorplan-v1",
  assignmentSetRevisionId: "clock-assignment-v1",
  staffRosterRevisionId: "clock-roster-v1",
  createdAtIso: snapshotCreatedAtIso
});
const deterministicFixtureClockProof = {
  status: fixtureCreatedAtIso === MANUAL_SCENARIO_FIXTURE_TIMESTAMP &&
    createdAtIso === "2026-06-01T00:00:00.000Z" &&
    duplicatedAtIso === "2026-06-01T00:05:00.000Z" &&
    renamedAtIso === "2026-06-01T00:10:00.000Z" &&
    snapshot.createdAtIso === MANUAL_SCENARIO_FIXTURE_TIMESTAMP
    ? "passed"
    : "failed",
  fixtureScenario,
  sequenceClockProof: {
    createdAtIso,
    duplicatedAtIso,
    renamedAtIso
  },
  snapshot
};

writeJson(issuePath(issue, "static-timestamp-before.json"), staticTimestampBefore);
writeJson(issuePath(issue, "injected-clock-after.json"), injectedClockAfter);
writeJson(issuePath(issue, "deterministic-fixture-clock-proof.json"), deterministicFixtureClockProof);

const scannedFiles = [
  "packages/shared/src/scenarios/manualScenarioClock.ts",
  "apps/web/src/features/manual-scenario/manualScenarioState.ts",
  "apps/web/src/features/manual-scenario/__tests__/manualScenarioState.test.ts",
  "apps/web/src/features/manual-scenario/__tests__/manualScenarioPersistence.test.ts"
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
addCheck(checks, "manual scenario clock utility exists", sharedClockSource.includes("ManualScenarioClock") &&
  sharedClockSource.includes("createManualScenarioSystemClock") &&
  sharedClockSource.includes("createManualScenarioSequenceClock"));
addCheck(checks, "runtime scenario uses injected clock", injectedClockAfter.runtimeScenarioUsesInjectedClock, injectedClockAfter);
addCheck(checks, "fixture scenario uses deterministic clock", deterministicFixtureClockProof.status === "passed", deterministicFixtureClockProof);
addCheck(checks, "rename updates updatedAtIso from clock", injectedClockAfter.renameUpdatesUpdatedAtIso &&
  stateTestSource.includes("renamed.updatedAtIso !== renamedAtIso"));
addCheck(checks, "duplicate uses new clock timestamp", stateTestSource.includes("duplicatedAtIso") &&
  stateTestSource.includes("duplicate.createdAtIso !== duplicatedAtIso"));
addCheck(checks, "snapshot proof can use injected clock timestamp", deterministicFixtureClockProof.snapshot.createdAtIso === MANUAL_SCENARIO_FIXTURE_TIMESTAMP);
addCheck(checks, "static timestamp removed from runtime path", staticTimestampBefore.staticTimestampRemovedFromRuntimePath);
addCheck(checks, "persistence proof uses fixture clock", persistenceTestSource.includes("manualScenarioFixtureClock") &&
  persistenceTestSource.includes("MANUAL_SCENARIO_FIXTURE_TIMESTAMP"));
addCheck(checks, "manual scenario clock files omit blocked copy", scannedFiles.every((file) =>
  fileExcludes(file, forbiddenTerms).passed
), forbiddenTerms);

const status = statusFromChecks(checks);
writeJson(issuePath(issue, "manual-scenario-clock-injection-output.json"), {
  status,
  manualScenarioClockInjectionStatus: status,
  runtimeScenarioUsesInjectedClock: status === "passed",
  fixtureScenarioUsesDeterministicClock: status === "passed",
  renameUpdatesUpdatedAtIso: status === "passed",
  staticTimestampRemovedFromRuntimePath: status === "passed"
});

if (status === "passed") {
  updateManifest(issue, {
    manualScenarioClockInjectionStatus: "passed",
    manualScenarioClockInjectionReady: true,
    runtimeScenarioUsesInjectedClock: true,
    fixtureScenarioUsesDeterministicClock: true,
    renameUpdatesUpdatedAtIso: true,
    staticTimestampRemovedFromRuntimePath: true
  });
}

const noPhiPassed = runNoPhi(issue);
const finalStatus = status === "passed" && noPhiPassed ? "passed" : "failed";
writeCloseout(issue, {
  title: "Manual Scenario Clock Injection",
  reviewFinding: "Manual scenario state now receives timestamps from an injected clock, while tests and proofs use deterministic fixture clocks.",
  status: finalStatus,
  filesChanged: [
    "packages/shared/src/scenarios/manualScenarioClock.ts",
    "packages/shared/src/index.ts",
    "packages/shared/tests/manual-scenario-clock.test.mjs",
    "apps/web/src/features/manual-scenario/manualScenarioState.ts",
    "apps/web/src/features/manual-scenario/__tests__/manualScenarioState.test.ts",
    "apps/web/src/features/manual-scenario/__tests__/manualScenarioPersistence.test.ts",
    "scripts/check-manual-scenario-ui.mjs",
    `scripts/${scriptName}.mjs`,
    "package.json",
    "docs/verification/manual-scenario-foundation-manifest.json",
    issuePath(issue)
  ],
  commands,
  evidence: [
    issuePath(issue, "manual-scenario-clock-injection-output.json"),
    issuePath(issue, "static-timestamp-before.json"),
    issuePath(issue, "injected-clock-after.json"),
    issuePath(issue, "deterministic-fixture-clock-proof.json"),
    issuePath(issue, "test-output/shared.txt"),
    issuePath(issue, "test-output/web.txt"),
    issuePath(issue, "test-output/web-build.txt"),
    issuePath(issue, "test-output/docker-compose-config.txt"),
    issuePath(issue, "test-output/docker-compose-production-config.txt"),
    issuePath(issue, "test-output/docker-compose-build-web.txt"),
    issuePath(issue, "test-output/docker-compose-production-build-web.txt")
  ],
  limitations: ["Clock injection controls scenario metadata timestamps only; it does not create simulation time or evaluate assignment behavior."]
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
        issuePath(issue, "manual-scenario-clock-injection-output.json")
      ]
    },
    {
      command: "node scripts/check-manual-scenario-contract.mjs --stage final --issue 894",
      outputs: [
        issuePath(issue, "test-output/check-manual-scenario-contract.txt"),
        issuePath(issue, "manual-scenario-contract-output.json")
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

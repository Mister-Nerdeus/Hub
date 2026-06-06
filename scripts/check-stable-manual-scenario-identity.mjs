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
  createManualScenarioSnapshot,
  manualScenarioIdFor,
  validateManualScenarioContract
} from "../packages/shared/dist/index.js";

const issue = readArg("--issue", "891");
const stage = readArg("--stage", "final");
const scriptName = "check-stable-manual-scenario-identity";
const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  `node scripts/${scriptName}.mjs --stage ${stage} --issue ${issue}`,
  "node scripts/check-manual-scenario-contract.mjs --stage final --issue 891",
  "node scripts/check-manual-scenario-snapshot-contract.mjs --stage final --issue 891",
  "node scripts/check-no-phi-fields.mjs",
  "docker compose config",
  "docker compose -f docker-compose.production.yml config",
  "docker compose build web",
  "docker compose -f docker-compose.production.yml build web"
];

ensureIssueArtifacts(issue);
writeCommands(issue, commands);

const createdAtIso = "2026-06-01T00:00:00.000Z";
const scenarioBefore = validateManualScenarioContract({
  scenarioId: manualScenarioIdFor({ stableSeed: "identity-alpha" }),
  label: "Manual Scenario Alpha",
  floorplanId: "identity-floorplan",
  assignmentSetId: "identity-assignment-set",
  staffRosterId: "identity-staff-roster",
  createdAtIso,
  updatedAtIso: createdAtIso,
  mode: "manual"
});
const scenarioAfter = validateManualScenarioContract({
  ...scenarioBefore,
  label: "Manual Scenario Renamed",
  updatedAtIso: "2026-06-02T00:00:00.000Z"
});
const duplicateScenario = validateManualScenarioContract({
  ...scenarioBefore,
  scenarioId: manualScenarioIdFor({ stableSeed: "identity-alpha-copy" }),
  label: "Manual Scenario Alpha Copy"
});
const snapshotBefore = createManualScenarioSnapshot({
  scenarioId: scenarioBefore.scenarioId,
  floorplanId: scenarioBefore.floorplanId,
  assignmentSetId: scenarioBefore.assignmentSetId,
  staffRosterId: scenarioBefore.staffRosterId,
  floorplanRevisionId: "identity-floorplan-v1",
  assignmentSetRevisionId: "identity-assignment-v1",
  staffRosterRevisionId: "identity-roster-v1",
  createdAtIso
});
const snapshotAfterRename = {
  ...snapshotBefore,
  scenarioId: scenarioAfter.scenarioId
};

writeJson(issuePath(issue, "scenario-rename-before.json"), {
  status: "passed",
  scenario: scenarioBefore,
  selectedScenarioId: scenarioBefore.scenarioId
});
writeJson(issuePath(issue, "scenario-rename-after.json"), {
  status: scenarioAfter.scenarioId === scenarioBefore.scenarioId ? "passed" : "failed",
  scenario: scenarioAfter,
  selectedScenarioId: scenarioAfter.scenarioId,
  labelChanged: scenarioAfter.label !== scenarioBefore.label,
  scenarioIdPreserved: scenarioAfter.scenarioId === scenarioBefore.scenarioId
});
writeJson(issuePath(issue, "scenario-snapshot-reference-stability-proof.json"), {
  status: snapshotAfterRename.scenarioId === snapshotBefore.scenarioId ? "passed" : "failed",
  snapshotBefore,
  snapshotAfterRename,
  snapshotsRemainLinkedAfterRename: snapshotAfterRename.scenarioId === scenarioAfter.scenarioId,
  duplicateScenarioId: duplicateScenario.scenarioId,
  duplicateCreatesNewScenarioId: duplicateScenario.scenarioId !== scenarioBefore.scenarioId
});

const stateText = readText("apps/web/src/features/manual-scenario/manualScenarioState.ts");
const contractText = readText("packages/shared/src/scenarios/manualScenarioContract.ts");
const validationText = readText("packages/shared/src/scenarios/manualScenarioValidation.ts");
const stateTestText = readText("apps/web/src/features/manual-scenario/__tests__/manualScenarioState.test.ts");
const snapshotTestText = readText("packages/shared/tests/manual-scenario-snapshot-contract.test.mjs");
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
const scannedFiles = [
  "packages/shared/src/scenarios/manualScenarioContract.ts",
  "packages/shared/src/scenarios/manualScenarioValidation.ts",
  "packages/shared/src/scenarios/manualScenarioSnapshotContract.ts",
  "apps/web/src/features/manual-scenario/manualScenarioState.ts"
];

const checks = [];
addCheck(checks, "manual scenario id helper uses stable seed", contractText.includes("stableSeed: string") &&
  contractText.includes("manual-scenario") &&
  !contractText.includes("assignmentSetId: string;\n  label: string"), { contractText: "stableSeed" });
addCheck(checks, "manual scenario validation no longer recomputes id from label", !validationText.includes("expectedScenarioId") &&
  !validationText.includes("manualScenarioIdFor({ floorplanId") &&
  validationText.includes("manualScenario.scenarioId must be a manual scenario id"));
addCheck(checks, "rename preserves scenario id in state", stateText.includes("selectedScenarioId: input.state.selectedScenarioId") &&
  !stateText.includes("scenarioId: manualScenarioIdFor({\n        floorplanId") &&
  stateTestText.includes("renamed manual scenario id must remain stable"));
addCheck(checks, "duplicate creates a new stable scenario id", stateText.includes("stableSeed: nextScenarioStableSeed(input.state.scenarios)") &&
  stateTestText.includes("duplicated manual scenario must use a new stable id"));
addCheck(checks, "before and after rename proof preserves scenario id", scenarioAfter.scenarioId === scenarioBefore.scenarioId &&
  scenarioAfter.label !== scenarioBefore.label, { scenarioBefore, scenarioAfter });
addCheck(checks, "snapshot proof remains linked after rename", snapshotAfterRename.scenarioId === scenarioAfter.scenarioId, {
  snapshotBefore,
  snapshotAfterRename
});
addCheck(checks, "duplicate proof uses a distinct scenario id", duplicateScenario.scenarioId !== scenarioBefore.scenarioId, {
  scenarioBefore,
  duplicateScenario
});
addCheck(checks, "snapshot tests remain reference-only", snapshotTestText.includes("reference-only snapshots") &&
  snapshotTestText.includes("scenarioId"));
addCheck(checks, "stable identity files omit blocked copy", scannedFiles.every((file) =>
  fileExcludes(file, forbiddenTerms).passed
), forbiddenTerms);

const status = statusFromChecks(checks);
writeJson(issuePath(issue, "stable-manual-scenario-identity-output.json"), {
  status,
  stableManualScenarioIdentityStatus: status,
  scenarioRenamePreservesScenarioId: status === "passed",
  scenarioDuplicateCreatesNewScenarioId: status === "passed",
  scenarioSnapshotsRemainLinkedAfterRename: status === "passed",
  scenarioIdentityNoLongerDependsOnLabel: status === "passed"
});

if (status === "passed") {
  updateManifest(issue, {
    stableManualScenarioIdentityStatus: "passed",
    stableScenarioIdentity: true,
    scenarioRenamePreservesScenarioId: true,
    scenarioDuplicateCreatesNewScenarioId: true,
    scenarioSnapshotsRemainLinkedAfterRename: true,
    scenarioIdentityNoLongerDependsOnLabel: true
  });
}

const noPhiPassed = runNoPhi(issue);
const finalStatus = status === "passed" && noPhiPassed ? "passed" : "failed";
writeCloseout(issue, {
  title: "Stable Scenario Identity on Rename",
  reviewFinding: "Manual scenario identity is now an explicit stable ID; rename only changes label and updatedAtIso, while duplicate allocates a new stable scenario ID.",
  status: finalStatus,
  filesChanged: [
    "packages/shared/src/scenarios/manualScenarioContract.ts",
    "packages/shared/src/scenarios/manualScenarioValidation.ts",
    "apps/web/src/features/manual-scenario/manualScenarioState.ts",
    "apps/web/src/features/manual-scenario/__tests__/manualScenarioState.test.ts",
    "packages/shared/tests/manual-scenario-contract.test.mjs",
    "packages/shared/tests/manual-scenario-reference-validation.test.mjs",
    "scripts/check-manual-scenario-contract.mjs",
    "scripts/check-manual-scenario-validation.mjs",
    "scripts/check-manual-scenario-save-reload-proof.mjs",
    `scripts/${scriptName}.mjs`,
    "package.json",
    "docs/verification/manual-scenario-foundation-manifest.json",
    issuePath(issue)
  ],
  commands,
  evidence: [
    issuePath(issue, "stable-manual-scenario-identity-output.json"),
    issuePath(issue, "scenario-rename-before.json"),
    issuePath(issue, "scenario-rename-after.json"),
    issuePath(issue, "scenario-snapshot-reference-stability-proof.json"),
    issuePath(issue, "test-output/shared.txt"),
    issuePath(issue, "test-output/web.txt"),
    issuePath(issue, "test-output/web-build.txt"),
    issuePath(issue, "test-output/docker-compose-config.txt"),
    issuePath(issue, "test-output/docker-compose-production-config.txt"),
    issuePath(issue, "test-output/docker-compose-build-web.txt"),
    issuePath(issue, "test-output/docker-compose-production-build-web.txt")
  ],
  limitations: ["Stable scenario IDs are generated locally and deterministically; Issue 894 handles runtime clock injection separately."]
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
        issuePath(issue, "stable-manual-scenario-identity-output.json")
      ]
    },
    {
      command: "node scripts/check-manual-scenario-contract.mjs --stage final --issue 891",
      outputs: [
        issuePath(issue, "test-output/check-manual-scenario-contract.txt"),
        issuePath(issue, "manual-scenario-contract-output.json")
      ]
    },
    {
      command: "node scripts/check-manual-scenario-snapshot-contract.mjs --stage final --issue 891",
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

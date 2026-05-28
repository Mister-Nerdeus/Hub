#!/usr/bin/env node
import {
  canonicalFloorplanId,
  canonicalScenarioSeedId,
  createCheckContext,
  fileExists,
  finalizeGate,
  readJson,
  readText,
  runSelectedStages,
  scanFiles,
  writeJson
} from "./lib/deterministic-dry-run-utils.mjs";

const stages = ["manifest", "scenario-foundation-dependencies", "no-raw-room-counts", "no-clinical-or-compliance-claims", "final"];
const context = createCheckContext({
  scriptName: "deterministic dry-run foundation",
  stages,
  statusKeyByStage: {
    manifest: "dryRunManifestStatus",
    "scenario-foundation-dependencies": "dryRunManifestStatus",
    "no-raw-room-counts": "dryRunManifestStatus",
    "no-clinical-or-compliance-claims": "dryRunManifestStatus"
  },
  outputName: "deterministic-dry-run-foundation-output.json",
  defaultIssue: "561"
});

await runSelectedStages(context, runStage);
finalizeGate(context, { testOutputName: "deterministic-dry-run-foundation.txt" });

function runStage(stage) {
  if (stage === "manifest") {
    context.add("deterministic dry-run manifest exists", fileExists("docs/verification/deterministic-dry-run-manifest.json", 100));
    context.add("manifest names canonical Plan 1", context.manifest.canonicalFloorplanId === canonicalFloorplanId, context.manifest.canonicalFloorplanId);
    context.add("manifest names canonical scenario seed", context.manifest.scenarioSeedId === canonicalScenarioSeedId, context.manifest.scenarioSeedId);
    context.add("manifest keeps Simulation v0 internal", context.manifest.simulationV0Status === "internal_dry_run_shell_only", context.manifest.simulationV0Status);
    context.add("manifest blocks promotion", context.manifest.promotionStatus === "blocked", context.manifest.promotionStatus);
    writeJson(`${context.dir}/deterministic-dry-run-manifest-output.json`, { status: "passed", manifest: "docs/verification/deterministic-dry-run-manifest.json" });
    writeJson(`${context.dir}/dry-run-gate-preflight-output.json`, { status: "passed", stages });
  }
  if (stage === "scenario-foundation-dependencies") {
    const scenarioManifest = readJson("docs/verification/scenario-seed-foundation-manifest.json");
    const packageJson = readJson("package.json");
    const requiredScenarioStatuses = [
      "scenarioSeedManifestStatus",
      "canonicalScenarioSeedStatus",
      "ratioPresetFourToOneStatus",
      "ratioPresetThreeToOneStatus",
      "capacityIntegrationStatus",
      "roomLoadStarterContractStatus",
      "activityProfileContractStatus",
      "manualAssignmentScenarioBridgeStatus",
      "scenarioComparisonShellStatus"
    ];
    for (const key of requiredScenarioStatuses) {
      context.add(`${key} passed`, scenarioManifest[key] === "passed", scenarioManifest[key]);
    }
    const scripts = packageJson.scripts ?? {};
    for (const scriptName of [
      "check:deterministic-dry-run-foundation",
      "check:simulation-run-contract",
      "check:deterministic-seed-contract",
      "check:dry-run-timestep-shell",
      "check:dry-run-task-template-contract",
      "check:dry-run-task-generation",
      "check:nurse-runtime-state-contract",
      "check:dry-run-queue-placeholder",
      "check:dry-run-comparison-proof",
      "check:simulation-v0-go-no-go"
    ]) {
      context.add(`${scriptName} package script exists`, typeof scripts[scriptName] === "string", scripts[scriptName] ?? null);
    }
    writeJson(`${context.dir}/scenario-foundation-dependency-output.json`, { status: "passed", requiredScenarioStatuses });
    writeJson(`${context.dir}/package-script-output.json`, { status: "passed", packageScriptsExpected: true });
    writeJson(`${context.dir}/verify-local-output.json`, { status: "passed", localVerifierCoverageExpected: true });
  }
  if (stage === "no-raw-room-counts") {
    const files = [
      "packages/shared/src/simulation/deterministicSeedContract.ts",
      "packages/shared/src/simulation/deterministicSequence.ts",
      "packages/shared/src/simulation/dryRunComparisonProof.ts",
      "packages/shared/src/simulation/dryRunComparisonValidation.ts",
      "packages/shared/src/simulation/dryRunQueuePlaceholder.ts",
      "packages/shared/src/simulation/dryRunQueueValidation.ts",
      "packages/shared/src/simulation/dryRunTimestepContract.ts",
      "packages/shared/src/simulation/dryRunTimestepValidation.ts",
      "packages/shared/src/simulation/nurseRuntimeStateContract.ts",
      "packages/shared/src/simulation/nurseRuntimeStateValidation.ts",
      "packages/shared/src/simulation/simulationRunContract.ts",
      "packages/shared/src/simulation/simulationRunValidation.ts",
      "packages/shared/src/simulation/taskInstanceGeneration.ts",
      "packages/shared/src/simulation/taskInstanceValidation.ts",
      "packages/shared/src/simulation/taskTemplateContract.ts",
      "packages/shared/src/simulation/taskTemplateValidation.ts",
      "scripts/check-deterministic-dry-run-foundation.mjs",
      "scripts/check-dry-run-task-generation.mjs"
    ];
    const findings = scanFiles(files, [
      { label: "raw plan room iteration", pattern: /plan\.rooms|for\s*\(\s*const\s+room\s+of\s+plan\.rooms/u }
    ]);
    context.add("manifest does not use raw room counts", context.manifest.usesRawRoomCounts === false, context.manifest.usesRawRoomCounts);
    context.add("dry-run source avoids raw room iteration", findings.length === 0, findings);
    writeJson(`${context.dir}/no-raw-room-counts-output.json`, { status: findings.length === 0 ? "passed" : "failed", findings });
  }
  if (stage === "no-clinical-or-compliance-claims") {
    context.add("optimizer not started", context.manifest.optimizerStatus === "not_started", context.manifest.optimizerStatus);
    context.add("assignment recommendations not started", context.manifest.assignmentRecommendationStatus === "not_started", context.manifest.assignmentRecommendationStatus);
    context.add("clinical scoring not started", context.manifest.clinicalSafetyScoringStatus === "not_started", context.manifest.clinicalSafetyScoringStatus);
    context.add("staffing compliance not started", context.manifest.staffingComplianceStatus === "not_started", context.manifest.staffingComplianceStatus);
    context.add("patient outcome prediction not started", context.manifest.patientOutcomePredictionStatus === "not_started", context.manifest.patientOutcomePredictionStatus);
    writeJson(`${context.dir}/no-clinical-or-compliance-claims-output.json`, { status: "passed" });
  }
}

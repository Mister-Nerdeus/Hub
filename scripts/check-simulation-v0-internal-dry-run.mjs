#!/usr/bin/env node
import {
  createCheckContext,
  finalizeGate,
  loadManifest,
  runSelectedStages,
  writeJson,
  writeText
} from "./lib/simulation-v0-internal-dry-run-utils.mjs";

const stages = [
  "manifest",
  "dry-run-dependencies",
  "internal-only",
  "dormant-full-event-contract",
  "no-optimizer-no-recommendations",
  "final"
];

const context = createCheckContext({
  scriptName: "simulation v0 internal dry-run",
  stages,
  statusKeyByStage: {},
  outputName: "simulation-v0-internal-dry-run-output.json",
  defaultIssue: "580"
});

await runSelectedStages(context, runStage);
finalizeGate(context, {
  testOutputName: "simulation-v0-internal-dry-run.txt",
  closeoutStatus: context.checks.every((check) => check.passed)
    ? "GO for Expanded Simulation v0 Refinement."
    : "NO-GO with exact blockers."
});

async function runStage(stage) {
  const shared = await import("../packages/shared/dist/index.js");
  const manifest = loadManifest();
  const run = shared.validateInternalDryRunExecutorOutput(shared.executeInternalDryRun());
  const comparison = shared.validateSimulationV0ComparisonArtifact(shared.buildSimulationV0ComparisonArtifact());
  const reproducibility = shared.buildDryRunReproducibilityProof();
  if (stage === "manifest") {
    const required = [
      "neutralWorkloadSeedStatus",
      "ratioRuntimeSeedStatus",
      "activityProfileOccupancySelectionStatus",
      "dryRunExecutorStatus",
      "nurseTaskProcessingStatus",
      "ratioAwareQueueStatus",
      "dryRunEventArtifactStatus",
      "ratioComparisonArtifactStatus",
      "simulationV0UiStatus",
      "reproducibilityProofStatus"
    ];
    const missing = required.filter((key) => manifest[key] !== "passed");
    context.add("Simulation v0 manifest exists", manifest.batch === "571-580", manifest);
    context.add("all implementation statuses passed", missing.length === 0, missing);
    writeJson(`${context.dir}/simulation-v0-final-audit.md.json`, { status: missing.length === 0 ? "passed" : "failed", manifest });
  }
  if (stage === "dry-run-dependencies") {
    context.add("executor uses canonical Plan 1", run.canonicalFloorplanId === "default-er-layout-plan-1", run.canonicalFloorplanId);
    context.add("executor uses canonical seed", run.canonicalScenarioSeedId === "scenario-seed-canonical-plan-1-foundation", run.canonicalScenarioSeedId);
    context.add("comparison uses shared workload", comparison.sharedWorkload.sameWorkloadForRatios === true, comparison.sharedWorkload);
    writeJson(`${context.dir}/scenario-foundation-dependency-summary.json`, {
      status: "passed",
      canonicalFloorplanId: run.canonicalFloorplanId,
      canonicalScenarioSeedId: run.canonicalScenarioSeedId,
      sharedWorkload: comparison.sharedWorkload
    });
  }
  if (stage === "internal-only") {
    context.add("run status is internal dry-run only", run.dormantFullEventContractStatus === "dormant", run.dormantFullEventContractStatus);
    context.add("comparison is internal only", comparison.internalOnlyStatus === "internal_dry_run_only", comparison.internalOnlyStatus);
  }
  if (stage === "dormant-full-event-contract") {
    context.add("future full event contract is dormant", run.dormantFullEventContractStatus === "dormant", run.dormantFullEventContractStatus);
    writeText(`${context.dir}/no-promotion-output.txt`, "passed: promotion remains blocked.\n");
    writeText(`${context.dir}/no-manual-approval-claim-output.txt`, "passed: no manual approval claim was added.\n");
  }
  if (stage === "no-optimizer-no-recommendations") {
    context.add("no optimizer started", run.optimizerStatus === "not_started" && comparison.optimizerStatus === "not_started" && reproducibility.optimizerStatus === "not_started");
    context.add("no assignment recommendations", run.assignmentRecommendationStatus === "not_started" && comparison.assignmentRecommendationStatus === "not_started" && reproducibility.assignmentRecommendationStatus === "not_started");
    context.add("no clinical/staffing/outcome claims", run.clinicalSafetyClaim === false && run.staffingComplianceClaim === false && run.patientOutcomePredictionClaim === false && comparison.clinicalSafetyClaim === false && comparison.staffingComplianceClaim === false && comparison.patientOutcomePredictionClaim === false);
  }
}

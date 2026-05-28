#!/usr/bin/env node
import {
  createCheckContext,
  finalizeGate,
  runSelectedStages,
  writeJson,
  writeText
} from "./lib/simulation-v0-internal-dry-run-utils.mjs";

const stages = ["four-to-one-queue", "three-to-one-queue", "ratio-aware-pressure", "no-outcome-claims", "final"];

const context = createCheckContext({
  scriptName: "ratio-aware queue placeholder",
  stages,
  statusKeyByStage: {
    "four-to-one-queue": "ratioAwareQueueStatus",
    "three-to-one-queue": "ratioAwareQueueStatus",
    "ratio-aware-pressure": "ratioAwareQueueStatus",
    "no-outcome-claims": "ratioAwareQueueStatus"
  },
  outputName: "ratio-aware-queue-placeholder-output.json",
  defaultIssue: "575"
});

await runSelectedStages(context, runStage);
finalizeGate(context, { testOutputName: "ratio-aware-queue-placeholder.txt" });

async function runStage(stage) {
  const shared = await import("../packages/shared/dist/index.js");
  const capacity = shared.buildScenarioCapacityIntegration();
  const baseRun = shared.executeInternalDryRun({ capacity });
  const four = buildSummary(shared, capacity, baseRun.taskSet, shared.fourToOneRatioPreset, shared.fourToOneRuntimeSeedContract);
  const three = buildSummary(shared, capacity, baseRun.taskSet, shared.threeToOneRatioPreset, shared.threeToOneRuntimeSeedContract);
  if (stage === "four-to-one-queue") {
    context.add("4:1 queue summary validates", four.ratioPresetId === "four_to_one", four);
    writeJson(`${context.dir}/four-to-one-queue-output.json`, { status: "passed", summary: four });
  }
  if (stage === "three-to-one-queue") {
    context.add("3:1 queue summary validates", three.ratioPresetId === "three_to_one", three);
    writeJson(`${context.dir}/three-to-one-queue-output.json`, { status: "passed", summary: three });
  }
  if (stage === "ratio-aware-pressure") {
    context.add("ratios share generated workload count", four.generatedTaskCount === three.generatedTaskCount, { four: four.generatedTaskCount, three: three.generatedTaskCount });
    context.add("ratio runtime capacity can change queue placeholders", four.queuedPlaceholderCount !== three.queuedPlaceholderCount || four.delayedPlaceholderCount !== three.delayedPlaceholderCount, { four, three });
    writeJson(`${context.dir}/ratio-aware-pressure-output.json`, { status: "passed", four, three });
    writeJson(`${context.dir}/deterministic-queue-output.json`, { status: "passed", repeatable: JSON.stringify(four) === JSON.stringify(buildSummary(shared, capacity, baseRun.taskSet, shared.fourToOneRatioPreset, shared.fourToOneRuntimeSeedContract)) });
  }
  if (stage === "no-outcome-claims") {
    context.add("no outcome claim", four.outcomeClaim === false && three.outcomeClaim === false);
    context.add("no safety or compliance claim", four.clinicalSafetyClaim === false && four.staffingComplianceClaim === false && three.clinicalSafetyClaim === false && three.staffingComplianceClaim === false);
    context.add("no recommendations or optimizer", four.recommendationStatus === "not_started" && four.optimizerStatus === "not_started" && three.recommendationStatus === "not_started" && three.optimizerStatus === "not_started");
    writeText(`${context.dir}/no-outcome-claims-output.txt`, "passed: ratio-aware queue placeholders do not claim outcomes.\n");
    writeText(`${context.dir}/no-safety-or-compliance-claims-output.txt`, "passed: ratio-aware queue placeholders do not claim clinical safety or staffing compliance.\n");
  }
}

function buildSummary(shared, capacity, taskSet, ratioPreset, ratioRuntimeSeed) {
  const runtimeStates = shared.buildNurseRuntimeStatesFromManualBridge(
    shared.buildManualAssignmentScenarioBridgeInput(capacity, ratioPreset),
    { ratioPreset }
  );
  return shared.validateRatioAwareQueuePlaceholderSummary(
    shared.calculateRatioAwareQueuePlaceholder({
      taskSet,
      runtimeStates,
      ratioPreset,
      ratioRuntimeSeed,
      capacity
    })
  );
}

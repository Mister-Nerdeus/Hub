import { buildManualAssignmentScenarioBridgeInput } from "../scenarios/manualAssignmentScenarioBridge.js";
import { fourToOneRatioPreset, threeToOneRatioPreset } from "../scenarios/ratioPresetContract.js";
import { buildScenarioCapacityIntegration } from "../scenarios/scenarioCapacityIntegration.js";
import {
  FOUR_TO_ONE_RUNTIME_SEED_ID,
  THREE_TO_ONE_RUNTIME_SEED_ID,
  fourToOneRuntimeSeedContract,
  neutralWorkloadSeedContract,
  threeToOneRuntimeSeedContract
} from "./deterministicSeedContract.js";
import { executeInternalDryRun } from "./internalDryRunExecutor.js";
import { buildNurseRuntimeStatesFromManualBridge } from "./nurseRuntimeStateContract.js";
import { calculateRatioAwareQueuePlaceholder, type RatioAwareQueuePlaceholderSummary } from "./ratioAwareQueuePlaceholder.js";

export const SIMULATION_V0_COMPARISON_ARTIFACT_SCHEMA_VERSION = "1.0.0" as const;

export type SimulationV0ComparisonArtifact = {
  schemaVersion: typeof SIMULATION_V0_COMPARISON_ARTIFACT_SCHEMA_VERSION;
  artifactId: "simulation-v0-four-to-one-vs-three-to-one-comparison";
  sharedWorkload: {
    neutralWorkloadSeedId: "neutral-workload-seed-canonical-plan-1";
    activityProfileId: "typical";
    generatedTaskCount: number;
    taskInstanceIds: readonly string[];
    sameWorkloadForRatios: true;
  };
  ratioRuntime: {
    fourToOneRuntimeSeedId: "runtime-seed-canonical-plan-1-four-to-one";
    threeToOneRuntimeSeedId: "runtime-seed-canonical-plan-1-three-to-one";
    ratioSpecificRuntimeAssumptions: true;
  };
  runs: readonly [SimulationV0ComparisonRunSummary, SimulationV0ComparisonRunSummary];
  limitationCopy: readonly string[];
  internalOnlyStatus: "internal_dry_run_only";
  optimizerStatus: "not_started";
  assignmentRecommendationStatus: "not_started";
  clinicalSafetyClaim: false;
  staffingComplianceClaim: false;
  patientOutcomePredictionClaim: false;
  syntheticDataOnly: true;
};

export type SimulationV0ComparisonRunSummary = {
  ratioPresetId: "four_to_one" | "three_to_one";
  ratioLabel: "4:1" | "3:1";
  ratioRuntimeSeedId: string;
  generatedTaskCount: number;
  queuedPlaceholderCount: number;
  delayedPlaceholderCount: number;
  unassignedPlaceholderCount: number;
  syntheticNurseRuntimeGroupCount: number;
  placeholderPressureBand: RatioAwareQueuePlaceholderSummary["placeholderPressureBand"];
};

export function buildSimulationV0ComparisonArtifact(): SimulationV0ComparisonArtifact {
  const capacity = buildScenarioCapacityIntegration();
  const fourRuntimeStates = buildNurseRuntimeStatesFromManualBridge(
    buildManualAssignmentScenarioBridgeInput(capacity, fourToOneRatioPreset),
    { ratioPreset: fourToOneRatioPreset }
  );
  const threeRuntimeStates = buildNurseRuntimeStatesFromManualBridge(
    buildManualAssignmentScenarioBridgeInput(capacity, threeToOneRatioPreset),
    { ratioPreset: threeToOneRatioPreset }
  );
  const fourRun = executeInternalDryRun({
    capacity,
    ratioPreset: fourToOneRatioPreset,
    ratioRuntimeSeed: fourToOneRuntimeSeedContract,
    runtimeStates: fourRuntimeStates
  });
  const threeRun = executeInternalDryRun({
    capacity,
    ratioPreset: threeToOneRatioPreset,
    ratioRuntimeSeed: threeToOneRuntimeSeedContract,
    runtimeStates: threeRuntimeStates
  });
  const fourQueue = calculateRatioAwareQueuePlaceholder({
    taskSet: fourRun.taskSet,
    runtimeStates: fourRuntimeStates,
    ratioPreset: fourToOneRatioPreset,
    ratioRuntimeSeed: fourToOneRuntimeSeedContract,
    capacity
  });
  const threeQueue = calculateRatioAwareQueuePlaceholder({
    taskSet: threeRun.taskSet,
    runtimeStates: threeRuntimeStates,
    ratioPreset: threeToOneRatioPreset,
    ratioRuntimeSeed: threeToOneRuntimeSeedContract,
    capacity
  });
  if (JSON.stringify(fourRun.taskSet.instances) !== JSON.stringify(threeRun.taskSet.instances)) {
    throw new Error("Simulation v0 comparison requires the same neutral synthetic workload");
  }

  return {
    schemaVersion: SIMULATION_V0_COMPARISON_ARTIFACT_SCHEMA_VERSION,
    artifactId: "simulation-v0-four-to-one-vs-three-to-one-comparison",
    sharedWorkload: {
      neutralWorkloadSeedId: neutralWorkloadSeedContract.seedId,
      activityProfileId: "typical",
      generatedTaskCount: fourRun.taskSet.instances.length,
      taskInstanceIds: fourRun.taskSet.instances.map((task) => task.taskInstanceId),
      sameWorkloadForRatios: true
    },
    ratioRuntime: {
      fourToOneRuntimeSeedId: FOUR_TO_ONE_RUNTIME_SEED_ID,
      threeToOneRuntimeSeedId: THREE_TO_ONE_RUNTIME_SEED_ID,
      ratioSpecificRuntimeAssumptions: true
    },
    runs: [
      buildRunSummary("4:1", fourQueue),
      buildRunSummary("3:1", threeQueue)
    ],
    limitationCopy: [
      "Comparison artifact is an internal synthetic dry-run artifact only.",
      "Both ratios use the same neutral synthetic workload.",
      "Runtime and queue placeholders use ratio-specific assumptions.",
      "No optimizer, assignment recommendation, clinical safety score, staffing compliance certification, or patient outcome prediction is produced."
    ],
    internalOnlyStatus: "internal_dry_run_only",
    optimizerStatus: "not_started",
    assignmentRecommendationStatus: "not_started",
    clinicalSafetyClaim: false,
    staffingComplianceClaim: false,
    patientOutcomePredictionClaim: false,
    syntheticDataOnly: true
  };
}

function buildRunSummary(
  ratioLabel: "4:1" | "3:1",
  queue: RatioAwareQueuePlaceholderSummary
): SimulationV0ComparisonRunSummary {
  return {
    ratioPresetId: queue.ratioPresetId,
    ratioLabel,
    ratioRuntimeSeedId: queue.ratioRuntimeSeedId,
    generatedTaskCount: queue.generatedTaskCount,
    queuedPlaceholderCount: queue.queuedPlaceholderCount,
    delayedPlaceholderCount: queue.delayedPlaceholderCount,
    unassignedPlaceholderCount: queue.unassignedPlaceholderCount,
    syntheticNurseRuntimeGroupCount: queue.syntheticNurseRuntimeGroupCount,
    placeholderPressureBand: queue.placeholderPressureBand
  };
}

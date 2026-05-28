import {
  buildManualAssignmentScenarioBridgeInput
} from "../scenarios/manualAssignmentScenarioBridge.js";
import {
  fourToOneRatioPreset,
  threeToOneRatioPreset,
  type RatioPresetContract
} from "../scenarios/ratioPresetContract.js";
import { buildRoomLoadStarterContract } from "../scenarios/roomLoadEligibility.js";
import {
  buildScenarioCapacityIntegration,
  type ScenarioCapacityIntegration
} from "../scenarios/scenarioCapacityIntegration.js";
import { typicalActivityProfile } from "../scenarios/activityProfileContract.js";
import {
  FOUR_TO_ONE_RUNTIME_SEED_ID,
  THREE_TO_ONE_RUNTIME_SEED_ID,
  fourToOneRuntimeSeedContract,
  neutralWorkloadSeedContract,
  threeToOneRuntimeSeedContract
} from "./deterministicSeedContract.js";
import { buildDryRunQueuePlaceholder } from "./dryRunQueuePlaceholder.js";
import { buildNurseRuntimeStatesFromManualBridge } from "./nurseRuntimeStateContract.js";
import { dryRunTaskTemplates } from "./taskTemplateContract.js";
import { generateDryRunTaskInstances } from "./taskInstanceGeneration.js";

export const DRY_RUN_COMPARISON_PROOF_SCHEMA_VERSION = "1.0.0" as const;
const DRY_RUN_COMPARISON_ACTIVITY_PROFILE_ID = "typical" as const;

export type DryRunComparisonRunSummary = {
  runId: "dry-run-proof-four-to-one" | "dry-run-proof-three-to-one";
  ratioPresetId: RatioPresetContract["presetId"];
  ratioLabel: RatioPresetContract["label"];
  patientsPerNurse: RatioPresetContract["patientsPerNurse"];
  canonicalScenarioSeedId: "scenario-seed-canonical-plan-1-foundation";
  canonicalFloorplanId: "default-er-layout-plan-1";
  capacityReportReference: "docs/verification/canonical-capacity-count-report.json";
  roomLoadContractId: "room-load-starter-canonical-plan-1";
  activityProfileId: "typical";
  neutralWorkloadSeedId: "neutral-workload-seed-canonical-plan-1";
  ratioRuntimeSeedId: "runtime-seed-canonical-plan-1-four-to-one" | "runtime-seed-canonical-plan-1-three-to-one";
  taskTemplateCount: number;
  generatedTaskCount: number;
  syntheticNurseRuntimeGroupCount: number;
  queuePlaceholderCount: number;
  delayedTaskPlaceholderCount: number;
  optimizerStatus: "not_started";
  assignmentRecommendationStatus: "not_started";
  syntheticDataOnly: true;
};

export type DryRunComparisonProof = {
  schemaVersion: typeof DRY_RUN_COMPARISON_PROOF_SCHEMA_VERSION;
  proofId: "dry-run-ratio-comparison-proof-canonical-plan-1";
  sharedInputs: {
    canonicalScenarioSeedId: "scenario-seed-canonical-plan-1-foundation";
    canonicalFloorplanId: "default-er-layout-plan-1";
    capacityReportReference: "docs/verification/canonical-capacity-count-report.json";
    roomLoadContractId: "room-load-starter-canonical-plan-1";
    activityProfileId: "typical";
    neutralWorkloadSeedId: "neutral-workload-seed-canonical-plan-1";
    ratioRuntimeSeedIds: readonly [
      "runtime-seed-canonical-plan-1-four-to-one",
      "runtime-seed-canonical-plan-1-three-to-one"
    ];
    taskTemplateIds: readonly string[];
    usesCanonicalCapacityReport: true;
    usesSplitBayFixtureBridge: true;
    usesRawRoomCounts: false;
    usesStorageOrSupportForTasks: false;
    sharedWorkloadGeneration: "ratio_neutral";
  };
  runs: readonly [DryRunComparisonRunSummary, DryRunComparisonRunSummary];
  limitationCopy: readonly string[];
  dryRunStatus: "internal_dry_run_shell_only";
  optimizerStatus: "not_started";
  assignmentRecommendationStatus: "not_started";
  clinicalSafetyClaim: false;
  staffingComplianceClaim: false;
  patientOutcomeClaim: false;
  syntheticDataOnly: true;
};

export function buildDryRunComparisonProof(
  capacity: ScenarioCapacityIntegration = buildScenarioCapacityIntegration()
): DryRunComparisonProof {
  const roomLoad = buildRoomLoadStarterContract(capacity, 4);
  const taskSet = generateDryRunTaskInstances({
    roomLoad,
    activityProfile: typicalActivityProfile,
    seedContract: neutralWorkloadSeedContract,
    templates: dryRunTaskTemplates,
    capacity
  });
  const fourQueue = buildDryRunQueuePlaceholder({ taskSet, seedContract: fourToOneRuntimeSeedContract });
  const threeQueue = buildDryRunQueuePlaceholder({ taskSet, seedContract: threeToOneRuntimeSeedContract });
  return {
    schemaVersion: DRY_RUN_COMPARISON_PROOF_SCHEMA_VERSION,
    proofId: "dry-run-ratio-comparison-proof-canonical-plan-1",
    sharedInputs: {
      canonicalScenarioSeedId: roomLoad.canonicalScenarioSeedId,
      canonicalFloorplanId: capacity.canonicalFloorplanId,
      capacityReportReference: "docs/verification/canonical-capacity-count-report.json",
      roomLoadContractId: roomLoad.contractId,
      activityProfileId: DRY_RUN_COMPARISON_ACTIVITY_PROFILE_ID,
      neutralWorkloadSeedId: neutralWorkloadSeedContract.seedId,
      ratioRuntimeSeedIds: [
        FOUR_TO_ONE_RUNTIME_SEED_ID,
        THREE_TO_ONE_RUNTIME_SEED_ID
      ] as const,
      taskTemplateIds: dryRunTaskTemplates.map((template) => template.templateId),
      usesCanonicalCapacityReport: capacity.usesCanonicalCapacityReport,
      usesSplitBayFixtureBridge: capacity.usesSplitBayFixtureBridge,
      usesRawRoomCounts: false,
      usesStorageOrSupportForTasks: false,
      sharedWorkloadGeneration: "ratio_neutral"
    },
    runs: [
      buildRunSummary("dry-run-proof-four-to-one", fourToOneRatioPreset, capacity, taskSet.instances.length, fourQueue),
      buildRunSummary("dry-run-proof-three-to-one", threeToOneRatioPreset, capacity, taskSet.instances.length, threeQueue)
    ],
    limitationCopy: [
      "Internal deterministic dry-run proof shell only.",
      "Ratio presets are synthetic planning assumptions only.",
      "Queue and delayed-task counts are placeholder operational signals only."
    ],
    dryRunStatus: "internal_dry_run_shell_only",
    optimizerStatus: "not_started",
    assignmentRecommendationStatus: "not_started",
    clinicalSafetyClaim: false,
    staffingComplianceClaim: false,
    patientOutcomeClaim: false,
    syntheticDataOnly: true
  };
}

function buildRunSummary(
  runId: DryRunComparisonRunSummary["runId"],
  ratioPreset: RatioPresetContract,
  capacity: ScenarioCapacityIntegration,
  generatedTaskCount: number,
  queue: ReturnType<typeof buildDryRunQueuePlaceholder>
): DryRunComparisonRunSummary {
  const bridge = buildManualAssignmentScenarioBridgeInput(capacity, ratioPreset);
  const runtimeStates = buildNurseRuntimeStatesFromManualBridge(bridge, { ratioPreset });
  return {
    runId,
    ratioPresetId: ratioPreset.presetId,
    ratioLabel: ratioPreset.label,
    patientsPerNurse: ratioPreset.patientsPerNurse,
    canonicalScenarioSeedId: ratioPreset.canonicalScenarioSeedId,
    canonicalFloorplanId: ratioPreset.canonicalFloorplanId,
    capacityReportReference: ratioPreset.capacityReportReference,
    roomLoadContractId: "room-load-starter-canonical-plan-1",
    activityProfileId: DRY_RUN_COMPARISON_ACTIVITY_PROFILE_ID,
    neutralWorkloadSeedId: neutralWorkloadSeedContract.seedId,
    ratioRuntimeSeedId:
      ratioPreset.presetId === "four_to_one"
        ? FOUR_TO_ONE_RUNTIME_SEED_ID
        : THREE_TO_ONE_RUNTIME_SEED_ID,
    taskTemplateCount: dryRunTaskTemplates.length,
    generatedTaskCount,
    syntheticNurseRuntimeGroupCount: runtimeStates.states.length,
    queuePlaceholderCount: queue.queuedTaskIds.length,
    delayedTaskPlaceholderCount: queue.delayedTaskIds.length,
    optimizerStatus: "not_started",
    assignmentRecommendationStatus: "not_started",
    syntheticDataOnly: true
  };
}

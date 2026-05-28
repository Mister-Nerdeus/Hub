import { buildManualAssignmentScenarioBridgeInput } from "../scenarios/manualAssignmentScenarioBridge.js";
import { fourToOneRatioPreset, type RatioPresetContract } from "../scenarios/ratioPresetContract.js";
import { buildScenarioCapacityIntegration, type ScenarioCapacityIntegration } from "../scenarios/scenarioCapacityIntegration.js";
import { typicalActivityProfile, type ActivityProfileContract } from "../scenarios/activityProfileContract.js";
import {
  buildRoomLoadStarterContractFromOccupancySelection,
  selectOccupiedBedPositionsForActivityProfile
} from "./activityProfileOccupancySelection.js";
import { dryRunTimestepContract, type DryRunTimestepContract } from "./dryRunTimestepContract.js";
import {
  fourToOneRuntimeSeedContract,
  neutralWorkloadSeedContract,
  type NeutralWorkloadSeedContract,
  type RatioRuntimeSeedContract
} from "./deterministicSeedContract.js";
import { buildNurseRuntimeStatesFromManualBridge, type NurseRuntimeStateSet } from "./nurseRuntimeStateContract.js";
import { processNurseTaskPlaceholders } from "./nurseTaskProcessingLoop.js";
import { dryRunTaskTemplates, type DryRunTaskTemplateContract } from "./taskTemplateContract.js";
import { generateDryRunTaskInstances, type DryRunTaskInstanceSet } from "./taskInstanceGeneration.js";

export const INTERNAL_DRY_RUN_EXECUTOR_SCHEMA_VERSION = "1.0.0" as const;
export const INTERNAL_DRY_RUN_EVENT_LABELS = [
  "task_placeholder_ready",
  "task_placeholder_started",
  "task_placeholder_completed",
  "task_placeholder_queued",
  "task_placeholder_delayed",
  "task_placeholder_unassigned"
] as const;

export type InternalDryRunEventLabel = (typeof INTERNAL_DRY_RUN_EVENT_LABELS)[number];

export type InternalDryRunTimelineEvent = {
  eventId: string;
  eventLabel: InternalDryRunEventLabel;
  syntheticMinuteOffset: number;
  taskInstanceId: string;
  loadableBedPositionId: string;
  syntheticNurseId: string | null;
  dryRunStatus: "internal_dry_run_only";
  syntheticDataOnly: true;
};

export type InternalDryRunNurseRuntimeSnapshot = {
  syntheticMinuteOffset: number;
  syntheticNurseId: string;
  activePlaceholderTaskIds: readonly string[];
  queuedPlaceholderTaskIds: readonly string[];
  availabilityState: "available" | "busy_placeholder" | "queued_placeholder";
};

export type InternalDryRunQueueSnapshot = {
  syntheticMinuteOffset: number;
  queuedPlaceholderCount: number;
  delayedPlaceholderCount: number;
  unassignedPlaceholderCount: number;
};

export type InternalDryRunExecutorOutput = {
  schemaVersion: typeof INTERNAL_DRY_RUN_EXECUTOR_SCHEMA_VERSION;
  runId: string;
  eventArtifactId: string;
  canonicalScenarioSeedId: ScenarioCapacityIntegration["canonicalScenarioSeedId"];
  canonicalFloorplanId: ScenarioCapacityIntegration["canonicalFloorplanId"];
  activityProfileId: ActivityProfileContract["profileId"];
  ratioPresetId: RatioPresetContract["presetId"];
  neutralWorkloadSeedId: NeutralWorkloadSeedContract["seedId"];
  ratioRuntimeSeedId: RatioRuntimeSeedContract["seedId"];
  taskSet: DryRunTaskInstanceSet;
  timeline: readonly InternalDryRunTimelineEvent[];
  nurseRuntimeSnapshots: readonly InternalDryRunNurseRuntimeSnapshot[];
  queueSnapshots: readonly InternalDryRunQueueSnapshot[];
  summaryCounts: {
    generatedTaskCount: number;
    startedPlaceholderCount: number;
    completedPlaceholderCount: number;
    queuedPlaceholderCount: number;
    delayedPlaceholderCount: number;
    unassignedPlaceholderCount: number;
  };
  limitations: readonly string[];
  dormantFullEventContractStatus: "dormant";
  optimizerStatus: "not_started";
  assignmentRecommendationStatus: "not_started";
  clinicalSafetyClaim: false;
  staffingComplianceClaim: false;
  patientOutcomePredictionClaim: false;
  syntheticDataOnly: true;
};

export type ExecuteInternalDryRunInput = {
  capacity?: ScenarioCapacityIntegration;
  activityProfile?: ActivityProfileContract;
  ratioPreset?: RatioPresetContract;
  neutralWorkloadSeed?: NeutralWorkloadSeedContract;
  ratioRuntimeSeed?: RatioRuntimeSeedContract;
  timestepContract?: DryRunTimestepContract;
  templates?: readonly DryRunTaskTemplateContract[];
  runtimeStates?: NurseRuntimeStateSet;
};

export function executeInternalDryRun(input: ExecuteInternalDryRunInput = {}): InternalDryRunExecutorOutput {
  const capacity = input.capacity ?? buildScenarioCapacityIntegration();
  const activityProfile = input.activityProfile ?? typicalActivityProfile;
  const ratioPreset = input.ratioPreset ?? fourToOneRatioPreset;
  const neutralWorkloadSeed = input.neutralWorkloadSeed ?? neutralWorkloadSeedContract;
  const ratioRuntimeSeed = input.ratioRuntimeSeed ?? fourToOneRuntimeSeedContract;
  const timestep = input.timestepContract ?? dryRunTimestepContract;
  const bridge = buildManualAssignmentScenarioBridgeInput(capacity, ratioPreset);
  const runtimeStates = input.runtimeStates ?? buildNurseRuntimeStatesFromManualBridge(bridge, { ratioPreset });
  const occupancySelection = selectOccupiedBedPositionsForActivityProfile({
    capacity,
    activityProfile,
    neutralWorkloadSeed
  });
  const roomLoad = buildRoomLoadStarterContractFromOccupancySelection(capacity, occupancySelection);
  const taskSet = generateDryRunTaskInstances({
    roomLoad,
    activityProfile,
    seedContract: neutralWorkloadSeed,
    templates: input.templates ?? dryRunTaskTemplates,
    capacity
  });
  const processing = processNurseTaskPlaceholders({ taskSet, runtimeStates, capacity });
  const timeline = processing.timeline;
  const nurseRuntimeSnapshots = buildNurseSnapshots(runtimeStates, timeline);
  const queueSnapshots = buildQueueSnapshots(timestep, timeline);

  return {
    schemaVersion: INTERNAL_DRY_RUN_EXECUTOR_SCHEMA_VERSION,
    runId: `internal-dry-run-${ratioPreset.presetId}-${activityProfile.profileId}`,
    eventArtifactId: `internal-dry-run-events-${ratioPreset.presetId}-${activityProfile.profileId}`,
    canonicalScenarioSeedId: capacity.canonicalScenarioSeedId,
    canonicalFloorplanId: capacity.canonicalFloorplanId,
    activityProfileId: activityProfile.profileId,
    ratioPresetId: ratioPreset.presetId,
    neutralWorkloadSeedId: neutralWorkloadSeed.seedId,
    ratioRuntimeSeedId: ratioRuntimeSeed.seedId,
    taskSet,
    timeline,
    nurseRuntimeSnapshots,
    queueSnapshots,
    summaryCounts: {
      generatedTaskCount: taskSet.instances.length,
      startedPlaceholderCount: countEvents(timeline, "task_placeholder_started"),
      completedPlaceholderCount: countEvents(timeline, "task_placeholder_completed"),
      queuedPlaceholderCount: countEvents(timeline, "task_placeholder_queued"),
      delayedPlaceholderCount: countEvents(timeline, "task_placeholder_delayed"),
      unassignedPlaceholderCount: processing.unassignedPlaceholderTaskIds.length
    },
    limitations: [
      "Internal synthetic dry-run only.",
      "Task events are operational placeholders only.",
      "Queue and delay values are placeholder summaries only.",
      "No optimizer, assignment recommendation, clinical safety score, staffing compliance certification, or patient outcome prediction is produced."
    ],
    dormantFullEventContractStatus: "dormant",
    optimizerStatus: "not_started",
    assignmentRecommendationStatus: "not_started",
    clinicalSafetyClaim: false,
    staffingComplianceClaim: false,
    patientOutcomePredictionClaim: false,
    syntheticDataOnly: true
  };
}

function buildNurseSnapshots(
  runtimeStates: NurseRuntimeStateSet,
  timeline: readonly InternalDryRunTimelineEvent[]
): InternalDryRunNurseRuntimeSnapshot[] {
  return runtimeStates.states.map((state) => {
    const activePlaceholderTaskIds = timeline
      .filter((event) => event.syntheticNurseId === state.syntheticNurseId && event.eventLabel === "task_placeholder_started")
      .map((event) => event.taskInstanceId);
    const queuedPlaceholderTaskIds = timeline
      .filter((event) => event.syntheticNurseId === state.syntheticNurseId && event.eventLabel === "task_placeholder_queued")
      .map((event) => event.taskInstanceId);
    return {
      syntheticMinuteOffset: 0,
      syntheticNurseId: state.syntheticNurseId,
      activePlaceholderTaskIds,
      queuedPlaceholderTaskIds,
      availabilityState:
        queuedPlaceholderTaskIds.length > 0
          ? "queued_placeholder"
          : activePlaceholderTaskIds.length > 0
            ? "busy_placeholder"
            : "available"
    };
  });
}

function buildQueueSnapshots(
  timestep: DryRunTimestepContract,
  timeline: readonly InternalDryRunTimelineEvent[]
): InternalDryRunQueueSnapshot[] {
  return Array.from({ length: timestep.maxStepCount }, (_, tickIndex) => {
    const syntheticMinuteOffset = tickIndex * timestep.stepDurationMinutes;
    const throughTick = timeline.filter((event) => event.syntheticMinuteOffset <= syntheticMinuteOffset);
    return {
      syntheticMinuteOffset,
      queuedPlaceholderCount: countEvents(throughTick, "task_placeholder_queued"),
      delayedPlaceholderCount: countEvents(throughTick, "task_placeholder_delayed"),
      unassignedPlaceholderCount: countEvents(throughTick, "task_placeholder_unassigned")
    };
  });
}

function countEvents(events: readonly InternalDryRunTimelineEvent[], label: InternalDryRunEventLabel): number {
  return events.filter((event) => event.eventLabel === label).length;
}

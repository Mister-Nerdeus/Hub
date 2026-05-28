import type { ActivityProfileContract } from "../scenarios/activityProfileContract.js";
import { validateRoomLoadStarterContract } from "../scenarios/roomLoadEligibility.js";
import type { RoomLoadStarterContract } from "../scenarios/roomLoadStarterContract.js";
import type { ScenarioCapacityIntegration } from "../scenarios/scenarioCapacityIntegration.js";
import {
  createDeterministicDryRunSequence,
  createDeterministicWorkloadSequence
} from "./deterministicSequence.js";
import type {
  DeterministicDryRunSeedContract,
  NeutralWorkloadSeedContract
} from "./deterministicSeedContract.js";
import type {
  DryRunTaskIntensityBand,
  DryRunTaskTemplateContract
} from "./taskTemplateContract.js";
import { validateDryRunTaskTemplateSet } from "./taskTemplateContract.js";

export const DRY_RUN_TASK_INSTANCE_SCHEMA_VERSION = "1.0.0" as const;

export type DryRunTaskInstance = {
  taskInstanceId: string;
  loadableBedPositionId: string;
  templateId: string;
  syntheticTimestepOffsetMinutes: number;
  durationPlaceholderMinutes: number;
  intensityPlaceholder: DryRunTaskIntensityBand;
  dryRunStatus: "internal_dry_run_shell_only";
  syntheticDataOnly: true;
  clinicalClaim: false;
  outcomePredictionClaim: false;
  optimizerStatus: "not_started";
};

export type DryRunTaskInstanceSet = {
  schemaVersion: typeof DRY_RUN_TASK_INSTANCE_SCHEMA_VERSION;
  taskInstanceSetId: "dry-run-task-instances-canonical-plan-1";
  canonicalScenarioSeedId: RoomLoadStarterContract["canonicalScenarioSeedId"];
  roomLoadContractId: RoomLoadStarterContract["contractId"];
  activityProfileId: ActivityProfileContract["profileId"];
  deterministicSeedId: DeterministicDryRunSeedContract["seedId"] | NeutralWorkloadSeedContract["seedId"];
  source: "room-load starter synthetic input";
  instances: readonly DryRunTaskInstance[];
  usesRawRoomCounts: false;
  usesStorageOrSupportForTasks: false;
  syntheticDataOnly: true;
  optimizerStatus: "not_started";
};

export type GenerateDryRunTaskInstancesInput = {
  roomLoad: RoomLoadStarterContract;
  activityProfile: ActivityProfileContract;
  seedContract: DeterministicDryRunSeedContract | NeutralWorkloadSeedContract;
  templates: readonly DryRunTaskTemplateContract[];
  capacity: ScenarioCapacityIntegration;
};

export function generateDryRunTaskInstances(
  input: GenerateDryRunTaskInstancesInput
): DryRunTaskInstanceSet {
  const roomLoad = validateRoomLoadStarterContract(input.roomLoad, input.capacity);
  const templates = validateDryRunTaskTemplateSet(input.templates).filter((template) =>
    template.allowedActivityProfileIds.includes(input.activityProfile.profileId)
  );
  if (templates.length === 0) {
    throw new Error("dry-run task generation requires templates for the activity profile");
  }
  const occupiedEntries = roomLoad.entries.filter((entry) => entry.occupancyState === "occupied");
  const sequenceCount = Math.max(1, occupiedEntries.length * templates.length * 3);
  const sequence =
    "ratioPresetBinding" in input.seedContract
      ? createDeterministicWorkloadSequence(
          input.seedContract,
          `task-instance-generation:${input.activityProfile.profileId}`,
          sequenceCount
        )
      : createDeterministicDryRunSequence(
          input.seedContract,
          `task-instance-generation:${input.activityProfile.profileId}`,
          sequenceCount
        );
  let sequenceIndex = 0;
  const instances: DryRunTaskInstance[] = [];
  const templateLimit = templateLimitForProfile(input.activityProfile.taskIntensityPlaceholder);
  for (const entry of occupiedEntries) {
    const templatesForEntry = templates.slice(0, templateLimit);
    for (const [templateIndex, template] of templatesForEntry.entries()) {
      const timingValue = sequence[sequenceIndex++] ?? 0;
      const durationValue = sequence[sequenceIndex++] ?? 0;
      const minuteBucket = timingValue % 16;
      const durationRange = template.durationBand.maxMinutes - template.durationBand.minMinutes + 1;
      instances.push({
        taskInstanceId: [
          "dry-run-task",
          entry.loadableBedPositionId,
          template.templateId,
          String(templateIndex + 1).padStart(2, "0")
        ].join("-"),
        loadableBedPositionId: entry.loadableBedPositionId,
        templateId: template.templateId,
        syntheticTimestepOffsetMinutes: minuteBucket * 15,
        durationPlaceholderMinutes:
          template.durationBand.minMinutes + (durationValue % durationRange),
        intensityPlaceholder: template.intensityBand,
        dryRunStatus: "internal_dry_run_shell_only",
        syntheticDataOnly: true,
        clinicalClaim: false,
        outcomePredictionClaim: false,
        optimizerStatus: "not_started"
      });
    }
  }
  instances.sort((left, right) =>
    left.syntheticTimestepOffsetMinutes - right.syntheticTimestepOffsetMinutes ||
    left.taskInstanceId.localeCompare(right.taskInstanceId)
  );
  return {
    schemaVersion: DRY_RUN_TASK_INSTANCE_SCHEMA_VERSION,
    taskInstanceSetId: "dry-run-task-instances-canonical-plan-1",
    canonicalScenarioSeedId: roomLoad.canonicalScenarioSeedId,
    roomLoadContractId: roomLoad.contractId,
    activityProfileId: input.activityProfile.profileId,
    deterministicSeedId: input.seedContract.seedId,
    source: "room-load starter synthetic input",
    instances,
    usesRawRoomCounts: false,
    usesStorageOrSupportForTasks: false,
    syntheticDataOnly: true,
    optimizerStatus: "not_started"
  };
}

function templateLimitForProfile(intensity: ActivityProfileContract["taskIntensityPlaceholder"]): number {
  if (intensity === "low") return 1;
  if (intensity === "medium") return 2;
  return 4;
}
